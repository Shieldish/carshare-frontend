'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/apiClient';
import { BadgeCheck, BadgeAlert, User, Mail, Phone, Building2, Shield, AlertTriangle, CheckCircle, XCircle, Edit2, Save, X, Camera, Upload, Lock, Crown, Loader2 } from 'lucide-react';
import Image from 'next/image';
import UnifiedPaymentModal from '@/app/components/payment/UnifiedPaymentModal';

type UserFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
};

// ✅ COMPOSANT : La fenêtre de la Webcam
function WebcamModal({ onCapture, onClose, isProfilePicture = false }: { onCapture: (file: File) => void, onClose: () => void, isProfilePicture?: boolean }) {
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
        setError("Impossible d'accéder à la caméra. Vérifiez les permissions de votre navigateur.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Camera className="w-5 h-5" /> Capture en direct
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 flex flex-col items-center">
          {error ? (
            <div className="text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          ) : (
            <div className={`relative bg-black overflow-hidden border-2 border-gray-300 dark:border-gray-600 shadow-inner ${isProfilePicture ? 'w-64 h-64 rounded-full' : 'w-full aspect-video rounded-lg'}`}>
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
              ? "Souriez ! Assurez-vous d'être dans un endroit bien éclairé." 
              : "Tenez votre pièce d'identité près de votre visage et assurez-vous d'être dans un endroit bien éclairé."}
          </p>

          <div className="mt-6 flex gap-4 w-full">
            <button onClick={onClose} className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium transition-colors">
              Annuler
            </button>
            <button 
              onClick={handleTakeSnapshot} 
              disabled={!!error || !stream}
              className="flex-1 py-3 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 font-bold shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2"
            >
              <Camera className="w-5 h-5" /> Capturer l&apos;image
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  
  const [showWebcamModal, setShowWebcamModal] = useState(false);
  const [showProfileWebcamModal, setShowProfileWebcamModal] = useState(false);

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
  });

  useEffect(() => {
    if (user) {
      setEditFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || user.sub || '',
        phoneNumber: user.phoneNumber || '',
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setSuccessMessage('Profil mis à jour avec succès !');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour.';
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
      setSuccessMessage('Photo de profil mise à jour avec succès !');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de l'upload de l'image.";
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
      
      let docName = "Document";
      if (docType === 'IDENTITY') docName = "Carte d'identité";
      else if (docType === 'DRIVING_LICENSE') docName = "Permis de conduire";
      else if (docType === 'SELFIE') docName = "Selfie";

      setSuccessMessage(`Votre ${docName} a été envoyé(e) avec succès ! En attente de vérification par un administrateur.`);
      setTimeout(() => setSuccessMessage(null), 8000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de l'envoi du document.";
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
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du paiement Premium.');
    } finally {
      setIsPremiumLoading(false);
    }
  };

  // ✅ PAIEMENT MOBILE MONEY PREMIUM
  const handlePremiumLocalPayment = async (provider: string, phoneNumber: string, paymentCode: string) => {
    if (!premiumPaymentData) return;
    setIsPremiumLoading(true);
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
      setError(err instanceof Error ? err.message : 'Erreur de paiement mobile.');
    } finally {
      setIsPremiumLoading(false);
    }
  };

  // ✅ PAIEMENT STRIPE PREMIUM
  const handlePremiumStripePayment = async () => {
    if (!premiumPaymentData) return;
    setIsPremiumLoading(true);
    try {
      const response = await apiClient.post(`/api/payments/${premiumPaymentData.paymentId}/initiate-online-payment`, {});
      if (response.redirectUrl) {
        window.location.href = response.redirectUrl;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur Stripe.');
      setIsPremiumLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-foreground">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (!user && !isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-xl text-red-600 dark:text-red-400 font-semibold">
            Vous devez être connecté pour voir cette page.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="mt-6 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  const isFullyVerified = user?.isIdentityVerified && user?.isDrivingLicenseVerified && user?.isSelfieVerified;
  const isPartiallyVerified = user?.isIdentityVerified || user?.isDrivingLicenseVerified || user?.isSelfieVerified;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
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
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <User className="w-10 h-10 text-primary" />
              Mon Profil
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérez vos informations personnelles et votre statut de vérification
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={handleEditClick}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium transition-all hover:shadow-lg"
            >
              <Edit2 className="w-4 h-4" />
              Modifier le profil
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 mb-6 rounded-r-lg shadow-md" role="alert">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-bold">Une erreur est survenue</p>
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
                <p className="font-bold">Succès</p>
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
                  <h3 className="font-bold text-lg text-foreground">Statut de Vérification</h3>
                  <p className={`text-sm font-medium ${
                    isFullyVerified
                      ? 'text-green-600 dark:text-green-400'
                      : isPartiallyVerified
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {isFullyVerified
                      ? '✓ Compte entièrement vérifié'
                      : isPartiallyVerified
                      ? '⚠ Vérification partielle'
                      : '✗ Compte non vérifié'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                {/* BLOC PIÈCE D'IDENTITÉ */}
                <div className={`p-3 rounded-lg border ${
                  user?.isIdentityVerified
                    ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700'
                    : user?.identityDocumentUrl
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                }`}>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {user?.isIdentityVerified ? (
                          <BadgeCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <BadgeAlert className={`w-5 h-5 ${user?.identityDocumentUrl ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}`} />
                        )}
                        <span className="font-medium text-sm text-foreground">
                          CNI / Passeport
                        </span>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        user?.isIdentityVerified
                          ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                          : user?.identityDocumentUrl
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {user?.isIdentityVerified 
                          ? 'Vérifié' 
                          : user?.identityDocumentUrl 
                          ? 'En attente de validation' 
                          : 'Non envoyé'}
                      </span>
                    </div>
                    
                    {!user?.isIdentityVerified && (
                      <div className="mt-2">
                        <label className={`flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-md border border-dashed border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${uploadingDocType === 'IDENTITY' ? 'opacity-50 cursor-wait' : ''}`}>
                          <Upload className="w-4 h-4" />
                          {uploadingDocType === 'IDENTITY' 
                            ? 'Envoi en cours...' 
                            : user?.identityDocumentUrl 
                              ? 'Remplacer la CNI' 
                              : 'Ajouter ma CNI'}
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => handleFileInputChange(e, 'IDENTITY')}
                            disabled={uploadingDocType !== null}
                          />
                        </label>
                        <p className="text-[10px] text-center text-muted-foreground mt-1 flex items-center justify-center">
                          <Lock className="w-3 h-3 mr-1" /> Transfert chiffré sécurisé
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* BLOC PERMIS DE CONDUIRE */}
                <div className={`p-3 rounded-lg border ${
                  user?.isDrivingLicenseVerified
                    ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700'
                    : user?.drivingLicenseUrl
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                }`}>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {user?.isDrivingLicenseVerified ? (
                          <BadgeCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <BadgeAlert className={`w-5 h-5 ${user?.drivingLicenseUrl ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}`} />
                        )}
                        <span className="font-medium text-sm text-foreground">
                          Permis de conduire
                        </span>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        user?.isDrivingLicenseVerified
                          ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                          : user?.drivingLicenseUrl
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {user?.isDrivingLicenseVerified 
                          ? 'Vérifié' 
                          : user?.drivingLicenseUrl 
                          ? 'En attente de validation' 
                          : 'Non envoyé'}
                      </span>
                    </div>

                    {!user?.isDrivingLicenseVerified && (
                      <div className="mt-2">
                        <label className={`flex items-center justify-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-md border border-dashed border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${uploadingDocType === 'DRIVING_LICENSE' ? 'opacity-50 cursor-wait' : ''}`}>
                          <Upload className="w-4 h-4" />
                          {uploadingDocType === 'DRIVING_LICENSE' 
                            ? 'Envoi en cours...' 
                            : user?.drivingLicenseUrl 
                              ? 'Remplacer mon Permis' 
                              : 'Ajouter mon Permis'}
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => handleFileInputChange(e, 'DRIVING_LICENSE')}
                            disabled={uploadingDocType !== null}
                          />
                        </label>
                        <p className="text-[10px] text-center text-muted-foreground mt-1 flex items-center justify-center">
                          <Lock className="w-3 h-3 mr-1" /> Transfert chiffré sécurisé
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* BLOC SELFIE AVEC WEBCAM INTÉGRÉE */}
                <div className={`p-3 rounded-lg border ${
                  user?.isSelfieVerified
                    ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700'
                    : user?.selfieUrl
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                }`}>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {user?.isSelfieVerified ? (
                          <BadgeCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <BadgeAlert className={`w-5 h-5 ${user?.selfieUrl ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}`} />
                        )}
                        <span className="font-medium text-sm text-foreground">Selfie de vérification</span>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        user?.isSelfieVerified
                          ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200'
                          : user?.selfieUrl
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {user?.isSelfieVerified 
                          ? 'Vérifié' 
                          : user?.selfieUrl 
                          ? 'En attente de validation' 
                          : 'Non envoyé'}
                      </span>
                    </div>

                    {!user?.isSelfieVerified && (
                      <div className="mt-2">
                        <div className="mb-3 text-center bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-md border border-blue-100 dark:border-blue-800/30">
                          <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1">
                            📸 Comment prendre un bon selfie ?
                          </p>
                          <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80">
                            Prenez une photo claire de votre visage en tenant votre pièce d&apos;identité (CNI ou Permis) à côté de vous. Le texte sur le document doit être lisible.
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                          <button 
                            onClick={() => setShowWebcamModal(true)}
                            disabled={uploadingDocType !== null}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:hover:border-primary cursor-pointer transition-all ${uploadingDocType === 'SELFIE' ? 'opacity-50 cursor-wait' : ''}`}
                          >
                            <Camera className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            <span className="text-gray-800 dark:text-gray-200">
                              {uploadingDocType === 'SELFIE' ? 'Envoi...' : 'Prendre une photo'}
                            </span>
                          </button>

                          <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 dark:border-gray-700 dark:hover:border-primary cursor-pointer transition-all ${uploadingDocType === 'SELFIE' ? 'opacity-50 cursor-wait' : ''}`}>
                            <Upload className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            <span className="text-gray-800 dark:text-gray-200">
                              {uploadingDocType === 'SELFIE' ? 'Envoi...' : 'Téléverser un fichier'}
                            </span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => handleFileInputChange(e, 'SELFIE')} 
                              disabled={uploadingDocType !== null} 
                            />
                          </label>
                        </div>

                        <p className="text-[10px] text-center text-muted-foreground mt-3 flex items-center justify-center">
                          <Lock className="w-3 h-3 mr-1" /> Transfert chiffré sécurisé
                        </p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {!isFullyVerified && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl shadow-sm">
                <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
                  <strong>Pourquoi vérifier mon identité ?</strong><br />
                  La vérification garantit la sécurité de tous les membres de la communauté BudaxDrive au Burundi.
                </p>
                
                <div className="flex items-start mt-3 p-3 bg-white/60 dark:bg-black/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
                  <Lock className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-900 dark:text-blue-200">
                    <strong>Protection des données (Norme KYC)</strong><br />
                    Vos documents sont stockés dans un coffre-fort numérique chiffré. Ils n&apos;apparaîtront jamais publiquement et sont détruits en cas de suppression de compte.
                  </p>
                </div>
              </div>
            )}

            {user?.role && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-foreground">Rôle</h4>
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
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-border">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <User className="w-6 h-6 text-primary" />
                Informations Personnelles
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
                           className={`p-2 rounded-full text-white cursor-pointer transition-transform hover:scale-110 shadow-md ${
                             isUploadingImage ? 'bg-gray-400 cursor-wait' : 'bg-primary hover:bg-primary/90'
                           }`}
                           title="Prendre une photo"
                         >
                           <Camera className="w-4 h-4" />
                         </button>
                         <label
                           className={`p-2 rounded-full text-white cursor-pointer transition-transform hover:scale-110 shadow-md ${
                             isUploadingImage ? 'bg-gray-400 cursor-wait' : 'bg-blue-500 hover:bg-blue-600'
                           }`}
                           title="Téléverser"
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
                      className="absolute bottom-0 right-0 p-2 rounded-full text-white bg-primary hover:bg-primary/90 transition-transform hover:scale-110 shadow-md"
                      title="Modifier la photo"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                  
                </div>
                {isUploadingImage && (
                  <p className="text-sm text-muted-foreground mt-12 animate-pulse">
                    Envoi en cours...
                  </p>
                )}
              </div>

              {!isEditing ? (
                <div className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="group">
                      <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Prénom
                      </label>
                      <p className="text-lg text-foreground font-medium bg-muted/30 p-3 rounded-lg">
                        {user?.firstName || '-'}
                      </p>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Nom
                      </label>
                      <p className="text-lg text-foreground font-medium bg-muted/30 p-3 rounded-lg">
                        {user?.lastName || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <p className="text-lg text-foreground font-medium bg-muted/30 p-3 rounded-lg break-all">
                      {user?.email || user?.sub || '-'}
                    </p>
                  </div>

                  <div className="group">
                    <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Téléphone
                    </label>
                    <p className="text-lg text-foreground font-medium bg-muted/30 p-3 rounded-lg">
                      {user?.phoneNumber || 'Non renseigné'}
                    </p>
                  </div>

                  {user?.companyName && (
                    <div className="group">
                      <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Entreprise
                      </label>
                      <p className="text-lg text-foreground font-medium bg-muted/30 p-3 rounded-lg">
                        {user.companyName}
                      </p>
                    </div>
                  )}

                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Mon Abonnement</h3>

                    {user?.isPremium ? (
                      <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-300 px-4 py-3 rounded-lg flex items-center justify-between gap-4">
                        <div>
                          <span className="font-bold">🌟 Compte Premium Actif</span>
                          {user.premiumEndDate && (
                            <p className="text-sm mt-1">
                              Valable jusqu&apos;au :{' '}
                              {new Date(user.premiumEndDate).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => setPremiumStep('SELECT_DURATION')}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg transition-colors shrink-0"
                        >
                          Prolonger
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* ✅ BANNIÈRE DE REPRISE DE PAIEMENT */}
                        {savedPendingPayment && (
                          <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                              <h4 className="font-bold text-yellow-800 dark:text-yellow-400">Paiement en attente</h4>
                              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                Vous avez un abonnement non finalisé de {savedPendingPayment.amount} {savedPendingPayment.currency}.
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setPremiumPaymentData(savedPendingPayment);
                                  setPremiumStep('PAYMENT');
                                }}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                              >
                                Reprendre
                              </button>
                              <button
                                onClick={() => {
                                  localStorage.removeItem('pendingPremiumPayment');
                                  setSavedPendingPayment(null);
                                }}
                                className="text-yellow-600 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 px-3 py-2 rounded-lg text-sm transition-colors"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        )}

                      <div className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-3 rounded-lg flex items-center justify-between gap-4">
                        <div>
                          <span className="font-bold">Compte Standard</span>
                          <p className="text-sm mt-1">Passez au Premium pour débloquer tous les avantages.</p>
                        </div>
                        <button
                          onClick={() => setPremiumStep('SELECT_DURATION')}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shrink-0"
                        >
                          Devenir Premium
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
                        Prénom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        required
                        value={editFormData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border rounded-lg shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder="Votre prénom"
                      />
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                        Nom <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        required
                        value={editFormData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-border rounded-lg shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder="Votre nom"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={editFormData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-border rounded-lg shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="votre.email@exemple.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-foreground mb-2">
                      Numéro de téléphone <span className="text-red-500">*</span>
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
                      Nécessaire pour la communication avec les autres utilisateurs
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-all hover:shadow-lg"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-all"
                    >
                      <X className="w-4 h-4" />
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================= */}
      {/* MODALES D'ABONNEMENT PREMIUM */}
      {/* ======================================= */}

      {/* 1. Modale de choix de la durée */}
      {premiumStep === 'SELECT_DURATION' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center text-gray-900 dark:text-white">
                <Crown className="mr-2 text-yellow-500" /> Abonnement Premium
              </h2>
              <button onClick={() => setPremiumStep('NONE')} className="text-gray-400 hover:text-gray-600 font-bold text-xl">×</button>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Débloquez des fonctionnalités exclusives, réduisez vos frais et faites briller votre profil.
            </p>

            <div className="space-y-4">
              <button
                onClick={() => setPremiumDuration(1)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all flex justify-between items-center ${premiumDuration === 1 ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'border-gray-200 hover:border-yellow-300'}`}
              >
                <div>
                  <h3 className="font-bold">1 Mois</h3>
                  <p className="text-xs text-gray-500">Sans engagement</p>
                </div>
                <span className="font-bold text-lg">10 000 FBu</span>
              </button>

              <button
                onClick={() => setPremiumDuration(12)}
                className={`w-full relative p-4 rounded-xl border-2 text-left transition-all flex justify-between items-center ${premiumDuration === 12 ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'border-gray-200 hover:border-yellow-300'}`}
              >
                <div className="absolute -top-3 right-4 bg-yellow-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                  2 MOIS OFFERTS
                </div>
                <div>
                  <h3 className="font-bold">1 An</h3>
                  <p className="text-xs text-gray-500">Paiement unique</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-lg">100 000 FBu</span>
                  <p className="text-xs text-gray-400 line-through">120 000 FBu</p>
                </div>
              </button>
            </div>

            <button
              onClick={handleInitiatePremium}
              disabled={isPremiumLoading}
              className="w-full mt-6 bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-bold flex justify-center items-center"
            >
              {isPremiumLoading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Continuer vers le paiement'}
            </button>
          </div>
        </div>
      )}

      {/* 2. Modale de paiement unifiée */}
      {premiumStep === 'PAYMENT' && premiumPaymentData && (
        <UnifiedPaymentModal
          isOpen={true}
          onClose={() => setPremiumStep('SELECT_DURATION')}
          amount={premiumPaymentData.amount}
          currency={premiumPaymentData.currency}
          isLoading={isPremiumLoading}
          onLocalPaymentSubmit={handlePremiumLocalPayment}
          onStripePaymentSubmit={handlePremiumStripePayment}
        />
      )}

      {/* 3. Succès */}
      {premiumStep === 'SUCCESS' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-sm w-full text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Félicitations !</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Votre abonnement Premium pour {premiumDuration} mois est maintenant actif.
            </p>
            <button onClick={() => setPremiumStep('NONE')} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold">
              Super !
            </button>
          </div>
        </div>
      )}

    </div>
  );
}