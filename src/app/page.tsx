// app/page.tsx
import { serverApiClient } from '@/lib/apiClient'; // ✅ Import du serverApiClient
import { Vehicle } from '@/types/vehicle';
import HomeClient from './components/HomeClient';

// ✅ Type pour les données du slider
export interface HeroSliderData {
  vehicleId: number;
  title: string;
  imageUrl: string;
}

// Fonction pour la liste principale
async function getVehicles(): Promise<Vehicle[]> {
  try {
    console.log('📡 Fetching vehicles...');
    const data = await serverApiClient.get('/api/vehicles');
    console.log('✅ Véhicules récupérés:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error("❌ Erreur de l'API (vehicles):", error);
    return [];
  }
}

// ✅ Fonction pour récupérer les promotions du slider SANS CACHE
async function getFeaturedPromotions(): Promise<HeroSliderData[]> {
  try {
    console.log('🎯 Fetching featured promotions...');
    const data = await serverApiClient.get('/api/promotions/featured');
    
    console.log('🎯 Featured promotions récupérées:', data);
    console.log('📊 Nombre de promotions:', data?.length || 0);
    
    // ✅ Log détaillé de chaque promotion
    if (data && data.length > 0) {
      data.forEach((promo: HeroSliderData, index: number) => {
        console.log(`   ${index + 1}. ${promo.title}`);
        console.log(`      vehicleId: ${promo.vehicleId}`);
        console.log(`      imageUrl: ${promo.imageUrl}`);
      });
    } else {
      console.warn('⚠️ Aucune promotion retournée par l\'API');
    }
    
    return data || [];
  } catch (error) {
    console.error("❌ Erreur de l'API (featured):", error);
    return [];
  }
}

export default async function Home() {
  console.log('🏠 Chargement de la page Home...');
  
  // On lance les deux appels en parallèle pour plus d'efficacité
  const [vehicles, featuredPromotions] = await Promise.all([
    getVehicles(),
    getFeaturedPromotions()
  ]);

  console.log('🚀 Page Home - Données finales:');
  console.log('   - Véhicules:', vehicles.length);
  console.log('   - Promotions:', featuredPromotions.length);

  // On passe les deux listes au composant client
  return <HomeClient vehicles={vehicles} featuredPromotions={featuredPromotions} />;
}