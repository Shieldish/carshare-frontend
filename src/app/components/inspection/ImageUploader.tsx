// src/app/components/inspection/ImageUploader.tsx
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { UploadCloud, X, Loader2, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface ImageUploaderProps {
  maxImages: number;
  onImageUrlsChange: (urls: string[]) => void;
  existingImageUrls?: string[]; // To display images already saved
}

type ImageStatus = 'uploading' | 'uploaded' | 'error' | 'local';

interface ImagePreview {
  id: string; // Unique ID for key prop and removal
  url: string; // Blob URL for local or Cloudinary URL for uploaded
  status: ImageStatus;
  file?: File; // Keep file ref for retries if needed
  errorMessage?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ maxImages, onImageUrlsChange, existingImageUrls = [] }) => {
  const t = useTranslations('inspection.imageUploader');
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // ✅ CORRECTION: Utiliser useRef pour éviter les re-renders infinis
  const isInitialized = useRef(false);

  // ✅ NOUVEAU : Référence sécurisée vers l'input (évite les conflits d'ID)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ CORRECTION: N'initialiser qu'une seule fois au montage
  useEffect(() => {
    if (!isInitialized.current && existingImageUrls.length > 0) {
      const initialPreviews = existingImageUrls.map(url => ({
        id: url, // Use URL as ID for existing ones
        url: url,
        status: 'uploaded' as ImageStatus,
      }));
      setImagePreviews(initialPreviews);
      isInitialized.current = true;
    }
  }, []); // ✅ Tableau de dépendances vide = exécuté une seule fois

  // Notify parent component when uploaded URLs change
  useEffect(() => {
    const uploadedUrls = imagePreviews
      .filter(img => img.status === 'uploaded')
      .map(img => img.url);
    onImageUrlsChange(uploadedUrls);
  }, [imagePreviews, onImageUrlsChange]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const filesArray = Array.from(files);
    const availableSlots = maxImages - imagePreviews.length;

    if (filesArray.length > availableSlots) {
      alert(t('tooManyFiles', { count: availableSlots }));
      return;
    }

    const newPreviews: ImagePreview[] = [];
    const uploadPromises: Promise<void>[] = [];

    filesArray.forEach(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert(t('fileTooLarge', { name: file.name }));
        return;
      }
      if (!file.type.startsWith('image/')) {
        alert(t('invalidFileType', { name: file.name }));
        return;
      }

      const id = `${file.name}-${Date.now()}-${Math.random()}`;
      const blobUrl = URL.createObjectURL(file);
      const preview: ImagePreview = { id, url: blobUrl, status: 'uploading', file };
      newPreviews.push(preview);

      // Start upload immediately
      const uploadPromise = apiClient.uploadToCloudinary(file)
        .then(result => {
          setImagePreviews(prev => prev.map(p =>
            p.id === id ? { ...p, url: result.secure_url, status: 'uploaded', file: undefined } : p
          ));
          URL.revokeObjectURL(blobUrl); // Clean up blob URL after upload
        })
        .catch(error => {
          console.error("Upload error:", error);
          setImagePreviews(prev => prev.map(p =>
            p.id === id ? { ...p, status: 'error', errorMessage: t('uploadErrorLabel') } : p
          ));
        });
      uploadPromises.push(uploadPromise);
    });

    setImagePreviews(prev => [...prev, ...newPreviews]);
  }, [imagePreviews.length, maxImages]);

  const removeImage = useCallback((idToRemove: string) => {
    setImagePreviews(prev => {
      const imageToRemove = prev.find(img => img.id === idToRemove);
      // Revoke blob URL if it was a local preview not yet uploaded or failed
      if (imageToRemove && (imageToRemove.status === 'local' || imageToRemove.status === 'uploading' || imageToRemove.status === 'error') && imageToRemove.url.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return prev.filter(img => img.id !== idToRemove);
    });
  }, []);

  // Drag and Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-muted-foreground'
        } ${imagePreviews.length >= maxImages ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => {
            if (imagePreviews.length < maxImages) {
                // ✅ CORRIGÉ : On utilise la référence pour éviter les conflits d'ID
                fileInputRef.current?.click();
            }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = ''; // ✅ Vide l'input pour permettre de resélectionner le même fichier
          }}
          disabled={imagePreviews.length >= maxImages}
        />
        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-2 text-sm text-foreground">
          {t('dropzoneText')}
        </p>
        <p className="text-xs text-muted-foreground">
          {t('maxImagesHint', { max: maxImages })}
        </p>
      </div>

      {imagePreviews.length > 0 && (
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {imagePreviews.map((img) => (
            <div key={img.id} className="relative group aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={t('previewAlt')}
                className={`w-full h-full object-cover rounded-md border ${img.status === 'error' ? 'border-red-500' : 'border-border'}`}
              />
              {/* Overlay for status */}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                {img.status === 'uploading' && <Loader2 className="w-6 h-6 text-white animate-spin" />}
                {img.status === 'error' && (
                  <div title={img.errorMessage}>
                    <AlertCircle className="w-6 h-6 text-red-400" />
                  </div>
                )}
              </div>
              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-600"
                title={t('removeTitle')}
              >
                <X size={14} />
              </button>
               {/* Error Message Tooltip */}
              {img.status === 'error' && img.errorMessage && (
                  <div className="absolute bottom-0 left-0 right-0 bg-red-700 text-white text-xs p-1 text-center rounded-b-md opacity-90 truncate" title={img.errorMessage}>
                      {t('uploadErrorLabel')}
                  </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;