'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { usePathname } from 'next/navigation'; // ✅ On a retiré useRouter d'ici
import { useTranslations } from 'next-intl';

interface DecodedToken {
  sub: string;
  userId: number;
  firstName?: string;
  role?: string;
  exp: number;
  iat: number;
}

interface User {
  id: number;
  sub: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  role: 'USER' | 'ADMIN' | 'OWNER';
  companyName?: string;
  companyId?: number;
  isIdentityVerified?: boolean;
  isDrivingLicenseVerified?: boolean;
  profilePictureUrl?: string;
  isSelfieVerified?: boolean;
  selfieUrl?: string;
  isPremium?: boolean;
  premiumEndDate?: string;
  identityDocumentUrl?: string;
  drivingLicenseUrl?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const t = useTranslations('auth.onboardingGate');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const pathname = usePathname();
  // ✅ On a supprimé la ligne "const router = useRouter();" qui ne servait plus

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jwt_token');
    }
    setUser(null);
    setToken(null);
    console.log('Déconnexion effectuée - état nettoyé');
  };

  const isTokenValid = (authToken: string): boolean => {
    try {
      const decodedToken: DecodedToken = jwtDecode(authToken);
      const currentTime = Date.now() / 1000;
      return decodedToken.exp > currentTime;
    } catch {
      return false;
    }
  };

  const fetchUserProfile = async (authToken: string) => {
    try {
      const decodedToken: DecodedToken = jwtDecode(authToken);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const profileData = await response.json();

        const identityVerified = profileData.identityVerified === true || profileData.isIdentityVerified === true;
        const licenseVerified = profileData.drivingLicenseVerified === true || profileData.isDrivingLicenseVerified === true;
        const selfieVerified = profileData.selfieVerified === true || profileData.isSelfieVerified === true;

        const userData: User = {
          id: profileData.id,
          sub: decodedToken.sub,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email,
          phoneNumber: profileData.phoneNumber,
          role: profileData.role,
          companyName: profileData.companyName,
          companyId: profileData.companyId ?? profileData.companyForRegistrationId ?? undefined,
          isIdentityVerified: identityVerified,
          isDrivingLicenseVerified: licenseVerified,
          profilePictureUrl: profileData.profilePictureUrl,
          isSelfieVerified: selfieVerified,
          selfieUrl: profileData.selfieUrl,
          isPremium: profileData.isPremium === true || profileData.premium === true,
          premiumEndDate: profileData.premiumEndDate,
          identityDocumentUrl: profileData.identityDocumentUrl,
          drivingLicenseUrl: profileData.drivingLicenseUrl,
        };

        setUser(userData);
      } else {
        setUser({
          id: decodedToken.userId,
          sub: decodedToken.sub,
          firstName: decodedToken.firstName,
          role: (decodedToken.role as User['role']) || 'USER',
        });
      }
    } catch {
      setUser(null);
    }
  };

  const checkPendingOnboarding = async (authToken: string): Promise<boolean> => {
    if (pathname && pathname.startsWith('/payment')) {
      setIsRedirecting(false);
      return false;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8081'}/api/payments/check-pending-onboarding`, {
        headers: { 'Authorization': `Bearer ${authToken}` },
      });
      if (response.ok) {
        const data = await response.json();

        if (data.requiresPayment) {
          setIsRedirecting(true);
          window.location.href = `/payment?paymentId=${data.paymentId}`;
          return true;
        }
      }
    } catch {
      console.warn('⚠️ Erreur vérification onboarding');
    }

    setIsRedirecting(false);
    return false;
  };

  const initializeAuth = async (tokenToUse?: string) => {
    try {
      const currentToken = tokenToUse || (typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null);
      if (currentToken) {
        if (isTokenValid(currentToken)) {
          setToken(currentToken);
          const mustRedirect = await checkPendingOnboarding(currentToken);
          if (mustRedirect) return;
          await fetchUserProfile(currentToken);
        } else {
          logout();
        }
      }
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null;
    if (storedToken && isTokenValid(storedToken)) {
      await fetchUserProfile(storedToken);
    } else if (storedToken) {
      logout();
    }
  };

  // 1️⃣ Premier chargement de l'application
  useEffect(() => {
    initializeAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2️⃣ Bouclier dynamique : s'active à chaque changement de page
  useEffect(() => {
    if (token && !isLoading) {
      checkPendingOnboarding(token);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, token]);

  const login = async (newToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jwt_token', newToken);
    }
    setToken(newToken);
    await initializeAuth(newToken);
  };

  if (isRedirecting) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h2>
          <p className="text-gray-500">{t('description')}</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};