// src/app/dashboard/financial/expenses/page.tsx
'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import ExpenseList from '@/app/components/financial/ExpenseList';
import { Info, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/app/components/ui';

export default function ExpensesPage() {
  const t = useTranslations('dashboardFinancial');
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const isOwner = user?.role === 'OWNER' || user?.role === 'ADMIN';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-3 text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-6 text-amber-800 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300 flex items-start">
        <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium mb-2">{t('expensesRestrictedTitle')}</p>
          <p className="text-sm">
            {t('expensesRestrictedDescription')}
          </p>
          <Button size="sm" onClick={() => router.push('/dashboard/vehicles/add')} className="mt-3">
            {t('addVehicleButton')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-muted border border-border text-muted-foreground px-4 py-3 rounded-md flex items-start">
        <Info className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium mb-1">{t('expensesInfoTitle')}</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>{t('expensesInfoItem1')}</li>
            <li>{t('expensesInfoItem2')}</li>
            <li>{t('expensesInfoItem3')}</li>
            <li>{t('expensesInfoItem4')}</li>
          </ul>
        </div>
      </div>

      {/* Liste des Dépenses */}
      <ExpenseList />
    </div>
  );
}