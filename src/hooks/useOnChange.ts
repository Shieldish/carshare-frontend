import { useState } from 'react';

/**
 * Appelle `onChange` pendant le rendu quand `value` change, pour ajuster un état qui en dépend
 * (revenir à la page 1 quand un filtre change, réinitialiser une modale à l'ouverture...).
 * C'est le remplacement recommandé par React d'un `useEffect` qui ferait un `setState` :
 * l'état est corrigé avant l'affichage, sans rendu intermédiaire incohérent.
 *
 * Contrairement à un effet, `onChange` n'est PAS appelé au premier rendu : la valeur de départ
 * doit donc être portée par l'état initial (`useState`).
 * https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
 */
export function useOnChange<T>(value: T, onChange: (value: T) => void): void {
  const [previous, setPrevious] = useState(value);
  if (!Object.is(previous, value)) {
    setPrevious(value);
    onChange(value);
  }
}
