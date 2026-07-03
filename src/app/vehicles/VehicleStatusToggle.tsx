// src/app/vehicles/VehicleStatusToggle.tsx
'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';

interface Props {
  vehicleId: number;
  initialIsActive: boolean;
  adminStatus: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  onActiveChange: (newIsActive: boolean) => void;
}

export default function VehicleStatusToggle({ vehicleId, initialIsActive, adminStatus, onActiveChange }: Props) {
  const [isActive, setIsActive] = useState(initialIsActive);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Le bouton est désactivé si la voiture n'est pas approuvée ou si une mise à jour est en cours
  const isDisabled = adminStatus !== 'APPROVED' || isUpdating;

  const handleToggle = async () => {
    if (adminStatus !== 'APPROVED') {
      setError("Le véhicule doit être approuvé avant d'être visible.");
      return;
    }

    setIsUpdating(true);
    setError(null);
    
    const newIsActive = !isActive;

    try {
      // ✅ Appel à la nouvelle route que nous avons créée dans le Backend
      await apiClient.put(`/api/vehicles/${vehicleId}/active`, { isActive: newIsActive });
      setIsActive(newIsActive);
      onActiveChange(newIsActive); // Notifie le composant parent
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour.');
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const buttonClasses = `relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}`;
  const toggleClasses = `inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`;

  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center space-x-3">
          <button
              type="button"
              onClick={handleToggle}
              disabled={isDisabled}
              className={`${isActive ? 'bg-green-600' : 'bg-gray-400'} ${buttonClasses}`}
              aria-checked={isActive}
              title={adminStatus !== 'APPROVED' ? "En attente de l'administrateur" : "Activer/Désactiver la visibilité"}
          >
              <span
              aria-hidden="true"
              className={`${isActive ? 'translate-x-5' : 'translate-x-0'} ${toggleClasses}`}
              />
          </button>
          <span className={`text-sm font-medium ${isActive ? 'text-green-700' : 'text-gray-500'}`}>
              {isUpdating ? '...' : (isActive ? 'Visible' : 'Masqué')}
          </span>
      </div>
      
      {/* Messages d'état pour guider l'utilisateur */}
      {adminStatus === 'PENDING_APPROVAL' && (
        <p className="text-xs text-orange-500 mt-1 font-semibold">En attente d'approbation</p>
      )}
      {adminStatus === 'REJECTED' && (
        <p className="text-xs text-red-500 mt-1 font-semibold">Documents refusés</p>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}