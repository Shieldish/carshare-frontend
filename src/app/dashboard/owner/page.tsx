'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import type { Booking } from '@/types/booking';
import OwnerBookingCard from '@/app/components/OwnerBookingCard';
import { ArrowLeft, Car, Calendar, DollarSign, Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, StatCard } from '@/app/components/ui';
import { formatNumber } from '@/lib/formatNumber';

function OwnerDashboardContent() {
  const t = useTranslations('dashboardOwner');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const highlightId = searchParams.get('highlight');

  const fetchOwnerBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get('/api/bookings/owner-dashboard');
      setBookings(data || []);
    } catch (error) {
      console.error("Impossible de charger les réservations", error);
      setError(error instanceof Error ? error.message : t('loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isAuthLoading) return; // On attend de savoir

    if (!user) {
      router.push('/login?redirect=/dashboard/owner');
      return;
    }

    // ✅ INTERCEPTEUR D'ONBOARDING : Vérifie si un propriétaire a un paiement d'inscription abandonné
    const enforceOnboardingPayment = async () => {
      if (user.role === 'OWNER' && user.companyId && !user.isPremium) {
        try {
          const response = await apiClient.get('/api/payments/check-pending-onboarding');
          if (response.requiresPayment) {
            console.warn('🔔 Paiement d\'inscription en attente détecté. Redirection vers la caisse...');
            // 🚨 REDIRECTION FORCÉE : L'utilisateur doit finir de payer son inscription
            router.replace(`/payment/checkout/${response.paymentId}`);
            return; // On arrête ici, pas besoin de charger le dashboard
          }
        } catch (error) {
          // En cas d'erreur de l'intercepteur, on ne bloque pas l'utilisateur
          console.error("Erreur lors de la vérification du paiement d'onboarding (non bloquante)", error);
        }
      }

      // Tout est OK : on charge les réservations normalement
      fetchOwnerBookings();
    };

    enforceOnboardingPayment();
  }, [user, isAuthLoading, router, fetchOwnerBookings]);

  useEffect(() => {
    if (highlightId && bookings.length > 0) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`booking-${highlightId}`);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });

          setTimeout(() => {
            const url = new URL(window.location.href);
            url.searchParams.delete('highlight');
            window.history.replaceState({}, '', url.toString());
          }, 3000);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [highlightId, bookings]);

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'PENDING_CONFIRMATION').length,
    confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
    totalRevenue: bookings.filter(b => b.status === 'CONFIRMED').reduce((sum, b) => sum + (b.totalPrice || 0), 0)
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground font-medium">{t('loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  if (!user) return null; // Sécurité anti-flash

  return (
    <div className="min-h-screen bg-background">
      {/* Header avec navigation */}
      <div className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="group px-0 text-primary hover:bg-transparent hover:text-primary/80"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            {t('backToHome')}
          </Button>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl p-4 sm:p-6 md:p-8">
        {/* Titre et statistiques */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">{t('title')}</h1>
          <p className="text-lg text-muted-foreground">{t('subtitle')}</p>

          {highlightId && (
            <div className="mt-4 bg-primary/10 border border-primary/20 rounded-lg p-3 max-w-md mx-auto">
              <div className="flex items-center justify-center space-x-2">
                <Bell className="w-5 h-5 text-primary" />
                <p className="text-sm text-primary font-medium">
                  {t('highlightBanner')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Cartes de statistiques */}
        {/* 4 colonnes seulement à partir de lg : en md, le montant se coupait en plein nombre. */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Calendar} label={t('statTotal')} value={stats.total} tone="primary" />
          <StatCard icon={Car} label={t('statPending')} value={stats.pending} tone="warning" />
          <StatCard icon={Car} label={t('statConfirmed')} value={stats.confirmed} tone="success" />
          <StatCard icon={DollarSign} label={t('statRevenue')} value={`${formatNumber(stats.totalRevenue)} FBu`} tone="accent" />
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <p className="text-destructive">{error}</p>
            <Button variant="destructive" size="sm" onClick={fetchOwnerBookings} className="mt-2">
              {t('retry')}
            </Button>
          </div>
        )}

        {/* Liste des réservations */}
        <div className="bg-card rounded-2xl shadow-xl p-3 sm:p-6 border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-6">{t('bookingsListTitle')}</h2>

          {bookings.length > 0 ? (
            <div className="space-y-6">
              {bookings.map(booking => (
                <div
                  key={booking.id}
                  id={`booking-${booking.id}`}
                  className={`transition-all duration-500 ${
                    booking.id.toString() === highlightId
                      ? 'ring-2 ring-primary ring-offset-2 bg-card/90 p-2 rounded-lg'
                      : ''
                  }`}
                >
                  <OwnerBookingCard
                    booking={booking}
                    onUpdate={fetchOwnerBookings}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">{t('emptyTitle')}</h3>
              <p className="text-muted-foreground">{t('emptyDescription')}</p>
              <Button onClick={() => router.push('/vehicles/add')} className="mt-4">
                {t('addVehicleButton')}
              </Button>
            </div>
          )}
        </div>

        {/* Instructions pour les nouveaux propriétaires */}
        <div className="mt-8 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">{t('howItWorksTitle')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="font-bold">1</span>
              </div>
              <h4 className="font-semibold mb-1">{t('step1Title')}</h4>
              <p className="text-sm opacity-90">{t('step1Description')}</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="font-bold">2</span>
              </div>
              <h4 className="font-semibold mb-1">{t('step2Title')}</h4>
              <p className="text-sm opacity-90">{t('step2Description')}</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="font-bold">3</span>
              </div>
              <h4 className="font-semibold mb-1">{t('step3Title')}</h4>
              <p className="text-sm opacity-90">{t('step3Description')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OwnerDashboardPage() {
  const t = useTranslations('dashboardOwner');
  return (
    <Suspense fallback={<div>{t('loadingFallback')}</div>}>
      <OwnerDashboardContent />
    </Suspense>
  );
}