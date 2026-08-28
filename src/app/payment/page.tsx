'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import UnifiedPaymentModal from '@/app/components/payment/UnifiedPaymentModal';
import { AlertTriangle, CreditCard, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

function PaymentPageContent() {
  const t = useTranslations('payment.page');
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get('paymentId');
  const paymentType = searchParams.get('type');
  const { refreshUser } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('BIF');
  const [isLoadingPayment, setIsLoadingPayment] = useState(true);
  
  // ✅ Nouvel état pour sécuriser le type de paiement via le backend
  const [realPaymentType, setRealPaymentType] = useState<string | null>(null);

  useEffect(() => {
    if (!paymentId) {
      setIsLoadingPayment(false);
      return;
    }

    const fetchPaymentDetails = async () => {
      try {
        const data = await apiClient.get(`/api/payments/${paymentId}`);
        setAmount(data.amountTotal || data.amount || 0);
        setCurrency(data.currency || 'BIF');
        // ✅ On récupère le type réel (ex: PREMIUM, BOOST) pour éviter les erreurs d'URL
        setRealPaymentType(data.type || data.paymentType || null);
      } catch {
        console.error("Erreur lors de la récupération du paiement");
        toast.error(t('invoiceLoadError'));
      } finally {
        setIsLoadingPayment(false);
      }
    };

    fetchPaymentDetails();
  }, [paymentId, t]);

  const handleOnlinePayment = async () => {
    if (!paymentId) return;
    setIsProcessing(true);
    
    const loadingToast = toast.loading(t('preparingPayment'));

    try {
      const response = await apiClient.post(
        `/api/payments/${paymentId}/initiate-online-payment`,
        {}
      ) as { redirectUrl: string };

      if (response && response.redirectUrl) {
        toast.dismiss(loadingToast);
        
        // ✅ Priorité au type venant du backend, normalisé en minuscules
        const finalSource = (realPaymentType || paymentType || 'reservation').toLowerCase();
        sessionStorage.setItem('paymentSource', finalSource);
        
        window.location.href = response.redirectUrl;
      }
    } catch {
      toast.error(t('stripeLaunchError'), { id: loadingToast });
      setIsProcessing(false);
    }
  };

  const handleLocalPayment = async (provider: string, phoneNumber: string, paymentCode: string) => {
    if (!paymentId) return;

    setIsProcessing(true);
    const loadingToast = toast.loading(t('validatingTransaction'));

    try {
      await apiClient.post('/api/payments/pay/mobile-money', {
        paymentId: paymentId,
        phoneNumber: phoneNumber,
        transactionReference: paymentCode,
      });

      setShowModal(false);
      await refreshUser();
      toast.success(t('paymentValidated'), { id: loadingToast, duration: 5000 });
      setPaymentSuccess(true);

      setTimeout(() => { router.push('/profile'); }, 5000);
    } catch {
      toast.error(t('paymentFailed'), { id: loadingToast });
      setIsProcessing(false);
    }
  };

  if (!paymentId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-10">
        <div className="text-center space-y-4">
            <div className="bg-gray-200 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium text-lg">{t('noPaymentFound')}</p>
        </div>
      </div>
    );
  }

  if (isLoadingPayment) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin w-12 h-12 text-primary mb-4" />
        <p className="text-gray-500 font-medium">{t('loadingInvoice')}</p>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
            <div className="text-center animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('congratulations')}</h2>
                <p className="text-gray-500 mt-2">{t('successRedirecting')}</p>
                <Loader2 className="animate-spin mx-auto mt-8 text-primary" />
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 p-6 sm:p-10 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 text-center">
          <div className="w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CreditCard className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{t('title')}</h2>
          <div className="mt-10 p-6 bg-slate-50 dark:bg-gray-700/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-600">
            <span className="text-sm text-gray-500 uppercase font-bold tracking-widest">{t('amountDue')}</span>
            <div className="text-4xl font-black text-primary mt-1">
              {amount.toLocaleString()} <span className="text-xl">{currency}</span>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            disabled={isProcessing}
            className="mt-10 w-full flex justify-center items-center py-4 rounded-2xl text-lg font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <CreditCard className="mr-3 h-6 w-6" />}
            {t('proceedToPayment')}
          </button>
        </div>
      </div>
      <UnifiedPaymentModal isOpen={showModal} onClose={() => setShowModal(false)} amount={amount} currency={currency} isLoading={isProcessing} onLocalPaymentSubmit={handleLocalPayment} onStripePaymentSubmit={handleOnlinePayment} />
    </div>
  );
}

function PaymentPageFallback() {
  const t = useTranslations('common');
  return <div className="min-h-screen flex items-center justify-center text-gray-400">{t('loading')}</div>;
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentPageFallback />}>
      <PaymentPageContent />
    </Suspense>
  );
}