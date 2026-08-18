import React from 'react';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import TermsPage from './TermsPage';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('terms');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: ['conditions utilisation', 'termes légaux', 'CarShare Burundi', 'location voiture'],
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      type: 'website',
    }
  };
}

export default function Terms() {
  return <TermsPage />;
}