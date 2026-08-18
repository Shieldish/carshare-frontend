'use client';

// ✅ IMPORT DE 'use' AJOUTÉ (Next.js 15)
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/apiClient';
import type { BookingStatus } from '@/types/booking';
import PhoneInputModal from '@/app/bookings/my-bookings/PhoneInputModal';
import { MessageCircle, Phone, ArrowLeft, Clock, CheckCircle, AlertCircle, Building2, Shield, Circle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

// ✅ TYPE MIS À JOUR : params est une Promise
type ContactPageProps = {
  params: Promise<{ id: string }>;
};

type BookingWithDetails = {
  id: number;
  totalPrice: number;
  startDate: string;
  endDate: string;
  status: BookingStatus;
  vehicle: {
    id: number;
    make: string;
    model: string;
    manufacturingYear: number;
    images?: Array<{ url: string }>;
    owner: {
      id: number;
      firstName: string;
      lastName: string;
    };
  };
  payment: {
    id: string;
    status: 'PENDING' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
  } | null;
};

export default function BookingContactPage({ params }: ContactPageProps) {
  // ✅ DÉBALLAGE DES PARAMS AVEC use()
  const resolvedParams = use(params);
  const bookingId = resolvedParams.id;

  const t = useTranslations('bookings.contact');
  const router = useRouter();
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Nouveaux états pour le Mobile Money
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [isProcessingMobile, setIsProcessingMobile] = useState(false);

  // État pour gérer l'erreur d'image
  const [imageHasError, setImageHasError] = useState(false);

  // Informations de contact BudaxDrive
  const BUDAXDRIVE_CONTACT = {
    phone: '+257 79 123 456',
    whatsapp: '+25779123456',
    email: 'contact@budaxdrive.bi',
    hours: t('hoursValue')
  };

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      // ✅ UTILISATION DE bookingId
      router.push(`/login?redirect=/bookings/${bookingId}/contact`);
      return;
    }

    const fetchBookingDetails = async () => {
      try {
        // ✅ UTILISATION DE bookingId
        const data = await apiClient.get(`/api/bookings/${bookingId}`);
        setBooking(data);
      } catch (err: unknown) {
        console.error("Impossible de charger la réservation", err);
        const errorMessage = err instanceof Error ? err.message : t('errors.loadFailed');
        toast.error(errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBookingDetails();
  }, [bookingId, router]); // ✅ DEPENDANCE MISE À JOUR

  const handleOnlinePayment = async () => {
    if (!booking?.payment || booking.payment.status !== 'PENDING') {
      toast.error(t('errors.paymentNotPending'));
      setPaymentError(t('errors.paymentNotPending'));
      return;
    }

    setIsPaymentLoading(true);
    setPaymentError(null);

    try {
      const response = await apiClient.post(`/api/payments/${booking.payment.id}/initiate-online-payment`, {});
      if (response && response.redirectUrl) {
        // Le paiement Stripe quitte la page : payment/callback lit cette valeur pour savoir
        // qu'il s'agissait d'une réservation et rediriger au bon endroit au retour.
        sessionStorage.setItem('paymentSource', 'booking');
        window.location.href = response.redirectUrl;
      } else {
        throw new Error(t('errors.paymentUrlMissing'));
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('errors.paymentLaunchFailed');
      toast.error(errorMessage);
      setPaymentError(errorMessage);
      setIsPaymentLoading(false);
    }
  };

  const handleMobilePayment = async (phoneNumber: string, transactionRef: string) => {
    if (!booking) return;
    setIsProcessingMobile(true);
    try {
      await apiClient.performMobileMoneyPayment(booking.id, phoneNumber, transactionRef);
      setShowMobileModal(false);

      // Rafraîchir les données pour voir le nouveau statut
      // ✅ UTILISATION DE bookingId
      const refreshedData = await apiClient.get(`/api/bookings/${bookingId}`);
      setBooking(refreshedData);

      toast.success(t('errors.mobilePaymentSuccessAlert'));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('errors.mobilePaymentDeclareError');
      toast.error(errorMessage);
    } finally {
      setIsProcessingMobile(false);
    }
  };

  const generateWhatsAppLink = () => {
    if (!booking) return '#';
    
    const cleanPhone = BUDAXDRIVE_CONTACT.whatsapp.replace(/[\s\-\(\)]/g, '');
    const startDate = new Date(booking.startDate).toLocaleDateString('fr-FR');
    const endDate = new Date(booking.endDate).toLocaleDateString('fr-FR');

    // Message personnalisé selon le statut
    const messageLines = [
      t('whatsappMessage.greeting'),
      '',
      booking.status === 'CONFIRMED'
        ? t('whatsappMessage.confirmed')
        : booking.status === 'PENDING'
        ? t('whatsappMessage.pending')
        : t('whatsappMessage.default'),
      '',
      t('whatsappMessage.detailsTitle'),
      t('whatsappMessage.bookingLabel', { id: booking.id }),
      t('whatsappMessage.vehicleLabel', { vehicle: `${booking.vehicle.make} ${booking.vehicle.model}` }),
      t('whatsappMessage.periodLabel', { start: startDate, end: endDate }),
      t('whatsappMessage.amountLabel', { amount: booking.totalPrice.toLocaleString() }),
      '',
      t('whatsappMessage.thanks')
    ];

    const rawMessage = messageLines.join('\n');
    const message = encodeURIComponent(rawMessage);

    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  const getStatusInfo = (status: string, paymentStatus?: string) => {
    if (status === 'PENDING' && paymentStatus === 'PENDING') {
      return {
        icon: <Clock className="w-6 h-6 text-yellow-600" />,
        text: t('statusInfo.pendingTitle'),
        description: t('statusInfo.pendingDesc'),
        color: "text-yellow-700 bg-yellow-100 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-700 dark:text-yellow-300"
      };
    }

    switch (status) {
      case 'CONFIRMED':
        return {
          icon: <CheckCircle className="w-6 h-6 text-green-600" />,
          text: t('statusInfo.confirmedTitle'),
          description: t('statusInfo.confirmedDesc'),
          color: "text-green-700 bg-green-100 border-green-300 dark:bg-green-950 dark:border-green-700 dark:text-green-300"
        };
      case 'COMPLETED':
        return {
          icon: <CheckCircle className="w-6 h-6 text-green-600" />,
          text: t('statusInfo.completedTitle'),
          description: t('statusInfo.completedDesc'),
          color: "text-green-700 bg-green-100 border-green-300 dark:bg-green-950 dark:border-green-700 dark:text-green-300"
        };
      case 'CANCELLED':
        return {
          icon: <AlertCircle className="w-6 h-6 text-red-600" />,
          text: t('statusInfo.cancelledTitle'),
          description: t('statusInfo.cancelledDesc'),
          color: "text-red-700 bg-red-100 border-red-300 dark:bg-red-950 dark:border-red-700 dark:text-red-300"
        };
      default:
        return {
          icon: <Clock className="w-6 h-6 text-gray-600" />,
          text: status,
          description: "",
          color: "text-gray-700 bg-gray-100 border-gray-300 dark:bg-gray-950 dark:border-gray-700 dark:text-gray-300"
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900 rounded-full">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 dark:text-red-300 mb-2">{t('errorTitle')}</h3>
            <p className="text-red-600 dark:text-red-400 mb-4">{error || t('bookingNotFound')}</p>
            <button
              onClick={() => router.push('/bookings/my-bookings')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {t('backToBookings')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(booking.status, booking.payment?.status);
  
  // Logique image
  const fallbackImage = `https://source.unsplash.com/random/600x400/?car&sig=${booking.vehicle.id}`;
  const primaryImageUrl = booking.vehicle.images && booking.vehicle.images.length > 0 
    ? booking.vehicle.images[0].url 
    : fallbackImage;
  
  const displayImage = imageHasError ? fallbackImage : primaryImageUrl;

  const getContactContent = () => {
    switch (booking.status) {
      case 'CONFIRMED':
        return {
          title: t('contactContent.confirmed.title'),
          subtitle: t('contactContent.confirmed.subtitle'),
          steps: [
            t('contactContent.confirmed.step1'),
            t('contactContent.confirmed.step2'),
            t('contactContent.confirmed.step3'),
            t('contactContent.confirmed.step4')
          ],
          showPaymentButton: false,
          showMobileButton: false
        };
      case 'COMPLETED':
        return {
          title: t('contactContent.completed.title'),
          subtitle: t('contactContent.completed.subtitle'),
          steps: [
            t('contactContent.completed.step1'),
            t('contactContent.completed.step2'),
            t('contactContent.completed.step3'),
            t('contactContent.completed.step4')
          ],
          showPaymentButton: false,
          showMobileButton: false
        };
      case 'CANCELLED':
        return {
          title: t('contactContent.cancelled.title'),
          subtitle: t('contactContent.cancelled.subtitle'),
          steps: [
            t('contactContent.cancelled.step1'),
            t('contactContent.cancelled.step2'),
            t('contactContent.cancelled.step3'),
            t('contactContent.cancelled.step4')
          ],
          showPaymentButton: false,
          showMobileButton: false
        };
      case 'PENDING':
        // Si le paiement est en attente, on affiche les boutons
        if (booking.payment?.status === 'PENDING') {
          return {
            title: t('contactContent.pendingWithPayment.title'),
            subtitle: t('contactContent.pendingWithPayment.subtitle'),
            steps: [
              t('contactContent.pendingWithPayment.step1'),
              t('contactContent.pendingWithPayment.step2'),
              t('contactContent.pendingWithPayment.step3')
            ],
            showPaymentButton: true,
            showMobileButton: true
          };
        }
        // Fallthrough si le status est PENDING mais pas le paiement (cas rare)
        return {
            title: t('contactContent.pendingNoPayment.title'),
            subtitle: t('contactContent.pendingNoPayment.subtitle'),
            steps: [t('contactContent.pendingNoPayment.step1')],
            showPaymentButton: false,
            showMobileButton: false
        };
      default:
        return {
          title: t('contactContent.contactInitiated.title'),
          subtitle: t('contactContent.contactInitiated.subtitle'),
          steps: [
            t('contactContent.contactInitiated.step1'),
            t('contactContent.contactInitiated.step2'),
            t('contactContent.contactInitiated.step3'),
            t('contactContent.contactInitiated.step4'),
            t('contactContent.contactInitiated.step5')
          ],
          showPaymentButton: false,
          showMobileButton: false
        };
    }
  };

  const contactContent = getContactContent();

  return (
    <div className="min-h-screen bg-background">
      {/* Header avec navigation */}
      <div className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/bookings/my-bookings')}
            className="inline-flex items-center text-primary hover:text-primary/80 font-medium transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            {t('backToBookings')}
          </button>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl py-8 px-4">
        {/* Statut de la réservation */}
        <div className={`mb-8 p-6 rounded-xl border-2 shadow-md hover:shadow-lg transition-shadow ${statusInfo.color}`}>
          <div className="flex items-center">
            {statusInfo.icon}
            <div className="ml-4">
              <h3 className="text-xl font-bold tracking-tight">{statusInfo.text}</h3>
              {statusInfo.description && (
                <p className="text-base font-medium opacity-90 mt-1">{statusInfo.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Colonne gauche : Détails de la réservation */}
          <div className="bg-card rounded-2xl shadow-xl overflow-hidden border border-border">
            <div className="relative bg-gray-100 dark:bg-gray-800 h-64 sm:h-80 w-full">
              <Image 
                src={displayImage}
                alt={`${booking.vehicle.make} ${booking.vehicle.model}`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
                unoptimized={true}
                onError={() => setImageHasError(true)}
              />
              <div className="absolute top-4 right-4 z-10">
                <div className="bg-black/60 text-white rounded-lg px-3 py-1 text-sm backdrop-blur-sm">
                  {t('bookingLabel', { id: booking.id })}
                </div>
              </div>
            </div>

            <div className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {booking.vehicle.make} {booking.vehicle.model}
              </h2>

              <div className="space-y-3 text-muted-foreground">
                <div className="flex justify-between">
                  <span>{t('yearLabel')}</span>
                  <strong className="text-foreground">{booking.vehicle.manufacturingYear}</strong>
                </div>
                <div className="flex justify-between">
                  <span>{t('fromLabel')}</span>
                  <strong className="text-foreground">{new Date(booking.startDate).toLocaleDateString('fr-FR')}</strong>
                </div>
                <div className="flex justify-between">
                  <span>{t('toLabel')}</span>
                  <strong className="text-foreground">{new Date(booking.endDate).toLocaleDateString('fr-FR')}</strong>
                </div>
                <hr className="my-4 border-border" />
                <div className="flex justify-between text-xl font-bold text-primary">
                  <span>{t('totalToPay')}</span>
                  <span>{booking.totalPrice.toLocaleString()} FBu</span>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite : Contact BudaxDrive */}
          <div className="bg-card rounded-2xl shadow-xl p-6 border border-border">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-10 h-10 text-primary"/>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {contactContent.title}
              </h1>
              <p className="text-muted-foreground">
                {contactContent.subtitle}
              </p>
            </div>
            
            {/* Informations BudaxDrive */}
            <div className="bg-muted rounded-lg p-4 mb-6">
              <div className="flex items-center mb-3">
                <Shield className="w-5 h-5 text-primary mr-2" />
                <h3 className="font-semibold text-foreground">{t('contactTitle')}</h3>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>{t('phoneLabel')}</strong> {BUDAXDRIVE_CONTACT.phone}</p>
                <p><strong>{t('emailLabel')}</strong> {BUDAXDRIVE_CONTACT.email}</p>
                <p><strong>{t('hoursLabel')}</strong> {BUDAXDRIVE_CONTACT.hours}</p>
              </div>
            </div>

            {/* Message d'erreur pour le paiement */}
            {paymentError && (
              <div className="bg-red-100 dark:bg-red-900 border-2 border-red-300 dark:border-red-700 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-700 dark:text-red-300 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-900 dark:text-red-100 font-medium">
                    {paymentError}
                  </p>
                </div>
              </div>
            )}

            {/* Boutons de contact et Paiement */}
            <div className="space-y-3 mb-6">
              {contactContent.showPaymentButton && (
                <button
                  onClick={handleOnlinePayment}
                  disabled={isPaymentLoading}
                  className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z" />
                  </svg>
                  {isPaymentLoading ? t('initializing') : t('payNow')}
                </button>
              )}

              {/* BOUTON MOBILE MONEY */}
              {contactContent.showMobileButton && (
                <button
                  onClick={() => setShowMobileModal(true)}
                  className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  {t('payMobileMoney')}
                </button>
              )}

              {/* Message d'avertissement WhatsApp */}
              <div className="bg-green-100 dark:bg-green-900 border-2 border-green-300 dark:border-green-700 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-green-700 dark:text-green-300 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-900 dark:text-green-100 font-medium">
                    <strong>{t('whatsappTip')}</strong> {t('whatsappTipText')}
                  </p>
                </div>
              </div>
              <a
                href={generateWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center bg-green-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-600 transition-colors shadow-lg hover:shadow-xl"
              >
                <MessageCircle className="w-5 h-5 mr-3"/>
                {t('contactWhatsapp')}
              </a>

              <a
                href={`tel:${BUDAXDRIVE_CONTACT.phone}`}
                className="w-full flex items-center justify-center bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
              >
                <Phone className="w-5 h-5 mr-3"/>
                {t('callButton')}
              </a>
            </div>

            {/* Instructions */}
            <div className="bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-950 dark:to-blue-900 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-6 shadow-md">
              <h4 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                {t('nextStepsTitle')}
              </h4>
              <ol className="space-y-3 text-base text-blue-800 dark:text-blue-300">
                {contactContent.steps.map((step, index) => (
                  <li key={index} className="flex items-start">
                    <Circle className="w-4 h-4 mr-3 mt-1 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="currentColor" />
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Informations supplémentaires */}
        <div className="mt-8 bg-card rounded-xl p-6 shadow-lg border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">{t('whyTitle')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">{t('securePayment')}</p>
                <p className="text-muted-foreground">{t('securePaymentDesc')}</p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">{t('intermediationService')}</p>
                <p className="text-muted-foreground">{t('intermediationDesc')}</p>
              </div>
            </div>
            <div className="flex items-start">
              <MessageCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">{t('dedicatedSupport')}</p>
                <p className="text-muted-foreground">{t('dedicatedSupportDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* MODALE MOBILE MONEY INTÉGRÉE */}
      <PhoneInputModal 
        isOpen={showMobileModal}
        onClose={() => setShowMobileModal(false)}
        onSubmit={handleMobilePayment}
        isLoading={isProcessingMobile}
        amount={booking.totalPrice}
      />
    </div>
  );
}