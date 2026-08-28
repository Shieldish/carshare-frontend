// src/types/user.ts

// ✅ Réponse de GET /api/users/{id}/public-profile — endpoint public, sans auth.
// Ne jamais y ajouter d'email/téléphone/nom de famille complet : cet objet est
// visible par n'importe quel visiteur anonyme (voir aussi BookingForOwnerDto
// côté backend, qui anonymise les locataires de la même façon).
export interface PublicOwnerProfile {
  id: number;
  firstName: string;
  lastInitial: string;
  profilePictureUrl: string | null;
  bio: string | null;
  memberSince: string | null;
  verified: boolean;
  companyName: string | null;
  vehicleCount: number;
  averageRating: number | null;
  reviewCount: number;
}
