export interface Review {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  renterDisplayName: string;
}

export interface VehicleRatingSummary {
  averageRating: number;
  reviewCount: number;
}

export interface CreateReviewData {
  bookingId: number;
  rating: number;
  comment?: string;
}
