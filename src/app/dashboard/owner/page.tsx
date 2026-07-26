'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import type { Booking } from '@/types/booking';
import OwnerBookingCard from '@/app/components/OwnerBookingCard';
import { ArrowLeft, Car, Calendar, DollarSign, Bell } from 'lucide-react';

function OwnerDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const highlightId = searchParams.get('highlight');

  const fetchOwnerBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get('/api/bookings/owner-dashboard');
      setBookings(data || []);
    } catch (error) {
      console.error("Impossible de charger les réservations", error);
      setError(error instanceof Error ? error.message : "Erreur lors du chargement des réservations");
    } finally {
      setIsLoading(false);
    }
  };

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
  }, [user, isAuthLoading, router]);

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
    pending: bookings.filter(b => b.status === 'CONTACT_INITIATED' || b.status === 'PENDING_CONFIRMATION').length,
    confirmed: bookings.filter(b => b.status === 'CONFIRMED').length,
    totalRevenue: bookings.filter(b => b.status === 'CONFIRMED').reduce((sum, b) => sum + (b.totalPrice || 0), 0)
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground font-medium">Chargement de votre tableau de bord...</p>
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
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center text-primary hover:text-primary/80 font-medium transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Retour à l&apos;accueil
          </button>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl py-8 px-4">
        {/* Titre et statistiques */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Tableau de Bord Propriétaire</h1>
          <p className="text-lg text-muted-foreground">Gérez les réservations de vos véhicules</p>

          {highlightId && (
            <div className="mt-4 bg-primary/10 border border-primary/20 rounded-lg p-3 max-w-md mx-auto">
              <div className="flex items-center justify-center space-x-2">
                <Bell className="w-5 h-5 text-primary" />
                <p className="text-sm text-primary font-medium">
                  Nouvelle réservation mise en évidence
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Total Réservations</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center">
                <Car className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">En Attente</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                <Car className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Confirmées</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.confirmed}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-muted-foreground">Revenus</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalRevenue.toLocaleString()} FBu</p>
              </div>
            </div>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-card border border-border rounded-lg p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={fetchOwnerBookings}
              className="mt-2 text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Liste des réservations */}
        <div className="bg-card rounded-2xl shadow-xl p-6 border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-6">Réservations de vos véhicules</h2>

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
              <h3 className="text-lg font-medium text-foreground mb-2">Aucune réservation</h3>
              <p className="text-muted-foreground">Vous n&apos;avez aucune réservation pour vos véhicules pour le moment.</p>
              <button
                onClick={() => router.push('/vehicles/add')}
                className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg transition-colors"
              >
                Ajouter un véhicule
              </button>
            </div>
          )}
        </div>

        {/* Instructions pour les nouveaux propriétaires */}
        <div className="mt-8 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Comment ça marche ?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="font-bold">1</span>
              </div>
              <h4 className="font-semibold mb-1">Réservation reçue</h4>
              <p className="text-sm opacity-90">Un client fait une demande de réservation avec paiement local</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="font-bold">2</span>
              </div>
              <h4 className="font-semibold mb-1">Contact & Paiement</h4>
              <p className="text-sm opacity-90">Le client vous contacte et effectue le paiement Mobile Money</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="font-bold">3</span>
              </div>
              <h4 className="font-semibold mb-1">Confirmation</h4>
              <p className="text-sm opacity-90">Vous confirmez la réception du paiement ici</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OwnerDashboardPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <OwnerDashboardContent />
    </Suspense>
  );
}