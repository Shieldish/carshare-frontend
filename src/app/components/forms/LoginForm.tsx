'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { jwtDecode } from 'jwt-decode';
import { Input, Label, Button } from '@/app/components/ui';

interface LoginFormProps {
  redirectTo?: string;
}

interface DecodedToken {
  role?: string;
}

export default function LoginForm({ redirectTo = '/' }: LoginFormProps) {
  const t = useTranslations('auth.login');
  const tToast = useTranslations('toast.errors');
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(tToast('invalidCredentials'));
      }

      // On récupère les nouveaux champs envoyés par le backend
      const { token, requiresPayment, pendingPaymentId } = await response.json();

      // On connecte l'utilisateur dans l'application
      login(token);

      // Si un paiement est requis, on redirige vers la page de paiement
      if (requiresPayment && pendingPaymentId) {
        console.log('Paiement requis, redirection vers la page de paiement...');
        router.push(`/payment?paymentId=${pendingPaymentId}`);
      } else if (redirectTo === '/' && jwtDecode<DecodedToken>(token).role === 'ADMIN') {
        // Un admin qui se connecte sans destination précise (pas de redirect= explicite)
        // atterrit directement sur son dashboard plutôt que sur l'accueil public.
        router.push('/admin');
      } else {
        console.log('Redirection vers:', redirectTo);
        router.push(redirectTo);
      }

      router.refresh();

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(tToast('unexpected'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-small" role="alert">
          <span>{error}</span>
        </div>
      )}

      <div>
        <Label htmlFor="email">{t('emailLabel')}</Label>
        <Input
          type="email"
          name="email"
          id="email"
          required
          value={formData.email}
          onChange={handleChange}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="password" className="text-small font-medium text-foreground">{t('passwordLabel')}</label>
          <div className="text-small">
            <Link href="/forgot-password" className="font-medium text-primary hover:text-primary/80">
              {t('forgotPasswordLink')}
            </Link>
          </div>
        </div>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            name="password"
            id="password"
            required
            className="pr-10 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
            value={formData.password}
            onChange={handleChange}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} size="lg" className="w-full">
        {isLoading ? t('submitting') : t('submitButton')}
      </Button>
    </form>
  );
}