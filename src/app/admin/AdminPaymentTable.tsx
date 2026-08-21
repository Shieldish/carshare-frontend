'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/apiClient';
import { Loader2, CheckCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';

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
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
        </div>
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-bold flex items-center">
          <CheckCircle size={18} className="mr-2" />
          {t('transactionsCount', { count: payments.length })}
        </div>
      </div>

      <div className="overflow-x-auto">
        {payments.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Search className="mx-auto w-12 h-12 text-gray-400 mb-4 opacity-50" />
            <p className="text-lg font-medium">{t('noTransactions')}</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">{t('columns.date')}</th>
                <th className="p-4 font-medium">{t('columns.type')}</th>
                <th className="p-4 font-medium">{t('columns.amount')}</th>
                <th className="p-4 font-medium">{t('columns.phone')}</th>
                <th className="p-4 font-medium">{t('columns.transactionCode')}</th>
                <th className="p-4 font-medium">{t('columns.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                    {new Date(payment.capturedAt || payment.createdAt).toLocaleString('fr-FR', {
                      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-md ${
                      payment.purpose === 'BOOST' ? 'bg-purple-100 text-purple-700' : 
                      payment.purpose === 'BOOKING' ? 'bg-blue-100 text-blue-700' : 
                      payment.purpose === 'COMPANY_REGISTRATION_FEE' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {payment.purpose}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-gray-900 dark:text-white">
                    {payment.amountTotal.toLocaleString()} {payment.currency}
                  </td>
                  <td className="p-4 font-medium text-gray-700 dark:text-gray-300">
                    {extractPhone(payment.gatewayTransactionId)}
                  </td>
                  <td className="p-4 font-mono font-bold text-gray-600 dark:text-gray-300">
                    {payment.manualTransactionRef || t('notAvailable')}
                  </td>
                  <td className="p-4">
                    <span className="flex items-center text-sm font-bold text-green-600">
                      <CheckCircle size={16} className="mr-1" /> {t('automatic')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}