// src/app/vehicles/VehicleStatusToggle.tsx
'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useTranslations } from 'next-intl';

interface Props {
  vehicleId: number;
  initialIsActive: boolean;
  adminStatus: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  onActiveChange: (newIsActive: boolean) => void;
}

export default function VehicleStatusToggle({ vehicleId, initialIsActive, adminStatus, onActiveChange }: Props) {
  const t = useTranslations('vehicles.myVehicles');
  const [isActive, setIsActive] = useState(initialIsActive);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Le bouton est désactivé si la voiture n'est pas approuvée ou si une mise à jour est en cours
  const isDisabled = adminStatus !== 'APPROVED' || isUpdating;

  const handleToggle = async () => {
    if (adminStatus !== 'APPROVED') {
      setError(t('toggleErrorNotApproved'));
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('toggleErrorGeneric');
      setError(msg);
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Note: h-6/w-11 are fixed dimensions under border-box sizing, so plain padding can't
  // grow the hit area here (it would shrink the content box and make the h-5 w-5 knob
  // overflow the track). Instead we extend the tappable area with an absolutely
  // positioned ::before pseudo-element, which is excluded from flex layout and doesn't
  // affect the visible track/knob at all.
  const buttonClasses = `relative before:content-[''] before:absolute before:-inset-2 inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}`;
  const toggleClasses = `inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`;

  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center space-x-3">
          <button
              type="button"
              role="switch"
              onClick={handleToggle}
              disabled={isDisabled}
              className={`${isActive ? 'bg-green-600' : 'bg-gray-400'} ${buttonClasses}`}
              aria-checked={isActive}
              title={adminStatus !== 'APPROVED' ? t('toggleTitleNotApproved') : t('toggleTitleToggle')}
          >
              <span
              aria-hidden="true"
              className={`${isActive ? 'translate-x-5' : 'translate-x-0'} ${toggleClasses}`}
              />
          </button>
          <span className={`text-sm font-medium ${isActive ? 'text-green-700' : 'text-gray-500'}`}>
              {isUpdating ? '...' : (isActive ? t('visible') : t('hidden'))}
          </span>
      </div>

      {/* Messages d'état pour guider l'utilisateur */}
      {adminStatus === 'PENDING_APPROVAL' && (
        <p className="text-xs text-orange-500 mt-1 font-semibold">{t('pendingApprovalLabel')}</p>
      )}
      {adminStatus === 'REJECTED' && (
        <p className="text-xs text-red-500 mt-1 font-semibold">{t('rejectedLabel')}</p>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}