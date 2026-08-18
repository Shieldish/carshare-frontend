// src/app/admin/users/page.tsx
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  UserCog,
  Search,
  Filter,
  ExternalLink,
  Ban,
  PlayCircle,
  ShieldAlert,
  Crown,
  ShieldCheck,
  X,
  FileX
} from 'lucide-react';
import type { UpdateVerificationStatusDto } from '@/types/admin';

// ✅ TYPE USER COMPLET
type User = {
  id: number;
  sub: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  role: 'USER' | 'ADMIN' | 'OWNER';
  companyName?: string;
  isIdentityVerified?: boolean;
  isDrivingLicenseVerified?: boolean;
  isSelfieVerified?: boolean;
  identityDocumentUrl?: string;
  drivingLicenseUrl?: string;
  selfieUrl?: string;
  isActive?: boolean;
  isPremium?: boolean;
  premiumEndDate?: string;
  lastLoginAt?: string;
};

// ---------------------------------------------------------------------------
// 🔒 NOUVEAU COMPOSANT : Lightbox Sécurisée pour le tableau
// ---------------------------------------------------------------------------
const SecureLightbox = ({ userId, docType, title, onClose }: { userId: number, docType: string, title: string, onClose: () => void }) => {
  const t = useTranslations('admin.users');
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    const fetchImage = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        if (!token) throw new Error("Non authentifié");

        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/document/${docType}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("Erreur de récupération");

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setImgSrc(objectUrl);
      } catch (err) {
        console.error(err);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchImage();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [userId, docType]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-8 animate-in fade-in zoom-in-95 duration-200" onClick={onClose}>
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-green-400" />
          <div>
            <h3 className="text-white font-semibold text-lg leading-tight">{title}</h3>
            <p className="text-green-400/80 text-xs uppercase tracking-wider font-bold">{t('lightbox.secureDisplay')}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/25 rounded-full text-white transition-all pointer-events-auto" title={t('lightbox.close')}>
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {isLoading && <Loader2 className="w-12 h-12 animate-spin text-orange-500" />}
        {hasError && (
          <div className="flex flex-col items-center gap-4 text-gray-400">
            <FileX className="w-16 h-16 opacity-50" />
            <p>{t('lightbox.documentError')}</p>
          </div>
        )}
        {!isLoading && !hasError && imgSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgSrc} alt={t('lightbox.alt')} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl ring-1 ring-white/10" />
        )}
      </div>
    </div>
  );
};

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const colors = {
    ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    OWNER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    USER: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[role as keyof typeof colors] || colors.USER}`}>
      {role}
    </span>
  );
};

const VerificationStatus: React.FC<{
  userId: number;
  type: 'identity' | 'license' | 'selfie';
  isVerified: boolean;
  isUpdating: boolean;
  documentUrl?: string;
  onVerify: () => void;
  onView: () => void; // 👈 Nouvelle prop pour déclencher la Lightbox
}> = ({ isVerified, isUpdating, documentUrl, onVerify, onView }) => {
  const t = useTranslations('admin.users');

  if (isVerified) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
        <span className="text-sm font-medium text-green-700 dark:text-green-300">{t('verification.verified')}</span>
      </div>
    );
  }

  if (documentUrl) {
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={onView}
          className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors"
        >
          <ExternalLink className="w-3 h-3" /> {t('verification.view')}
        </button>
        <button
          onClick={onVerify}
          disabled={isUpdating}
          className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUpdating ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3 h-3" />
          )}
          {t('verification.approve')}
        </button>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
      <XCircle className="w-3 h-3" /> {t('verification.pending')}
    </span>
  );
};

const UserRow: React.FC<{
  user: User;
  onStatusChange: (userId: number, status: UpdateVerificationStatusDto) => Promise<void>;
  onToggleStatus: (userId: number, activate: boolean) => Promise<void>;
  onExtendPremium: (userId: number) => Promise<void>;
  onViewDocument: (userId: number, docType: 'identity' | 'license' | 'selfie', title: string) => void;
}> = ({ user, onStatusChange, onToggleStatus, onExtendPremium, onViewDocument }) => {
  const t = useTranslations('admin.users');
  const [isUpdatingIdentity, setIsUpdatingIdentity] = useState(false);
  const [isUpdatingLicense, setIsUpdatingLicense] = useState(false);
  const [isUpdatingSelfie, setIsUpdatingSelfie] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [docToVerify, setDocToVerify] = useState<'identity' | 'license' | 'selfie' | null>(null);
  const [actionToConfirm, setActionToConfirm] = useState<'suspend' | 'activate' | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isExtendingPremium, setIsExtendingPremium] = useState(false);
  const [premiumSuccess, setPremiumSuccess] = useState<string | null>(null);

  const executeVerify = async (type: 'identity' | 'license' | 'selfie') => {
    setDocToVerify(null);
    setError(null);

    if (type === 'identity' && user.isIdentityVerified) return;
    if (type === 'license' && user.isDrivingLicenseVerified) return;
    if (type === 'selfie' && user.isSelfieVerified) return;

    const updateData: UpdateVerificationStatusDto = {};
    if (type === 'identity') { setIsUpdatingIdentity(true); updateData.isIdentityVerified = true; }
    else if (type === 'license') { setIsUpdatingLicense(true); updateData.isDrivingLicenseVerified = true; }
    else if (type === 'selfie') { setIsUpdatingSelfie(true); updateData.isSelfieVerified = true; }

    try {
      await onStatusChange(user.id, updateData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('verification.genericError'));
      setTimeout(() => setError(null), 5000);
    } finally {
      if (type === 'identity') setIsUpdatingIdentity(false);
      else if (type === 'license') setIsUpdatingLicense(false);
      else if (type === 'selfie') setIsUpdatingSelfie(false);
    }
  };

  const executeToggleStatus = async () => {
    if (!actionToConfirm) return;
    setIsToggling(true);
    setError(null);
    try {
      await onToggleStatus(user.id, actionToConfirm === 'activate');
      setActionToConfirm(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('toggleStatusModal.genericError'));
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsToggling(false);
    }
  };

  const executeExtendPremium = async () => {
    setIsExtendingPremium(true);
    setPremiumSuccess(null);
    setError(null);
    try {
      await onExtendPremium(user.id);
      setPremiumSuccess(t('premiumModal.successMessage'));
      setTimeout(() => {
        setPremiumSuccess(null);
        setShowPremiumModal(false);
      }, 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('premiumModal.genericError'));
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsExtendingPremium(false);
    }
  };

  const isSuspended = user.isActive === false;

  const premiumEndFormatted = user.premiumEndDate
    ? new Date(user.premiumEndDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  return (
    <tr className={`hover:bg-muted/30 transition-colors border-b border-border last:border-0 ${isSuspended ? 'bg-red-50/50 dark:bg-red-900/10 opacity-75' : ''}`}>
      <td className="px-6 py-4">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isSuspended ? 'bg-red-100' : 'bg-primary/10'}`}>
            <span className={`text-sm font-semibold ${isSuspended ? 'text-red-600' : 'text-primary'}`}>
              {user.firstName?.[0]}{user.lastName?.[0]}
            </span>
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground flex items-center gap-2">
              {user.firstName} {user.lastName}
              {user.isPremium && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-[10px] font-bold uppercase tracking-wider">
                  <Crown className="w-3 h-3" /> {t('premiumBadge')}
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">{user.email || user.sub}</div>
            {isSuspended && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-[10px] font-bold uppercase tracking-wider">
                <Ban className="w-3 h-3" /> {t('suspendedBadge')}
              </span>
            )}
            {user.isPremium && premiumEndFormatted && (
              <div className="text-[10px] text-yellow-600 dark:text-yellow-400 mt-0.5">
                {t('expiresOn', { date: premiumEndFormatted })}
              </div>
            )}
            {user.companyName && (
              <div className="text-xs text-muted-foreground mt-0.5">🏢 {user.companyName}</div>
            )}
          </div>
        </div>
      </td>

      <td className="px-6 py-4 text-center">
        <RoleBadge role={user.role} />
      </td>

      <td className="px-6 py-4 align-top">
        <VerificationStatus 
          userId={user.id} 
          type="identity" 
          isVerified={user.isIdentityVerified || false} 
          isUpdating={isUpdatingIdentity} 
          documentUrl={user.identityDocumentUrl} 
          onVerify={() => setDocToVerify('identity')}
          onView={() => onViewDocument(user.id, 'identity', t('lightbox.identityTitle', { name: `${user.firstName} ${user.lastName}` }))}
        />
      </td>
      <td className="px-6 py-4 align-top">
        <VerificationStatus 
          userId={user.id} 
          type="license" 
          isVerified={user.isDrivingLicenseVerified || false} 
          isUpdating={isUpdatingLicense} 
          documentUrl={user.drivingLicenseUrl} 
          onVerify={() => setDocToVerify('license')}
          onView={() => onViewDocument(user.id, 'license', t('lightbox.licenseTitle', { name: `${user.firstName} ${user.lastName}` }))}
        />
      </td>
      <td className="px-6 py-4 align-top">
        <VerificationStatus 
          userId={user.id} 
          type="selfie" 
          isVerified={user.isSelfieVerified || false} 
          isUpdating={isUpdatingSelfie} 
          documentUrl={user.selfieUrl} 
          onVerify={() => setDocToVerify('selfie')}
          onView={() => onViewDocument(user.id, 'selfie', t('lightbox.selfieTitle', { name: `${user.firstName} ${user.lastName}` }))}
        />
      </td>

      <td className="px-6 py-4 text-sm text-muted-foreground relative">
        {user.phoneNumber || <span className="text-muted-foreground/50">{t('notProvided')}</span>}

        {/* MODALE DE VÉRIFICATION DOCUMENT */}
        {docToVerify && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('confirmDocModal.title')}</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">{t('confirmDocModal.message')}</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDocToVerify(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">{t('confirmDocModal.cancel')}</button>
                <button onClick={() => executeVerify(docToVerify)} className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {t('confirmDocModal.approve')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODALE POUR SUSPENDRE / RÉACTIVER */}
        {actionToConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${actionToConfirm === 'suspend' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                  {actionToConfirm === 'suspend' ? <ShieldAlert className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {actionToConfirm === 'suspend' ? t('toggleStatusModal.suspendTitle') : t('toggleStatusModal.activateTitle')}
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
                {actionToConfirm === 'suspend'
                  ? t('toggleStatusModal.suspendMessage')
                  : t('toggleStatusModal.activateMessage')}
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setActionToConfirm(null)} disabled={isToggling} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">{t('toggleStatusModal.cancel')}</button>
                <button onClick={executeToggleStatus} disabled={isToggling} className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 ${actionToConfirm === 'suspend' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                  {isToggling ? <Loader2 className="w-4 h-4 animate-spin" /> : (actionToConfirm === 'suspend' ? <Ban className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />)}
                  {actionToConfirm === 'suspend' ? t('toggleStatusModal.confirmSuspend') : t('toggleStatusModal.confirmActivate')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODALE PREMIUM */}
        {showPremiumModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
                  <Crown className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('premiumModal.title')}</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                {t('premiumModal.introPrefix')} <strong>{t('premiumModal.introHighlight')}</strong> {t('premiumModal.introSuffix')}
              </p>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
                {user.firstName} {user.lastName}
              </p>
              {user.isPremium && premiumEndFormatted && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-4">
                  {t('premiumModal.activeUntilPrefix')} {premiumEndFormatted}{t('premiumModal.activeUntilSuffix')}
                </p>
              )}
              {!user.isPremium && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  {t('premiumModal.noActiveSubscription')}
                </p>
              )}
              {premiumSuccess && (
                <div className="mb-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {premiumSuccess}
                </div>
              )}
              {error && (
                <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setShowPremiumModal(false); setPremiumSuccess(null); }}
                  disabled={isExtendingPremium}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
                >
                  {t('premiumModal.cancel')}
                </button>
                <button
                  onClick={executeExtendPremium}
                  disabled={isExtendingPremium || !!premiumSuccess}
                  className="px-4 py-2 text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExtendingPremium ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                  {isExtendingPremium ? t('premiumModal.confirming') : t('premiumModal.confirm')}
                </button>
              </div>
            </div>
          </div>
        )}
      </td>

      <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
        {user.lastLoginAt
          ? new Date(user.lastLoginAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
          : <span className="text-muted-foreground/50">{t('neverLoggedIn')}</span>}
      </td>

      <td className="px-6 py-4 text-center">
        <div className="flex items-center justify-center gap-2">
          {!isSuspended ? (
            <button
              onClick={() => setActionToConfirm('suspend')}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title={t('actionTitles.suspend')}
            >
              <Ban className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setActionToConfirm('activate')}
              className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
              title={t('actionTitles.activate')}
            >
              <PlayCircle className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => setShowPremiumModal(true)}
            className="p-2 text-yellow-500 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg transition-colors"
            title={t('actionTitles.premium')}
          >
            <Crown className="w-5 h-5" />
          </button>
        </div>
      </td>

      {error && !showPremiumModal && (
        <td colSpan={7} className="px-6 py-2 absolute">
          <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-md">
            <AlertCircle className="w-4 h-4" />{error}
          </div>
        </td>
      )}
    </tr>
  );
};

function AdminUsersContent() {
  const t = useTranslations('admin.users');
  const router = useRouter();
  const { user: adminUser, isLoading: isAuthLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterVerification, setFilterVerification] = useState<string>('ALL');
  const [filterAccountStatus, setFilterAccountStatus] = useState<string>('ALL');

  // L'état qui contrôle quelle image est actuellement ouverte dans la Lightbox
  const [viewingDoc, setViewingDoc] = useState<{ userId: number; type: 'identity' | 'license' | 'selfie'; title: string } | null>(null);

  useEffect(() => {
    if (!isAuthLoading && (!adminUser || adminUser.role !== 'ADMIN')) {
      setError(t('accessDeniedMessage'));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminUser, isAuthLoading]);

  const fetchUsers = useCallback(async () => {
    if (!adminUser || adminUser.role !== 'ADMIN') return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getAllUsersAdmin();
      const formattedUsers = (data as User[]).map((u) => ({
        ...u,
        isIdentityVerified: u.isIdentityVerified ?? false,
        isDrivingLicenseVerified: u.isDrivingLicenseVerified ?? false,
        isSelfieVerified: u.isSelfieVerified ?? false,
        isActive: u.isActive !== undefined ? u.isActive : true,
        isPremium: u.isPremium ?? false,
        premiumEndDate: u.premiumEndDate,
      }));
      setUsers(formattedUsers || []);
      setFilteredUsers(formattedUsers || []);
    } catch (err: unknown) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : t('loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [adminUser]);

  useEffect(() => {
    if (!isAuthLoading) fetchUsers();
  }, [isAuthLoading, fetchUsers]);

  useEffect(() => {
    let result = [...users];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(u =>
        u.firstName?.toLowerCase().includes(term) ||
        u.lastName?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
      );
    }
    if (filterRole !== 'ALL') result = result.filter(u => u.role === filterRole);
    if (filterAccountStatus === 'ACTIVE') result = result.filter(u => u.isActive !== false);
    if (filterAccountStatus === 'SUSPENDED') result = result.filter(u => u.isActive === false);
    if (filterVerification === 'VERIFIED') {
      result = result.filter(u => u.isIdentityVerified && u.isDrivingLicenseVerified && u.isSelfieVerified);
    } else if (filterVerification === 'PARTIAL') {
      result = result.filter(u =>
        (u.isIdentityVerified || u.isDrivingLicenseVerified || u.isSelfieVerified) &&
        !(u.isIdentityVerified && u.isDrivingLicenseVerified && u.isSelfieVerified)
      );
    } else if (filterVerification === 'UNVERIFIED') {
      result = result.filter(u => !u.isIdentityVerified && !u.isDrivingLicenseVerified && !u.isSelfieVerified);
    }
    setFilteredUsers(result);
  }, [searchTerm, filterRole, filterVerification, filterAccountStatus, users]);

  const handleVerificationChange = async (userId: number, statusUpdate: UpdateVerificationStatusDto) => {
    try {
      await apiClient.updateUserVerificationStatus(userId, statusUpdate);
      setUsers(prev => prev.map(u => u.id === userId ? {
        ...u,
        isIdentityVerified: statusUpdate.isIdentityVerified !== undefined ? statusUpdate.isIdentityVerified : u.isIdentityVerified,
        isDrivingLicenseVerified: statusUpdate.isDrivingLicenseVerified !== undefined ? statusUpdate.isDrivingLicenseVerified : u.isDrivingLicenseVerified,
        isSelfieVerified: statusUpdate.isSelfieVerified !== undefined ? statusUpdate.isSelfieVerified : u.isSelfieVerified,
      } : u));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleToggleStatus = async (userId: number, activate: boolean) => {
    try {
      await apiClient.put(`/api/admin/users/${userId}/toggle-status?activate=${activate}`, {});
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: activate } : u));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleExtendPremium = async (userId: number) => {
    await apiClient.extendUserPremium(userId, 1);
    // ✅ On ne recharge que cet utilisateur (pas tout le tableau) pour éviter un
    // flash de chargement complet pour une seule ligne modifiée.
    try {
      const updated = await apiClient.get(`/api/users/${userId}`);
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...updated } : u)));
      setFilteredUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...updated } : u)));
    } catch {
      // Repli sûr : si le refetch ciblé échoue, on recharge tout le tableau plutôt
      // que de laisser l'affichage désynchronisé du vrai statut premium.
      await fetchUsers();
    }
  };

  const stats = {
    total: users.length,
    fullyVerified: users.filter(u => u.isIdentityVerified && u.isDrivingLicenseVerified && u.isSelfieVerified).length,
    suspended: users.filter(u => u.isActive === false).length,
    unverified: users.filter(u => !u.isIdentityVerified && !u.isDrivingLicenseVerified && !u.isSelfieVerified).length,
    premium: users.filter(u => u.isPremium).length,
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!adminUser || adminUser.role !== 'ADMIN') {
    return (
      <div className="container mx-auto p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">{t('accessDeniedTitle')}</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Affichage de la Lightbox si un document est sélectionné */}
      {viewingDoc && (
        <SecureLightbox 
          userId={viewingDoc.userId} 
          docType={viewingDoc.type} 
          title={viewingDoc.title}
          onClose={() => setViewingDoc(null)} 
        />
      )}

      <div className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto max-w-7xl px-6 py-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <UserCog className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t('pageTitle')}</h1>
                <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
              </div>
            </div>
            <button onClick={() => router.back()} className="inline-flex items-center px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors border border-border rounded-lg hover:border-primary group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> {t('back')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-600 font-medium">{t('stats.total')}</div>
              <div className="text-2xl font-bold text-blue-900 mt-1">{stats.total}</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200">
              <div className="text-sm text-green-600 font-medium">{t('stats.fullyVerified')}</div>
              <div className="text-2xl font-bold text-green-900 mt-1">{stats.fullyVerified}</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200">
              <div className="text-sm text-orange-600 font-medium">{t('stats.unverified')}</div>
              <div className="text-2xl font-bold text-orange-900 mt-1">{stats.unverified}</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200">
              <div className="text-sm text-red-600 font-medium">{t('stats.suspended')}</div>
              <div className="text-2xl font-bold text-red-900 mt-1">{stats.suspended}</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200">
              <div className="text-sm text-yellow-600 font-medium flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" /> {t('stats.premium')}
              </div>
              <div className="text-2xl font-bold text-yellow-900 mt-1">{stats.premium}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl py-8 px-6">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">{t('errorTitle')}</h3>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="bg-card rounded-lg shadow-sm border border-border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder={t('searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary" />
            </div>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground">
              <option value="ALL">{t('roleFilter.all')}</option>
              <option value="USER">{t('roleFilter.user')}</option>
              <option value="OWNER">{t('roleFilter.owner')}</option>
              <option value="ADMIN">{t('roleFilter.admin')}</option>
            </select>
            <select value={filterVerification} onChange={(e) => setFilterVerification(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground">
              <option value="ALL">{t('verificationFilter.all')}</option>
              <option value="VERIFIED">{t('verificationFilter.verified')}</option>
              <option value="PARTIAL">{t('verificationFilter.partial')}</option>
              <option value="UNVERIFIED">{t('verificationFilter.unverified')}</option>
            </select>
            <select value={filterAccountStatus} onChange={(e) => setFilterAccountStatus(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground">
              <option value="ALL">{t('accountStatusFilter.all')}</option>
              <option value="ACTIVE">{t('accountStatusFilter.active')}</option>
              <option value="SUSPENDED">{t('accountStatusFilter.suspended')}</option>
            </select>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase">{t('columns.user')}</th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-foreground uppercase">{t('columns.role')}</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase">{t('columns.identity')}</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase">{t('columns.license')}</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase">{t('columns.selfie')}</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase">{t('columns.phone')}</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase">{t('columns.lastLogin')}</th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-foreground uppercase">{t('columns.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-card">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <UserRow
                      key={user.id}
                      user={user}
                      onStatusChange={handleVerificationChange}
                      onToggleStatus={handleToggleStatus}
                      onExtendPremium={handleExtendPremium}
                      onViewDocument={(userId, docType, title) => setViewingDoc({ userId, type: docType, title })} // On passe l'ordre d'ouvrir la Lightbox
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">{t('noUsersFound')}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
      <AdminUsersContent />
    </Suspense>
  );
}