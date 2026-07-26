// src/app/components/inspection/CheckInForm.tsx
// 🔒 SÉCURITÉ : Ce formulaire doit être affiché UNIQUEMENT au propriétaire du véhicule.
// Le locataire voit son code PIN et attend que le propriétaire le saisisse ici.
// Voir la logique d'affichage conditionnel dans la page parente (inspection/page.tsx).
'use client';

import React, { useState, useEffect } from 'react';
import { Fuel, Gauge, Image as ImageIcon, FileText, Send, Loader2, AlertCircle, MapPin, Lock } from 'lucide-react';
import ImageUploader from './ImageUploader';
import Toast from '@/app/components/common/Toast';
import { apiClient } from '@/lib/apiClient';
import type { CheckInData, FuelLevel } from '@/types/inspection';

interface CheckInFormProps {
  bookingId: number;
  onCheckInSuccess: (record: unknown) => void;
}

const fuelLevels: FuelLevel[] = ["FULL", "3/4", "1/2", "1/4", "EMPTY"];

const CheckInForm: React.FC<CheckInFormProps> = ({ bookingId, onCheckInSuccess }) => {
  const [mileageStart, setMileageStart] = useState<number | null>(null);
  const [fuelLevelStart, setFuelLevelStart] = useState<FuelLevel>("");
  const [photoUrlsStart, setPhotoUrlsStart] = useState<string[]>([]);
  const [notesStart, setNotesStart] = useState('');

  const [latitudeStart, setLatitudeStart] = useState<number | null>(null);
  const [longitudeStart, setLongitudeStart] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [validationCode, setValidationCode] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ NOUVEAU : Toast d'erreur qui disparaît automatiquement après 5 secondes
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitudeStart(position.coords.latitude);
          setLongitudeStart(position.coords.longitude);
          setIsLocating(false);
        },
        (err) => {
          console.error("GPS Error:", err);
          setLocationError("Impossible d'obtenir votre position GPS. Veuillez autoriser la localisation dans votre navigateur.");
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocationError("La géolocalisation n'est pas supportée par votre appareil.");
      setIsLocating(false);
    }
  }, []);

  const isFormValid =
    mileageStart !== null && mileageStart >= 0 &&
    fuelLevelStart !== "" &&
    photoUrlsStart.length > 0 &&
    latitudeStart !== null &&
    longitudeStart !== null &&
    validationCode.trim().length === 4;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      setError("Veuillez remplir tous les champs obligatoires, ajouter une photo, autoriser le GPS et saisir le code communiqué par le locataire.");
      return;
    }
    setError(null);
    setIsLoading(true);

    const checkInData: CheckInData = {
      mileageStart: mileageStart as number,
      fuelLevelStart,
      photoUrlsStart,
      notesStart: notesStart || undefined,
      latitudeStart: latitudeStart as number,
      longitudeStart: longitudeStart as number,
      validationCode: validationCode.trim(),
    };

    try {
      const result = await apiClient.performCheckIn(bookingId, checkInData);

      // Le toast de succès est géré par le parent — on appelle directement le callback
      onCheckInSuccess(result);
    } catch (err: unknown) {
      console.error("Check-in error:", err);
      const message = err instanceof Error ? err.message : "Une erreur est survenue lors du check-in.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ✅ ANCIEN AFFICHAGE D'ERREUR (Inline) — Gardé pour contextualité immédiate */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-md flex items-start" role="alert">
            <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Indicateur GPS */}
        <div className={`p-4 rounded-lg border flex items-start ${latitudeStart ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          <MapPin className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 ${latitudeStart ? 'text-green-600' : 'text-amber-600'}`} />
          <div>
            <h4 className="font-semibold text-sm">Preuve de localisation (Assurance)</h4>
            {isLocating ? (
              <p className="text-sm flex items-center mt-1"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Recherche du signal GPS...</p>
            ) : locationError ? (
              <p className="text-sm text-red-600 mt-1">{locationError}</p>
            ) : (
              <p className="text-sm mt-1">Coordonnées sécurisées : {latitudeStart?.toFixed(4)}, {longitudeStart?.toFixed(4)}</p>
            )}
          </div>
        </div>

        {/* Kilométrage */}
        <div>
          <label htmlFor="mileageStart" className="block text-sm font-medium text-foreground mb-1">
            <Gauge className="inline-block w-4 h-4 mr-1 mb-0.5" />
            Kilométrage au départ *
          </label>
          <input
            id="mileageStart"
            type="number"
            value={mileageStart ?? ''}
            onChange={(e) => setMileageStart(e.target.value === '' ? null : parseInt(e.target.value, 10))}
            placeholder="Ex: 50000"
            min="0"
            required
            className="w-full px-4 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Niveau Carburant */}
        <div>
          <label htmlFor="fuelLevelStart" className="block text-sm font-medium text-foreground mb-1">
            <Fuel className="inline-block w-4 h-4 mr-1 mb-0.5" />
            Niveau de carburant au départ *
          </label>
          <select
            id="fuelLevelStart"
            value={fuelLevelStart}
            onChange={(e) => setFuelLevelStart(e.target.value as FuelLevel)}
            required
            className="w-full px-4 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
          >
            <option value="" disabled>-- Sélectionnez --</option>
            {fuelLevels.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            <ImageIcon className="inline-block w-4 h-4 mr-1 mb-0.5" />
            Photos du véhicule au départ *
          </label>
          <ImageUploader
            maxImages={6}
            onImageUrlsChange={setPhotoUrlsStart}
          />
          {photoUrlsStart.length === 0 && <p className="text-xs text-red-500 mt-1">Au moins une photo est requise.</p>}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notesStart" className="block text-sm font-medium text-foreground mb-1">
            <FileText className="inline-block w-4 h-4 mr-1 mb-0.5" />
            Notes sur l&apos;état du véhicule (optionnel)
          </label>
          <textarea
            id="notesStart"
            rows={3}
            value={notesStart}
            onChange={(e) => setNotesStart(e.target.value)}
            placeholder="Ex: Rayure sur l'aile avant gauche, intérieur propre..."
            className="w-full px-4 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {/* Code de validation (Handshake) */}
        <div className="bg-primary/5 border border-primary/20 p-5 rounded-xl">
          <label htmlFor="validationCode" className="block text-sm font-bold text-primary mb-2">
            <Lock className="inline-block w-4 h-4 mr-1 mb-0.5" />
            Signature Numérique (Code Locataire) *
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            Demandez au locataire de vous communiquer oralement son code secret à 4 chiffres affiché sur son écran, puis saisissez-le ici pour valider la remise des clés.
          </p>
          <input
            id="validationCode"
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={validationCode}
            onChange={(e) => setValidationCode(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="1234"
            required
            className="w-full text-center tracking-widest text-2xl font-mono px-4 py-3 border border-primary/30 bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Soumission */}
        <button
          type="submit"
          disabled={isLoading || !isFormValid}
          className="w-full flex items-center justify-center py-4 px-4 bg-primary text-primary-foreground rounded-lg font-bold text-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 mr-2 animate-spin" />
          ) : (
            <Send className="w-6 h-6 mr-2" />
          )}
          Confirmer et Signer le Check-in
        </button>
      </form>

      {/* ✅ NOUVEAU : Toast d'erreur flottant en bas à droite */}
      {error && (
        <Toast
          type="error"
          title="Erreur de validation"
          message={error}
          duration={5000}
          onClose={() => setError(null)}
          position="bottom-right"
        />
      )}
    </>
  );
};

export default CheckInForm;