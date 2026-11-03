// src/app/admin/users/page.tsx
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import AdminPagination from '../components/AdminPagination';
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
import {
  Badge,
  Button,
  Input,
  StatCard,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  ConfirmDialog,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  type BadgeVariant,
} from '@/app/components/ui';

const ITEMS_PER_PAGE = 10;

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

const ROLE_BADGE: Record<string, BadgeVariant> = {
  ADMIN: 'purple',
  OWNER: 'info',
  USER: 'neutral',
};

const RoleBadge: React.FC<{ role: string }> = ({ role }) => (
  <Badge variant={ROLE_BADGE[role] ?? 'neutral'}>{role}</Badge>
);

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
      <Badge variant="success" className="px-3 py-2">
        <CheckCircle2 className="w-4 h-4" />
        {t('verification.verified')}
      </Badge>
    );
  }

  if (documentUrl) {
    return (
      <div className="flex flex-col gap-2">
        <Button variant="outline" size="sm" onClick={onView} className="!text-primary !border-primary/20 hover:!bg-primary/10">
          <ExternalLink className="w-3 h-3" /> {t('verification.view')}
        </Button>
        <Button size="sm" onClick={onVerify} disabled={isUpdating} className="!bg-amber-500 hover:!bg-amber-600 dark:!bg-amber-600 dark:hover:!bg-amber-500">
          {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
          {t('verification.approve')}
        </Button>
      </div>
    );
  }

  return (
    <Badge variant="neutral">
      <XCircle className="w-3 h-3" /> {t('verification.pending')}
    </Badge>
  );
};

const UserRow: React.FC<{
  user: User;
  onStatusChange: (userId: number, status: UpdateVerificationStatusDto) => Promise<void>;
  onToggleStatus: (userId: number, activate: boolean) => Promise<void>;
  onExtendPremium: (userId: number) => Promise<void>;
  onViewDocument: (userId: number, docType: 'identity' | 'license' | 'selfie', title: string) => void;
  isHighlighted?: boolean;
}> = ({ user, onStatusChange, onToggleStatus, onExtendPremium, onViewDocument, isHighlighted }) => {
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
    <tr
      id={`user-${user.id}`}
      className={`hover:bg-muted/30 transition-all duration-700 border-b border-border last:border-0 ${isSuspended ? 'bg-red-50/50 dark:bg-red-900/10 opacity-75' : ''} ${isHighlighted ? 'bg-primary/10 dark:bg-primary/20 ring-2 ring-inset ring-primary' : ''}`}
    >
      <td className="px-6 py-4">
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${isSuspended ? 'bg-red-100 dark:bg-red-900/30' : 'bg-primary/10'}`}>
            <span className={`text-sm font-semibold ${isSuspended ? 'text-red-600 dark:text-red-400' : 'text-primary'}`}>
              {user.firstName?.[0]}{user.lastName?.[0]}
            </span>
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground flex items-center gap-2">
              {user.firstName} {user.lastName}
              {user.isPremium && (
                <Badge variant="warning" className="text-[10px]">
                  <Crown className="w-3 h-3" /> {t('premiumBadge')}
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">{user.email || user.sub}</div>
            {isSuspended && (
              <Badge variant="destructive" className="mt-1 text-[10px]">
                <Ban className="w-3 h-3" /> {t('suspendedBadge')}
              </Badge>
            )}
            {user.isPremium && premiumEndFormatted && (
              <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
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
        <ConfirmDialog
          open={!!docToVerify}
          onClose={() => setDocToVerify(null)}
          onConfirm={() => docToVerify && executeVerify(docToVerify)}
          title={t('confirmDocModal.title')}
          message={t('confirmDocModal.message')}
          confirmLabel={t('confirmDocModal.approve')}
          cancelLabel={t('confirmDocModal.cancel')}
          tone="primary"
        />

        {/* MODALE POUR SUSPENDRE / RÉACTIVER */}
        <ConfirmDialog
          open={!!actionToConfirm}
          onClose={() => setActionToConfirm(null)}
          onConfirm={executeToggleStatus}
          title={actionToConfirm === 'suspend' ? t('toggleStatusModal.suspendTitle') : t('toggleStatusModal.activateTitle')}
          message={actionToConfirm === 'suspend' ? t('toggleStatusModal.suspendMessage') : t('toggleStatusModal.activateMessage')}
          confirmLabel={actionToConfirm === 'suspend' ? t('toggleStatusModal.confirmSuspend') : t('toggleStatusModal.confirmActivate')}
          cancelLabel={t('toggleStatusModal.cancel')}
          tone={actionToConfirm === 'suspend' ? 'destructive' : 'success'}
          loading={isToggling}
        />

        {/* MODALE PREMIUM */}
        <Dialog open={showPremiumModal} onClose={() => { setShowPremiumModal(false); setPremiumSuccess(null); }} size="sm">
          <DialogHeader onClose={() => { setShowPremiumModal(false); setPremiumSuccess(null); }}>
            <DialogTitle className="flex items-center gap-3">
              <Crown className="text-amber-500" /> {t('premiumModal.title')}
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="pt-4">
            <p className="text-muted-foreground text-sm mb-2">
              {t('premiumModal.introPrefix')} <strong>{t('premiumModal.introHighlight')}</strong> {t('premiumModal.introSuffix')}
            </p>
            <p className="text-sm font-semibold text-foreground mb-2">
              {user.firstName} {user.lastName}
            </p>
            {user.isPremium && premiumEndFormatted && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">
                {t('premiumModal.activeUntilPrefix')} {premiumEndFormatted}{t('premiumModal.activeUntilSuffix')}
              </p>
            )}
            {!user.isPremium && (
              <p className="text-xs text-muted-foreground mb-4">
                {t('premiumModal.noActiveSubscription')}
              </p>
            )}
            {premiumSuccess && (
              <div className="mb-4 flex items-center gap-2 text-sm rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {premiumSuccess}
              </div>
            )}
            {error && (
              <div className="mb-4 flex items-center gap-2 text-sm rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-destructive">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowPremiumModal(false); setPremiumSuccess(null); }}
              disabled={isExtendingPremium}
            >
              {t('premiumModal.cancel')}
            </Button>
            <Button
              onClick={executeExtendPremium}
              disabled={isExtendingPremium || !!premiumSuccess}
              className="!bg-amber-500 hover:!bg-amber-600 dark:!bg-amber-600 dark:hover:!bg-amber-500"
            >
              {isExtendingPremium ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
              {isExtendingPremium ? t('premiumModal.confirming') : t('premiumModal.confirm')}
            </Button>
          </DialogFooter>
        </Dialog>
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
              className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title={t('actionTitles.suspend')}
            >
              <Ban className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setActionToConfirm('activate')}
              className="p-2.5 text-green-500 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
              title={t('actionTitles.activate')}
            >
              <PlayCircle className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => setShowPremiumModal(true)}
            className="p-2.5 text-yellow-500 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg transition-colors"
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
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const { user: adminUser, isLoading: isAuthLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedUserId, setHighlightedUserId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole, filterVerification, filterAccountStatus]);

  // Arrivée depuis une notification admin "documents de vérification soumis" (?highlight=<userId>) :
  // on saute sur la page où se trouve la ligne concernée, on y scrolle et on la met en évidence.
  useEffect(() => {
    if (highlightId && filteredUsers.length > 0) {
      setHighlightedUserId(highlightId);

      const targetIndex = filteredUsers.findIndex(u => u.id.toString() === highlightId);
      if (targetIndex !== -1) {
        setCurrentPage(Math.floor(targetIndex / ITEMS_PER_PAGE) + 1);
      }

      const scrollTimer = setTimeout(() => {
        const element = document.getElementById(`user-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);

      const removeHighlightTimer = setTimeout(() => {
        setHighlightedUserId(null);
        const url = new URL(window.location.href);
        url.searchParams.delete('highlight');
        window.history.replaceState({}, '', url.toString());
      }, 5000);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(removeHighlightTimer);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightId, filteredUsers]);

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

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
      <div className="container mx-auto p-4 sm:p-6 md:p-8 text-center">
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
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <UserCog className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('pageTitle')}</h1>
                <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => router.back()} className="group">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> {t('back')}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <StatCard icon={UserCog} label={t('stats.total')} value={stats.total} tone="info" />
            <StatCard icon={CheckCircle2} label={t('stats.fullyVerified')} value={stats.fullyVerified} tone="success" />
            <StatCard icon={XCircle} label={t('stats.unverified')} value={stats.unverified} tone="warning" />
            <StatCard icon={Ban} label={t('stats.suspended')} value={stats.suspended} tone="destructive" />
            <StatCard icon={Crown} label={t('stats.premium')} value={stats.premium} tone="accent" />
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl p-4 sm:p-6 md:p-8">
        {error && (
          <div className="mb-6 rounded-r-lg border-l-4 border-destructive bg-destructive/10 p-4 shadow-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-destructive">{t('errorTitle')}</h3>
              <p className="text-sm text-destructive/90 mt-1">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-destructive hover:text-destructive/80 transition-colors">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="bg-card rounded-lg shadow-sm border border-border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <Input type="text" placeholder={t('searchPlaceholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
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

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t('columns.user')}</TableHead>
              <TableHead className="text-center">{t('columns.role')}</TableHead>
              <TableHead>{t('columns.identity')}</TableHead>
              <TableHead>{t('columns.license')}</TableHead>
              <TableHead>{t('columns.selfie')}</TableHead>
              <TableHead>{t('columns.phone')}</TableHead>
              <TableHead>{t('columns.lastLogin')}</TableHead>
              <TableHead className="text-center">{t('columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              paginatedUsers.map(user => (
                <UserRow
                  key={user.id}
                  user={user}
                  onStatusChange={handleVerificationChange}
                  onToggleStatus={handleToggleStatus}
                  onExtendPremium={handleExtendPremium}
                  onViewDocument={(userId, docType, title) => setViewingDoc({ userId, type: docType, title })} // On passe l'ordre d'ouvrir la Lightbox
                  isHighlighted={highlightedUserId === user.id.toString()}
                />
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="text-center py-12">
                  <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">{t('noUsersFound')}</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          previousLabel={t('pagePrevious')}
          nextLabel={t('pageNext')}
          pageLabel={t('pageOf', { current: currentPage, total: totalPages })}
        />
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