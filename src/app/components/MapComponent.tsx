'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Vehicle } from '../types/vehicle';

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
const getProvinceCoords = (provinceName?: string): [number, number] | null => {
  if (!provinceName) return null;
  const name = provinceName.toLowerCase();
  
  // On sépare explicitement Bujumbura Mairie et Bujumbura Rural
  if (name.includes('bujumbura mairie') || name.includes('mairie')) return [-3.3822, 29.3644];
  if (name.includes('bujumbura rural') || name.includes('rural')) return [-3.4500, 29.4667]; 
  
  // Fallback (sécurité) au cas où la base de données renvoie juste "bujumbura"
  if (name === 'bujumbura') return [-3.3822, 29.3644];
  
  if (name.includes('gitega')) return [-3.4273, 29.9246];
  if (name.includes('ngozi')) return [-2.9075, 29.8288];
  if (name.includes('makamba')) return [-4.1348, 29.8030];
  if (name.includes('rumonge')) return [-3.9736, 29.4386];
  if (name.includes('cankuzo')) return [-3.2185, 30.5528];
  return null;
};

// 🌟 TECHNIQUE PRO 2 : Le Recadreur Automatique (Auto-Fit)
function MapFitter({ vehicles }: { vehicles: Vehicle[] }) {
  const map = useMap();

  useEffect(() => {
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
        const coords = getProvinceCoords(vehicle.province?.name);
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

    if (hasValidPoints) {
      map.flyToBounds(bounds, { padding: [50, 50], maxZoom: 13, duration: 1.5 });
    }
  }, [map, vehicles]);

  return null;
}

function MapEventListener({ onBoundsChange }: { onBoundsChange?: (bounds: MapBounds) => void }) {
  const map = useMapEvents({
    moveend: () => {
      if (onBoundsChange) {
        const bounds = map.getBounds();
        onBoundsChange({
          north: bounds.getNorthEast().lat,
          south: bounds.getSouthWest().lat,
          east: bounds.getNorthEast().lng,
          west: bounds.getSouthWest().lng,
        });
      }
    }
  });

  useEffect(() => {
    if (onBoundsChange) {
      const bounds = map.getBounds();
      onBoundsChange({
        north: bounds.getNorthEast().lat,
        south: bounds.getSouthWest().lat,
        east: bounds.getNorthEast().lng,
        west: bounds.getSouthWest().lng,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            const coords = getProvinceCoords(vehicle.province?.name);
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