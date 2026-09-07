'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, ApiError } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { Loader2, ArrowLeft, Building2, Eye, EyeOff, Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getApiErrorMessageKey } from '@/lib/apiErrorMessages';
import { Input, Label, Button } from '@/app/components/ui';

export default function RegisterCompanyPage() {
  const t = useTranslations('auth.registerCompany');
  const tToast = useTranslations('toast.errors');
  const router = useRouter();
  const { login } = useAuth(); // ✅ Connexion automatique après inscription

  const [formData, setFormData] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // ✅ NOUVEAU : État pour la durée d'abonnement initial
  const [duration, setDuration] = useState<1 | 12>(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    setIsLoading(true);

    try {
      const dataToSend = {
        companyName: formData.companyName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phoneNumber,
        durationInMonths: duration // ✅ On envoie la durée au backend
      };

      const response = await apiClient.post('/api/auth/register-company', dataToSend);

      // ✅ CONNEXION AUTOMATIQUE : pas de passage par /login
      if (response.token) {
        login(response.token);
      }

      // ✅ REDIRECTION DIRECTE VERS LA CAISSE
      router.push(`/payment?paymentId=${response.paymentId}&type=registration`);

    } catch (err: unknown) {
      console.error("Erreur lors de la création de l'entreprise:", err);

      // Détection du conflit de nom d'entreprise à partir du message brut renvoyé
      // par le backend (pas de code dédié pour ce cas précis) — la comparaison
      // reste sur le texte source (toujours en français), seul l'affichage est traduit.
      const rawMessage = err instanceof ApiError ? err.message : '';
      const isCompanyNameConflict =
        rawMessage.includes('existe déjà') ||
        rawMessage.includes('409 CONFLICT') ||
        rawMessage.includes('companies_name_key') ||
        rawMessage.includes('duplicate key');

      setError(isCompanyNameConflict ? t('companyNameTaken') : tToast(getApiErrorMessageKey(err)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary rounded-full shadow-lg">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>
        <h2 className="mt-6 text-center font-display text-display text-foreground">
          {t('title')}
        </h2>
        <p className="mt-2 text-center text-small text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-card py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg flex items-start">
                <span className="text-small font-medium">{error}</span>
              </div>
            )}

            <div>
              <Label htmlFor="companyName">
                {t('companyNameLabel')} <span className="text-destructive">*</span>
              </Label>
              <Input type="text" name="companyName" id="companyName" required value={formData.companyName} onChange={handleChange} disabled={isLoading} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">{t('firstNameLabel')} <span className="text-destructive">*</span></Label>
                <Input type="text" name="firstName" id="firstName" required value={formData.firstName} onChange={handleChange} disabled={isLoading} />
              </div>
              <div>
                <Label htmlFor="lastName">{t('lastNameLabel')} <span className="text-destructive">*</span></Label>
                <Input type="text" name="lastName" id="lastName" required value={formData.lastName} onChange={handleChange} disabled={isLoading} />
              </div>
            </div>

            <div>
              <Label htmlFor="email">{t('emailLabel')} <span className="text-destructive">*</span></Label>
              <Input type="email" name="email" id="email" required value={formData.email} onChange={handleChange} disabled={isLoading} />
            </div>

            <div>
              <Label htmlFor="password">{t('passwordLabel')} <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input type={showPassword ? 'text' : 'password'} name="password" id="password" required minLength={6} className="pr-10" value={formData.password} onChange={handleChange} disabled={isLoading} />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">{t('confirmPasswordLabel')} <span className="text-destructive">*</span></Label>
              <Input type="password" name="confirmPassword" id="confirmPassword" required minLength={6} value={formData.confirmPassword} onChange={handleChange} disabled={isLoading} />
            </div>

            <div>
              <Label htmlFor="phoneNumber">{t('phoneLabel')} <span className="text-destructive">*</span></Label>
              <Input type="tel" name="phoneNumber" id="phoneNumber" required placeholder="Ex: +257 79 12 34 56" value={formData.phoneNumber} onChange={handleChange} disabled={isLoading} />
            </div>

            {/* ✅ NOUVEAU : Choix de la formule (1 mois / 1 an) */}
            <div className="pt-4 border-t border-border">
              <Label className="mb-3">
                {t('planLabel')}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDuration(1)}
                  className={`p-3 border-2 rounded-xl text-center transition-all ${
                    duration === 1 ? 'border-primary bg-primary/5 dark:bg-primary/20' : 'border-border hover:border-primary/40'
                  }`}
                >
                  <h4 className="font-bold text-foreground">{t('plan1Month')}</h4>
                  <p className="text-small font-semibold text-primary">{t('plan1MonthPrice')}</p>
                </button>

                <button
                  type="button"
                  onClick={() => setDuration(12)}
                  className={`p-3 border-2 rounded-xl text-center transition-all relative ${
                    duration === 12 ? 'border-primary bg-primary/5 dark:bg-primary/20' : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-accent text-accent-foreground text-micro font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                    {t('plan1YearBadge')}
                  </div>
                  <h4 className="font-bold text-foreground flex items-center justify-center gap-1">
                    <Calendar size={14}/> {t('plan1Year')}
                  </h4>
                  <p className="text-small font-semibold text-primary">{t('plan1YearPrice')}</p>
                </button>
              </div>
            </div>

            <Button type="submit" disabled={isLoading} size="lg" className="w-full text-body font-bold">
              {isLoading ? <Loader2 className="animate-spin mr-3" size={20} /> : t('submitButton')}
            </Button>

            <div className="text-center text-small mt-4">
              <Link href="/register" className="inline-flex items-center font-medium text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" /> {t('backToIndividual')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}