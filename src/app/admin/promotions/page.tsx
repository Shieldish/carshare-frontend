'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import PromotionRow from './PromotionRow';

// Type pour les données reçues de l'API
export interface BoostAdminData {
  boostId: string;
  vehicleId: number;
  vehicleMake: string;
  vehicleModel: string;
  vehicleImageUrl?: string; // ✅ NOUVEAU CHAMP
  ownerEmail: string;
  boostType: 'STANDARD' | 'PREMIUM' | 'ULTRA';
  expiresAt: string;
  heroImageUrl: string | null;
}

export default function AdminPromotionsPage() {
  const [boosts, setBoosts] = useState<BoostAdminData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Sécurité : Vérifier si l'utilisateur est admin
    if (!authLoading) {
      if (!user || user.role !== 'ADMIN') {
        router.push('/'); // Rediriger si non-admin
        return;
      }
    }
  }, [user, authLoading, router]);

  const fetchBoosts = async () => {
    try {
      const data = await apiClient.get('/api/promotions/admin/boosts');
      setBoosts(data || []);
    } catch {
      setError('Impossible de charger les promotions.');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchBoosts();
    }
  }, [user]);

  const handleImageUploadSuccess = (boostId: string, newImageUrl: string) => {
    // Mettre à jour la liste sans recharger toute la page
    setBoosts(prevBoosts =>
      prevBoosts.map(boost =>
        boost.boostId === boostId ? { ...boost, heroImageUrl: newImageUrl } : boost
      )
    );
    // Rafraîchir après 2s pour s'assurer que tout est synchronisé
    setTimeout(() => fetchBoosts(), 2000);
  };

  // ✅ NOUVELLE FONCTION : Gérer la suppression de l'image dans l'état local
  const handleImageDeleteSuccess = (boostId: string) => {
    setBoosts(prevBoosts =>
      prevBoosts.map(boost =>
        boost.boostId === boostId ? { ...boost, heroImageUrl: null } : boost
      )
    );
  };

  if (authLoading || isLoading) return <div className="text-center p-12">Chargement...</div>;
  if (error) return <div className="text-center p-12 text-red-500">{error}</div>;
  if (!user || user.role !== 'ADMIN') return null; // Pendant la redirection

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Gestion des Promotions Hero-Section</h1>
      <div className="bg-card rounded-lg shadow border overflow-x-auto">
        <table className="min-w-full divide-y">
          <thead className="bg-muted/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Véhicule</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Propriétaire</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Type de Boost</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Expiration</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Image pour le Slider</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {boosts.length > 0 ? (
              boosts.map(boost => (
                <PromotionRow 
                  key={boost.boostId} 
                  boost={boost} 
                  onUploadSuccess={handleImageUploadSuccess}
                  onDeleteSuccess={handleImageDeleteSuccess}
                />
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted-foreground">Aucune promotion active pour le moment.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}