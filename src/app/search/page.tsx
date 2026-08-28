import { serverApiClient } from '@/lib/apiClient';
import type { Vehicle } from '@/types/vehicle';
import SearchContentPage from './SearchContent';

// Composant serveur fin : charge la liste des véhicules une fois côté serveur pour
// éviter le "flash" de chargement + l'aller-retour réseau que le composant client
// faisait avant au montage. Le filtre par ville reste appliqué côté client (voir
// SearchContent.tsx) — même logique qu'avant, juste sans le fetch initial en double.
export default async function SearchPage() {
  let initialVehicles: Vehicle[] | undefined;
  try {
    const data = await serverApiClient.get('/api/vehicles');
    initialVehicles = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Erreur lors du chargement serveur des véhicules (recherche):', error);
    initialVehicles = undefined; // le composant client retombera sur son propre fetch
  }

  return <SearchContentPage initialVehicles={initialVehicles} />;
}
