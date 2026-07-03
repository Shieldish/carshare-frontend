import React from 'react';
import { Metadata } from 'next';
import FAQPage from './FAQPage';

export const metadata: Metadata = {
  title: 'FAQ - CarShare Burundi',
  description: 'Questions fréquemment posées sur CarShare Burundi. Trouvez rapidement les réponses sur la location de voitures entre particuliers au Burundi.',
  keywords: ['FAQ CarShare', 'questions location voiture', 'aide CarShare Burundi', 'support client'],
  openGraph: {
    title: 'FAQ - CarShare Burundi',
    description: 'Toutes les réponses à vos questions sur la location de voitures entre particuliers',
    type: 'website',
    locale: 'fr_FR',
  }
};

export default function FAQ() {
  return <FAQPage />;
}