import React from 'react';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { serverApiClient } from '@/lib/apiClient';
import type { PublicOwnerProfile } from '@/types/user';
import HostProfilePage from './HostProfilePage';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const t = await getTranslations('hosts');

  try {
    const profile: PublicOwnerProfile | null = await serverApiClient.get(`/api/users/${id}/public-profile`);
    if (!profile) throw new Error('NOT_FOUND');

    const displayName = `${profile.firstName} ${profile.lastInitial}`;
    const title = t('metaTitle', { name: displayName });
    const description = profile.bio && profile.bio.trim() !== ''
      ? profile.bio
      : t('metaDescriptionFallback', { name: displayName });

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: profile.profilePictureUrl ? [profile.profilePictureUrl] : undefined,
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

export default async function HostPage({ params }: Props) {
  const { id } = await params;
  return <HostProfilePage id={id} />;
}
