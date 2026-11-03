'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/apiClient';
import { Loader2, CheckCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, type BadgeVariant } from '@/app/components/ui';

interface CompletedPayment {
  id: string;
  amountTotal: number;
  currency: string;
  method: string;
  purpose: string;
  status: string;
  manualTransactionRef: string;
  gatewayTransactionId: string;
  createdAt: string;
  capturedAt: string;
}

const PURPOSE_BADGE: Record<string, BadgeVariant> = {
  BOOST: 'boost',
  BOOKING: 'info',
  COMPANY_REGISTRATION_FEE: 'warning',
};

export default function AdminPaymentTable() {
  const t = useTranslations('admin.paymentTable');
  const [payments, setPayments] = useState<CompletedPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger l'historique des paiements depuis le nouvel endpoint
  const fetchPaymentHistory = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get('/api/payments/admin/history');
      // Trier pour avoir les plus récents en premier
      const sortedData = data.sort((a: CompletedPayment, b: CompletedPayment) =>
        new Date(b.capturedAt || b.createdAt).getTime() - new Date(a.capturedAt || a.createdAt).getTime()
      );
      setPayments(sortedData);
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique", error);
      toast.error(t('loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const extractPhone = (gatewayId: string) => {
    if (gatewayId && gatewayId.startsWith('MOBILE_MONEY:')) {
      return gatewayId.replace('MOBILE_MONEY:', '');
    }
    return gatewayId || t('notAvailable');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-6 rounded-lg border border-border flex justify-between items-center bg-muted/50">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t('title')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <Badge variant="success" className="px-4 py-2 text-sm">
          <CheckCircle size={18} />
          {t('transactionsCount', { count: payments.length })}
        </Badge>
      </div>

      {payments.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground rounded-lg border border-border">
          <Search className="mx-auto w-12 h-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">{t('noTransactions')}</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{t('columns.date')}</TableHead>
              <TableHead>{t('columns.type')}</TableHead>
              <TableHead>{t('columns.amount')}</TableHead>
              <TableHead>{t('columns.phone')}</TableHead>
              <TableHead>{t('columns.transactionCode')}</TableHead>
              <TableHead>{t('columns.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="text-muted-foreground">
                  {new Date(payment.capturedAt || payment.createdAt).toLocaleString('fr-FR', {
                    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant={PURPOSE_BADGE[payment.purpose] ?? 'neutral'}>{payment.purpose}</Badge>
                </TableCell>
                <TableCell className="font-bold">
                  {payment.amountTotal.toLocaleString()} {payment.currency}
                </TableCell>
                <TableCell className="font-medium">
                  {extractPhone(payment.gatewayTransactionId)}
                </TableCell>
                <TableCell className="font-mono font-bold text-muted-foreground">
                  {payment.manualTransactionRef || t('notAvailable')}
                </TableCell>
                <TableCell>
                  <span className="flex items-center text-sm font-bold text-green-600 dark:text-green-400">
                    <CheckCircle size={16} className="mr-1" /> {t('automatic')}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
