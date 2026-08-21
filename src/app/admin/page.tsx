// src/app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/apiClient';
import { Users, Megaphone, TrendingUp, DollarSign, Car, Calendar, CreditCard } from 'lucide-react';
import Link from 'next/link';
import AdminPaymentTable from './AdminPaymentTable';

interface DashboardStats {
  totalUsers: number;
  totalVehicles: number;
  totalBookings: number;
  activePromotions: number;
  monthlyRevenue: number;
  pendingVerifications: number;
  usersTrendPercent: number | null;
  vehiclesTrendPercent: number | null;
  bookingsTrendPercent: number | null;
  revenueTrendPercent: number | null;
}

// ✅ null = pas assez d'historique pour comparer (ex. le mois dernier n'a eu aucune
// activité) — dans ce cas on n'affiche pas de badge plutôt qu'un pourcentage trompeur.
const formatTrend = (percent: number | null | undefined): string | null => {
  if (percent === null || percent === undefined) return null;
  return `${percent > 0 ? '+' : ''}${percent}%`;
};

export default function AdminDashboardPage() {
  const t = useTranslations('admin.dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Adapter selon ton API backend
        const data = await apiClient.get('/api/admin/dashboard-stats');
        setStats(data);
      } catch (error) {
        console.error(t('loadError'), error);
        // Données mockées pour démo si l'endpoint n'existe pas encore
        setStats({
          totalUsers: 0,
          totalVehicles: 0,
          totalBookings: 0,
          activePromotions: 0,
          monthlyRevenue: 0,
          pendingVerifications: 0,
          usersTrendPercent: null,
          vehiclesTrendPercent: null,
          bookingsTrendPercent: null,
          revenueTrendPercent: null,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: t('statCards.totalUsers'),
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'blue',
      link: '/admin/users',
      change: formatTrend(stats?.usersTrendPercent),
    },
    {
      title: t('statCards.totalVehicles'),
      value: stats?.totalVehicles || 0,
      icon: Car,
      color: 'green',
      link: '/vehicles',
      change: formatTrend(stats?.vehiclesTrendPercent),
    },
    {
      title: t('statCards.totalBookings'),
      value: stats?.totalBookings || 0,
      icon: Calendar,
      color: 'purple',
      link: '/bookings',
      change: formatTrend(stats?.bookingsTrendPercent),
    },
    {
      title: t('statCards.activePromotions'),
      value: stats?.activePromotions || 0,
      icon: Megaphone,
      color: 'orange',
      link: '/admin/promotions',
      change: null,
    },
    {
      title: t('statCards.monthlyRevenue'),
      value: `${(stats?.monthlyRevenue || 0).toLocaleString('fr-FR')} FBu`,
      icon: DollarSign,
      color: 'emerald',
      link: '/dashboard/financial',
      change: formatTrend(stats?.revenueTrendPercent),
    },
    {
      title: t('statCards.pendingVerifications'),
      value: stats?.pendingVerifications || 0,
      icon: TrendingUp,
      color: 'red',
      link: '/admin/users',
      change: null,
      badge: (stats?.pendingVerifications ?? 0) > 0,
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; icon: string; badge: string }> = {
      blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', icon: 'text-blue-600 dark:text-blue-400', badge: 'bg-blue-100 text-blue-700' },
      green: { bg: 'bg-green-50 dark:bg-green-900/20', icon: 'text-green-600 dark:text-green-400', badge: 'bg-green-100 text-green-700' },
      purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'text-purple-600 dark:text-purple-400', badge: 'bg-purple-100 text-purple-700' },
      orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', icon: 'text-orange-600 dark:text-orange-400', badge: 'bg-orange-100 text-orange-700' },
      emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700' },
      red: { bg: 'bg-red-50 dark:bg-red-900/20', icon: 'text-red-600 dark:text-red-400', badge: 'bg-red-100 text-red-700' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('pageTitle')}
        </h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const colors = getColorClasses(card.color);

          return (
            <Link
              key={index}
              href={card.link}
              className="block group"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${colors.bg}`}>
                    <Icon className={`h-6 w-6 ${colors.icon}`} />
                  </div>
                  {card.badge && (
                    <span className="px-2 py-1 text-xs font-semibold text-red-600 bg-red-100 rounded-full animate-pulse">
                      {t('newBadge')}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {card.value}
                  </p>
                  {card.change && (
                    <p className={`text-sm font-medium ${colors.badge} inline-block px-2 py-0.5 rounded`}>
                      {card.change} {t('changeSuffix')}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ✅ SECTION PRIORITAIRE : VALIDATION DES PAIEMENTS */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <CreditCard className="w-6 h-6 text-orange-600 dark:text-orange-400 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('paymentHistoryTitle')}
          </h2>
        </div>
        <AdminPaymentTable />
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          {t('quickActionsTitle')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/users"
            className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary transition-colors"
          >
            <Users className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{t('manageUsersTitle')}</p>
              <p className="text-sm text-muted-foreground">{t('manageUsersDesc')}</p>
            </div>
          </Link>

          <Link
            href="/admin/promotions"
            className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary transition-colors"
          >
            <Megaphone className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{t('managePromotionsTitle')}</p>
              <p className="text-sm text-muted-foreground">{t('managePromotionsDesc')}</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}