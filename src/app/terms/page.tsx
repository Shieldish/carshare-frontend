import React from 'react';
import { Metadata } from 'next';
import TermsPage from './TermsPage';

export const metadata: Metadata = {
  title: 'Conditions d\'utilisation - CarShare Burundi',
  description: 'Conditions générales d\'utilisation de CarShare Burundi. Consultez nos termes et conditions pour la location de voitures entre particuliers.',
  keywords: ['conditions utilisation', 'termes légaux', 'CarShare Burundi', 'location voiture'],
  openGraph: {
    title: 'Conditions d\'utilisation - CarShare Burundi',
    description: 'Termes et conditions d\'utilisation de la plateforme CarShare Burundi',
    type: 'website',
    locale: 'fr_FR',
  }
};

export default function Terms() {
  return <TermsPage />;
}