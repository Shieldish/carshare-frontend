'use client'; // Ajouter cette directive car on utilise useSearchParams

import { Suspense } from 'react';
import RegisterForm from "../components/forms/RegisterForm";
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

function RegisterContent() {
  const t = useTranslations('auth.register');
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  return (
    <div className="container mx-auto max-w-md py-12">
      <div className="bg-card dark:bg-card p-8 rounded-xl shadow-lg border border-border dark:border-border">
        {/* Message informatif si redirection vers une page spécifique */}
        {redirectTo !== '/' && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-lg" role="alert">
            <p className="font-medium">{t('registrationRequiredTitle')}</p>
            <p className="text-sm">{t('registrationRequiredMessage')}</p>
          </div>
        )}

        <h1 className="text-3xl font-bold text-center text-foreground dark:text-foreground mb-6">
          {t('title')}
        </h1>
        <p className="text-center text-muted-foreground dark:text-muted-foreground mb-8">
          {t('subtitle')}
        </p>

        {/* Passer l'URL de redirection au formulaire */}
        <RegisterForm redirectTo={redirectTo} />

        <p className="text-center text-sm text-muted-foreground dark:text-muted-foreground mt-8">
          {t('haveAccount')}{' '}
          <Link
            href={`/login${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
            className="font-medium text-primary dark:text-primary hover:underline"
          >
            {t('loginLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const t = useTranslations('auth.register');
  return (
    <Suspense fallback={<div>{t('loadingFallback')}</div>}>
      <RegisterContent />
    </Suspense>
  );
}