// src/app/dashboard/financial/layout.tsx
'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, LayoutDashboard, TrendingUp, Receipt } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/app/components/ui';

interface FinancialLayoutProps {
  children: React.ReactNode;
}

const FinancialLayout: React.FC<FinancialLayoutProps> = ({ children }) => {
  const t = useTranslations('dashboardFinancial');
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    {
      path: '/dashboard/financial',
      label: t('navOverview'),
      icon: LayoutDashboard,
      exact: true
    },
    {
      path: '/dashboard/financial/revenue',
      label: t('navRevenue'),
      icon: TrendingUp
    },
    {
      path: '/dashboard/financial/expenses',
      label: t('navExpenses'),
      icon: Receipt
    },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return pathname === path;
    }
    return pathname?.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="group px-0 hover:bg-transparent hover:text-primary">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              {t('back')}
            </Button>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);
              
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`
                    flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap
                    ${active 
                      ? 'bg-background text-primary border-t-2 border-x border-border border-t-primary' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {children}
      </div>
    </div>
  );
};

export default FinancialLayout;