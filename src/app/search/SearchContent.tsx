'use client';

import React, { useEffect, useState, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Map as MapIcon, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import VehicleCard, { VehicleCardSkeleton } from '../components/VehicleCard';
import type { Vehicle } from '@/types/vehicle';
import type { MapBounds } from '../components/MapComponent';
import { useFavoriteIds } from '@/hooks/useFavoriteIds';

// Coordonnées approximatives des principales villes/communes (découpage 2025 : la commune
// est le niveau "ville" pertinent, la province ne l'est plus) — même table que MapComponent.tsx.
const CITY_COORDS: Record<string, [number, number]> = {
  'muha': [-3.3822, 29.3644],
  'mukaza': [-3.3822, 29.3644],
  'ntahangwa': [-3.3556, 29.3644],
  'bujumbura': [-3.3822, 29.3644],
  'gitega': [-3.4273, 29.9246],
  'ngozi': [-2.9075, 29.8288],
  'makamba': [-4.1348, 29.8030],
  'rumonge': [-3.9736, 29.4386],
  'cankuzo': [-3.2185, 30.5528],
  'muyinga': [-2.8451, 30.3414],
  'ruyigi': [-3.4764, 30.2467],
  'kayanza': [-2.9226, 29.6303],
  'kirundo': [-2.5847, 30.0961],
  'bururi': [-3.9500, 29.6167],
  'karuzi': [-3.1167, 30.1667],
  'muramvya': [-3.2667, 29.6083],
  'mwaro': [-3.5167, 29.7000],
  'bubanza': [-3.0904, 29.3911],
  'cibitoke': [-2.8895, 29.1247],
  'rutana': [-3.9333, 30.0000],
};

const getCityCoords = (name?: string): [number, number] | null => {
  if (!name) return null;
  const key = name.toLowerCase().trim();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (key.includes(city)) return coords;
  }
  return null;
};

const getVehicleCityCoords = (vehicle: { commune?: { name?: string } | null; province?: { name?: string } | null }): [number, number] | null =>
  getCityCoords(vehicle.commune?.name) ?? getCityCoords(vehicle.province?.name);

// Composant de chargement de la carte (rendu par React, peut utiliser les hooks next-intl)
function MapLoadingFallback() {
  const t = useTranslations('search');
  return (
    <div className="h-full w-full bg-muted animate-pulse flex items-center justify-center text-muted-foreground">
      {t('loadingMap')}
    </div>
  );
}

// Import dynamique de la carte
const MapComponent = dynamic(() => import('../components/MapComponent'), {
  ssr: false,
  loading: () => <MapLoadingFallback />
});

// Constante pour la pagination
const ITEMS_PER_PAGE = 10;

interface SearchContentInnerProps {
  // Fourni par le composant serveur (search/page.tsx) : évite un aller-retour réseau
  // supplémentaire au premier affichage. `undefined` = pas fourni (le composant fait
  // son propre fetch, comportement d'origine) ; un tableau (même vide) = déjà chargé.
  initialVehicles?: Vehicle[];
}

function SearchContent({ initialVehicles }: SearchContentInnerProps) {
  const t = useTranslations('search');
  const searchParams = useSearchParams();
  const city = searchParams.get('city') || '';
  const favoritedIds = useFavoriteIds();

  const hasInitialData = initialVehicles !== undefined;

  const [allVehicles, setAllVehicles] = useState<Vehicle[]>(initialVehicles ?? []);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [isLoading, setIsLoading] = useState(!hasInitialData);
  const [loadError, setLoadError] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

  // État pour la page courante
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Données déjà fournies par le serveur (voir page.tsx) : on filtre juste par ville
    // sur ces données, sans refaire l'appel réseau.
    if (hasInitialData) {
      const cityVehicles = city ? initialVehicles!.filter((v: Vehicle) => {
        const searchTerm = city.toLowerCase();
        return (
          v.province?.name?.toLowerCase().includes(searchTerm) ||
          v.commune?.name?.toLowerCase().includes(searchTerm) ||
          v.address?.toLowerCase().includes(searchTerm) ||
          v.locationGps?.toLowerCase().includes(searchTerm)
        );
      }) : initialVehicles!;
      setAllVehicles(cityVehicles);
      setIsLoading(false);
      return;
    }

    const fetchVehicles = async () => {
      setLoadError(false);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'}/api/vehicles`);
        if (response.ok) {
          const data = await response.json();
          const cityVehicles = city ? data.filter((v: Vehicle) => {
            const searchTerm = city.toLowerCase();
            return (
              v.province?.name?.toLowerCase().includes(searchTerm) ||
              v.commune?.name?.toLowerCase().includes(searchTerm) ||
              v.address?.toLowerCase().includes(searchTerm) ||
              v.locationGps?.toLowerCase().includes(searchTerm)
            );
          }) : data;
          setAllVehicles(cityVehicles);
        } else {
          setLoadError(true);
          toast.error(t('loadError'));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des véhicules', error);
        setLoadError(true);
        toast.error(t('loadError'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, hasInitialData]);

  // Réinitialiser la page à 1 si on bouge la carte
  useEffect(() => {
    setCurrentPage(1);
  }, [mapBounds]);

  const visibleVehicles = useMemo(() => {
    if (!mapBounds) return allVehicles;

    return allVehicles.filter(vehicle => {
      let lat: number | null = null;
      let lng: number | null = null;
      let isFallback = false;

      // 1. Chercher les vraies coordonnées GPS
      if (vehicle.locationGps && vehicle.locationGps.includes(',')) {
        const parts = vehicle.locationGps.split(',');
        lat = parseFloat(parts[0].trim());
        lng = parseFloat(parts[1].trim());
      }
      // 2. Si pas de GPS, utiliser la province comme secours avec tolérance
      else {
        const coords = getVehicleCityCoords(vehicle);
        if (coords) {
          lat = coords[0];
          lng = coords[1];
          isFallback = true;
        }
      }

      // S'il n'y a ni GPS ni Province reconnue, on ne l'affiche pas
      if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return false;

      // 3. Appliquer la même dispersion que sur la carte pour être précis
      const finalLat = isFallback ? lat + ((vehicle.id % 5) * 0.003) - 0.006 : lat;
      const finalLng = isFallback ? lng + (((vehicle.id * 2) % 5) * 0.003) - 0.006 : lng;

      // 4. Vérifier si la voiture est dans le cadre visible de la carte
      return finalLat <= mapBounds.north &&
             finalLat >= mapBounds.south &&
             finalLng <= mapBounds.east &&
             finalLng >= mapBounds.west;
    });
  }, [allVehicles, mapBounds]);

  // Calculs pour la pagination
  const totalPages = Math.ceil(visibleVehicles.length / ITEMS_PER_PAGE);
  const paginatedVehicles = visibleVehicles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Interaction avec les marqueurs (gère le changement de page automatique)
  const handleMarkerInteraction = (id: number) => {
    setSelectedVehicleId(id);

    // Trouver l'index du véhicule dans la liste globale visible
    const vehicleIndex = visibleVehicles.findIndex(v => v.id === id);

    if (vehicleIndex !== -1) {
      // Calculer sur quelle page se trouve ce véhicule
      const targetPage = Math.floor(vehicleIndex / ITEMS_PER_PAGE) + 1;

      // Si ce n'est pas la page actuelle, on change de page
      if (targetPage !== currentPage) {
        setCurrentPage(targetPage);

        // On attend un tout petit peu que React affiche la nouvelle page avant de scroller
        setTimeout(() => {
          const element = document.getElementById(`vehicle-card-${id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      } else {
        // Déjà sur la bonne page, on scrolle direct
        const element = document.getElementById(`vehicle-card-${id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  // FONCTION CORRIGÉE : Gérer la pagination sans sauter vers le footer
  const handlePageChange = (newPage: number, e?: React.MouseEvent<HTMLButtonElement>) => {
    // 1. On enlève le "focus" du bouton pour empêcher le navigateur de faire n'importe quoi
    if (e) {
      e.currentTarget.blur();
    }

    // 2. On change la page
    setCurrentPage(newPage);

    // 3. On remonte en haut
    setTimeout(() => {
      // Sécurité : on remonte la fenêtre globale
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // On remonte le conteneur de la liste
      const container = document.getElementById('search-results-container');
      if (container) {
        container.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    }, 50);
  };

  // NOUVEAU : Bloquer le défilement global et cacher le footer sur cette page
  useEffect(() => {
    // On cherche le footer global et on le cache
    const footer = document.querySelector('footer') as HTMLElement;
    if (footer) footer.style.display = 'none';

    // On bloque le défilement de la page entière (seule la liste pourra défiler)
    document.body.style.overflow = 'hidden';

    // Quand on quitte la page de recherche, on remet tout à la normale
    return () => {
      if (footer) footer.style.display = '';
      document.body.style.overflow = '';
    };
  }, []);

  return (
    // On remplace h-screen par une hauteur qui soustrait la taille du Header (ici environ 80px)
    <div className="flex flex-col h-[calc(100vh-80px)] bg-background relative">
      <div className="flex-1 flex overflow-hidden">

        {/* CÔTÉ GAUCHE : La liste */}
        <div id="search-results-container" className={`w-full lg:w-[60%] xl:w-[55%] h-full overflow-y-auto p-4 sm:p-6 pb-24 scroll-smooth ${mobileView === 'map' ? 'hidden lg:block' : 'block'}`}>
          <h1 className="text-2xl font-bold mb-2">
            {t('titleForCity', { city })}
          </h1>
          <p className="text-muted-foreground mb-6">
            {visibleVehicles.length > 1
              ? t('vehiclesVisiblePlural', { count: visibleVehicles.length })
              : t('vehiclesVisibleSingular', { count: visibleVehicles.length })}
          </p>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <VehicleCardSkeleton key={i} />
              ))}
            </div>
          ) : loadError ? (
            <div className="text-center py-10 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-red-600 dark:text-red-400 font-medium">{t('loadError')}</p>
            </div>
          ) : visibleVehicles.length === 0 ? (
            <div className="text-center py-10 bg-muted/50 rounded-xl">
              <p className="text-muted-foreground">{t('noVehiclesInArea')}</p>
              <p className="text-sm">{t('zoomOutHint')}</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Grille des véhicules paginés */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {paginatedVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    id={`vehicle-card-${vehicle.id}`}
                    onMouseEnter={() => setSelectedVehicleId(vehicle.id)}
                    onMouseLeave={() => setSelectedVehicleId(null)}
                    className={`transition-all duration-300 rounded-xl ${
                      selectedVehicleId === vehicle.id
                        ? 'ring-4 ring-primary ring-opacity-50 shadow-lg scale-[1.02] z-10 relative'
                        : ''
                    }`}
                  >
                    <VehicleCard vehicle={vehicle} favoritedIds={favoritedIds} />
                  </div>
                ))}
              </div>

              {/* Contrôles de pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-10 mb-8">
                  <button
                    onClick={(e) => handlePageChange(Math.max(1, currentPage - 1), e)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-input bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label={t('previousPage')}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <span className="text-sm font-medium">
                    {t('pageOf', { current: currentPage, total: totalPages })}
                  </span>

                  <button
                    onClick={(e) => handlePageChange(Math.min(totalPages, currentPage + 1), e)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-input bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label={t('nextPage')}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CÔTÉ DROIT : La Carte */}
        <div className={`w-full lg:w-[40%] xl:w-[45%] h-full relative border-l border-border z-0 ${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}>
          <MapComponent
            vehicles={allVehicles}
            onBoundsChange={setMapBounds}
            selectedVehicleId={selectedVehicleId}
            onMarkerClick={handleMarkerInteraction}
          />
        </div>

      </div>

      {/* Bouton flottant mobile */}
      <div className="lg:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <button
          onClick={() => setMobileView(mobileView === 'list' ? 'map' : 'list')}
          className="flex items-center gap-2 bg-[#0f172a] hover:bg-black text-white px-6 py-3 rounded-full font-medium shadow-[0_4px_14px_0_rgba(0,0,0,0.39)] transition-transform hover:scale-105 active:scale-95"
        >
          {mobileView === 'list' ? (
            <>
              <span>{t('mapView')}</span>
              <MapIcon className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>{t('listView')}</span>
              <List className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

    </div>
  );
}

function SearchPageFallback() {
  const t = useTranslations('search');
  return <div>{t('loadingPage')}</div>;
}

export default function SearchContentPage({ initialVehicles }: SearchContentInnerProps) {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchContent initialVehicles={initialVehicles} />
    </Suspense>
  );
}
