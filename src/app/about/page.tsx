import React from 'react';
import { Metadata } from 'next';
import AboutPage from './AboutPage';

export const metadata: Metadata = {
  title: 'À Propos - CarShare Burundi',
  description: 'Découvrez CarShare Burundi, la première plateforme de location de voitures entre particuliers au Burundi. Simple, sécurisé et abordable.',
  keywords: ['location voiture Burundi', 'peer-to-peer', 'voiture particulier', 'Bujumbura', 'transport'],
  openGraph: {
    title: 'À Propos - CarShare Burundi',
    description: 'La première plateforme de location de voitures entre particuliers au Burundi',
    type: 'website',
    locale: 'fr_FR',
  }
};

export default function About() {
  return <AboutPage />;
}