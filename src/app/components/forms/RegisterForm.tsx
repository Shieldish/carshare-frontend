'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/apiClient';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getApiErrorMessageKey } from '@/lib/apiErrorMessages';
import { Input, Label, Button } from '@/app/components/ui';

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
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-small" role="alert">
          <span>{error}</span>
        </div>
      )}

      {/* Champs Prénom, Nom */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">
            {t('firstNameLabel')} <span className="text-destructive">*</span>
          </Label>
          <Input
            type="text"
            name="firstName"
            id="firstName"
            required
            value={formData.firstName}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="lastName">
            {t('lastNameLabel')} <span className="text-destructive">*</span>
          </Label>
          <Input
            type="text"
            name="lastName"
            id="lastName"
            required
            value={formData.lastName}
            onChange={handleChange}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">
          {t('emailLabel')} <span className="text-destructive">*</span>
        </Label>
        <Input
          type="email"
          name="email"
          id="email"
          required
          value={formData.email}
          onChange={handleChange}
        />
      </div>

      {/* Champ Mot de passe avec notre propre œil */}
      <div>
        <Label htmlFor="password">
          {t('passwordLabel')} <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            name="password"
            id="password"
            required
            minLength={6}
            className="pr-10 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
            value={formData.password}
            onChange={handleChange}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
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
        <Label htmlFor="confirmPassword">
          {t('confirmPasswordLabel')} <span className="text-destructive">*</span>
        </Label>
        <Input
          type="password"
          name="confirmPassword"
          id="confirmPassword"
          required
          minLength={6}
          className="[&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
          value={formData.confirmPassword}
          onChange={handleChange}
        />
      </div>

      <div>
        <Label htmlFor="phoneNumber">
          {t('phoneLabel')} <span className="text-destructive">*</span>
        </Label>
        <Input
          type="tel"
          name="phoneNumber"
          id="phoneNumber"
          required
          placeholder="Ex: +257 79 12 34 56"
          value={formData.phoneNumber}
          onChange={handleChange}
        />
        <p className="mt-1.5 text-micro text-muted-foreground">
          {t('phoneHelp')}
        </p>
      </div>

      <div className="text-center text-small mb-4">
        <Link href="/register/company" className="font-medium text-primary hover:text-primary/80">
          {t('companyLink')}
        </Link>
      </div>

      <Button type="submit" disabled={isLoading} size="lg" className="w-full">
        {isLoading ? t('submitting') : t('submitButton')}
      </Button>
    </form>
  );
}