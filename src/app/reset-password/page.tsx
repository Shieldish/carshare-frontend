'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/apiClient';
import Link from 'next/link';

function ResetPasswordForm() {
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
      setError('Les mots de passe ne correspondent pas.');
      setIsLoading(false);
      return;
    }

    if (!token) {
      setError('Le lien de réinitialisation est invalide ou manquant.');
      setIsLoading(false);
      return;
    }

    try {
      await apiClient.resetPassword(token, newPassword);
      setMessage('Votre mot de passe a été réinitialisé avec succès ! Redirection vers la connexion...');
      // Redirection après 3 secondes
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Le lien a expiré ou une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Nouveau mot de passe
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
            <label htmlFor="new-password" className="sr-only">Nouveau mot de passe</label>
            <input
              id="new-password"
              name="password"
              type="password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
              placeholder="Nouveau mot de passe"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="sr-only">Confirmer le mot de passe</label>
            <input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
              placeholder="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading || !token}
            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-white dark:focus:ring-offset-gray-800 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Modification...' : 'Changer le mot de passe'}
          </button>
        </div>
        
        <div className="text-center mt-4">
          <Link href="/login" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm">
            Retour à la connexion
          </Link>
        </div>
      </form>
    </div>
  );
}

// Next.js demande d'envelopper les composants qui utilisent useSearchParams dans un Suspense
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <Suspense fallback={<div className="text-gray-600 dark:text-gray-400">Chargement...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}