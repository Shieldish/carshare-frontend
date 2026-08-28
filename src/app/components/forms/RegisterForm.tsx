'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getApiErrorMessageKey } from '@/lib/apiErrorMessages';

interface RegisterFormProps {
  redirectTo?: string;
}

export default function RegisterForm({ redirectTo = '/' }: RegisterFormProps) {
  const t = useTranslations('auth.register');
  const tToast = useTranslations('toast.errors');
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
      setError(t('passwordMismatch'));
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
      setError(tToast(getApiErrorMessageKey(err)));
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
            {t('firstNameLabel')} <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            name="firstName" 
            id="firstName" 
            required 
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
            value={formData.firstName} 
            onChange={handleChange} 
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            {t('lastNameLabel')} <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            name="lastName" 
            id="lastName" 
            required 
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
            value={formData.lastName} 
            onChange={handleChange} 
          />
        </div>
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          {t('emailLabel')} <span className="text-red-500">*</span>
        </label>
        <input 
          type="email" 
          name="email" 
          id="email" 
          required 
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
          value={formData.email} 
          onChange={handleChange} 
        />
      </div>
      
      {/* Champ Mot de passe avec notre propre œil */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          {t('passwordLabel')} <span className="text-red-500">*</span>
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input 
            type={showPassword ? 'text' : 'password'} 
            name="password" 
            id="password" 
            required 
            minLength={6} 
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary pr-10 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" 
            value={formData.password} 
            onChange={handleChange} 
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Champ Confirmation Mot de passe (SANS ŒIL) */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          {t('confirmPasswordLabel')} <span className="text-red-500">*</span>
        </label>
        <input 
          type="password" 
          name="confirmPassword" 
          id="confirmPassword" 
          required 
          minLength={6} 
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" 
          value={formData.confirmPassword} 
          onChange={handleChange} 
        />
      </div>
      
      <div>
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
          {t('phoneLabel')} <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          name="phoneNumber"
          id="phoneNumber"
          required
          placeholder="Ex: +257 79 12 34 56"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          value={formData.phoneNumber}
          onChange={handleChange}
        />
        <p className="mt-1 text-xs text-gray-500">
          {t('phoneHelp')}
        </p>
      </div>

      <div className="text-center text-sm mb-4">
        <Link href="/register/company" className="font-medium text-primary hover:text-primary/80">
          {t('companyLink')}
        </Link>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-primary/40"
        >
          {isLoading ? t('submitting') : t('submitButton')}
        </button>
      </div>
    </form>
  );
}