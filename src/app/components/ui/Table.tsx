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
interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  /** Affiche un voile de chargement pendant un refetch, sans masquer les lignes déjà chargées. */
  loading?: boolean;
}

export function Table({ className, children, loading = false, ...props }: TableProps) {
  return (
    <div className="relative w-full overflow-x-auto rounded-lg border border-border">
      <table className={cn('w-full border-collapse text-left text-body', className)} {...props}>
        {children}
      </table>
      {/* Le voile est un frère de <table>, jamais un enfant : un <div> dans <table>
          est du HTML invalide (erreur d'hydratation React). */}
      {loading && <TableLoadingOverlay />}
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

/** Voile de chargement pendant un refetch — rendu par `Table` via sa prop `loading`. */
function TableLoadingOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-card/60 backdrop-blur-[1px]">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

export default Table;
