// src/app/components/financial/TransactionList.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { TransactionDetail } from '@/types/financial';
import type { PaginatedResponse } from '@/lib/apiClient';
import { ArrowDownLeft, ArrowUpRight, Clock, CheckCircle, XCircle, RefreshCcw, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiClient, ApiError } from '@/lib/apiClient';
import { useLocale, useTranslations } from 'next-intl';

interface Props {
  startDate?: Date;
  endDate?: Date;
}

const TransactionList: React.FC<Props> = ({ startDate, endDate }) => {
  const t = useTranslations('financial');
  const locale = useLocale();
  const { user } = useAuth();
  const [transactionPage, setTransactionPage] = useState<PaginatedResponse<TransactionDetail> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;

  const loadTransactions = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.getMyTransactions(startDate, endDate, page, pageSize);
      setTransactionPage(response);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      
      // ✅ Gestion des erreurs avec type safety
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(t('transactionsLoadError'));
      }
      
      setTransactionPage(null);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadTransactions(0);
  }, [loadTransactions]);

  const handlePageChange = (newPage: number) => {
    if (transactionPage && newPage >= 0 && newPage < transactionPage.totalPages) {
      loadTransactions(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusInfo = (status: TransactionDetail['status']) => {
    switch (status) {
      case 'CAPTURED': return { icon: <CheckCircle className="w-4 h-4 text-green-500" />, text: t('statusConfirmed') };
      case 'PENDING': return { icon: <Clock className="w-4 h-4 text-orange-500" />, text: t('statusPending') };
      case 'PROCESSING': return { icon: <Clock className="w-4 h-4 text-primary" />, text: t('statusProcessing') };
      case 'FAILED': return { icon: <XCircle className="w-4 h-4 text-red-500" />, text: t('statusFailed') };
      case 'REFUNDED': return { icon: <RefreshCcw className="w-4 h-4 text-primary" />, text: t('statusRefunded') };
      default: return { icon: <Clock className="w-4 h-4 text-gray-500" />, text: status };
    }
  };

  const renderAmount = (tx: TransactionDetail) => {
    if (user && tx.ownerId === user.id && tx.amountOwner !== undefined && tx.amountOwner !== null) {
      return (
        <span className="text-green-600 font-semibold flex items-center">
          <ArrowUpRight size={16} className="mr-1" /> +{tx.amountOwner.toLocaleString(locale)} FBu
          <span className="text-xs text-muted-foreground ml-1">{t('yourShareLabel')}</span>
        </span>
      );
    }
    if (user && tx.renterId === user.id) {
      return (
        <span className="text-red-600 font-semibold flex items-center">
          <ArrowDownLeft size={16} className="mr-1" /> -{tx.amountTotal.toLocaleString(locale)} FBu
        </span>
      );
    }
    return (
      <span className="text-foreground font-semibold">
        {tx.amountTotal.toLocaleString(locale)} FBu
      </span>
    );
  };

  if (isLoading && !transactionPage) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex justify-between items-center p-4 bg-muted rounded-lg">
            <div className="space-y-2">
              <div className="h-4 bg-muted-foreground/20 rounded w-48"></div>
              <div className="h-3 bg-muted-foreground/10 rounded w-32"></div>
            </div>
            <div className="space-y-2 text-right">
              <div className="h-4 bg-muted-foreground/20 rounded w-24"></div>
              <div className="h-3 bg-muted-foreground/10 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-md flex items-start" role="alert">
        <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
        <span>{t('transactionsError')}: {error}</span>
      </div>
    );
  }

  if (!transactionPage || transactionPage.empty) {
    return (
      <div className="text-center py-10 bg-muted rounded-lg">
        <p className="text-muted-foreground">
          {startDate || endDate ? t('transactionsEmptyPeriod') : t('transactionsEmpty')}
        </p>
      </div>
    );
  }

  const { content: transactions, totalPages, totalElements, number: currentPage } = transactionPage;

  return (
    <div className="bg-card p-6 rounded-lg shadow border border-border relative">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
        <h2 className="text-xl font-semibold text-foreground">{t('transactionsTitle')}</h2>
        {totalElements > 0 && (
          <span className="text-sm text-muted-foreground">
            {transactions.length > 0
              ? t('transactionsShowing', { from: currentPage * pageSize + 1, to: currentPage * pageSize + transactions.length })
              : ''}
            {' '}
            {totalElements > 1 ? t('transactionsCountPlural', { count: totalElements }) : t('transactionsCount', { count: totalElements })}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-card/50 flex items-center justify-center z-10 rounded-lg">
          <Loader2 className="w-6 h-6 animate-spin text-primary"/>
        </div>
      )}

      <ul className="divide-y divide-border">
        {transactions.map(tx => {
          const status = getStatusInfo(tx.status);
          const amountDisplay = renderAmount(tx);
          const description = tx.bookingId
            ? t('bookingLabel', { id: tx.bookingId, vehicle: tx.vehicleInfo || t('vehicleFallback') })
            : tx.purpose === 'COMPANY_REGISTRATION_FEE'
            ? t('companyRegistrationFee')
            : t('transactionLabel');
          const party = user && tx.ownerId === user.id ? tx.renterName : (user && tx.renterId === user.id ? tx.ownerName : 'N/A');

          return (
            <li key={tx.paymentId} className="py-4 flex flex-col sm:flex-row justify-between sm:items-center hover:bg-muted/50 -mx-4 px-4 rounded transition-colors">
              <div className="mb-2 sm:mb-0">
                <p className="text-sm font-medium text-foreground">{description}</p>
                <p className="text-xs text-muted-foreground">
                  {party && t('withPartyLabel', { name: party })}
                  {t('onDateLabel', { date: formatDate(tx.createdAt), time: formatTime(tx.createdAt) })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm">{amountDisplay}</p>
                <div className="text-xs text-muted-foreground flex items-center justify-end mt-1">
                  {status.icon}
                  <span className="ml-1">{status.text}</span>
                  {tx.capturedAt && tx.status === 'CAPTURED' && ` (${formatDate(tx.capturedAt)})`}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0 || isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {t('pagePrevious')}
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {t('pageOf', { current: currentPage + 1, total: totalPages })}
            </span>
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1 || isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('pageNext')}
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionList;