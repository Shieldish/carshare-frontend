'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

interface LoginFormProps {
  redirectTo?: string;
}

export default function LoginForm({ redirectTo = '/' }: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8081/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("L'adresse e-mail ou le mot de passe est incorrect.");
      }

      // On récupère les nouveaux champs envoyés par le backend
      const { token, requiresPayment, pendingPaymentId } = await response.json();

      // On connecte l'utilisateur dans l'application
      login(token);

      // Si un paiement est requis, on redirige vers la page de paiement
      if (requiresPayment && pendingPaymentId) {
        console.log('Paiement requis, redirection vers la page de paiement...');
        router.push(`/payment?paymentId=${pendingPaymentId}`);
      } else {
        console.log('Redirection vers:', redirectTo);
        router.push(redirectTo);
      }

      router.refresh();

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Une erreur inattendue s'est produite.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
          <span>{error}</span>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          name="email"
          id="email"
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={formData.email}
          onChange={handleChange}
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
          <div className="text-sm">
            <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
              Mot de passe oublié ?
            </Link>
          </div>
        </div>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            id="password"
            required
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
            value={formData.password}
            onChange={handleChange}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              onMouseDown={() => setShowPassword(true)}
              onMouseUp={() => setShowPassword(false)}
              onMouseLeave={() => setShowPassword(false)}
              onTouchStart={() => setShowPassword(true)}
              onTouchEnd={() => setShowPassword(false)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          {isLoading ? 'Connexion en cours...' : 'Se connecter'}
        </button>
      </div>
    </form>
  );
}