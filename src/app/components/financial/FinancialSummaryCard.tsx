// src/app/components/financial/FinancialSummaryCard.tsx
'use client';

import React from 'react';
import type { OwnerFinancialSummary } from '@/types/financial';
import { DollarSign, CheckSquare, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StatCard } from '@/app/components/ui';

interface Props {
  summary: OwnerFinancialSummary | null;
  isLoading: boolean;
  error?: string | null;
}

const FinancialSummaryCard: React.FC<Props> = ({ summary, isLoading, error }) => {
  const t = useTranslations('financial');

  if (isLoading) {
    return (
      <div className="bg-card p-6 rounded-lg shadow border border-border animate-pulse">
        <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-muted rounded w-1/3"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive" role="alert">
        {t('summaryError')}: {error}
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-card p-6 rounded-lg shadow border border-border text-center">
        <p className="text-muted-foreground">{t('summaryEmpty')}</p>
      </div>
    );
  }

  const netIsNegative = Boolean(summary.netEarnings && summary.netEarnings < 0);

  return (
    <div>
      <h2 className="mb-4 flex items-center text-h3 text-foreground">
        <TrendingUp className="mr-2 h-5 w-5 text-primary" />
        {t('summaryTitle')}
      </h2>

      {/* Grille à 3 colonnes pour Revenus, Dépenses, Bénéfice */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={DollarSign}
          label={t('totalRevenueLabel')}
          value={`${summary.totalEarnings?.toLocaleString('fr-FR') ?? 0} FBu`}
          tone="success"
        />
        <StatCard
          icon={TrendingDown}
          label={t('totalExpensesLabel')}
          value={`${summary.totalExpenses?.toLocaleString('fr-FR') ?? 0} FBu`}
          tone="destructive"
        />
        <StatCard
          icon={Wallet}
          label={t('netProfitLabel')}
          value={`${summary.netEarnings?.toLocaleString('fr-FR') ?? 0} FBu`}
          tone={netIsNegative ? 'destructive' : 'accent'}
        />
      </div>

      {/* Réservations complétées */}
      <div className="mt-4 rounded-lg bg-muted p-3 text-center text-small font-medium text-muted-foreground">
        <CheckSquare size={16} className="-mt-0.5 mr-1.5 inline" />
        {t('completedBookingsLabel')}: {summary.completedBookingsCount ?? 0}
      </div>

      <p className="mt-3 text-center text-micro text-muted-foreground">{t('summaryFootnote')}</p>
    </div>
  );
};

export default FinancialSummaryCard;