// src/app/types/inspection.ts

export type FuelLevel = "FULL" | "3/4" | "1/2" | "1/4" | "EMPTY" | "";

export interface CheckInData {
  mileageStart: number;
  fuelLevelStart: FuelLevel;
  photoUrlsStart: string[];
  notesStart?: string;
  latitudeStart: number;
  longitudeStart: number;
  validationCode: string;
}

export interface CheckOutData {
  mileageEnd: number | null;
  fuelLevelEnd: FuelLevel;
  photoUrlsEnd: string[];
  notesEnd?: string;
  latitudeEnd: number;    // ✅ NOUVEAU - GPS du locataire
  longitudeEnd: number;   // ✅ NOUVEAU - GPS du locataire
}

// Représente la réponse de GET /api/bookings/{id}/inspection
export interface InspectionDetails {
  bookingId: number;
  checkInId?: number;
  checkInTimestamp?: string;
  checkInCode?: string;      // ✅ Code secret du locataire (affiché côté locataire)
  mileageStart?: number;
  fuelLevelStart?: FuelLevel;
  photoUrlsStart?: string[];
  notesStart?: string;
  latitudeStart?: number;
  longitudeStart?: number;
  checkOutId?: number;
  checkOutTimestamp?: string;
  mileageEnd?: number;
  fuelLevelEnd?: FuelLevel;
  photoUrlsEnd?: string[];
  notesEnd?: string;
  latitudeEnd?: number;      // ✅ NOUVEAU - GPS du locataire au check-out
  longitudeEnd?: number;     // ✅ NOUVEAU - GPS du locataire au check-out
}