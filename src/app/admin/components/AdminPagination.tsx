'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/app/components/ui';

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  previousLabel: string;
  nextLabel: string;
  pageLabel: string;
}

// Style identique à la pagination déjà en place sur admin/reviews, réutilisé
// ici pour toutes les interfaces admin paginées côté client (currentPage 1-indexé).
export default function AdminPagination({
  currentPage,
  totalPages,
  onPageChange,
  previousLabel,
  nextLabel,
  pageLabel,
}: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-6">
      <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        <ChevronLeft className="w-4 h-4" />
        {previousLabel}
      </Button>
      <span className="text-sm text-muted-foreground">{pageLabel}</span>
      <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
        {nextLabel}
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
