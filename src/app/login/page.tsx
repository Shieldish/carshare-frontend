'use client';

import { Suspense } from 'react';
import LoginForm from '../components/forms/LoginForm';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginContent() {
  const searchParams = useSearchParams();
  const registrationSuccess = searchParams.get('registration') === 'success';
  const redirectTo = searchParams.get('redirect') || '/';

  return (
    <div className="bg-card dark:bg-card p-8 rounded-xl shadow-lg border border-border dark:border-border">
      {registrationSuccess && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg" role="alert">
          <p className="font-bold">Inscription réussie !</p>
          <p>Vous pouvez maintenant vous connecter à votre nouveau compte.</p>
        </div>
      )}

      {redirectTo !== '/' && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-lg" role="alert">
          <p className="font-medium">Connexion requise</p>
          <p className="text-sm">Connectez-vous pour accéder à la page demandée.</p>
        </div>
      )}

      <h1 className="text-3xl font-bold text-center text-foreground dark:text-foreground mb-6">
        Connexion
      </h1>

      <LoginForm redirectTo={redirectTo} />

      <p className="text-center text-sm text-muted-foreground dark:text-muted-foreground mt-8">
        Vous n'avez pas de compte ?{' '}
        <Link
          href={`/register${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
          className="font-medium text-primary dark:text-primary hover:underline"
        >
          Inscrivez-vous
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="container mx-auto max-w-md py-12">
      <Suspense fallback={<div className="p-8 text-center">Chargement...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
