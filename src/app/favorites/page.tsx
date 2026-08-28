'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/apiClient';
import VehicleCard, { VehicleCardSkeleton } from '../components/VehicleCard';
import type { Vehicle } from '@/types/vehicle';

export default function FavoritesPage() {
  const t = useTranslations('favorites');
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      router.push('/login?redirect=/favorites');
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setLoadError(false);

    apiClient
      .get('/api/favorites')
      .then((data: unknown) => {
        if (!cancelled) setVehicles(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error('Impossible de charger les favoris:', error);
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, isAuthLoading, router]);

  // Retire immédiatement une carte de la liste dès qu'elle est "défavorisée" — sur une
  // page de wishlist, l'utilisateur s'attend à voir la carte disparaître tout de suite,
  // pas seulement le cœur se vider (comportement Turo/Amazon).
  const handleFavoriteChange = (vehicleId: number, isFavorited: boolean) => {
    if (!isFavorited) {
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    }
  };

  // Tous les véhicules affichés ici sont par définition favoris : on le redonne en prop
  // pour que chaque VehicleCard affiche son cœur "rempli" dès le premier rendu.
  const favoritedIds = new Set(vehicles.map((v) => v.id));

  // Le useEffect ci-dessus gère la redirection d'un visiteur non connecté : tant que le
  // statut d'auth n'est pas résolu, ou qu'on sait déjà qu'il n'y a pas d'utilisateur (la
  // redirection est en cours), on n'affiche rien pour éviter un flash de contenu.
  if (isAuthLoading || !user) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 bg-background min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3">
          <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-primary fill-primary/10" />
          {t('pageTitle')}
        </h1>
        {!isLoading && !loadError && vehicles.length > 0 && (
          <p className="text-foreground/70 mt-2">
            {vehicles.length > 1
              ? t('subtitlePlural', { count: vehicles.length })
              : t('subtitleSingular', { count: vehicles.length })}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <VehicleCardSkeleton key={i} />
          ))}
        </div>
      ) : loadError ? (
        <div className="text-center py-16 bg-card rounded-xl shadow-sm border border-border">
          <p className="text-red-500 font-medium">{t('loadError')}</p>
        </div>
      ) : vehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              favoritedIds={favoritedIds}
              onFavoriteChange={handleFavoriteChange}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-xl shadow-sm border border-dashed border-border">
          <div className="max-w-md mx-auto">
            <Heart className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-card-foreground mb-2">
              {t('emptyTitle')}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t('emptyDescription')}
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-lg transition-colors shadow-sm hover:shadow-md font-medium"
            >
              <Search className="w-4 h-4" />
              {t('browseCta')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
