'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/apiClient';

/**
 * Récupère une seule fois par chargement de page les ids des véhicules que
 * l'utilisateur connecté a mis en favoris — pour marquer les cœurs "remplis"
 * sur n'importe quelle liste de véhicules (accueil, recherche, mes véhicules...)
 * sans devoir récupérer les objets véhicules complets à chaque fois.
 *
 * Retourne `undefined` tant que la liste n'a pas encore été chargée (ou pour
 * un visiteur non connecté), afin de distinguer "on ne sait pas encore" de
 * "aucun favori" — les VehicleCard traitent les deux cas comme "non favori".
 */
export function useFavoriteIds(): Set<number> | undefined {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<number> | undefined>(undefined);

  useEffect(() => {
    if (!user) {
      setFavoriteIds(undefined);
      return;
    }

    let cancelled = false;

    apiClient
      .get('/api/favorites/ids')
      .then((ids: unknown) => {
        if (!cancelled && Array.isArray(ids)) {
          setFavoriteIds(new Set(ids));
        }
      })
      .catch((error) => {
        console.error('Impossible de charger la liste des favoris:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return favoriteIds;
}
