'use client';

import React, { useState } from 'react';
import { X, Loader2, Smartphone, CreditCard } from 'lucide-react';

export type PaymentProvider = 'LUMICASH' | 'IHELA' | 'ENOTI' | 'STRIPE_VISA' | 'STRIPE_MASTERCARD' | null;

interface UnifiedPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency?: string;
  isLoading?: boolean;
  // Fonction appelée pour les paiements locaux (Lumicash, iHela, Enoti)
  onLocalPaymentSubmit: (provider: string, phoneNumber: string, paymentCode: string) => void;
  // Fonction appelée pour les paiements internationaux (Stripe)
  onStripePaymentSubmit: () => void;
}

export default function UnifiedPaymentModal({
  isOpen,
  onClose,
  amount,
  currency = 'FBu',
  isLoading = false,
  onLocalPaymentSubmit,
  onStripePaymentSubmit,
}: UnifiedPaymentModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentCode, setPaymentCode] = useState('');

  if (!isOpen) return null;

  const handleProviderSelect = (provider: PaymentProvider) => {
    setSelectedProvider(provider);
    setPhoneNumber('');
    setPaymentCode('');

    // Si c'est Visa ou Mastercard, on déclenche directement Stripe
    if (provider === 'STRIPE_VISA' || provider === 'STRIPE_MASTERCARD') {
      onStripePaymentSubmit();
    }
  };

  const handleSubmitLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProvider && phoneNumber && paymentCode) {
      onLocalPaymentSubmit(selectedProvider, phoneNumber, paymentCode);
    }
  };

  const isLocalProvider =
    selectedProvider === 'LUMICASH' ||
    selectedProvider === 'IHELA' ||
    selectedProvider === 'ENOTI';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-between items-center border-b dark:border-gray-600">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Méthode de paiement</h2>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Montant à payer :{' '}
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {amount.toLocaleString()} {currency}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">

          {/* Section 1 : Paiements Locaux */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center">
              <Smartphone size={16} className="mr-2" />
              Paiements Locaux
            </h3>
            <div className="grid grid-cols-3 gap-3">

              {/* iHela */}
              <button
                onClick={() => handleProviderSelect('IHELA')}
                className={`border-2 rounded-lg p-2 flex flex-col items-center justify-center transition-all ${
                  selectedProvider === 'IHELA'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-400'
                }`}
              >
                <div className="h-12 w-full bg-gray-100 dark:bg-gray-700 rounded mb-2 flex items-center justify-center font-bold text-gray-800 dark:text-white">
                  iHela
                </div>
              </button>

              {/* Lumicash */}
              <button
                onClick={() => handleProviderSelect('LUMICASH')}
                className={`border-2 rounded-lg p-2 flex flex-col items-center justify-center transition-all ${
                  selectedProvider === 'LUMICASH'
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-yellow-400'
                }`}
              >
                <div className="h-12 w-full bg-yellow-400 rounded mb-2 flex items-center justify-center font-bold text-black">
                  Lumicash
                </div>
              </button>

              {/* Bancobu Enoti */}
              <button
                onClick={() => handleProviderSelect('ENOTI')}
                className={`border-2 rounded-lg p-2 flex flex-col items-center justify-center transition-all ${
                  selectedProvider === 'ENOTI'
                    ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-green-400'
                }`}
              >
                <div className="h-12 w-full bg-green-600 rounded mb-2 flex items-center justify-center font-bold text-white text-xs text-center leading-tight">
                  Bancobu<br />Enoti
                </div>
              </button>
            </div>
          </div>

          {/* Formulaire dynamique pour les paiements locaux */}
          {isLocalProvider && (
            <form
              onSubmit={handleSubmitLocal}
              className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-8 border border-gray-200 dark:border-gray-600"
            >
              <h4 className="font-bold text-gray-800 dark:text-white mb-4">
                Informations {selectedProvider}
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Numéro de téléphone
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Ex: 79 12 34 56"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Code de paiement généré
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentCode}
                    onChange={(e) => setPaymentCode(e.target.value)}
                    placeholder="Code reçu via *163# (ex: 123456)"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Générez ce code depuis votre téléphone avant de valider.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !phoneNumber || !paymentCode}
                  className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 flex justify-center items-center"
                >
                  {isLoading && <Loader2 className="animate-spin mr-2" size={20} />}
                  {isLoading ? 'Traitement en cours...' : 'Confirmer le paiement'}
                </button>
              </div>
            </form>
          )}

          {/* Section 2 : Cartes Bancaires */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center">
              <CreditCard size={16} className="mr-2" />
              Cartes Bancaires (International)
            </h3>
            <div className="grid grid-cols-2 gap-4">

              {/* Visa */}
              <button
                onClick={() => handleProviderSelect('STRIPE_VISA')}
                disabled={isLoading}
                className="border-2 border-gray-200 dark:border-gray-600 rounded-lg p-2 hover:border-blue-600 transition-colors flex flex-col items-center justify-center disabled:opacity-50"
              >
                <div className="h-16 w-full bg-blue-900 rounded mb-2 flex items-center justify-center font-bold text-white text-xl italic">
                  VISA
                </div>
              </button>

              {/* MasterCard */}
              <button
                onClick={() => handleProviderSelect('STRIPE_MASTERCARD')}
                disabled={isLoading}
                className="border-2 border-gray-200 dark:border-gray-600 rounded-lg p-2 hover:border-red-500 transition-colors flex flex-col items-center justify-center disabled:opacity-50"
              >
                <div className="h-16 w-full bg-gray-100 dark:bg-gray-700 rounded mb-2 flex items-center justify-center gap-1">
                  <div className="w-8 h-8 rounded-full bg-red-500 opacity-80"></div>
                  <div className="w-8 h-8 rounded-full bg-yellow-500 opacity-80 -ml-4"></div>
                </div>
              </button>
            </div>

            {isLoading &&
              (selectedProvider === 'STRIPE_VISA' || selectedProvider === 'STRIPE_MASTERCARD') && (
                <p className="text-center text-sm text-blue-600 mt-4 animate-pulse">
                  Redirection vers la plateforme sécurisée...
                </p>
              )}
          </div>

        </div>
      </div>
    </div>
  );
}