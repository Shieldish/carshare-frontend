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
      <div className="bg-card p-6 sm:p-8 rounded-xl shadow-lg border border-border">
        {/* Message informatif si redirection vers une page spécifique */}
        {redirectTo !== '/' && (
          <div className="mb-6 bg-muted border-l-4 border-primary text-foreground px-4 py-3 rounded-lg" role="alert">
            <p className="font-medium">{t('registrationRequiredTitle')}</p>
            <p className="text-small">{t('registrationRequiredMessage')}</p>
          </div>
        )}

        <h1 className="font-display text-display text-center text-foreground mb-6">
          {t('title')}
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          {t('subtitle')}
        </p>

        {/* Passer l'URL de redirection au formulaire */}
        <RegisterForm redirectTo={redirectTo} />

        <p className="text-center text-small text-muted-foreground mt-8">
          {t('haveAccount')}{' '}
          <Link
            href={`/login${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
            className="font-medium text-primary hover:underline"
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