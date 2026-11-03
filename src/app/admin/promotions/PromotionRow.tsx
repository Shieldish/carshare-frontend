import { useState, useRef } from 'react';
import NextImage from 'next/image';
import { useTranslations } from 'next-intl';
import { Image as ImageIcon, XCircle, CheckCircle, Loader2, Trash2, ImagePlus, Pencil } from 'lucide-react';
import type { BoostAdminData } from './page';
import { apiClient } from '@/lib/apiClient';
import { Badge, TableRow, TableCell, type BadgeVariant } from '@/app/components/ui';

const BOOST_BADGE: Record<string, BadgeVariant> = {
  STANDARD: 'info',
  PREMIUM: 'purple',
  ULTRA: 'warning',
};

interface PromotionRowProps {
  boost: BoostAdminData;
  onUploadSuccess: (boostId: string, newImageUrl: string) => void;
  onDeleteSuccess: (boostId: string) => void;
}

export default function PromotionRow({ boost, onUploadSuccess, onDeleteSuccess }: PromotionRowProps) {
  const t = useTranslations('admin.promotions');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ NOUVEAU : État pour gérer l'image en plein écran
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError(t('imageTooLarge'));
        return;
      }
      setError(null);
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!imageFile) return;
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await apiClient.upload(
        `/api/promotions/admin/boost/${boost.boostId}/image`,
        formData
      );
      
      onUploadSuccess(boost.boostId, response.heroImageUrl);
      clearSelection();
    } catch {
      setError(t('uploadFailed'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!boost.heroImageUrl) return;
    setIsDeleting(true);
    setError(null);
    try {
      await apiClient.delete(`/api/promotions/admin/boost/${boost.boostId}/image`);
      onDeleteSuccess(boost.boostId);
    } catch {
      setError(t('deleteFailed'));
    } finally {
      setIsDeleting(false);
    }
  };
  
  const clearSelection = () => {
    setImageFile(null);
    if(previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if(fileInputRef.current) fileInputRef.current.value = "";
  };
  
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap">
        <div className="flex items-center space-x-3">
          {/* ✅ Miniature de la voiture (Cliquable avec Zoom Hover) */}
          <div
            className={`relative flex-shrink-0 w-12 h-12 bg-muted rounded-md overflow-hidden border border-border flex items-center justify-center group ${boost.vehicleImageUrl ? 'cursor-pointer' : ''}`}
            onClick={() => boost.vehicleImageUrl && setZoomedImage(boost.vehicleImageUrl)}
          >
            {boost.vehicleImageUrl ? (
              <NextImage
                src={boost.vehicleImageUrl}
                alt={t('vehicleAlt')}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
                unoptimized
              />
            ) : (
              <ImageIcon className="text-muted-foreground w-6 h-6" />
            )}
          </div>
          <div>
            <div className="font-bold text-foreground">
              {boost.vehicleMake} {boost.vehicleModel}
            </div>
            <div className="text-xs text-muted-foreground">ID: {boost.vehicleId}</div>
          </div>
        </div>
      </TableCell>

      <TableCell className="whitespace-nowrap">{boost.ownerEmail}</TableCell>
      <TableCell className="whitespace-nowrap"><Badge variant={BOOST_BADGE[boost.boostType] ?? 'neutral'}>{boost.boostType}</Badge></TableCell>
      <TableCell className="whitespace-nowrap">
        {new Date(boost.expiresAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
      </TableCell>

      <TableCell className="whitespace-nowrap">
        <div className="flex items-center space-x-4">
          {/* ✅ Image Héros/Promo (Cliquable avec Zoom Hover) */}
          <div 
            className={`relative w-24 h-14 bg-muted rounded-md flex items-center justify-center overflow-hidden group ${(previewUrl || boost.heroImageUrl) ? 'cursor-pointer shadow-sm hover:shadow-md transition-shadow' : ''}`}
            onClick={() => (previewUrl || boost.heroImageUrl) && setZoomedImage(previewUrl || boost.heroImageUrl!)}
          >
            {previewUrl || boost.heroImageUrl ? (
              <NextImage
                src={previewUrl || boost.heroImageUrl!}
                alt={t('previewAlt')}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300" 
                unoptimized 
              />
            ) : (
              <ImageIcon className="text-muted-foreground" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              {imageFile && (
                <>
                  <button onClick={handleUpload} disabled={isUploading || isDeleting} className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-full disabled:opacity-50 transition-colors">
                    {isUploading ? <Loader2 className="animate-spin" /> : <CheckCircle />}
                  </button>
                  <button onClick={clearSelection} disabled={isUploading || isDeleting} className="p-2 text-destructive hover:bg-destructive/10 rounded-full disabled:opacity-50 transition-colors">
                    <XCircle />
                  </button>
                </>
              )}

              {!imageFile && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isDeleting}
                    title={boost.heroImageUrl ? t('changeImage') : t('addImage')}
                    aria-label={boost.heroImageUrl ? t('changeImage') : t('addImage')}
                    className="p-2.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-full disabled:opacity-50 transition-colors"
                  >
                    {boost.heroImageUrl ? <Pencil size={18} /> : <ImagePlus size={18} />}
                  </button>

                  {boost.heroImageUrl && (
                    <button onClick={handleDelete} disabled={isDeleting} className="p-2.5 text-destructive hover:bg-destructive/10 rounded-full disabled:opacity-50 transition-colors" title={t('deleteImageTitle')}>
                      {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 size={18} />}
                    </button>
                  )}
                </>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
            />
            {error && <p className="text-xs text-destructive mt-1">{error}</p>}
          </div>

          {/* ✅ LA MODALE LIGHTBOX (Affiche l'image en plein écran) */}
          {zoomedImage && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-overlay-in p-4"
              onClick={() => setZoomedImage(null)}
            >
              <div
                className="relative w-full max-w-5xl h-[85vh] animate-dialog-in"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Positionné à l'intérieur de la boîte (pas au-dessus) pour ne jamais être coupé
                    par le haut de l'écran sur un viewport court — un -top-12 flottant au-dessus
                    du conteneur h-[85vh] pouvait dépasser la marge disponible sur un petit mobile. */}
                <button
                  className="absolute top-2 right-2 md:top-4 md:right-4 text-white/90 hover:text-white bg-black/40 hover:bg-black/60 rounded-full transition-colors z-10"
                  onClick={() => setZoomedImage(null)}
                >
                  <XCircle size={40} />
                </button>
                
                <NextImage
                  src={zoomedImage}
                  alt={t('zoomAlt')}
                  fill
                  className="object-contain drop-shadow-2xl rounded-xl"
                  unoptimized
                />
              </div>
            </div>
          )}

        </div>
      </TableCell>
    </TableRow>
  );
}