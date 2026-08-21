'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import HeroSection from './HeroSection ';
import CategoryCardsOverlay from './CategoryCardsOverlay';
import FilterSidebar from './FilterSidebar';
import VehicleCard from './VehicleCard';
import VehicleCarousel from './VehicleCarousel';
import type { Vehicle } from '../types/vehicle';
import type { HeroSliderData } from '../page';
import { Filter, ChevronLeft, ChevronRight, X, AlertCircle, CheckCircle, Info, LayoutGrid, Map as MapIcon, Car } from 'lucide-react';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full bg-muted animate-pulse rounded-xl flex items-center justify-center text-muted-foreground">
      ...
    </div>
  )
});

interface FilterData {
  pickupDate: string;
  dropoffDate: string;
  carType: string;
  companyName: string;
  provinceId: string;
  communeId: string;
  make: string;
  supportsDriver: boolean;
}

interface HomeClientProps {
  vehicles: Vehicle[];
  featuredPromotions: HeroSliderData[];
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

const Toast: React.FC<{
  notification: Notification;
  onDismiss: (id: string) => void;
}> = ({ notification, onDismiss }) => {
  const t = useTranslations('home');
  const { id, type, title, message } = notification;

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, 8000);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const typeStyles = {
    success: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', icon: <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />, titleColor: 'text-green-800 dark:text-green-300', messageColor: 'text-green-700 dark:text-green-400' },
    error: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />, titleColor: 'text-red-800 dark:text-red-300', messageColor: 'text-red-700 dark:text-red-400' },
    warning: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', icon: <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />, titleColor: 'text-yellow-800 dark:text-yellow-300', messageColor: 'text-yellow-700 dark:text-yellow-400' },
    info: { bg: 'bg-muted', border: 'border-border', icon: <Info className="h-5 w-5 text-primary" />, titleColor: 'text-foreground', messageColor: 'text-muted-foreground' }
  };

  const currentStyle = typeStyles[type];

  return (
    <div className={`transform transition-all duration-300 ease-in-out max-w-sm w-full ${currentStyle.bg} ${currentStyle.border} border rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5 backdrop-blur-sm`}>
      <div className="p-4">
        <div className="flex">
          <div className="flex-shrink-0">{currentStyle.icon}</div>
          <div className="ml-3 w-0 flex-1">
            <p className={`text-sm font-medium ${currentStyle.titleColor}`}>{title}</p>
            <p className={`mt-1 text-sm ${currentStyle.messageColor}`}>{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button className={`rounded-md inline-flex ${currentStyle.titleColor} hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 p-2 -m-2`} onClick={() => onDismiss(id)}>
              <span className="sr-only">{t('closeToast')}</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationContainer: React.FC<{ notifications: Notification[]; onDismiss: (id: string) => void; }> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed inset-0 flex items-start justify-end px-4 py-6 pointer-events-none sm:p-6 z-50">
      <div className="w-full flex flex-col items-end space-y-4 sm:items-end">
        {notifications.map((notification) => (
          <Toast key={notification.id} notification={notification} onDismiss={onDismiss} />
        ))}
      </div>
    </div>
  );
};

// Normalise une réponse API en tableau (gère à la fois array et réponse paginée)
const toArray = (data: unknown): Vehicle[] => {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray((data as { content?: unknown }).content)) {
    return (data as { content: Vehicle[] }).content;
  }
  return [];
};

const HomeClient: React.FC<HomeClientProps> = ({ vehicles: initialVehicles, featuredPromotions }) => {
  const router = useRouter();
  const t = useTranslations('home');
  const safeInitial = toArray(initialVehicles);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>(safeInitial);
  const [isSearching, setIsSearching] = useState(false);
  const [allVehicles] = useState<Vehicle[]>(safeInitial);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  const [activeFilters, setActiveFilters] = useState<FilterData>({
    pickupDate: '', dropoffDate: '', carType: '', companyName: '', provinceId: '', communeId: '', make: '', supportsDriver: false
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const vehiclesPerPage = 12;
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 🌟 MODIFICATION ICI : Séparation de Bujumbura en Mairie et Rural
  const prioritizedCities = ['Bujumbura Mairie', 'Bujumbura Rural', 'Gitega', 'Ngozi', 'Makamba', 'Rumonge', 'Cankuzo'];

  const addNotification = (type: Notification['type'], title: string, message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    setNotifications(prev => {
      const isDuplicate = prev.some(n => n.title === title && n.message === message);
      if (isDuplicate) return prev;
      return [...prev, { id, type, title, message }].slice(-3); 
    });
  };

  const dismissNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  const handleFilterChange = async (filters: FilterData) => {
    setActiveFilters(filters);
    setIsSearching(true);
    setCurrentPage(1);

    if (filters.pickupDate && filters.dropoffDate) {
      if (new Date(filters.dropoffDate) <= new Date(filters.pickupDate)) {
        setFilteredVehicles([]);
        setIsSearching(false);
        addNotification('error', t('invalidDatesTitle'), t('invalidDatesMessage'));
        return;
      }
    }

    const hasFilters = Object.entries(filters).some(([key, value]) => key === 'supportsDriver' ? value === true : value !== '');
    
    if (!hasFilters) {
      setFilteredVehicles(allVehicles);
      setIsSearching(false);
      return;
    }

    const params = new URLSearchParams();
    if (filters.pickupDate) params.append('startDate', filters.pickupDate);
    if (filters.dropoffDate) params.append('endDate', filters.dropoffDate);
    if (filters.provinceId) params.append('provinceId', filters.provinceId);
    if (filters.communeId) params.append('communeId', filters.communeId);
    if (filters.make) params.append('make', filters.make);
    if (filters.carType) params.append('carType', filters.carType);
    if (filters.supportsDriver) params.append('supportsDriver', 'true');
    if (filters.companyName && filters.companyName !== 'all') params.append('companyName', filters.companyName);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'}/api/vehicles/search?${params.toString()}`);
      if (!response.ok) throw new Error(`Erreur: ${response.statusText}`);
      const rawResults: unknown = await response.json();
      const searchResults = toArray(rawResults);
      setFilteredVehicles(searchResults);
      if (searchResults.length === 0) addNotification('info', t('noResultsTitle'), t('noResultsMessage'));
    } catch (error) {
      console.error("Erreur lors de la recherche :", error);
      addNotification('error', t('searchErrorTitle'), t('searchErrorMessage'));
      setFilteredVehicles([]);
    } finally {
      setIsSearching(false);
    }
  };

  const scrollToVehicles = () => {
    const el = document.querySelector('#all-vehicles-grid');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const totalPages = Math.ceil(filteredVehicles.length / vehiclesPerPage);
  const startIndex = (currentPage - 1) * vehiclesPerPage;
  const endIndex = startIndex + vehiclesPerPage;
  const currentVehicles = filteredVehicles.slice(startIndex, endIndex);

  const goToNextPage = () => { if (currentPage < totalPages) { setCurrentPage(currentPage + 1); scrollToVehicles(); } };
  const goToPreviousPage = () => { if (currentPage > 1) { setCurrentPage(currentPage - 1); scrollToVehicles(); } };
  const goToPage = (page: number) => { setCurrentPage(page); scrollToVehicles(); };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) { pages.push(1, 2, 3, 4, '...', totalPages); }
      else if (currentPage >= totalPages - 2) { pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages); }
      else { pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages); }
    }
    return pages;
  };

  const PaginationControls = ({ className = "" }) => {
    if (totalPages <= 1) return null;
    return (
      <div className={`flex items-center justify-center space-x-2 ${className}`}>
        <button onClick={goToPreviousPage} disabled={currentPage === 1} className={`flex items-center px-3 py-2 rounded-lg transition-colors ${currentPage === 1 ? 'text-muted-foreground cursor-not-allowed' : 'text-foreground hover:bg-muted hover:text-primary'}`}>
          <ChevronLeft className="h-4 w-4 mr-1" /> {t('previous')}
        </button>
        <div className="flex items-center space-x-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? <span className="px-3 py-2 text-muted-foreground">...</span> : (
                <button onClick={() => goToPage(page as number)} className={`px-3 py-2 rounded-lg transition-colors ${currentPage === page ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted hover:text-primary'}`}>{page}</button>
              )}
            </React.Fragment>
          ))}
        </div>
        <button onClick={goToNextPage} disabled={currentPage === totalPages} className={`flex items-center px-3 py-2 rounded-lg transition-colors ${currentPage === totalPages ? 'text-muted-foreground cursor-not-allowed' : 'text-foreground hover:bg-muted hover:text-primary'}`}>
          {t('next')} <ChevronRight className="h-4 w-4 ml-1" />
        </button>
      </div>
    );
  };

  const getActiveFiltersCount = () => Object.entries(activeFilters).filter(([key, value]) => key === 'supportsDriver' ? value === true : value !== '').length;

  const handleResetAllFilters = () => {
    setActiveFilters({ pickupDate: '', dropoffDate: '', carType: '', companyName: '', provinceId: '', communeId: '', make: '', supportsDriver: false });
    setFilteredVehicles(allVehicles);
    setCurrentPage(1);
  };

  const hasActiveFilters = getActiveFiltersCount() > 0;

  return (
    <div className="min-h-screen bg-background">
      <NotificationContainer notifications={notifications} onDismiss={dismissNotification} />

      <HeroSection featuredPromotions={featuredPromotions} />
      <CategoryCardsOverlay />

      <div id="vehicles-section" className="container mx-auto px-4 py-8 scroll-mt-24">
        <div className="flex gap-8">
          
          <FilterSidebar
            onFilterChange={handleFilterChange}
            vehicles={allVehicles}
            isOpen={isMobileFilterOpen}
            onClose={() => setIsMobileFilterOpen(false)}
          />

          <main className="flex-1 min-w-0">
            
            {/* CARROUSELS PAR VILLE */}
            {!hasActiveFilters && !isSearching && viewMode === 'list' && (
              <div className="mb-16">
                {prioritizedCities.map(city => {
                  const cityVehicles = allVehicles.filter(v => {
                  const searchTerm = city.toLowerCase();
                  return (
                    v.province?.name?.toLowerCase().includes(searchTerm) ||
                    v.commune?.name?.toLowerCase().includes(searchTerm) ||
                    v.address?.toLowerCase().includes(searchTerm) ||
                    v.locationGps?.toLowerCase().includes(searchTerm)
                  );
                });
                  if (cityVehicles.length === 0) return null;
                  return (
                    <VehicleCarousel
                      key={city} title={t('recommendedVehicles')} city={city} vehicles={cityVehicles}
                      onViewAll={() => {
                        router.push(`/search?city=${encodeURIComponent(city)}`);
                      }}
                    />
                  );
                })}
              </div>
            )}

            <div id="all-vehicles-grid" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pt-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {hasActiveFilters ? t('searchResultsTitle') : t('allVehiclesTitle')}
                </h2>
                <p className="text-muted-foreground">
                  {filteredVehicles.length !== allVehicles.length ? (
                    <>
                      {t('vehiclesCountOf', { count: filteredVehicles.length, total: allVehicles.length })}
                      {hasActiveFilters && (
                        <button onClick={handleResetAllFilters} className="ml-3 text-primary hover:text-primary/80 text-sm underline">{t('viewAllVehicles')}</button>
                      )}
                    </>
                  ) : (
                    allVehicles.length === 1
                      ? t('vehiclesAvailableSingular', { count: allVehicles.length })
                      : t('vehiclesAvailablePlural', { count: allVehicles.length })
                  )}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-muted p-1 rounded-lg">
                  <button onClick={() => setViewMode('list')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                    <LayoutGrid className="w-4 h-4" /> <span className="hidden sm:inline">{t('listView')}</span>
                  </button>
                  <button onClick={() => setViewMode('map')} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'map' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                    <MapIcon className="w-4 h-4" /> <span className="hidden sm:inline">{t('mapView')}</span>
                  </button>
                </div>

                <button onClick={() => setIsMobileFilterOpen(true)} className="lg:hidden bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:shadow-md transition-all">
                  <Filter className="w-4 h-4" />
                  <span className="sr-only sm:not-sr-only">{t('filtersButton')}</span>
                  {hasActiveFilters && <span className="bg-primary-foreground text-primary px-2 py-1 rounded-full text-xs font-medium">{getActiveFiltersCount()}</span>}
                </button>
              </div>
            </div>

            <div>
              {isSearching ? (
                <div className="text-center py-16 bg-card rounded-xl shadow-sm border border-border">
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="text-card-foreground font-medium">{t('searching')}</span>
                  </div>
                </div>
              ) : filteredVehicles.length > 0 ? (
                viewMode === 'map' ? (
                  <div className="h-[600px] w-full rounded-xl overflow-hidden border border-border shadow-sm animate-in fade-in duration-300">
                    <MapComponent vehicles={filteredVehicles} />
                  </div>
                ) : (
                  <div className="animate-in fade-in duration-300">
                    <PaginationControls className="mb-8" />
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                      {currentVehicles.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} />)}
                    </div>
                    <PaginationControls className="mt-12" />
                  </div>
                )
              ) : allVehicles.length === 0 ? (
                // ✅ CAS 1 : La plateforme est vide → Empty State simple et professionnel
                <div className="text-center py-16 bg-card rounded-xl shadow-sm border border-dashed border-border">
                  <div className="max-w-md mx-auto">
                    <Car className="w-14 h-14 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-card-foreground mb-2">
                      {t('noVehiclesAtAllTitle')}
                    </h3>
                    <p className="text-muted-foreground">
                      {t('noVehiclesAtAllDescription')}
                    </p>
                  </div>
                </div>
              ) : (
                // ✅ CAS 2 : Des véhicules existent mais le filtre ne retourne rien → bouton reset utile
                <div className="text-center py-16 bg-card rounded-xl shadow-sm border border-border">
                  <div className="max-w-md mx-auto">
                    <div className="text-6xl mb-6">🔍</div>
                    <h3 className="text-xl font-semibold text-card-foreground mb-2">{t('noVehiclesMatchTitle')}</h3>
                    <p className="text-muted-foreground mb-6">
                      {t('noVehiclesMatchDescription')}
                    </p>
                    <button
                      onClick={handleResetAllFilters}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-lg transition-colors shadow-sm hover:shadow-md font-medium"
                    >
                      {t('viewAllVehicles')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default HomeClient;