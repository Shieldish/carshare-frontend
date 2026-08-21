'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

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
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        {previousLabel}
      </button>
      <span className="text-sm text-muted-foreground">{pageLabel}</span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {nextLabel}
        <ChevronRight className="w-4 h-4 ml-1" />
      </button>
    </div>
  );
}
