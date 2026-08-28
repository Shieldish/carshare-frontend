'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { apiClient, ApiError } from '@/lib/apiClient';
import { getApiErrorMessageKey } from '@/lib/apiErrorMessages';
import UnifiedPaymentModal from '@/app/components/payment/UnifiedPaymentModal';
import { Calendar, ArrowLeft, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

// ============================================================================
// TYPES
// ============================================================================

interface Vehicle {
  id: number;
  make: string;
  model: string;
  manufacturingYear: number;
  ratePerDay: number;
  imageUrl?: string;
  images?: { url: string }[];
  fuelType?: string;
  transmission?: string;
  seats?: number;
  mileage?: number;
}

interface CreatedBooking {
  id: number;
  totalPrice?: number;
  status?: string;
}

// ============================================================================
// COMPOSANTS UTILITAIRES
// ============================================================================

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

function BookingCreateContent() {
  const t = useTranslations('bookings.create');
  const tToast = useTranslations('toast.errors');
  const router = useRouter();
  const searchParams = useSearchParams();

  const vehicleId = searchParams.get('vehicleId');
  const urlStartDate = searchParams.get('startDate');
  const urlEndDate = searchParams.get('endDate');

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [startDate, setStartDate] = useState(urlStartDate || '');
  const [endDate, setEndDate] = useState(urlEndDate || '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<'idle' | 'available' | 'unavailable' | 'error'>('idle');

  const [useFallbackImage, setUseFallbackImage] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<CreatedBooking | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentModalError, setPaymentModalError] = useState<string | null>(null);

  const debouncedStartDate = useDebounce(startDate, 500);
  const debouncedEndDate = useDebounce(endDate, 500);

  // ✅ On ne propose pas "aujourd'hui" comme date de début : un début choisi tôt dans la
  // journée peut devenir "dans le passé" au moment où la requête atteint le serveur (le
  // temps de remplir le formulaire, l'appel check-availability, etc.), ce qui produisait une
  // erreur confuse. Démarrer au plus tôt demain élimine cette course contre la montre.
  const getMinDateTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
    return tomorrow.toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (!vehicleId) {
      toast.error(t('notifications.missingVehicleId'));
      setIsLoading(false);
      return;
    }

    if (!localStorage.getItem('jwt_token')) {
      toast.error(t('notifications.loginRequiredMessage'));
      setTimeout(() => router.push(`/login?redirect=/bookings/create?vehicleId=${vehicleId}`), 2000);
      return;
    }

    const fetchVehicle = async () => {
      try {
        const data = await apiClient.get(`/api/vehicles/${vehicleId}`);
        setVehicle(data);
      } catch {
        toast.error(t('notifications.vehicleNotFoundMessage'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicle();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId, router]);

  useEffect(() => {
    if (!debouncedStartDate || !debouncedEndDate || !vehicleId) {
      setAvailabilityStatus('idle');
      return;
    }

    const start = new Date(debouncedStartDate);
    const end = new Date(debouncedEndDate);

    if (start >= end) {
      setAvailabilityStatus('error');
      toast.error(t('notifications.invalidDatesMessage'), { id: 'availability-check' });
      return;
    }
    
    const checkAvailability = async () => {
      setIsCheckingAvailability(true);
      setAvailabilityStatus('idle');

      // ✅ Un `id` stable fait que chaque nouvel appel remplace le toast précédent en place
      // au lieu de les empiler à chaque changement de date (debounced, donc appelé souvent).
      try {
        await apiClient.post('/api/bookings/check-availability', {
          vehicleId: Number(vehicleId),
          startDate: debouncedStartDate,
          endDate: debouncedEndDate,
        });

        setAvailabilityStatus('available');
        toast.success(t('notifications.availableMessage'), { id: 'availability-check' });

      } catch (error) {
        if (error instanceof ApiError) {
          if (error.status === 409) {
            setAvailabilityStatus('unavailable');
            toast.error(error.message || t('notifications.unavailableMessage'), { id: 'availability-check' });
          } else if (error.status === 400) {
            setAvailabilityStatus('error');
            toast.error(error.message || t('notifications.invalidDatesMessage'), { id: 'availability-check' });
          } else {
            setAvailabilityStatus('error');
            toast.error(error.message || t('notifications.checkErrorMessage'), { id: 'availability-check' });
          }
        } else {
          setAvailabilityStatus('error');
          toast.error(t('notifications.unknownErrorMessage'), { id: 'availability-check' });
        }
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    checkAvailability();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedStartDate, debouncedEndDate, vehicleId]);

  const startDateObj = startDate ? new Date(startDate) : null;
  const endDateObj = endDate ? new Date(endDate) : null;
  
  let diffDays = 0;
  let totalPrice = 0;

  // ✅ Facturation à la journée entière (comme le backend) : toute portion de
  // journée entamée compte pour un jour complet, ex. 25h = 2 jours.
  if (startDateObj && endDateObj && startDateObj < endDateObj && vehicle) {
    const diffMinutes = Math.round((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60));
    diffDays = Math.ceil(diffMinutes / (24 * 60));
    totalPrice = diffDays * (vehicle.ratePerDay || 0);
  }

  const handleSubmitBooking = async () => {
    if (!startDate || !endDate) {
      toast.error(t('notifications.datesRequiredMessage'));
      return;
    }

    if (availabilityStatus !== 'available') {
      toast.error(t('notifications.verificationRequiredMessage'));
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading(t('notifications.processingMessage'));

    try {
      const newBooking = await apiClient.post('/api/bookings', {
        vehicleId: Number(vehicleId),
        startDate: startDate,
        endDate: endDate,
        totalPrice: totalPrice,
        paymentOption: 'ONLINE'   // ← Obligatoire pour satisfaire le backend Spring Boot
      });

      toast.dismiss(loadingToast);
      setCreatedBooking(newBooking);
      setPaymentModalError(null);
      setShowPaymentModal(true);

    } catch (err: unknown) {
      let errorMessage = t('notifications.bookingFailedMessage');
      if (err instanceof ApiError) {
        // ✅ Les erreurs avec un code connu (ex. START_DATE_NOT_IN_FUTURE) sont traduites
        // dans la langue active au lieu d'afficher le message brut du backend (toujours en
        // anglais pour les contraintes @Future/@NotNull, cf. GlobalExceptionHandler).
        const key = getApiErrorMessageKey(err);
        errorMessage = key === 'generic' && err.message ? err.message : tToast(key);
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      toast.error(errorMessage, { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocalPaymentSubmit = async (_provider: string, phoneNumber: string, paymentCode: string) => {
    if (!createdBooking) return;
    setIsProcessingPayment(true);
    setPaymentModalError(null);

    try {
      await apiClient.post('/api/payments/pay/mobile-money', {
        bookingId: createdBooking.id,
        phoneNumber: phoneNumber,
        transactionReference: paymentCode,
      });

      setShowPaymentModal(false);
      toast.success(t('notifications.paymentValidatedMessage'));

      setTimeout(() => {
        router.push(`/bookings/my-bookings`);
      }, 2000);
    } catch (err: unknown) {
      let errorMessage = t('notifications.mobilePaymentErrorMessage');
      if (err instanceof Error || err instanceof ApiError) errorMessage = err.message;
      toast.error(errorMessage);
      setPaymentModalError(errorMessage);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleStripePaymentSubmit = async () => {
    if (!createdBooking) return;
    setIsProcessingPayment(true);
    setPaymentModalError(null);

    const token = localStorage.getItem('jwt_token');
    if (!token) {
      toast.error(t('notifications.sessionExpiredMessage'));
      setPaymentModalError(t('notifications.sessionExpiredMessage'));
      setIsProcessingPayment(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'}/api/payments/booking/${createdBooking.id}/initiate-online-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) throw new Error(t('notifications.onlinePaymentInitError'));

      const data = await response.json();

      if (data.redirectUrl) {
        // Le paiement Stripe quitte la page : payment/callback lit cette valeur pour savoir
        // qu'il s'agissait d'une réservation et rediriger au bon endroit au retour.
        sessionStorage.setItem('paymentSource', 'booking');
        window.location.href = data.redirectUrl;
      } else {
        throw new Error(t('notifications.redirectUrlMissing'));
      }
    } catch (err: unknown) {
      let errorMessage = t('notifications.onlinePaymentErrorMessage');
      if (err instanceof Error) errorMessage = err.message;
      toast.error(errorMessage);
      setPaymentModalError(errorMessage);
      setIsProcessingPayment(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center bg-card border border-border rounded-lg p-6 max-w-md">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">{t('vehicleNotFoundTitle')}</h3>
          <p className="text-muted-foreground mb-4">{t('vehicleNotFoundDesc')}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            {t('back')}
          </button>
        </div>
      </div>
    );
  }
  
  const getDisplayImage = () => {
    if (useFallbackImage) return `https://source.unsplash.com/random/600x400/?car&sig=${vehicle.id}`;
    return vehicle.images?.[0]?.url || vehicle.imageUrl || `https://source.unsplash.com/random/600x400/?car&sig=${vehicle.id}`;
  };

  const displayImageSrc = getDisplayImage();

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-foreground hover:text-primary transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            {t('back')}
          </button>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">{t('pageTitle')}</h1>
          <p className="text-lg text-muted-foreground">{t('pageSubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* COLONNE GAUCHE : Détails du véhicule */}
          <div className="bg-card rounded-2xl shadow-xl overflow-hidden border border-border">
            <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-800">
              <Image 
                src={displayImageSrc} 
                alt={`${vehicle.make} ${vehicle.model}`} 
                fill
                className="object-cover"
                unoptimized
                onError={() => setUseFallbackImage(true)}
              />
              <div className="absolute top-4 right-4 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground px-4 py-2 rounded-lg shadow-lg z-10">
                <p className="text-lg font-bold">{vehicle.ratePerDay?.toLocaleString('fr-FR')} FBu</p>
                <p className="text-xs opacity-90">{t('perDay')}</p>
              </div>
            </div>

            <div className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-1">{vehicle.make} {vehicle.model}</h2>
              <p className="text-muted-foreground mb-4">{vehicle.manufacturingYear}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {vehicle.fuelType && (
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <div className="text-sm font-semibold text-foreground">{vehicle.fuelType}</div>
                    <div className="text-xs text-muted-foreground">{t('fuel')}</div>
                  </div>
                )}
                {vehicle.transmission && (
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <div className="text-sm font-semibold text-foreground">{vehicle.transmission}</div>
                    <div className="text-xs text-muted-foreground">{t('transmission')}</div>
                  </div>
                )}
                {vehicle.seats && (
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-foreground">{vehicle.seats}</div>
                    <div className="text-xs text-muted-foreground">{t('seats')}</div>
                  </div>
                )}
                {vehicle.mileage && (
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <div className="text-sm font-bold text-foreground">{vehicle.mileage?.toLocaleString('fr-FR')}</div>
                    <div className="text-xs text-muted-foreground">{t('mileage')}</div>
                  </div>
                )}
              </div>

              <hr className="my-4 border-border" />

              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {t('bookingDetailsTitle')}
                </h3>

                {diffDays > 0 ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('from')}</span>
                      <strong className="text-foreground">{startDateObj?.toLocaleString('fr-FR')}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('to')}</span>
                      <strong className="text-foreground">{endDateObj?.toLocaleString('fr-FR')}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('duration')}</span>
                      <strong className="text-foreground">{diffDays} {diffDays > 1 ? t('dayPlural') : t('daySingular')}</strong>
                    </div>
                    <hr className="my-2 border-border" />
                    <div className="flex justify-between text-xl font-bold text-primary">
                      <span>{t('total')}</span>
                      <span>{totalPrice.toLocaleString('fr-FR')} FBu</span>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">{t('selectDatesPrompt')}</p>
                )}
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : Sélection des dates */}
          <div className="bg-card rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6">{t('yourDatesTitle')}</h2>

            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t('startDateLabel')}</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={getMinDateTime()}
                  className="w-full px-4 py-3 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t('endDateLabel')}</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || getMinDateTime()}
                  className="w-full px-4 py-3 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>

            <div className="h-8 mb-6 flex items-center justify-center">
              {isCheckingAvailability && (
                <div className="flex items-center text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('checkingAvailability')}
                </div>
              )}
            </div>

            <button
              onClick={handleSubmitBooking}
              disabled={isSubmitting || availabilityStatus !== 'available' || !startDate || !endDate}
              className="w-full bg-gradient-to-r from-primary to-primary/90 text-primary-foreground py-4 px-6 rounded-xl hover:from-primary/90 hover:to-primary transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  {t('submitting')}
                </>
              ) : (
                t('submitButton')
              )}
            </button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              {t('paymentNote')}
            </p>
          </div>
        </div>
      </div>

      <UnifiedPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={totalPrice}
        currency="FBu"
        isLoading={isProcessingPayment}
        errorMessage={paymentModalError}
        onLocalPaymentSubmit={handleLocalPaymentSubmit}
        onStripePaymentSubmit={handleStripePaymentSubmit}
      />
    </div>
  );
}

function BookingCreateFallback() {
  const t = useTranslations('bookings.create');
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex items-center space-x-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">{t('loadingPage')}</p>
      </div>
    </div>
  );
}

export default function BookingCreatePage() {
  return (
    <Suspense fallback={<BookingCreateFallback />}>
      <BookingCreateContent />
    </Suspense>
  );
}