'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { Eye, EyeOff } from 'lucide-react';

interface RegisterFormProps {
  redirectTo?: string;
}

export default function RegisterForm({ redirectTo = '/' }: RegisterFormProps) {
  const router = useRouter();

  // --- ÉTATS DU COMPOSANT ---
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Un seul état pour l'œil du mot de passe principal
  const [showPassword, setShowPassword] = useState(false);

  // --- GESTION DES CHANGEMENTS ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- SOUMISSION DU FORMULAIRE ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Vérification de la correspondance des mots de passe
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);

    try {
      // ✅ CORRECTION : Création explicite de l'objet à envoyer, 
      // ce qui évite de créer une variable "confirmPassword" ou "_" non utilisée.
      const dataToSend = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
      };

      await apiClient.post('/api/auth/register', dataToSend);

      const loginRedirect = redirectTo !== '/' ? `?registration=success&redirect=${encodeURIComponent(redirectTo)}` : '?registration=success';
      router.push(`/login${loginRedirect}`);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'La création du compte a échoué.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
          <span>{error}</span>
        </div>
      )}

      {/* Champs Prénom, Nom */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            Prénom <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            name="firstName" 
            id="firstName" 
            required 
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
            value={formData.firstName} 
            onChange={handleChange} 
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Nom <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            name="lastName" 
            id="lastName" 
            required 
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
            value={formData.lastName} 
            onChange={handleChange} 
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email <span className="text-red-500">*</span>
        </label>
        <input 
          type="email" 
          name="email" 
          id="email" 
          required 
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
          value={formData.email} 
          onChange={handleChange} 
        />
      </div>
      
      {/* Champ Mot de passe avec notre propre œil */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Mot de passe <span className="text-red-500">*</span>
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input 
            type={showPassword ? 'text' : 'password'} 
            name="password" 
            id="password" 
            required 
            minLength={6} 
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" 
            value={formData.password} 
            onChange={handleChange} 
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              onMouseDown={() => setShowPassword(true)}
              onMouseUp={() => setShowPassword(false)}
              onMouseLeave={() => setShowPassword(false)}
              onTouchStart={() => setShowPassword(true)}
              onTouchEnd={() => setShowPassword(false)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Champ Confirmation Mot de passe (SANS ŒIL) */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirmer le mot de passe <span className="text-red-500">*</span>
        </label>
        <input 
          type="password" 
          name="confirmPassword" 
          id="confirmPassword" 
          required 
          minLength={6} 
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" 
          value={formData.confirmPassword} 
          onChange={handleChange} 
        />
      </div>
      
      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
          Numéro de téléphone <span className="text-red-500">*</span>
        </label>
        <input 
          type="tel" 
          name="phoneNumber" 
          id="phoneNumber" 
          required
          placeholder="Ex: +257 79 12 34 56"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
          value={formData.phoneNumber} 
          onChange={handleChange} 
        />
        <p className="mt-1 text-xs text-gray-500">
          Nécessaire pour la communication entre locataires et propriétaires
        </p>
      </div>

      <div className="text-center text-sm mb-4">
        <Link href="/register/company" className="font-medium text-blue-600 hover:text-blue-500">
          Vous êtes une agence ? Créez un compte professionnel
        </Link>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          {isLoading ? 'Création en cours...' : 'Créer mon compte'}
        </button>
      </div>
    </form>
  );
}