// src/app/components/financial/FinancialSummaryCard.tsx
'use client';

import React from 'react';
import type { OwnerFinancialSummary } from '@/app/types/financial';
import { DollarSign, CheckSquare, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface Props {
  summary: OwnerFinancialSummary | null;
  isLoading: boolean;
  error?: string | null;
}

const FinancialSummaryCard: React.FC<Props> = ({ summary, isLoading, error }) => {
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
      <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-md" role="alert">
        Erreur: {error}
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-card p-6 rounded-lg shadow border border-border text-center">
        <p className="text-muted-foreground">Aucune donnée financière disponible.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 text-white p-6 rounded-xl shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 opacity-80" />
          Résumé Financier
        </h2>
      </div>
      
      {/* Grille à 3 colonnes pour Revenus, Dépenses, Bénéfice */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Revenus */}
        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
          <div className="flex items-center text-sm font-medium opacity-80 mb-1">
            <DollarSign size={16} className="mr-1.5 text-green-300" />
            Revenus Totaux (Nets)
          </div>
          <div className="text-2xl font-bold">
            {summary.totalEarnings?.toLocaleString('fr-FR') ?? 0} FBu
          </div>
        </div>
        
        {/* Dépenses */}
        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
          <div className="flex items-center text-sm font-medium opacity-80 mb-1">
            <TrendingDown size={16} className="mr-1.5 text-red-300" />
            Dépenses Enregistrées
          </div>
          <div className="text-2xl font-bold">
            {summary.totalExpenses?.toLocaleString('fr-FR') ?? 0} FBu
          </div>
        </div>
        
        {/* Bénéfice Net */}
        <div className="bg-white/20 backdrop-blur-sm p-4 rounded-lg border border-white/30">
          <div className="flex items-center text-sm font-medium opacity-90 mb-1">
            <Wallet size={16} className="mr-1.5 text-yellow-300" />
            Bénéfice Net Estimé
          </div>
          <div className={`text-2xl font-bold ${summary.netEarnings && summary.netEarnings < 0 ? 'text-red-300' : 'text-yellow-300'}`}>
            {summary.netEarnings?.toLocaleString('fr-FR') ?? 0} FBu
          </div>
        </div>
      </div>
      
      {/* Réservations complétées */}
      <div className="mt-4 bg-white/10 backdrop-blur-sm p-3 rounded-lg text-center">
        <div className="flex items-center justify-center text-sm font-medium opacity-80">
          <CheckSquare size={16} className="mr-1.5" />
          Réservations Complétées (Période): {summary.completedBookingsCount ?? 0}
        </div>
      </div>
      
      <p className="text-xs opacity-70 mt-3 text-center">
        Basé sur les paiements confirmés et dépenses enregistrées pour la période sélectionnée.
      </p>
    </div>
  );
};

export default FinancialSummaryCard;