// src/app/components/common/Toast.tsx
// Composant de notification flottante réutilisable pour toute l'application
// Supporte les états : success, error, warning, info
// Auto-disparition après un délai configurable

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number; // en ms, 0 = pas de fermeture auto
  onClose?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const Toast: React.FC<ToastProps> = ({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  position = 'bottom-right',
}) => {
  const t = useTranslations('common');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!isVisible) return null;

  // Configuration par type
  const config = {
    success: {
      bgColor: 'bg-green-600 dark:bg-green-700',
      borderColor: 'border-green-400',
      icon: CheckCircle,
      iconColor: 'text-green-200',
    },
    error: {
      bgColor: 'bg-red-600 dark:bg-red-700',
      borderColor: 'border-red-400',
      icon: AlertCircle,
      iconColor: 'text-red-200',
    },
    warning: {
      bgColor: 'bg-amber-600 dark:bg-amber-700',
      borderColor: 'border-amber-400',
      icon: AlertTriangle,
      iconColor: 'text-amber-200',
    },
    info: {
      bgColor: 'bg-gray-700 dark:bg-gray-800',
      borderColor: 'border-gray-500',
      icon: Info,
      iconColor: 'text-gray-300',
    },
  };

  const { bgColor, borderColor, icon: IconComponent, iconColor } = config[type];

  const positionClasses = {
    'bottom-right': 'bottom-6 left-4 right-4 sm:left-auto sm:right-6',
    'bottom-left': 'bottom-6 left-4 right-4 sm:right-auto sm:left-6',
    'top-right': 'top-6 left-4 right-4 sm:left-auto sm:right-6',
    'top-left': 'top-6 left-4 right-4 sm:right-auto sm:left-6',
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 animate-in slide-in-from-bottom-4 fade-in duration-300`}
      role="alert"
      aria-live="assertive"
    >
      <div
        className={`${bgColor} text-white px-6 py-4 rounded-xl shadow-2xl border ${borderColor} flex items-start gap-4 max-w-sm`}
      >
        <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
        <div className="flex-1">
          {title && <p className="font-semibold text-sm">{title}</p>}
          <p className={`text-sm ${title ? 'mt-1' : ''}`}>{message}</p>
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-white/70 hover:text-white transition-colors mt-0.5 p-2 -m-2"
          aria-label={t('closeNotification')}
          type="button"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;