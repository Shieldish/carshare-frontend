'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Globe } from 'lucide-react';
import { setLocale } from '@/app/actions/setLocale';
import { locales, localeNames, type Locale } from '@/i18n/config';

interface LanguageSwitcherProps {
  variant?: 'desktop' | 'mobile';
  onSelect?: () => void;
}

export default function LanguageSwitcher({ variant = 'desktop', onSelect }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations('languageSwitcher');
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(target) &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (next: Locale) => {
    setIsOpen(false);
    onSelect?.();
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  };

  return (
    <div className={`relative ${variant === 'mobile' ? 'w-full' : ''}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={t('label')}
        disabled={isPending}
        className={
          variant === 'desktop'
            ? 'flex items-center space-x-1.5 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 disabled:opacity-50'
            : 'flex items-center space-x-3 w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-left font-medium disabled:opacity-50'
        }
      >
        <Globe className={variant === 'desktop' ? 'h-5 w-5' : 'h-5 w-5 text-gray-500 dark:text-gray-400'} />
        <span className={variant === 'desktop' ? 'hidden lg:inline text-sm font-medium' : ''}>
          {localeNames[locale]}
        </span>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          className={
            variant === 'desktop'
              ? 'absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50'
              : 'mt-1 w-full bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 py-1'
          }
        >
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              role="menuitemradio"
              aria-checked={l === locale}
              onClick={() => handleSelect(l)}
              className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span>{localeNames[l]}</span>
              {l === locale && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
