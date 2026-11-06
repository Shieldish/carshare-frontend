import React, { useState } from 'react';
import { useOnChange } from '@/hooks/useOnChange';
import { useTranslations } from 'next-intl';
import { Star, Loader2 } from 'lucide-react';
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter, Button } from '@/app/components/ui';

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
  useOnChange(`${isOpen}|${initialRating}|${initialComment}`, () => {
    if (isOpen) {
      setRating(initialRating);
      setComment(initialComment);
    }
  });

  const handleSubmit = async () => {
    if (rating === 0) return;
    await onSubmit(rating, comment.trim());
  };

  return (
    <Dialog open={isOpen} onClose={onClose} size="sm" dismissible={!isLoading}>
      <DialogHeader onClose={!isLoading ? onClose : undefined}>
        <DialogTitle>{isEditMode ? t('editTitle') : t('title')}</DialogTitle>
        <p className="text-muted-foreground text-sm">{vehicleName}</p>
      </DialogHeader>
      <DialogBody>
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
          className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="flex-1">
          {t('cancel')}
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading || rating === 0} className="flex-1">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t(isEditMode ? 'saveChanges' : 'submit')}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default LeaveReviewModal;
