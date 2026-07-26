'use client';

import { useState, useEffect } from 'react';
import { FileX, Loader2, ZoomIn, X, ShieldCheck } from 'lucide-react';

interface ProtectedImageProps {
  userId: number;
  docType: 'identity' | 'license' | 'selfie';
  alt: string;
  className?: string;
  fill?: boolean;
}

export default function ProtectedImage({ userId, docType, alt, className, fill }: ProtectedImageProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState(false);
  
  // État pour gérer la modale plein écran (Lightbox)
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;

    const fetchImage = async () => {
      try {
        const token = localStorage.getItem('jwt_token');
        if (!token) throw new Error("Non authentifié");

        // Appel au Proxy Backend pour récupérer l'image en toute sécurité
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'}/api/admin/users/${userId}/document/${docType}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        // Conversion du flux sécurisé en image lisible par le navigateur
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setImgSrc(objectUrl);
      } catch (err) {
        console.error("Impossible de charger le document :", err);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchImage();

    // Nettoyage de la mémoire pour éviter les fuites
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [userId, docType]);

  const baseClass = fill ? 'absolute inset-0 w-full h-full object-cover' : '';

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 gap-2 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg ${fill ? 'absolute inset-0' : ''} ${className ?? ''}`}>
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        <span className="text-xs text-gray-400">Déchiffrement...</span>
      </div>
    );
  }

  if (hasError || !imgSrc) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 text-gray-400 gap-2 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg ${fill ? 'absolute inset-0' : ''} ${className ?? ''}`}>
        <FileX className="w-8 h-8 opacity-40" />
        <span className="text-xs">Document indisponible</span>
      </div>
    );
  }

  return (
    <>
      {/* 1. L'image miniature (dans la modale d'examen) */}
      <div 
        className={`group relative cursor-zoom-in overflow-hidden rounded-lg ${fill ? 'absolute inset-0' : ''} ${className ?? ''}`}
        onClick={() => setIsViewerOpen(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={alt}
          className={`${baseClass} transition-all duration-300 group-hover:scale-105 group-hover:opacity-75`}
          onError={() => setHasError(true)}
        />
        {/* Overlay au survol */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm">
            <ZoomIn className="w-10 h-10 text-white drop-shadow-lg" />
        </div>
      </div>

      {/* 2. La Visionneuse Plein Écran (Lightbox) */}
      {isViewerOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-8 animate-in fade-in zoom-in-95 duration-200"
          onClick={() => setIsViewerOpen(false)} // Ferme si on clique à côté
        >
          {/* Barre d'en-tête sécurisée */}
          <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-green-400" />
              <div>
                <h3 className="text-white font-semibold text-lg leading-tight">{alt}</h3>
                <p className="text-green-400/80 text-xs uppercase tracking-wider font-bold">Affichage Sécurisé Budax</p>
              </div>
            </div>
            
            <button 
              onClick={(e) => { e.stopPropagation(); setIsViewerOpen(false); }}
              className="p-3 bg-white/10 hover:bg-white/25 rounded-full text-white transition-all pointer-events-auto"
              title="Fermer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* L'image en grand */}
          <div 
            className="relative w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()} // Empêche la fermeture si on clique sur l'image
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt={`Zoom sur ${alt}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl ring-1 ring-white/10"
            />
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Fonction utilitaire pour le bouton "Voir" dans le tableau principal
// ---------------------------------------------------------------------------
export const openProtectedDocument = async (userId: number, docType: 'identity' | 'license' | 'selfie') => {
  try {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'}/api/admin/users/${userId}/document/${docType}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error("Document inaccessible");

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    
    // Ouvre le document de manière sécurisée dans un nouvel onglet local
    window.open(objectUrl, '_blank');
  } catch (error) {
    console.error("Erreur d'ouverture du document", error);
    alert("Impossible d'ouvrir ce document. Il est peut-être corrompu ou manquant.");
  }
};