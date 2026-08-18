'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Vehicle } from '@/types/vehicle';
import UnifiedPaymentModal from '@/app/components/payment/UnifiedPaymentModal';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

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
  const t = useTranslations('bookings.formWithPayment');
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
  const [paymentModalError, setPaymentModalError] = useState<string | null>(null);

  // ✅ Facturation à la journée entière (comme le backend) : toute portion de
  // journée entamée compte pour un jour complet, ex. 25h = 2 jours.
  const calculateNumberOfDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    if (diffMinutes <= 0) return 0;
    return Math.ceil(diffMinutes / (24 * 60));
  };

  const numberOfDays = calculateNumberOfDays();
  const totalPrice = numberOfDays * (vehicle.ratePerDay || 0);

  // Création de la réservation + Ouverture instantanée de la modale de paiement
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast.error(t('errorSelectDates'));
      setBookingError(t('errorSelectDates'));
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      toast.error(t('errorEndBeforeStart'));
      setBookingError(t('errorEndBeforeStart'));
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
      setPaymentModalError(null);
      setShowPaymentModal(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('errorCreatingBooking');
      toast.error(message);
      setBookingError(message);
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
    setPaymentModalError(null);

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
      console.error("Erreur de paiement:", err);
      const message = err instanceof Error ? err.message : t('paymentFailedAlert');
      toast.error(message);
      setPaymentModalError(message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Paiement Stripe (via UnifiedPaymentModal)
  const handleStripePaymentSubmit = async () => {
    if (!createdBooking) return;

    setIsProcessingPayment(true);
    setPaymentModalError(null);

    const token = localStorage.getItem('jwt_token');
    if (!token) {
      toast.error(t('sessionExpiredAlert'));
      setPaymentModalError(t('sessionExpiredAlert'));
      setIsProcessingPayment(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'}/api/payments/booking/${createdBooking.id}/initiate-online-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) throw new Error(t('onlinePaymentInitError'));

      const data = await response.json();

      if (data.redirectUrl) {
        // Le paiement Stripe quitte la page : payment/callback lit cette valeur pour savoir
        // qu'il s'agissait d'une réservation et rediriger au bon endroit au retour.
        sessionStorage.setItem('paymentSource', 'booking');
        window.location.href = data.redirectUrl;
      } else {
        throw new Error(t('missingRedirectUrl'));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('genericPaymentError');
      toast.error(message);
      setPaymentModalError(message);
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
            {t('stepBooking')}
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
            {t('stepConfirmed')}
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
              {currentStep === 'dates' && t('headerTitleDates')}
              {currentStep === 'success' && t('headerTitleSuccess')}
            </h3>
            <p className="text-blue-100 mt-1">
              {currentStep === 'dates' && t('headerSubtitleDates')}
              {currentStep === 'success' && t('headerSubtitleSuccess')}
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
                  {t('startDateLabel')}
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
                  {t('endDateLabel')}
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

            {startDate && endDate && numberOfDays > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6 border border-blue-100 dark:border-blue-800">
                <div className="flex justify-between items-center text-lg font-bold text-blue-900 dark:text-blue-100">
                  <span>{t('totalForDays', { days: numberOfDays, dayWord: numberOfDays > 1 ? t('dayPlural') : t('daySingular') })}</span>
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
                <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>{t('creating')}</>
              ) : (
                t('reserveAndPay')
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
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('successTitle')}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {t('successSubtitle')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push('/bookings/my-bookings')}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:bg-blue-700"
              >
                {t('viewMyBookings')}
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300"
              >
                {t('backToHome')}
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
        errorMessage={paymentModalError}
        onLocalPaymentSubmit={handleLocalPaymentSubmit}
        onStripePaymentSubmit={handleStripePaymentSubmit}
      />
    </div>
  );
};

export default BookingFormWithPayment;