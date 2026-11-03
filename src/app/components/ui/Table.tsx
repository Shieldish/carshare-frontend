import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Table composable unique — remplace les 3 implémentations de `<table>`
 * divergentes (AdminPaymentTable, promotions, reviews/users avec des classes
 * d'en-tête différentes à chaque fois). Ne couvre que ce qui existe déjà
 * (pas de tri/sélection : aucune table actuelle n'en a) ; les listes en
 * cartes (incidents, véhicules) restent des `Card` — leur contenu ne tient
 * pas en colonnes.
 */
export function Table({ className, children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-x-auto rounded-lg border border-border">
      <table className={cn('w-full border-collapse text-left text-body', className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-muted/50', className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-border', className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('transition-colors hover:bg-muted/40', className)} {...props} />;
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('px-4 py-3 text-small font-semibold text-muted-foreground', className)} {...props} />;
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 text-foreground', className)} {...props} />;
}

/** Ligne unique à largeur pleine — état vide (aucun résultat / aucune donnée). */
export function TableEmpty({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-small text-muted-foreground">
        {children}
      </td>
    </tr>
  );
}

/** Voile de chargement pendant un refetch (pattern de reviews/page.tsx) — le
 * conteneur de `Table` est déjà `relative`, il suffit de la placer en enfant. */
export function TableLoadingOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-card/60 backdrop-blur-[1px]">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

export default Table;
