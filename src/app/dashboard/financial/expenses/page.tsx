// src/app/dashboard/financial/expenses/page.tsx
'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import ExpenseList from '@/app/components/financial/ExpenseList';
import { Info, AlertTriangle } from 'lucide-react';

export default function ExpensesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const isOwner = user?.role === 'OWNER' || user?.role === 'ADMIN';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-3 text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 px-4 py-6 rounded-md flex items-start">
        <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium mb-2">Accès restreint</p>
          <p className="text-sm">
            Cette section est réservée aux propriétaires de véhicules. Pour enregistrer des dépenses, vous devez d&apos;abord ajouter un véhicule à louer.
          </p>
          <button
            onClick={() => router.push('/dashboard/vehicles/add')}
            className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
          >
            Ajouter un véhicule
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-md flex items-start">
        <Info className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
          <p className="font-medium mb-1">Pourquoi suivre vos dépenses ?</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Calculez votre <strong>profit réel</strong> (revenus - dépenses)</li>
            <li>Optimisez la <strong>rentabilité</strong> de chaque véhicule</li>
            <li>Préparez votre <strong>déclaration fiscale</strong> (déductions possibles)</li>
            <li>Gardez une <strong>trace</strong> de tous vos frais avec reçus</li>
          </ul>
        </div>
      </div>

      {/* Liste des Dépenses */}
      <ExpenseList />
    </div>
  );
}