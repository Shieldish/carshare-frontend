// src/app/admin/vehicles/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { apiClient } from '@/lib/apiClient';
import { CheckCircle, XCircle, FileText, Car, ShieldAlert, ExternalLink, Loader2, Ban, PlayCircle, CheckCircle2, Flame, Images, ImageOff } from 'lucide-react';
import type { VehicleImage } from '@/types/vehicle';
import AdminPagination from '../components/AdminPagination';
import { openProtectedVehicleDocument } from '@/app/components/ProtectedImage';
import { Badge, Button, ConfirmDialog, Dialog, DialogBody } from '@/app/components/ui';

const ITEMS_PER_PAGE = 9;

interface Owner {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
}

interface AdminVehicle {
  id: number;
  make: string;
  model: string;
  status: string;
  registrationDocumentUrl?: string;
  insuranceDocumentUrl?: string;
  technicalControlDocumentUrl?: string;
  insuranceExpiryDate?: string;
  technicalControlExpiryDate?: string;
  images?: VehicleImage[];
  owner: Owner;
  isBoosted?: boolean; // ✅ NOUVEAU
  commune?: { name: string };
  province?: { name: string };
}

// Ville du véhicule, affichée juste devant le nom du propriétaire dans les listes admin.
function cityPrefix(vehicle: AdminVehicle): string {
  const city = vehicle.commune?.name || vehicle.province?.name;
  return city ? `${city} · ` : '';
}

type ExpiryState = 'expired' | 'expiringSoon' | 'ok' | 'none';

// ✅ Heuristique d'affichage pour le tableau de bord admin — pas besoin de reproduire
// exactement les seuils du cron d'alerte backend, juste donner un repère visuel rapide.
function getExpiryStatus(dateStr?: string): { state: ExpiryState; date: Date | null } {
  if (!dateStr) return { state: 'none', date: null };
  const expiry = new Date(dateStr);
  if (isNaN(expiry.getTime())) return { state: 'none', date: null };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  const diffDays = Math.round((expiry.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return { state: 'expired', date: expiry };
  if (diffDays <= 30) return { state: 'expiringSoon', date: expiry };
  return { state: 'ok', date: expiry };
}

// ✅ Bloc partagé (photos + documents + dates d'expiration) réutilisé identiquement dans les
// 3 onglets (en attente / actifs / suspendus) — l'admin doit pouvoir consulter cette
// information avant l'approbation ET après, pas seulement pendant la validation initiale.
function VehicleComplianceSection({ vehicle }: { vehicle: AdminVehicle }) {
  const t = useTranslations('admin.vehicles');
  const locale = useLocale();
  const images = vehicle.images || [];

  const formatExpiry = (dateStr?: string) => {
    const { state, date } = getExpiryStatus(dateStr);
    if (state === 'none' || !date) {
      return <p className="text-xs text-muted-foreground mt-1">{t('documents.noExpiryDate')}</p>;
    }
    const formatted = date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
    const badge = state === 'expired'
      ? <Badge variant="destructive" className="ml-2">{t('documents.expired')}</Badge>
      : state === 'expiringSoon'
      ? <Badge variant="warning" className="ml-2">{t('documents.expiringSoon')}</Badge>
      : null;
    return (
      <p className={`text-xs mt-1 flex items-center ${state === 'expired' ? 'text-destructive' : 'text-muted-foreground'}`}>
        {t('documents.expiryLabel', { date: formatted })}{badge}
      </p>
    );
  };

  return (
    <div className="space-y-4">
      {/* Photos du véhicule — pas de fallback Unsplash ici : substituer une fausse photo
          tromperait l'admin qui doit juger le véhicule réel. */}
      <div>
        <p className="text-sm font-semibold mb-2 text-foreground">{t('photosSection.title')}</p>
        {images.length > 0 ? (
          <a
            href={images[0].url}
            target="_blank"
            rel="noopener noreferrer"
            title={t('photosSection.viewFullSize')}
            className="relative block w-full h-32 rounded-lg overflow-hidden border border-border group"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[0].url} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
            {images.length > 1 && (
              <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1 backdrop-blur-sm">
                <Images className="w-3 h-3" /> {images.length}
              </span>
            )}
          </a>
        ) : (
          <div className="w-full h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground">
            <ImageOff className="w-6 h-6 mb-1" />
            <p className="text-xs">{t('photosSection.noPhotos')}</p>
          </div>
        )}
      </div>

      {/* Documents légaux */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">{t('documentsToVerify')}</p>
        {vehicle.registrationDocumentUrl ? (
          <button type="button" onClick={() => openProtectedVehicleDocument(vehicle.id, 'registration')} className="w-full flex items-center justify-between p-3 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors border border-primary/20">
            <span className="flex items-center gap-2"><FileText className="w-5 h-5" /> {t('documents.registration')}</span><ExternalLink className="w-4 h-4" />
          </button>
        ) : <p className="text-sm text-destructive flex items-center gap-2"><XCircle className="w-4 h-4" /> {t('documents.registrationMissing')}</p>}

        <div>
          {vehicle.insuranceDocumentUrl ? (
            <button type="button" onClick={() => openProtectedVehicleDocument(vehicle.id, 'insurance')} className="w-full flex items-center justify-between p-3 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors border border-primary/20">
              <span className="flex items-center gap-2"><FileText className="w-5 h-5" /> {t('documents.insurance')}</span><ExternalLink className="w-4 h-4" />
            </button>
          ) : <p className="text-sm text-destructive flex items-center gap-2"><XCircle className="w-4 h-4" /> {t('documents.insuranceMissing')}</p>}
          {formatExpiry(vehicle.insuranceExpiryDate)}
        </div>

        <div>
          {vehicle.technicalControlDocumentUrl ? (
            <button type="button" onClick={() => openProtectedVehicleDocument(vehicle.id, 'technicalControl')} className="w-full flex items-center justify-between p-3 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors border border-primary/20">
              <span className="flex items-center gap-2"><FileText className="w-5 h-5" /> {t('documents.technicalControl')}</span><ExternalLink className="w-4 h-4" />
            </button>
          ) : <p className="text-sm text-destructive flex items-center gap-2"><XCircle className="w-4 h-4" /> {t('documents.technicalControlMissing')}</p>}
          {formatExpiry(vehicle.technicalControlExpiryDate)}
        </div>
      </div>
    </div>
  );
}

export default function AdminVehiclesPage() {
  const t = useTranslations('admin.vehicles');
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'suspended'>('pending');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'success' as 'success' | 'error' });

  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.get('/api/vehicles/admin/full');
      setVehicles(data);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des véhicules:', err);
      setError(t('loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleUpdateStatusClick = (vehicleId: number, newStatus: string) => {
    let title = t('confirmDialog.defaultTitle');
    let message = t('confirmDialog.defaultMessage');
    let apiStatus = newStatus;

    if (newStatus === 'SUSPENDED_BY_ADMIN') {
      title = t('confirmDialog.suspendTitle');
      message = t('confirmDialog.suspendMessage');
    } else if (newStatus === 'APPROVED_FROM_SUSPENDED') {
      title = t('confirmDialog.reactivateTitle');
      message = t('confirmDialog.reactivateMessage');
      apiStatus = 'APPROVED';
    }

    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => executeUpdateStatus(vehicleId, apiStatus)
    });
  };

  const executeUpdateStatus = async (vehicleId: number, apiStatus: string) => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    setActionLoading(vehicleId);
    
    try {
      await apiClient.put(`/api/vehicles/${vehicleId}/status`, { status: apiStatus });
      setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, status: apiStatus } : v));
      
      setAlertDialog({
        isOpen: true,
        title: t('alertDialog.successTitle'),
        message: t('alertDialog.successMessage'),
        type: "success"
      });
    } catch (err: unknown) {
      console.error('Erreur de mise à jour:', err);
      const serverMessage = err instanceof Error ? err.message : t('alertDialog.unknownServerError');

      setAlertDialog({
        isOpen: true,
        title: t('alertDialog.errorTitle'),
        message: `${t('alertDialog.errorMessagePrefix')}${serverMessage}`,
        type: "error"
      });
    } finally {
      setActionLoading(null);
    }
  };

  // ✅ NOUVEAU : Handler pour le boost d'un véhicule
  const handleBoostClick = (vehicle: AdminVehicle) => {
    setConfirmDialog({
      isOpen: true,
      title: t('confirmDialog.boostTitle'),
      message: `${t('confirmDialog.boostMessagePrefix')} "${vehicle.make} ${vehicle.model}" ${t('confirmDialog.boostMessageSuffix')}`,
      onConfirm: () => executeBoost(vehicle.id),
    });
  };

  const executeBoost = async (vehicleId: number) => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    setActionLoading(vehicleId);
    try {
      await apiClient.boostVehicle(vehicleId, 1);
      setVehicles(vehicles.map(v => v.id === vehicleId ? { ...v, isBoosted: true } : v));
      setAlertDialog({
        isOpen: true,
        title: t('alertDialog.boostSuccessTitle'),
        message: t('alertDialog.boostSuccessMessage'),
        type: "success"
      });
    } catch (err: unknown) {
      console.error('Erreur boost:', err);
      const serverMessage = err instanceof Error ? err.message : t('alertDialog.unknownServerError');
      setAlertDialog({
        isOpen: true,
        title: t('alertDialog.boostErrorTitle'),
        message: `${t('alertDialog.boostErrorMessagePrefix')}${serverMessage}`,
        type: "error"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const pendingVehicles = vehicles.filter(v => v.status === 'PENDING_APPROVAL');
  const activeVehicles = vehicles.filter(v => v.status === 'APPROVED' || v.status === 'AVAILABLE' || v.status === 'RENTED');
  const suspendedVehicles = vehicles.filter(v => v.status === 'SUSPENDED_BY_ADMIN');

  // Une seule page courante, partagée par les 3 onglets (un seul onglet est affiché à la
  // fois) et remise à 1 au changement d'onglet, ci-dessus.
  const currentTabVehicles = activeTab === 'pending' ? pendingVehicles : activeTab === 'active' ? activeVehicles : suspendedVehicles;
  const totalPages = Math.ceil(currentTabVehicles.length / ITEMS_PER_PAGE);
  const paginate = <T,>(arr: T[]) => arr.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const paginatedPendingVehicles = paginate(pendingVehicles);
  const paginatedActiveVehicles = paginate(activeVehicles);
  const paginatedSuspendedVehicles = paginate(suspendedVehicles);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg text-muted-foreground">{t('loading')}</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto relative">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
            <Car className="w-8 h-8 text-primary" />
            {t('pageTitle')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6 border border-destructive/20 flex items-center gap-2">
          <XCircle className="w-5 h-5" /> {error}
        </div>
      )}

      {/* SYSTÈME D'ONGLETS */}
      <div className="flex space-x-2 mb-8 border-b border-border pb-px overflow-x-auto">
        <button onClick={() => setActiveTab('pending')} className={`flex items-center gap-2 px-6 py-3 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'pending' ? 'bg-card text-primary border-t border-l border-r border-border mb-[-1px]' : 'text-muted-foreground hover:text-foreground bg-muted/50'}`}>
          <ShieldAlert className="w-4 h-4" /> {t('tabs.pending')} ({pendingVehicles.length})
        </button>
        <button onClick={() => setActiveTab('active')} className={`flex items-center gap-2 px-6 py-3 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'active' ? 'bg-card text-primary border-t border-l border-r border-border mb-[-1px]' : 'text-muted-foreground hover:text-foreground bg-muted/50'}`}>
          <CheckCircle className="w-4 h-4" /> {t('tabs.active')} ({activeVehicles.length})
        </button>
        <button onClick={() => setActiveTab('suspended')} className={`flex items-center gap-2 px-6 py-3 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'suspended' ? 'bg-card text-primary border-t border-l border-r border-border mb-[-1px]' : 'text-muted-foreground hover:text-foreground bg-muted/50'}`}>
          <Ban className="w-4 h-4" /> {t('tabs.suspended')} ({suspendedVehicles.length})
        </button>
      </div>

      {/* ONGLET 1 : EN ATTENTE */}
      {activeTab === 'pending' && (
        <div className="animate-in fade-in duration-300">
          {pendingVehicles.length === 0 ? (
            <div className="bg-muted p-8 rounded-xl border border-border text-center text-muted-foreground">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>{t('noPendingVehicles')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedPendingVehicles.map(vehicle => (
                <div key={vehicle.id} className="bg-card rounded-xl shadow-sm border border-amber-200 dark:border-amber-800/50 p-5 flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-foreground">{vehicle.make} {vehicle.model}</h3>
                    <p className="text-sm font-semibold text-foreground/90 mt-1">
                      {cityPrefix(vehicle)}{vehicle.owner.firstName} {vehicle.owner.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{vehicle.owner.email} | {vehicle.owner.phoneNumber || t('noOwnerPhone')}</p>
                  </div>

                  <div className="flex-grow mb-6">
                    <VehicleComplianceSection vehicle={vehicle} />
                  </div>

                  <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
                    <Button
                      onClick={() => handleUpdateStatusClick(vehicle.id, 'APPROVED')}
                      disabled={actionLoading === vehicle.id || !vehicle.registrationDocumentUrl || !vehicle.insuranceDocumentUrl || !vehicle.technicalControlDocumentUrl}
                      className="flex-1 !bg-green-600 hover:!bg-green-700"
                    >
                      {actionLoading === vehicle.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />} {t('approve')}
                    </Button>
                    <Button variant="outline" onClick={() => handleUpdateStatusClick(vehicle.id, 'REJECTED')} disabled={actionLoading === vehicle.id} className="flex-1">
                      <XCircle className="w-5 h-5" /> {t('reject')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            previousLabel={t('pagePrevious')}
            nextLabel={t('pageNext')}
            pageLabel={t('pageOf', { current: currentPage, total: totalPages })}
          />
        </div>
      )}

      {/* ONGLET 2 : VÉHICULES ACTIFS */}
      {activeTab === 'active' && (
        <div className="animate-in fade-in duration-300">
          {activeVehicles.length === 0 ? (
            <p className="text-muted-foreground italic">{t('noActiveVehicles')}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedActiveVehicles.map(vehicle => (
                <div key={vehicle.id} className="bg-card rounded-xl shadow-sm border border-border p-5 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-foreground">{vehicle.make} {vehicle.model}</h3>
                    <div className="flex items-center gap-2">
                      {vehicle.isBoosted && (
                        <Badge variant="boost">
                          <Flame className="w-3 h-3" /> {t('boostedBadge')}
                        </Badge>
                      )}
                      <Badge variant="success">{vehicle.status}</Badge>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mb-4">
                    {(vehicle.commune?.name || vehicle.province?.name) && (
                      <span className="block text-muted-foreground/70">{vehicle.commune?.name || vehicle.province?.name}</span>
                    )}
                    {t('ownerLabel', { name: `${vehicle.owner.firstName} ${vehicle.owner.lastName}` })}
                  </div>
                  <div className="mb-4">
                    <VehicleComplianceSection vehicle={vehicle} />
                  </div>
                  <div className="mt-auto pt-4 border-t border-border flex flex-col gap-2">
                    {/* ✅ NOUVEAU : Bouton Boost */}
                    <button
                      onClick={() => handleBoostClick(vehicle)}
                      disabled={actionLoading === vehicle.id || vehicle.isBoosted}
                      className="w-full bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border border-accent/20 hover:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
                      title={vehicle.isBoosted ? t('boostButton.titleAlreadyBoosted') : t('boostButton.titleBoost')}
                    >
                      {actionLoading === vehicle.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
                      {vehicle.isBoosted ? t('boostButton.alreadyBoosted') : t('boostButton.boost')}
                    </button>
                    <Button variant="outline" onClick={() => handleUpdateStatusClick(vehicle.id, 'SUSPENDED_BY_ADMIN')} disabled={actionLoading === vehicle.id} className="w-full !text-destructive !border-destructive/30 hover:!bg-destructive/10">
                      {actionLoading === vehicle.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />} {t('suspendVehicle')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            previousLabel={t('pagePrevious')}
            nextLabel={t('pageNext')}
            pageLabel={t('pageOf', { current: currentPage, total: totalPages })}
          />
        </div>
      )}

      {/* ONGLET 3 : VÉHICULES SUSPENDUS */}
      {activeTab === 'suspended' && (
        <div className="animate-in fade-in duration-300">
          {suspendedVehicles.length === 0 ? (
            <div className="bg-muted p-8 rounded-xl border border-border text-center text-muted-foreground">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>{t('noSuspendedVehicles')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedSuspendedVehicles.map(vehicle => (
                <div key={vehicle.id} className="bg-red-50 dark:bg-red-900/10 rounded-xl shadow-sm border border-red-200 dark:border-red-900/50 p-5 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-red-900 dark:text-red-400">{vehicle.make} {vehicle.model}</h3>
                    <Ban className="w-5 h-5 text-red-500 dark:text-red-400" />
                  </div>
                  <div className="text-xs text-red-700/70 dark:text-red-400/70 mb-4">
                    {(vehicle.commune?.name || vehicle.province?.name) && (
                      <span className="block text-red-700/50 dark:text-red-400/50">{vehicle.commune?.name || vehicle.province?.name}</span>
                    )}
                    {t('ownerLabel', { name: `${vehicle.owner.firstName} ${vehicle.owner.lastName}` })}
                  </div>
                  <div className="mb-4">
                    <VehicleComplianceSection vehicle={vehicle} />
                  </div>
                  <div className="mt-auto pt-4 border-t border-red-200/50 dark:border-red-900/30">
                    <Button onClick={() => handleUpdateStatusClick(vehicle.id, 'APPROVED_FROM_SUSPENDED')} disabled={actionLoading === vehicle.id} className="w-full !bg-green-600 hover:!bg-green-700">
                      {actionLoading === vehicle.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />} {t('reactivateVehicle')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            previousLabel={t('pagePrevious')}
            nextLabel={t('pageNext')}
            pageLabel={t('pageOf', { current: currentPage, total: totalPages })}
          />
        </div>
      )}

      {/* MODALES */}
      <ConfirmDialog
        open={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={() => confirmDialog.onConfirm()}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={t('confirmDialog.confirmAction')}
        cancelLabel={t('confirmDialog.cancel')}
        tone="primary"
      />

      <Dialog open={alertDialog.isOpen} onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })} size="sm">
        <DialogBody className="pt-6 text-center">
          <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 ${alertDialog.type === 'success' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-destructive/10'}`}>
            {alertDialog.type === 'error' ? <XCircle className="w-8 h-8 text-destructive" /> : <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />}
          </div>
          <h3 className="text-h3 text-foreground mb-2">{alertDialog.title}</h3>
          <p className="text-muted-foreground text-sm mb-6">{alertDialog.message}</p>
          <Button
            onClick={() => setAlertDialog({ ...alertDialog, isOpen: false })}
            variant={alertDialog.type === 'error' ? 'destructive' : 'primary'}
            className="w-full"
          >
            {t('alertDialog.close')}
          </Button>
        </DialogBody>
      </Dialog>

    </div>
  );
}