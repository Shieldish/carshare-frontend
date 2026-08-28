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
  Lock
} from 'lucide-react'; // ✅ AlertCircle supprimé (inutilisé), Lock ajouté
import { useChat } from '@/context/ChatContext';
import { useTranslations, useLocale } from 'next-intl';

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
        return {
          icon: <Clock className="w-5 h-5 text-orange-500" />,
          text: t('status.pendingConfirmationText'),
          description: t('status.pendingConfirmationDescription'),
          color: "text-orange-600 bg-orange-100 border-orange-200 dark:bg-orange-950 dark:border-orange-700 dark:text-orange-300"
        };
      // ✅ PENDING = rien n'a encore été payé ; le propriétaire ne devrait normalement jamais
      // voir ce statut (filtré côté backend), mais on garde un affichage neutre et sans
      // bouton d'action au cas où, plutôt que de l'inviter à "confirmer" quelque chose
      // qui n'a jamais été payé.
      case 'PENDING':
        return {
          icon: <Clock className="w-5 h-5 text-muted-foreground" />,
          text: t('status.pendingText'),
          description: t('status.pendingDescription'),
          color: "text-muted-foreground bg-muted border-border"
        };
      case 'CONFIRMED':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          text: t('status.confirmedText'),
          description: t('status.confirmedDescription'),
          color: "text-green-600 bg-green-100 border-green-200 dark:bg-green-950 dark:border-green-700 dark:text-green-300"
        };
      case 'CANCELLED':
        return {
          icon: <X className="w-5 h-5 text-red-500" />,
          text: t('status.cancelledText'),
          description: t('status.cancelledDescription'),
          color: "text-red-600 bg-red-100 border-red-200 dark:bg-red-950 dark:border-red-700 dark:text-red-300"
        };
      case 'IN_PROGRESS':
        return {
          icon: <Car className="w-5 h-5 text-purple-500" />,
          text: t('status.inProgressText'),
          description: t('status.inProgressDescription'),
          color: "text-purple-600 bg-purple-100 border-purple-200 dark:bg-purple-950 dark:border-purple-700 dark:text-purple-300"
        };
      case 'COMPLETED':
        return {
          icon: <CheckCircle className="w-5 h-5 text-blue-500" />,
          text: t('status.completedText'),
          description: t('status.completedDescription'),
          color: "text-blue-600 bg-blue-100 border-blue-200 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-300"
        };
      default:
        return {
          icon: <Clock className="w-5 h-5 text-muted-foreground" />,
          text: status,
          description: "",
          color: "text-muted-foreground bg-muted border-border"
        };
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
            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full border ${statusInfo.color} text-sm font-medium`}>
              <div className="flex items-center">
                {statusInfo.icon}
                <span className="ml-2">{statusInfo.text}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informations du véhicule et de la réservation */}
            <div>
              <div className="flex items-center mb-3">
                <Car className="w-5 h-5 text-primary mr-2" />
                <h3 className="text-xl font-bold text-foreground">
                  {booking.vehicle?.make} {booking.vehicle?.model}
                </h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="w-4 h-4 text-muted-foreground mr-2" />
                  <span className="text-muted-foreground">
                    <strong>{t('bookingRequest')}</strong>
                  </span>
                </div>

                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
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
                  <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
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
                  <DollarSign className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-lg font-bold text-green-600">
                    {t('yourShare', { amount: ownerShare.toLocaleString() })}
                  </span>
                </div>
              </div>
            </div>

            {/* Informations du client et actions */}
            <div>
              {needsAction && (
                <div>
                  <div className={`p-3 rounded-lg border ${statusInfo.color} mb-4`}>
                    <div className="flex items-start">
                      {statusInfo.icon}
                      <div className="ml-2">
                        <p className="font-medium">{statusInfo.text}</p>
                        <p className="text-sm opacity-80">{statusInfo.description}</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    {t('actionRequiredText', { amount: ownerShare.toLocaleString() })}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                      onClick={() => handleStatusUpdate('CONFIRMED')}
                      disabled={isLoading}
                      className="flex-1 bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed flex items-center justify-center font-medium transition-colors"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Check size={16} className="mr-2"/>
                      )}
                      {t('confirmAvailability')}
                    </button>
                    
                    <button
                      onClick={() => handleStatusUpdate('CANCELLED')}
                      disabled={isLoading}
                      className="flex-1 bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed flex items-center justify-center font-medium transition-colors"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <X size={16} className="mr-2"/>
                      )}
                      {t('vehicleNotAvailable')}
                    </button>
                  </div>
                  
                  {error && (
                    <div className="mt-3 p-3 bg-card border border-border rounded-lg">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}
                </div>
              )}
              
              {!needsAction && (
                <>
                  <div className={`p-4 rounded-lg border ${statusInfo.color} mb-4`}>
                    <div className="flex items-center">
                      {statusInfo.icon}
                      <div className="ml-3">
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
                <button
                  onClick={handleOpenChat}
                  className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg transition-colors flex items-center justify-center text-sm font-medium shadow-sm"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {t('chatWithRenter')}
                </button>

                {/* Bouton/Lien Inspection - conditionnel selon le statut */}
                {canInspect && (
                  <Link
                    href={`/bookings/${booking.id}/inspection`}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center text-sm font-medium shadow-md hover:shadow-lg"
                  >
                    <ClipboardCheck className="w-4 h-4 mr-2" />
                    {booking.status === 'CONFIRMED' ? t('checkIn') : t('checkOut')}
                  </Link>
                )}

                {/* Lien pour voir l'inspection si terminée */}
                {isCompleted && (
                  <Link
                    href={`/bookings/${booking.id}/inspection`}
                    className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg flex items-center justify-center text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <ClipboardCheck className="w-4 h-4 mr-2" />
                    {t('viewInspection')}
                  </Link>
                )}

                {/* Bouton Signaler Incident */}
                {canReportIncident && (
                  <Link
                    href={`/bookings/${booking.id}/incident/report`}
                    className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center text-sm font-medium shadow-md hover:shadow-lg"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    {t('reportIncident')}
                  </Link>
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