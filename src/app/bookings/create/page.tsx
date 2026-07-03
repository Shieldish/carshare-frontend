'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { apiClient, ApiError } from '@/lib/apiClient';
import UnifiedPaymentModal from '@/app/components/payment/UnifiedPaymentModal'; 
import { Calendar, ArrowLeft, X, CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

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

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
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

function NotificationToast({ notification, onClose }: { notification: Notification; onClose: (id: string) => void }) {
  useEffect(() => {
    if (notification.duration !== 0) {
      const timer = setTimeout(() => onClose(notification.id), notification.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  const styles = {
    success: { 
      bg: 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800', 
      icon: <CheckCircle className="w-5 h-5 text-green-800 dark:text-green-300" />, 
      title: 'text-green-800 dark:text-green-300', 
      message: 'text-green-600 dark:text-green-400' 
    },
    error: { 
      bg: 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800', 
      icon: <XCircle className="w-5 h-5 text-red-800 dark:text-red-300" />, 
      title: 'text-red-800 dark:text-red-300', 
      message: 'text-red-600 dark:text-red-400' 
    },
    warning: { 
      bg: 'bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800', 
      icon: <AlertTriangle className="w-5 h-5 text-orange-800 dark:text-orange-300" />, 
      title: 'text-orange-800 dark:text-orange-300', 
      message: 'text-orange-600 dark:text-orange-400' 
    },
    info: { 
      bg: 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800', 
      icon: <CheckCircle className="w-5 h-5 text-blue-800 dark:text-blue-300" />, 
      title: 'text-blue-800 dark:text-blue-300', 
      message: 'text-blue-600 dark:text-blue-400' 
    },
  }[notification.type];

  return (
    <div className={`${styles.bg} border rounded-lg p-4 shadow-lg transform transition-all duration-300 ease-in-out animate-in slide-in-from-top backdrop-blur-sm`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3 mt-0.5">{styles.icon}</div>
        <div className="flex-1">
          <h4 className={`font-semibold ${styles.title} mb-1`}>{notification.title}</h4>
          <p className={`text-sm ${styles.message}`}>{notification.message}</p>
        </div>
        <button 
          onClick={() => onClose(notification.id)} 
          className={`ml-3 p-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 hover:bg-white/20 dark:hover:bg-black/20 transition-colors ${styles.title}`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function NotificationContainer({ notifications, onClose }: { notifications: Notification[]; onClose: (id: string) => void }) {
  if (notifications.length === 0) return null;
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md w-full">
      {notifications.map((n) => <NotificationToast key={n.id} notification={n} onClose={onClose} />)}
    </div>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

function BookingCreateContent() {
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<'idle' | 'available' | 'unavailable' | 'error'>('idle');

  const [useFallbackImage, setUseFallbackImage] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<CreatedBooking | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const debouncedStartDate = useDebounce(startDate, 500);
  const debouncedEndDate = useDebounce(endDate, 500);

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset() + 30);
    return now.toISOString().slice(0, 16);
  };

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = notification.title + '-' + Date.now();
    setNotifications(prev => {
      const filtered = prev.filter(n => n.title !== notification.title);
      return [...filtered, { ...notification, id }];
    });
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  useEffect(() => {
    if (!vehicleId) {
      addNotification({ type: 'error', title: 'Erreur', message: "ID du véhicule manquant." });
      setIsLoading(false);
      return;
    }

    if (!localStorage.getItem('jwt_token')) {
      addNotification({ type: 'warning', title: 'Connexion requise', message: 'Vous devez être connecté pour réserver.' });
      setTimeout(() => router.push(`/login?redirect=/bookings/create?vehicleId=${vehicleId}`), 2000);
      return;
    }

    const fetchVehicle = async () => {
      try {
        const data = await apiClient.get(`/api/vehicles/${vehicleId}`);
        setVehicle(data);
      } catch {
        addNotification({ type: 'error', title: 'Erreur de chargement', message: "Détails du véhicule introuvables." });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVehicle();
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
      return;
    }
    
    const checkAvailability = async () => {
      setIsCheckingAvailability(true);
      setAvailabilityStatus('idle');
      
      setNotifications(prev => prev.filter(n => 
        n.title !== 'Disponible' && 
        n.title !== 'Non Disponible' && 
        n.title !== 'Erreur de vérification' &&
        n.title !== 'Dates Invalides'
      ));

      try {
        await apiClient.post('/api/bookings/check-availability', {
          vehicleId: Number(vehicleId),
          startDate: debouncedStartDate,
          endDate: debouncedEndDate,
        });

        setAvailabilityStatus('available');
        addNotification({ 
          type: 'success', 
          title: 'Disponible', 
          message: 'Ce véhicule est libre pour ces dates !' 
        });

      } catch (error) {
        if (error instanceof ApiError) {
          if (error.status === 409) {
            setAvailabilityStatus('unavailable');
            addNotification({ 
              type: 'error', 
              title: 'Non Disponible', 
              message: error.message || 'Ce créneau est déjà pris.' 
            });
          } else if (error.status === 400) {
            setAvailabilityStatus('error');
            addNotification({
              type: 'error',
              title: 'Dates Invalides',
              message: error.message || 'Veuillez vérifier les dates sélectionnées.'
            });
          } else {
            setAvailabilityStatus('error');
            addNotification({ 
              type: 'warning', 
              title: 'Erreur de vérification', 
              message: error.message || 'Impossible de vérifier la disponibilité pour le moment.' 
            });
          }
        } else {
          setAvailabilityStatus('error');
          addNotification({ 
            type: 'warning', 
            title: 'Erreur Inconnue', 
            message: 'Une erreur inattendue est survenue.' 
          });
        }
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    checkAvailability();
  }, [debouncedStartDate, debouncedEndDate, vehicleId]);

  const startDateObj = startDate ? new Date(startDate) : null;
  const endDateObj = endDate ? new Date(endDate) : null;
  
  let diffHours = 0;
  let totalPrice = 0;
  
  if (startDateObj && endDateObj && startDateObj < endDateObj && vehicle) {
    diffHours = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60));
    const hourlyRate = (vehicle.ratePerDay || 0) / 24;
    totalPrice = Math.round(diffHours * hourlyRate);
  }

  const handleSubmitBooking = async () => {
    if (!startDate || !endDate) {
      addNotification({ type: 'error', title: 'Dates requises', message: 'Veuillez sélectionner une date de début et de fin.' });
      return;
    }
    
    if (availabilityStatus !== 'available') {
      addNotification({ 
        type: 'error', 
        title: 'Vérification requise', 
        message: "Ces dates ne sont pas disponibles. Veuillez en choisir d'autres." 
      });
      return;
    }

    setIsSubmitting(true);
    addNotification({ type: 'info', title: 'Traitement en cours', message: 'Création de votre réservation...', duration: 0 });

    try {
      const newBooking = await apiClient.post('/api/bookings', {
        vehicleId: Number(vehicleId),
        startDate: startDate, 
        endDate: endDate,     
        totalPrice: totalPrice,
        paymentOption: 'ONLINE'   // ← Obligatoire pour satisfaire le backend Spring Boot
      });

      setNotifications(prev => prev.filter(n => n.title !== 'Traitement en cours'));
      setCreatedBooking(newBooking);

      setShowPaymentModal(true);

    } catch (err: unknown) {
      setNotifications(prev => prev.filter(n => n.title !== 'Traitement en cours'));
      
      let errorMessage = 'La création a échoué. Veuillez réessayer.';
      if (err instanceof Error || err instanceof ApiError) {
        errorMessage = err.message;
      }

      addNotification({ type: 'error', title: 'Erreur de réservation', message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocalPaymentSubmit = async (_provider: string, phoneNumber: string, paymentCode: string) => {
    if (!createdBooking) return;
    setIsProcessingPayment(true);
    
    try {
      await apiClient.post('/api/payments/pay/mobile-money', {
        bookingId: createdBooking.id,
        phoneNumber: phoneNumber,
        transactionReference: paymentCode,
      });
      
      setShowPaymentModal(false);
      addNotification({ type: 'success', title: 'Paiement validé !', message: 'Votre réservation est maintenant confirmée.' });

      setTimeout(() => {
        router.push(`/bookings/my-bookings`);
      }, 2000);
    } catch (err: unknown) {
      let errorMessage = "Erreur lors de la déclaration du paiement.";
      if (err instanceof Error || err instanceof ApiError) errorMessage = err.message;
      addNotification({ type: 'error', title: 'Erreur de paiement', message: errorMessage });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleStripePaymentSubmit = async () => {
    if (!createdBooking) return;
    setIsProcessingPayment(true);

    const token = localStorage.getItem('jwt_token');
    if (!token) {
      addNotification({ type: 'error', title: 'Erreur', message: 'Session expirée.' });
      setIsProcessingPayment(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:8081/api/payments/booking/${createdBooking.id}/initiate-online-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) throw new Error("Impossible d'initier le paiement en ligne.");

      const data = await response.json();

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error('URL de redirection non reçue.');
      }
    } catch (err: unknown) {
      let errorMessage = "Erreur de paiement en ligne.";
      if (err instanceof Error) errorMessage = err.message;
      addNotification({ type: 'error', title: 'Erreur', message: errorMessage });
      setIsProcessingPayment(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center bg-card border border-border rounded-lg p-6 max-w-md">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Véhicule introuvable</h3>
          <p className="text-muted-foreground mb-4">Impossible de charger le véhicule demandé.</p>
          <button 
            onClick={() => router.back()} 
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retour
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
      <NotificationContainer notifications={notifications} onClose={removeNotification} />

      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button 
            onClick={() => router.back()} 
            className="inline-flex items-center text-foreground hover:text-primary transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Retour
          </button>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Finaliser votre réservation</h1>
          <p className="text-lg text-muted-foreground">Vous êtes sur le point de réserver ce véhicule via BudaxDrive.</p>
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
              <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg shadow-lg z-10">
                <p className="text-lg font-bold">{vehicle.ratePerDay?.toLocaleString('fr-FR')} FBu</p>
                <p className="text-xs opacity-90">par jour</p>
              </div>
            </div>
            
            <div className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-1">{vehicle.make} {vehicle.model}</h2>
              <p className="text-muted-foreground mb-4">{vehicle.manufacturingYear}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                {vehicle.fuelType && (
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <div className="text-sm font-semibold text-foreground">{vehicle.fuelType}</div>
                    <div className="text-xs text-muted-foreground">Carburant</div>
                  </div>
                )}
                {vehicle.transmission && (
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <div className="text-sm font-semibold text-foreground">{vehicle.transmission}</div>
                    <div className="text-xs text-muted-foreground">Transmission</div>
                  </div>
                )}
                {vehicle.seats && (
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-foreground">{vehicle.seats}</div>
                    <div className="text-xs text-muted-foreground">Sièges</div>
                  </div>
                )}
                {vehicle.mileage && (
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <div className="text-sm font-bold text-foreground">{vehicle.mileage?.toLocaleString('fr-FR')}</div>
                    <div className="text-xs text-muted-foreground">Km</div>
                  </div>
                )}
              </div>

              <hr className="my-4 border-border" />
              
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Détails de la réservation
                </h3>
                
                {diffHours > 0 ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Du</span>
                      <strong className="text-foreground">{startDateObj?.toLocaleString('fr-FR')}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Au</span>
                      <strong className="text-foreground">{endDateObj?.toLocaleString('fr-FR')}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Durée</span>
                      <strong className="text-foreground">{diffHours} heure{diffHours > 1 ? 's' : ''}</strong>
                    </div>
                    <hr className="my-2 border-border" />
                    <div className="flex justify-between text-xl font-bold text-primary">
                      <span>TOTAL</span>
                      <span>{totalPrice.toLocaleString('fr-FR')} FBu</span>
                    </div>
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">Sélectionnez vos dates pour voir le récapitulatif.</p>
                )}
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : Sélection des dates */}
          <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6">Vos dates de location</h2>
            
            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Date et heure de début</label>
                <input 
                  type="datetime-local" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  min={getMinDateTime()} 
                  className="w-full px-4 py-3 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Date et heure de fin</label>
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
                  Vérification de la disponibilité...
                </div>
              )}
            </div>

            <button 
              onClick={handleSubmitBooking} 
              disabled={isSubmitting || availabilityStatus !== 'available' || !startDate || !endDate} 
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Création de la réservation...
                </>
              ) : (
                'Réserver et Payer'
              )}
            </button>
            
            <p className="text-center text-xs text-muted-foreground mt-4">
              En cliquant sur &ldquo;Réserver et Payer&rdquo;, vous choisirez votre méthode de paiement à l&apos;étape suivante.
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
        onLocalPaymentSubmit={handleLocalPaymentSubmit}
        onStripePaymentSubmit={handleStripePaymentSubmit}
      />
    </div>
  );
}

export default function BookingCreatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Chargement de la page de réservation...</p>
        </div>
      </div>
    }>
      <BookingCreateContent />
    </Suspense>
  );
}