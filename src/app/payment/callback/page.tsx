'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { useTranslations } from 'next-intl';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const t = useTranslations('payment.callback');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    const urlSource = searchParams.get('source');
    const storageSource = typeof window !== 'undefined' ? sessionStorage.getItem('paymentSource') : null;
    const finalSource = urlSource || storageSource;
    setSource(finalSource);

    const processPayment = async () => {
      const paymentStatus = searchParams.get('status');
      const transactionId = searchParams.get('tx_id') || searchParams.get('session_id');
      const referenceId = searchParams.get('ref');

      if ((paymentStatus === 'success' || transactionId) && referenceId) {
        try {
          await apiClient.post('/webhooks/payment-confirmed', {
            transactionId: transactionId,
            paymentId: referenceId,
          });

          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('paymentSource');
            localStorage.removeItem('pendingPremiumPayment');
          }

          await refreshUser();
          setStatus('success');
        } catch (err) {
          setErrorMessage(err instanceof Error ? err.message : t('confirmationFailed'));
          setStatus('error');
        }
      } else {
        setErrorMessage(t('missingTransactionData'));
        setStatus('error');
      }
    };

    processPayment();
  }, [searchParams, refreshUser, t]);

  // Fonction pour obtenir la destination de redirection selon la source
  const getRedirectPath = (paymentSource: string | null): string => {
    if (!paymentSource) return '/profile';
    
    const normalizedSource = paymentSource.toUpperCase();
    
    switch (normalizedSource) {
      case 'BOOKING':
      case 'BOOKING_PAYMENT':
        return '/bookings/my-bookings';
      case 'PREMIUM':
      case 'PREMIUM_SUBSCRIPTION':
        return '/profile';
      case 'BOOST':
      case 'VEHICLE_BOOST':
        return '/vehicles';
      default:
        return '/profile';
    }
  };

  // Fonction pour obtenir le message de succès selon la source
  const getSuccessContent = (paymentSource: string | null) => {
    if (!paymentSource) {
      return {
        message: t('default.message'),
        buttonText: t('default.button'),
        buttonAction: () => router.push('/profile'),
      };
    }

    const normalizedSource = paymentSource.toUpperCase();

    switch (normalizedSource) {
      case 'BOOKING':
      case 'BOOKING_PAYMENT':
        return {
          message: t('booking.message'),
          buttonText: t('booking.button'),
          buttonAction: () => router.push('/bookings/my-bookings'),
        };
      case 'PREMIUM':
      case 'PREMIUM_SUBSCRIPTION':
        return {
          message: t('premium.message'),
          buttonText: t('premium.button'),
          buttonAction: () => router.push('/profile'),
        };
      case 'BOOST':
      case 'VEHICLE_BOOST':
        return {
          message: t('boost.message'),
          buttonText: t('boost.button'),
          buttonAction: () => router.push('/vehicles'),
        };
      default:
        return {
          message: t('default.message'),
          buttonText: t('default.button'),
          buttonAction: () => router.push('/profile'),
        };
    }
  };

  const successContent = getSuccessContent(source);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <div className="text-center bg-white dark:bg-gray-800 p-6 sm:p-12 rounded-2xl shadow-xl max-w-md w-full mx-4 border border-gray-100 dark:border-gray-700">
        
        {status === 'loading' && (
          <>
            <Loader className="w-16 h-16 text-primary mx-auto animate-spin mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('verifyingTitle')}</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-3">{t('verifyingSubtitle')}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('successTitle')}</h1>
            <p className="text-gray-600 dark:text-gray-300 my-6">
              {successContent.message}
            </p>
            <button 
              onClick={successContent.buttonAction}
              className="bg-primary text-primary-foreground py-2 px-8 rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              {successContent.buttonText}
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('errorTitle')}</h1>
            <p className="text-gray-600 dark:text-gray-300 my-6">{errorMessage}</p>
            <button
              onClick={() => router.push(getRedirectPath(source))}
              className="bg-gray-600 text-white py-2 px-8 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              {t('backButton')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  const t = useTranslations('payment.callback');
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-950 bg-gray-50">
        <div className="text-center">
          <Loader className="w-8 h-8 text-primary mx-auto animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-300">{t('loading')}</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}