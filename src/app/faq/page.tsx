import React from 'react';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import FAQPage from './FAQPage';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('faq');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: ['FAQ CarShare', 'questions location voiture', 'aide CarShare Burundi', 'support client'],
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      type: 'website',
    }
  };
}

export default function FAQ() {
  return <FAQPage />;
}