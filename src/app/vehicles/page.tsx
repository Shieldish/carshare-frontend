'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Vehicle } from '@/types/vehicle';
import MyVehicleCard from './VehicleCard';
import { VehicleCardSkeleton } from '../components/VehicleCard';
import BoostModal from '../components/BoostModal';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/apiClient';

function MyVehiclesContent() {
  const t = useTranslations('vehicles.myVehicles');
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightedVehicleId = searchParams.get('highlight') ? Number(searchParams.get('highlight')) : null;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États pour gérer la modale de boost
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // États pour la pagination côté frontend
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const vehiclesPerPage = 9; // 3x3 grid

  const fetchVehicles = useCallback(async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'}/api/users/me/vehicles`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 403) throw new Error(t('unauthorized'));
      if (!response.ok) throw new Error(t('loadError'));

      const data: Vehicle[] = await response.json();
      console.log('Données des véhicules reçues:', data);
      setAllVehicles(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [router, t]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleDeleteVehicle = (vehicleId: number) => {
    setAllVehicles(prev => {
      const remaining = prev.filter(v => v.id !== vehicleId);

      // Si la page actuelle devient vide après suppression, revenir à la page précédente
      const newTotalPages = Math.ceil(remaining.length / vehiclesPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }

      return remaining;
    });
  };

  // ✅ CORRECTION ICI : Utilisation de isActive (boolean) au lieu de status (string)
  const handleActiveChange = (vehicleId: number, newIsActive: boolean) => {
    setAllVehicles(prevVehicles =>
      prevVehicles.map((v): Vehicle =>
        v.id === vehicleId ? { ...v, isActive: newIsActive, active: newIsActive } : v
      )
    );
  };

  const handleOpenBoostModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedVehicle(null);
    setIsModalOpen(false);
  };

  const handleBoostSuccess = async (vehicleId: number) => {
    // ✅ On ne recharge que le véhicule boosté (pas toute la liste) pour éviter un
    // flash de chargement complet de la page pour une seule ligne modifiée.
    try {
      const updated: Vehicle = await apiClient.get(`/api/vehicles/${vehicleId}`);
      setAllVehicles(prev => prev.map(v => (v.id === vehicleId ? updated : v)));
    } catch {
      // Repli sûr : si le refetch ciblé échoue, on recharge toute la liste plutôt
      // que de laisser l'affichage désynchronisé du vrai statut de boost.
      fetchVehicles();
    }
  };

  // Calculs de pagination côté frontend
  const totalVehicles = allVehicles.length;
  const totalPages = Math.ceil(totalVehicles / vehiclesPerPage);
  const startIndex = (currentPage - 1) * vehiclesPerPage;
  const endIndex = startIndex + vehiclesPerPage;
  const currentVehicles = allVehicles.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    buttons.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-l-md hover:bg-card/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {t('previous')}
      </button>
    );

    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="px-3 py-2 text-sm font-medium text-foreground bg-card border border-border hover:bg-card/80 transition-colors"
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(
          <span key="ellipsis1" className="px-3 py-2 text-sm font-medium text-foreground/60 bg-card border border-border">
            ...
          </span>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm font-medium border border-border hover:bg-card/80 transition-colors ${
            i === currentPage
              ? 'text-primary bg-primary/10 border-primary'
              : 'text-foreground bg-card'
          }`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(
          <span key="ellipsis2" className="px-3 py-2 text-sm font-medium text-foreground/60 bg-card border border-border">
            ...
          </span>
        );
      }
      buttons.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="px-3 py-2 text-sm font-medium text-foreground bg-card border border-border hover:bg-card/80 transition-colors"
        >
          {totalPages}
        </button>
      );
    }

    buttons.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-r-md hover:bg-card/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {t('next')}
      </button>
    );

    return buttons;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 md:p-8 bg-background min-h-screen">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <VehicleCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }
  if (error) return <p className="text-center py-12 text-red-500">{error}</p>;

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8 bg-background min-h-screen">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">{t('title')}</h1>
          {totalVehicles > 0 && (
            <p className="text-foreground/70 mt-2">
              {totalVehicles > 1 ? t('countPlural', { count: totalVehicles }) : t('countSingular', { count: totalVehicles })}
            </p>
          )}
        </div>
        <button
          onClick={() => router.push('/vehicles/add')}
          className="bg-primary text-primary-foreground px-5 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors self-start sm:self-auto"
        >
          {t('addButton')}
        </button>
      </div>

      {currentVehicles.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentVehicles.map(vehicle => (
              <div
                key={vehicle.id}
                className={`rounded-xl transition-all duration-700 ${
                  highlightedVehicleId === vehicle.id
                    ? 'ring-4 ring-primary ring-offset-2 shadow-lg shadow-primary/30 animate-pulse'
                    : ''
                }`}
              >
                <MyVehicleCard
                  vehicle={vehicle}
                  onDelete={handleDeleteVehicle}
                  onBoostClick={handleOpenBoostModal}
                  onActiveChange={handleActiveChange}
                />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center">
              <nav className="inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                {renderPaginationButtons()}
              </nav>
            </div>
          )}

          {/* Informations de pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center text-sm text-foreground/70">
              <p>
                {t('pageOf', { current: currentPage, total: totalPages })}
                {' '}
                {t('pageRange', { from: ((currentPage - 1) * vehiclesPerPage) + 1, to: Math.min(currentPage * vehiclesPerPage, totalVehicles), total: totalVehicles })}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-card rounded-lg shadow border border-border">
          <p className="text-foreground/70 text-lg">{t('emptyTitle')}</p>
          <p className="text-foreground/50 mt-2">{t('emptyDescription')}</p>
        </div>
      )}

      {/* Modale de boost */}
      {isModalOpen && selectedVehicle && (
        <BoostModal
          vehicle={selectedVehicle}
          onClose={handleCloseModal}
          onBoostSuccess={handleBoostSuccess}
        />
      )}
    </div>
  );
}

// ✅ CORRECTION NEXT.JS : Envelopper le composant principal avec Suspense
export default function MyVehiclesPage() {
  const t = useTranslations('vehicles.myVehicles');
  return (
    <Suspense fallback={
      <div className="container mx-auto p-8 min-h-screen flex justify-center items-center">
        <p className="text-lg text-foreground/70">{t('loadingPage')}</p>
      </div>
    }>
      <MyVehiclesContent />
    </Suspense>
  );
}