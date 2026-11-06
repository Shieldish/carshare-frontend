import { useSyncExternalStore } from 'react';

const subscribeToNothing = () => () => {};

/**
 * `false` au rendu serveur et pendant l'hydratation, `true` ensuite. Pour ce qui ne peut être
 * calculé que dans le navigateur (date du jour, thème résolu...) sans erreur d'hydratation.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(subscribeToNothing, () => true, () => false);
}

/** Le navigateur propose-t-il la géolocalisation ? On suppose que oui côté serveur. */
export function useGeolocationSupported(): boolean {
  return useSyncExternalStore(subscribeToNothing, () => 'geolocation' in navigator, () => true);
}
