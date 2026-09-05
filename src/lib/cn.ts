/**
 * Fusionne des classes Tailwind conditionnelles sans dépendance externe
 * (pas de clsx/tailwind-merge dans ce projet — les variantes des primitives
 * sont assez simples pour s'en passer).
 *
 * Accepte des chaînes, `undefined`/`null`/`false` (pratique pour les
 * conditions inline) et les filtre avant de joindre le résultat.
 */
export function cn(...classes: Array<string | undefined | null | false>): string {
  return classes.filter(Boolean).join(' ');
}
