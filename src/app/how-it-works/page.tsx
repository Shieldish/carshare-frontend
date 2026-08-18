// app/how-it-works/page.tsx
import { getTranslations } from 'next-intl/server';
import HowItWorksPage from './HowItWorksPage';

export async function generateMetadata() {
  const t = await getTranslations('howItWorks');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: 'CarShare Burundi, location voiture, peer-to-peer, comment ça marche, Bujumbura',
  };
}

export default function Page() {
  return <HowItWorksPage />;
}

// app/how-it-works/HowItWorksPage.tsx
// (Le composant React que j'ai créé précédemment)