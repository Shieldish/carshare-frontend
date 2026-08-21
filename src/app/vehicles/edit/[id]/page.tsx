'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import { Vehicle } from '@/types/vehicle';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

const LocationPickerMap = dynamic(() => import('@/app/components/LocationPickerMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[350px] w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl flex items-center justify-center text-gray-500">
      ...
    </div>
  )
});

interface Province { id: number; name: string; }
interface Commune { id: number; name: string; }

interface VehicleData {
  make: string;
  model: string;
  manufacturingYear: number;
  ratePerDay: number;
  provinceId: number | null;
  communeId: number | null;
  address?: string;
  description?: string;
  locationGps: string;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  type?: string;
  equipment?: string;
  seats?: number;
  ratePerWeek?: number;
  supportsDriver: boolean;
  insuranceExpiryDate?: string;
  technicalControlExpiryDate?: string;
}

interface ExistingImage { id: number; url: string; }

const MAX_IMAGES = 6;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const ACCEPTED_DOC_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_EQUIPMENT_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 2000;

const FUEL_TYPE_VALUES = ['Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL'];
const TRANSMISSION_TYPE_VALUES = ['Manuelle', 'Automatique', 'Semi-automatique'];
const VEHICLE_TYPE_VALUES = [
  'sedan', 'suv', 'suv_coupe', 'hatchback', 'minibus', 'pickup', 'van',
  'minivan', 'truck', 'motorcycle', 'tricycle', 'coupe', 'convertible', 'wagon', 'other',
] as const;

export default function VehicleEditPage() {
  const t = useTranslations('vehicles.form');
  const tEdit = useTranslations('vehicles.edit');
  const tFilters = useTranslations('filters.vehicleTypes');
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [locationGps, setLocationGps] = useState<string>('');
  const [equipmentText, setEquipmentText] = useState('');
  const [descriptionText, setDescriptionText] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-3.3822, 29.3644]);
  const [addressText, setAddressText] = useState('');
  const [isSearchingMap, setIsSearchingMap] = useState(false);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);

  const [registrationFile, setRegistrationFile] = useState<File | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [technicalControlFile, setTechnicalControlFile] = useState<File | null>(null);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('');
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingCommunes, setIsLoadingCommunes] = useState(false);

  const todayDateStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchProvinces = async () => {
      setIsLoadingProvinces(true);
      try {
        const data = await apiClient.get('/api/locations/provinces');
        setProvinces(data || []);
      } catch (err) { console.error("Impossible de charger les provinces", err); } 
      finally { setIsLoadingProvinces(false); }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      const fetchCommunes = async () => {
        setIsLoadingCommunes(true);
        try {
          const data = await apiClient.get(`/api/locations/provinces/${selectedProvince}/communes`);
          setCommunes(data || []);
        } catch (err) { console.error("Impossible de charger les communes", err); } 
        finally { setIsLoadingCommunes(false); }
      };
      fetchCommunes();
    } else { setCommunes([]); }
  }, [selectedProvince]);

  useEffect(() => {
    const fetchVehicle = async () => {
      // ✅ BOUCLIER ANTI-CRASH : On stoppe tout si l'ID est invalide (ex: notification mal configurée)
      if (!id || id === 'undefined' || id === 'null') {
        setError(tEdit('invalidLink'));
        setIsLoading(false);
        return;
      }

      try {
        const data = await apiClient.get(`/api/vehicles/${id}?t=${new Date().getTime()}`);
        setVehicle(data);

        if (data.equipment) setEquipmentText(data.equipment);
        if (data.description) setDescriptionText(data.description);
        if (data.commune?.province?.id) setSelectedProvince(data.commune.province.id.toString());
        if (data.commune?.id) setSelectedCommune(data.commune.id.toString());
        if (data.address) setAddressText(data.address);
        if (data.locationGps) {
          setLocationGps(data.locationGps);
          if (data.locationGps.includes(',')) {
            const parts = data.locationGps.split(',');
            const lat = parseFloat(parts[0].trim());
            const lng = parseFloat(parts[1].trim());
            if (!isNaN(lat) && !isNaN(lng)) setMapCenter([lat, lng]);
          }
        }
        if (data.images && data.images.length > 0) {
          setExistingImages(data.images);
          setImagePreviews(data.images.map((img: ExistingImage) => img.url));
        }
       } catch (err: unknown) {
        console.error('Erreur lors du chargement du véhicule:', err);
        setError(err instanceof Error ? err.message : tEdit('notFound'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchVehicle();
  }, [id, tEdit]);

  const validateImageFile = useCallback((file: File): string | null => {
    if (!file) return t('errors.invalidFile');
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return t('errors.unacceptedFormat', { name: file.name });
    if (file.size > MAX_FILE_SIZE) return t('errors.fileTooLarge', { name: file.name });
    return null;
  }, [t]);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    const safeExistingImages = existingImages || [];
    const safeImageFiles = imageFiles || [];
    const totalImages = safeExistingImages.length + safeImageFiles.length + filesArray.length;

    if (totalImages > MAX_IMAGES) {
      setError(t('errors.tooManyImages', { max: MAX_IMAGES })); return;
    }
    for (const file of filesArray) {
      const validationError = validateImageFile(file);
      if (validationError) { setError(validationError); return; }
    }

    setImageFiles(prev => [...(prev || []), ...filesArray]);
    const newPreviews = filesArray.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...(prev || []), ...newPreviews]);
    e.target.value = ''; setError(null);
  }, [existingImages, imageFiles, validateImageFile, t]);

  const removeExistingImage = async (imageId: number) => {
    try {
      await apiClient.delete(`/api/vehicles/images/${imageId}`);
      const indexToRemove = existingImages.findIndex(img => img.id === imageId);
      if (indexToRemove !== -1) {
        setExistingImages(prev => prev.filter(img => img.id !== imageId));
        setImagePreviews(prev => prev.filter((_, i) => i !== indexToRemove));
      }
    } catch (err: unknown) {
      console.error('Erreur lors de la suppression de l\'image:', err);
      setError(err instanceof Error ? err.message : t('errors.genericSubmitError'));
    }
  };

  const removeNewImage = useCallback((index: number) => {
    const actualIndex = existingImages.length + index;
    URL.revokeObjectURL(imagePreviews[actualIndex]);
    setImageFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setImagePreviews(prevPreviews => prevPreviews.filter((_, i) => i !== actualIndex));
  }, [existingImages.length, imagePreviews]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach(preview => {
        if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
      });
    };
  }, [imagePreviews]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProvince(e.target.value); setSelectedCommune('');
  };

  const handleSearchLocationOnMap = async () => {
    setIsSearchingMap(true);
    const provinceName = provinces.find(p => p.id.toString() === selectedProvince)?.name || '';
    const communeSelect = document.getElementById('communeId') as HTMLSelectElement;
    const communeName = communeSelect && communeSelect.value ? communes.find(c => c.id.toString() === communeSelect.value)?.name : '';
    const queryParts: string[] = [];
    if (addressText) queryParts.push(addressText);
    if (communeName) queryParts.push(communeName);
    if (provinceName) queryParts.push(provinceName);
    queryParts.push("Burundi");

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryParts.join(", "))}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat); const lon = parseFloat(data[0].lon);
        setMapCenter([lat, lon]); setLocationGps(`${lat}, ${lon}`); setError(null);
        setTimeout(() => { mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 150);
      } else {
        setError(tEdit('addressNotFoundManual'));
      }
    } catch (err) { console.error("Erreur lors de la recherche sur la carte", err); } 
    finally { setIsSearchingMap(false); }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setIsSubmitting(true); setError(null);

    // ✅ Le formulaire est long et l'erreur classique en haut de page peut passer inaperçue si
    // l'utilisateur est déjà scrollé près du bouton "Enregistrer" : le toast attire l'attention
    // où qu'il se trouve, en plus du bandeau qui reste visible tant que ce n'est pas corrigé.
    const fail = (message: string, scrollTop = false) => {
      toast.error(message);
      setError(message);
      setIsSubmitting(false);
      if (scrollTop) window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (!vehicle) { fail(tEdit('notLoaded')); return; }
    if (!locationGps) { fail(t('errors.mustIndicateLocation'), true); return; }

    const form = e.currentTarget;
    const formData = new FormData(form);
    const makeValue = (formData.get('make') as string || '').trim();
    const modelValue = (formData.get('model') as string || '').trim();
    const manufacturingYearValue = Number(formData.get('manufacturingYear'));
    const ratePerDayValue = Number(formData.get('ratePerDay'));

    if (!makeValue) { fail(t('errors.missingMake')); return; }
    if (!modelValue) { fail(t('errors.missingModel')); return; }
    if (manufacturingYearValue < 1900 || manufacturingYearValue > new Date().getFullYear() + 1) {
      fail(t('errors.invalidYear')); return;
    }
    if (ratePerDayValue < 1) {
      fail(t('errors.invalidPrice')); return;
    }

    const vehicleData: VehicleData = {
      make: makeValue, model: modelValue,
      manufacturingYear: manufacturingYearValue, ratePerDay: ratePerDayValue,
      provinceId: selectedProvince ? Number(selectedProvince) : null, communeId: selectedCommune ? Number(selectedCommune) : null,
      address: addressText || undefined, description: descriptionText || undefined, locationGps: locationGps,
      mileage: formData.get('mileage') ? Number(formData.get('mileage')) : undefined, fuelType: formData.get('fuelType') as string || undefined,
      transmission: formData.get('transmission') as string || undefined, type: formData.get('type') as string || undefined,
      equipment: equipmentText || undefined, seats: formData.get('seats') ? Number(formData.get('seats')) : undefined,
      ratePerWeek: formData.get('ratePerWeek') ? Number(formData.get('ratePerWeek')) : undefined,
      supportsDriver: formData.get('supportsDriver') === 'on',

      insuranceExpiryDate: (formData.get('insuranceExpiryDate') as string) || undefined,
      technicalControlExpiryDate: (formData.get('technicalControlExpiryDate') as string) || undefined,
    };

    try {
      await apiClient.put(`/api/vehicles/${vehicle.id}`, vehicleData);

      if (imageFiles.length > 0) {
        const imageFormData = new FormData();
        imageFiles.forEach(file => imageFormData.append('images', file));
        await apiClient.upload(`/api/vehicles/${vehicle.id}/images`, imageFormData);
      }

      // L'envoi par lot est conservé et fonctionne parfaitement avec les changements Null-Safe du Backend
      if (registrationFile || insuranceFile || technicalControlFile) {
        const docsFormData = new FormData();
        if (registrationFile) docsFormData.append('registrationFile', registrationFile);
        if (insuranceFile) docsFormData.append('insuranceFile', insuranceFile);
        if (technicalControlFile) docsFormData.append('technicalControlFile', technicalControlFile);
        await apiClient.upload(`/api/vehicles/${vehicle.id}/documents`, docsFormData);
      }

      imagePreviews.forEach(preview => { if (preview.startsWith('blob:')) URL.revokeObjectURL(preview); });
      router.push('/vehicles'); router.refresh();
    } catch (err: unknown) {
      console.error('Erreur lors de la modification du véhicule:', err);
      const message = err instanceof Error ? err.message : tEdit('updateError');
      toast.error(message);
      setError(message);
    } finally { setIsSubmitting(false); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary/5 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">{tEdit('loading')}</p>
        </div>
      </div>
    );
  }

  if (error && !vehicle) {
    return (
      <div className="min-h-screen bg-primary/5 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-xl text-red-600 dark:text-red-400">{error}</p>
          <button onClick={() => router.back()} className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">{tEdit('back')}</button>
        </div>
      </div>
    );
  }

  if (!vehicle) return null;

  return (
    <div className="min-h-screen bg-primary/5 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button onClick={() => router.back()} className="inline-flex items-center text-primary hover:text-primary/80 font-medium transition-colors group">
            <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>{tEdit('back')}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-4">
            <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">{tEdit('title')}</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">{vehicle.make} {vehicle.model}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-4 sm:px-6 md:px-8 py-4 sm:py-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">{tEdit('sectionTitle')}</h2>
            <p className="text-orange-100 mt-1">{tEdit('sectionSubtitle')}</p>
          </div>

          <div className="p-4 sm:p-6 md:p-8">
            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-red-800 dark:text-red-400">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('makeLabel')}</label>
                  <input type="text" name="make" defaultValue={vehicle.make || ''} required className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-4 py-3" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('modelLabel')}</label>
                  <input type="text" name="model" defaultValue={vehicle.model || ''} required className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-4 py-3" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('yearLabel')}</label>
                  <input type="number" name="manufacturingYear" defaultValue={vehicle.manufacturingYear || ''} required min="1900" max={new Date().getFullYear() + 1} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-4 py-3" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('mileageLabelShort')}</label>
                  <input type="number" name="mileage" defaultValue={vehicle.mileage || ''} min="0" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-4 py-3" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('typeVehicleLabel')}</label>
                  <select name="type" defaultValue={vehicle.type || ''} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-4 py-3">
                    <option value="">{t('selectTypePlaceholder')}</option>
                    {VEHICLE_TYPE_VALUES.map((v) => (<option key={v} value={v}>{tFilters(v)}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('fuelLabel')}</label>
                  <select name="fuelType" defaultValue={vehicle.fuelType || ''} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-4 py-3">
                    <option value="">{t('selectPlaceholder')}</option>
                    {FUEL_TYPE_VALUES.map((fuel) => (<option key={fuel} value={fuel}>{t(`fuelTypes.${fuel}`)}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('transmissionLabel')}</label>
                  <select name="transmission" defaultValue={vehicle.transmission || ''} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-4 py-3">
                    <option value="">{t('selectPlaceholder')}</option>
                    {TRANSMISSION_TYPE_VALUES.map((trans) => (<option key={trans} value={trans}>{t(`transmissionTypes.${trans}`)}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('seatsLabelFull')}</label>
                  <input type="number" name="seats" defaultValue={vehicle.seats || ''} min="1" max="50" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-4 py-3" />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{t('pricingSectionTitle')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('ratePerDayLabel')}</label>
                    <input type="number" name="ratePerDay" defaultValue={vehicle.ratePerDay || ''} required min="1" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-4 py-3" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('ratePerWeekLabel')}</label>
                    <input type="number" name="ratePerWeek" defaultValue={vehicle.ratePerWeek || ''} min="1" className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-4 py-3" />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-primary/5 dark:bg-primary/20 rounded-lg border border-primary/10 dark:border-primary/30">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input id="supportsDriver" name="supportsDriver" type="checkbox" defaultChecked={vehicle.supportsDriver || false} className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300 rounded cursor-pointer" />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="supportsDriver" className="font-medium text-gray-700 dark:text-gray-300 cursor-pointer">{t('supportsDriverLabel')}</label>
                      <p className="text-gray-500 dark:text-gray-400">{t('supportsDriverHelpEdit')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{t('locationSectionTitle')}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('provinceLabel')}</label>
                    <select name="provinceId" value={selectedProvince} onChange={handleProvinceChange} disabled={isLoadingProvinces} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-4 py-3 disabled:bg-gray-100 disabled:cursor-not-allowed">
                      <option value="">{isLoadingProvinces ? t('loadingOption') : t('provinceNotSpecified')}</option>
                      {provinces.map((province) => (<option key={province.id} value={province.id}>{province.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('communeLabelFull')}</label>
                    <select name="communeId" id="communeId" value={selectedCommune} onChange={(e) => setSelectedCommune(e.target.value)} disabled={!selectedProvince || isLoadingCommunes || communes.length === 0} className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 shadow-sm focus:border-orange-500 focus:ring-orange-500 px-4 py-3 disabled:bg-gray-100 disabled:cursor-not-allowed">
                      <option value="">{isLoadingCommunes ? t('loadingOption') : !selectedProvince ? tEdit('communeNoProvinceOption') : t('provinceNotSpecified')}</option>
                      {communes.map((commune) => (<option key={commune.id} value={commune.id}>{commune.name}</option>))}
                    </select>
                  </div>
                </div>

                <div className="mt-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('addressOptionalLabel')}
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{tEdit('addressHelp')}</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input type="text" name="address" id="address" value={addressText} onChange={(e) => setAddressText(e.target.value)} className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" placeholder={tEdit('addressPlaceholder')} />
                    <button type="button" onClick={handleSearchLocationOnMap} disabled={isSearchingMap || (!selectedProvince && !addressText)} className="bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-md hover:bg-orange-200 dark:hover:bg-orange-800/60 disabled:opacity-50 transition-colors flex items-center justify-center text-sm font-semibold border border-orange-200 dark:border-orange-800 whitespace-nowrap">
                      {isSearchingMap ? t('centering') : tEdit('centerMapButton')}
                    </button>
                  </div>
                </div>

                <div className="mt-6" ref={mapRef}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('mapLabelFull')}</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{tEdit('mapVerifyHelp')}</p>
                  <LocationPickerMap
                    onLocationSelect={(lat, lng) => setLocationGps(`${lat}, ${lng}`)}
                    centerPosition={mapCenter}
                    forceMarkerPosition={locationGps ? [parseFloat(locationGps.split(',')[0]), parseFloat(locationGps.split(',')[1])] : null}
                  />
                  <input type="hidden" name="locationGps" value={locationGps} />
                  {locationGps ? (
                    <p className="mt-2 text-sm text-green-600 dark:text-green-400 font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {tEdit('locationSaved', { location: locationGps })}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-orange-500 dark:text-orange-400 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {tEdit('locationPending')}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('equipmentLabel')}</label>
                  <span className={`text-xs transition-colors ${equipmentText.length >= MAX_EQUIPMENT_LENGTH ? 'text-red-500 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                    {tEdit('charactersRemaining', { count: MAX_EQUIPMENT_LENGTH - equipmentText.length })}
                  </span>
                </div>
                <textarea
                  name="equipment" value={equipmentText} onChange={(e) => setEquipmentText(e.target.value)} maxLength={MAX_EQUIPMENT_LENGTH} rows={3} placeholder={t('equipmentPlaceholder')}
                  className={`w-full rounded-lg border shadow-sm px-4 py-3 resize-none transition-colors dark:bg-gray-700 dark:text-gray-100 ${equipmentText.length >= MAX_EQUIPMENT_LENGTH ? 'border-red-400 focus:ring-red-500 focus:border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500'}`}
                />
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('descriptionLabel')}</label>
                  <span className={`text-xs transition-colors ${descriptionText.length >= MAX_DESCRIPTION_LENGTH ? 'text-red-500 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                    {tEdit('charactersRemaining', { count: MAX_DESCRIPTION_LENGTH - descriptionText.length })}
                  </span>
                </div>
                <textarea
                  name="description" value={descriptionText} onChange={(e) => setDescriptionText(e.target.value)} maxLength={MAX_DESCRIPTION_LENGTH} rows={4} placeholder={t('descriptionPlaceholder')}
                  className={`w-full rounded-lg border shadow-sm px-4 py-3 resize-none transition-colors dark:bg-gray-700 dark:text-gray-100 ${descriptionText.length >= MAX_DESCRIPTION_LENGTH ? 'border-red-400 focus:ring-red-500 focus:border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500'}`}
                />
              </div>

              {/* ✅ NOUVELLE SECTION : Documents Légaux avec affichage "Intelligent" */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                  {t('legalDocsTitle')}
                  <span className="text-xs bg-primary/10 text-primary dark:bg-primary/30 px-2 py-1 rounded-full border border-primary/20 dark:border-primary/40">
                    {tEdit('optionalUpdateBadge')}
                  </span>
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {tEdit('legalDocsUpdateHelp')}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  {/* Carte Rose */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('registrationLabelShort')}</label>

                      {/* Affichage visuel du document s'il existe et qu'on ne l'a pas remplacé */}
                      {vehicle.registrationDocumentUrl && !registrationFile && (
                        <div className="flex items-center p-2 bg-primary/5 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 rounded-lg mb-3">
                          <svg className="w-4 h-4 text-primary mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span className="text-xs text-primary flex-1 truncate">{tEdit('currentDocSaved')}</span>
                          <a href={vehicle.registrationDocumentUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary hover:underline uppercase ml-2">{tEdit('viewDoc')}</a>
                        </div>
                      )}

                      <input type="file" accept={ACCEPTED_DOC_TYPES.join(',')} onChange={(e) => setRegistrationFile(e.target.files?.[0] || null)} className="w-full text-xs text-gray-600 dark:text-gray-400" />
                      {registrationFile && <p className="text-xs text-green-600 dark:text-green-400 mt-2">✓ {tEdit('replacementLabel', { name: registrationFile.name })}</p>}
                    </div>
                  </div>

                  {/* Assurance */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('insuranceLabelShort')}</label>

                      {/* Affichage visuel du document s'il existe et qu'on ne l'a pas remplacé */}
                      {vehicle.insuranceDocumentUrl && !insuranceFile && (
                        <div className="flex items-center p-2 bg-primary/5 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 rounded-lg mb-3">
                          <svg className="w-4 h-4 text-primary mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span className="text-xs text-primary flex-1 truncate">{tEdit('currentDocSaved')}</span>
                          <a href={vehicle.insuranceDocumentUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary hover:underline uppercase ml-2">{tEdit('viewDoc')}</a>
                        </div>
                      )}

                      <input type="file" accept={ACCEPTED_DOC_TYPES.join(',')} onChange={(e) => setInsuranceFile(e.target.files?.[0] || null)} className="w-full text-xs text-gray-600 dark:text-gray-400 mb-3" />
                      {insuranceFile && <p className="text-xs text-green-600 dark:text-green-400 mb-2">✓ {tEdit('replacementLabel', { name: insuranceFile.name })}</p>}
                    </div>
                    <div className="border-t dark:border-gray-700 pt-3 mt-auto">
                      <label className="block text-xs font-semibold text-primary mb-1">{t('expiryDateLabelShort')}</label>
                      {/* Affichage sécurisé de la date de la base de données */}
                      <input type="date" name="insuranceExpiryDate" defaultValue={vehicle.insuranceExpiryDate ? new Date(vehicle.insuranceExpiryDate).toISOString().split('T')[0] : ''} min={todayDateStr} className="w-full px-2 py-1 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                  </div>

                  {/* Contrôle Technique */}
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('technicalControlLabelShort')}</label>

                      {/* Affichage visuel du document s'il existe et qu'on ne l'a pas remplacé */}
                      {vehicle.technicalControlDocumentUrl && !technicalControlFile && (
                        <div className="flex items-center p-2 bg-primary/5 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 rounded-lg mb-3">
                          <svg className="w-4 h-4 text-primary mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span className="text-xs text-primary flex-1 truncate">{tEdit('currentDocSaved')}</span>
                          <a href={vehicle.technicalControlDocumentUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary hover:underline uppercase ml-2">{tEdit('viewDoc')}</a>
                        </div>
                      )}

                      <input type="file" accept={ACCEPTED_DOC_TYPES.join(',')} onChange={(e) => setTechnicalControlFile(e.target.files?.[0] || null)} className="w-full text-xs text-gray-600 dark:text-gray-400 mb-3" />
                      {technicalControlFile && <p className="text-xs text-green-600 dark:text-green-400 mb-2">✓ {tEdit('replacementLabel', { name: technicalControlFile.name })}</p>}
                    </div>
                    <div className="border-t dark:border-gray-700 pt-3 mt-auto">
                      <label className="block text-xs font-semibold text-primary mb-1">{t('expiryDateLabelShort')}</label>
                      {/* Affichage sécurisé de la date de la base de données */}
                      <input type="date" name="technicalControlExpiryDate" defaultValue={vehicle.technicalControlExpiryDate ? new Date(vehicle.technicalControlExpiryDate).toISOString().split('T')[0] : ''} min={todayDateStr} className="w-full px-2 py-1 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">{tEdit('imagesMaxLabel', { max: MAX_IMAGES })}</label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 sm:p-8 text-center hover:border-orange-400 dark:hover:border-orange-500 transition-colors">
                  <input type="file" accept={ACCEPTED_IMAGE_TYPES.join(',')} onChange={handleImageChange} className="hidden" id="image-upload" multiple disabled={existingImages.length + imageFiles.length >= MAX_IMAGES} />
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{existingImages.length + imageFiles.length}/{MAX_IMAGES} images</span>
                    <label htmlFor="image-upload" className={`inline-flex items-center px-4 py-2 rounded-lg cursor-pointer transition-colors ${existingImages.length + imageFiles.length >= MAX_IMAGES ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-orange-600 text-white hover:bg-orange-700'}`}>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                      {tEdit('addImagesButton')}
                    </label>
                  </div>
                  {imagePreviews.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{tEdit('imagesCountLabel', { count: imagePreviews.length })}</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {imagePreviews.map((preview, index) => {
                          const isExisting = index < existingImages.length;
                          const imageId = isExisting ? existingImages[index].id : undefined;
                          return (
                            <div key={index} className="relative group">
                              <div className="relative w-full h-24">
                              <Image
                                src={preview} alt="" fill unoptimized
                                className="object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-sm"
                              />
                            </div>
                              <button type="button" onClick={() => isExisting ? removeExistingImage(imageId!) : removeNewImage(index - existingImages.length)} className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-lg" title={tEdit('removeImageTitle')}>×</button>
                              <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">{index + 1}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {imagePreviews.length === 0 && (
                    <div className="text-center py-8">
                      <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">{tEdit('clickToAddPhotos')}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">{tEdit('imageFormatsHelp')}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 text-white py-4 px-6 rounded-lg hover:from-orange-700 hover:to-orange-800 disabled:from-orange-300 disabled:to-orange-400 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:hover:shadow-lg flex items-center justify-center">
                  {isSubmitting ? (
                    <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>{tEdit('submitting')}</>
                  ) : (
                    <><svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{tEdit('submit')}</>
                  )}
                </button>
                <button type="button" onClick={() => router.back()} className="px-6 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>{tEdit('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}