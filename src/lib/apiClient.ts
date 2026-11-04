// lib/apiClient.ts

import type { CheckInData, CheckOutData, InspectionDetails } from '@/types/inspection';
import type { CreateIncidentData, IncidentReportDetails } from '@/types/incident';
import type { BlockedPeriod, CreateBlockedPeriodData } from '@/types/availability';
import type { Booking } from '@/types/booking';
import type { OwnerFinancialSummary, TransactionDetail, Expense, CreateExpenseData, UpdateExpenseData } from '@/types/financial';
import type { UpdateVerificationStatusDto } from '@/types/admin';
import type { Page } from '@/types/page';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// Côté serveur (SSR / composants serveur) : INTERNAL_API_URL en priorité — utile en local
// et en Docker où le backend est joignable par un nom interne. Repli sur NEXT_PUBLIC_API_URL :
// sans ce repli, un déploiement où seule NEXT_PUBLIC_API_URL est définie (cas de Vercel)
// appelait http://localhost:8082 depuis la fonction serverless, échouait silencieusement, et
// la page d'accueil affichait « Aucun véhicule disponible » alors que l'API répondait.
const API_BASE_URL = typeof window === 'undefined'
  ? (process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8082')
  : (process.env.NEXT_PUBLIC_API_URL ?? '/backend');

const formatDateForApi = (date: Date | null | undefined): string | undefined => {
  if (!date) return undefined;
  return date.toISOString().split('T')[0];
};

const authenticatedFetch = async (path: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null;

  const headers = new Headers(options.headers);
  
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // ✅ CORRECTION : Ajout de cache: 'no-store' pour empêcher Next.js de servir de vieilles données
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    // === LOGIQUE DE DÉCONNEXION AUTOMATIQUE ===
    // ✅ CORRECTION : On ne déconnecte QUE sur 401 (token expiré/invalide).
    // Un 403 signifie juste "accès refusé à cette ressource"
    if (response.status === 401) {
      console.warn('🔒 Session expirée. Redirection vers login...');
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('jwt_token');
        window.location.href = '/login?expired=true';
      }
    }
    // ==========================================

    const errorText = await response.text();
    
    if (response.status === 404) {
      console.log(`ℹ️ Resource not found (404): ${API_BASE_URL}${path}`);
    } else if (response.status !== 401 && response.status !== 403) {
      console.error(`API Error - Status: ${response.status} ${response.statusText}, URL: ${API_BASE_URL}${path}`);
      console.error('Raw error response:', errorText);
    }
    
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText || 'Erreur inconnue' };
    }
    throw new ApiError(
      errorData.message || errorData.error || `Erreur API avec le statut ${response.status}`,
      response.status,
      errorData.code
    );
  }

  if (response.status === 204) {
    return null;
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength) === 0) {
    return null;
  }
  
  const text = await response.text();
  
  if (!text || text.trim() === '') {
    console.log(`ℹ️ Empty response body for ${path}`);
    return null;
  }
  
  try {
    return JSON.parse(text);
  } catch {
    // Le backend renvoie parfois du texte brut
    return text;
  }
};

const serverFetch = async (path: string, options: RequestInit = {}) => {
  console.log(`🌐 Server Fetch: ${API_BASE_URL}${path}`);
  
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error(`❌ Server API Error - ${response.status} ${response.statusText} sur ${API_BASE_URL}${path}${body ? ` — ${body.slice(0, 500)}` : ''}`);
    return null;
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  console.log(`✅ Server Fetch Success: ${path}`, data);
  return data;
};

export const apiClient = {
  // ✅ CORRECTION : Headers anti-cache supplémentaires sur les requêtes GET
  get: (path: string) => authenticatedFetch(path, {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    }
  }),
  post: (path: string, body: unknown) => authenticatedFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path: string, body: unknown) => authenticatedFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path: string) => authenticatedFetch(path, { method: 'DELETE' }),

  // ===== AUTHENTIFICATION =====
  // ✅ i18n : `locale` optionnel — langue active du site, pour recevoir l'email dans la bonne langue.
  forgotPassword: (email: string, locale?: string) =>
    authenticatedFetch('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email, locale }) }),

  resetPassword: (token: string, newPassword: string) =>
    authenticatedFetch('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),

  // ===== UPLOADS =====
  upload: (path: string, formData: FormData) => authenticatedFetch(path, { method: 'POST', body: formData }),
  
  uploadToCloudinary: async (file: File): Promise<{ secure_url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'carshare_unsigned');
    
    const response = await fetch(`https://api.cloudinary.com/v1_1/dzwfox4id/image/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Échec de l\'upload Cloudinary');
    }
    
    return response.json();
  },

  // ===== MESSAGES (BOOKINGS) =====
  getMessages: (bookingId: number) => authenticatedFetch(`/api/bookings/${bookingId}/messages`, { method: 'GET' }),

  // ===== INSPECTIONS (CHECK-IN / CHECK-OUT) =====
  performCheckIn: (bookingId: number, data: CheckInData) => 
    authenticatedFetch(`/api/bookings/${bookingId}/inspection/check-in`, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  
  performCheckOut: (bookingId: number, data: CheckOutData) => 
    authenticatedFetch(`/api/bookings/${bookingId}/inspection/check-out`, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  
  getInspectionDetails: (bookingId: number): Promise<InspectionDetails | null> => 
    authenticatedFetch(`/api/bookings/${bookingId}/inspection`, { method: 'GET' }),

  // ===== INCIDENTS =====
  createIncidentReport: (bookingId: number, data: CreateIncidentData): Promise<IncidentReportDetails> =>
    authenticatedFetch(`/api/bookings/${bookingId}/incidents`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getIncidentReportsForBooking: (bookingId: number): Promise<IncidentReportDetails[]> =>
    authenticatedFetch(`/api/bookings/${bookingId}/incidents`, { method: 'GET' }),

  getIncidentReportById: (reportId: number): Promise<IncidentReportDetails> =>
    authenticatedFetch(`/api/incidents/${reportId}`, { method: 'GET' }),

  // ===== AVAILABILITY =====
  addBlockedPeriod: (vehicleId: number, data: CreateBlockedPeriodData): Promise<BlockedPeriod> =>
    authenticatedFetch(`/api/vehicles/${vehicleId}/availability/block`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getBlockedPeriods: (vehicleId: number): Promise<BlockedPeriod[]> =>
    authenticatedFetch(`/api/vehicles/${vehicleId}/availability/blocks`, { method: 'GET' }),

  deleteBlockedPeriod: (vehicleId: number, periodId: number): Promise<null> =>
    authenticatedFetch(`/api/vehicles/${vehicleId}/availability/block/${periodId}`, { method: 'DELETE' }),

  // ===== BOOKINGS =====
  getBookingsForVehicle: (vehicleId: number): Promise<Booking[]> =>
    authenticatedFetch(`/api/bookings/vehicle/${vehicleId}`, { method: 'GET' }),

  // ===== FINANCIAL =====
  getOwnerFinancialSummary: (startDate?: Date, endDate?: Date): Promise<OwnerFinancialSummary> => {
    const params = new URLSearchParams();
    const startStr = formatDateForApi(startDate);
    const endStr = formatDateForApi(endDate);
    if (startStr) params.append('startDate', startStr);
    if (endStr) params.append('endDate', endStr);
    const queryString = params.toString();
    return authenticatedFetch(`/api/users/me/financial-summary${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  },

  getMyTransactions: (startDate?: Date, endDate?: Date, page: number = 0, size: number = 10): Promise<PaginatedResponse<TransactionDetail>> => {
    const params = new URLSearchParams();
    const startStr = formatDateForApi(startDate);
    const endStr = formatDateForApi(endDate);
    if (startStr) params.append('startDate', startStr);
    if (endStr) params.append('endDate', endStr);
    params.append('page', page.toString());
    params.append('size', size.toString());
    const queryString = params.toString();
    return authenticatedFetch(`/api/users/me/transactions?${queryString}`, { method: 'GET' });
  },

  addExpense: (data: CreateExpenseData): Promise<Expense> =>
    authenticatedFetch(`/api/users/me/expenses`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMyExpenses: (
    vehicleId?: number,
    startDate?: Date,
    endDate?: Date,
    page: number = 0,
    size: number = 10
  ): Promise<Page<Expense>> => {
    const params = new URLSearchParams();
    const startStr = formatDateForApi(startDate);
    const endStr = formatDateForApi(endDate);
    if (vehicleId) params.append('vehicleId', vehicleId.toString());
    if (startStr) params.append('startDate', startStr);
    if (endStr) params.append('endDate', endStr);
    params.append('page', page.toString());
    params.append('size', size.toString());
    const queryString = params.toString();
    return authenticatedFetch(`/api/users/me/expenses?${queryString}`, { method: 'GET' });
  },

  updateExpense: (expenseId: number, data: UpdateExpenseData): Promise<Expense> =>
    authenticatedFetch(`/api/users/me/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteExpense: (expenseId: number): Promise<null> =>
    authenticatedFetch(`/api/users/me/expenses/${expenseId}`, { method: 'DELETE' }),

  // ===== PAIEMENTS =====
  performMobileMoneyPayment: (
    id: number | string, 
    phoneNumber: string, 
    transactionReference: string
  ) => {
    const payload = typeof id === 'number' 
      ? { bookingId: id, phoneNumber, transactionReference }
      : { paymentId: id, phoneNumber, transactionReference };

    return authenticatedFetch(`/api/payments/pay/mobile-money`, { 
      method: 'POST', 
      body: JSON.stringify(payload) 
    });
  },

  getPendingPayments: (): Promise<unknown[]> =>
    authenticatedFetch('/api/payments/admin/pending', { method: 'GET' }),

  validatePayment: (paymentId: string, isValid: boolean): Promise<{ status: string; message: string }> =>
    authenticatedFetch(`/api/payments/admin/${paymentId}/validate`, {
      method: 'PUT',
      body: JSON.stringify({ isValid })
    }),

  refundPayment: (paymentId: string): Promise<{ message: string }> =>
    authenticatedFetch(`/api/admin/payments/${paymentId}/refund`, { method: 'PUT', body: JSON.stringify({}) }),

  // ===== VERIFICATION & ADMIN =====
  updateUserVerificationStatus: (userId: number, data: UpdateVerificationStatusDto): Promise<{ message: string }> =>
    authenticatedFetch(`/api/admin/users/${userId}/verification`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getAllUsersAdmin: (): Promise<unknown[]> =>
    authenticatedFetch(`/api/admin/users`, { method: 'GET' }),

  getAllIncidentsAdmin: (): Promise<unknown[]> =>
    authenticatedFetch(`/api/admin/incidents/all`, { method: 'GET' }),
  
  updateIncidentStatus: (reportId: number, data: { newStatus: string; notes?: string }): Promise<{ message: string }> =>
    authenticatedFetch(`/api/admin/incidents/${reportId}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // ===== PREMIUM & PROMOTIONS =====
  extendUserPremium: (userId: number, monthsToAdd: number = 1): Promise<string> =>
    authenticatedFetch(`/api/users/${userId}/premium/extend?monthsToAdd=${monthsToAdd}`, {
      method: 'POST',
    }),

  boostVehicle: (vehicleId: number, daysToAdd: number = 1): Promise<string> =>
    authenticatedFetch(`/api/promotions/vehicles/${vehicleId}/boost?daysToAdd=${daysToAdd}`, {
      method: 'POST',
    }),

  // ===== ✅ NOTIFICATIONS =====
  getUnreadNotifications: (): Promise<unknown[]> =>
    authenticatedFetch('/api/notifications/unread', { method: 'GET' }),

  getAllNotifications: (): Promise<unknown[]> =>
    authenticatedFetch('/api/notifications', { method: 'GET' }),

  getUnreadNotificationCount: (): Promise<number> =>
    authenticatedFetch('/api/notifications/count', { method: 'GET' }),

  markNotificationAsRead: (notificationId: number): Promise<null> =>
    authenticatedFetch(`/api/notifications/${notificationId}/read`, { method: 'PUT', body: JSON.stringify({}) }),

  markAllNotificationsAsRead: (): Promise<null> =>
    authenticatedFetch('/api/notifications/read-all', { method: 'PUT', body: JSON.stringify({}) }),
};

export const serverApiClient = {
  get: (path: string) => serverFetch(path, { method: 'GET' }),
  post: (path: string, body: unknown) => serverFetch(path, { method: 'POST', body: JSON.stringify(body) }),
};