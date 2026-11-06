'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Vehicle } from '@/types/vehicle';
import ConfirmDeleteVehicleModal from './ConfirmDeleteVehicleModal';
import VehicleStatusToggle from './VehicleStatusToggle';
import { useTranslations } from 'next-intl';
import { AlertCircle, CheckCircle2, X, Images, MapPin, Calendar, Zap, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';

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
      <div className={cn(
        'p-4 rounded-lg shadow-lg flex items-center justify-between border',
        type === 'error'
          ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
          : 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
      )}>
        <div className="flex items-center">
          {type === 'error' ? (
            <AlertCircle className="w-5 h-5 mr-3 text-red-600 dark:text-red-400" />
          ) : (
            <CheckCircle2 className="w-5 h-5 mr-3 text-green-600 dark:text-green-400" />
          )}
          <span className="text-sm font-medium">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-foreground/60 hover:text-foreground p-2 -m-2"
        >
          <X className="w-4 h-4" />
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
              <Images className="w-3 h-3 mr-1" />
              {vehicle.images.length}
            </div>
          )}
        </div>
        
        <div className="p-4">
          <div className="flex flex-wrap justify-between items-start gap-2">
            <div
              className="min-w-0 cursor-pointer"
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
              <MapPin className="w-4 h-4 mr-1 shrink-0" />
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
              <Calendar className="w-4 h-4 mr-1" />
              {t('calendarLink')}
            </Link>

            {onBoostClick && (
              <button
                onClick={handleBoostClick}
                className="text-sm font-semibold text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors flex items-center"
              >
                <Zap className="w-4 h-4 mr-1" />
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
              className="text-sm font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors flex items-center"
            >
              <Edit2 className="w-4 h-4 mr-1" />
              {t('editLink')}
            </Link>
            <button
              onClick={handleDeleteClick}
              disabled={isDeletingVehicle}
              className="text-sm font-semibold text-destructive hover:text-destructive/80 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4 mr-1" />
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