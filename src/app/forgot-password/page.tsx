'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { getApiErrorMessageKey } from '@/lib/apiErrorMessages';
import { Input, Label, Button, Card } from '@/app/components/ui';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword');
  const tToast = useTranslations('toast.errors');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      await apiClient.forgotPassword(email, locale);
      setMessage(t('successMessage'));
      setEmail(''); // On vide le champ
    } catch (err: unknown) {
      setError(tToast(getApiErrorMessageKey(err)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <Card className="max-w-md w-full space-y-8 p-8 shadow-md">
        <div>
          <h2 className="mt-6 text-center font-display text-display text-foreground">
            {t('title')}
          </h2>
          <p className="mt-2 text-center text-small text-muted-foreground">
            {t('subtitle')}
          </p>
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

          <div>
            <Label htmlFor="email" className="sr-only">{t('emailLabel')}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={isLoading} size="lg" className="w-full">
            {isLoading ? t('submitting') : t('submitButton')}
          </Button>

          <div className="text-center mt-4">
            <Link href="/login" className="font-medium text-primary hover:text-primary/80 text-small">
              {t('backToLogin')}
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}