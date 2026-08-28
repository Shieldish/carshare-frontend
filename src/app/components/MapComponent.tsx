'use client';

import { useCallback, useEffect } from 'react';
import Link from 'next/link';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Vehicle } from '@/types/vehicle';

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface MapProps {
  vehicles?: Vehicle[];
  onBoundsChange?: (bounds: MapBounds) => void;
  selectedVehicleId?: number | null;
  onMarkerClick?: (id: number) => void;
}

// 🌟 TECHNIQUE PRO 1 : Fonction de secours intelligente (tolère les variations de texte)
// Coordonnées approximatives des principales villes/communes (découpage 2025 : la commune
// est le niveau "ville" pertinent, la province ne l'est plus). On retombe sur le nom de
// province si la commune n'est pas renseignée ou pas reconnue.
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

// 🌟 TECHNIQUE PRO 2 : Le Recadreur Automatique (Auto-Fit)
function MapFitter({ vehicles }: { vehicles: Vehicle[] }) {
  const map = useMap();

  const fitToVehicles = useCallback(() => {
    if (!vehicles || vehicles.length === 0) return;

    const bounds = L.latLngBounds([]);
    let hasValidPoints = false;

    vehicles.forEach(vehicle => {
      let lat: number | null = null;
      let lng: number | null = null;

      if (vehicle.locationGps && vehicle.locationGps.includes(',')) {
        const parts = vehicle.locationGps.split(',');
        lat = parseFloat(parts[0].trim());
        lng = parseFloat(parts[1].trim());
      } else {
        const coords = getVehicleCityCoords(vehicle);
        if (coords) {
          lat = coords[0];
          lng = coords[1];
        }
      }

      if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
        bounds.extend([lat, lng]);
        hasValidPoints = true;
      }
    });

    // Sur mobile, ce conteneur reste display:none tant que la vue "liste" est active
    // (voir search/page.tsx) : Leaflet le mesure alors à (0,0) et flyToBounds plante
    // avec "Invalid LatLng object: (NaN, NaN)". On ne recadre que si la carte a une
    // taille réelle ; le ResizeObserver ci-dessous rattrape le recadrage dès que le
    // conteneur redevient visible.
    const size = map.getSize();
    if (hasValidPoints && size.x > 0 && size.y > 0) {
      map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 13, duration: 1.5 });
    }
  }, [map, vehicles]);

  useEffect(() => {
    fitToVehicles();
  }, [fitToVehicles]);

  // Le conteneur n'a pas de boîte générée tant qu'il est display:none, donc le
  // ResizeObserver ne se déclenche que lorsqu'il redevient visible (bouton "Voir la
  // carte" sur mobile) — c'est le signal pour que Leaflet recalcule sa taille interne
  // puis se recadre correctement.
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
      fitToVehicles();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map, fitToVehicles]);

  return null;
}

function MapEventListener({ onBoundsChange }: { onBoundsChange?: (bounds: MapBounds) => void }) {
  const map = useMapEvents({
    moveend: () => emitBounds(),
    resize: () => emitBounds(),
  });

  const emitBounds = useCallback(() => {
    if (!onBoundsChange) return;

    // Sur mobile, ce conteneur reste display:none tant que la vue "liste" est active
    // (voir search/page.tsx) : Leaflet le mesure alors à (0,0) et getBounds() renvoie
    // des bornes quasi ponctuelles, ce qui ferait filtrer TOUTE la liste à zéro
    // véhicule côté parent. On n'émet que si la carte a une taille réelle ; le
    // ResizeObserver de MapFitter appelle invalidateSize() dès que le conteneur
    // redevient visible, ce qui déclenche l'événement 'resize' ci-dessous.
    const size = map.getSize();
    if (size.x === 0 || size.y === 0) return;

    const bounds = map.getBounds();
    onBoundsChange({
      north: bounds.getNorthEast().lat,
      south: bounds.getSouthWest().lat,
      east: bounds.getNorthEast().lng,
      west: bounds.getSouthWest().lng,
    });
  }, [map, onBoundsChange]);

  useEffect(() => {
    emitBounds();
  }, [emitBounds]);

  return null;
}

export default function MapComponent({ vehicles = [], onBoundsChange, selectedVehicleId, onMarkerClick }: MapProps) {
  const centerPosition: [number, number] = [-3.3822, 29.3644];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-BI').format(price);
  };

  const createPriceMarker = (price: number, isSelected: boolean) => {
    const bgColor = isSelected ? '#0f172a' : 'white';
    const textColor = isSelected ? 'white' : '#0f172a';
    const scale = isSelected ? 'scale(1.15)' : 'scale(1)';
    const zIndex = isSelected ? '1000' : '1';

    return L.divIcon({
      className: 'bg-transparent border-none',
      html: `
        <div style="
          background-color: ${bgColor}; 
          color: ${textColor}; 
          font-weight: 700; 
          padding: 6px 12px; 
          border-radius: 20px; 
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); 
          border: 1px solid #e2e8f0;
          white-space: nowrap; 
          font-size: 14px;
          display: inline-block;
          transform: ${scale};
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          z-index: ${zIndex};
        ">
          ${formatPrice(price)} BIF
        </div>
      `,
      iconSize: [100, 30],
      iconAnchor: [50, 15],
      popupAnchor: [0, -15]
    });
  };

  return (
    <div className="h-full w-full min-h-[500px] rounded-xl overflow-hidden shadow-sm relative z-0 bg-muted/20">
      <MapContainer 
        center={centerPosition} 
        zoom={12} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapEventListener onBoundsChange={onBoundsChange} />
        
        <MapFitter vehicles={vehicles} />
        
        {vehicles.map((vehicle) => {
          let lat: number | null = null;
          let lng: number | null = null;
          let isFallback = false;

          if (vehicle.locationGps && vehicle.locationGps.includes(',')) {
            const parts = vehicle.locationGps.split(',');
            lat = parseFloat(parts[0].trim());
            lng = parseFloat(parts[1].trim());
          } 
          else {
            const coords = getVehicleCityCoords(vehicle);
            if (coords) {
              lat = coords[0];
              lng = coords[1];
              isFallback = true;
            }
          }

          if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return null;

          const finalLat = isFallback ? lat + ((vehicle.id % 5) * 0.003) - 0.006 : lat;
          const finalLng = isFallback ? lng + (((vehicle.id * 2) % 5) * 0.003) - 0.006 : lng;

          return (
            <Marker 
              key={vehicle.id} 
              position={[finalLat, finalLng]} 
              icon={createPriceMarker(vehicle.ratePerDay, selectedVehicleId === vehicle.id)}
              eventHandlers={{
                click: () => {
                  if (onMarkerClick) onMarkerClick(vehicle.id);
                },
                mouseover: () => {
                  if (onMarkerClick) onMarkerClick(vehicle.id);
                }
              }}
            >
              <Popup className="custom-popup border-none rounded-xl overflow-hidden shadow-xl">
                <div className="text-sm text-center min-w-[160px] p-2 bg-white">
                  <strong className="text-base text-gray-800 block mb-1">{vehicle.make} {vehicle.model}</strong>
                  {(vehicle.commune || vehicle.province) && (
                    <span className="text-xs text-gray-500 block mb-1">
                      {[vehicle.address, vehicle.commune?.name, vehicle.commune?.province.name ?? vehicle.province?.name]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  )}
                  <span className="text-primary font-bold block mb-3">{formatPrice(vehicle.ratePerDay)} BIF / jour</span>
                  <Link href={`/vehicles/${vehicle.id}`} className="block w-full text-center bg-[#0f172a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-black transition shadow-sm">
                    Voir l&apos;offre
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}