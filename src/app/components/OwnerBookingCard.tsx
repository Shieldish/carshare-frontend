'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Booking } from '@/types/booking';
import { apiClient } from '@/lib/apiClient';
import { 
  Check, 
  X, 
  Clock, 
  CheckCircle, 
  Car, 
  User, 
  Calendar, 
  DollarSign, 
  MessageSquare, 
  ClipboardCheck,
  AlertTriangle,
  Lock,
  Loader2
} from 'lucide-react'; // ✅ AlertCircle supprimé (inutilisé), Lock ajouté
import { useChat } from '@/context/ChatContext';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/app/components/ui';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/formatNumber';

type StatusTone = 'warning' | 'success' | 'destructive' | 'primary' | 'info' | 'neutral';

// Palette partagée par les 3 affichages de statut de cette carte (pastille sur
// l'image, bandeau "action requise", bandeau "statut"). Avant : 6 teintes
// choisies indépendamment, dont la moitié sans variante dark: sur l'icône.
const TONE_CLASSES: Record<StatusTone, { panel: string; icon: string }> = {
  warning: {
    panel: 'text-amber-700 bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800/50 dark:text-amber-300',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  success: {
    panel: 'text-green-700 bg-green-100 border-green-200 dark:bg-green-900/30 dark:border-green-800/50 dark:text-green-300',
    icon: 'text-green-600 dark:text-green-400',
  },
  destructive: {
    panel: 'text-red-700 bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-800/50 dark:text-red-300',
    icon: 'text-red-600 dark:text-red-400',
  },
  primary: {
    panel: 'text-primary bg-primary/10 border-primary/20',
    icon: 'text-primary',
  },
  info: {
    panel: 'text-blue-700 bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800/50 dark:text-blue-300',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  neutral: {
    panel: 'text-muted-foreground bg-muted border-border',
    icon: 'text-muted-foreground',
  },
};

interface OwnerBookingCardProps {
  booking: Booking;
  onUpdate: () => void;
}

export default function OwnerBookingCard({ booking, onUpdate }: OwnerBookingCardProps) {
  const t = useTranslations('bookings.ownerCard');
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { openChat } = useChat();

  const handleStatusUpdate = async (newStatus: 'CONFIRMED' | 'CANCELLED') => {
    setIsLoading(true);
    setError('');
    try {
      await apiClient.put(`/api/bookings/${booking.id}/status`, { status: newStatus });
      onUpdate();
    } catch (err: unknown) { // ✅ "any" remplacé par "unknown"
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('genericError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChat = () => {
    openChat(booking.id);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      // ✅ PENDING_CONFIRMATION = le locataire a déjà payé (en externe) et attend une vraie
      // décision du propriétaire — c'est le seul cas qui nécessite une action de sa part.
      case 'PENDING_CONFIRMATION':
        return { Icon: Clock, tone: 'warning' as StatusTone, text: t('status.pendingConfirmationText'), description: t('status.pendingConfirmationDescription') };
      // ✅ PENDING = rien n'a encore été payé ; le propriétaire ne devrait normalement jamais
      // voir ce statut (filtré côté backend), mais on garde un affichage neutre et sans
      // bouton d'action au cas où, plutôt que de l'inviter à "confirmer" quelque chose
      // qui n'a jamais été payé.
      // ✅ CONTACT_INITIATED = le locataire a ouvert la discussion, sans avoir encore payé : côté
      // propriétaire c'est le même message d'attente (sans ce cas, le statut brut s'affichait).
      case 'PENDING':
      case 'CONTACT_INITIATED':
        return { Icon: Clock, tone: 'neutral' as StatusTone, text: t('status.pendingText'), description: t('status.pendingDescription') };
      case 'CONFIRMED':
        return { Icon: CheckCircle, tone: 'success' as StatusTone, text: t('status.confirmedText'), description: t('status.confirmedDescription') };
      case 'CANCELLED':
        return { Icon: X, tone: 'destructive' as StatusTone, text: t('status.cancelledText'), description: t('status.cancelledDescription') };
      case 'IN_PROGRESS':
        return { Icon: Car, tone: 'primary' as StatusTone, text: t('status.inProgressText'), description: t('status.inProgressDescription') };
      case 'COMPLETED':
        return { Icon: CheckCircle, tone: 'info' as StatusTone, text: t('status.completedText'), description: t('status.completedDescription') };
      default:
        return { Icon: Clock, tone: 'neutral' as StatusTone, text: status, description: '' };
    }
  };

  const needsAction = booking.status === 'PENDING_CONFIRMATION';

  // Déterminer si le bouton d'inspection doit être affiché
  const canInspect = booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS';
  const isCompleted = booking.status === 'COMPLETED';

  // Conditions pour les incidents
  const canReportIncident = booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED';
  const canViewIncidents = ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(booking.status);

  const statusInfo = getStatusInfo(booking.status);
  const statusTone = TONE_CLASSES[statusInfo.tone];

  const getPrimaryImageUrl = () => {
    if (booking.vehicle?.images && booking.vehicle.images.length > 0) {
      return booking.vehicle.images[0].url;
    }
    return booking.vehicle?.imageUrl || `https://source.unsplash.com/random/300x200/?car&sig=${booking.vehicle?.id}`;
  };

  // Calcul de la part du propriétaire (85%)
  const ownerShare = booking.totalPrice ? Math.round(booking.totalPrice * 0.85) : 0;

  return (
    <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden hover:shadow-xl transition-shadow">
      <div className="flex flex-col lg:flex-row">
        {/* Image du véhicule */}
        <div className="lg:w-1/3">
          <div className="relative h-48 lg:h-full">
            {/* ✅ Règle next/image désactivée ici pour conserver le fallback onError */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={getPrimaryImageUrl()}
              alt={`${booking.vehicle?.make} ${booking.vehicle?.model}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://source.unsplash.com/random/300x200/?car&sig=${booking.vehicle?.id}`;
              }}
            />
            {/* Badge de statut */}
            <div className={cn('absolute top-4 right-4 flex max-w-[calc(100%-2rem)] items-center rounded-full border px-3 py-1 text-small font-medium', statusTone.panel)}>
              <statusInfo.Icon className={cn('w-4 h-4 mr-2 shrink-0', statusTone.icon)} />
              {statusInfo.text}
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 min-w-0 p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations du véhicule et de la réservation */}
            <div>
              <div className="flex items-center mb-3">
                <Car className="w-5 h-5 text-primary mr-2 shrink-0" />
                <h3 className="min-w-0 text-xl font-bold text-foreground">
                  {booking.vehicle?.make} {booking.vehicle?.model}
                </h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                  <span className="text-muted-foreground">
                    <strong>{t('bookingRequest')}</strong>
                  </span>
                </div>

                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                  <span className="text-muted-foreground">
                    <strong>{t('fromLabel')}</strong> {new Date(booking.startDate).toLocaleDateString(locale, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
                  <span className="text-muted-foreground">
                    <strong>{t('toLabel')}</strong> {new Date(booking.endDate).toLocaleDateString(locale, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 text-green-600 mr-2 shrink-0" />
                  <span className="text-lg font-bold text-green-600">
                    {t('yourShare', { amount: formatNumber(ownerShare) })}
                  </span>
                </div>
              </div>
            </div>

            {/* Informations du client et actions */}
            <div>
              {needsAction && (
                <div>
                  <div className={cn('p-3 rounded-lg border mb-4', statusTone.panel)}>
                    <div className="flex items-start">
                      <statusInfo.Icon className={cn('w-5 h-5 shrink-0', statusTone.icon)} />
                      <div className="ml-2">
                        <p className="font-medium">{statusInfo.text}</p>
                        <p className="text-sm opacity-80">{statusInfo.description}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    {t('actionRequiredText', { amount: formatNumber(ownerShare) })}
                  </p>

                  {/* flex-wrap plutôt qu'un point de rupture fixe : la colonne fait à peine 300px en
                      lg, où les deux boutons côte à côte dépassaient de la carte. */}
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => handleStatusUpdate('CONFIRMED')} disabled={isLoading} className="flex-1">
                      {isLoading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Check size={16} className="mr-2" />}
                      {t('confirmAvailability')}
                    </Button>

                    <Button variant="destructive" onClick={() => handleStatusUpdate('CANCELLED')} disabled={isLoading} className="flex-1">
                      {isLoading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <X size={16} className="mr-2" />}
                      {t('vehicleNotAvailable')}
                    </Button>
                  </div>

                  {error && (
                    <div className="mt-3 p-3 bg-card border border-border rounded-lg">
                      <p className="text-destructive text-sm">{error}</p>
                    </div>
                  )}
                </div>
              )}

              {!needsAction && (
                <>
                  <div className={cn('p-3 sm:p-4 rounded-lg border mb-4', statusTone.panel)}>
                    <div className="flex items-center">
                      <statusInfo.Icon className={cn('w-5 h-5 shrink-0', statusTone.icon)} />
                      <div className="ml-3 min-w-0">
                        <h4 className="font-semibold">{statusInfo.text}</h4>
                        <p className="text-sm opacity-80">{statusInfo.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* ✅ NOUVEAU : Affichage du code PIN pour le propriétaire */}
                  {booking.status === 'CONFIRMED' && booking.checkInCode && (
                    <div className="bg-primary/10 border border-primary/30 p-4 rounded-lg mb-4 text-center">
                      <div className="flex items-center justify-center mb-1 text-primary">
                        <Lock className="w-4 h-4 mr-2" />
                        <span className="font-semibold text-sm">{t('keyHandoverCode')}</span>
                      </div>
                      <p className="text-3xl font-mono font-bold tracking-widest text-primary my-1">
                        {booking.checkInCode}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {t('keyHandoverHint')}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Section Actions - Chat, Inspection et Incidents */}
              <div className="mt-4 space-y-3">
                {/* Bouton Chat - visible pour toutes les réservations */}
                <Button variant="outline" onClick={handleOpenChat} className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {t('chatWithRenter')}
                </Button>

                {/* Bouton/Lien Inspection - conditionnel selon le statut */}
                {canInspect && (
                  <Button href={`/bookings/${booking.id}/inspection`} className="w-full">
                    <ClipboardCheck className="w-4 h-4 mr-2" />
                    {booking.status === 'CONFIRMED' ? t('checkIn') : t('checkOut')}
                  </Button>
                )}

                {/* Lien pour voir l'inspection si terminée */}
                {isCompleted && (
                  <Button variant="outline" href={`/bookings/${booking.id}/inspection`} className="w-full">
                    <ClipboardCheck className="w-4 h-4 mr-2" />
                    {t('viewInspection')}
                  </Button>
                )}

                {/* Bouton Signaler Incident */}
                {canReportIncident && (
                  <Button variant="destructive" href={`/bookings/${booking.id}/incident/report`} className="w-full">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    {t('reportIncident')}
                  </Button>
                )}

                {/* Lien Voir Rapports d'Incidents */}
                {canViewIncidents && (
                  <Link
                    href={`/bookings/${booking.id}/incident/view`}
                    className="w-full text-center text-xs text-muted-foreground hover:text-primary hover:underline pt-1 transition-colors"
                  >
                    {t('viewIncidentReports')}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}