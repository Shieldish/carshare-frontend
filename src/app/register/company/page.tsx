'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, ApiError } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { Loader2, ArrowLeft, Building2, Eye, EyeOff, Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getApiErrorMessageKey } from '@/lib/apiErrorMessages';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-blue-600 rounded-full shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          {t('title')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          {t('subtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('companyNameLabel')} <span className="text-red-500">*</span>
              </label>
              <input type="text" name="companyName" required className="mt-1 block w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500" value={formData.companyName} onChange={handleChange} disabled={isLoading} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('firstNameLabel')} <span className="text-red-500">*</span></label>
                <input type="text" name="firstName" required className="mt-1 block w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500" value={formData.firstName} onChange={handleChange} disabled={isLoading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('lastNameLabel')} <span className="text-red-500">*</span></label>
                <input type="text" name="lastName" required className="mt-1 block w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500" value={formData.lastName} onChange={handleChange} disabled={isLoading} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('emailLabel')} <span className="text-red-500">*</span></label>
              <input type="email" name="email" required className="mt-1 block w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500" value={formData.email} onChange={handleChange} disabled={isLoading} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('passwordLabel')} <span className="text-red-500">*</span></label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input type={showPassword ? 'text' : 'password'} name="password" required minLength={6} className="block w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10" value={formData.password} onChange={handleChange} disabled={isLoading} />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button type="button" className="text-gray-400 hover:text-gray-500" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('confirmPasswordLabel')} <span className="text-red-500">*</span></label>
              <input type="password" name="confirmPassword" required minLength={6} className="mt-1 block w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500" value={formData.confirmPassword} onChange={handleChange} disabled={isLoading} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('phoneLabel')} <span className="text-red-500">*</span></label>
              <input type="tel" name="phoneNumber" required placeholder="Ex: +257 79 12 34 56" className="mt-1 block w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500" value={formData.phoneNumber} onChange={handleChange} disabled={isLoading} />
            </div>

            {/* ✅ NOUVEAU : Choix de la formule (1 mois / 1 an) */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                {t('planLabel')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDuration(1)}
                  className={`p-3 border-2 rounded-xl text-center transition-all ${
                    duration === 1 ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                  }`}
                >
                  <h4 className="font-bold text-gray-900 dark:text-white">{t('plan1Month')}</h4>
                  <p className="text-sm font-semibold text-blue-600">{t('plan1MonthPrice')}</p>
                </button>

                <button
                  type="button"
                  onClick={() => setDuration(12)}
                  className={`p-3 border-2 rounded-xl text-center transition-all relative ${
                    duration === 12 ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
                  }`}
                >
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                    {t('plan1YearBadge')}
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                    <Calendar size={14}/> {t('plan1Year')}
                  </h4>
                  <p className="text-sm font-semibold text-blue-600">{t('plan1YearPrice')}</p>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center py-4 px-4 rounded-xl shadow-lg text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all">
                {isLoading ? <Loader2 className="animate-spin mr-3" size={20} /> : t('submitButton')}
              </button>
            </div>

            <div className="text-center text-sm mt-4">
              <Link href="/register" className="inline-flex items-center font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" /> {t('backToIndividual')}
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}