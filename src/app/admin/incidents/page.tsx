// src/app/admin/incidents/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
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
import AdminPagination from '../components/AdminPagination';
import {
  Badge,
  Button,
  Input,
  StatCard,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  type BadgeVariant,
} from '@/app/components/ui';

const ITEMS_PER_PAGE = 10;

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

const STATUS_BADGE: Record<IncidentReport['status'], BadgeVariant> = {
  REPORTED: 'warning',
  INVESTIGATING: 'info',
  AWAITING_INFO: 'purple',
  RESOLUTION_PROPOSED: 'boost',
  RESOLVED: 'success',
  CLOSED_UNRESOLVED: 'neutral',
};

export default function AdminIncidentsPage() {
  const t = useTranslations('admin.incidents');
  const tStatus = useTranslations('admin.incidents.statusLabels');
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
  const [currentPage, setCurrentPage] = useState(1);

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
        setError(t('loadError'));
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

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm]);

  // ✅ Patch local ciblé : ne remplace que status/resolutionNotes/resolvedAt (les seuls
  // champs que ces deux actions changent) sans re-fetcher tout le tableau des incidents.
  // Le backend calcule resolutionNotes en concaténant l'historique (voir
  // IncidentService.updateIncidentStatus) — on utilise donc la réponse de l'API, pas une
  // reconstruction côté client qui perdrait cet historique.
  const patchIncident = (id: number, changes: Partial<Pick<IncidentReport, 'status' | 'resolutionNotes' | 'resolvedAt'>>) => {
    const apply = (incident: IncidentReport) => (incident.id === id ? { ...incident, ...changes } : incident);
    setIncidents(prev => prev.map(apply));
    setFilteredIncidents(prev => prev.map(apply));
  };

  // Fonction classique de mise à jour du statut
  const handleUpdateStatus = async () => {
    if (!selectedIncident) return;

    setIsUpdating(true);
    try {
      const updated = await apiClient.put(`/api/admin/incidents/${selectedIncident.id}/status`, {
        newStatus,
        notes: adminNotes.trim() || undefined,
      });

      patchIncident(selectedIncident.id, {
        status: updated.status,
        resolutionNotes: updated.resolutionNotes,
        resolvedAt: updated.resolvedAt,
      });
      closeModal();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert(t('modal.updateStatusError'));
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Fonction d'arbitrage financier
  const handleFinancialResolution = async () => {
    if (!selectedIncident) return;
    if (penaltyAmount === '' || penaltyAmount < 0) {
      alert(t('modal.invalidPenaltyAlert'));
      return;
    }

    if (!confirm(`${t('modal.confirmPenaltyPrefix')} ${penaltyAmount} ${t('modal.confirmPenaltySuffix')}`)) {
      return;
    }

    setIsUpdating(true);
    try {
      const updated = await apiClient.post(`/api/admin/incidents/${selectedIncident.id}/resolve-finance`, {
        penaltyAmount: Number(penaltyAmount),
        notes: adminNotes.trim() || t('modal.defaultFinancialNotes'),
      });

      patchIncident(selectedIncident.id, {
        status: updated.status,
        resolutionNotes: updated.resolutionNotes,
        resolvedAt: updated.resolvedAt,
      });
      closeModal();
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert(t('modal.financialResolutionError'));
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

  const totalPages = Math.ceil(filteredIncidents.length / ITEMS_PER_PAGE);
  const paginatedIncidents = filteredIncidents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          {t('pageTitle')}
        </h1>
        <p className="text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {/* Affichage des erreurs si la requête a échoué */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={AlertTriangle} label={t('stats.total')} value={stats.total} tone="info" />
        <StatCard icon={AlertTriangle} label={t('stats.reported')} value={stats.reported} tone="warning" />
        <StatCard icon={AlertTriangle} label={t('stats.investigating')} value={stats.investigating} tone="purple" />
        <StatCard icon={AlertTriangle} label={t('stats.resolved')} value={stats.resolved} tone="success" />
      </div>

      {/* Filtres */}
      <div className="bg-card rounded-lg shadow-sm border border-border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
            <Input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
          >
            <option value="ALL">{t('statusFilter.all')}</option>
            <option value="REPORTED">{t('statusFilter.reported')}</option>
            <option value="INVESTIGATING">{t('statusFilter.investigating')}</option>
            <option value="AWAITING_INFO">{t('statusFilter.awaitingInfo')}</option>
            <option value="RESOLUTION_PROPOSED">{t('statusFilter.resolutionProposed')}</option>
            <option value="RESOLVED">{t('statusFilter.resolved')}</option>
            <option value="CLOSED_UNRESOLVED">{t('statusFilter.closedUnresolved')}</option>
          </select>
        </div>
      </div>

      {/* Liste des incidents */}
      <div className="space-y-4">
        {filteredIncidents.length > 0 ? (
          paginatedIncidents.map((incident) => (
            <div
              key={incident.id}
              className="bg-card rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="flex min-w-0 items-start space-x-4">
                  <div className="shrink-0 p-3 bg-destructive/10 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-foreground">
                      {t('incidentLabel', { id: incident.id, bookingId: incident.bookingId })}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Car className="w-4 h-4 mr-1 shrink-0" />
                        {incident.vehicleMake} {incident.vehicleModel}
                      </span>
                      <span className="flex items-center">
                        <User className="w-4 h-4 mr-1 shrink-0" />
                        {incident.reporterName}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge variant={STATUS_BADGE[incident.status]}>
                  {tStatus(incident.status)}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-start space-x-2 text-sm">
                  <Calendar className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">{t('incidentDateLabel')}</span>
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
                <p className="text-sm text-foreground/90 line-clamp-2">
                  {incident.description}
                </p>
              </div>

              {incident.photoUrls.length > 0 && (
                <div className="flex gap-2 mb-4 overflow-x-auto">
                  {incident.photoUrls.slice(0, 3).map((url, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-border">
                      <Image src={url} alt={`Photo ${idx + 1}`} fill className="object-cover" />
                    </div>
                  ))}
                  {incident.photoUrls.length > 3 && (
                    <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center text-sm font-medium border border-border">
                      +{incident.photoUrls.length - 3}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={() => openModal(incident)}>
                  <Eye className="w-4 h-4" />
                  {t('judgeManage')}
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <Filter className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{t('noIncidents')}</p>
          </div>
        )}
      </div>

      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        previousLabel={t('pagePrevious')}
        nextLabel={t('pageNext')}
        pageLabel={t('pageOf', { current: currentPage, total: totalPages })}
      />

      {/* Modal de détails et d'arbitrage */}
      <Dialog open={isModalOpen && !!selectedIncident} onClose={closeModal} size="lg" dismissible={!isUpdating}>
        {selectedIncident && (
          <>
            <DialogHeader onClose={!isUpdating ? closeModal : undefined} className="border-b border-border pb-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-foreground">{t('modal.detailsTitle', { id: selectedIncident.id })}</h2>
                <Badge variant={STATUS_BADGE[selectedIncident.status]}>
                  {tStatus(selectedIncident.status)}
                </Badge>
              </div>
            </DialogHeader>

            <DialogBody className="space-y-6">
              {/* Onglets de mode d'action */}
              {selectedIncident.status !== 'RESOLVED' && (
                <div className="flex p-1 bg-muted rounded-lg">
                  <button
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${!isFinancialMode ? 'bg-card shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setIsFinancialMode(false)}
                  >
                    {t('modal.simpleTrackingTab')}
                  </button>
                  <button
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center space-x-2 ${isFinancialMode ? 'bg-destructive text-destructive-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setIsFinancialMode(true)}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>{t('modal.financialArbitrationTab')}</span>
                  </button>
                </div>
              )}

              {/* Contenu Informational */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted p-4 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('modal.vehicleLabel')}</label>
                  <p className="mt-1 font-semibold text-foreground">{selectedIncident.vehicleMake} {selectedIncident.vehicleModel}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('modal.reportedByLabel')}</label>
                  <p className="mt-1 font-semibold text-foreground">{selectedIncident.reporterName}</p>
                  <p className="text-sm text-muted-foreground">{selectedIncident.reporterEmail}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">{t('modal.descriptionLabel')}</label>
                <p className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap text-foreground">
                  {selectedIncident.description}
                </p>
              </div>

              {selectedIncident.photoUrls.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">{t('modal.photosLabel')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedIncident.photoUrls.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="relative aspect-square rounded-lg overflow-hidden border border-border hover:opacity-80 transition-opacity">
                        <Image src={url} alt={`Photo ${idx + 1}`} fill className="object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulaire d'action */}
              <div className="border-t border-border pt-6">

                {/* MODE FINANCIER (ARBITRAGE) */}
                {isFinancialMode ? (
                  <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20 mb-4">
                    <h4 className="text-destructive font-bold flex items-center mb-2">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      {t('modal.deductionTitle')}
                    </h4>
                    <p className="text-sm text-destructive/90 mb-4">
                      {t('modal.deductionDesc')}
                    </p>

                    <div className="mb-4">
                      <label className="text-sm font-bold text-foreground block mb-2">{t('modal.amountLabel')}</label>
                      <Input
                        type="number"
                        min="0"
                        max="150000"
                        value={penaltyAmount}
                        onChange={(e) => setPenaltyAmount(Number(e.target.value))}
                        placeholder={t('modal.amountPlaceholder')}
                        invalid
                      />
                    </div>
                  </div>
                ) : (
                  /* MODE CLASSIQUE */
                  <div className="mb-4">
                    <label className="text-sm font-medium text-muted-foreground block mb-2">{t('modal.changeStatusLabel')}</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as IncidentReport['status'])}
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
                      disabled={selectedIncident.status === 'RESOLVED'}
                    >
                      <option value="REPORTED">{tStatus('REPORTED')}</option>
                      <option value="INVESTIGATING">{tStatus('INVESTIGATING')}</option>
                      <option value="AWAITING_INFO">{tStatus('AWAITING_INFO')}</option>
                      <option value="RESOLUTION_PROPOSED">{tStatus('RESOLUTION_PROPOSED')}</option>
                      <option value="CLOSED_UNRESOLVED">{tStatus('CLOSED_UNRESOLVED')}</option>
                    </select>
                  </div>
                )}

                <label className="text-sm font-medium text-muted-foreground block mb-2">{t('modal.notesLabel')}</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={t('modal.notesPlaceholder')}
                  rows={4}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground resize-none"
                  disabled={selectedIncident.status === 'RESOLVED'}
                />

                {selectedIncident.resolutionNotes && (
                  <div className="mt-4">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('modal.historyLabel')}</label>
                    <div className="mt-1 p-3 bg-muted rounded-lg border border-border text-sm whitespace-pre-wrap text-muted-foreground">
                      {selectedIncident.resolutionNotes}
                    </div>
                  </div>
                )}
              </div>
            </DialogBody>

            <DialogFooter className="border-t border-border bg-muted/50">
              <Button variant="outline" onClick={closeModal} disabled={isUpdating}>
                {t('modal.cancel')}
              </Button>

              {selectedIncident.status !== 'RESOLVED' && (
                <Button
                  onClick={isFinancialMode ? handleFinancialResolution : handleUpdateStatus}
                  disabled={isUpdating || (isFinancialMode && penaltyAmount === '')}
                  variant={isFinancialMode ? 'destructive' : 'primary'}
                >
                  {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isFinancialMode ? t('modal.applyDeduction') : t('modal.updateStatus')}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  );
}