'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Correction des icônes Leaflet pour Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

interface LocationPickerMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLocation?: [number, number];
  centerPosition?: [number, number];
  forceMarkerPosition?: [number, number] | null;
}

// Sous-composant pour forcer le déplacement de la carte
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 14);
  }, [center, map]);
  return null;
}

function LocationMarker({ onLocationSelect, initialLocation, forceMarkerPosition }: LocationPickerMapProps) {
  const [position, setPosition] = useState<[number, number] | null>(initialLocation || null);

  // On extrait les variables pour éviter que React ne boucle sur une nouvelle référence de tableau
  const forceLat = forceMarkerPosition?.[0];
  const forceLng = forceMarkerPosition?.[1];

  useEffect(() => {
    if (forceLat !== undefined && forceLng !== undefined) {
      // On met à jour le marqueur visuellement !
      setPosition([forceLat, forceLng]);
      // Note: On ne rappelle plus onLocationSelect ici car le parent a déjà l'info
    }
  }, [forceLat, forceLng]);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onLocationSelect(lat, lng);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={icon}></Marker>
  );
}

export default function LocationPickerMap({ onLocationSelect, initialLocation, centerPosition, forceMarkerPosition }: LocationPickerMapProps) {
  // Centre par défaut : centre fourni, initialLocation, ou Bujumbura
  const center: [number, number] = centerPosition || initialLocation || [-3.3822, 29.3644];

  return (
    <div className="h-[350px] w-full rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-sm relative z-0">
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {centerPosition && <MapUpdater center={centerPosition} />}
        <LocationMarker
          onLocationSelect={onLocationSelect}
          initialLocation={initialLocation}
          forceMarkerPosition={forceMarkerPosition}
        />
      </MapContainer>
    </div>
  );
}