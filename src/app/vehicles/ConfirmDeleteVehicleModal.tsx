// ConfirmDeleteVehicleModal.tsx
import React from 'react';
import { useTranslations } from 'next-intl';
import { ConfirmDialog } from '@/app/components/ui';

interface ConfirmDeleteVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  vehicleName: string;
  isLoading?: boolean;
}

/**
 * Bâti sur le `Dialog`/`ConfirmDialog` partagé — remplace une modale maison
 * sans aucune variante `dark:` (même bug que LoginForm.tsx à l'étape 1) et
 * sans piège à focus ni fermeture au clic extérieur cohérente.
 */
const ConfirmDeleteVehicleModal: React.FC<ConfirmDeleteVehicleModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  vehicleName,
  isLoading = false,
}) => {
  const t = useTranslations('vehicles.deleteModal');

  return (
    <ConfirmDialog
      open={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={t('title')}
      message={
        <>
          {t('confirmText', { name: vehicleName })}
          <span className="mt-2 block text-destructive">{t('warningText')}</span>
        </>
      }
      confirmLabel={isLoading ? t('deleting') : t('confirm')}
      cancelLabel={t('cancel')}
      tone="destructive"
      loading={isLoading}
    />
  );
};

export default ConfirmDeleteVehicleModal;
