'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Vehicle } from '../types/vehicle';
import MyVehicleCard from './VehicleCard';
import BoostModal from '../components/BoostModal';

function MyVehiclesContent() {
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

      if (response.status === 403) throw new Error('Accès non autorisé.');
      if (!response.ok) throw new Error('Impossible de récupérer vos véhicules.');

      const data: Vehicle[] = await response.json();
      console.log('Données des véhicules reçues:', data);
      setAllVehicles(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleDeleteVehicle = async (vehicleId: number) => {
    await fetchVehicles();

    // Si la page actuelle devient vide après suppression, revenir à la page précédente
    const remainingVehicles = allVehicles.filter(v => v.id !== vehicleId).length;
    const newTotalPages = Math.ceil(remainingVehicles / vehiclesPerPage);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }
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

  const handleBoostSuccess = () => {
    fetchVehicles();
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
        Précédent
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
        Suivant
      </button>
    );

    return buttons;
  };

  if (isLoading) return <p className="text-center py-12 text-foreground">Chargement de vos véhicules...</p>;
  if (error) return <p className="text-center py-12 text-red-500">{error}</p>;

  return (
    <div className="container mx-auto p-8 bg-background min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Mes Véhicules</h1>
          {totalVehicles > 0 && (
            <p className="text-foreground/70 mt-2">
              {totalVehicles} véhicule{totalVehicles > 1 ? 's' : ''} au total
            </p>
          )}
        </div>
        <button
          onClick={() => router.push('/vehicles/add')}
          className="bg-primary text-primary-foreground px-5 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          + Ajouter un véhicule
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
                Page {currentPage} sur {totalPages}
                ({((currentPage - 1) * vehiclesPerPage) + 1} à {Math.min(currentPage * vehiclesPerPage, totalVehicles)} sur {totalVehicles} véhicules)
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-card rounded-lg shadow border border-border">
          <p className="text-foreground/70 text-lg">Vous n&apos;avez ajouté aucun véhicule pour le moment.</p>
          <p className="text-foreground/50 mt-2">Cliquez sur &quot;Ajouter un véhicule&quot; pour commencer.</p>
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
  return (
    <Suspense fallback={
      <div className="container mx-auto p-8 min-h-screen flex justify-center items-center">
        <p className="text-lg text-foreground/70">Chargement de la page...</p>
      </div>
    }>
      <MyVehiclesContent />
    </Suspense>
  );
}