// src/app/components/inspection/InspectionDetailsDisplay.tsx
import React from 'react';
import { useTranslations } from 'next-intl';
import { InspectionDetails } from '@/types/inspection';
import { Calendar, Gauge, Fuel, Image as ImageIcon, FileText, CheckCircle, Clock, MapPin, ExternalLink } from 'lucide-react';

interface Props {
  details: InspectionDetails | null;
}

const InspectionDetailsDisplay: React.FC<Props> = ({ details }) => {
  const t = useTranslations('inspection.details');

  if (!details) {
    return <p className="text-muted-foreground">{t('noDetails')}</p>;
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('notAvailable');
    return new Date(dateString).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="space-y-8">
      {/* Check-in Details */}
      {details.checkInId ? (
        <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4 flex items-center text-green-600">
            <CheckCircle className="w-5 h-5 mr-2" /> {t('checkInDoneTitle')}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">{t('dateLabel')}</span>
              <span className="ml-2 font-medium text-foreground">{formatDate(details.checkInTimestamp)}</span>
            </div>
            <div className="flex items-center text-sm">
              <Gauge className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">{t('mileageStartLabel')}</span>
              <span className="ml-2 font-medium text-foreground">{details.mileageStart?.toLocaleString() ?? t('notAvailable')} km</span>
            </div>
            <div className="flex items-center text-sm">
              <Fuel className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">{t('fuelStartLabel')}</span>
              <span className="ml-2 font-medium text-foreground">{details.fuelLevelStart || t('notAvailable')}</span>
            </div>

            {/* Section Localisation de Départ */}
            {details.latitudeStart && details.longitudeStart && (
              <div className="mt-6 border border-border rounded-xl p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-primary" />
                    {t('pickupLocationTitle')}
                  </h3>

                  {/* Bouton pour ouvrir l'itinéraire exact dans Google Maps */}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${details.latitudeStart},${details.longitudeStart}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    {t('openInMaps')}
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>

                {/* Affichage des coordonnées textuelles */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-background p-3 rounded-lg border border-border">
                  <div>
                    <span className="block text-muted-foreground font-medium">{t('latitudeLabel')}</span>
                    <span className="font-mono text-foreground">{details.latitudeStart.toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground font-medium">{t('longitudeLabel')}</span>
                    <span className="font-mono text-foreground">{details.longitudeStart.toFixed(6)}</span>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground mt-2 italic">
                  {t('gpsDisclaimerStart')}
                </p>
              </div>
            )}

            {details.notesStart && (
              <div className="pt-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                 <FileText className="inline-block w-3 h-3 mr-1 mb-0.5" /> {t('notesStartLabel')}
                </label>
                <p className="text-sm text-foreground bg-muted p-3 rounded-md whitespace-pre-line">{details.notesStart}</p>
              </div>
            )}
            {details.photoUrlsStart && details.photoUrlsStart.length > 0 && (
              <div className="pt-2">
                 <label className="block text-xs font-medium text-muted-foreground mb-2">
                    <ImageIcon className="inline-block w-3 h-3 mr-1 mb-0.5" /> {t('photosStartLabel', { count: details.photoUrlsStart.length })}
                 </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {details.photoUrlsStart.map((url, index) => (
                    <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Check-in ${index + 1}`} className="w-full h-full object-cover rounded-md border border-border hover:opacity-80 transition-opacity" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      ) : (
          <div className="text-center py-6 bg-muted rounded-lg">
             <Clock className="w-6 h-6 mx-auto mb-2 text-muted-foreground"/>
             <p className="text-muted-foreground">{t('checkInNotDone')}</p>
          </div>
      )}

      {/* Check-out Details */}
      {details.checkOutId ? (
        <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4 flex items-center text-green-600">
            <CheckCircle className="w-5 h-5 mr-2" /> {t('checkOutDoneTitle')}
          </h3>
          <div className="space-y-3">
             <div className="flex items-center text-sm">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">{t('dateLabel')}</span>
              <span className="ml-2 font-medium text-foreground">{formatDate(details.checkOutTimestamp)}</span>
            </div>
            <div className="flex items-center text-sm">
              <Gauge className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">{t('mileageEndLabel')}</span>
              <span className="ml-2 font-medium text-foreground">{details.mileageEnd?.toLocaleString() ?? t('notAvailable')} km</span>
            </div>
             {details.mileageStart !== undefined && details.mileageEnd !== undefined && (
                 <div className="flex items-center text-sm font-semibold text-primary">
                      <Gauge className="w-4 h-4 mr-2" />
                      <span>{t('distanceLabel')}</span>
                       <span className="ml-2">{(details.mileageEnd - details.mileageStart).toLocaleString()} km</span>
                 </div>
             )}
            <div className="flex items-center text-sm">
              <Fuel className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">{t('fuelEndLabel')}</span>
              <span className="ml-2 font-medium text-foreground">{details.fuelLevelEnd || t('notAvailable')}</span>
            </div>

            {/* Section Localisation de Retour */}
            {details.latitudeEnd && details.longitudeEnd && (
              <div className="mt-6 border border-border rounded-xl p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-primary" />
                    {t('returnLocationTitle')}
                  </h3>

                  {/* Bouton pour ouvrir l'itinéraire exact dans Google Maps */}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${details.latitudeEnd},${details.longitudeEnd}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                  >
                    {t('openInMaps')}
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>

                {/* Affichage des coordonnées textuelles */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-background p-3 rounded-lg border border-border">
                  <div>
                    <span className="block text-muted-foreground font-medium">{t('latitudeLabel')}</span>
                    <span className="font-mono text-foreground">{details.latitudeEnd.toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground font-medium">{t('longitudeLabel')}</span>
                    <span className="font-mono text-foreground">{details.longitudeEnd.toFixed(6)}</span>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground mt-2 italic">
                  {t('gpsDisclaimerEnd')}
                </p>
              </div>
            )}

            {details.notesEnd && (
              <div className="pt-2">
                 <label className="block text-xs font-medium text-muted-foreground mb-1">
                    <FileText className="inline-block w-3 h-3 mr-1 mb-0.5" /> {t('notesEndLabel')}
                 </label>
                <p className="text-sm text-foreground bg-muted p-3 rounded-md whitespace-pre-line">{details.notesEnd}</p>
              </div>
            )}
            {details.photoUrlsEnd && details.photoUrlsEnd.length > 0 && (
              <div className="pt-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-2">
                    <ImageIcon className="inline-block w-3 h-3 mr-1 mb-0.5" /> {t('photosEndLabel', { count: details.photoUrlsEnd.length })}
                 </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {details.photoUrlsEnd.map((url, index) => (
                    <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="aspect-square block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Check-out ${index + 1}`} className="w-full h-full object-cover rounded-md border border-border hover:opacity-80 transition-opacity" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      ) : (
          details.checkInId && ( // Only show if check-in was done
             <div className="text-center py-6 bg-muted rounded-lg">
                 <Clock className="w-6 h-6 mx-auto mb-2 text-muted-foreground"/>
                 <p className="text-muted-foreground">{t('checkOutNotDone')}</p>
             </div>
          )
      )}
    </div>
  );
};

export default InspectionDetailsDisplay;