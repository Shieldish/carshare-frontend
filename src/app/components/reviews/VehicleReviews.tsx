'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Star, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import type { PaginatedResponse } from '@/lib/apiClient';
import type { Review, VehicleRatingSummary } from '@/types/review';

export function StarRating({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}
        />
      ))}
    </div>
  );
}

const PAGE_SIZE = 10;

export default function VehicleReviews({ vehicleId }: { vehicleId: number }) {
  const t = useTranslations('vehicles.reviews');
  const [reviewPage, setReviewPage] = useState<PaginatedResponse<Review> | null>(null);
  const [summary, setSummary] = useState<VehicleRatingSummary>({ averageRating: 0, reviewCount: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const loadReviews = useCallback((page: number) => {
    setIsLoading(true);
    apiClient.get(`/api/vehicles/${vehicleId}/reviews?page=${page}&size=${PAGE_SIZE}`)
      .then(setReviewPage)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [vehicleId]);

  useEffect(() => {
    loadReviews(0);
    apiClient.get(`/api/vehicles/${vehicleId}/reviews/summary`)
      .then((data) => setSummary(data || { averageRating: 0, reviewCount: 0 }))
      .catch(() => {});
  }, [vehicleId, loadReviews]);

  if (isLoading && !reviewPage) return null;

  const reviews = reviewPage?.content ?? [];
  const totalPages = reviewPage?.totalPages ?? 0;
  const currentPage = reviewPage?.number ?? 0;

  return (
    <div className="bg-card rounded-xl p-6 shadow-lg border border-border mt-8 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-card/50 flex items-center justify-center z-10 rounded-xl">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h3 className="text-xl font-semibold text-foreground">{t('title')}</h3>
        {summary.reviewCount > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={summary.averageRating} size={20} />
            <span className="font-bold text-foreground">{summary.averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground text-sm">
              {t('reviewCount', { count: summary.reviewCount })}
            </span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('noReviews')}</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
              <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                <span className="font-medium text-foreground">{review.renterDisplayName}</span>
                <StarRating value={review.rating} />
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
              {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <button
            onClick={() => loadReviews(currentPage - 1)}
            disabled={currentPage === 0 || isLoading}
            className="flex items-center px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {t('pagePrevious')}
          </button>
          <span className="text-sm text-muted-foreground">
            {t('pageOf', { current: currentPage + 1, total: totalPages })}
          </span>
          <button
            onClick={() => loadReviews(currentPage + 1)}
            disabled={currentPage >= totalPages - 1 || isLoading}
            className="flex items-center px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('pageNext')}
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
}
