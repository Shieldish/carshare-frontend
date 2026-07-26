// src/app/types/financial.ts

import type { PaymentMethod, PaymentPurpose, PaymentStatus } from './payment';

export type ExpenseCategory =
  | 'FUEL'
  | 'MAINTENANCE'
  | 'CLEANING'
  | 'INSURANCE'
  | 'TAXES'
  | 'PARKING'
  | 'OTHER';

// Pour l'affichage
export interface Expense {
  id: number;
  userId: number;
  vehicleId?: number;
  vehicleInfo?: string;
  amount: number;
  expenseDate: string; // ISO date string (YYYY-MM-DD)
  category: ExpenseCategory;
  description?: string;
  receiptUrl?: string;
  createdAt: string; // ISO datetime string
}

// Pour la création
export interface CreateExpenseData {
  vehicleId?: number;
  amount: number;
  expenseDate: string; // ISO date string (YYYY-MM-DD)
  category: ExpenseCategory;
  description?: string;
  receiptUrl?: string;
}

// Pour la mise à jour
export interface UpdateExpenseData {
  vehicleId?: number | null;
  amount?: number;
  expenseDate?: string;
  category?: ExpenseCategory;
  description?: string;
  receiptUrl?: string | null;
}

export interface OwnerFinancialSummary {
  totalEarnings: number;
  completedBookingsCount: number;
  totalExpenses?: number;
  netEarnings?: number;
}

// ✅ MISE À JOUR : Ajout du champ manualTransactionRef
export interface TransactionDetail {
  paymentId: string;
  bookingId?: number;
  vehicleInfo?: string;
  renterId?: number;
  renterName?: string;
  ownerId?: number;
  ownerName?: string;
  purpose: PaymentPurpose;
  amountTotal: number;
  amountOwner?: number;
  amountCommission: number;
  method?: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
  capturedAt?: string;
  manualTransactionRef?: string; // ✅ NOUVEAU : Code de transaction saisi par le client
}