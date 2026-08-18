'use client';

import { useState } from 'react';
import { Vehicle } from '@/types/vehicle';
import { Loader2, CheckCircle, Zap, TrendingUp, Crown, Calendar, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import UnifiedPaymentModal from '@/app/components/payment/UnifiedPaymentModal';
import { useAuth } from '@/context/AuthContext';
import { useTranslations } from 'next-intl';
import { ApiError } from '@/lib/apiClient';
import { getApiErrorMessageKey } from '@/lib/apiErrorMessages';

interface BoostModalProps {
  vehicle: Vehicle;
  onClose: () => void;
  onBoostSuccess: (vehicleId: number) => void;
}

type Step = 'SELECT_BOOST' | 'SELECT_PAYMENT' | 'SUCCESS';

interface PaymentData {
  paymentId: string;
  amount: number;
  currency: string;
}

export default function BoostModal({ vehicle, onClose, onBoostSuccess }: BoostModalProps) {
  const t = useTranslations('vehicles.boost');
  const tToast = useTranslations('toast.errors');
  const { user } = useAuth();
  const isPremiumUser = user?.isPremium;

  const [step, setStep] = useState<Step>('SELECT_BOOST');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [duration, setDuration] = useState<1 | 12>(1);

  // Prix affiché (avec remise Premium si applicable)
  const getPrice = (basePrice: number) => {
    let price = duration === 12 ? basePrice * 10 : basePrice;
    if (isPremiumUser) {
      price = price * 0.8;
    }
    return price;
  };

  // Prix original (barré pour les utilisateurs Premium)
  const getOriginalPrice = (basePrice: number) => {
    return duration === 12 ? basePrice * 10 : basePrice;
  };

  const handleInitiateBoost = async (boostType: 'STANDARD' | 'PREMIUM' | 'ULTRA') => {
    setIsLoading(true);
    setError(null);

    const token = localStorage.getItem('jwt_token');
    if (!token) {
      setError(t('notLoggedInError'));
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'}/api/promotions/boost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          boostType: boostType,
          durationInMonths: duration,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(errorData.message || t('genericBoostError'), response.status, errorData.code);
      }

      const data = await response.json();

      if (data.paymentId) {
        setPaymentData({
          paymentId: data.paymentId,
          amount: data.amount,
          currency: data.currency || 'FBu',
        });
        setStep('SELECT_PAYMENT');
      } else {
        throw new Error(t('missingPaymentId'));
      }
    } catch (err: unknown) {
      // ✅ Les erreurs avec un code connu (ex. TOO_MANY_PENDING_BOOST_PAYMENTS) sont
      // traduites dans la langue active au lieu d'afficher le message brut du backend
      // (toujours en anglais).
      if (err instanceof ApiError) {
        const key = getApiErrorMessageKey(err);
        setError(key === 'generic' && err.message ? err.message : tToast(key));
      } else {
        setError(err instanceof Error ? err.message : t('genericBoostError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnlinePayment = async () => {
    if (!paymentData) return;
    setIsLoading(true);
    setError(null);

    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'}/api/payments/${paymentData.paymentId}/initiate-online-payment`,
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
        // qu'il s'agissait d'un boost et rediriger au bon endroit au retour.
        sessionStorage.setItem('paymentSource', 'boost');
        window.location.href = data.redirectUrl;
      } else {
        throw new Error(t('missingRedirectUrl'));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('onlinePaymentError'));
      setIsLoading(false);
    }
  };

  const handleLocalPaymentSubmit = async (provider: string, phoneNumber: string, paymentCode: string) => {
    if (!paymentData) return;
    setIsLoading(true);
    setError(null);

    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'}/api/payments/pay/mobile-money`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentId: paymentData.paymentId,
          phoneNumber: phoneNumber,
          transactionReference: paymentCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || t('mobilePaymentError'));
      }

      onBoostSuccess(vehicle.id);
      setStep('SUCCESS');

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('mobilePaymentError');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {step === 'SELECT_BOOST' && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full">

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <TrendingUp className="mr-2 text-blue-600" /> {t('title')}
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold">
                ×
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Sélecteur de Durée */}
            <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-xl flex mb-6">
              <button
                onClick={() => setDuration(1)}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                  duration === 1 ? 'bg-white dark:bg-gray-800 shadow text-blue-600' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                {t('durationMonth')}
              </button>
              <button
                onClick={() => setDuration(12)}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  duration === 12 ? 'bg-blue-600 shadow text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <Calendar size={16} /> {t('durationYear')} <span className="text-[10px] ml-1 bg-yellow-400 text-black px-1.5 py-0.5 rounded-full">{t('yearDiscountBadge')}</span>
              </button>
            </div>

            <div className="space-y-4">

              {/* Bannière de réduction pour les membres Premium */}
              {isPremiumUser && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 p-3 rounded-lg text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 flex-shrink-0" />
                  {t('premiumBanner')}
                </div>
              )}

              {/* STANDARD */}
              <button
                onClick={() => handleInitiateBoost('STANDARD')}
                disabled={isLoading}
                className="w-full group p-4 border border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left flex justify-between items-center disabled:opacity-50"
              >
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3 group-hover:bg-blue-200 transition-colors">
                    <Zap size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-blue-600">{t('standardTitle')}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('standardDesc')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-lg text-blue-600">{getPrice(5000).toLocaleString()} FBu</span>
                  {isPremiumUser && (
                    <p className="text-xs text-gray-400 line-through">{getOriginalPrice(5000).toLocaleString()} FBu</p>
                  )}
                </div>
              </button>

              {/* PREMIUM */}
              <button
                onClick={() => handleInitiateBoost('PREMIUM')}
                disabled={isLoading}
                className="w-full group p-4 border-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all text-left flex justify-between items-center relative overflow-hidden disabled:opacity-50"
              >
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">
                  {t('popularBadge')}
                </div>
                <div className="flex items-center">
                  <div className="bg-blue-600 p-2 rounded-lg mr-3">
                    <Crown size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-blue-700">{t('premiumTitle')}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('premiumDesc')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-lg text-blue-700">{getPrice(15000).toLocaleString()} FBu</span>
                  {isPremiumUser && (
                    <p className="text-xs text-blue-400 line-through">{getOriginalPrice(15000).toLocaleString()} FBu</p>
                  )}
                </div>
              </button>

              {/* ULTRA */}
              <button
                onClick={() => handleInitiateBoost('ULTRA')}
                disabled={isLoading}
                className="w-full group p-4 border border-gray-300 dark:border-gray-600 rounded-xl hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-left flex justify-between items-center disabled:opacity-50"
              >
                <div className="flex items-center">
                  <div className="bg-purple-100 p-2 rounded-lg mr-3 group-hover:bg-purple-200 transition-colors">
                    <Zap size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-purple-600">{t('ultraTitle')}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('ultraDesc')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-lg text-purple-600">{getPrice(30000).toLocaleString()} FBu</span>
                  {isPremiumUser && (
                    <p className="text-xs text-gray-400 line-through">{getOriginalPrice(30000).toLocaleString()} FBu</p>
                  )}
                </div>
              </button>

              {isLoading && (
                <div className="flex justify-center mt-4">
                  <Loader2 className="animate-spin text-blue-600" size={28} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 'SELECT_PAYMENT' && paymentData && (
        <UnifiedPaymentModal
          isOpen={true}
          onClose={() => setStep('SELECT_BOOST')}
          amount={paymentData.amount}
          currency={paymentData.currency}
          isLoading={isLoading}
          errorMessage={error}
          onLocalPaymentSubmit={handleLocalPaymentSubmit}
          onStripePaymentSubmit={handleOnlinePayment}
        />
      )}

      {step === 'SUCCESS' && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('successTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              {t('successMessage', { months: duration })}
            </p>
            <button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-bold transition-colors shadow-lg"
            >
              {t('backToDashboard')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}