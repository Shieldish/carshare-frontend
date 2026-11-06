// Espace insécable : un montant ne doit jamais être coupé en deux à la ligne.
const THOUSANDS_SEPARATOR = ' ';

/**
 * Formate un nombre de la même façon partout et dans toutes les langues : 190 000.
 *
 * À utiliser à la place de `toLocaleString()`, dont le résultat dépend de l'environnement :
 * le serveur écrivait "190,000" et le navigateur "190 000". Quand les deux diffèrent, React
 * jette la page rendue par le serveur et la reconstruit entièrement dans le navigateur.
 *
 * Renvoie une chaîne vide pour une valeur absente ou non numérique.
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';

  const number = Number(value);
  if (!Number.isFinite(number)) return '';

  const [integerPart, decimalPart] = String(Math.abs(Math.round(number * 100) / 100)).split('.');
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS_SEPARATOR);

  return `${number < 0 ? '-' : ''}${grouped}${decimalPart ? `,${decimalPart}` : ''}`;
}
