'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getApiErrorMessageKey } from '@/lib/apiErrorMessages';

function ResetPasswordForm() {
  const t = useTranslations('auth.resetPassword');
  const tToast = useTranslations('toast.errors');
  const searchParams = useSearchParams();
  const token = searchParams.get('token'); // On récupère le token dans l'URL
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError(t('passwordMismatch'));
      setIsLoading(false);
      return;
    }

    if (!token) {
      setError(t('missingToken'));
      setIsLoading(false);
      return;
    }

    try {
      await apiClient.resetPassword(token, newPassword);
      setMessage(t('successMessage'));
      // Redirection après 3 secondes
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: unknown) {
      const key = getApiErrorMessageKey(err);
      setError(key === 'generic' ? tToast('expiredOrError') : tToast(key));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          {t('title')}
        </h2>
      </div>
      
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {message && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-md text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="new-password" className="sr-only">{t('newPasswordLabel')}</label>
            <input
              id="new-password"
              name="password"
              type="password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-colors"
              placeholder={t('newPasswordPlaceholder')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="sr-only">{t('confirmPasswordLabel')}</label>
            <input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-900 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm transition-colors"
              placeholder={t('confirmPasswordPlaceholder')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading || !token}
            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-white dark:focus:ring-offset-gray-800 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? t('submitting') : t('submitButton')}
          </button>
        </div>

        <div className="text-center mt-4">
          <Link href="/login" className="font-medium text-primary hover:text-primary/80 text-sm">
            {t('backToLogin')}
          </Link>
        </div>
      </form>
    </div>
  );
}

// Next.js demande d'envelopper les composants qui utilisent useSearchParams dans un Suspense
export default function ResetPasswordPage() {
  const t = useTranslations('auth.resetPassword');
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <Suspense fallback={<div className="text-gray-600 dark:text-gray-400">{t('loadingFallback')}</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}