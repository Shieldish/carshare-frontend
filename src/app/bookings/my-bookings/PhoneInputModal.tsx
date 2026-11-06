import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { Check, Copy, Loader2, AlertCircle } from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogBody, Button, Input, Label } from '@/app/components/ui';
import { formatNumber } from '@/lib/formatNumber';

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
  const t = useTranslations('bookings.phoneModal');
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
      toast.error(t('errors.requiredFields'));
      setError(t('errors.requiredFields'));
      return;
    }

    // Validation du code de transaction
    if (transactionRef.length < 4) {
      toast.error(t('errors.invalidTransactionCode'));
      setError(t('errors.invalidTransactionCode'));
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

  return (
    <Dialog open={isOpen} onClose={handleClose} size="md" dismissible={!isLoading}>
      <DialogHeader onClose={!isLoading ? handleClose : undefined}>
        <DialogTitle>{t('title')}</DialogTitle>
        <p className="text-muted-foreground text-sm mt-1">{t('subtitle')}</p>
      </DialogHeader>
      <DialogBody>
        {/* Étape 1 : Instructions de paiement */}
        <div className="bg-primary/5 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mr-3">
              1
            </div>
            <h3 className="text-sm font-semibold text-primary">
              {t('step1Title')}
            </h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center bg-card rounded p-2">
              <span className="text-muted-foreground">{t('numberLabel')}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-foreground">{MERCHANT_NUMBER}</span>
                <button
                  onClick={() => copyToClipboard(MERCHANT_NUMBER)}
                  className="text-primary hover:text-primary/80"
                  title={t('copyTitle')}
                >
                  {copied ? <Check className="w-4 h-4 text-green-600 dark:text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center bg-card rounded p-2">
              <span className="text-muted-foreground">{t('nameLabel')}</span>
              <span className="font-medium text-foreground">{MERCHANT_NAME}</span>
            </div>

            {/* ✅ AFFICHAGE DU MONTANT */}
            <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 rounded p-2 border border-green-200 dark:border-green-800">
              <span className="text-green-800 dark:text-green-300 font-medium">{t('amountLabel')}</span>
              <span className="font-bold text-lg text-green-700 dark:text-green-400">{formatNumber(amount)} FBu</span>
            </div>
          </div>

          <div className="mt-3 text-xs text-primary bg-primary/10 dark:bg-primary/30 rounded p-2">
            💡 <strong>{t('tip')}</strong> {t('tipText')}
          </div>
        </div>

        {/* Étape 2 : Formulaire de confirmation */}
        <form onSubmit={handleSubmit}>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                2
              </div>
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {t('step2Title')}
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <Label>{t('yourNumberLabel')}</Label>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isLoading}
                  placeholder={t('yourNumberPlaceholder')}
                  required
                />
              </div>

              <div>
                <Label>
                  {t('transactionCodeLabel')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value.toUpperCase())}
                  disabled={isLoading}
                  placeholder={t('transactionCodePlaceholder')}
                  required
                  className="font-mono uppercase placeholder:normal-case placeholder:font-sans"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  📱 {t('transactionCodeHint')}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 mb-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-destructive mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading} className="flex-1">
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading || !phoneNumber.trim() || !transactionRef.trim()} className="flex-1">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-5 w-5" />}
              {isLoading ? t('verifying') : t('paidButton')}
            </Button>
          </div>
        </form>

        {/* Info opérateurs */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-2">{t('operatorsSupported')}</p>
          <div className="flex gap-3">
            <div className="flex items-center text-xs text-foreground">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              Lumicash
            </div>
            <div className="flex items-center text-xs text-foreground">
              <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
              Ecocash
            </div>
          </div>
        </div>
      </DialogBody>
    </Dialog>
  );
};

export default PhoneInputModal;