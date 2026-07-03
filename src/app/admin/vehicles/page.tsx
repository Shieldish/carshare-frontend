// src/app/admin/vehicles/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { CheckCircle, XCircle, FileText, Car, ShieldAlert, ExternalLink, Loader2, Ban, PlayCircle, CheckCircle2, Flame } from 'lucide-react';

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
  owner: Owner;
  isBoosted?: boolean; // ✅ NOUVEAU
}

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'suspended'>('pending');

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
      setError('Impossible de charger les véhicules.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleUpdateStatusClick = (vehicleId: number, newStatus: string) => {
    let title = "Confirmation";
    let message = "Êtes-vous sûr de vouloir changer le statut de ce véhicule ?";
    let apiStatus = newStatus;

    if (newStatus === 'SUSPENDED_BY_ADMIN') {
      title = "Suspendre le véhicule";
      message = "🚨 ATTENTION : Vous êtes sur le point de SUSPENDRE ce véhicule. Il sera bloqué et retiré de la plateforme. Confirmez-vous ?";
    } else if (newStatus === 'APPROVED_FROM_SUSPENDED') {
      title = "Réactiver le véhicule";
      message = "Le véhicule sera réactivé et retrouvera son statut validé. Le propriétaire devra le rendre public lui-même. Confirmez-vous ?";
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
        title: "Action réussie",
        message: "Le statut du véhicule a été mis à jour avec succès.",
        type: "success"
      });
    } catch (err: unknown) {
      console.error('Erreur de mise à jour:', err);
      const serverMessage = err instanceof Error ? err.message : 'Erreur inconnue du serveur';
      
      setAlertDialog({
        isOpen: true,
        title: "Opération refusée",
        message: `Une erreur est survenue : ${serverMessage}`,
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
      title: "Activer la mise en vedette",
      message: `Confirmez-vous la réception du paiement pour booster le véhicule "${vehicle.make} ${vehicle.model}" pendant 24h ?`,
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
        title: "Boost activé !",
        message: "Le véhicule a été mis en vedette pour 24h avec succès.",
        type: "success"
      });
    } catch (err: unknown) {
      console.error('Erreur boost:', err);
      const serverMessage = err instanceof Error ? err.message : 'Erreur inconnue du serveur';
      setAlertDialog({
        isOpen: true,
        title: "Erreur",
        message: `Impossible d'activer le boost : ${serverMessage}`,
        type: "error"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const pendingVehicles = vehicles.filter(v => v.status === 'PENDING_APPROVAL');
  const activeVehicles = vehicles.filter(v => v.status === 'APPROVED' || v.status === 'AVAILABLE' || v.status === 'RENTED');
  const suspendedVehicles = vehicles.filter(v => v.status === 'SUSPENDED_BY_ADMIN');

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg text-gray-600 dark:text-gray-300">Chargement des véhicules...</span>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Car className="w-8 h-8 text-primary" />
            Gestion des Véhicules
          </h1>
          <p className="text-muted-foreground mt-2">
            Administrez le parc automobile, validez les documents et gérez la sécurité.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200 flex items-center gap-2">
          <XCircle className="w-5 h-5" /> {error}
        </div>
      )}

      {/* SYSTÈME D'ONGLETS */}
      <div className="flex space-x-2 mb-8 border-b border-gray-200 dark:border-gray-700 pb-px">
        <button onClick={() => setActiveTab('pending')} className={`flex items-center gap-2 px-6 py-3 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'pending' ? 'bg-white dark:bg-gray-800 text-primary border-t border-l border-r border-gray-200 dark:border-gray-700 mb-[-1px]' : 'text-gray-500 hover:text-gray-700 bg-gray-50 dark:bg-gray-900/50'}`}>
          <ShieldAlert className="w-4 h-4" /> En attente ({pendingVehicles.length})
        </button>
        <button onClick={() => setActiveTab('active')} className={`flex items-center gap-2 px-6 py-3 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'active' ? 'bg-white dark:bg-gray-800 text-primary border-t border-l border-r border-gray-200 dark:border-gray-700 mb-[-1px]' : 'text-gray-500 hover:text-gray-700 bg-gray-50 dark:bg-gray-900/50'}`}>
          <CheckCircle className="w-4 h-4" /> Actifs ({activeVehicles.length})
        </button>
        <button onClick={() => setActiveTab('suspended')} className={`flex items-center gap-2 px-6 py-3 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'suspended' ? 'bg-white dark:bg-gray-800 text-primary border-t border-l border-r border-gray-200 dark:border-gray-700 mb-[-1px]' : 'text-gray-500 hover:text-gray-700 bg-gray-50 dark:bg-gray-900/50'}`}>
          <Ban className="w-4 h-4" /> Suspendus ({suspendedVehicles.length})
        </button>
      </div>

      {/* ONGLET 1 : EN ATTENTE */}
      {activeTab === 'pending' && (
        <div className="animate-in fade-in duration-300">
          {pendingVehicles.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 text-center text-gray-500">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Aucun véhicule en attente de validation. Tout est à jour !</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingVehicles.map(vehicle => (
                <div key={vehicle.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-amber-200 dark:border-amber-800/50 p-5 flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{vehicle.make} {vehicle.model}</h3>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-1">
                      {vehicle.owner.firstName} {vehicle.owner.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{vehicle.owner.email} | {vehicle.owner.phoneNumber || 'Pas de numéro'}</p>
                  </div>

                  <div className="space-y-3 flex-grow mb-6">
                    <p className="text-sm font-semibold">Documents à vérifier :</p>
                    {vehicle.registrationDocumentUrl ? (
                      <a href={vehicle.registrationDocumentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200">
                        <span className="flex items-center gap-2"><FileText className="w-5 h-5" /> Carte Rose</span><ExternalLink className="w-4 h-4" />
                      </a>
                    ) : <p className="text-sm text-red-500 flex items-center gap-2"><XCircle className="w-4 h-4" /> Carte Rose manquante</p>}
                    
                    {vehicle.insuranceDocumentUrl ? (
                      <a href={vehicle.insuranceDocumentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200">
                        <span className="flex items-center gap-2"><FileText className="w-5 h-5" /> Assurance</span><ExternalLink className="w-4 h-4" />
                      </a>
                    ) : <p className="text-sm text-red-500 flex items-center gap-2"><XCircle className="w-4 h-4" /> Assurance manquante</p>}

                    {vehicle.technicalControlDocumentUrl ? (
                      <a href={vehicle.technicalControlDocumentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200">
                        <span className="flex items-center gap-2"><FileText className="w-5 h-5" /> Contrôle Tech.</span><ExternalLink className="w-4 h-4" />
                      </a>
                    ) : <p className="text-sm text-red-500 flex items-center gap-2"><XCircle className="w-4 h-4" /> Contrôle Tech. manquant</p>}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button onClick={() => handleUpdateStatusClick(vehicle.id, 'APPROVED')} disabled={actionLoading === vehicle.id || !vehicle.registrationDocumentUrl || !vehicle.insuranceDocumentUrl || !vehicle.technicalControlDocumentUrl} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                      {actionLoading === vehicle.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />} Approuver
                    </button>
                    <button onClick={() => handleUpdateStatusClick(vehicle.id, 'REJECTED')} disabled={actionLoading === vehicle.id} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2">
                      <XCircle className="w-5 h-5" /> Rejeter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ONGLET 2 : VÉHICULES ACTIFS */}
      {activeTab === 'active' && (
        <div className="animate-in fade-in duration-300">
          {activeVehicles.length === 0 ? (
            <p className="text-gray-500 italic">Aucun véhicule actif pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeVehicles.map(vehicle => (
                <div key={vehicle.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold">{vehicle.make} {vehicle.model}</h3>
                    <div className="flex items-center gap-2">
                      {vehicle.isBoosted && (
                        <span className="text-xs bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-1 rounded-full font-bold flex items-center gap-1">
                          <Flame className="w-3 h-3" /> Boosté
                        </span>
                      )}
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">{vehicle.status}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-4">
                    Propriétaire : {vehicle.owner.firstName} {vehicle.owner.lastName}
                  </div>
                  <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col gap-2">
                    {/* ✅ NOUVEAU : Bouton Boost */}
                    <button
                      onClick={() => handleBoostClick(vehicle)}
                      disabled={actionLoading === vehicle.id || vehicle.isBoosted}
                      className="w-full bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border border-orange-200 hover:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={vehicle.isBoosted ? "Ce véhicule est déjà en vedette" : "Valider paiement → +24h de Boost"}
                    >
                      {actionLoading === vehicle.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
                      {vehicle.isBoosted ? 'Déjà en vedette' : 'Mettre en vedette (+24h)'}
                    </button>
                    <button onClick={() => handleUpdateStatusClick(vehicle.id, 'SUSPENDED_BY_ADMIN')} disabled={actionLoading === vehicle.id} className="w-full bg-red-50 text-red-600 hover:bg-red-600 hover:text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border border-red-200 hover:border-red-600">
                      {actionLoading === vehicle.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />} Suspendre ce véhicule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ONGLET 3 : VÉHICULES SUSPENDUS */}
      {activeTab === 'suspended' && (
        <div className="animate-in fade-in duration-300">
          {suspendedVehicles.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 text-center text-gray-500">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Aucun véhicule n&apos;est actuellement suspendu.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suspendedVehicles.map(vehicle => (
                <div key={vehicle.id} className="bg-red-50 dark:bg-red-900/10 rounded-xl shadow-sm border border-red-200 p-5 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-red-900 dark:text-red-400">{vehicle.make} {vehicle.model}</h3>
                    <Ban className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="text-xs text-red-700/70 mb-4">
                    Propriétaire : {vehicle.owner.firstName} {vehicle.owner.lastName}
                  </div>
                  <div className="mt-auto pt-4 border-t border-red-200/50">
                    <button onClick={() => handleUpdateStatusClick(vehicle.id, 'APPROVED_FROM_SUSPENDED')} disabled={actionLoading === vehicle.id} className="w-full bg-white dark:bg-gray-800 text-green-600 hover:bg-green-600 hover:text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border border-green-200 hover:border-green-600 shadow-sm">
                      {actionLoading === vehicle.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />} Réactiver le véhicule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODALES */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl max-w-md w-full border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                <ShieldAlert className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{confirmDialog.title}</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                Annuler
              </button>
              <button onClick={() => confirmDialog.onConfirm()} className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors shadow-sm">
                Confirmer l&apos;action
              </button>
            </div>
          </div>
        </div>
      )}

      {alertDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl max-w-sm w-full border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200 text-center">
            <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4 ${alertDialog.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
              {alertDialog.type === 'error' ? <XCircle className="w-8 h-8 text-red-600" /> : <CheckCircle2 className="w-8 h-8 text-green-600" />}
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{alertDialog.title}</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">{alertDialog.message}</p>
            <button onClick={() => setAlertDialog({ ...alertDialog, isOpen: false })} className={`w-full px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm ${alertDialog.type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-800 hover:bg-gray-900'}`}>
              D&apos;accord, fermer
            </button>
          </div>
        </div>
      )}

    </div>
  );
}