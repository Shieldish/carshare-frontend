'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import type { PaginatedResponse } from '@/lib/apiClient';
import { StarRating } from '@/app/components/reviews/VehicleReviews';
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/app/components/ui';

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

  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') return;

    const loadReviews = async () => {
      setIsLoading(true);
      try {
        const data = await apiClient.get(`/api/admin/reviews?page=${page}&size=${PAGE_SIZE}`);
        setReviewPage(data);
      } catch {
        setError(t('loadError'));
      } finally {
        setIsLoading(false);
      }
    };

    loadReviews();
  }, [user, page, t]);

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

  if (authLoading || (isLoading && !reviewPage)) return <div className="text-center p-12 text-muted-foreground">{t('loading')}</div>;
  if (error) return <div className="text-center p-12 text-destructive">{error}</div>;
  if (!user || user.role !== 'ADMIN') return null;

  const reviews = reviewPage?.content ?? [];
  const totalPages = reviewPage?.totalPages ?? 0;
  const totalElements = reviewPage?.totalElements ?? 0;
  const currentPage = reviewPage?.number ?? 0;

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('pageTitle')}</h1>
        {totalElements > 0 && (
          <span className="text-sm text-muted-foreground">{t('totalCount', { count: totalElements })}</span>
        )}
      </div>

      <Table loading={isLoading}>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>{t('columns.vehicle')}</TableHead>
            <TableHead>{t('columns.renter')}</TableHead>
            <TableHead>{t('columns.rating')}</TableHead>
            <TableHead>{t('columns.comment')}</TableHead>
            <TableHead>{t('columns.date')}</TableHead>
            <TableHead>{t('columns.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell className="whitespace-nowrap font-medium">{review.vehicleName}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <div>{review.renterName}</div>
                  <div className="text-xs text-muted-foreground">{review.renterEmail}</div>
                </TableCell>
                <TableCell className="whitespace-nowrap"><StarRating value={review.rating} size={14} /></TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground" title={review.comment ?? ''}>
                  {review.comment || '—'}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <button
                    onClick={() => handleDelete(review)}
                    disabled={deletingId === review.id}
                    title={t('deleteTitle')}
                    className="p-2.5 text-destructive hover:bg-destructive/10 rounded-full disabled:opacity-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t('noReviews')}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 0 || isLoading}
          >
            <ChevronLeft className="w-4 h-4" />
            {t('pagePrevious')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('pageOf', { current: currentPage + 1, total: totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= totalPages - 1 || isLoading}
          >
            {t('pageNext')}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
