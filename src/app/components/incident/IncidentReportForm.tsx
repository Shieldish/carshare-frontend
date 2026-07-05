// src/app/components/incident/IncidentReportForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, FileText, MapPin, Image as ImageIcon, Send, Loader2 } from 'lucide-react';
import ImageUploader from '@/app/components/inspection/ImageUploader';
import { apiClient } from '@/lib/apiClient';
import type { CreateIncidentData } from '@/app/types/incident';

interface IncidentReportFormProps {
  bookingId: number;
  onReportSuccess: (report: unknown) => void;
}

const IncidentReportForm: React.FC<IncidentReportFormProps> = ({ bookingId, onReportSuccess }) => {
  const [incidentTimestamp, setIncidentTimestamp] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-masquage des messages d'erreur après 5 secondes
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Détecter précisément ce qui manque
    const missingFields = [];
    if (!incidentTimestamp) missingFields.push("Date et heure");
    if (!location.trim()) missingFields.push("Lieu");
    if (!description.trim()) missingFields.push("Description");
    if (photoUrls.length === 0) missingFields.push("Photos");

    if (missingFields.length > 0) {
      setError(`Action requise. Il manque : ${missingFields.join(", ")}`);
      return;
    }

    setIsLoading(true);

    const reportData: CreateIncidentData = {
      incidentTimestamp: new Date(incidentTimestamp).toISOString(),
      description,
      location,
      photoUrls,
    };

    try {
      const result = await apiClient.createIncidentReport(bookingId, reportData);
      onReportSuccess(result);
    } catch (err: unknown) {
      console.error("Incident report error:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue lors du signalement.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="incidentTimestamp" className="block text-sm font-medium text-foreground mb-1">
            <Calendar className="inline-block w-4 h-4 mr-1 mb-0.5" />
            Date et Heure de l&apos;incident *
          </label>
          <input
            id="incidentTimestamp"
            type="datetime-local"
            value={incidentTimestamp}
            onChange={(e) => setIncidentTimestamp(e.target.value)}
            required
            max={new Date().toISOString().slice(0, 16)}
            className="w-full px-4 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-foreground mb-1">
            <MapPin className="inline-block w-4 h-4 mr-1 mb-0.5" />
            Lieu de l&apos;incident *
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ex: Près du rond-point central, Bujumbura"
            required
            className="w-full px-4 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
            <FileText className="inline-block w-4 h-4 mr-1 mb-0.5" />
            Description de l&apos;incident *
          </label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez ce qui s'est passé, les dommages observés, etc."
            required
            className="w-full px-4 py-2 border border-border bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            <ImageIcon className="inline-block w-4 h-4 mr-1 mb-0.5" />
            Photos (dommages, lieu, etc.) *
          </label>
          <ImageUploader
            maxImages={10}
            onImageUrlsChange={setPhotoUrls}
          />
          {photoUrls.length === 0 && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Au moins une photo est requise.</p>}
        </div>

        {/* Le bouton n'est plus bloqué par isFormValid, il affiche les erreurs en Toast */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center py-3 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 dark:hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Envoyer le signalement
            </>
          )}
        </button>
      </form>

      {/* Toast d'erreur flottant en bas à droite */}
      {error && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 bg-red-600 text-white px-5 py-4 rounded-xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-w-sm">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-sm">Formulaire incomplet</p>
            <p className="text-xs text-red-100 mt-1">{error}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default IncidentReportForm;