'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Image as ImageIcon, Building2, User, Flame, Heart } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/apiClient';
import type { Vehicle } from '@/types/vehicle';
import { Badge } from './ui';

interface VehicleCardProps {
  vehicle: Vehicle;
  // ✅ FAVORIS : ids déjà favoris de l'utilisateur connecté (undefined = visiteur anonyme
  // ou chargement pas encore terminé) — permet d'afficher le cœur "rempli" sans devoir
  // récupérer les objets véhicules complets sur chaque page qui liste des véhicules.
  favoritedIds?: Set<number>;
  // Callback optionnel, utile par ex. sur /favorites pour retirer la carte de la liste
  // dès que le véhicule est "défavorisé" (au lieu d'attendre un rechargement complet).
  onFavoriteChange?: (vehicleId: number, isFavorited: boolean) => void;
}

export default function VehicleCard({ vehicle, favoritedIds, onFavoriteChange }: VehicleCardProps) {
  const t = useTranslations('vehicleCard');
  const locale = useLocale();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // ✅ FAVORIS : état local optimiste — se resynchronise si le prop change (ex: la liste
  // des ids favoris arrive un instant après le premier rendu de la carte).
  const [isFavorited, setIsFavorited] = useState(() => favoritedIds?.has(vehicle.id) ?? false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  useEffect(() => {
    setIsFavorited(favoritedIds?.has(vehicle.id) ?? false);
  }, [favoritedIds, vehicle.id]);

  const handleToggleFavorite = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // La carte entière est un <Link> vers la fiche véhicule : on empêche la navigation
    // et la propagation pour que le clic sur le cœur ne fasse QUE (dé)favoriser.
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    const nextState = !isFavorited;
    // UI optimiste : on bascule immédiatement, sans attendre la réponse du serveur.
    setIsFavorited(nextState);
    setIsTogglingFavorite(true);

    try {
      if (nextState) {
        await apiClient.post(`/api/favorites/${vehicle.id}`, {});
      } else {
        await apiClient.delete(`/api/favorites/${vehicle.id}`);
      }
      onFavoriteChange?.(vehicle.id, nextState);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des favoris:', error);
      // Échec : on revient à l'état précédent plutôt que de laisser un cœur mensonger.
      setIsFavorited(!nextState);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  // Image principale avec fallback amélioré
  const primaryImageUrl = vehicle.images && vehicle.images.length > 0
    ? vehicle.images[0].url
    : `https://source.unsplash.com/400x240/?car&sig=${vehicle.id}`;

  // Fonction pour obtenir l'affichage de la localisation - MÊME LOGIQUE QUE page.tsx
  const getLocationDisplay = (vehicle: Vehicle): string => {
    const parts: string[] = [];

    if (vehicle.address && vehicle.address.trim() !== '') {
      parts.push(vehicle.address);
    }

    // La commune est désormais le niveau "ville" pertinent (découpage 2025) : on
    // n'affiche la province que si on n'a même pas de commune.
    if (vehicle.commune) {
      parts.push(vehicle.commune.name);
    } else if (vehicle.province) {
      parts.push(vehicle.province.name);
    }

    // Utilise un Set pour retirer les doublons (ex: si l'adresse contient la ville)
    const uniqueParts = [...new Set(parts)];

    if (uniqueParts.length > 0) {
      return uniqueParts.join(', ');
    }

    return t('locationUnavailable');
  };

  const displayLocation = getLocationDisplay(vehicle);

  // Formatage du prix avec séparateurs
  const formatPrice = (price: number): string => {
    return price.toLocaleString(locale);
  };

  return (
    <Link href={`/vehicles/${vehicle.id}`} className="block h-full group">
      {/* h-full + flex-col : toutes les cartes d'une même rangée ont la même hauteur, même si
          certaines ont un badge de plus, et le bas de carte reste aligné. */}
      <article className="flex h-full flex-col bg-card rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1 border border-border">

        {/* Container d'image avec aspect ratio fixe */}
        <div className="relative shrink-0 overflow-hidden bg-muted" style={{ aspectRatio: '5/3' }}>
          <Image 
            src={primaryImageUrl} 
            alt={`${vehicle.make} ${vehicle.model}`} 
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
          />
          
          {/* Overlay au hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Rangée du haut : badges à gauche, favoris + prix à droite. Elle passe sur deux lignes
              quand la carte est étroite (carrousel mobile, 3 colonnes en xl) au lieu de se chevaucher. */}
          <div className="absolute inset-x-3 top-3 z-10 flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-col items-start gap-1.5">
              {/* Badge de statut si disponible */}
              {vehicle.isAvailable !== undefined && (
                <Badge variant={vehicle.isAvailable ? 'success' : 'destructive'}>
                  {vehicle.isAvailable ? t('available') : t('notAvailable')}
                </Badge>
              )}

              {/* ✅ HIÉRARCHIE DES BADGES (Simple et Pro : on n'en affiche qu'un seul) */}
              {vehicle.isBoosted ? (
                <Badge variant="boost" className="shadow-lg animate-pulse">
                  <Flame className="w-3 h-3" />
                  {t('featured')}
                </Badge>
              ) : vehicle.isOwnerPremium ? (
                <Badge variant="premium">
                  <span className="text-[10px]">👑</span>
                  {t('premiumOwner')}
                </Badge>
              ) : null}
            </div>

            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={isTogglingFavorite}
                aria-pressed={isFavorited}
                aria-label={isFavorited ? t('removeFromFavorites') : t('addToFavorites')}
                title={isFavorited ? t('removeFromFavorites') : t('addToFavorites')}
                className="flex items-center justify-center h-9 w-9 rounded-full bg-black/40 backdrop-blur-sm shadow-lg hover:bg-black/60 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Heart
                  className={`w-5 h-5 transition-colors ${
                    isFavorited ? 'fill-red-500 text-red-500' : 'text-white'
                  }`}
                />
              </button>

              <div className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm">
                <div className="text-sm font-bold whitespace-nowrap">{formatPrice(vehicle.ratePerDay)} FBu</div>
                <div className="text-xs opacity-90">{t('perDay')}</div>
              </div>
            </div>
          </div>

          {/* Indicateur du nombre d'images */}
          {vehicle.images && Array.isArray(vehicle.images) && vehicle.images.length > 1 && (
            <div className="absolute bottom-3 left-3 bg-black/60 text-white px-2 py-1 rounded-md text-xs flex items-center backdrop-blur-sm z-10">
              <ImageIcon className="w-3 h-3 mr-1" />
              <span>{vehicle.images.length}</span>
            </div>
          )}
        </div>

        {/* Contenu de la carte */}
        <div className="flex flex-1 flex-col p-5">
          
          {/* Titre du véhicule */}
          <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-1">
            {vehicle.make} {vehicle.model}
          </h3>

          {/* Nom de l'entreprise si disponible */}
          {vehicle.companyName && (
            <div className="flex items-center text-sm text-primary mb-3 bg-primary/10 px-2 py-1 rounded-md">
              <Building2 className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="font-medium truncate" title={vehicle.companyName}>{vehicle.companyName}</span>
            </div>
          )}

          {/* ✅ Badge Chauffeur Inclus */}
          {vehicle.supportsDriver && (
            <div className="mb-3">
              <Badge variant="neutral">
                <User className="w-3 h-3" />
                {t('driverIncluded')}
              </Badge>
            </div>
          )}
          
          {/* Prix */}
          <div className="mb-3">
            <p className="font-semibold text-primary text-lg">
              {formatPrice(vehicle.ratePerDay)} FBu{t('perDay')}
            </p>
          </div>
          
          {/* Localisation améliorée */}
          <div className="mb-4">
            <div className="flex items-center text-muted-foreground text-sm">
              <MapPin className="w-4 h-4 mr-3 flex-shrink-0 text-muted-foreground" />
              <span className="truncate" title={displayLocation}>{displayLocation}</span>
            </div>
          </div>

          {/* Call to action */}
          <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-3 border-t border-border">
            <div className="min-w-0 text-sm text-muted-foreground">
              {t('clickForMore')}
            </div>
            <div className="ml-auto text-sm font-medium text-primary group-hover:text-primary/80 transition-colors flex items-center">
              <span>{t('seeDetails')}</span>
              <svg 
                className="w-4 h-4 ml-1 shrink-0 transform group-hover:translate-x-1 transition-transform"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

// Composant de fallback pour les erreurs
export function VehicleCardSkeleton() {
  return (
    <div className="bg-card rounded-xl shadow-md overflow-hidden border border-border animate-pulse">
      <div className="bg-muted" style={{ aspectRatio: '5/3' }} />
      <div className="p-5">
        <div className="h-6 bg-muted rounded mb-2" />
        <div className="h-4 bg-muted rounded w-3/4 mb-4" />
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </div>
        <div className="h-4 bg-muted rounded w-1/4" />
      </div>
    </div>
  );
}

// Hook personnalisé pour la gestion des images (optionnel)
export function useVehicleImage(vehicle: Vehicle) {
  const primaryImageUrl = vehicle.images && vehicle.images.length > 0
    ? vehicle.images[0].url
    : `https://source.unsplash.com/400x240/?car&sig=${vehicle.id}`;

  return { primaryImageUrl };
}