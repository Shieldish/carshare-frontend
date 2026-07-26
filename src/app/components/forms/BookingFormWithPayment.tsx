'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Vehicle } from '@/types/vehicle';
import UnifiedPaymentModal from '@/app/components/payment/UnifiedPaymentModal';

interface BookingFormWithPaymentProps {
  vehicle: Vehicle;
  vehicleId: number;
}

// On simplifie les étapes : soit on choisit les dates, soit c'est un succès !
type BookingStep = 'dates' | 'success';

type CreatedBooking = {
  id: number;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED';
  payment?: {
    status: 'PENDING' | 'CAPTURED';
  };
};

const BookingFormWithPayment: React.FC<BookingFormWithPaymentProps> = ({
  vehicle,
  vehicleId,
}) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<BookingStep>('dates');
  const [createdBooking, setCreatedBooking] = useState<CreatedBooking | null>(null);

  // États pour le formulaire de dates
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset() + 30);
    return now.toISOString().slice(0, 16);
  };

  // États pour la modale de paiement
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const calculateTotalPrice = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    if (diffHours <= 0) return 0;
    const hourlyRate = (vehicle.ratePerDay || 0) / 24;
    return Math.round(diffHours * hourlyRate);
  };

  const totalPrice = calculateTotalPrice();
  const numberOfHours =
    startDate && endDate
      ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60))
      : 0;

  // Création de la réservation + Ouverture instantanée de la modale de paiement
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      setBookingError('Veuillez sélectionner les dates de début et de fin');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setBookingError('La date de fin doit être postérieure à la date de début');
      return;
    }

    setIsSubmittingBooking(true);
    setBookingError('');

    try {
      // 1. Création silencieuse de la réservation en base de données
      const bookingData = await apiClient.post('/api/bookings', {
        vehicleId,
        startDate: startDate,
        endDate: endDate,
        totalPrice,
      });

      setCreatedBooking(bookingData);
      
      // 2. BAM ! On ouvre directement la modale de paiement, pas d'écran intermédiaire
      setShowPaymentModal(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setBookingError(err.message);
      } else {
        setBookingError('Erreur lors de la création de la réservation');
      }
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Paiement Mobile Money (via UnifiedPaymentModal)
  const handleLocalPaymentSubmit = async (
    _provider: string,
    phoneNumber: string,
    paymentCode: string
  ) => {
    if (!createdBooking) return;

    setIsProcessingPayment(true);

    try {
      await apiClient.post('/api/payments/pay/mobile-money', {
        bookingId: createdBooking.id,
        phoneNumber: phoneNumber,
        transactionReference: paymentCode,
      });

      setCreatedBooking((prev) =>
        prev ? { ...prev, status: 'CONFIRMED', payment: { status: 'CAPTURED' } } : null
      );

      // Fermer la modale et afficher l'écran de succès
      setShowPaymentModal(false);
      setCurrentStep('success');
    } catch (err: unknown) {
      // Si erreur, on garde la modale ouverte et on pourrait afficher un toast d'erreur ici
      console.error("Erreur de paiement:", err);
      alert(err instanceof Error ? err.message : 'Le paiement a échoué.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Paiement Stripe (via UnifiedPaymentModal)
  const handleStripePaymentSubmit = async () => {
    if (!createdBooking) return;

    setIsProcessingPayment(true);

    const token = localStorage.getItem('jwt_token');
    if (!token) {
      alert('Session expirée. Veuillez vous reconnecter.');
      setIsProcessingPayment(false);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8081/api/payments/booking/${createdBooking.id}/initiate-online-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) throw new Error("Impossible d'initier le paiement en ligne.");

      const data = await response.json();

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error('URL de redirection non reçue.');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur de paiement.');
      setIsProcessingPayment(false);
    }
  };

  // Indicateur d'étapes simplifié (Seulement 2 étapes)
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
            currentStep === 'dates' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
          }`}>
            {currentStep === 'success' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : '1'}
          </div>
          <span className={`ml-2 text-sm font-medium ${currentStep === 'dates' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
            Réservation
          </span>
        </div>
        
        <div className={`w-16 h-0.5 transition-colors ${currentStep === 'success' ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
        
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
            currentStep === 'success' ? 'bg-green-600 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
          }`}>
            {currentStep === 'success' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : '2'}
          </div>
          <span className={`ml-2 text-sm font-medium ${currentStep === 'success' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
            Confirmé
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden relative">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
        <div className="flex items-center">
          <div className="bg-white/20 rounded-full p-3 mr-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">
              {currentStep === 'dates' && 'Réservez votre véhicule'}
              {currentStep === 'success' && 'Réservation confirmée !'}
            </h3>
            <p className="text-blue-100 mt-1">
              {currentStep === 'dates' && 'Choisissez vos dates et procédez au paiement'}
              {currentStep === 'success' && 'Votre véhicule est réservé avec succès'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-8">
        <StepIndicator />

        {/* Étape 1: Dates et Bouton d'action direct */}
        {currentStep === 'dates' && (
          <form onSubmit={handleBookingSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date et heure de début
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={getMinDateTime()}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date et heure de fin
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || getMinDateTime()}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {startDate && endDate && numberOfHours > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6 border border-blue-100 dark:border-blue-800">
                <div className="flex justify-between items-center text-lg font-bold text-blue-900 dark:text-blue-100">
                  <span>Total pour {numberOfHours}h</span>
                  <span>{totalPrice.toLocaleString()} FBu</span>
                </div>
              </div>
            )}

            {bookingError && (
              <div className="p-4 bg-red-100 text-red-700 rounded-lg text-sm">{bookingError}</div>
            )}

            <button
              type="submit"
              disabled={isSubmittingBooking || !startDate || !endDate}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-lg hover:shadow-xl flex items-center justify-center"
            >
              {isSubmittingBooking ? (
                <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>Création...</>
              ) : (
                'Réserver et Payer'
              )}
            </button>
          </form>
        )}

        {/* Étape 2: Succès */}
        {currentStep === 'success' && createdBooking && (
          <div className="text-center space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Paiement déclaré avec succès !</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Votre transaction est en cours de vérification. Vous recevrez une notification une fois validée.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push('/bookings/my-bookings')}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:bg-blue-700"
              >
                Voir mes réservations
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300"
              >
                Retour à l&apos;accueil
              </button>
            </div>
          </div>
        )}
      </div>

      {/* UnifiedPaymentModal - Modale centralisée */}
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
};

export default BookingFormWithPayment;