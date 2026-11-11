'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';

function CancelContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile = searchParams.get('platform') === 'mobile';

  useEffect(() => {
    if (isMobile) {
      setTimeout(() => {
        window.location.href = 'budaxdrive://payment/cancel';
      }, 800);
    }
  }, [isMobile]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <div className="text-center bg-white dark:bg-gray-800 p-6 sm:p-12 rounded-2xl shadow-xl max-w-md w-full mx-4 border border-gray-100 dark:border-gray-700">
        <XCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paiement annulé</h1>
        <p className="text-gray-600 dark:text-gray-300 my-6">
          Votre transaction a été annulée. Aucun prélèvement n'a été effectué.
        </p>

        {isMobile ? (
          <a
            href="budaxdrive://payment/cancel"
            className="inline-block bg-primary text-primary-foreground py-3 px-8 rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-md"
          >
            Retourner à l'application BudaxDrive
          </a>
        ) : (
          <button
            onClick={() => router.push('/bookings/my-bookings')}
            className="bg-primary text-primary-foreground py-2 px-8 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Retour à mes réservations
          </button>
        )}
      </div>
    </div>
  );
}

export default function CancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-950 bg-gray-50">
        <p className="text-gray-600 dark:text-gray-300">Chargement...</p>
      </div>
    }>
      <CancelContent />
    </Suspense>
  );
}

