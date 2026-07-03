// src/app/components/incident/IncidentDetailsDisplay.tsx
import React from 'react';
import type { IncidentReportDetails, IncidentStatus } from '@/app/types/incident';
import { Calendar, User, MapPin, FileText, Image as ImageIcon, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  report: IncidentReportDetails | null;
}

const statusInfo: Record<IncidentStatus, { text: string; icon: React.ReactNode; color: string }> = {
    REPORTED: { text: "Signalé", icon: <AlertCircle className="w-5 h-5" />, color: "text-orange-600 bg-orange-100 border-orange-300 dark:bg-orange-950 dark:border-orange-700 dark:text-orange-300" },
    INVESTIGATING: { text: "Enquête en cours", icon: <RefreshCw className="w-5 h-5 animate-spin" />, color: "text-blue-700 bg-blue-100 border-blue-300 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-300" },
    AWAITING_INFO: { text: "Infos manquantes", icon: <Clock className="w-5 h-5" />, color: "text-yellow-700 bg-yellow-100 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-700 dark:text-yellow-300" },
    RESOLUTION_PROPOSED: { text: "Résolution proposée", icon: <FileText className="w-5 h-5" />, color: "text-purple-700 bg-purple-100 border-purple-300 dark:bg-purple-950 dark:border-purple-700 dark:text-purple-300" },
    RESOLVED: { text: "Résolu", icon: <CheckCircle className="w-5 h-5" />, color: "text-green-700 bg-green-100 border-green-300 dark:bg-green-950 dark:border-green-700 dark:text-green-300" },
    CLOSED_UNRESOLVED: { text: "Clôturé (non résolu)", icon: <AlertCircle className="w-5 h-5" />, color: "text-gray-700 bg-gray-100 border-gray-300 dark:bg-gray-950 dark:border-gray-700 dark:text-gray-300" },
};

const IncidentDetailsDisplay: React.FC<Props> = ({ report }) => {
  if (!report) {
    return <p className="text-muted-foreground">Aucun rapport d&apos;incident trouvé.</p>;
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
  };

  const currentStatusInfo = statusInfo[report.status] || statusInfo.REPORTED;

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
      <div className={`p-4 rounded-lg border-2 ${currentStatusInfo.color}`}>
         <div className="flex items-center">
            <span className="mr-3">{currentStatusInfo.icon}</span>
            <h3 className="text-lg font-semibold">{currentStatusInfo.text}</h3>
         </div>
         <p className="text-sm mt-1 ml-8 opacity-90">Rapport #{report.id} - Signalé le {formatDate(report.reportedAt)}</p>
      </div>

      <section>
        <h4 className="text-md font-semibold mb-3 text-foreground">Détails de l&apos;incident</h4>
        <div className="space-y-3 text-sm">
          <div className="flex items-start">
            <Calendar className="w-4 h-4 mr-3 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div>
              <span className="text-muted-foreground">Date/Heure:</span>
              <p className="font-medium text-foreground">{formatDate(report.incidentTimestamp)}</p>
            </div>
          </div>
           <div className="flex items-start">
            <MapPin className="w-4 h-4 mr-3 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div>
              <span className="text-muted-foreground">Lieu:</span>
              <p className="font-medium text-foreground">{report.location}</p>
            </div>
          </div>
           <div className="flex items-start">
            <User className="w-4 h-4 mr-3 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div>
              <span className="text-muted-foreground">Signalé par:</span>
              <p className="font-medium text-foreground">{report.reporterFirstName || `Utilisateur ID ${report.reporterId}`}</p>
            </div>
          </div>
          <div className="pt-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              <FileText className="inline-block w-3 h-3 mr-1 mb-0.5" /> Description:
            </label>
            <p className="text-sm text-foreground bg-muted p-3 rounded-md whitespace-pre-line">{report.description}</p>
          </div>
        </div>
      </section>

      {report.photoUrls && report.photoUrls.length > 0 && (
        <section>
          <h4 className="text-md font-semibold mb-3 text-foreground flex items-center">
            <ImageIcon className="w-4 h-4 mr-2" /> Photos ({report.photoUrls.length})
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {report.photoUrls.map((url, index) => (
              <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square block">
                <img src={url} alt={`Incident photo ${index + 1}`} className="w-full h-full object-cover rounded-md border border-border hover:opacity-80 transition-opacity" />
              </a>
            ))}
          </div>
        </section>
      )}

       {report.resolutionNotes && (
           <section>
                <h4 className="text-md font-semibold mb-3 text-foreground">Notes de résolution</h4>
                 <p className="text-sm text-foreground bg-muted p-3 rounded-md whitespace-pre-line">{report.resolutionNotes}</p>
                 {report.resolvedAt && <p className="text-xs text-muted-foreground mt-2">Résolu le: {formatDate(report.resolvedAt)}</p>}
           </section>
       )}
    </div>
  );
};

export default IncidentDetailsDisplay;