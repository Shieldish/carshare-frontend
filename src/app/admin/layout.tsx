// src/app/admin/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  UserCog,
  Megaphone,
  LayoutDashboard,
  Menu,
  X,
  ChevronRight,
  Shield,
  AlertTriangle,
  Car, // ✅ AJOUT DE L'ICÔNE VOITURE
  Star
} from 'lucide-react';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: number;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('admin.layout');
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const navItems: NavItem[] = [
    {
      icon: LayoutDashboard,
      label: t('nav.dashboard'),
      href: '/admin',
    },
    {
      icon: UserCog,
      label: t('nav.users'),
      href: '/admin/users',
    },
    { // ✅ NOUVELLE SECTION VÉHICULES
      icon: Car,
      label: t('nav.vehicles'),
      href: '/admin/vehicles',
    },
    {
      icon: Megaphone,
      label: t('nav.promotions'),
      href: '/admin/promotions',
    },
    {
      icon: Star,
      label: t('nav.reviews'),
      href: '/admin/reviews',
    },
    {
      icon: AlertTriangle,
      label: t('nav.incidents'),
      href: '/admin/incidents',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('verifyingPermissions')}</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen
          bg-card border-r border-border
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'w-64' : 'w-20'}
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className={`flex items-center space-x-3 ${!isSidebarOpen && 'lg:justify-center'}`}>
            <Shield className="h-8 w-8 text-primary flex-shrink-0" />
            {isSidebarOpen && (
              <div>
                <h2 className="font-bold text-lg text-foreground">{t('panelTitle')}</h2>
                <p className="text-xs text-muted-foreground">{t('brand')}</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden lg:block p-2 rounded hover:bg-muted"
          >
            <ChevronRight className={`h-5 w-5 transition-transform ${!isSidebarOpen && 'rotate-180'}`} />
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg transition-all
                  ${isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground hover:bg-muted'
                  }
                  ${!isSidebarOpen && 'lg:justify-center'}
                `}
                title={!isSidebarOpen ? item.label : ''}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${isActive && 'drop-shadow'}`} />
                {isSidebarOpen && (
                  <>
                    <span className="flex-1 font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {isSidebarOpen && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0">
                {user.sub.split('@')[0].charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="font-medium text-sm text-foreground truncate">
                  {user.firstName || user.sub.split('@')[0]}
                </p>
                <p className="text-xs text-muted-foreground truncate">{t('administrator')}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden bg-card border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="font-bold text-lg text-foreground">{t('panelTitle')}</h1>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded hover:bg-muted"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-background">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
