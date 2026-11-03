import React from 'react';
import { cn } from '@/lib/cn';
import { Badge } from './Badge';

export type StatCardTone = 'primary' | 'success' | 'warning' | 'destructive' | 'accent' | 'info' | 'purple' | 'neutral';

const toneClasses: Record<StatCardTone, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  destructive: 'bg-destructive/10 text-destructive',
  accent: 'bg-accent/10 text-accent',
  // Tuiles supplémentaires pour les tableaux de bord à plusieurs métriques
  // (admin) qui ont besoin de plus de teintes distinctes que les 5 rôles
  // sémantiques ci-dessus n'en offrent.
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  neutral: 'bg-muted text-muted-foreground',
};

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  tone?: StatCardTone;
  trend?: { value: string; positive?: boolean };
  className?: string;
}

/**
 * Carte stat unique — remplace les 3 variantes divergentes (grille `bg-card`
 * du dashboard owner, carte `bg-primary` en dégradé de FinancialSummaryCard,
 * tuiles admin avec puce de tendance) par un seul composant à teinte
 * paramétrable. La tendance réutilise `Badge` plutôt qu'une 4e pastille
 * colorée maison.
 */
export function StatCard({ icon: Icon, label, value, tone = 'primary', trend, className }: StatCardProps) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-md', toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <Badge variant={trend.positive === false ? 'destructive' : 'success'} className="shrink-0">
            {trend.value}
          </Badge>
        )}
      </div>
      <p className="mt-4 text-h2 text-foreground">{value}</p>
      <p className="text-small text-muted-foreground">{label}</p>
    </div>
  );
}

export default StatCard;
