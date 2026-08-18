'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import type { PaginatedResponse } from '@/lib/apiClient';
import { StarRating } from '@/app/components/reviews/VehicleReviews';
import { Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminReview {
  id: number;
  vehicleId: number;
  vehicleName: string;
  renterName: string;
  renterEmail: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

const PAGE_SIZE = 15;

export default function AdminReviewsPage() {
  const t = useTranslations('admin.reviews');
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [reviewPage, setReviewPage] = useState<PaginatedResponse<AdminReview> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const loadReviews = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const data = await apiClient.get(`/api/admin/reviews?page=${page}&size=${PAGE_SIZE}`);
      setReviewPage(data);
    } catch {
      setError(t('loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      loadReviews(0);
    }
  }, [user, loadReviews]);

  const handleDelete = async (review: AdminReview) => {
    if (!confirm(t('confirmDelete'))) return;
    setDeletingId(review.id);
    try {
      await apiClient.delete(`/api/vehicles/${review.vehicleId}/reviews/${review.id}`);
      toast.success(t('deleteSuccess'));
      setReviewPage((prev) =>
        prev ? { ...prev, content: prev.content.filter((r) => r.id !== review.id) } : prev
      );
    } catch {
      toast.error(t('deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || (isLoading && !reviewPage)) return <div className="text-center p-12">{t('loading')}</div>;
  if (error) return <div className="text-center p-12 text-red-500">{error}</div>;
  if (!user || user.role !== 'ADMIN') return null;

  const reviews = reviewPage?.content ?? [];
  const totalPages = reviewPage?.totalPages ?? 0;
  const totalElements = reviewPage?.totalElements ?? 0;
  const currentPage = reviewPage?.number ?? 0;

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-3xl font-bold">{t('pageTitle')}</h1>
        {totalElements > 0 && (
          <span className="text-sm text-muted-foreground">{t('totalCount', { count: totalElements })}</span>
        )}
      </div>

      <div className="bg-card rounded-lg shadow border overflow-x-auto relative">
        {isLoading && (
          <div className="absolute inset-0 bg-card/50 flex items-center justify-center z-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        <table className="min-w-full divide-y">
          <thead className="bg-muted/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">{t('columns.vehicle')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">{t('columns.renter')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">{t('columns.rating')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">{t('columns.comment')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">{t('columns.date')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">{t('columns.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <tr key={review.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{review.vehicleName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div>{review.renterName}</div>
                    <div className="text-xs text-muted-foreground">{review.renterEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap"><StarRating value={review.rating} size={14} /></td>
                  <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate" title={review.comment ?? ''}>
                    {review.comment || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleDelete(review)}
                      disabled={deletingId === review.id}
                      title={t('deleteTitle')}
                      className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full disabled:opacity-50 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">{t('noReviews')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => loadReviews(currentPage - 1)}
            disabled={currentPage === 0 || isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            className="flex items-center px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('pageNext')}
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
}
