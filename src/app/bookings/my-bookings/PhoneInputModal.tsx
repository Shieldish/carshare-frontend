import React, { useState } from 'react';

interface MobileMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (phoneNumber: string, transactionRef: string) => void;
  isLoading: boolean;
  amount: number; // ✅ CRUCIAL : Montant à afficher
}

const PhoneInputModal: React.FC<MobileMoneyModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading,
  amount
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // ✅ À CONFIGURER : Vos coordonnées de paiement
  const MERCHANT_NUMBER = "79 123 456";
  const MERCHANT_NAME = "CarShare Burundi";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim() || !transactionRef.trim()) {
      setError('Tous les champs sont obligatoires');
      return;
    }
    
    // Validation du code de transaction
    if (transactionRef.length < 4) {
      setError("Le code de transaction semble invalide (minimum 4 caractères)");
      return;
    }
    
    setError('');
    onSubmit(phoneNumber, transactionRef);
  };

  const handleClose = React.useCallback(() => {
    if (!isLoading) {
      setPhoneNumber('');
      setTransactionRef('');
      setError('');
      onClose();
    }
  }, [isLoading, onClose]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isLoading, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-black transition-opacity duration-300"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        onClick={!isLoading ? handleClose : undefined}
      ></div>

      {/* Contenu modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Paiement Mobile Money
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Suivez les instructions ci-dessous
            </p>
          </div>
          {!isLoading && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              ×
            </button>
          )}
        </div>

        {/* Étape 1 : Instructions de paiement */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
              1
            </div>
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300">
              Envoyez l&apos;argent via Mobile Money
            </h3>
          </div>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 rounded p-2">
              <span className="text-gray-600 dark:text-gray-400">Numéro :</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-gray-900 dark:text-gray-100">{MERCHANT_NUMBER}</span>
                <button
                  onClick={() => copyToClipboard(MERCHANT_NUMBER)}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  title="Copier"
                >
                  {copied ? (
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 rounded p-2">
              <span className="text-gray-600 dark:text-gray-400">Nom :</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{MERCHANT_NAME}</span>
            </div>
            
            {/* ✅ AFFICHAGE DU MONTANT */}
            <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 rounded p-2 border border-green-200 dark:border-green-800">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Montant :</span>
              <span className="font-bold text-lg text-green-700 dark:text-green-400">{amount.toLocaleString()} FBu</span>
            </div>
          </div>

          <div className="mt-3 text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded p-2">
            💡 <strong>Astuce :</strong> Après l&apos;envoi, vous recevrez un SMS avec un code de transaction. Notez-le bien !
          </div>
        </div>

        {/* Étape 2 : Formulaire de confirmation */}
        <form onSubmit={handleSubmit}>
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                2
              </div>
              <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                Confirmez votre paiement
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Votre numéro (envoyeur)
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isLoading}
                  placeholder="Ex: +257 79 123 456"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Code de transaction <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value.toUpperCase())}
                  disabled={isLoading}
                  placeholder="Ex: LUMI8H3K9L2 ou ECO456789"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all font-mono uppercase placeholder:normal-case placeholder:font-sans"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  📱 C&apos;est le code reçu par SMS après votre envoi Mobile Money
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4 flex items-start">
              <svg className="w-5 h-5 text-red-500 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || !phoneNumber.trim() || !transactionRef.trim()}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 dark:disabled:bg-green-800 disabled:cursor-not-allowed flex items-center justify-center transition-colors font-medium shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Vérification...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  J&apos;ai payé
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info opérateurs */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Opérateurs supportés :</p>
          <div className="flex gap-3">
            <div className="flex items-center text-xs text-gray-700 dark:text-gray-300">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              Lumicash
            </div>
            <div className="flex items-center text-xs text-gray-700 dark:text-gray-300">
              <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
              Ecocash
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhoneInputModal;