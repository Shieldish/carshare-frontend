'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import PromotionRow from './PromotionRow';
import AdminPagination from '../components/AdminPagination';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/app/components/ui';

const ITEMS_PER_PAGE = 10;

// Type pour les données reçues de l'API
export interface BoostAdminData {
  boostId: string;
  vehicleId: number;
  vehicleMake: string;
  vehicleModel: string;
  vehicleImageUrl?: string; // ✅ NOUVEAU CHAMP
  ownerEmail: string;
  boostType: 'STANDARD' | 'PREMIUM' | 'ULTRA';
  expiresAt: string;
  heroImageUrl: string | null;
}

export default function AdminPromotionsPage() {
  const t = useTranslations('admin.promotions');
  const [boosts, setBoosts] = useState<BoostAdminData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Sécurité : Vérifier si l'utilisateur est admin
    if (!authLoading) {
      if (!user || user.role !== 'ADMIN') {
        router.push('/'); // Rediriger si non-admin
        return;
      }
    }
  }, [user, authLoading, router]);

  const fetchBoosts = async () => {
    try {
      const data = await apiClient.get('/api/promotions/admin/boosts');
      setBoosts(data || []);
    } catch {
      setError(t('loadError'));
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchBoosts();
    }
  }, [user]);

  const handleImageUploadSuccess = (boostId: string, newImageUrl: string) => {
    // Mettre à jour la liste sans recharger toute la page
    setBoosts(prevBoosts =>
      prevBoosts.map(boost =>
        boost.boostId === boostId ? { ...boost, heroImageUrl: newImageUrl } : boost
      )
    );
    // Rafraîchir après 2s pour s'assurer que tout est synchronisé
    setTimeout(() => fetchBoosts(), 2000);
  };

  // ✅ NOUVELLE FONCTION : Gérer la suppression de l'image dans l'état local
  const handleImageDeleteSuccess = (boostId: string) => {
    setBoosts(prevBoosts =>
      prevBoosts.map(boost =>
        boost.boostId === boostId ? { ...boost, heroImageUrl: null } : boost
      )
    );
  };

  if (authLoading || isLoading) return <div className="text-center p-12 text-muted-foreground">{t('loading')}</div>;
  if (error) return <div className="text-center p-12 text-destructive">{error}</div>;
  if (!user || user.role !== 'ADMIN') return null; // Pendant la redirection

  const totalPages = Math.ceil(boosts.length / ITEMS_PER_PAGE);
  const safePage = Math.min(currentPage, Math.max(totalPages, 1));
  const paginatedBoosts = boosts.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-foreground">{t('pageTitle')}</h1>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>{t('columns.vehicle')}</TableHead>
            <TableHead>{t('columns.owner')}</TableHead>
            <TableHead>{t('columns.boostType')}</TableHead>
            <TableHead>{t('columns.expiration')}</TableHead>
            <TableHead>{t('columns.sliderImage')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {boosts.length > 0 ? (
            paginatedBoosts.map(boost => (
              <PromotionRow
                key={boost.boostId}
                boost={boost}
                onUploadSuccess={handleImageUploadSuccess}
                onDeleteSuccess={handleImageDeleteSuccess}
              />
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">{t('noPromotions')}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <AdminPagination
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        previousLabel={t('pagePrevious')}
        nextLabel={t('pageNext')}
        pageLabel={t('pageOf', { current: safePage, total: totalPages })}
      />
    </div>
  );
}