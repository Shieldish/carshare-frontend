'use client';

import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import VehicleCard from './VehicleCard';
import type { Vehicle } from '@/types/vehicle';

interface VehicleCarouselProps {
  title: string;
  city?: string;
  vehicles: Vehicle[];
  onViewAll?: () => void;
  // ✅ FAVORIS : transmis tel quel aux VehicleCard du carrousel, voir VehicleCard.tsx.
  favoritedIds?: Set<number>;
}

export default function VehicleCarousel({ title, city, vehicles, onViewAll, favoritedIds }: VehicleCarouselProps) {
  const t = useTranslations('vehicleCarousel');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Vérifie si on peut défiler à gauche ou à droite
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    
    // On peut défiler à gauche si on n'est pas tout au début
    setCanScrollLeft(scrollLeft > 0);
    // On peut défiler à droite si on n'est pas tout à la fin (avec marge de 5px)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  };

  // Initialisation de l'état des flèches au chargement
  useEffect(() => {
    handleScroll(); // Vérifie l'état initial
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [vehicles]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = scrollContainerRef.current.clientWidth * 0.8; // Défile de 80% de la largeur visible
    const newScrollLeft = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    
    scrollContainerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  // S'il n'y a aucun véhicule pour cette ville, on ne montre pas la section
  if (!vehicles || vehicles.length === 0) return null;

  // Limiter à 10 véhicules max
  const displayVehicles = vehicles.slice(0, 6);

  return (
    <div className="mb-12 relative w-full">
      {/* En-tête de la section (Titre à gauche, Flèches à droite) */}
      <div className="flex items-center justify-between mb-6 px-2 sm:px-0">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 group cursor-pointer" onClick={onViewAll}>
          {city ? <>{title} · <span className="text-primary">{city}</span></> : title}
          {onViewAll && (
            <ArrowRight className="w-5 h-5 ml-1 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-1" />
          )}
        </h2>
        
        {/* Contrôles à droite (Bouton Voir tout + Flèches de navigation) */}
        <div className="flex items-center gap-4">
          {onViewAll && (
            <button onClick={onViewAll} className="hidden sm:block text-sm font-medium text-muted-foreground hover:text-foreground hover:underline transition-colors">
              {t('showAll')}
            </button>
          )}
          
          {/* Flèches de navigation */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`p-2 rounded-full border transition-all flex items-center justify-center ${
                canScrollLeft 
                  ? 'border-border bg-background text-foreground hover:shadow-md hover:scale-105 cursor-pointer' 
                  : 'border-transparent bg-muted/50 text-muted-foreground opacity-50 cursor-not-allowed'
              }`}
              aria-label={t('scrollLeft')}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`p-2 rounded-full border transition-all flex items-center justify-center ${
                canScrollRight 
                  ? 'border-border bg-background text-foreground hover:shadow-md hover:scale-105 cursor-pointer' 
                  : 'border-transparent bg-muted/50 text-muted-foreground opacity-50 cursor-not-allowed'
              }`}
              aria-label={t('scrollRight')}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Conteneur du carrousel */}
      <div className="relative">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-6 pt-2 px-2 sm:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Cache la scrollbar
        >
          {displayVehicles.map((vehicle) => (
            <div key={vehicle.id} className="min-w-[280px] max-w-[320px] snap-start flex-shrink-0">
              <VehicleCard vehicle={vehicle} favoritedIds={favoritedIds} />
            </div>
          ))}
          
          {/* Carte spéciale "Tout afficher" à la fin */}
          {onViewAll && (
            <div className="min-w-[200px] snap-start flex-shrink-0 flex items-center justify-center pb-16">
              <button 
                onClick={onViewAll}
                className="flex flex-col items-center justify-center h-full w-full gap-3 text-muted-foreground hover:text-foreground transition-colors group/btn"
              >
                <div className="p-4 rounded-full border-2 border-current group-hover/btn:scale-110 transition-transform">
                  <ArrowRight className="w-8 h-8" />
                </div>
                <span className="font-medium text-sm">{t('seeMore')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CSS pour cacher la scrollbar sur Chrome/Safari */}
      <style dangerouslySetInnerHTML={{__html: `
        .overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
}