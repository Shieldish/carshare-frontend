'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Image as ImageIcon, Building2, User, Flame } from 'lucide-react';
import type { Vehicle } from '../types/vehicle';

interface VehicleCardProps {
  vehicle: Vehicle;
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
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

    // Logique améliorée
    if (vehicle.commune) {
      parts.push(vehicle.commune.name);
      parts.push(vehicle.commune.province.name);
    } else if (vehicle.province) { // Cas où seule la province est définie
      parts.push(vehicle.province.name);
    }

    // Utilise un Set pour retirer les doublons (ex: si l'adresse contient la ville)
    const uniqueParts = [...new Set(parts)];

    if (uniqueParts.length > 0) {
      return uniqueParts.join(', ');
    }

    return 'Localisation non disponible';
  };

  const displayLocation = getLocationDisplay(vehicle);

  // Formatage du prix avec séparateurs
  const formatPrice = (price: number): string => {
    return price.toLocaleString('fr-FR');
  };

  return (
    <Link href={`/vehicles/${vehicle.id}`} className="block group">
      <article className="bg-card rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1 border border-border">
        
        {/* Container d'image avec aspect ratio fixe */}
        <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: '5/3' }}>
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
          
          {/* ✅ HIÉRARCHIE DES BADGES (Simple et Pro : on n'en affiche qu'un seul) */}
          {vehicle.isBoosted ? (
            <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 z-10 animate-pulse">
              <Flame className="w-3 h-3" />
              <span>En vedette</span>
            </div>
          ) : vehicle.isOwnerPremium ? (
            <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 text-yellow-500 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 z-10">
              <span className="text-[10px]">👑</span>
              <span className="text-white">Propriétaire Premium</span>
            </div>
          ) : null}

          {/* Badge prix */}
          <div className="absolute top-3 right-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-2 rounded-lg shadow-lg backdrop-blur-sm z-10">
            <div className="text-sm font-bold">{formatPrice(vehicle.ratePerDay)} FBu</div>
            <div className="text-xs opacity-90">/jour</div>
          </div>

          {/* Indicateur du nombre d'images */}
          {vehicle.images && Array.isArray(vehicle.images) && vehicle.images.length > 1 && (
            <div className="absolute bottom-3 left-3 bg-black/60 text-white px-2 py-1 rounded-md text-xs flex items-center backdrop-blur-sm z-10">
              <ImageIcon className="w-3 h-3 mr-1" />
              <span>{vehicle.images.length}</span>
            </div>
          )}

          {/* Badge de statut si disponible */}
          {vehicle.isAvailable !== undefined && (
            <div className={`absolute top-3 left-3 px-2 py-1 rounded-md text-xs font-medium z-10 ${
              vehicle.isAvailable 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {vehicle.isAvailable ? 'Disponible' : 'Non disponible'}
            </div>
          )}
        </div>

        {/* Contenu de la carte */}
        <div className="p-5">
          
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
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                <User className="w-3 h-3 mr-1" />
                Chauffeur inclus
              </span>
            </div>
          )}
          
          {/* Prix */}
          <div className="mb-3">
            <p className="font-semibold text-primary text-lg">
              {formatPrice(vehicle.ratePerDay)} FBu/jour
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
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Cliquez pour voir plus
            </div>
            <div className="text-sm font-medium text-primary group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors flex items-center">
              <span>Voir détails</span>
              <svg 
                className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" 
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