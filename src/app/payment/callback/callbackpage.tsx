'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

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
          setErrorMessage(err instanceof Error ? err.message : 'Échec de la confirmation.');
          setStatus('error');
        }
      } else {
        setErrorMessage("Données de transaction manquantes.");
        setStatus('error');
      }
    };

    processPayment();
  }, [searchParams, refreshUser]);

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
        return '/profile';
      default:
        return '/profile';
    }
  };

  // Fonction pour obtenir le message de succès selon la source
  const getSuccessContent = (paymentSource: string | null) => {
    if (!paymentSource) {
      return {
        message: "Votre transaction a été confirmée avec succès. Merci de votre confiance.",
        buttonText: "Continuer",
        buttonAction: () => router.push('/profile'),
      };
    }

    const normalizedSource = paymentSource.toUpperCase();

    switch (normalizedSource) {
      case 'BOOKING':
      case 'BOOKING_PAYMENT':
        return {
          message: "Paiement validé ! Votre réservation est confirmée et prête pour le départ. Vous pouvez maintenant accéder à tous les détails de votre location.",
          buttonText: "Voir mes réservations",
          buttonAction: () => router.push('/bookings/my-bookings'),
        };
      case 'PREMIUM':
      case 'PREMIUM_SUBSCRIPTION':
        return {
          message: "Félicitations ! Votre compte est désormais Premium. Profitez de tous les avantages exclusifs.",
          buttonText: "Mon Profil",
          buttonAction: () => router.push('/profile'),
        };
      case 'BOOST':
      case 'VEHICLE_BOOST':
        return {
          message: "Félicitations ! Votre véhicule bénéficie désormais d'une visibilité boostée pendant 7 jours.",
          buttonText: "Mes Véhicules",
          buttonAction: () => router.push('/profile'),
        };
      default:
        return {
          message: "Votre transaction a été confirmée avec succès. Merci de votre confiance.",
          buttonText: "Continuer",
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Vérification...</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-3">Veuillez patienter pendant que nous confirmez votre paiement.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paiement Réussi !</h1>
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Erreur de Paiement</h1>
            <p className="text-gray-600 dark:text-gray-300 my-6">{errorMessage}</p>
            <button 
              onClick={() => router.push(getRedirectPath(source))}
              className="bg-gray-600 text-white py-2 px-8 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Retour
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-950 bg-gray-50">
        <div className="text-center">
          <Loader className="w-8 h-8 text-primary mx-auto animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Chargement...</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}