// src/app/components/financial/ExpenseForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import type { CreateExpenseData, UpdateExpenseData, Expense, ExpenseCategory } from '@/types/financial';
import { DollarSign, Calendar, Tag, FileText, Paperclip, Loader2, Send, X, Car, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Vehicle {
  id: number;
  make: string;
  model: string;
  manufacturingYear: number;
}

interface ExpenseFormProps {
  expenseToEdit?: Expense | null;
  onSuccess: (expense: Expense) => void;
  onCancel?: () => void;
}

const categories: ExpenseCategory[] = [
  'FUEL', 'MAINTENANCE', 'CLEANING', 'INSURANCE', 'TAXES', 'PARKING', 'OTHER'
];

const ExpenseForm: React.FC<ExpenseFormProps> = ({ expenseToEdit, onSuccess, onCancel }) => {
  const t = useTranslations('financial');
  const tForm = useTranslations('financial.form');
  const [formData, setFormData] = useState<Partial<CreateExpenseData | UpdateExpenseData>>({});
  const [userVehicles, setUserVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

  const isEditMode = !!expenseToEdit;

  useEffect(() => {
    const fetchVehicles = async () => {
      setIsLoadingVehicles(true);
      try {
        const vehiclesData = await apiClient.get('/api/users/me/vehicles');
        setUserVehicles(vehiclesData || []);
      } catch (err) {
        console.error("Erreur chargement véhicules:", err);
      } finally {
        setIsLoadingVehicles(false);
      }
    };
    fetchVehicles();
  }, []);

  useEffect(() => {
    if (isEditMode && expenseToEdit) {
      setFormData({
        vehicleId: expenseToEdit.vehicleId,
        amount: expenseToEdit.amount,
        expenseDate: expenseToEdit.expenseDate,
        category: expenseToEdit.category,
        description: expenseToEdit.description,
        receiptUrl: expenseToEdit.receiptUrl,
      });
    } else {
      setFormData({ expenseDate: new Date().toISOString().split('T')[0] });
    }
  }, [expenseToEdit, isEditMode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' || name === 'vehicleId' ? (value ? Number(value) : null) : value
    }));
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    } else {
      setReceiptFile(null);
    }
  };

  const uploadReceipt = async (): Promise<string | undefined> => {
    if (!receiptFile) return formData.receiptUrl as string | undefined;

    setIsUploadingReceipt(true);
    try {
      const result = await apiClient.uploadToCloudinary(receiptFile);
      setIsUploadingReceipt(false);
      return result.secure_url;
    } catch (err: unknown) {
      console.error("Erreur upload reçu:", err);
      setError(tForm('receiptUploadError', { error: err instanceof Error ? err.message : String(err) }));
      setIsUploadingReceipt(false);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.amount || !formData.expenseDate || !formData.category) {
      setError(tForm('requiredFieldsError'));
      return;
    }

    setIsLoading(true);

    try {
      const receiptUrl = await uploadReceipt();
      const dataToSend = { ...formData, receiptUrl };

      let result: Expense;
      if (isEditMode && expenseToEdit) {
        result = await apiClient.updateExpense(expenseToEdit.id, dataToSend as UpdateExpenseData);
      } else {
        result = await apiClient.addExpense(dataToSend as CreateExpenseData);
      }
      onSuccess(result);
    } catch (err: unknown) {
      if (!error) {
        setError(err instanceof Error ? err.message : (isEditMode ? tForm('updateError') : tForm('addError')));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForInput = (isoDate?: string): string => {
    if (!isoDate) return '';
    return isoDate.split('T')[0];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-2 rounded-md text-sm flex items-start" role="alert">
          <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-foreground mb-1">
            <DollarSign size={14} className="inline mr-1" /> {tForm('amountLabel')}
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={formData.amount || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="expenseDate" className="block text-sm font-medium text-foreground mb-1">
            <Calendar size={14} className="inline mr-1" /> {tForm('dateLabel')}
          </label>
          <input
            id="expenseDate"
            name="expenseDate"
            type="date"
            required
            value={formatDateForInput(formData.expenseDate)}
            max={new Date().toISOString().split('T')[0]}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">
            <Tag size={14} className="inline mr-1" /> {tForm('categoryLabel')}
          </label>
          <select
            id="category"
            name="category"
            required
            value={formData.category || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
          >
            <option value="" disabled>{tForm('categoryPlaceholder')}</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{t(`categories.${cat}`)}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="vehicleId" className="block text-sm font-medium text-foreground mb-1">
            <Car size={14} className="inline mr-1" /> {tForm('vehicleOptionalLabel')}
          </label>
          <select
            id="vehicleId"
            name="vehicleId"
            value={formData.vehicleId || ''}
            onChange={handleChange}
            disabled={isLoadingVehicles}
            className="w-full px-3 py-2 border border-border bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
          >
            <option value="">{isLoadingVehicles ? tForm('vehicleLoading') : tForm('vehicleNone')}</option>
            {userVehicles.map(v => (
              <option key={v.id} value={v.id}>{v.make} {v.model} ({v.manufacturingYear})</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
          <FileText size={14} className="inline mr-1" /> {tForm('descriptionLabel')}
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          value={formData.description || ''}
          onChange={handleChange}
          placeholder={tForm('descriptionPlaceholder')}
          className="w-full px-3 py-2 border border-border bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      <div>
        <label htmlFor="receipt" className="block text-sm font-medium text-foreground mb-1">
          <Paperclip size={14} className="inline mr-1" /> {tForm('receiptLabel')}
        </label>
        <input
          id="receipt"
          type="file"
          accept="image/*,.pdf"
          onChange={handleReceiptChange}
          className="w-full text-sm text-muted-foreground file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
        />
        {isUploadingReceipt && <Loader2 size={16} className="animate-spin text-primary inline-block ml-2"/>}
        {formData.receiptUrl && !receiptFile && (
          <a href={formData.receiptUrl as string} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline ml-2">{tForm('viewCurrentReceipt')}</a>
        )}
      </div>

      <div className={`flex gap-4 pt-4 ${isEditMode ? 'justify-between' : 'justify-end'}`}>
        {isEditMode && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading || isUploadingReceipt}
            className="px-4 py-2 border border-border text-foreground rounded-md hover:bg-muted disabled:opacity-50"
          >
            {tForm('cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading || isUploadingReceipt}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center"
        >
          {isLoading || isUploadingReceipt ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
          {isEditMode ? tForm('update') : tForm('add')}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;