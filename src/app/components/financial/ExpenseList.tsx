// src/app/components/financial/ExpenseList.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Expense, ExpenseCategory } from '@/app/types/financial';
import type { Page } from '@/app/types/page';
import { apiClient } from '@/lib/apiClient';
import { Loader2, Trash2, Edit2, ChevronLeft, ChevronRight, Filter, Calendar, Paperclip, CalendarPlus } from 'lucide-react';
import ExpenseForm from './ExpenseForm';

const categoryLabels: Record<ExpenseCategory, string> = {
  FUEL: 'Carburant',
  MAINTENANCE: 'Entretien',
  CLEANING: 'Nettoyage',
  INSURANCE: 'Assurance',
  TAXES: 'Taxes/Vignettes',
  PARKING: 'Parking',
  OTHER: 'Autre'
};

interface Vehicle {
  id: number;
  make: string;
  model: string;
  manufacturingYear: number;
}

interface ExpenseListProps {
  initialVehicleId?: number;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ initialVehicleId }) => {
  const [expensesPage, setExpensesPage] = useState<Page<Expense> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  const [filterVehicleId, setFilterVehicleId] = useState<number | undefined>(initialVehicleId);
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [userVehicles, setUserVehicles] = useState<Vehicle[]>([]);

  const pageSize = 10;

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const vehiclesData = await apiClient.get('/api/users/me/vehicles');
        setUserVehicles(vehiclesData || []);
      } catch (err) {
        console.error("Erreur chargement véhicules filtre:", err);
      }
    };
    fetchVehicles();
  }, []);

  const loadExpenses = useCallback(async (page: number = 0) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.getMyExpenses(
        filterVehicleId,
        filterStartDate ?? undefined,
        filterEndDate ?? undefined,
        page,
        pageSize
      );
      setExpensesPage(response);
    } catch (err: unknown) {
      console.error("Error fetching expenses:", err);
      setError(err instanceof Error ? err.message : "Impossible de charger les dépenses.");
      setExpensesPage(null);
    } finally {
      setIsLoading(false);
    }
  }, [filterVehicleId, filterStartDate, filterEndDate]);

  useEffect(() => {
    loadExpenses(0);
  }, [loadExpenses]);

  const handleFormSuccess = (updatedExpense: Expense) => {
    setShowForm(false);
    setExpenseToEdit(null);
    loadExpenses(expensesPage?.number ?? 0);
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette dépense ?")) return;

    try {
      await apiClient.deleteExpense(expenseId);
      loadExpenses(expensesPage?.number ?? 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression.");
    }
  };

  const formatDateForInput = (date?: Date | null): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="bg-card p-6 rounded-lg shadow border border-border">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-semibold text-foreground">Gestion des Dépenses</h2>
        <button
          onClick={() => { setExpenseToEdit(null); setShowForm(true); }}
          className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm font-medium"
        >
          <CalendarPlus size={16} className="mr-2" />
          Ajouter une Dépense
        </button>
      </div>

      {/* Section Filtres */}
      <div className="mb-6 p-4 bg-muted rounded-md border border-border space-y-3">
        <h3 className="text-sm font-medium text-foreground flex items-center">
          <Filter size={16} className="mr-1"/> Filtres
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="filterVehicle" className="text-xs text-muted-foreground">Véhicule</label>
            <select
              id="filterVehicle"
              value={filterVehicleId ?? ''}
              onChange={(e) => setFilterVehicleId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-border bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary mt-1"
            >
              <option value="">Tous</option>
              {userVehicles.map(v => (
                <option key={v.id} value={v.id}>{v.make} {v.model}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filterStart" className="text-xs text-muted-foreground">Date Début</label>
            <input
              id="filterStart"
              type="date"
              value={formatDateForInput(filterStartDate)}
              onChange={(e) => setFilterStartDate(e.target.value ? new Date(e.target.value) : null)}
              max={formatDateForInput(filterEndDate || new Date())}
              className="w-full px-3 py-2 border border-border bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary mt-1"
            />
          </div>
          <div>
            <label htmlFor="filterEnd" className="text-xs text-muted-foreground">Date Fin</label>
            <input
              id="filterEnd"
              type="date"
              value={formatDateForInput(filterEndDate)}
              onChange={(e) => setFilterEndDate(e.target.value ? new Date(e.target.value) : null)}
              min={formatDateForInput(filterStartDate)}
              max={formatDateForInput(new Date())}
              className="w-full px-3 py-2 border border-border bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary mt-1"
            />
          </div>
        </div>
      </div>

      {/* Affichage du Formulaire */}
      {showForm && (
        <div className="mb-6 p-4 border border-border rounded-lg bg-muted/50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-foreground">
              {expenseToEdit ? 'Modifier la Dépense' : 'Nouvelle Dépense'}
            </h3>
            <button 
              onClick={() => { setShowForm(false); setExpenseToEdit(null); }} 
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
          <ExpenseForm
            expenseToEdit={expenseToEdit}
            onSuccess={handleFormSuccess}
            onCancel={() => { setShowForm(false); setExpenseToEdit(null); }}
          />
        </div>
      )}

      {/* Affichage de la liste */}
      {isLoading && !expensesPage && (
        <div className="text-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto"/>
        </div>
      )}
      
      {error && (
        <div className="text-center py-6 text-red-600">{error}</div>
      )}

      {!isLoading && expensesPage && expensesPage.empty && (
        <p className="text-center py-6 text-muted-foreground">
          Aucune dépense trouvée {filterVehicleId || filterStartDate || filterEndDate ? 'pour ces filtres' : ''}.
        </p>
      )}

      {!isLoading && expensesPage && !expensesPage.empty && (
        <>
          <ul className="divide-y divide-border">
            {expensesPage.content.map(expense => (
              <li key={expense.id} className="py-3 flex flex-col sm:flex-row justify-between sm:items-center">
                <div className="mb-2 sm:mb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded font-medium bg-primary/10 text-primary">
                      {categoryLabels[expense.category] || expense.category}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {expense.amount.toLocaleString('fr-FR')} FBu
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(expense.expenseDate).toLocaleDateString('fr-FR')}
                    {expense.vehicleInfo && ` - ${expense.vehicleInfo}`}
                  </p>
                  {expense.description && (
                    <p className="text-xs text-muted-foreground italic mt-1">{expense.description}</p>
                  )}
                </div>
                <div className="flex gap-2 items-center justify-end">
                  {expense.receiptUrl && (
                    <a 
                      href={expense.receiptUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-1 text-blue-500 hover:text-blue-700" 
                      title="Voir reçu"
                    >
                      <Paperclip size={16}/>
                    </a>
                  )}
                  <button
                    onClick={() => { setExpenseToEdit(expense); setShowForm(true); }}
                    className="p-1 text-yellow-600 hover:text-yellow-800"
                    title="Modifier"
                  >
                    <Edit2 size={16}/>
                  </button>
                  <button
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="Supprimer"
                  >
                    <Trash2 size={16}/>
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {expensesPage.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <button
                onClick={() => loadExpenses(expensesPage.number - 1)}
                disabled={expensesPage.first || isLoading}
                className="flex items-center px-3 py-1.5 text-xs font-medium text-foreground bg-card border border-border rounded-md hover:bg-muted disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Préc.
              </button>
              <span className="text-xs text-muted-foreground">
                Page {expensesPage.number + 1} / {expensesPage.totalPages}
              </span>
              <button
                onClick={() => loadExpenses(expensesPage.number + 1)}
                disabled={expensesPage.last || isLoading}
                className="flex items-center px-3 py-1.5 text-xs font-medium text-foreground bg-card border border-border rounded-md hover:bg-muted disabled:opacity-50"
              >
                Suiv. <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ExpenseList;