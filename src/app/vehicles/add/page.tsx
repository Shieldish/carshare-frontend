'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import AddVehicleForm from '@/app/components/forms/AddVehicleForm';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, ArrowRight } from 'lucide-react'; // Ajout des icônes

export default function AddVehiclePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/login?redirect=${pathname}`);
    } 
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // 🛡️ LE GARDIEN : Vérification de l'identité
  if (!user.isIdentityVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 max-w-lg w-full rounded-2xl shadow-xl p-8 text-center border-t-4 border-orange-500">
          <ShieldAlert className="w-20 h-20 text-orange-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Vérification d&apos;identité requise
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Pour garantir la sécurité de notre plateforme et protéger vos véhicules, vous devez vérifier votre identité (CNI ou Passeport) avant de pouvoir publier une voiture sur BudaxDrive.
          </p>
          <Link 
            href="/profile"
            className="inline-flex items-center justify-center w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200"
          >
            Vérifier mon identité maintenant
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          <button 
            onClick={() => router.back()}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header avec navigation */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button 
            onClick={() => router.back()}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors group"
          >
            <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* En-tête de page */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Ajouter un Véhicule
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Ajoutez un nouveau véhicule à votre flotte de location
          </p>
        </div>

        {/* Formulaire dans un conteneur moderne */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
              <div className="flex items-center">
                <div className="bg-white/20 rounded-full p-3 mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Informations du véhicule</h2>
                  <p className="text-blue-100 mt-1">Remplissez les détails de votre nouveau véhicule</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <AddVehicleForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}