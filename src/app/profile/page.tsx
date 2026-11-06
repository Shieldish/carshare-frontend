'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/apiClient';
import { BadgeCheck, BadgeAlert, User, Mail, Phone, Building2, Shield, AlertTriangle, CheckCircle, XCircle, Edit2, Save, X, Camera, Upload, Lock, Crown, Loader2, Trash2, Download } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import UnifiedPaymentModal from '@/app/components/payment/UnifiedPaymentModal';
import ConfirmDeleteAccountModal from './ConfirmDeleteAccountModal';
import { Dialog, DialogHeader, DialogTitle, DialogBody, Button, Badge, type BadgeVariant } from '@/app/components/ui';
import { cn } from '@/lib/cn';

type VerificationStatus = 'verified' | 'pending' | 'none';

function getVerificationStatus(isVerified?: boolean, documentUrl?: string): VerificationStatus {
  if (isVerified) return 'verified';
  if (documentUrl) return 'pending';
  return 'none';
}

const VERIFICATION_TONE: Record<VerificationStatus, { panel: string; badge: BadgeVariant; icon: 'check' | 'alert'; iconClass: string }> = {
  verified: {
    panel: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
    badge: 'success',
    icon: 'check',
    iconClass: 'text-green-600 dark:text-green-400',
  },
  pending: {
    panel: 'bg-primary/10 dark:bg-primary/20 border-primary/20 dark:border-primary/30',
    badge: 'primary',
    icon: 'alert',
    iconClass: 'text-primary',
  },
  none: {
    panel: 'bg-muted border-border',
    badge: 'neutral',
    icon: 'alert',
    iconClass: 'text-muted-foreground',
  },
};

// ✅ Unifie les 3 blocs identité/permis/selfie, qui recalculaient chacun leur
// propre bordure/fond/badge à partir du même triplet verified/pending/none
// (avec des gris bruts sans variante dark: par endroits). Le contenu
// d'upload (propre à chaque document) reste passé en `children`.
function VerificationItemCard({
  label,
  status,
  statusLabel,
  children,
}: {
  label: string;
  status: VerificationStatus;
  statusLabel: string;
  children?: React.ReactNode;
}) {
  const tone = VERIFICATION_TONE[status];
  const Icon = tone.icon === 'check' ? BadgeCheck : BadgeAlert;
  return (
    <div className={cn('p-3 rounded-lg border', tone.panel)}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={cn('w-5 h-5', tone.iconClass)} />
            <span className="font-medium text-sm text-foreground">{label}</span>
          </div>
          <Badge variant={tone.badge}>{statusLabel}</Badge>
        </div>
        {status !== 'verified' && children}
      </div>
    </div>
  );
}

type UserFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  bio?: string;
};

// ✅ Bio publique (page hôte /hosts/{id}) — limite alignée sur la contrainte backend (max 500).
const MAX_BIO_LENGTH = 500;

// ✅ COMPOSANT : La fenêtre de la Webcam
function WebcamModal({ onCapture, onClose, isProfilePicture = false }: { onCapture: (file: File) => void, onClose: () => void, isProfilePicture?: boolean }) {
  const t = useTranslations('profile.webcam');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
      .then((mediaStream) => {
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      })
      .catch((err) => {
        console.error("Erreur webcam:", err);
        setError(t('cameraError'));
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTakeSnapshot = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const prefix = isProfilePicture ? 'profile' : 'selfie';
            const file = new File([blob], `${prefix}-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(file);
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  return (
    <Dialog open onClose={onClose} size="md">
      <DialogHeader onClose={onClose} className="bg-muted/50 border-b border-border">
        <DialogTitle className="flex items-center gap-2 text-lg">
          <Camera className="w-5 h-5" /> {t('liveCaptureTitle')}
        </DialogTitle>
      </DialogHeader>

      <DialogBody className="flex flex-col items-center">
        {error ? (
          <div className="text-destructive bg-destructive/10 p-4 rounded-lg text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : (
          <div className={cn('relative bg-black overflow-hidden border-2 border-border shadow-inner', isProfilePicture ? 'w-64 h-64 rounded-full' : 'w-full aspect-video rounded-lg')}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />

            {!isProfilePicture && (
              <div className="absolute inset-0 pointer-events-none border-4 border-white/20 rounded-lg">
                <div className="w-32 h-40 border-2 border-dashed border-white/50 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
              </div>
            )}
          </div>
        )}

        <p className="text-sm text-center text-muted-foreground mt-4">
          {isProfilePicture
            ? t('profileHint')
            : t('documentHint')}
        </p>

        <div className="mt-6 flex gap-4 w-full">
          <Button variant="outline" onClick={onClose} className="flex-1">
            {t('cancel')}
          </Button>
          <Button onClick={handleTakeSnapshot} disabled={!!error || !stream} className="flex-1">
            <Camera className="w-5 h-5" /> {t('capture')}
          </Button>
        </div>
      </DialogBody>
    </Dialog>
  );
}

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================

export default function ProfilePage() {
  const t = useTranslations('profile');
  const locale = useLocale();
  const router = useRouter();
  const { user, isLoading: isAuthLoading, refreshUser, logout } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [kycConsentGiven, setKycConsentGiven] = useState(false);

  const [showWebcamModal, setShowWebcamModal] = useState(false);
  const [showProfileWebcamModal, setShowProfileWebcamModal] = useState(false);

  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);

  // ✅ NOUVEAUX ÉTATS POUR L'ABONNEMENT PREMIUM
  const [premiumStep, setPremiumStep] = useState<'NONE' | 'SELECT_DURATION' | 'PAYMENT' | 'SUCCESS'>('NONE');
  const [premiumDuration, setPremiumDuration] = useState<1 | 12>(1);
  const [premiumPaymentData, setPremiumPaymentData] = useState<{paymentId: string; amount: number; currency: string} | null>(null);
  const [isPremiumLoading, setIsPremiumLoading] = useState(false);

  // ✅ MÉMOIRE FRONTEND : Pour l'abandon de panier
  const [savedPendingPayment, setSavedPendingPayment] = useState<{paymentId: string; amount: number; currency: string} | null>(null);

  useEffect(() => {
    // Au chargement de la page, on vérifie si l'utilisateur avait commencé un paiement
    const saved = localStorage.getItem('pendingPremiumPayment');
    if (saved) {
      setSavedPendingPayment(JSON.parse(saved));
    }
  }, []);

  const [editFormData, setEditFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    bio: '',
  });

  useEffect(() => {
    if (user) {
      setEditFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || user.sub || '',
        phoneNumber: user.phoneNumber || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError(null);
    setSuccessMessage(null);
    if (user) {
      setEditFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || user.sub || '',
        phoneNumber: user.phoneNumber || '',
        bio: user.bio || '',
      });
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await apiClient.put('/api/users/me', editFormData);
      await refreshUser();

      setIsEditing(false);
      setSuccessMessage(t('toasts.profileUpdated'));
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('toasts.updateError');
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const processProfilePictureUpload = async (file: File) => {
    setIsUploadingImage(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      await apiClient.upload('/api/users/me/profile-picture', formData);
      await refreshUser();
      setSuccessMessage(t('toasts.photoUpdated'));
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('toasts.photoUploadError');
      setError(errorMessage);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processProfilePictureUpload(file);
    }
  };

  const processDocumentUpload = async (file: File, docType: 'IDENTITY' | 'DRIVING_LICENSE' | 'SELFIE') => {
    setUploadingDocType(docType);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', docType);

    try {
      await apiClient.upload('/api/users/me/documents', formData);
      await refreshUser();

      let docName = t('toasts.docNameDefault');
      if (docType === 'IDENTITY') docName = t('toasts.docNameIdentity');
      else if (docType === 'DRIVING_LICENSE') docName = t('toasts.docNameLicense');
      else if (docType === 'SELFIE') docName = t('toasts.docNameSelfie');

      setSuccessMessage([t('toasts.documentSentPrefix'), docName, t('toasts.documentSentSuffix')].filter(Boolean).join(' '));
      setTimeout(() => setSuccessMessage(null), 8000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('toasts.documentUploadError');
      setError(errorMessage);
    } finally {
      setUploadingDocType(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>, docType: 'IDENTITY' | 'DRIVING_LICENSE' | 'SELFIE') => {
    const file = e.target.files?.[0];
    if (file) {
      processDocumentUpload(file, docType);
    }
  };

  // ✅ DROIT À L'EFFACEMENT : suppression du compte (anonymisation côté serveur, voir
  // UserService.deleteUser), puis déconnexion locale et retour à l'accueil.
  const handleDeleteAccount = async () => {
    if (!user) return;
    setIsDeletingAccount(true);
    setError(null);
    try {
      await apiClient.delete(`/api/users/${user.id}`);
      setShowDeleteAccountModal(false);
      await logout();
      router.push('/');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('deleteAccountModal.genericError');
      setError(errorMessage);
      setIsDeletingAccount(false);
    }
  };

  // ✅ DROIT À LA PORTABILITÉ : télécharge un export PDF lisible des données
  // personnelles (profil, réservations, véhicules possédés, avis) depuis
  // GET /api/users/me/export — le backend renvoie du JSON structuré, mis en
  // forme ici en PDF pour rester exploitable par quelqu'un de non technique.
  const handleExportData = async () => {
    setIsExportingData(true);
    setError(null);
    try {
      const data = await apiClient.get('/api/users/me/export');
      const { generateDataExportPdf } = await import('@/lib/exportPdf');
      generateDataExportPdf(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('exportData.genericError');
      setError(errorMessage);
    } finally {
      setIsExportingData(false);
    }
  };

  // ✅ INITIER LE PAIEMENT PREMIUM
  const handleInitiatePremium = async () => {
    setIsPremiumLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/users/me/premium/initiate', {
        durationInMonths: premiumDuration
      });

      const paymentData = {
        paymentId: response.paymentId,
        amount: response.amount,
        currency: response.currency || 'USD'
      };

      setPremiumPaymentData(paymentData);
      // ✅ NOUVEAU : On sauvegarde dans le navigateur (anti-abandon de panier)
      localStorage.setItem('pendingPremiumPayment', JSON.stringify(paymentData));

      setPremiumStep('PAYMENT');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('toasts.premiumInitError'));
    } finally {
      setIsPremiumLoading(false);
    }
  };

  // ✅ PAIEMENT MOBILE MONEY PREMIUM
  const handlePremiumLocalPayment = async (provider: string, phoneNumber: string, paymentCode: string) => {
    if (!premiumPaymentData) return;
    setIsPremiumLoading(true);
    setError(null);
    try {
      await apiClient.post('/api/payments/pay/mobile-money', {
        paymentId: premiumPaymentData.paymentId,
        phoneNumber,
        transactionReference: paymentCode,
      });
      await refreshUser();
      // ✅ NOUVEAU : On efface la mémoire d'abandon de panier après un succès mobile
      localStorage.removeItem('pendingPremiumPayment');
      setSavedPendingPayment(null);
      setPremiumStep('SUCCESS');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('toasts.mobilePaymentError'));
    } finally {
      setIsPremiumLoading(false);
    }
  };

  // ✅ PAIEMENT STRIPE PREMIUM
  const handlePremiumStripePayment = async () => {
    if (!premiumPaymentData) return;
    setIsPremiumLoading(true);
    setError(null);
    try {
      const response = await apiClient.post(`/api/payments/${premiumPaymentData.paymentId}/initiate-online-payment`, {});
      if (response.redirectUrl) {
        // Le paiement Stripe quitte la page : payment/callback lit cette valeur pour savoir
        // qu'il s'agissait de Premium et rediriger au bon endroit au retour.
        sessionStorage.setItem('paymentSource', 'premium');
        window.location.href = response.redirectUrl;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('toasts.stripeError');
      // Le paiement sauvegardé en local (anti-abandon de panier) n'existe plus côté serveur
      // (ex: base de données réinitialisée depuis) : la bannière "reprendre" ne pourra plus
      // jamais aboutir, donc on nettoie l'état local plutôt que de laisser un bouton mort.
      if (message === 'Paiement non trouvé') {
        localStorage.removeItem('pendingPremiumPayment');
        setSavedPendingPayment(null);
        setPremiumStep('NONE');
        setPremiumPaymentData(null);
        setError(t('toasts.stalePendingPayment'));
      } else {
        setError(message);
      }
      setIsPremiumLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-primary/5 dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-foreground">{t('loadingProfile')}</p>
        </div>
      </div>
    );
  }

  if (!user && !isAuthLoading) {
    return (
      <div className="min-h-screen bg-primary/5 dark:bg-background flex items-center justify-center">
        <div className="text-center bg-card p-8 rounded-2xl shadow-xl">
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <p className="text-xl text-destructive font-semibold">
            {t('mustLoginMessage')}
          </p>
          <Button onClick={() => router.push('/login')} className="mt-6">
            {t('loginButton')}
          </Button>
        </div>
      </div>
    );
  }

  const isFullyVerified = user?.isIdentityVerified && user?.isDrivingLicenseVerified && user?.isSelfieVerified;
  const isPartiallyVerified = user?.isIdentityVerified || user?.isDrivingLicenseVerified || user?.isSelfieVerified;

  return (
    <div className="min-h-screen bg-primary/5 dark:bg-background py-8 px-4">
      {/* Modal Webcam pour le Selfie KYC */}
      {showWebcamModal && (
        <WebcamModal 
          onClose={() => setShowWebcamModal(false)}
          onCapture={(file) => {
            setShowWebcamModal(false);
            processDocumentUpload(file, 'SELFIE');
          }}
        />
      )}

      {/* Modal Webcam pour la Photo de Profil */}
      {showProfileWebcamModal && (
        <WebcamModal 
          isProfilePicture={true}
          onClose={() => setShowProfileWebcamModal(false)}
          onCapture={(file) => {
            setShowProfileWebcamModal(false);
            processProfilePictureUpload(file);
          }}
        />
      )}

      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
              <User className="w-10 h-10 text-primary" />
              {t('title')}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('subtitle')}
            </p>
          </div>
          {!isEditing && (
            <Button onClick={handleEditClick}>
              <Edit2 className="w-4 h-4" />
              {t('editButton')}
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 mb-6 rounded-r-lg shadow-md" role="alert">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-bold">{t('errorTitle')}</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 text-green-700 dark:text-green-400 p-4 mb-6 rounded-r-lg shadow-md" role="alert">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-bold">{t('successTitle')}</p>
                <p className="text-sm">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className={`p-6 rounded-2xl shadow-lg border-2 transition-all ${
              isFullyVerified
                ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                : isPartiallyVerified
                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500'
                : 'bg-red-50 dark:bg-red-900/20 border-red-500'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <Shield className={`w-8 h-8 ${
                  isFullyVerified
                    ? 'text-green-600 dark:text-green-400'
                    : isPartiallyVerified
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-red-600 dark:text-red-400'
                }`} />
                <div>
                  <h3 className="font-bold text-lg text-foreground">{t('verification.statusTitle')}</h3>
                  <p className={`text-sm font-medium ${
                    isFullyVerified
                      ? 'text-green-600 dark:text-green-400'
                      : isPartiallyVerified
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {isFullyVerified
                      ? t('verification.fullyVerified')
                      : isPartiallyVerified
                      ? t('verification.partiallyVerified')
                      : t('verification.notVerified')}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                {!isFullyVerified && (
                  <label className="flex items-start gap-2 p-3 rounded-lg border border-border bg-muted/40 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={kycConsentGiven}
                      onChange={(e) => setKycConsentGiven(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0"
                    />
                    <span className="text-xs text-muted-foreground">{t('verification.consentLabel')}</span>
                  </label>
                )}

                {/* BLOC PIÈCE D'IDENTITÉ */}
                <VerificationItemCard
                  label={t('verification.identityLabel')}
                  status={getVerificationStatus(user?.isIdentityVerified, user?.identityDocumentUrl)}
                  statusLabel={
                    user?.isIdentityVerified
                      ? t('verification.statusVerified')
                      : user?.identityDocumentUrl
                      ? t('verification.statusPendingReview')
                      : t('verification.statusNotSent')
                  }
                >
                  <div className="mt-2">
                    <label className={cn('flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-md border border-dashed border-border hover:bg-muted cursor-pointer transition-colors', uploadingDocType === 'IDENTITY' && 'opacity-50 cursor-wait')}>
                      <Upload className="w-4 h-4" />
                      {uploadingDocType === 'IDENTITY'
                        ? t('verification.uploading')
                        : user?.identityDocumentUrl
                          ? t('verification.replaceIdentity')
                          : t('verification.uploadIdentity')}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleFileInputChange(e, 'IDENTITY')}
                        disabled={uploadingDocType !== null || !kycConsentGiven}
                      />
                    </label>
                    <p className="text-[10px] text-center text-muted-foreground mt-1 flex items-center justify-center">
                      <Lock className="w-3 h-3 mr-1" /> {t('verification.secureTransfer')}
                    </p>
                  </div>
                </VerificationItemCard>

                {/* BLOC PERMIS DE CONDUIRE */}
                <VerificationItemCard
                  label={t('verification.licenseLabel')}
                  status={getVerificationStatus(user?.isDrivingLicenseVerified, user?.drivingLicenseUrl)}
                  statusLabel={
                    user?.isDrivingLicenseVerified
                      ? t('verification.statusVerified')
                      : user?.drivingLicenseUrl
                      ? t('verification.statusPendingReview')
                      : t('verification.statusNotSent')
                  }
                >
                  <div className="mt-2">
                    <label className={cn('flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-md border border-dashed border-border hover:bg-muted cursor-pointer transition-colors', uploadingDocType === 'DRIVING_LICENSE' && 'opacity-50 cursor-wait')}>
                      <Upload className="w-4 h-4" />
                      {uploadingDocType === 'DRIVING_LICENSE'
                        ? t('verification.uploading')
                        : user?.drivingLicenseUrl
                          ? t('verification.replaceLicense')
                          : t('verification.uploadLicense')}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleFileInputChange(e, 'DRIVING_LICENSE')}
                        disabled={uploadingDocType !== null || !kycConsentGiven}
                      />
                    </label>
                    <p className="text-[10px] text-center text-muted-foreground mt-1 flex items-center justify-center">
                      <Lock className="w-3 h-3 mr-1" /> {t('verification.secureTransfer')}
                    </p>
                  </div>
                </VerificationItemCard>

                {/* BLOC SELFIE AVEC WEBCAM INTÉGRÉE */}
                <VerificationItemCard
                  label={t('verification.selfieLabel')}
                  status={getVerificationStatus(user?.isSelfieVerified, user?.selfieUrl)}
                  statusLabel={
                    user?.isSelfieVerified
                      ? t('verification.statusVerified')
                      : user?.selfieUrl
                      ? t('verification.statusPendingReview')
                      : t('verification.statusNotSent')
                  }
                >
                  <div className="mt-2">
                    <div className="mb-3 text-center bg-muted/50 p-3 rounded-md border border-border">
                      <p className="text-xs font-medium text-foreground mb-1">
                        {t('verification.selfieHintTitle')}
                      </p>
                      <p className="text-[11px] text-primary/80">
                        {t('verification.selfieHintText')}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setShowWebcamModal(true)}
                        disabled={uploadingDocType !== null || !kycConsentGiven}
                        className={cn('flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 cursor-pointer transition-all', uploadingDocType === 'SELFIE' && 'opacity-50 cursor-wait')}
                      >
                        <Camera className="w-5 h-5 text-muted-foreground" />
                        <span className="text-foreground">
                          {uploadingDocType === 'SELFIE' ? t('verification.sending') : t('verification.takePhoto')}
                        </span>
                      </button>

                      <label className={cn('flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium rounded-lg border-2 border-border hover:border-primary hover:bg-primary/5 cursor-pointer transition-all', uploadingDocType === 'SELFIE' && 'opacity-50 cursor-wait')}>
                        <Upload className="w-5 h-5 text-muted-foreground" />
                        <span className="text-foreground">
                          {uploadingDocType === 'SELFIE' ? t('verification.sending') : t('verification.uploadFile')}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileInputChange(e, 'SELFIE')}
                          disabled={uploadingDocType !== null || !kycConsentGiven}
                        />
                      </label>
                    </div>

                    <p className="text-[10px] text-center text-muted-foreground mt-3 flex items-center justify-center">
                      <Lock className="w-3 h-3 mr-1" /> {t('verification.secureTransfer')}
                    </p>
                  </div>
                </VerificationItemCard>

              </div>
            </div>

            {!isFullyVerified && (
              <div className="mt-4 p-4 bg-muted border border-border rounded-xl shadow-sm">
                <p className="text-sm text-foreground mb-2">
                  <strong>{t('verification.whyVerifyTitle')}</strong><br />
                  {t('verification.whyVerifyText')}
                </p>

                <div className="flex items-start mt-3 p-3 bg-white/60 dark:bg-black/20 rounded-lg border border-border">
                  <Lock className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground">
                    <strong>{t('verification.kycTitle')}</strong><br />
                    {t('verification.kycText')}
                  </p>
                </div>
              </div>
            )}

            {user?.role && (
              <div className="bg-card p-4 rounded-xl shadow-md border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-foreground">{t('roleLabel')}</h4>
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  user.role === 'ADMIN'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                    : user.role === 'OWNER'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}>
                  {user.role}
                </span>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-card p-8 rounded-2xl shadow-lg border border-border">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <User className="w-6 h-6 text-primary" />
                {t('personalInfoTitle')}
              </h2>

              <div className="flex flex-col items-center mb-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    {user?.profilePictureUrl ? (
                      <Image
                        src={user.profilePictureUrl}
                        alt="Profil"
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-gray-400" />
                    )}
                  </div>

                  {isEditing ? (
                     <div className="absolute -bottom-10 flex gap-2">
                         <button
                           onClick={() => setShowProfileWebcamModal(true)}
                           disabled={isUploadingImage}
                           className={`p-3 rounded-full text-white cursor-pointer transition-transform hover:scale-110 shadow-md ${
                             isUploadingImage ? 'bg-gray-400 cursor-wait' : 'bg-primary hover:bg-primary/90'
                           }`}
                           title={t('takePhotoTitle')}
                         >
                           <Camera className="w-4 h-4" />
                         </button>
                         <label
                           className={`p-3 rounded-full text-white cursor-pointer transition-transform hover:scale-110 shadow-md ${
                             isUploadingImage ? 'bg-gray-400 cursor-wait' : 'bg-primary hover:bg-primary/90'
                           }`}
                           title={t('uploadPhotoTitle')}
                         >
                           <Upload className="w-4 h-4" />
                           <input
                             type="file"
                             accept="image/*"
                             className="hidden"
                             onChange={handleImageUpload}
                             disabled={isUploadingImage}
                           />
                         </label>
                     </div>
                  ) : (
                    <button
                      onClick={() => {
                        handleEditClick();
                      }}
                      className="absolute bottom-0 right-0 p-3 rounded-full text-white bg-primary hover:bg-primary/90 transition-transform hover:scale-110 shadow-md"
                      title={t('editPhotoTitle')}
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                  
                </div>
                {isUploadingImage && (
                  <p className="text-sm text-muted-foreground mt-12 animate-pulse">
                    {t('uploadingPhoto')}
                  </p>
                )}
              </div>

              {!isEditing ? (
                <div className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {t('firstNameLabel')}
                      </label>
                      <p className="text-lg text-foreground font-medium bg-muted/30 p-3 rounded-lg">
                        {user?.firstName || '-'}
                      </p>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {t('lastNameLabel')}
                      </label>
                      <p className="text-lg text-foreground font-medium bg-muted/30 p-3 rounded-lg">
                        {user?.lastName || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {t('emailLabel')}
                    </label>
                    <p className="text-lg text-foreground font-medium bg-muted/30 p-3 rounded-lg break-all">
                      {user?.email || user?.sub || '-'}
                    </p>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {t('phoneLabel')}
                    </label>
                    <p className="text-lg text-foreground font-medium bg-muted/30 p-3 rounded-lg">
                      {user?.phoneNumber || t('phoneNotProvided')}
                    </p>
                  </div>

                  {user?.companyName && (
                    <div className="group">
                      <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {t('companyLabel')}
                      </label>
                      <p className="text-lg text-foreground font-medium bg-muted/30 p-3 rounded-lg">
                        {user.companyName}
                      </p>
                    </div>
                  )}

                  {user?.bio && (
                    <div className="group">
                      <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {t('bioLabel')}
                      </label>
                      <p className="text-base text-foreground bg-muted/30 p-3 rounded-lg whitespace-pre-line leading-relaxed">
                        {user.bio}
                      </p>
                    </div>
                  )}

                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-foreground mb-2">{t('subscription.title')}</h3>

                    {user?.isPremium ? (
                      <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-300 px-4 py-3 rounded-lg flex flex-wrap items-center justify-between gap-4">
                        <div className="min-w-0">
                          <span className="font-bold">{t('subscription.premiumActiveLabel')}</span>
                          {user.premiumEndDate && (
                            <p className="text-sm mt-1">
                              {t('subscription.validUntil', {
                                date: new Date(user.premiumEndDate).toLocaleDateString(locale, {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                }),
                              })}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => setPremiumStep('SELECT_DURATION')}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg transition-colors shrink-0"
                        >
                          {t('subscription.extend')}
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* ✅ BANNIÈRE DE REPRISE DE PAIEMENT */}
                        {savedPendingPayment && (
                          <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                              <h4 className="font-bold text-yellow-800 dark:text-yellow-400">{t('subscription.pendingPaymentTitle')}</h4>
                              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                {t('subscription.pendingPaymentDescription', { amount: savedPendingPayment.amount, currency: savedPendingPayment.currency })}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setError(null);
                                  setPremiumPaymentData(savedPendingPayment);
                                  setPremiumStep('PAYMENT');
                                }}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                              >
                                {t('subscription.resume')}
                              </button>
                              <button
                                onClick={() => {
                                  localStorage.removeItem('pendingPremiumPayment');
                                  setSavedPendingPayment(null);
                                }}
                                className="text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 px-3 py-2 rounded-lg text-sm transition-colors"
                              >
                                {t('subscription.cancel')}
                              </button>
                            </div>
                          </div>
                        )}

                      <div className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-lg flex items-center justify-between gap-4">
                        <div>
                          <span className="font-bold">{t('subscription.standardLabel')}</span>
                          <p className="text-sm mt-1">{t('subscription.standardDescription')}</p>
                        </div>
                        <button
                          onClick={() => setPremiumStep('SELECT_DURATION')}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-lg transition-colors shrink-0"
                        >
                          {t('subscription.becomePremium')}
                        </button>
                      </div>
                      </>
                    )}
                  </div>

                </div>
              ) : (
                <form className="space-y-6 mt-10" onSubmit={(e) => { e.preventDefault(); handleSaveChanges(); }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
                        {t('firstNameLabel')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        required
                        value={editFormData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border rounded-lg shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder={t('form.firstNamePlaceholder')}
                      />
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                        {t('lastNameLabel')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        required
                        value={editFormData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border rounded-lg shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder={t('form.lastNamePlaceholder')}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      {t('emailLabel')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={editFormData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-border rounded-lg shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder={t('form.emailPlaceholder')}
                    />
                  </div>

                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-foreground mb-2">
                      {t('phoneLabel')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      required
                      placeholder="Ex: +257 79 12 34 56"
                      value={editFormData.phoneNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-border rounded-lg shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t('form.phoneHelp')}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-foreground mb-2">
                      {t('bioLabel')}
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      rows={4}
                      maxLength={MAX_BIO_LENGTH}
                      value={editFormData.bio}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-border rounded-lg shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                      placeholder={t('form.bioPlaceholder')}
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {t('bioHelp')}
                      </p>
                      <p className="text-xs text-muted-foreground flex-shrink-0 ml-3">
                        {t('form.bioCharCount', { count: (editFormData.bio || '').length, max: MAX_BIO_LENGTH })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
                    <Button type="submit" disabled={isSaving} className="flex-1">
                      <Save className="w-4 h-4" />
                      {isSaving ? t('form.saving') : t('form.save')}
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={isSaving} className="flex-1">
                      <X className="w-4 h-4" />
                      {t('form.cancel')}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* ======================================= */}
        {/* MES DONNÉES : export (droit à la portabilité) */}
        {/* ======================================= */}
        <div className="mt-8 bg-card rounded-2xl shadow-sm border border-border p-6">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-2">
            <Download className="w-5 h-5 text-primary" />
            {t('exportData.sectionTitle')}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t('exportData.sectionDescription')}
          </p>
          <Button type="button" variant="outline" onClick={handleExportData} disabled={isExportingData} size="sm">
            {isExportingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExportingData ? t('exportData.exporting') : t('exportData.sectionButton')}
          </Button>
        </div>

        {/* ======================================= */}
        {/* ZONE DE DANGER : suppression du compte   */}
        {/* ======================================= */}
        <div className="mt-8 bg-card rounded-2xl shadow-sm border border-destructive/20 p-6">
          <h2 className="text-lg font-bold text-destructive flex items-center gap-2 mb-2">
            <Trash2 className="w-5 h-5" />
            {t('deleteAccountModal.sectionTitle')}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t('deleteAccountModal.sectionDescription')}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowDeleteAccountModal(true)}
            size="sm"
            className="!border-destructive/30 !text-destructive hover:!bg-destructive/10"
          >
            {t('deleteAccountModal.sectionButton')}
          </Button>
        </div>
      </div>

      <ConfirmDeleteAccountModal
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        onConfirm={handleDeleteAccount}
        userEmail={user?.email ?? ''}
        isLoading={isDeletingAccount}
      />

      {/* ======================================= */}
      {/* MODALES D'ABONNEMENT PREMIUM */}
      {/* ======================================= */}

      {/* 1. Modale de choix de la durée */}
      <Dialog open={premiumStep === 'SELECT_DURATION'} onClose={() => setPremiumStep('NONE')} size="md">
        <DialogHeader onClose={() => setPremiumStep('NONE')}>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="text-amber-500" /> {t('premiumModal.title')}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="pt-6">
          <p className="text-sm text-muted-foreground mb-6">
            {t('premiumModal.description')}
          </p>

          <div className="space-y-4">
            <button
              onClick={() => setPremiumDuration(1)}
              className={cn(
                'w-full p-4 rounded-xl border-2 text-left transition-all flex justify-between items-center',
                premiumDuration === 1 ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-border hover:border-amber-300'
              )}
            >
              <div>
                <h3 className="font-bold text-foreground">{t('premiumModal.plan1Month')}</h3>
                <p className="text-xs text-muted-foreground">{t('premiumModal.plan1MonthSub')}</p>
              </div>
              <span className="font-bold text-lg text-foreground">{t('premiumModal.plan1MonthPrice')}</span>
            </button>

            <button
              onClick={() => setPremiumDuration(12)}
              className={cn(
                'w-full relative p-4 rounded-xl border-2 text-left transition-all flex justify-between items-center',
                premiumDuration === 12 ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-border hover:border-amber-300'
              )}
            >
              <div className="absolute -top-3 right-4 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                {t('premiumModal.plan1YearBadge')}
              </div>
              <div>
                <h3 className="font-bold text-foreground">{t('premiumModal.plan1Year')}</h3>
                <p className="text-xs text-muted-foreground">{t('premiumModal.plan1YearSub')}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-lg text-foreground">{t('premiumModal.plan1YearPrice')}</span>
                <p className="text-xs text-muted-foreground line-through">{t('premiumModal.plan1YearOldPrice')}</p>
              </div>
            </button>
          </div>

          <button
            onClick={handleInitiatePremium}
            disabled={isPremiumLoading}
            className="w-full mt-6 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white py-3 rounded-xl font-bold flex justify-center items-center"
          >
            {isPremiumLoading ? <Loader2 className="animate-spin w-5 h-5" /> : t('premiumModal.continueButton')}
          </button>
        </DialogBody>
      </Dialog>

      {/* 2. Modale de paiement unifiée */}
      {premiumStep === 'PAYMENT' && premiumPaymentData && (
        <UnifiedPaymentModal
          isOpen={true}
          onClose={() => setPremiumStep('SELECT_DURATION')}
          amount={premiumPaymentData.amount}
          currency={premiumPaymentData.currency}
          isLoading={isPremiumLoading}
          errorMessage={error}
          onLocalPaymentSubmit={handlePremiumLocalPayment}
          onStripePaymentSubmit={handlePremiumStripePayment}
        />
      )}

      {/* 3. Succès */}
      <Dialog open={premiumStep === 'SUCCESS'} onClose={() => setPremiumStep('NONE')} size="sm">
        <DialogBody className="pt-8 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-h2 text-foreground mb-2">{t('premiumModal.successTitle')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('premiumModal.successMessage', { months: premiumDuration })}
          </p>
          <Button onClick={() => setPremiumStep('NONE')} className="w-full">
            {t('premiumModal.successButton')}
          </Button>
        </DialogBody>
      </Dialog>

    </div>
  );
}