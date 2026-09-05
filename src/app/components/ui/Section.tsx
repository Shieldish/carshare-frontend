import React from 'react';
import { cn } from '@/lib/cn';

type SectionProps = React.HTMLAttributes<HTMLDivElement> & {
  as?: 'section' | 'div';
};

/**
 * Conteneur + rythme vertical cohérent pour les sections de contenu
 * (largeur max centrée, paddings horizontaux/verticaux standardisés).
 */
export function Section({ as = 'section', className, children, ...props }: SectionProps) {
  const Tag = as;
  return (
    <Tag className={cn('container mx-auto px-4 py-8', className)} {...props}>
      {children}
    </Tag>
  );
}

export default Section;
