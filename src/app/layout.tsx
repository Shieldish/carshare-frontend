import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import OfflineBanner from "./components/OfflineBanner";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ChatProvider } from '@/context/ChatContext';
import ChatWindow from './components/chat/ChatWindow';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast'; // ✅ NOUVEAU: Import du Toaster
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Police d'accent réservée aux titres (hero, en-têtes de section, pages d'auth) —
// jamais pour le corps de texte, les boutons ou les formulaires. Voir tailwind.config.js
// (fontFamily.display) et l'échelle fontSize associée.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata');
  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} antialiased min-h-screen flex flex-col transition-colors`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <NotificationProvider>
              <ChatProvider>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                  disableTransitionOnChange={false}
                >
                  <Header />
                  {/* overflow-x-clip : filet de sécurité. Si un contenu imprévu dépasse malgré tout,
                      seul ce contenu est coupé : la page ne s'élargit pas, donc le header et son menu
                      restent à l'écran. Contrairement à overflow-hidden, n'empêche pas position: sticky. */}
                  <main className="flex-grow overflow-x-clip">{children}</main>
                  <Footer />
                  <ChatWindow />
                  <OfflineBanner />
                  <ServiceWorkerRegister />
                  <Toaster // ✅ NOUVEAU: Toaster global pour toute l'application
                    position="bottom-right"
                    reverseOrder={false}
                    toastOptions={{
                      duration: 4000,
                      style: {
                        borderRadius: '10px',
                        fontFamily: 'var(--font-geist-sans)',
                      },
                      success: {
                        iconTheme: {
                          primary: '#16a34a',
                          secondary: '#fff',
                        },
                      },
                      error: {
                        iconTheme: {
                          primary: '#dc2626',
                          secondary: '#fff',
                        },
                      },
                    }}
                  />
                </ThemeProvider>
              </ChatProvider>
            </NotificationProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}