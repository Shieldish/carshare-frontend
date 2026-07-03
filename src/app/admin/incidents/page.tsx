// src/app/admin/incidents/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { 
  AlertTriangle, 
  Loader2, 
  Calendar, 
  MapPin, 
  User, 
  Car,
  Eye,
  Filter,
  Search,
  Banknote
} from 'lucide-react';
import Image from 'next/image';

interface IncidentReport {
  id: number;
  bookingId: number;
  reporterId: number;
  reporterName: string;
  reporterEmail: string;
  vehicleMake: string;
  vehicleModel: string;
  incidentTimestamp: string;
  description: string;
  location?: string;
  photoUrls: string[];
  status: 'REPORTED' | 'INVESTIGATING' | 'AWAITING_INFO' | 'RESOLUTION_PROPOSED' | 'RESOLVED' | 'CLOSED_UNRESOLVED';
  resolutionNotes?: string;
  reportedAt: string;
  resolvedAt?: string;
}

const STATUS_COLORS = {
  REPORTED: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400',
  INVESTIGATING: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400',
  AWAITING_INFO: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400',
  RESOLUTION_PROPOSED: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400',
  RESOLVED: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400',
  CLOSED_UNRESOLVED: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300',
};

const STATUS_LABELS = {
  REPORTED: 'Signalé',
  INVESTIGATING: 'En cours d\'examen',
  AWAITING_INFO: 'En attente d\'informations',
  RESOLUTION_PROPOSED: 'Résolution proposée',
  RESOLVED: 'Résolu',
  CLOSED_UNRESOLVED: 'Fermé non résolu',
};

export default function AdminIncidentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<IncidentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour le Modal
  const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // États de formulaire
  const [newStatus, setNewStatus] = useState<IncidentReport['status']>('REPORTED');
  const [adminNotes, setAdminNotes] = useState('');
  
  // États pour l'arbitrage financier
  const [isFinancialMode, setIsFinancialMode] = useState(false);
  const [penaltyAmount, setPenaltyAmount] = useState<number | ''>('');

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const fetchIncidents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.get('/api/admin/incidents/all');
      setIncidents(data || []);
      setFilteredIncidents(data || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Impossible de charger les incidents');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchIncidents();
    }
  }, [user]);

  // Filtrage
  useEffect(() => {
    let result = [...incidents];
    
    if (filterStatus !== 'ALL') {
      result = result.filter(i => i.status === filterStatus);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(i => 
        i.vehicleMake.toLowerCase().includes(term) ||
        i.vehicleModel.toLowerCase().includes(term) ||
        i.reporterName.toLowerCase().includes(term) ||
        i.description.toLowerCase().includes(term)
      );
    }
    
    setFilteredIncidents(result);
  }, [filterStatus, searchTerm, incidents]);

  // Fonction classique de mise à jour du statut
  const handleUpdateStatus = async () => {
    if (!selectedIncident) return;
    
    setIsUpdating(true);
    try {
      await apiClient.put(`/api/admin/incidents/${selectedIncident.id}/status`, {
        newStatus,
        notes: adminNotes.trim() || undefined,
      });
      
      await fetchIncidents();
      closeModal();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Erreur lors de la mise à jour');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Fonction d'arbitrage financier
  const handleFinancialResolution = async () => {
    if (!selectedIncident) return;
    if (penaltyAmount === '' || penaltyAmount < 0) {
      alert('Veuillez entrer un montant de pénalité valide.');
      return;
    }

    if (!confirm(`Confirmez-vous le prélèvement de ${penaltyAmount} FBU sur la caution du locataire pour dédommager le propriétaire ? Cette action est irréversible.`)) {
      return;
    }

    setIsUpdating(true);
    try {
      await apiClient.post(`/api/admin/incidents/${selectedIncident.id}/resolve-finance`, {
        penaltyAmount: Number(penaltyAmount),
        notes: adminNotes.trim() || 'Résolution financière appliquée suite à arbitrage.',
      });
      
      await fetchIncidents();
      closeModal();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Erreur lors de la résolution financière');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const openModal = (incident: IncidentReport) => {
    setSelectedIncident(incident);
    setNewStatus(incident.status);
    setAdminNotes('');
    setPenaltyAmount('');
    setIsFinancialMode(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedIncident(null);
    setAdminNotes('');
    setPenaltyAmount('');
    setIsFinancialMode(false);
  };

  const stats = {
    total: incidents.length,
    reported: incidents.filter(i => i.status === 'REPORTED').length,
    investigating: incidents.filter(i => i.status === 'INVESTIGATING').length,
    resolved: incidents.filter(i => i.status === 'RESOLVED').length,
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Gestion des Incidents & Arbitrage
        </h1>
        <p className="text-muted-foreground">
          Gérez les litiges et décidez des prélèvements sur la caution
        </p>
      </div>

      {/* Affichage des erreurs si la requête a échoué */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total</div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">{stats.total}</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Signalés</div>
          <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mt-1">{stats.reported}</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">En examen</div>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">{stats.investigating}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-sm text-green-600 dark:text-green-400 font-medium">Résolus</div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">{stats.resolved}</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-background"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="REPORTED">Signalés</option>
            <option value="INVESTIGATING">En cours d&apos;examen</option>
            <option value="AWAITING_INFO">En attente d&apos;informations</option>
            <option value="RESOLUTION_PROPOSED">Résolution proposée</option>
            <option value="RESOLVED">Résolus</option>
            <option value="CLOSED_UNRESOLVED">Fermés non résolus</option>
          </select>
        </div>
      </div>

      {/* Liste des incidents */}
      <div className="space-y-4">
        {filteredIncidents.length > 0 ? (
          filteredIncidents.map((incident) => (
            <div
              key={incident.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Incident #{incident.id} (Réservation #{incident.bookingId})
                    </h3>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Car className="w-4 h-4 mr-1" />
                        {incident.vehicleMake} {incident.vehicleModel}
                      </span>
                      <span className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {incident.reporterName}
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[incident.status]}`}>
                  {STATUS_LABELS[incident.status]}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-start space-x-2 text-sm">
                  <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">Date de l&apos;incident : </span>
                    <span className="font-medium">
                      {new Date(incident.incidentTimestamp).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
                {incident.location && (
                  <div className="flex items-start space-x-2 text-sm">
                    <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <span className="font-medium">{incident.location}</span>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                  {incident.description}
                </p>
              </div>

              {incident.photoUrls.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto">
                  {incident.photoUrls.slice(0, 3).map((url, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border">
                      <Image src={url} alt={`Photo ${idx + 1}`} fill className="object-cover" />
                    </div>
                  ))}
                  {incident.photoUrls.length > 3 && (
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-sm font-medium border">
                      +{incident.photoUrls.length - 3}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => openModal(incident)}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>Juger / Gérer</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Aucun incident trouvé</p>
          </div>
        )}
      </div>

      {/* Modal de détails et d'arbitrage */}
      {isModalOpen && selectedIncident && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-2xl font-bold">Détails de l&apos;incident #{selectedIncident.id}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[selectedIncident.status]}`}>
                  {STATUS_LABELS[selectedIncident.status]}
              </span>
            </div>

            <div className="p-6 space-y-6">
              {/* Onglets de mode d'action */}
              {selectedIncident.status !== 'RESOLVED' && (
                <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <button 
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${!isFinancialMode ? 'bg-white dark:bg-gray-800 shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    onClick={() => setIsFinancialMode(false)}
                  >
                    Suivi Simple
                  </button>
                  <button 
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center space-x-2 ${isFinancialMode ? 'bg-red-500 text-white shadow' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    onClick={() => setIsFinancialMode(true)}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Arbitrage Financier</span>
                  </button>
                </div>
              )}

              {/* Contenu Informational */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Véhicule</label>
                  <p className="mt-1 font-semibold">{selectedIncident.vehicleMake} {selectedIncident.vehicleModel}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Signalé par</label>
                  <p className="mt-1 font-semibold">{selectedIncident.reporterName}</p>
                  <p className="text-sm text-muted-foreground">{selectedIncident.reporterEmail}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">Description des faits</label>
                <p className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm whitespace-pre-wrap">
                  {selectedIncident.description}
                </p>
              </div>

              {selectedIncident.photoUrls.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Preuves photographiques</label>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedIncident.photoUrls.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="relative aspect-square rounded-lg overflow-hidden border hover:opacity-80 transition-opacity">
                        <Image src={url} alt={`Photo ${idx + 1}`} fill className="object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulaire d'action */}
              <div className="border-t pt-6">
                
                {/* MODE FINANCIER (ARBITRAGE) */}
                {isFinancialMode ? (
                  <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-200 dark:border-red-800 mb-4">
                    <h4 className="text-red-800 dark:text-red-400 font-bold flex items-center mb-2">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      Prélèvement sur la Caution (Max 150 000 FBU)
                    </h4>
                    <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                      Cette action va clore l&apos;incident, libérer l&apos;argent de la location au propriétaire, et lui ajouter ce montant prélevé sur la caution du locataire.
                    </p>
                    
                    <div className="mb-4">
                      <label className="text-sm font-bold text-gray-900 dark:text-white block mb-2">Montant à prélever (FBU)</label>
                      <input
                        type="number"
                        min="0"
                        max="150000"
                        value={penaltyAmount}
                        onChange={(e) => setPenaltyAmount(Number(e.target.value))}
                        placeholder="Ex: 50000"
                        className="w-full px-4 py-2 border border-red-300 rounded-lg bg-white dark:bg-gray-800 focus:ring-red-500"
                      />
                    </div>
                  </div>
                ) : (
                  /* MODE CLASSIQUE */
                  <div className="mb-4">
                    <label className="text-sm font-medium text-muted-foreground block mb-2">Changer le statut (Sans mouvement d&apos;argent)</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as IncidentReport['status'])}
                      className="w-full px-4 py-2 border rounded-lg bg-background"
                      disabled={selectedIncident.status === 'RESOLVED'}
                    >
                      <option value="REPORTED">Signalé</option>
                      <option value="INVESTIGATING">En cours d&apos;examen</option>
                      <option value="AWAITING_INFO">En attente d&apos;informations</option>
                      <option value="RESOLUTION_PROPOSED">Résolution proposée</option>
                      <option value="CLOSED_UNRESOLVED">Fermé non résolu</option>
                    </select>
                  </div>
                )}

                <label className="text-sm font-medium text-muted-foreground block mb-2">Notes & Décision de l&apos;Admin</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Expliquez la décision prise pour que le propriétaire et le locataire comprennent..."
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg bg-background resize-none"
                  disabled={selectedIncident.status === 'RESOLVED'}
                />
                
                {selectedIncident.resolutionNotes && (
                  <div className="mt-4">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Historique des décisions</label>
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border text-sm whitespace-pre-wrap text-gray-600 dark:text-gray-400">
                      {selectedIncident.resolutionNotes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3 rounded-b-lg">
              <button
                onClick={closeModal}
                disabled={isUpdating}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Annuler
              </button>
              
              {selectedIncident.status !== 'RESOLVED' && (
                <button
                  onClick={isFinancialMode ? handleFinancialResolution : handleUpdateStatus}
                  disabled={isUpdating || (isFinancialMode && penaltyAmount === '')}
                  className={`flex items-center space-x-2 px-6 py-2 text-white rounded-lg transition-colors font-medium shadow-sm disabled:opacity-50 ${isFinancialMode ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'}`}
                >
                  {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isFinancialMode ? 'Appliquer le prélèvement' : 'Mettre à jour le statut'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}