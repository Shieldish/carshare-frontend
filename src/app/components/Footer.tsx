'use client'; // ✅ Composant client pour détecter la route
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // ✅ Import usePathname
import { useTranslations } from 'next-intl';

export default function Footer() {
  const pathname = usePathname();
  const t = useTranslations('footer');

  // ✅ Sur les pages /admin, le footer ne s'affiche pas (dashboard pleine page)
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-gray-100 dark:text-gray-200 py-12 mt-auto border-t border-gray-800 dark:border-gray-700">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4 text-primary">
              BudaxDrive
            </h3>
            <p className="text-gray-300 dark:text-gray-400 text-sm leading-relaxed">
              {t('tagline')}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-100 dark:text-gray-200">{t('navigationTitle')}</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/about" className="text-gray-300 dark:text-gray-400 hover:text-primary transition-all duration-200 hover:translate-x-1 inline-block hover:underline">
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 dark:text-gray-400 hover:text-primary transition-all duration-200 hover:translate-x-1 inline-block hover:underline">
                  {t('help')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-300 dark:text-gray-400 hover:text-primary transition-all duration-200 hover:translate-x-1 inline-block hover:underline">
                  {t('terms')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-100 dark:text-gray-200">{t('followUsTitle')}</h3>
            <div className="flex items-center gap-4 mb-4">
              <a href="#" className="p-2.5 -m-2.5 rounded-full inline-flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-primary hover:bg-white/10 transition-all duration-200 hover:scale-110" aria-label="Twitter">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="p-2.5 -m-2.5 rounded-full inline-flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-primary hover:bg-white/10 transition-all duration-200 hover:scale-110" aria-label="Facebook">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="p-2.5 -m-2.5 rounded-full inline-flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-primary hover:bg-white/10 transition-all duration-200 hover:scale-110" aria-label="Instagram">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.739.099.120.112.225.085.347-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.159-1.499-.69-2.436-2.888-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                </svg>
              </a>
            </div>
            <div className="text-sm text-gray-400 dark:text-gray-500">
              <p>{t('joinCommunity')}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-12 text-center text-sm border-t border-gray-800 dark:border-gray-700 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
              <p className="text-gray-400 dark:text-gray-500">
                {t('copyright')}
              </p>
              <div className="flex items-center space-x-2 text-gray-400 dark:text-gray-500">
                <span>{t('contactLabel')}</span>
                <a href="mailto:orl.ndonse@gmail.com" className="text-primary hover:text-primary/80 transition-colors hover:underline">
                  orl.ndonse@gmail.com
                </a>
              </div>
            </div>
            <div className="flex space-x-6 text-gray-400 dark:text-gray-500">
              <Link href="/privacy" className="hover:text-primary transition-colors hover:underline">
                {t('privacy')}
              </Link>
              <Link href="/terms" className="hover:text-primary transition-colors hover:underline">
                {t('legalNotice')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}