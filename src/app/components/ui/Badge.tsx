import React from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'primary' | 'boost' | 'premium' | 'success' | 'destructive' | 'neutral';

const base = 'inline-flex items-center gap-1 rounded-full text-micro font-semibold px-2.5 py-1';

const variants: Record<BadgeVariant, string> = {
  primary: 'bg-primary/10 text-primary',
  // Mise en avant "boosté" — utilise le token --accent (dédié à cet usage,
  // remplace l'ancien dégradé orange→rouge codé en dur).
  boost: 'bg-accent text-accent-foreground shadow-sm',
  // Traitement "verre sombre + or" volontairement distinct : signale un
  // propriétaire premium sans se fondre dans les autres badges.
  premium: 'bg-slate-900/85 backdrop-blur-md border border-slate-700/50 text-amber-400 shadow-lg',
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  destructive: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  neutral: 'bg-muted text-muted-foreground',
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

/**
 * Pastille de statut unique — unifie les 5 traitements de badge dupliqués
 * dans VehicleCard.tsx (boosté, propriétaire premium, disponibilité,
 * chauffeur inclus).
 */
export function Badge({ variant = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span className={cn(base, variants[variant], className)} {...props}>
      {children}
    </span>
  );
}

export default Badge;
