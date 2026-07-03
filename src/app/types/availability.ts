// src/types/availability.ts

export interface BlockedPeriod {
    id: number;
    vehicleId: number;
    startDate: string; // ISO String
    endDate: string;   // ISO String
    reason?: string;
  }
  
  export interface CreateBlockedPeriodData {
    startDate: string; // ISO String
    endDate: string;   // ISO String
    reason?: string;
  }