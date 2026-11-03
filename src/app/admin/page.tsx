// src/app/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/apiClient';
import { Users, Megaphone, TrendingUp, DollarSign, Car, Calendar, CreditCard } from 'lucide-react';
import Link from 'next/link';
import AdminPaymentTable from './AdminPaymentTable';
import { StatCard, Card, Badge, type StatCardTone } from '@/app/components/ui';

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
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards: Array<{
    title: string;
    value: string | number;
    icon: typeof Users;
    tone: StatCardTone;
    link: string;
    change: string | null;
    isNew?: boolean;
  }> = [
    {
      title: t('statCards.totalUsers'),
      value: stats?.totalUsers || 0,
      icon: Users,
      tone: 'info',
      link: '/admin/users',
      change: formatTrend(stats?.usersTrendPercent),
    },
    {
      title: t('statCards.totalVehicles'),
      value: stats?.totalVehicles || 0,
      icon: Car,
      tone: 'success',
      link: '/vehicles',
      change: formatTrend(stats?.vehiclesTrendPercent),
    },
    {
      title: t('statCards.totalBookings'),
      value: stats?.totalBookings || 0,
      icon: Calendar,
      tone: 'purple',
      link: '/bookings',
      change: formatTrend(stats?.bookingsTrendPercent),
    },
    {
      title: t('statCards.activePromotions'),
      value: stats?.activePromotions || 0,
      icon: Megaphone,
      tone: 'warning',
      link: '/admin/promotions',
      change: null,
    },
    {
      title: t('statCards.monthlyRevenue'),
      value: `${(stats?.monthlyRevenue || 0).toLocaleString('fr-FR')} FBu`,
      icon: DollarSign,
      tone: 'primary',
      link: '/dashboard/financial',
      change: formatTrend(stats?.revenueTrendPercent),
    },
    {
      title: t('statCards.pendingVerifications'),
      value: stats?.pendingVerifications || 0,
      icon: TrendingUp,
      tone: 'destructive',
      link: '/admin/users',
      change: null,
      isNew: (stats?.pendingVerifications ?? 0) > 0,
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          {t('pageTitle')}
        </h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, index) => (
          <Link key={index} href={card.link} className="block relative transition-transform duration-200 hover:scale-[1.02]">
            {card.isNew && (
              <Badge variant="destructive" className="absolute right-4 top-4 z-10 animate-pulse">
                {t('newBadge')}
              </Badge>
            )}
            <StatCard
              icon={card.icon}
              label={card.title}
              value={card.value}
              tone={card.tone}
              trend={card.change ? { value: `${card.change} ${t('changeSuffix')}` } : undefined}
            />
          </Link>
        ))}
      </div>

      {/* ✅ SECTION PRIORITAIRE : VALIDATION DES PAIEMENTS */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <CreditCard className="w-6 h-6 text-primary mr-3" />
          <h2 className="text-2xl font-bold text-foreground">
            {t('paymentHistoryTitle')}
          </h2>
        </div>
        <AdminPaymentTable />
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 text-foreground">
          {t('quickActionsTitle')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/users"
            className="flex items-center space-x-3 p-4 rounded-lg border-2 border-border hover:border-primary transition-colors"
          >
            <Users className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium text-foreground">{t('manageUsersTitle')}</p>
              <p className="text-sm text-muted-foreground">{t('manageUsersDesc')}</p>
            </div>
          </Link>

          <Link
            href="/admin/promotions"
            className="flex items-center space-x-3 p-4 rounded-lg border-2 border-border hover:border-primary transition-colors"
          >
            <Megaphone className="h-6 w-6 text-primary" />
            <div>
              <p className="font-medium text-foreground">{t('managePromotionsTitle')}</p>
              <p className="text-sm text-muted-foreground">{t('managePromotionsDesc')}</p>
            </div>
          </Link>
        </div>
      </Card>
    </div>
  );
}