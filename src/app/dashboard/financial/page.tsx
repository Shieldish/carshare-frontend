// src/app/dashboard/financial/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import FinancialSummaryCard from '@/app/components/financial/FinancialSummaryCard';
import type { OwnerFinancialSummary, TransactionDetail } from '@/app/types/financial';
import { Calendar as CalendarIcon, FilterX, ArrowRight, Loader2 } from 'lucide-react';

export default function FinancialDashboardPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [summary, setSummary] = useState<OwnerFinancialSummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  const isOwner = user?.role === 'OWNER' || user?.role === 'ADMIN';

  const loadSummary = useCallback(async (start?: Date, end?: Date) => {
    if (!isOwner) {
      setSummary(null);
      setIsLoadingSummary(false);
      return;
    }
    setIsLoadingSummary(true);
    setSummaryError(null);
    try {
      const data = await apiClient.getOwnerFinancialSummary(start, end);
      setSummary(data);
    } catch (err: any) {
      console.error("Error fetching summary:", err);
      setSummaryError(err.message || "Impossible de charger le résumé.");
    } finally {
      setIsLoadingSummary(false);
    }
  }, [isOwner]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      router.push('/login?redirect=/dashboard/financial');
      return;
    }
    loadSummary(startDate ?? undefined, endDate ?? undefined);
  }, [user, isAuthLoading, router, startDate, endDate, loadSummary]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value ? new Date(e.target.value) : null);
    setSelectedPeriod('custom');
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value ? new Date(e.target.value) : null);
    setSelectedPeriod('custom');
  };

  const handlePeriodSelect = (period: string) => {
    setSelectedPeriod(period);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start: Date | null = null;
    let end: Date | null = new Date(today);
    end.setHours(23, 59, 59, 999);

    switch (period) {
      case 'today':
        start = new Date(today);
        break;
      case 'last7':
        start = new Date(today);
        start.setDate(today.getDate() - 6);
        break;
      case 'last30':
        start = new Date(today);
        start.setDate(today.getDate() - 29);
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      case 'all':
      default:
        start = null;
        end = null;
        break;
    }
    setStartDate(start);
    setEndDate(end);
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectedPeriod('all');
  };

  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filtres de Date */}
      <div className="bg-card p-4 rounded-lg shadow border border-border">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-medium text-foreground flex items-center">
            <CalendarIcon size={18} className="mr-2 text-muted-foreground"/>
            Période :
          </span>
          
          <div className="flex flex-wrap gap-2">
            {['all', 'today', 'last7', 'last30', 'month', 'year'].map(p => (
              <button
                key={p}
                onClick={() => handlePeriodSelect(p)}
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  selectedPeriod === p
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                }`}
              >
                {p === 'all' ? 'Tout' : 
                 p === 'today' ? "Auj." : 
                 p === 'last7' ? '7 jours' : 
                 p === 'last30' ? '30 jours' : 
                 p === 'month' ? 'Ce mois' : 
                 'Cette année'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-grow md:flex-grow-0">
            <input
              type="date"
              value={formatDateForInput(startDate)}
              onChange={handleStartDateChange}
              max={formatDateForInput(endDate || new Date())}
              className="px-2 py-1.5 border border-border bg-background rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <span className="text-muted-foreground">-</span>
            <input
              type="date"
              value={formatDateForInput(endDate)}
              onChange={handleEndDateChange}
              min={formatDateForInput(startDate)}
              max={formatDateForInput(new Date())}
              className="px-2 py-1.5 border border-border bg-background rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-xs rounded-md font-medium bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive flex items-center gap-1"
              title="Effacer les filtres de date"
            >
              <FilterX size={14}/> Effacer
            </button>
          )}
        </div>
      </div>

      {/* Résumé Financier */}
      {isOwner && (
        <FinancialSummaryCard
          summary={summary}
          isLoading={isLoadingSummary}
          error={summaryError}
        />
      )}

      {/* Actions Rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => router.push('/dashboard/financial/revenue')}
          className="bg-card hover:bg-muted border border-border rounded-lg p-6 text-left transition-colors group"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Gérer les Revenus</h3>
              <p className="text-sm text-muted-foreground">
                Consultez l'historique complet de vos transactions et paiements
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </button>

        <button
          onClick={() => router.push('/dashboard/financial/expenses')}
          className="bg-card hover:bg-muted border border-border rounded-lg p-6 text-left transition-colors group"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Gérer les Dépenses</h3>
              <p className="text-sm text-muted-foreground">
                Enregistrez et suivez toutes vos dépenses liées aux véhicules
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </button>
      </div>

      {/* Message pour non-propriétaires */}
      {!isOwner && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-md">
          <p className="text-sm">
            Accédez à vos transactions dans l'onglet <strong>Revenus</strong>.
          </p>
        </div>
      )}
    </div>
  );
}