'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Fuel, Settings, Users, Car, Building2, CheckCircle, XCircle, User, ShieldAlert } from 'lucide-react';
import { Vehicle } from '@/types/vehicle';
import { useAuth } from '@/context/AuthContext';

type VehicleDetailPageProps = {
  params: Promise<{ id: string }>;
};

async function getVehicleDetails(id: string): Promise<Vehicle> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'}/api/vehicles/${id}`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Véhicule non trouvé');
  return await response.json();
}

export default function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 🛡️ NOUVEL ÉTAT POUR L'ALERTE PERMIS DE CONDUIRE
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getVehicleDetails(resolvedParams.id);
        setVehicle(data);
        setCurrentImageIndex(0);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [resolvedParams.id]);

  // MODIFIÉ : Affiche le formulaire si connecté ET permis vérifié
  const handleBookingClick = useCallback(() => {
    if (!user) {
      router.push(`/login?redirect=/vehicles/${vehicle?.id}`);
      return;
    }

    // 🛡️ LE GARDIEN : Vérification du permis de conduire
    if (!user.isDrivingLicenseVerified) {
      setShowVerificationAlert(true);
      return;
    }

    router.push(`/bookings/create?vehicleId=${vehicle?.id}`);
  }, [user, router, vehicle?.id]);

  const goToPreviousImage = useCallback(() => {
    if (!vehicle?.images || vehicle.images.length <= 1) return;
    setCurrentImageIndex((prev) => 
      prev === 0 ? vehicle.images!.length - 1 : prev - 1
    );
  }, [vehicle?.images]);

  const goToNextImage = useCallback(() => {
    if (!vehicle?.images || vehicle.images.length <= 1) return;
    setCurrentImageIndex((prev) => 
      prev === vehicle.images!.length - 1 ? 0 : prev + 1
    );
  }, [vehicle?.images]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!vehicle?.images || vehicle.images.length <= 1) return;
      
      if (e.key === 'ArrowLeft') {
        goToPreviousImage();
      } else if (e.key === 'ArrowRight') {
        goToNextImage();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [vehicle?.images, goToPreviousImage, goToNextImage]);

  // Fonction pour obtenir l'affichage de la localisation - MODIFIÉE
  const getLocationDisplay = (vehicle: Vehicle): string => {
    const parts: string[] = [];

    if (vehicle.address && vehicle.address.trim() !== '') {
      parts.push(vehicle.address);
    }

    // Logique améliorée
    if (vehicle.commune) {
      parts.push(vehicle.commune.name);
      parts.push(vehicle.commune.province.name);
    } else if (vehicle.province) { // Cas où seule la province est définie
      parts.push(vehicle.province.name);
    }

    // Utilise un Set pour retirer les doublons (ex: si l'adresse contient la ville)
    const uniqueParts = [...new Set(parts)];

    if (uniqueParts.length > 0) {
      return uniqueParts.join(', ');
    }

    return 'Localisation non disponible';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900 rounded-full">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">Erreur</h3>
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!vehicle) return null;

  // Gérer les images avec fallback
  const availableImages = vehicle.images && vehicle.images.length > 0 
    ? vehicle.images 
    : [{ id: 0, url: `https://source.unsplash.com/random/1200x600/?car&sig=${vehicle.id}` }];

  const currentImage = availableImages[currentImageIndex];
  const hasMultipleImages = availableImages.length > 1;
  const locationDisplay = getLocationDisplay(vehicle);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button 
            onClick={() => router.back()}
            className="inline-flex items-center text-primary hover:text-primary/80 font-medium transition-colors group"
          >
            <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Retour
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Image Gallery and Main Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Image Gallery */}
          <div className="lg:col-span-2">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl group bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentImage.url}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-full h-auto transition-transform duration-300"
                style={{ aspectRatio: 'auto' }}
                onError={(e) => {
                  e.currentTarget.src = `https://source.unsplash.com/random/1200x600/?car&sig=${vehicle.id}-${currentImageIndex}`;
                }}
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent"></div>
              
              {hasMultipleImages && (
                <>
                  <button
                    onClick={goToPreviousImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300"
                    aria-label="Image précédente"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>

                  <button
                    onClick={goToNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300"
                    aria-label="Image suivante"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                    {availableImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index === currentImageIndex 
                            ? 'bg-white w-6' 
                            : 'bg-white/50 hover:bg-white/80 w-2'
                        }`}
                        aria-label={`Image ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
              
              {/* Image Counter */}
              {hasMultipleImages && (
                <div className="absolute top-6 left-6 bg-black/60 text-white px-3 py-2 rounded-lg backdrop-blur-sm">
                  <span className="text-sm">
                    {currentImageIndex + 1} / {availableImages.length}
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {hasMultipleImages && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-foreground mb-3">
                  Photos du véhicule ({availableImages.length})
                </h4>
                <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                  {availableImages.map((image, index) => (
                    <button 
                      key={image.id || index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`rounded-lg overflow-hidden border-2 transition-all hover:shadow-md transform hover:-translate-y-1 ${
                        index === currentImageIndex 
                          ? 'border-primary ring-2 ring-primary/20 shadow-lg' 
                          : 'border-border hover:border-primary'
                      }`}
                    >
                      <div className="relative h-16 w-full bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.url}
                          alt={`Photo ${index + 1}`} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Utilisez les flèches du clavier pour naviguer
                </p>
              </div>
            )}
          </div>

          {/* Main Information Sidebar */}
          <div className="space-y-6">
            {/* Titre et statut */}
            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold text-foreground">
                  {vehicle.make} {vehicle.model}
                </h1>
                {vehicle.isAvailable !== undefined && (
                  <div className={`flex items-center px-3 py-2 rounded-full text-sm font-medium ${
                    vehicle.isAvailable 
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                      : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  }`}>
                    {vehicle.isAvailable ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    {vehicle.isAvailable ? 'Disponible' : 'Non disponible'}
                  </div>
                )}
              </div>

              {/* Entreprise */}
              {vehicle.companyName && (
                <div className="flex items-center text-primary mb-4 bg-primary/10 px-4 py-3 rounded-lg">
                  <Building2 className="w-5 h-5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Proposé par</p>
                    <p className="text-lg">{vehicle.companyName}</p>
                  </div>
                </div>
              )}

              {/* Informations de base */}
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="w-5 h-5 mr-3" />
                  <div>
                    <span className="font-medium">Année:</span>
                    <span className="ml-2">{vehicle.manufacturingYear}</span>
                  </div>
                </div>
                
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="w-5 h-5 mr-3" />
                  <div>
                    <span className="font-medium">Localisation:</span>
                    <span className="ml-2">{locationDisplay}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarification */}
            <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Tarification</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center py-3 border-b border-border">
                  <span className="text-muted-foreground font-medium">Prix par jour</span>
                  <span className="text-2xl font-bold text-primary">
                    {vehicle.ratePerDay?.toLocaleString()} FBu
                  </span>
                </div>
                {vehicle.ratePerWeek && (
                  <div className="flex justify-between items-center py-3">
                    <span className="text-muted-foreground font-medium">Prix par semaine</span>
                    <span className="text-xl font-semibold text-green-600 dark:text-green-400">
                      {vehicle.ratePerWeek?.toLocaleString()} FBu
                    </span>
                  </div>
                )}
              </div>

              {/* 🛡️ MESSAGE D'ALERTE SI PERMIS NON VÉRIFIÉ */}
              {showVerificationAlert && (
                <div className="mb-4 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-start">
                    <ShieldAlert className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                    <div className="ml-3">
                      <h4 className="text-sm font-bold text-orange-800 dark:text-orange-200">
                        Permis de conduire requis
                      </h4>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                        Pour des raisons de sécurité, vous devez fournir une copie de votre permis de conduire avant de louer un véhicule.
                      </p>
                      <button
                        onClick={() => router.push('/profile')}
                        className="mt-3 text-sm bg-orange-600 hover:bg-orange-700 text-white py-1.5 px-4 rounded-md font-medium transition-colors"
                      >
                        Vérifier mon permis maintenant
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Boutons d'action */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleBookingClick}
                  disabled={vehicle.isAvailable === false}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {vehicle.isAvailable === false ? 'Non disponible' : 'Réserver ce véhicule'}
                </button>
                
                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 transition-colors font-medium"
                >
                  Voir d&apos;autres véhicules
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Spécifications détaillées */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Spécifications techniques */}
          <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
            <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center">
              <Car className="w-6 h-6 mr-3 text-primary" />
              Spécifications techniques
            </h3>
            
            <div className="grid grid-cols-2 gap-6">
              {[
                { 
                  icon: <Car className="w-5 h-5" />, 
                  label: 'Kilométrage', 
                  value: vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'Non spécifié',
                  condition: true
                },
                { 
                  icon: <Fuel className="w-5 h-5" />, 
                  label: 'Carburant', 
                  value: vehicle.fuelType || 'Non spécifié',
                  condition: true
                },
                { 
                  icon: <Settings className="w-5 h-5" />, 
                  label: 'Transmission', 
                  value: vehicle.transmission || 'Non spécifiée',
                  condition: true
                },
                { 
                  icon: <Users className="w-5 h-5" />, 
                  label: 'Nombre de sièges', 
                  value: vehicle.seats ? `${vehicle.seats} sièges` : 'Non spécifié',
                  condition: true
                },
                { 
                  icon: <User className="w-5 h-5" />, 
                  label: 'Chauffeur', 
                  value: vehicle.supportsDriver ? 'Inclus ✅' : 'Sans chauffeur',
                  condition: true
                }
              ].map((spec, index) => (
                <div key={index} className="bg-muted rounded-lg p-4">
                  <div className="flex items-center text-muted-foreground mb-2">
                    {spec.icon}
                    <span className="ml-2 text-sm font-medium">{spec.label}</span>
                  </div>
                  <div className="text-lg font-semibold text-foreground">
                    {spec.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Description et équipements */}
          <div className="space-y-6">
            {vehicle.description && (
              <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
                <h3 className="text-xl font-semibold text-foreground mb-4">Description</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {vehicle.description}
                </p>
              </div>
            )}

            {vehicle.equipment && (
              <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
                <h3 className="text-xl font-semibold text-foreground mb-4">Équipements</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {vehicle.equipment}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Informations complémentaires */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Services inclus</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              {[
                'Assurance tous risques incluse',
                'Support client 24h/24, 7j/7',
                'Assistance dépannage',
                'Annulation flexible'
              ].map((info, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-3 text-green-500 dark:text-green-400 flex-shrink-0" />
                  <span>{info}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-lg border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-4">Informations importantes</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start">
                <svg className="w-4 h-4 mr-3 mt-0.5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Permis de conduire valide requis</span>
              </div>
              <div className="flex items-start">
                <svg className="w-4 h-4 mr-3 mt-0.5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Inspection du véhicule avant et après location</span>
              </div>
              <div className="flex items-start">
                <svg className="w-4 h-4 mr-3 mt-0.5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Carburant à la charge du locataire</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}