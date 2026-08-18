'use client';

import { Suspense } from 'react';
import LoginForm from '../components/forms/LoginForm';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

function LoginContent() {
  const t = useTranslations('auth.login');
  const searchParams = useSearchParams();
  const registrationSuccess = searchParams.get('registration') === 'success';
  const redirectTo = searchParams.get('redirect') || '/';

  return (
    <div className="bg-card dark:bg-card p-8 rounded-xl shadow-lg border border-border dark:border-border">
      {registrationSuccess && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg" role="alert">
          <p className="font-bold">{t('registrationSuccessTitle')}</p>
          <p>{t('registrationSuccessMessage')}</p>
        </div>
      )}

      {redirectTo !== '/' && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-lg" role="alert">
          <p className="font-medium">{t('loginRequiredTitle')}</p>
          <p className="text-sm">{t('loginRequiredMessage')}</p>
        </div>
      )}

      <h1 className="text-3xl font-bold text-center text-foreground dark:text-foreground mb-6">
        {t('title')}
      </h1>

      <LoginForm redirectTo={redirectTo} />

      <p className="text-center text-sm text-muted-foreground dark:text-muted-foreground mt-8">
        {t('noAccount')}{' '}
        <Link
          href={`/register${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
          className="font-medium text-primary dark:text-primary hover:underline"
        >
          {t('signUpLink')}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  const t = useTranslations('auth.login');
  return (
    <div className="container mx-auto max-w-md py-12">
      <Suspense fallback={<div className="p-8 text-center">{t('loadingFallback')}</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
