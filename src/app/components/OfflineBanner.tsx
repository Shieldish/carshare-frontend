'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OfflineBanner() {
  const t = useTranslations('offline');
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      toast.success(t('backOnline'));
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [t]);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-amber-500 text-white px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium shadow-lg">
      <WifiOff className="h-4 w-4 flex-shrink-0" />
      <span>{t('banner')}</span>
    </div>
  );
}
