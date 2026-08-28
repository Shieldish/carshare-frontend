// ConfirmDeleteAccountModal.tsx
import React, { useState } from 'react';
import { useTranslations } from 'next-intl';

interface ConfirmDeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userEmail: string;
  isLoading?: boolean;
}

const ConfirmDeleteAccountModal: React.FC<ConfirmDeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userEmail,
  isLoading = false,
}) => {
  const t = useTranslations('profile.deleteAccountModal');
  const [typedEmail, setTypedEmail] = useState('');

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isLoading, onClose]);

  React.useEffect(() => {
    if (!isOpen) setTypedEmail('');
  }, [isOpen]);

  if (!isOpen) return null;

  const canConfirm = typedEmail.trim().toLowerCase() === userEmail.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black transition-opacity duration-300"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        onClick={!isLoading ? onClose : undefined}
      />

      <div className="relative bg-card rounded-xl p-6 w-full max-w-md shadow-2xl transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2">{t('title')}</h2>
          <p className="text-muted-foreground text-sm">{t('description')}</p>
          <ul className="text-left text-sm text-muted-foreground mt-4 space-y-1.5 bg-muted/50 rounded-lg p-4">
            <li>• {t('point1')}</li>
            <li>• {t('point2')}</li>
            <li>• {t('point3')}</li>
          </ul>
          <p className="text-sm text-red-600 dark:text-red-400 mt-3 font-medium">{t('irreversible')}</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('confirmPrompt', { email: userEmail })}
          </label>
          <input
            type="text"
            value={typedEmail}
            onChange={(e) => setTypedEmail(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-2.5 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:opacity-50"
            placeholder={userEmail}
            autoComplete="off"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-border text-foreground rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || !canConfirm}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900/40 disabled:cursor-not-allowed flex items-center justify-center transition-colors font-medium"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                {t('deleting')}
              </>
            ) : (
              t('confirm')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteAccountModal;
