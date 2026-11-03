// ConfirmDeleteAccountModal.tsx
import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogBody, DialogFooter, Button, Input } from '@/app/components/ui';

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
    if (!isOpen) setTypedEmail('');
  }, [isOpen]);

  const canConfirm = typedEmail.trim().toLowerCase() === userEmail.trim().toLowerCase();

  return (
    <Dialog open={isOpen} onClose={onClose} size="sm" dismissible={!isLoading}>
      <DialogBody className="pt-6">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full">
          <Trash2 className="w-8 h-8 text-destructive" />
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-foreground mb-2">{t('title')}</h2>
          <p className="text-muted-foreground text-sm">{t('description')}</p>
          <ul className="text-left text-sm text-muted-foreground mt-4 space-y-1.5 bg-muted/50 rounded-lg p-4">
            <li>• {t('point1')}</li>
            <li>• {t('point2')}</li>
            <li>• {t('point3')}</li>
          </ul>
          <p className="text-sm text-destructive mt-3 font-medium">{t('irreversible')}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {t('confirmPrompt', { email: userEmail })}
          </label>
          <Input
            type="text"
            value={typedEmail}
            onChange={(e) => setTypedEmail(e.target.value)}
            disabled={isLoading}
            placeholder={userEmail}
            autoComplete="off"
            className="focus-visible:ring-destructive"
          />
        </div>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="flex-1">
          {t('cancel')}
        </Button>
        <Button variant="destructive" onClick={onConfirm} disabled={isLoading || !canConfirm} className="flex-1">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('confirm')}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default ConfirmDeleteAccountModal;
