// src/app/components/inspection/CheckOutForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Fuel, Gauge, Image as ImageIcon, FileText, Send, Loader2, AlertCircle, MapPin } from 'lucide-react';
import ImageUploader from './ImageUploader';
import Toast from '@/app/components/common/Toast';
import { apiClient } from '@/lib/apiClient';
import type { CheckOutData, FuelLevel } from '@/types/inspection';

interface CheckOutFormProps {
  bookingId: number;
  onCheckOutSuccess: (record: unknown) => void;
  // Optionnel: Passer le kilométrage de départ pour validation
  mileageStart?: number;
}

const fuelLevels: FuelLevel[] = ["FULL", "3/4", "1/2", "1/4", "EMPTY"];

const CheckOutForm: React.FC<CheckOutFormProps> = ({ bookingId, onCheckOutSuccess, mileageStart }) => {
  const t = useTranslations('inspection.checkOut');
  const [mileageEnd, setMileageEnd] = useState<number | null>(null);
  const [fuelLevelEnd, setFuelLevelEnd] = useState<FuelLevel>("");
  const [photoUrlsEnd, setPhotoUrlsEnd] = useState<string[]>([]);
  const [notesEnd, setNotesEnd] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ NOUVEAU : États pour la géolocalisation GPS
  const [latitudeEnd, setLatitudeEnd] = useState<number | null>(null);
  const [longitudeEnd, setLongitudeEnd] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'success' | 'error'>('loading');

  // ✅ Récupération automatique de la position GPS au chargement du composant
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitudeEnd(position.coords.latitude);
          setLongitudeEnd(position.coords.longitude);
          setLocationStatus('success');
          console.log("📍 GPS capturé :", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          console.error("❌ Erreur GPS:", error);
          setLocationStatus('error');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationStatus('error');
    }
  }, []);

  // Auto-masquage des messages d'erreur après 5 secondes
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // ✅ Validation stricte du formulaire - Tous les champs requis doivent être remplis
  const isFormValid = 
    mileageEnd !== null && 
    mileageEnd >= (mileageStart ?? 0) && 
    fuelLevelEnd !== "" && 
    photoUrlsEnd.length > 0 &&
    latitudeEnd !== null &&
    longitudeEnd !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Détecter précisément ce qui manque
    const missingFields = [];
    if (mileageEnd === null) missingFields.push(t('fieldMileage'));
    if (fuelLevelEnd === "") missingFields.push(t('fieldFuel'));
    if (photoUrlsEnd.length === 0) missingFields.push(t('fieldPhotos'));
    if (latitudeEnd === null || longitudeEnd === null) missingFields.push(t('fieldGps')); // ✅ NOUVEAU

    if (missingFields.length > 0) {
      // Le Toast va annoncer exactement les champs oubliés !
      setError(`${t('missingFieldsPrefix')}${missingFields.join(", ")}`);
      return;
    }

    // 2. Vérification stricte du kilométrage
    if (mileageStart !== undefined && mileageEnd !== null && mileageEnd < mileageStart) {
      setError(t('mileageBelowStartError', { end: mileageEnd, start: mileageStart }));
      return;
    }

    // 3. Si on passe ici, tout est parfait !
    setIsLoading(true);

    // ✅ NOUVEAU : On ajoute les coordonnées GPS dans l'objet final
    const checkOutData: CheckOutData = {
      mileageEnd,
      fuelLevelEnd,
      photoUrlsEnd,
      notesEnd: notesEnd || undefined,
      latitudeEnd: latitudeEnd!,   // On sait que ce n'est pas null grâce à la validation
      longitudeEnd: longitudeEnd!,  // On sait que ce n'est pas null grâce à la validation
    };

    try {
      const result = await apiClient.performCheckOut(bookingId, checkOutData);
      onCheckOutSuccess(result);
    } catch (err: unknown) {
      console.error("Check-out error:", err);
      const message = err instanceof Error ? err.message : t('genericError');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔍 DEBUG: Affiche l'état exact de chaque condition du formulaire dans la console
  console.log("État du formulaire CheckOut :", {
    "1. Kilométrage saisi ?": mileageEnd !== null,
    "2. Kilométrage >= départ ?": mileageEnd !== null && mileageEnd >= (mileageStart ?? 0),
    "   → mileageEnd": mileageEnd,
    "   → mileageStart": mileageStart,
    "3. Carburant sélectionné ?": fuelLevelEnd !== "",
    "   → fuelLevelEnd": fuelLevelEnd,
    "4. Photo uploadée ?": photoUrlsEnd.length > 0,
    "   → photoUrlsEnd.length": photoUrlsEnd.length,
    "5. GPS capturé ?": latitudeEnd !== null && longitudeEnd !== null, // ✅ NOUVEAU
    "   → latitudeEnd": latitudeEnd,
    "   → longitudeEnd": longitudeEnd,
    "✅ BOUTON ACTIVÉ ?": isFormValid,
  });

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Affichage des erreurs - Inline pour contextualité immédiate */}
        {error && (
          <div 
            className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-md flex items-start" 
            role="alert"
          >
            <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          )}

        {/* Kilométrage au retour */}
        <div>
          <label htmlFor="mileageEnd" className="block text-sm font-medium text-foreground mb-1">
            <Gauge className="inline-block w-4 h-4 mr-1 mb-0.5" />
            {t('mileageLabel')}
          </label>
          <input
            id="mileageEnd"
            type="number"
            value={mileageEnd ?? ''}
            onChange={(e) => setMileageEnd(e.target.value === '' ? null : parseInt(e.target.value, 10))}
            placeholder={t('mileagePlaceholderPrefix', { min: mileageStart ?? 0 })}
            min={mileageStart ?? 0}
            required
            className="w-full px-4 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {mileageStart !== undefined && mileageEnd !== null && mileageEnd < mileageStart && (
            <p className="text-xs text-red-500 mt-1">{t('mileageBelowStart', { min: mileageStart })}</p>
          )}
        </div>

        {/* Niveau de carburant au retour */}
        <div>
          <label htmlFor="fuelLevelEnd" className="block text-sm font-medium text-foreground mb-1">
            <Fuel className="inline-block w-4 h-4 mr-1 mb-0.5" />
            {t('fuelLabel')}
          </label>
          <select
            id="fuelLevelEnd"
            value={fuelLevelEnd}
            onChange={(e) => setFuelLevelEnd(e.target.value as FuelLevel)}
            required
            className="w-full px-4 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
          >
            <option value="" disabled>{t('fuelPlaceholder')}</option>
            {fuelLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        {/* Photos du véhicule */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            <ImageIcon className="inline-block w-4 h-4 mr-1 mb-0.5" />
            {t('photosLabel')}
          </label>
          <ImageUploader
            maxImages={6}
            onImageUrlsChange={setPhotoUrlsEnd}
          />
          {photoUrlsEnd.length === 0 && (
            <p className="text-xs text-muted-foreground mt-1">{t('photosHint')}</p>
          )}
        </div>

        {/* Notes sur les dommages */}
        <div>
          <label htmlFor="notesEnd" className="block text-sm font-medium text-foreground mb-1">
            <FileText className="inline-block w-4 h-4 mr-1 mb-0.5" />
            {t('notesLabel')}
          </label>
          <textarea
            id="notesEnd"
            rows={3}
            value={notesEnd}
            onChange={(e) => setNotesEnd(e.target.value)}
            placeholder={t('notesPlaceholder')}
            className="w-full px-4 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {/* ✅ NOUVEAU : Statut GPS - Indicateur visuel pour rassurer l'utilisateur */}
        <div className={`p-4 rounded-lg flex items-start border ${
          locationStatus === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300' 
            : locationStatus === 'loading' 
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300' 
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300'
        }`}>
          <MapPin className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${locationStatus === 'loading' && 'animate-pulse'}`} />
          <div>
            <h4 className="text-sm font-medium">{t('locationTitle')}</h4>
            <p className="text-xs mt-1">
              {locationStatus === 'success'
                ? `✅ ${t('locationSuccess')}`
                : locationStatus === 'loading'
                ? `⏳ ${t('locationLoading')}`
                : `❌ ${t('locationError')}`}
            </p>
          </div>
        </div>

        {/* Bouton de soumission - Cliquable pour une meilleure UX */}
        <button
          type="submit"
          disabled={isLoading || locationStatus !== 'success'}
          className="w-full flex items-center justify-center py-3 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {t('submitting')}
            </>
          ) : locationStatus !== 'success' ? (
            <>
              <MapPin className="w-5 h-5 mr-2" />
              {t('waitingLocation')}
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              {t('submitButton')}
            </>
          )}
        </button>
      </form>

      {/* Toast d'erreur flottant - Auto-fermeture après 5 secondes */}
      {error && (
        <Toast
          type="error"
          title={t('validationErrorTitle')}
          message={error}
          duration={5000}
          onClose={() => setError(null)}
          position="bottom-right"
        />
      )}
    </>
  );
};

export default CheckOutForm;