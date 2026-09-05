'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getApiErrorMessageKey } from '@/lib/apiErrorMessages';
import { Input, Label, Button, Card } from '@/app/components/ui';

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
    <Card className="max-w-md w-full space-y-8 p-8 shadow-md">
      <div>
        <h2 className="mt-6 text-center font-display text-display text-foreground">
          {t('title')}
        </h2>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {message && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-md text-small">
            {message}
          </div>
        )}
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive border border-destructive/30 rounded-md text-small">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="new-password" className="sr-only">{t('newPasswordLabel')}</Label>
            <Input
              id="new-password"
              name="password"
              type="password"
              required
              placeholder={t('newPasswordPlaceholder')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="confirm-password" className="sr-only">{t('confirmPasswordLabel')}</Label>
            <Input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              required
              placeholder={t('confirmPasswordPlaceholder')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <Button type="submit" disabled={isLoading || !token} size="lg" className="w-full">
          {isLoading ? t('submitting') : t('submitButton')}
        </Button>

        <div className="text-center mt-4">
          <Link href="/login" className="font-medium text-primary hover:text-primary/80 text-small">
            {t('backToLogin')}
          </Link>
        </div>
      </form>
    </Card>
  );
}

// Next.js demande d'envelopper les composants qui utilisent useSearchParams dans un Suspense
export default function ResetPasswordPage() {
  const t = useTranslations('auth.resetPassword');
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <Suspense fallback={<div className="text-muted-foreground">{t('loadingFallback')}</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}