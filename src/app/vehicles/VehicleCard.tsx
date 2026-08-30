'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Vehicle } from '@/types/vehicle';
import ConfirmDeleteVehicleModal from './ConfirmDeleteVehicleModal';
import VehicleStatusToggle from './VehicleStatusToggle';
import { useTranslations } from 'next-intl';

interface VehicleCardProps {
  vehicle: Vehicle;
  onDelete: (id: number) => void;
  onBoostClick?: (vehicle: Vehicle) => void;
  onActiveChange?: (vehicleId: number, newIsActive: boolean) => void;
}

const Toast = ({ 
  message, 
  type = 'error', 
  onClose 
}: { 
  message: string; 
  type?: 'success' | 'error'; 
  onClose: () => void; 
}) => {
  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 max-w-md z-50">
      <div className={`p-4 rounded-lg shadow-lg flex items-center justify-between border ${
        type === 'error' 
          ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300' 
          : 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
      }`}>
        <div className="flex items-center">
          {type === 'error' ? (
            <svg className="w-5 h-5 mr-3 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 mr-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span className="text-sm font-medium">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-foreground/60 hover:text-foreground p-2 -m-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default function VehicleCard({ vehicle, onDelete, onBoostClick, onActiveChange }: VehicleCardProps) {
  const t = useTranslations('vehicles.myVehicles');
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingVehicle, setIsDeletingVehicle] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const getImageUrl = () => {
    if (vehicle.images && Array.isArray(vehicle.images) && vehicle.images.length > 0) {
      return vehicle.images[0].url;
    }
    return `https://source.unsplash.com/random/400x200/?car&sig=${vehicle.id}`;
  };

  const getLocationDisplay = (vehicle: Vehicle): string => {
    const parts: string[] = [];
    if (vehicle.address && vehicle.address.trim() !== '') {
      parts.push(vehicle.address);
    }
    // La commune est désormais le niveau "ville" pertinent (découpage 2025) : on
    // n'affiche la province que si on n'a même pas de commune.
    if (vehicle.commune) {
      parts.push(vehicle.commune.name);
    } else if (vehicle.province) {
      parts.push(vehicle.province.name);
    }
    const uniqueParts = [...new Set(parts)];
    if (uniqueParts.length > 0) {
      return uniqueParts.join(', ');
    }
    return t('locationUnavailable');
  };

  const imageUrl = getImageUrl();
  const displayLocation = getLocationDisplay(vehicle);

  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleDeleteClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeletingVehicle(true);
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'}/api/vehicles/${vehicle.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(t('deleteFailed'));
      }

      setIsDeleteModalOpen(false);
      showToast(t('deleteSuccess'), 'success');
      onDelete(vehicle.id);

    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      showToast(t('deleteError'));
    } finally {
      setIsDeletingVehicle(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
  };

  const handleViewDetails = () => {
    router.push(`/vehicles/${vehicle.id}`);
  };

  const handleBoostClick = () => {
    if (onBoostClick) {
      onBoostClick(vehicle);
    }
  };

  // ✅ CORRECTION CLÉ : On vérifie `vehicle.isActive` ET `vehicle.active` envoyés par le Backend Java
  const currentIsActiveStatus = vehicle.isActive ?? vehicle.active ?? false;

  return (
    <>
      <div className="bg-card rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-border">
        <div className="relative overflow-hidden bg-muted">
          <div
            className="cursor-pointer"
            onClick={handleViewDetails}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={`${vehicle.make} ${vehicle.model}`} 
              className="w-full h-auto hover:scale-105 transition-transform duration-300"
              style={{ aspectRatio: 'auto' }}
              onError={(e) => {
                console.error('Erreur de chargement de l\'image:', imageUrl);
                e.currentTarget.src = `https://source.unsplash.com/random/400x200/?car&sig=${vehicle.id}`;
              }}
            />
          </div>

          {vehicle.images && Array.isArray(vehicle.images) && vehicle.images.length > 1 && (
            <div className="absolute bottom-3 left-3 bg-black/60 text-white px-2 py-1 rounded-md text-xs flex items-center backdrop-blur-sm">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
              </svg>
              {vehicle.images.length}
            </div>
          )}
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div 
              className="cursor-pointer"
              onClick={handleViewDetails}
            >
              <h3 className="text-lg font-bold text-foreground hover:text-primary transition-colors">
                {vehicle.make} {vehicle.model}
              </h3>
            </div>
            
            {/* ✅ MODIFIÉ: Appel avec le statut corrigé */}
            {vehicle.status && (
              <VehicleStatusToggle
                vehicleId={vehicle.id}
                initialIsActive={currentIsActiveStatus}
                adminStatus={vehicle.status}
                onActiveChange={(newIsActive) => {
                  if (onActiveChange) {
                    onActiveChange(vehicle.id, newIsActive);
                  }
                }}
              />
            )}
          </div>

          <div className="mt-3 flex justify-between items-center">
            <div>
              <p className="font-semibold text-primary text-lg">
                {vehicle.ratePerDay} FBu/jour
              </p>
            </div>
          </div>

          <div className="mt-2">
            <p className="text-sm text-foreground/60 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {displayLocation}
            </p>
          </div>

          {/* Actions */}
          <div className="mt-4 pt-3 border-t border-border flex flex-wrap justify-end gap-x-3 gap-y-2">
            <Link
              href={`/vehicles/${vehicle.id}/availability`}
              className="text-sm font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors flex items-center"
              title={t('calendarTitle')}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {t('calendarLink')}
            </Link>

            {onBoostClick && (
              <button
                onClick={handleBoostClick}
                className="text-sm font-semibold text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {t('boostLink')}
              </button>
            )}
            <Link
              href={`/vehicles/${vehicle.id}`}
              className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            >
              {t('viewDetailsLink')}
            </Link>
            <Link
              href={`/vehicles/edit/${vehicle.id}`}
              className="text-sm text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 font-medium transition-colors"
            >
              {t('editLink')}
            </Link>
            <button
              onClick={handleDeleteClick}
              disabled={isDeletingVehicle}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeletingVehicle ? t('deleting') : t('deleteLink')}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDeleteVehicleModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        vehicleName={`${vehicle.make} ${vehicle.model}`}
        isLoading={isDeletingVehicle}
      />

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </>
  );
}