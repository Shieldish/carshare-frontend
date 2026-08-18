import React from 'react';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import PrivacyPage from './PrivacyPage';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('privacy');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: ['confidentialité', 'protection données', 'RGPD', 'CarShare Burundi', 'vie privée'],
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      type: 'website',
    }
  };
}

export default function Privacy() {
  return <PrivacyPage />;
}