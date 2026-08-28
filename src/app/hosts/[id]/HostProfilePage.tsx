'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, BadgeCheck, Calendar, Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/apiClient';
import type { PublicOwnerProfile } from '@/types/user';
import type { Vehicle } from '@/types/vehicle';
import VehicleCard from '@/app/components/VehicleCard';
import { StarRating } from '@/app/components/reviews/VehicleReviews';

interface HostProfilePageProps {
  id: string;
}

function HeaderSkeleton() {
  return (
    <div className="bg-card rounded-2xl shadow-lg border border-border p-6 sm:p-8 mb-8 animate-pulse">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-28 h-28 rounded-full bg-muted flex-shrink-0" />
        <div className="flex-1 w-full space-y-3">
          <div className="h-7 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

export default function HostProfilePage({ id }: HostProfilePageProps) {
  const t = useTranslations('hosts');
  const [profile, setProfile] = useState<PublicOwnerProfile | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      setIsLoading(true);
      setNotFound(false);

      try {
        const data: PublicOwnerProfile = await apiClient.get(`/api/users/${id}/public-profile`);
        if (ignore) return;
        setProfile(data);
      } catch (err) {
        console.error('Erreur lors du chargement du profil hôte', err);
        if (!ignore) {
          setNotFound(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'}/api/vehicles`);
        if (response.ok) {
          const data: Vehicle[] = await response.json();
          if (!ignore) {
            setVehicles(data.filter((v) => v.ownerId === Number(id)));
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement des véhicules de l\'hôte', err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <HeaderSkeleton />
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="flex items-center justify-center w-14 h-14 mx-auto mb-4 bg-muted rounded-full">
            <User className="w-7 h-7 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">{t('notFoundTitle')}</h1>
          <p className="text-muted-foreground mb-6">{t('notFoundText')}</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-3 rounded-lg font-medium transition-colors"
          >
            {t('backToHome')}
          </Link>
        </div>
      </div>
    );
  }

  const displayName = `${profile.firstName} ${profile.lastInitial}`;
  const memberSinceYear = profile.memberSince ? new Date(profile.memberSince).getFullYear() : null;
  const hasReviews = profile.reviewCount > 0 && profile.averageRating != null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* En-tête du profil */}
        <div className="bg-card rounded-2xl shadow-lg border border-border p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
              {profile.profilePictureUrl ? (
                <Image
                  src={profile.profilePictureUrl}
                  alt={displayName}
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-14 h-14 text-gray-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{displayName}</h1>
                {profile.verified && (
                  <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                    <BadgeCheck className="w-4 h-4" />
                    {t('verifiedBadge')}
                  </span>
                )}
              </div>

              {profile.companyName && (
                <div className="flex items-center gap-2 text-primary mt-2">
                  <Building2 className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{profile.companyName}</span>
                </div>
              )}

              {memberSinceYear && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm mt-2">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>{t('memberSince', { year: memberSinceYear })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Statistiques */}
          <div className="flex flex-wrap items-center gap-8 mt-6 pt-6 border-t border-border">
            <div>
              <p className="text-2xl font-bold text-foreground">{profile.vehicleCount}</p>
              <p className="text-sm text-muted-foreground">
                {profile.vehicleCount === 1 ? t('statVehicleSingular') : t('statVehiclePlural')}
              </p>
            </div>

            <div>
              {hasReviews ? (
                <div className="flex items-center gap-2">
                  <StarRating value={profile.averageRating as number} size={20} />
                  <span className="font-bold text-foreground">{(profile.averageRating as number).toFixed(1)}</span>
                  <span className="text-muted-foreground text-sm">{t('reviewCount', { count: profile.reviewCount })}</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">{t('noReviewsYet')}</p>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && profile.bio.trim() !== '' && (
            <div className="mt-6 pt-6 border-t border-border">
              <h2 className="text-lg font-semibold text-foreground mb-2">{t('aboutTitle')}</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{profile.bio}</p>
            </div>
          )}
        </div>

        {/* Véhicules de l'hôte */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">{t('vehiclesSectionTitle')}</h2>

          {vehicles.length === 0 ? (
            <div className="text-center py-10 bg-muted/50 rounded-xl">
              <p className="text-muted-foreground">{t('noVehiclesListed')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
