// src/app/dashboard/financial/revenue/page.tsx
'use client';

import React, { useState } from 'react';
import TransactionList from '@/app/components/financial/TransactionList';
import { Calendar as CalendarIcon, FilterX, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function RevenuePage() {
  const t = useTranslations('dashboardFinancial');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

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

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-muted border border-border text-muted-foreground px-4 py-3 rounded-md flex items-start">
        <Info className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium mb-1">{t('revenueInfoTitle')}</p>
          <p>{t('revenueInfoDescription')}</p>
        </div>
      </div>

      {/* Filtres de Date */}
      <div className="bg-card p-4 rounded-lg shadow border border-border">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-medium text-foreground flex items-center">
            <CalendarIcon size={18} className="mr-2 text-muted-foreground"/>
            {t('periodLabel')}
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
                {p === 'all' ? t('periodAll') :
                 p === 'today' ? t('periodToday') :
                 p === 'last7' ? t('periodLast7') :
                 p === 'last30' ? t('periodLast30') :
                 p === 'month' ? t('periodMonth') :
                 t('periodYear')}
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
              title={t('clearFiltersTitle')}
            >
              <FilterX size={14}/> {t('clearFilters')}
            </button>
          )}
        </div>
      </div>

      {/* Liste des Transactions */}
      <TransactionList
        startDate={startDate ?? undefined}
        endDate={endDate ?? undefined}
        key={`transactions-${startDate?.toISOString()}-${endDate?.toISOString()}`}
      />
    </div>
  );
}