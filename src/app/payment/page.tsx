'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import UnifiedPaymentModal from '@/app/components/payment/UnifiedPaymentModal';
import { AlertTriangle, CreditCard, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

function PaymentPageContent() {
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
        toast.error("Impossible de charger les détails de la facture.");
      } finally {
        setIsLoadingPayment(false);
      }
    };

    fetchPaymentDetails();
  }, [paymentId]);

  const handleOnlinePayment = async () => {
    if (!paymentId) return;
    setIsProcessing(true);
    
    const loadingToast = toast.loading("Préparation du paiement sécurisé...");

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
      toast.error("Impossible de lancer le paiement Stripe.", { id: loadingToast });
      setIsProcessing(false);
    }
  };

  const handleLocalPayment = async (provider: string, phoneNumber: string, paymentCode: string) => {
    if (!paymentId) return;

    setIsProcessing(true);
    const loadingToast = toast.loading("Validation de votre transaction...");

    try {
      await apiClient.post('/api/payments/pay/mobile-money', {
        paymentId: paymentId,
        phoneNumber: phoneNumber,
        transactionReference: paymentCode,
      });

      setShowModal(false);
      await refreshUser();
      toast.success("Paiement validé !", { id: loadingToast, duration: 5000 });
      setPaymentSuccess(true);
      
      setTimeout(() => { router.push('/profile'); }, 5000);
    } catch {
      toast.error("Échec du paiement. Vérifiez votre code.", { id: loadingToast });
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
            <p className="text-gray-500 font-medium text-lg">Aucun paiement trouvé.</p>
        </div>
      </div>
    );
  }

  if (isLoadingPayment) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin w-12 h-12 text-blue-600 mb-4" />
        <p className="text-gray-500 font-medium">Récupération de votre facture...</p>
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
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Félicitations !</h2>
                <p className="text-gray-500 mt-2">Paiement réussi. Redirection...</p>
                <Loader2 className="animate-spin mx-auto mt-8 text-blue-600" />
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 text-center">
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CreditCard className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Paiement</h2>
          <div className="mt-10 p-6 bg-slate-50 dark:bg-gray-700/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-600">
            <span className="text-sm text-gray-500 uppercase font-bold tracking-widest">Montant à régler</span>
            <div className="text-4xl font-black text-blue-600 mt-1">
              {amount.toLocaleString()} <span className="text-xl">{currency}</span>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            disabled={isProcessing}
            className="mt-10 w-full flex justify-center items-center py-4 rounded-2xl text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <CreditCard className="mr-3 h-6 w-6" />}
            Procéder au paiement
          </button>
        </div>
      </div>
      <UnifiedPaymentModal isOpen={showModal} onClose={() => setShowModal(false)} amount={amount} currency={currency} isLoading={isProcessing} onLocalPaymentSubmit={handleLocalPayment} onStripePaymentSubmit={handleOnlinePayment} />
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-400">Chargement...</div>}>
      <PaymentPageContent />
    </Suspense>
  );
}