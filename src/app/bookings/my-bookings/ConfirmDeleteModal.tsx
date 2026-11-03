import React from 'react';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@/app/components/ui';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  vehicleName: string;
  isLoading?: boolean;
}

/**
 * Bâti sur le `ConfirmDialog` partagé — remplace une modale maison sans
 * aucune variante `dark:` (identique au bug de LoginForm.tsx à l'étape 1).
 */
const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  vehicleName,
  isLoading = false,
}) => {
  const t = useTranslations('bookings.deleteModal');

  return (
    <ConfirmDialog
      open={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={t('title')}
      message={
        <>
          {t('confirmTextPrefix')} <span className="font-semibold text-foreground">{vehicleName}</span> ?
          <span className="mt-2 block text-destructive">{t('irreversible')}</span>
        </>
      }
      confirmLabel={isLoading ? t('deleting') : t('confirm')}
      cancelLabel={t('cancel')}
      tone="destructive"
      loading={isLoading}
    />
  );
};

export default ConfirmDeleteModal;
