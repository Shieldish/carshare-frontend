'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import PhoneInputModal from '@/app/bookings/my-bookings/PhoneInputModal';
import ConfirmDeleteModal from '@/app/bookings/my-bookings/ConfirmDeleteModal';
import LeaveReviewModal from '@/app/bookings/my-bookings/LeaveReviewModal';
import { StarRating } from '@/app/components/reviews/VehicleReviews';
import type { Review } from '@/types/review';
import { MessageSquare, ClipboardCheck, AlertTriangle, Star, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

// Types mis à jour pour correspondre à la nouvelle structure
type PaymentInfo = {
  id: string;
  status: 'PENDING' | 'CAPTURED' | 'FAILED' | 'REFUNDED';
};

type CompanyContactInfo = {
  phoneNumber: string;
  email: string;
};

type VehicleInfo = {
  id: number;
  make: string;
  model: string;
  imageUrl?: string;
  images?: { id: number; url: string }[];
  companyContact?: CompanyContactInfo;
};

type Booking = {
  id: number;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  vehicle: VehicleInfo;
  payment: PaymentInfo | null;
  // ✅ Code secret pour le handshake Check-in
  checkInCode?: string;
};

// Composant pour une seule carte de réservation
function BookingCard({
  booking,
  onPaymentSuccess,
  onDelete,
  isHighlighted = false,
}: {
  booking: Booking;
  onPaymentSuccess: () => void;
  onDelete: (id: number) => void;
  isHighlighted?: boolean;
}) {
  const t = useTranslations('bookings.myBookings.card');
  const tStatus = useTranslations('bookings.myBookings.status');
  const router = useRouter();
  const { openChat } = useChat();
  const { vehicle, startDate, endDate, status, totalPrice, payment } = booking;

  const getPrimaryImageUrl = (vehicle: VehicleInfo) => {
    if (vehicle.images && Array.isArray(vehicle.images) && vehicle.images.length > 0) {
      return vehicle.images[0].url;
    }
    return vehicle.imageUrl || `https://source.unsplash.com/random/400x200/?${vehicle.make}&sig=${booking.id}`;
  };

  const imageUrl = getPrimaryImageUrl(vehicle);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [myReview, setMyReview] = useState<Review | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isDeletingReview, setIsDeletingReview] = useState(false);

  useEffect(() => {
    if (status !== 'COMPLETED') return;
    apiClient.get(`/api/reviews/booking/${booking.id}`)
      .then((data) => setMyReview(data))
      .catch(() => setMyReview(null));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, booking.id]);

  const handleSubmitReview = async (rating: number, comment: string) => {
    setIsSubmittingReview(true);
    try {
      const review = myReview
        ? await apiClient.put(`/api/vehicles/${vehicle.id}/reviews/${myReview.id}`, { bookingId: booking.id, rating, comment })
        : await apiClient.post(`/api/vehicles/${vehicle.id}/reviews`, { bookingId: booking.id, rating, comment });
      setMyReview(review);
      setShowReviewModal(false);
      toast.success(myReview ? t('reviewUpdated') : t('reviewSubmitted'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('errors.genericError');
      toast.error(message);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!myReview) return;
    if (!confirm(t('confirmDeleteReview'))) return;
    setIsDeletingReview(true);
    try {
      await apiClient.delete(`/api/vehicles/${vehicle.id}/reviews/${myReview.id}`);
      setMyReview(null);
      toast.success(t('reviewDeleted'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('errors.genericError');
      toast.error(message);
    } finally {
      setIsDeletingReview(false);
    }
  };

  const statusStyles = {
    PENDING: 'bg-orange-100 text-orange-800 border-orange-200',
    CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
    IN_PROGRESS: 'bg-green-100 text-green-800 border-green-200',
    COMPLETED: 'bg-muted text-muted-foreground border-border',
    CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  };

  const handleOpenChat = () => {
    openChat(booking.id);
  };

  const handleOnlinePayment = async () => {
    if (!payment || payment.status !== 'PENDING') {
      toast.error(t('errors.paymentNotPending'));
      setError(t('errors.paymentNotPending'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post(`/api/payments/${payment.id}/initiate-online-payment`, {});
      if (response && response.redirectUrl) {
        // Le paiement Stripe quitte la page : payment/callback lit cette valeur pour savoir
        // qu'il s'agissait d'une réservation et rediriger au bon endroit au retour.
        sessionStorage.setItem('paymentSource', 'booking');
        window.location.href = response.redirectUrl;
      } else {
        throw new Error(t('errors.paymentUrlMissing'));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('errors.paymentLaunchFailed');
      toast.error(message);
      setError(message);
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);

    try {
      const token = localStorage.getItem('jwt_token');
      if (!token) throw new Error(t('errors.authRequired'));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'}/api/bookings/${booking.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(t('errors.deleteFailed'));
      }

      setShowDeleteModal(false);
      toast.success(t('errors.deleteSuccess'));
      onDelete(booking.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('errors.genericError');
      toast.error(message);
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const canInspect = status === 'CONFIRMED' || status === 'IN_PROGRESS';
  const canReportIncident = status === 'IN_PROGRESS' || status === 'COMPLETED';
  const canViewIncidents = status === 'CONFIRMED' || status === 'IN_PROGRESS' || status === 'COMPLETED' || status === 'CANCELLED';

  return (
    <>
      <div
        id={`booking-${booking.id}`}
        className={`bg-card rounded-xl shadow-lg overflow-hidden border border-border hover:shadow-xl transition-all duration-500 ${
          isHighlighted ? 'ring-2 ring-primary ring-offset-2 bg-card' : ''
        }`}
      >
        <div className="flex flex-col lg:flex-row">
          <div className="relative lg:w-1/3 overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="w-full h-auto lg:h-full object-cover transition-transform duration-300 hover:scale-105"
              style={{ aspectRatio: 'auto' }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://source.unsplash.com/random/400x200/?${vehicle.make}&sig=${booking.id}`;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

            {vehicle.images && Array.isArray(vehicle.images) && vehicle.images.length > 1 && (
              <div className="absolute bottom-4 left-4 bg-black/60 text-card-foreground px-3 py-1 rounded-lg text-sm flex items-center backdrop-blur-sm">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {t('photosCount', { count: vehicle.images.length })}
              </div>
            )}
          </div>

          <div className="flex-1 p-6">
            <div className="flex flex-col h-full">
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h2 className="text-xl font-bold text-foreground mb-1">
                      {vehicle.make} {vehicle.model}
                    </h2>
                    <div className="flex items-center text-muted-foreground text-sm mb-2">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {t('dateRange', { start: new Date(startDate).toLocaleDateString(), end: new Date(endDate).toLocaleDateString() })}
                    </div>

                    {vehicle.companyContact && (
                      <div className="bg-muted rounded-lg p-3 mt-3">
                        <div className="flex items-center text-muted-foreground text-sm mb-1">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4"
                            />
                          </svg>
                          <span className="font-medium">{t('contactUs')}</span>
                        </div>
                        <div className="flex items-center text-muted-foreground text-sm">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          <a
                            href={`tel:${vehicle.companyContact.phoneNumber}`}
                            className="text-primary hover:text-primary/80 hover:underline transition-colors"
                          >
                            {vehicle.companyContact.phoneNumber}
                          </a>
                        </div>
                        <div className="flex items-center text-muted-foreground text-sm mt-1">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <a
                            href={`mailto:${vehicle.companyContact.email}`}
                            className="text-primary hover:text-primary/80 hover:underline transition-colors"
                          >
                            {vehicle.companyContact.email}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">{totalPrice.toLocaleString()} FBu</div>
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${
                        statusStyles[status as keyof typeof statusStyles]
                      }`}
                    >
                      {tStatus(status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-border">
                {status === 'PENDING' && payment?.status === 'PENDING' && (
                  <div className="flex gap-3 mb-3">
                    <button
                      onClick={handleOnlinePayment}
                      disabled={isLoading}
                      className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-primary/40 text-primary-foreground py-3 px-4 rounded-lg transition-all duration-200 font-medium flex items-center justify-center shadow-md hover:shadow-lg"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v2a2 2 0 002 2z"
                        />
                      </svg>
                      {isLoading ? t('initializing') : t('payNow')}
                    </button>
                  </div>
                )}

                {payment?.status === 'CAPTURED' && status === 'CONFIRMED' && (
                  <div className="bg-green-100 border-2 border-green-500 text-green-800 px-4 py-3 rounded-lg text-center mb-3">
                    <div className="flex items-center justify-center text-sm font-semibold">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t('paymentConfirmed')}
                    </div>
                  </div>
                )}

                {/* ✅ Bloc code secret Check-in : visible uniquement pour le locataire quand CONFIRMED */}
                {status === 'CONFIRMED' && booking.checkInCode && (
                  <div className="mt-3 mb-3 p-4 bg-muted border-l-4 border-primary rounded-r-md">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-primary mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <h3 className="text-sm font-semibold text-foreground">
                        {t('checkInCodeTitle')}
                      </h3>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('checkInCodeDesc')}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-2xl font-black tracking-widest text-primary bg-card px-4 py-2 rounded-lg shadow-sm border border-primary/20">
                        {booking.checkInCode}
                      </span>
                      <span className="text-xs text-muted-foreground italic">
                        {t('checkInCodeWarning')}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    onClick={handleOpenChat}
                    className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-4 py-2 rounded-lg transition-colors flex items-center text-sm font-medium shadow-md hover:shadow-lg"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {t('chat')}
                  </button>

                  {status === 'PENDING' && (
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      disabled={isDeleting}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-red-300 transition-colors flex items-center text-sm font-medium shadow-md hover:shadow-lg"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      {isDeleting ? t('deleting') : t('delete')}
                    </button>
                  )}

                  {canInspect && (
                    <Link
                      href={`/bookings/${booking.id}/inspection`}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center text-sm font-medium shadow-md hover:shadow-lg w-full justify-center sm:w-auto"
                    >
                      <ClipboardCheck className="w-4 h-4 mr-2" />
                      {status === 'CONFIRMED' ? t('checkIn') : t('checkOut')}
                    </Link>
                  )}

                  {status === 'COMPLETED' && (
                    <Link
                      href={`/bookings/${booking.id}/inspection`}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center text-sm font-medium w-full justify-center sm:w-auto"
                    >
                      <ClipboardCheck className="w-4 h-4 mr-2" />
                      {t('viewInspection')}
                    </Link>
                  )}

                  {status === 'COMPLETED' && (
                    myReview ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setShowReviewModal(true)}
                          title={t('editReview')}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/70 text-sm font-medium transition-colors"
                        >
                          <StarRating value={myReview.rating} size={14} />
                          <span className="text-muted-foreground">{t('yourReview')}</span>
                          <Pencil className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <button
                          onClick={handleDeleteReview}
                          disabled={isDeletingReview}
                          title={t('deleteReview')}
                          className="p-2.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowReviewModal(true)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center text-sm font-medium shadow-md hover:shadow-lg"
                      >
                        <Star className="w-4 h-4 mr-2" />
                        {t('leaveReview')}
                      </button>
                    )
                  )}

                  {canReportIncident && (
                    <Link
                      href={`/bookings/${booking.id}/incident/report`}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center text-sm font-medium shadow-md hover:shadow-lg"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      {t('reportIncident')}
                    </Link>
                  )}

                  {canViewIncidents && (
                    <Link
                      href={`/bookings/${booking.id}/incident/view`}
                      className="text-xs text-muted-foreground hover:text-primary hover:underline pt-1"
                    >
                      {t('viewIncidentReports')}
                    </Link>
                  )}

                  <button
                    onClick={() => router.push(`/bookings/${booking.id}/contact`)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors flex items-center text-sm font-medium shadow-md hover:shadow-lg"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    {t('support')}
                  </button>
                </div>

                {error && (
                  <p className="text-red-500 text-sm mt-2 text-right">{error}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PhoneInputModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSubmit={() => {}}
        isLoading={isLoading}
        amount={totalPrice}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        vehicleName={`${vehicle.make} ${vehicle.model}`}
        isLoading={isDeleting}
      />

      <LeaveReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleSubmitReview}
        vehicleName={`${vehicle.make} ${vehicle.model}`}
        isLoading={isSubmittingReview}
        initialRating={myReview?.rating ?? 0}
        initialComment={myReview?.comment ?? ''}
      />
    </>
  );
}

// Composant des onglets de filtrage
function FilterTabs({
  activeFilter,
  onFilterChange,
  totalCounts,
}: {
  activeFilter: 'all' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  onFilterChange: (filter: 'all' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled') => void;
  totalCounts: Record<'all' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled', number>;
}) {
  const t = useTranslations('bookings.myBookings.filterTabs');
  const tabs = [
    { key: 'all' as const, label: t('all'), icon: '📋' },
    { key: 'pending' as const, label: t('pending'), icon: '⏳' },
    { key: 'confirmed' as const, label: t('confirmed'), icon: '✅' },
    { key: 'in_progress' as const, label: t('in_progress'), icon: '🚗' },
    { key: 'completed' as const, label: t('completed'), icon: '🏁' },
    { key: 'cancelled' as const, label: t('cancelled'), icon: '❌' },
  ];

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-4 mb-6">
      <div className="flex flex-wrap gap-2 justify-center">
        {tabs.map((tab) => {
          const isActive = activeFilter === tab.key;
          const count = totalCounts[tab.key];

          return (
            <button
              key={tab.key}
              onClick={() => onFilterChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {count > 0 && (
                <span
                  className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                    isActive ? 'bg-primary-foreground/20' : 'bg-muted'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Page principale
function MyBookingsContent() {
  const t = useTranslations('bookings.myBookings');
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  >('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const highlightId = searchParams.get('highlight');
  const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (highlightId && bookings.length > 0) {
      setHighlightedBookingId(highlightId);

      const timer = setTimeout(() => {
        const element = document.getElementById(`booking-${highlightId}`);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 500);

      const removeHighlightTimer = setTimeout(() => {
        setHighlightedBookingId(null);
        const url = new URL(window.location.href);
        url.searchParams.delete('highlight');
        window.history.replaceState({}, '', url.toString());
      }, 5000);

      return () => {
        clearTimeout(timer);
        clearTimeout(removeHighlightTimer);
      };
    }
  }, [highlightId, bookings]);

  const calculateStatusCounts = (bookings: Booking[]) => {
    const counts: Record<
      'all' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled',
      number
    > = {
      all: bookings.length,
      pending: 0,
      confirmed: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };

    bookings.forEach((booking) => {
      switch (booking.status) {
        case 'PENDING':
          counts.pending++;
          break;
        case 'CONFIRMED':
          counts.confirmed++;
          break;
        case 'IN_PROGRESS':
          counts.in_progress++;
          break;
        case 'COMPLETED':
          counts.completed++;
          break;
        case 'CANCELLED':
          counts.cancelled++;
          break;
      }
    });

    return counts;
  };

  const fetchBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get('/api/bookings/my-bookings');
      setBookings(data);
      applyFilter(data, activeFilter);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('loadError');
      toast.error(message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilter = (bookingsData: Booking[], filter: typeof activeFilter) => {
    let filtered = [...bookingsData];

    if (filter === 'all') {
      filtered = bookingsData;
    } else if (filter === 'pending') {
      filtered = bookingsData.filter((booking) => booking.status === 'PENDING');
    } else if (filter === 'confirmed') {
      filtered = bookingsData.filter((booking) => booking.status === 'CONFIRMED');
    } else if (filter === 'in_progress') {
      filtered = bookingsData.filter((booking) => booking.status === 'IN_PROGRESS');
    } else if (filter === 'completed') {
      filtered = bookingsData.filter((booking) => booking.status === 'COMPLETED');
    } else if (filter === 'cancelled') {
      filtered = bookingsData.filter((booking) => booking.status === 'CANCELLED');
    }

    setFilteredBookings(filtered);
  };

  const handleFilterChange = (newFilter: typeof activeFilter) => {
    setActiveFilter(newFilter);
    applyFilter(bookings, newFilter);
  };

  const handleDeleteBooking = (bookingId: number) => {
    setBookings((prev) => prev.filter((booking) => booking.id !== bookingId));
    applyFilter(bookings.filter((booking) => booking.id !== bookingId), activeFilter);
  };

  useEffect(() => {
    // 1. On attend que l'authentification soit vérifiée
    if (isAuthLoading) return;

    // 2. Ensuite on prend une décision
    if (user) {
      fetchBookings();
    } else {
      router.push('/login');
    }
  }, [user, isAuthLoading, router]);

  useEffect(() => {
    if (bookings.length > 0) {
      const counts = calculateStatusCounts(bookings);
    }
  }, [bookings]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Si on est déconnecté, on ne rend rien le temps de la redirection
  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md mx-auto">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-muted rounded-full">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">{t('errorTitle')}</h3>
            <p className="text-muted-foreground">{error}</p>
            <button
              onClick={fetchBookings}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              {t('retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusCounts = calculateStatusCounts(bookings);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('pageTitle')}</h1>
              <p className="text-muted-foreground mt-1">
                {filteredBookings.length} {filteredBookings.length === 1 ? t('countSingular') : t('countPlural')}{' '}
                {activeFilter !== 'all' && t('totalCount', { count: statusCounts.all })}
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center text-primary hover:text-primary/80 font-medium transition-colors group"
            >
              <svg
                className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('backHome')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <FilterTabs activeFilter={activeFilter} onFilterChange={handleFilterChange} totalCounts={statusCounts} />

        {filteredBookings.length > 0 ? (
          <div className="space-y-6">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onPaymentSuccess={fetchBookings}
                onDelete={handleDeleteBooking}
                isHighlighted={booking.id.toString() === highlightId}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-card rounded-xl shadow-lg p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {activeFilter === 'all'
                  ? t('emptyState.allTitle')
                  : `${t('emptyState.filteredTitlePrefix')} ${t(`emptyState.filterLabels.${activeFilter}`)}`}
              </h3>
              <p className="text-muted-foreground mb-6">
                {activeFilter === 'all'
                  ? t('emptyState.allDesc')
                  : `${t('emptyState.filteredDescPrefix')} "${t(`emptyState.filterLabelsCapitalized.${activeFilter}`)}"`}
              </p>
              <button
                onClick={() => router.push('/')}
                className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground py-3 px-6 rounded-lg hover:from-primary/90 hover:to-primary transition-all duration-200 font-medium shadow-md hover:shadow-lg"
              >
                {t('exploreVehicles')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MyBookingsFallback() {
  const t = useTranslations('common');
  return <div>{t('loading')}</div>;
}

export default function MyBookingsPage() {
  return (
    <Suspense fallback={<MyBookingsFallback />}>
      <MyBookingsContent />
    </Suspense>
  );
}