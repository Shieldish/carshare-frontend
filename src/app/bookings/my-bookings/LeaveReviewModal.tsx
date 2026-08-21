import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Star } from 'lucide-react';

interface LeaveReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  vehicleName: string;
  isLoading?: boolean;
  // ✅ Pré-remplit le formulaire pour éditer un avis existant au lieu d'en créer un nouveau.
  initialRating?: number;
  initialComment?: string;
}

const LeaveReviewModal: React.FC<LeaveReviewModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  vehicleName,
  isLoading = false,
  initialRating = 0,
  initialComment = '',
}) => {
  const t = useTranslations('bookings.reviewModal');
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(initialComment);
  const isEditMode = initialRating > 0;

  // Réinitialise les valeurs pré-remplies à chaque ouverture (au cas où une autre
  // réservation/avis a été sélectionné entre deux ouvertures de la modale).
  React.useEffect(() => {
    if (isOpen) {
      setRating(initialRating);
      setComment(initialComment);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialRating, initialComment]);

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) return;
    await onSubmit(rating, comment.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={!isLoading ? onClose : undefined}
      />

      <div className="relative bg-card text-foreground rounded-xl p-6 w-full max-w-md shadow-2xl border border-border">
        <h2 className="text-xl font-bold mb-1">{isEditMode ? t('editTitle') : t('title')}</h2>
        <p className="text-muted-foreground text-sm mb-5">{vehicleName}</p>

        <div className="flex justify-center gap-2 mb-5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={isLoading}
              aria-label={t('starAria', { count: star })}
              className="p-1"
            >
              <Star
                size={32}
                className={
                  star <= (hoverRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground'
                }
              />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('commentPlaceholder')}
          disabled={isLoading}
          rows={4}
          maxLength={1000}
          className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none mb-5"
        />

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-border rounded-lg hover:bg-muted disabled:opacity-50 transition-colors font-medium"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || rating === 0}
            className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center transition-colors font-medium"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
            ) : (
              t(isEditMode ? 'saveChanges' : 'submit')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveReviewModal;
