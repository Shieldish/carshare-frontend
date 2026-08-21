'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';

const LocationPickerMap = dynamic(() => import('../LocationPickerMap'), {
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
  make: string; model: string; manufacturingYear: number; ratePerDay: number;
  provinceId: number | null; communeId: number | null; address?: string;
  description?: string; locationGps: string; mileage?: number; fuelType?: string;
  transmission?: string; type?: string; equipment?: string; seats?: number;
  ratePerWeek?: number; supportsDriver: boolean;
  insuranceDeclarationConfirmed: boolean;
  // ✅ NOUVEAU : On s'attend à recevoir les dates d'expiration
  insuranceExpiryDate: string;
  technicalControlExpiryDate: string;
}

const MAX_IMAGES = 6;
const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const ACCEPTED_DOC_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_EQUIPMENT_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 1000;
const FUEL_TYPE_VALUES = ['Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL'];
const TRANSMISSION_TYPE_VALUES = ['Manuelle', 'Automatique', 'Semi-automatique'];

const VEHICLE_TYPE_VALUES = [
  'sedan', 'suv', 'suv_coupe', 'hatchback', 'minibus', 'pickup', 'van',
  'minivan', 'truck', 'motorcycle', 'tricycle', 'coupe', 'convertible', 'wagon', 'other',
] as const;

export default function AddVehicleForm() {
  const t = useTranslations('vehicles.form');
  const tFilters = useTranslations('filters.vehicleTypes');
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [locationGps, setLocationGps] = useState<string>('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([-3.3822, 29.3644]);
  const [addressText, setAddressText] = useState('');
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [equipmentText, setEquipmentText] = useState('');
  const [descriptionText, setDescriptionText] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [registrationFile, setRegistrationFile] = useState<File | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [technicalControlFile, setTechnicalControlFile] = useState<File | null>(null);

  const [insuranceConfirmed, setInsuranceConfirmed] = useState(false);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingCommunes, setIsLoadingCommunes] = useState(false);

  useEffect(() => {
    const fetchProvinces = async () => {
      setIsLoadingProvinces(true);
      try {
        const data = await apiClient.get('/api/locations/provinces');
        setProvinces(data || []);
      } catch (err) {
        console.error("Erreur lors de la récupération des provinces:", err);
        setError(t('errors.provincesLoadError'));
      } finally {
        setIsLoadingProvinces(false); 
      }
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
        } catch (err) {
          console.error("Erreur lors de la récupération des communes:", err);
          setError(t('errors.communesLoadError'));
        } finally {
          setIsLoadingCommunes(false); 
        }
      };
      fetchCommunes();
    } else { 
      setCommunes([]); 
    }
  }, [selectedProvince]);

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
        setError(t('errors.addressNotFound'));
      }
    } catch (err) {
      console.error("Erreur lors de la recherche sur la carte:", err);
    } finally { 
      setIsSearchingMap(false); 
    }
  };

  const validateImageFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return t('errors.invalidImageFormat');
    if (file.size > MAX_FILE_SIZE) return t('errors.imageTooLarge');
    return null;
  }, [t]);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (imageFiles.length + filesArray.length > MAX_IMAGES) {
        setError(t('errors.tooManyImages', { max: MAX_IMAGES })); return;
      }
      for (const file of filesArray) {
        const validationError = validateImageFile(file);
        if (validationError) { setError(validationError); return; }
      }
      setImageFiles(prev => [...prev, ...filesArray]);
      setImagePreviews(prev => [...prev, ...filesArray.map(file => URL.createObjectURL(file))]);
      e.target.value = ''; setError(null);
    }
  }, [imageFiles.length, validateImageFile, t]);

  const removeImage = useCallback((index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  }, [imagePreviews]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProvince(e.target.value);
    const communeSelect = document.getElementById('communeId') as HTMLSelectElement;
    if (communeSelect) communeSelect.value = '';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setIsLoading(true); setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const provinceIdValue = (form.elements.namedItem('provinceId') as HTMLSelectElement)?.value;
    const communeIdValue = (form.elements.namedItem('communeId') as HTMLSelectElement)?.value;
    const makeValue = (formData.get('make') as string || '').trim();
    const modelValue = (formData.get('model') as string || '').trim();
    const manufacturingYearValue = Number(formData.get('manufacturingYear'));
    const ratePerDayValue = Number(formData.get('ratePerDay'));
    const insuranceExpiryDateValue = formData.get('insuranceExpiryDate') as string;
    const technicalControlExpiryDateValue = formData.get('technicalControlExpiryDate') as string;

    // ✅ Validation explicite de chaque champ obligatoire : le formulaire est long, l'utilisateur
    // est souvent scrollé tout en bas près du bouton "Enregistrer" quand il soumet, donc le bandeau
    // d'erreur en haut de page peut passer inaperçu. Le toast attire l'attention où qu'il se trouve.
    const fail = (message: string, scrollTop = false) => {
      toast.error(message);
      setError(message);
      setIsLoading(false);
      if (scrollTop) window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (!makeValue) { fail(t('errors.missingMake')); return; }
    if (!modelValue) { fail(t('errors.missingModel')); return; }
    if (!manufacturingYearValue || manufacturingYearValue < 1900) { fail(t('errors.invalidYear')); return; }
    if (!ratePerDayValue || ratePerDayValue <= 0) { fail(t('errors.invalidPrice')); return; }
    if (!locationGps) { fail(t('errors.clickMap'), true); return; }
    if (!registrationFile || !insuranceFile || !technicalControlFile) { fail(t('errors.missingDocs')); return; }
    if (!insuranceExpiryDateValue) { fail(t('errors.missingInsuranceExpiryDate')); return; }
    if (!technicalControlExpiryDateValue) { fail(t('errors.missingTechnicalControlExpiryDate')); return; }
    if (!insuranceConfirmed) { fail(t('errors.missingInsuranceConfirmation')); return; }

    const vehicleData: VehicleData = {
      make: makeValue, model: modelValue,
      manufacturingYear: manufacturingYearValue, ratePerDay: ratePerDayValue,
      provinceId: provinceIdValue ? Number(provinceIdValue) : null, communeId: communeIdValue ? Number(communeIdValue) : null,
      address: formData.get('address') as string || undefined, description: descriptionText || undefined, locationGps: locationGps,
      mileage: formData.get('mileage') ? Number(formData.get('mileage')) : undefined, fuelType: formData.get('fuelType') as string || undefined,
      transmission: formData.get('transmission') as string || undefined, type: formData.get('type') as string || undefined,
      equipment: equipmentText || undefined, seats: formData.get('seats') ? Number(formData.get('seats')) : undefined,
      ratePerWeek: formData.get('ratePerWeek') ? Number(formData.get('ratePerWeek')) : undefined,
      supportsDriver: formData.get('supportsDriver') === 'on',
      insuranceDeclarationConfirmed: insuranceConfirmed,
      insuranceExpiryDate: insuranceExpiryDateValue,
      technicalControlExpiryDate: technicalControlExpiryDateValue,
    };

    try {
      const newVehicle = await apiClient.post('/api/vehicles', vehicleData);
      const vehicleId = newVehicle?.id || newVehicle?.data?.id || newVehicle?.vehicleId;

      if (imageFiles.length > 0) {
        const imageFormData = new FormData();
        imageFiles.forEach(file => imageFormData.append('images', file));
        await apiClient.upload(`/api/vehicles/${vehicleId}/images`, imageFormData);
      }

      const docsFormData = new FormData();
      docsFormData.append('registrationFile', registrationFile);
      docsFormData.append('insuranceFile', insuranceFile);
      docsFormData.append('technicalControlFile', technicalControlFile);
      await apiClient.upload(`/api/vehicles/${vehicleId}/documents`, docsFormData);

      imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
      router.push('/vehicles'); router.refresh();
    } catch (err: unknown) {
      console.error("Erreur de soumission:", err);
      const message = err instanceof Error ? err.message : t('errors.genericSubmitError');
      toast.error(message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Utilitaire pour obtenir la date du jour (pour empêcher les dates passées)
  const todayDateStr = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">{t('makeLabel')}</label><input type="text" name="make" required className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></div>
          <div><label className="block text-sm font-medium mb-1">{t('modelLabel')}</label><input type="text" name="model" required className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">{t('yearLabel')}</label><input type="number" name="manufacturingYear" required min="1900" max={new Date().getFullYear() + 1} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></div>
          <div><label className="block text-sm font-medium mb-1">{t('mileageLabel')}</label><input type="number" name="mileage" min="0" className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">{t('technicalSectionTitle')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div><label className="block text-sm font-medium mb-1">{t('typeLabel')}</label><select name="type" className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"><option value="">{t('selectPlaceholder')}</option>{VEHICLE_TYPE_VALUES.map(v => <option key={v} value={v}>{tFilters(v)}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">{t('fuelLabel')}</label><select name="fuelType" className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"><option value="">{t('selectPlaceholder')}</option>{FUEL_TYPE_VALUES.map(f => <option key={f} value={f}>{t(`fuelTypes.${f}`)}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">{t('transmissionLabel')}</label><select name="transmission" className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"><option value="">{t('selectPlaceholder')}</option>{TRANSMISSION_TYPE_VALUES.map(tr => <option key={tr} value={tr}>{t(`transmissionTypes.${tr}`)}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">{t('seatsLabel')}</label><input type="number" name="seats" min="1" max="50" className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">{t('equipmentLabel')}</label>
            <input type="text" name="equipment" value={equipmentText} onChange={(e) => setEquipmentText(e.target.value)} maxLength={MAX_EQUIPMENT_LENGTH} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder={t('equipmentPlaceholder')} />
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">{t('pricingSectionTitle')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">{t('ratePerDayLabel')}</label><input type="number" name="ratePerDay" required min="0" className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></div>
            <div><label className="block text-sm font-medium mb-1">{t('ratePerWeekLabel')}</label><input type="number" name="ratePerWeek" min="0" className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /></div>
          </div>
          <div className="mt-6 p-4 bg-primary/5 dark:bg-primary/20 rounded-lg border border-primary/10 dark:border-primary/30">
            <div className="flex items-start">
              <input id="supportsDriver" name="supportsDriver" type="checkbox" className="focus:ring-primary h-4 w-4 mt-1 text-primary border-gray-300 rounded cursor-pointer" />
              <div className="ml-3 text-sm"><label htmlFor="supportsDriver" className="font-medium cursor-pointer">{t('supportsDriverLabel')}</label><p className="text-gray-500">{t('supportsDriverHelp')}</p></div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">{t('locationSectionTitle')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">{t('provinceLabel')}</label><select name="provinceId" value={selectedProvince} onChange={handleProvinceChange} disabled={isLoadingProvinces} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"><option value="">{isLoadingProvinces ? t('loadingOption') : t('provinceNotSpecified')}</option>{provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">{t('communeLabel')}</label><select id="communeId" name="communeId" disabled={!selectedProvince} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"><option value="">{isLoadingCommunes ? t('loadingOption') : t('provinceNotSpecified')}</option>{communes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          </div>
          <div className="mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <label className="block text-sm font-medium mb-1">{t('addressLabel')}</label>
            <div className="flex flex-col sm:flex-row gap-2"><input type="text" name="address" value={addressText} onChange={(e) => setAddressText(e.target.value)} className="flex-1 min-w-0 px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" /><button type="button" onClick={handleSearchLocationOnMap} disabled={isSearchingMap} className="bg-primary/10 text-primary px-4 py-2 rounded-md font-semibold whitespace-nowrap">{isSearchingMap ? t('centering') : t('centerButton')}</button></div>
          </div>
          <div className="mt-6" ref={mapRef}><label className="block text-sm font-medium mb-1">{t('mapLabel')}</label><LocationPickerMap onLocationSelect={(lat, lng) => setLocationGps(`${lat}, ${lng}`)} centerPosition={mapCenter} forceMarkerPosition={locationGps ? [parseFloat(locationGps.split(',')[0]), parseFloat(locationGps.split(',')[1])] : null} /><input type="hidden" name="locationGps" value={locationGps} /></div>
        </div>

        <div className="border-t pt-6">
          <label className="block text-sm font-medium mb-1">{t('descriptionLabel')}</label>
          <textarea name="description" rows={4} value={descriptionText} onChange={(e) => setDescriptionText(e.target.value)} maxLength={MAX_DESCRIPTION_LENGTH} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" placeholder={t('descriptionPlaceholder')} />
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">{t('legalDocsTitle')} <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">{t('legalDocsRequiredBadge')}</span></h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
              <label className="block text-sm font-medium mb-2">{t('registrationLabel')}</label>
              <input type="file" accept={ACCEPTED_DOC_TYPES.join(',')} required onChange={(e) => setRegistrationFile(e.target.files?.[0] || null)} className="w-full text-xs" />
              {registrationFile && <p className="text-xs text-green-600 mt-2">✓ {registrationFile.name}</p>}
            </div>

            {/* ✅ NOUVEAU : Champ Date Assurance */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
              <label className="block text-sm font-medium mb-2">{t('insuranceLabel')}</label>
              <input type="file" accept={ACCEPTED_DOC_TYPES.join(',')} required onChange={(e) => setInsuranceFile(e.target.files?.[0] || null)} className="w-full text-xs mb-3" />
              {insuranceFile && <p className="text-xs text-green-600 mb-2">✓ {insuranceFile.name}</p>}
              <div className="border-t dark:border-gray-700 pt-2 mt-2">
                <label className="block text-xs font-semibold text-primary mb-1">{t('expiryDateLabel')}</label>
                <input type="date" name="insuranceExpiryDate" required min={todayDateStr} className="w-full px-2 py-1 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600" />
              </div>
            </div>

            {/* ✅ NOUVEAU : Champ Date Contrôle Technique */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
              <label className="block text-sm font-medium mb-2">{t('technicalControlLabel')}</label>
              <input type="file" accept={ACCEPTED_DOC_TYPES.join(',')} required onChange={(e) => setTechnicalControlFile(e.target.files?.[0] || null)} className="w-full text-xs mb-3" />
              {technicalControlFile && <p className="text-xs text-green-600 mb-2">✓ {technicalControlFile.name}</p>}
              <div className="border-t dark:border-gray-700 pt-2 mt-2">
                <label className="block text-xs font-semibold text-primary mb-1">{t('expiryDateLabel')}</label>
                <input type="date" name="technicalControlExpiryDate" required min={todayDateStr} className="w-full px-2 py-1 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600" />
              </div>
            </div>

          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">{t('imagesTitle')}</h3>
          <input type="file" multiple accept={ACCEPTED_IMAGE_TYPES.join(',')} onChange={handleImageChange} disabled={imageFiles.length >= MAX_IMAGES} className="mb-4" />
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {imagePreviews.map((p, i) => (
                <div key={i} className="relative group w-full h-24">
                  <Image src={p} alt="" fill className="object-cover rounded-lg border shadow-sm" unoptimized />
                  <button type="button" onClick={() => removeImage(i)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-primary/5 dark:bg-primary/20 p-4 rounded-lg border border-primary/20 dark:border-primary/30 mb-6">
          <div className="flex items-start space-x-3">
            <input
              id="insurance-check"
              type="checkbox"
              checked={insuranceConfirmed}
              onChange={(e) => setInsuranceConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              required
            />
            <label htmlFor="insurance-check" className="text-sm text-gray-700 dark:text-gray-300 leading-tight">
              {t('insuranceCheckLabel')}
            </label>
          </div>
        </div>

        <div className="pt-6">
          <button type="submit" disabled={isLoading} className="w-full bg-primary text-primary-foreground py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium">
            {isLoading ? t('submittingAdd') : t('submitAdd')}
          </button>
        </div>
      </form>
    </div>
  );
}