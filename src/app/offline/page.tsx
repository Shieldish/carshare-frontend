'use client';

import { useTranslations } from 'next-intl';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  const t = useTranslations('offline');

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6">
        <WifiOff className="h-8 w-8 text-amber-600 dark:text-amber-400" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('pageTitle')}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">{t('pageMessage')}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          {t('retryButton')}
        </button>
        {/*
          Navigation dure volontaire (pas <Link>) : cette page peut être servie
          hors ligne depuis le cache du service worker, où le routeur client de
          Next.js (fetch RSC) échouerait silencieusement. Un <a href> déclenche une
          vraie requête de navigation, que le service worker sait intercepter.
        */}
        <a
          href="/"
          className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
        >
          {t('backHomeButton')}
        </a>
      </div>
    </div>
  );
}
