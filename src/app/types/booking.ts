// dans src/types/booking.ts

// Import du type Vehicle depuis votre fichier existant
import type { Vehicle as BaseVehicle } from './vehicle';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role?: string;
}

// Extension du type Vehicle pour inclure le propriétaire dans le contexte des réservations
export interface VehicleWithOwner extends BaseVehicle {
  owner: User;
}

// ✅ MISE À JOUR : Ajout de PENDING_CONFIRMATION
export type BookingStatus = 
  | 'PENDING' 
  | 'CONTACT_INITIATED' 
  | 'PENDING_CONFIRMATION'  // ✅ NOUVEAU : En attente de validation du paiement
  | 'CONFIRMED' 
  | 'CANCELLED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED';

export interface Booking {
  id: number;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  totalPrice: number;
  status: BookingStatus;
  createdAt?: string;
  updatedAt?: string;
  
  // ✅ NOUVEAU : Code secret pour valider le Check-in
  checkInCode?: string;
  
  // Relations
  renter: User;
  renterName?: string; // Parfois fourni directement par l'API
  vehicle: VehicleWithOwner; // Utilise le type étendu avec owner
  
  // Champs optionnels selon l'endpoint
  paymentOption?: 'ONLINE' | 'LOCAL';
}

// DTO pour les requêtes de création de réservation
export interface BookingRequestDto {
  vehicleId: number;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  paymentOption: 'ONLINE' | 'LOCAL';
}

// DTO pour les requêtes de mise à jour de statut
export interface BookingStatusUpdateRequest {
  status: BookingStatus;
}

// Type pour les réponses d'erreur de l'API
export interface ErrorResponse {
  message: string;
  error?: string;
  statusCode?: number;
}