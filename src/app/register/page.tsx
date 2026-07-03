'use client'; // Ajouter cette directive car on utilise useSearchParams

import { Suspense } from 'react';
import RegisterForm from "../components/forms/RegisterForm";
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function RegisterContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  return (
    <div className="container mx-auto max-w-md py-12">
      <div className="bg-card dark:bg-card p-8 rounded-xl shadow-lg border border-border dark:border-border">
        {/* Message informatif si redirection vers une page spécifique */}
        {redirectTo !== '/' && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-lg" role="alert">
            <p className="font-medium">Inscription requise</p>
            <p className="text-sm">Créez votre compte pour accéder à la page demandée.</p>
          </div>
        )}

        <h1 className="text-3xl font-bold text-center text-foreground dark:text-foreground mb-6">
          Créer votre compte
        </h1>
        <p className="text-center text-muted-foreground dark:text-muted-foreground mb-8">
          Rejoignez la communauté et commencez à partager ou louer des véhicules.
        </p>

        {/* Passer l'URL de redirection au formulaire */}
        <RegisterForm redirectTo={redirectTo} />

        <p className="text-center text-sm text-muted-foreground dark:text-muted-foreground mt-8">
          Vous avez déjà un compte ?{' '}
          <Link
            href={`/login${redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
            className="font-medium text-primary dark:text-primary hover:underline"
          >
            Connectez-vous
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <RegisterContent />
    </Suspense>
  );
}