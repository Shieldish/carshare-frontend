'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/apiClient';
import { Loader2 } from 'lucide-react';
import ProtectedImage from '@/app/components/ProtectedImage';

interface UserVerificationModalProps {
  user: {
    id: number;
    firstName?: string;
    lastName?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserVerificationModal({ user, isOpen, onClose, onSuccess }: UserVerificationModalProps) {
  const t = useTranslations('admin.verificationModal');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async (status: 'VERIFIED' | 'REJECTED' | 'ADDITIONAL_INFO_REQUIRED') => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await apiClient.put(`/api/admin/users/${user.id}/verification`, {
        isIdentityVerified: status === 'VERIFIED',
        isDrivingLicenseVerified: status === 'VERIFIED',
        isSelfieVerified: status === 'VERIFIED',
        adminNotes,
      });
      onSuccess();
      onClose();
    } catch {
      alert(t('genericError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('title', { name: `${user.firstName} ${user.lastName}` })}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        {/* Documents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DocumentCard
              title={t('identityDoc')}
              userId={user.id}
              docType="identity"
            />
            <DocumentCard
              title={t('licenseDoc')}
              userId={user.id}
              docType="license"
            />
            <DocumentCard
              title={t('selfieDoc')}
              userId={user.id}
              docType="selfie"
            />
          </div>

          {/* Zone de décision */}
          <div className="bg-gray-50 dark:bg-gray-800/30 p-6 rounded-xl border dark:border-gray-800">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('notesLabel')}
            </label>
            <textarea
              className="w-full p-4 rounded-lg border dark:bg-gray-900 dark:text-white dark:border-gray-700 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
              rows={3}
              placeholder={t('notesPlaceholder')}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t dark:border-gray-800 flex flex-wrap gap-4 justify-end bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-medium"
          >
            {t('cancel')}
          </button>
          <button
            onClick={() => handleAction('REJECTED')}
            className="px-6 py-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-100 font-medium border border-red-200 dark:border-red-800"
          >
            {t('reject')}
          </button>
          <button
            onClick={() => handleAction('VERIFIED')}
            disabled={isSubmitting}
            className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold shadow-lg shadow-green-900/20 disabled:opacity-50 flex items-center justify-center"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t('approveAll')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sous-composant : carte d'un document
// ---------------------------------------------------------------------------
function DocumentCard({ title, userId, docType }: { title: string; userId: number; docType: 'identity' | 'license' | 'selfie' }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
        {title}
      </h3>

      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 overflow-hidden">
        
        {/* ProtectedImage gère tout : l'affichage, le survol, et la Lightbox au clic ! */}
        <ProtectedImage userId={userId} docType={docType} alt={title} fill />

      </div>
    </div>
  );
}