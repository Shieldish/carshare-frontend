import React from 'react';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AboutPage from './AboutPage';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('about');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: ['location voiture Burundi', 'peer-to-peer', 'voiture particulier', 'Bujumbura', 'transport'],
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      type: 'website',
    }
  };
}

export default function About() {
  return <AboutPage />;
}