/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['clamp(1.75rem, 1.35rem + 2vw, 2.75rem)', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        // Fluides comme `display` : une taille fixe de 30px laissait les mots longs de certaines
        // langues (ex. "yanayopendekezwa") plus larges que l'écran sur les petits téléphones.
        h1: ['clamp(1.5rem, 1.25rem + 1.25vw, 1.875rem)', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        h2: ['clamp(1.25rem, 1.125rem + 0.625vw, 1.5rem)', { lineHeight: '1.25', fontWeight: '700' }],
        h3: ['1.125rem', { lineHeight: '1.35', fontWeight: '600' }],
        body: ['0.9375rem', { lineHeight: '1.6' }],
        small: ['0.8125rem', { lineHeight: '1.5' }],
        micro: ['0.6875rem', { lineHeight: '1.4' }],
      },
      borderRadius: {
        sm: '0.375rem',
        DEFAULT: '0.5rem',
        md: '0.625rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      colors: {
        background: 'rgb(var(--background))',
        foreground: 'rgb(var(--foreground))',
        card: {
          DEFAULT: 'rgb(var(--card))',
          foreground: 'rgb(var(--card-foreground))',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted))',
          foreground: 'rgb(var(--muted-foreground))',
        },
        primary: {
          DEFAULT: 'rgb(var(--primary))',
          foreground: 'rgb(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary))',
          foreground: 'rgb(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent))',
          foreground: 'rgb(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive))',
          foreground: 'rgb(var(--destructive-foreground))',
        },
        border: 'rgb(var(--border))',
        input: 'rgb(var(--input))',
        ring: 'rgb(var(--ring))',
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.2s ease-out',
        // Séquence d'entrée du hero uniquement (plus lente, easing "overshoot doux") —
        // même keyframe que fade-in-up, durée distincte pour ne pas la réutiliser
        // ailleurs comme micro-interaction.
        'hero-in': 'fade-in-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        'overlay-in': 'overlay-in 0.15s ease-out',
        'dialog-in': 'dialog-in 0.18s cubic-bezier(0.16, 1, 0.3, 1) both',
        'toast-in': 'toast-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
}