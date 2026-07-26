// src/app/types/admin.ts

export interface UpdateVerificationStatusDto {
    isIdentityVerified?: boolean;
    isDrivingLicenseVerified?: boolean;
    isSelfieVerified?: boolean; // ✅ NOUVEAU
  }