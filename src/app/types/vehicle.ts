// src/app/types/vehicle.ts

export interface VehicleImage {
  id: number;
  url: string;
}

export interface Commune {
  id: number;
  name: string;
  province: {
    id: number;
    name: string;
  };
}

export interface Vehicle {
  id: number;
  make: string;
  model: string;
  manufacturingYear: number;
  ratePerDay: number;
  images: VehicleImage[];

  // ✅ NOUVEAU : Champ imageUrl optionnel (fallback depuis certains endpoints)
  imageUrl?: string;

  // ==========================================
  // ✅ STATUTS SÉPARÉS
  // ==========================================
  // 1. Validation de l'admin (axe administratif)
  status?: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

  // 2. Visibilité choisie par le propriétaire (axe opérationnel)
  isActive?: boolean;
  active?: boolean; // ✅ Pour gérer la façon dont Java (Jackson) envoie le JSON
  // ==========================================

  // ==========================================
  // ✅ SYSTÈME DE BOOST / MISE EN VEDETTE
  // ==========================================
  isBoosted?: boolean;    // ✅ NOUVEAU : true si le véhicule est actuellement boosté
  boostEndDate?: string;  // ✅ NOUVEAU : date/heure de fin du boost (ISO string)
  isOwnerPremium?: boolean; // ✅ NOUVEAU : true si le propriétaire a un abonnement Premium actif
  // ==========================================

  // SYSTÈME DE LOCALISATION STRUCTURÉ AMÉLIORÉ
  province?: {
    id: number;
    name: string;
  };
  commune?: Commune;
  address?: string;
  locationGps?: string;

  // Champs optionnels
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  type?: string;
  equipment?: string;
  seats?: number;
  ratePerWeek?: number;
  description?: string;
  companyName?: string;
  isAvailable?: boolean;

  // ✅ CHAMP POUR LE CHAUFFEUR (sans le prix)
  supportsDriver?: boolean;

  // ==========================================
  // ✅ DOCUMENTS LÉGAUX ET DATES D'EXPIRATION
  // ==========================================
  registrationDocumentUrl?: string;
  insuranceDocumentUrl?: string;
  technicalControlDocumentUrl?: string;
  insuranceExpiryDate?: string | Date;
  technicalControlExpiryDate?: string | Date;
  // ==========================================
}