import React from 'react';
import { cache } from 'react';
import { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { serverApiClient } from '@/lib/apiClient';
import type { Vehicle } from '@/types/vehicle';
import VehicleDetailPage from './VehicleDetailPage';

type Props = {
  params: Promise<{ id: string }>;
};

// Wrapped in React's cache() so this fetch runs at most once per request even
// though it's called both from generateMetadata() and from the page body
// below — avoids a redundant server round-trip for the exact same vehicle.
// (serverApiClient's underlying fetch uses `cache: 'no-store'`, so we don't
// rely on Next's own fetch-dedup/memoization applying on top of that; React's
// cache() guarantees single-execution per request regardless.)
const getVehicle = cache(async (id: string): Promise<Vehicle | null> => {
  return await serverApiClient.get(`/api/vehicles/${id}`);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const t = await getTranslations('vehicles.metadata');
  const locale = await getLocale();

  try {
    const vehicle = await getVehicle(id);
    if (!vehicle) throw new Error('NOT_FOUND');

    const title = t('title', {
      make: vehicle.make,
      model: vehicle.model,
      price: vehicle.ratePerDay?.toLocaleString(locale) ?? '',
    });

    const locationLabel = vehicle.commune?.name || vehicle.province?.name || '';
    const description = vehicle.description && vehicle.description.trim() !== ''
      ? vehicle.description.slice(0, 160)
      : t('descriptionFallback', { make: vehicle.make, model: vehicle.model, location: locationLabel });

    const imageUrl = vehicle.images && vehicle.images.length > 0 ? vehicle.images[0].url : undefined;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: imageUrl ? [imageUrl] : undefined,
        type: 'website',
      },
    };
  } catch {
    return {
      title: t('genericTitle'),
      description: t('genericDescription'),
    };
  }
}

export default async function VehiclePage({ params }: Props) {
  const { id } = await params;
  // Same cached fetch as generateMetadata() above — second call here is free.
  // On failure (404/network error) serverApiClient.get() resolves to null
  // rather than throwing, so we simply pass null down and let
  // VehicleDetailPage fall back to its own client-side fetch/error handling.
  const vehicle = await getVehicle(id);

  return <VehicleDetailPage initialVehicle={vehicle} vehicleId={id} />;
}
