export const locales = ['fr', 'en', 'sw', 'rn'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  sw: 'Kiswahili',
  rn: 'Ikirundi',
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
