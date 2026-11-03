'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl';

const sizes: Record<DialogSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

interface DialogProps {
  open: boolean;
  onClose: () => void;
  size?: DialogSize;
  className?: string;
  children: React.ReactNode;
  /** Désactive le clic sur le fond et la touche Échap — pour un écran où la
   * sortie doit passer par une action explicite (ex: étape de succès). */
  dismissible?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Coquille de dialogue unique — remplace les overlays réinventés à la main
 * dans BoostModal, les 5+ modales admin, ConfirmDeleteModal, etc. (aucune
 * n'avait de piège à focus, de fermeture via Échap, ni de portail DOM).
 * `DialogHeader`/`DialogBody`/`DialogFooter` composent le contenu ; voir
 * `ConfirmDialog` ci-dessous pour le cas confirm/alert déjà dupliqué 4x.
 */
export function Dialog({ open, onClose, size = 'md', className, children, dismissible = true, ...aria }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;

    triggerRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () => panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [];
    (focusables()[0] ?? panelRef.current)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (dismissible) onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const nodes = Array.from(focusables());
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      (triggerRef.current as HTMLElement | null)?.focus?.();
    };
  }, [open, dismissible, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-overlay-in"
      onClick={(e) => dismissible && e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          'w-full bg-card text-card-foreground rounded-lg border border-border shadow-2xl',
          'max-h-[90vh] overflow-y-auto animate-dialog-in focus:outline-none',
          sizes[size],
          className
        )}
        {...aria}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
}

export function DialogHeader({ onClose, className, children, ...props }: DialogHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 p-4 sm:p-6 pb-0', className)} {...props}>
      <div className="min-w-0 flex-1">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-h3 text-foreground', className)} {...props} />;
}

export function DialogBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 sm:p-6', className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center justify-end gap-3 p-4 sm:p-6 pt-0', className)} {...props} />;
}

export type ConfirmDialogTone = 'primary' | 'destructive' | 'success';

const toneIcon: Record<ConfirmDialogTone, { icon: React.ElementType; className: string }> = {
  primary: { icon: Info, className: 'bg-primary/10 text-primary' },
  destructive: { icon: AlertTriangle, className: 'bg-destructive/10 text-destructive' },
  success: { icon: CheckCircle2, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
};

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmDialogTone;
  loading?: boolean;
}

/**
 * Dialogue confirm/alert — remplace le state `confirmDialog`/`alertDialog`
 * ad hoc de vehicles/page.tsx et les 3 modales de confirmation dupliquées
 * dans UserRow (users/page.tsx). Passer `onConfirm` déclenche l'action ;
 * omettre `onConfirm` côté appelant (en passant la même fonction que
 * `onClose`) donne une simple alerte à bouton unique.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  tone = 'primary',
  loading = false,
}: ConfirmDialogProps) {
  const { icon: Icon, className } = toneIcon[tone];
  return (
    <Dialog open={open} onClose={onClose} size="sm" dismissible={!loading}>
      <DialogBody className="pt-6 text-center">
        <div className={cn('mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full', className)}>
          <Icon className="h-6 w-6" />
        </div>
        <DialogTitle>{title}</DialogTitle>
        <p className="mt-2 text-small text-muted-foreground">{message}</p>
      </DialogBody>
      <DialogFooter className="justify-center">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={tone === 'destructive' ? 'destructive' : 'primary'} onClick={onConfirm} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export default Dialog;
