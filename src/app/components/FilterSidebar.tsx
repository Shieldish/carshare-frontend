'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Calendar, MapPin, Car, RotateCcw, Building, ChevronDown, X, Fuel, Settings2, Users, Banknote } from 'lucide-react';
import { Vehicle } from '@/types/vehicle';
import { apiClient } from '@/lib/apiClient';

// Types pour la localisation
interface Province {
  id: number;
  name: string;
}

interface Commune {
  id: number;
  name: string;
}

interface Company {
  id: number;
  name: string;
}

interface FilterData {
  pickupDate: string;
  dropoffDate: string;
  carType: string;
  companyName: string;
  provinceId: string;
  communeId: string;
  make: string;
  supportsDriver: boolean;
  fuelType: string;
  transmission: string;
  minSeats: string;
  minPrice: string;
  maxPrice: string;
}

interface FilterContentProps {
  filters: FilterData;
  provinces: Province[];
  communes: Commune[];
  companies: Company[];
  makes: string[];
  selectedProvince: string;
  loadingProvinces: boolean;
  loadingCommunes: boolean;
  loadingCompanies: boolean;
  hasActiveFilters: boolean;
  today: string;
  onInputChange: (field: keyof FilterData, value: string | boolean) => void;
  onProvinceChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onResetFilters: () => void;
  onSupportsDriverChange: (checked: boolean) => void;
}

const VEHICLE_TYPE_VALUES = [
  'sedan', 'suv', 'suv_coupe', 'hatchback', 'minibus', 'pickup', 'van',
  'minivan', 'truck', 'motorcycle', 'tricycle', 'coupe', 'convertible', 'wagon', 'other',
] as const;

const FUEL_TYPE_VALUES = ['Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL'] as const;
const TRANSMISSION_TYPE_VALUES = ['Manuelle', 'Automatique', 'Semi-automatique'] as const;

const FilterContent: React.FC<FilterContentProps> = ({
  filters,
  provinces,
  communes,
  companies,
  makes,
  selectedProvince,
  loadingProvinces,
  loadingCommunes,
  loadingCompanies,
  hasActiveFilters,
  today,
  onInputChange,
  onProvinceChange,
  onResetFilters,
  onSupportsDriverChange,
}) => {
  const t = useTranslations('filters');

  return (
    <div className="space-y-6 p-6">
      {/* Header avec compteur de filtres */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          {t('title')}
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {t('reset')}
          </button>
        )}
      </div>

      {/* Section Dates */}
      <div className="space-y-4">
        <h4 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
          {t('datesTitle')}
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {t('pickupDate')}
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="date"
                value={filters.pickupDate}
                onChange={(e) => onInputChange('pickupDate', e.target.value)}
                min={today || undefined}
                className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-input text-foreground transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {t('dropoffDate')}
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="date"
                value={filters.dropoffDate}
                onChange={(e) => onInputChange('dropoffDate', e.target.value)}
                min={filters.pickupDate || today || undefined}
                className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-input text-foreground transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section Localisation — la province en premier, la ville en dessous ne montre
          que celles de la province choisie (comme avant). */}
      <div className="space-y-4">
        <h4 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
          {t('locationTitle')}
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {t('province')}
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <select
                value={selectedProvince}
                onChange={onProvinceChange}
                disabled={loadingProvinces}
                className="w-full pl-10 pr-8 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-input text-foreground appearance-none transition-colors disabled:opacity-50"
              >
                <option value="">{t('allProvinces')}</option>
                {loadingProvinces ? (
                  <option value="" disabled>{t('loading')}</option>
                ) : (
                  provinces.map((province) => (
                    <option key={province.id} value={province.id.toString()}>
                      {province.name}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {t('commune')}
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <select
                value={filters.communeId}
                onChange={(e) => onInputChange('communeId', e.target.value)}
                disabled={!selectedProvince || communes.length === 0 || loadingCommunes}
                className="w-full pl-10 pr-8 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-input text-foreground appearance-none transition-colors disabled:opacity-50"
              >
                <option value="">
                  {loadingCommunes ? t('loading') : t('allCommunes')}
                </option>
                {communes.map((commune) => (
                  <option key={commune.id} value={commune.id.toString()}>
                    {commune.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Section Véhicule */}
      <div className="space-y-4">
        <h4 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
          {t('vehicleTitle')}
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {t('vehicleType')}
            </label>
            <div className="relative">
              <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <select
                value={filters.carType}
                onChange={(e) => onInputChange('carType', e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-input text-foreground appearance-none transition-colors"
              >
                <option value="">{t('allTypes')}</option>
                {VEHICLE_TYPE_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {t(`vehicleTypes.${value}`)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {t('vehicleMake')}
            </label>
            <div className="relative">
              <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <select
                value={filters.make}
                onChange={(e) => onInputChange('make', e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-input text-foreground appearance-none transition-colors"
              >
                <option value="">{t('allMakes')}</option>
                {makes.map((make) => (
                  <option key={make} value={make}>
                    {make}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Section Caractéristiques */}
      <div className="space-y-4">
        <h4 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
          {t('characteristicsTitle')}
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {t('fuelLabel')}
            </label>
            <div className="relative">
              <Fuel className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <select
                value={filters.fuelType}
                onChange={(e) => onInputChange('fuelType', e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-input text-foreground appearance-none transition-colors"
              >
                <option value="">{t('allFuelTypes')}</option>
                {FUEL_TYPE_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {t(`fuelTypes.${value}`)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {t('transmissionLabel')}
            </label>
            <div className="relative">
              <Settings2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <select
                value={filters.transmission}
                onChange={(e) => onInputChange('transmission', e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-input text-foreground appearance-none transition-colors"
              >
                <option value="">{t('allTransmissions')}</option>
                {TRANSMISSION_TYPE_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {t(`transmissionTypes.${value}`)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {t('minSeatsLabel')}
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="number"
                min="1"
                value={filters.minSeats}
                onChange={(e) => onInputChange('minSeats', e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-input text-foreground transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section Prix */}
      <div className="space-y-4">
        <h4 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
          {t('priceTitle')}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {t('minPriceLabel')}
            </label>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="number"
                min="0"
                value={filters.minPrice}
                onChange={(e) => onInputChange('minPrice', e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-input text-foreground transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {t('maxPriceLabel')}
            </label>
            <div className="relative">
              <Banknote className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="number"
                min="0"
                value={filters.maxPrice}
                onChange={(e) => onInputChange('maxPrice', e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-input text-foreground transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section Options */}
      <div className="space-y-4">
        <h4 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
          {t('optionsTitle')}
        </h4>
        <div>
          <label className="flex items-center space-x-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.supportsDriver}
              onChange={(e) => onSupportsDriverChange(e.target.checked)}
              className="form-checkbox h-5 w-5 text-primary border-border rounded focus:ring-primary transition duration-150 ease-in-out"
            />
            <span className="text-sm text-foreground group-hover:text-primary transition-colors">
              {t('withDriver')}
            </span>
          </label>
        </div>
      </div>

      {/* Section Entreprise */}
      <div className="space-y-4">
        <h4 className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
          {t('companyTitle')}
        </h4>
        <div>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <select
              value={filters.companyName}
              onChange={(e) => onInputChange('companyName', e.target.value)}
              disabled={loadingCompanies}
              className="w-full pl-10 pr-8 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-input text-foreground appearance-none transition-colors disabled:opacity-50"
            >
              <option value="">{t('allCompanies')}</option>
              {loadingCompanies ? (
                <option value="" disabled>{t('loading')}</option>
              ) : companies.length === 0 ? (
                <option value="" disabled>{t('noCompaniesAvailable')}</option>
              ) : (
                companies.map((company) => (
                  <option key={company.id} value={company.name}>
                    {company.name}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

interface FilterSidebarProps {
  onFilterChange?: (filters: FilterData) => void;
  vehicles: Vehicle[];
  isOpen: boolean;
  onClose: () => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  onFilterChange,
  vehicles,
  isOpen,
  onClose,
}) => {
  const t = useTranslations('filters');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  
  // États pour la localisation — la ville affichée dépend de la province choisie.
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [provincesWithCommunes, setProvincesWithCommunes] = useState<(Province & { communes: Commune[] })[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const loadingCommunes = loadingProvinces;

  // ✅ Guard monté : empêche tout appel API avant que le composant soit
  // hydraté côté client — élimine les erreurs "Failed to fetch" en console
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ Date du jour calculée côté client uniquement
  const [today, setToday] = useState('');
  useEffect(() => {
    setToday(new Date().toISOString().split('T')[0]);
  }, []);
  
  const [filters, setFilters] = useState<FilterData>({
    pickupDate: '',
    dropoffDate: '',
    carType: '',
    companyName: '',
    provinceId: '',
    communeId: '',
    make: '',
    supportsDriver: false,
    fuelType: '',
    transmission: '',
    minSeats: '',
    minPrice: '',
    maxPrice: ''
  });

  const initialFilters: FilterData = {
    pickupDate: '',
    dropoffDate: '',
    carType: '',
    companyName: '',
    provinceId: '',
    communeId: '',
    make: '',
    supportsDriver: false,
    fuelType: '',
    transmission: '',
    minSeats: '',
    minPrice: '',
    maxPrice: ''
  };

  // Extraire les marques uniques des véhicules
  const [makes, setMakes] = useState<string[]>([]);
  useEffect(() => {
    const uniqueMakes = Array.from(new Set(vehicles.map(v => v.make).filter(Boolean))).sort();
    setMakes(uniqueMakes);
  }, [vehicles]);

  // ✅ Charger les provinces (avec leurs villes imbriquées) — uniquement après montage
  // côté client, en un seul appel. La liste des villes affichées est ensuite filtrée
  // localement selon la province choisie (voir l'effet ci-dessous).
  useEffect(() => {
    if (!mounted) return;

    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const data: (Province & { communes: Commune[] })[] = await apiClient.get('/api/locations/provinces');
        setProvinces((data || []).map(({ id, name }) => ({ id, name })));
        setProvincesWithCommunes(data || []);
      } catch (err) {
        console.error("Impossible de charger les provinces/villes", err);
        setProvinces([]);
        setProvincesWithCommunes([]);
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, [mounted]);

  // Filtre les villes affichées selon la province sélectionnée (aucune sélection = vide,
  // comme avant : on ne montre les villes qu'une fois la province choisie).
  useEffect(() => {
    if (!selectedProvince) {
      setCommunes([]);
      return;
    }
    const province = provincesWithCommunes.find(p => p.id.toString() === selectedProvince);
    setCommunes(province?.communes ?? []);
  }, [selectedProvince, provincesWithCommunes]);

  // ✅ Charger les entreprises — uniquement après montage côté client
  useEffect(() => {
    if (!mounted) return;

    const fetchCompanies = async () => {
      setLoadingCompanies(true);
      try {
        const data = await apiClient.get('/api/companies');
        setCompanies(data || []);
      } catch (error) {
        console.error('Error loading companies:', error);
        setCompanies([]);
      } finally {
        setLoadingCompanies(false);
      }
    };
    fetchCompanies();
  }, [mounted]);

  const handleInputChange = useCallback((field: keyof FilterData, value: string | boolean) => {
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters, [field]: value };
      setTimeout(() => {
        onFilterChange?.(updatedFilters);
      }, 0);
      return updatedFilters;
    });
  }, [onFilterChange]);

  const handleProvinceChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceId = e.target.value;
    setSelectedProvince(provinceId);
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters, provinceId, communeId: '' };
      setTimeout(() => {
        onFilterChange?.(updatedFilters);
      }, 0);
      return updatedFilters;
    });
  }, [onFilterChange]);

  const handleSupportsDriverChange = useCallback((checked: boolean) => {
    setFilters(prev => {
      const updated = { ...prev, supportsDriver: checked };
      setTimeout(() => {
        onFilterChange?.(updated);
      }, 0);
      return updated;
    });
  }, [onFilterChange]);

  const handleResetFilters = useCallback(() => {
    setFilters(initialFilters);
    setSelectedProvince('');
    setTimeout(() => {
      onFilterChange?.(initialFilters);
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFilterChange]);

  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== false);

  const filterContentProps: FilterContentProps = {
    filters,
    provinces,
    communes,
    companies,
    makes,
    selectedProvince,
    loadingProvinces,
    loadingCommunes,
    loadingCompanies,
    hasActiveFilters,
    today,
    onInputChange: handleInputChange,
    onProvinceChange: handleProvinceChange,
    onResetFilters: handleResetFilters,
    onSupportsDriverChange: handleSupportsDriverChange,
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-80 flex-shrink-0">
        <div className="bg-card rounded-lg shadow-sm border border-border sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
          <FilterContent {...filterContentProps} />
        </div>
      </aside>

      {/* Mobile Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={onClose} 
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-card shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
              <h3 className="text-lg font-semibold text-foreground">
                {t('title')}
              </h3>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground p-2 -mr-2 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <FilterContent {...filterContentProps} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FilterSidebar;