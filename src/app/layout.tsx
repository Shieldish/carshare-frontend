import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ChatProvider } from '@/context/ChatContext';
import ChatWindow from './components/chat/ChatWindow';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast'; // ✅ NOUVEAU: Import du Toaster

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CarShare Burundi",
  description: "Location de voitures entre particulier au Burundi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col transition-colors`}>
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
      </body>
    </html>
  );
}