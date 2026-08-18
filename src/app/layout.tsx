import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col transition-colors`}>
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
                  <main className="flex-grow">{children}</main>
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