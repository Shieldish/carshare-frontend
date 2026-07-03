import React from 'react';
import { Metadata } from 'next';
import PrivacyPage from './PrivacyPage';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité - CarShare Burundi',
  description: 'Politique de confidentialité et protection des données personnelles de CarShare Burundi. Découvrez comment nous collectons et protégeons vos informations.',
  keywords: ['confidentialité', 'protection données', 'RGPD', 'CarShare Burundi', 'vie privée'],
  openGraph: {
    title: 'Politique de Confidentialité - CarShare Burundi',
    description: 'Notre engagement pour la protection de vos données personnelles',
    type: 'website',
    locale: 'fr_FR',
  }
};

export default function Privacy() {
  return <PrivacyPage />;
}