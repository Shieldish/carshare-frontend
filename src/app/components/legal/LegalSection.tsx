import React from 'react';
import { cn } from '@/lib/cn';

interface LegalSectionProps {
  icon: React.ElementType;
  /** Couleur de l'icône, dark: inclus (ex. "text-blue-600 dark:text-blue-400") — chaque
   * section de Terms/Privacy avait sa propre teinte sans variante dark, seul endroit de
   * ces deux pages où ce motif manquait. */
  iconClassName: string;
  title: string;
  children: React.ReactNode;
}

/**
 * Bloc "icône + titre + carte" unique — remplace les 9 répétitions quasi
 * identiques de ce motif dans TermsPage.tsx et PrivacyPage.tsx.
 */
export function LegalSection({ icon: Icon, iconClassName, title, children }: LegalSectionProps) {
  return (
    <section className="mb-12">
      <h2 className="text-xl sm:text-3xl font-bold mb-6 text-foreground flex items-center">
        <Icon className={cn('w-8 h-8 mr-3 shrink-0', iconClassName)} />
        <span className="min-w-0">{title}</span>
      </h2>
      <div className="bg-card rounded-2xl p-5 sm:p-8 shadow-lg border border-border">
        {children}
      </div>
    </section>
  );
}

/** Variante sans icône dans le titre (sections de clôture : annulation, contact, etc.). */
export function LegalSectionPlain({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      {title && <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-foreground">{title}</h2>}
      {children}
    </section>
  );
}

/** Titre de sous-section + liste à puces — motif répété 2-3x dans la plupart des sections. */
export function LegalList({ title, items, last }: { title: string; items: string[]; last?: boolean }) {
  return (
    <>
      <h3 className="font-semibold text-xl mb-4 text-foreground">{title}</h3>
      <ul className={cn('list-disc list-inside space-y-2 text-muted-foreground', !last && 'mb-6')}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </>
  );
}

export default LegalSection;
