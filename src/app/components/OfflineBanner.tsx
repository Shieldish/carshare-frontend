'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';

const subscribeToConnection = (onChange: () => void) => {
  window.addEventListener('offline', onChange);
  window.addEventListener('online', onChange);
  return () => {
    window.removeEventListener('offline', onChange);
    window.removeEventListener('online', onChange);
  };
};

export default function OfflineBanner() {
  const t = useTranslations('offline');
  const isOffline = useSyncExternalStore(subscribeToConnection, () => !navigator.onLine, () => false);

  useEffect(() => {
    const handleOnline = () => {
      toast.success(t('backOnline'));
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [t]);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-amber-500 text-white px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium shadow-lg">
      <WifiOff className="h-4 w-4 flex-shrink-0" />
      <span>{t('banner')}</span>
    </div>
  );
}
