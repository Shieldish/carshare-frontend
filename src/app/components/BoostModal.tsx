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
import { Dialog, DialogHeader, DialogTitle, DialogBody, Button } from '@/app/components/ui';

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
      <Dialog open={step === 'SELECT_BOOST'} onClose={onClose} size="md">
        <DialogHeader onClose={onClose}>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="text-primary" /> {t('title')}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="pt-6">
          {error && (
            <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-small text-destructive">
              {error}
            </div>
          )}

          {/* Sélecteur de Durée */}
          <div className="mb-6 flex rounded-xl bg-muted p-1">
            <button
              onClick={() => setDuration(1)}
              className={`flex-1 rounded-lg py-2 text-small font-bold transition-all ${
                duration === 1 ? 'bg-card text-primary shadow' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('durationMonth')}
            </button>
            <button
              onClick={() => setDuration(12)}
              className={`flex flex-1 flex-wrap items-center justify-center gap-1 rounded-lg py-2 text-small font-bold transition-all ${
                duration === 12 ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar size={16} /> {t('durationYear')}{' '}
              <span className="ml-1 rounded-full bg-accent px-1.5 py-0.5 text-micro text-accent-foreground">{t('yearDiscountBadge')}</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* Bannière de réduction pour les membres Premium */}
            {isPremiumUser && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-small text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
                <Sparkles className="h-4 w-4 flex-shrink-0" />
                {t('premiumBanner')}
              </div>
            )}

            {/* Sur petit écran, le prix passe sous le titre : côte à côte, ils n'avaient plus la
                place de tenir (prix sur deux lignes, ruban "Populaire" par-dessus). */}
            {/* STANDARD */}
            <button
              onClick={() => handleInitiateBoost('STANDARD')}
              disabled={isLoading}
              className="group flex w-full flex-col gap-2 rounded-xl border border-border p-4 text-left transition-all hover:border-primary hover:bg-primary/5 disabled:opacity-50 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center">
                <div className="mr-3 shrink-0 rounded-lg bg-muted p-2 transition-colors group-hover:bg-primary/20">
                  <Zap size={20} className="text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground group-hover:text-primary">{t('standardTitle')}</h3>
                  <p className="text-small text-muted-foreground">{t('standardDesc')}</p>
                </div>
              </div>
              <div className="whitespace-nowrap text-right sm:shrink-0">
                <span className="text-lg font-bold text-foreground">{getPrice(5000).toLocaleString()} FBu</span>
                {isPremiumUser && (
                  <p className="text-small text-muted-foreground line-through">{getOriginalPrice(5000).toLocaleString()} FBu</p>
                )}
              </div>
            </button>

            {/* PREMIUM */}
            <button
              onClick={() => handleInitiateBoost('PREMIUM')}
              disabled={isLoading}
              className="group relative flex w-full flex-col gap-2 overflow-hidden rounded-xl border-2 border-primary bg-primary/5 p-4 text-left transition-all hover:bg-primary/10 disabled:opacity-50 dark:bg-primary/10 dark:hover:bg-primary/20 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="absolute right-0 top-0 rounded-bl-lg bg-primary px-2 py-1 text-micro font-bold text-primary-foreground">
                {t('popularBadge')}
              </div>
              <div className="flex min-w-0 items-center">
                <div className="mr-3 shrink-0 rounded-lg bg-primary p-2">
                  <Crown size={20} className="text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground group-hover:text-primary/80">{t('premiumTitle')}</h3>
                  <p className="text-small text-muted-foreground">{t('premiumDesc')}</p>
                </div>
              </div>
              <div className="whitespace-nowrap text-right sm:shrink-0">
                <span className="text-lg font-bold text-primary">{getPrice(15000).toLocaleString()} FBu</span>
                {isPremiumUser && (
                  <p className="text-small text-primary/60 line-through">{getOriginalPrice(15000).toLocaleString()} FBu</p>
                )}
              </div>
            </button>

            {/* ULTRA */}
            <button
              onClick={() => handleInitiateBoost('ULTRA')}
              disabled={isLoading}
              className="group flex w-full flex-col gap-2 rounded-xl border border-border p-4 text-left transition-all hover:border-purple-500 hover:bg-purple-50 disabled:opacity-50 dark:hover:bg-purple-900/20 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center">
                <div className="mr-3 shrink-0 rounded-lg bg-purple-100 p-2 transition-colors group-hover:bg-purple-200 dark:bg-purple-900/30 dark:group-hover:bg-purple-900/50">
                  <Zap size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400">{t('ultraTitle')}</h3>
                  <p className="text-small text-muted-foreground">{t('ultraDesc')}</p>
                </div>
              </div>
              <div className="whitespace-nowrap text-right sm:shrink-0">
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{getPrice(30000).toLocaleString()} FBu</span>
                {isPremiumUser && (
                  <p className="text-small text-muted-foreground line-through">{getOriginalPrice(30000).toLocaleString()} FBu</p>
                )}
              </div>
            </button>

            {isLoading && (
              <div className="mt-4 flex justify-center">
                <Loader2 className="animate-spin text-primary" size={28} />
              </div>
            )}
          </div>
        </DialogBody>
      </Dialog>

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

      <Dialog open={step === 'SUCCESS'} onClose={onClose} size="md">
        <DialogBody className="pt-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="mb-2 text-h2 text-foreground">{t('successTitle')}</h2>
          <p className="mb-8 text-muted-foreground">{t('successMessage', { months: duration })}</p>
          <Button onClick={onClose} className="w-full" size="lg">
            {t('backToDashboard')}
          </Button>
        </DialogBody>
      </Dialog>
    </>
  );
}