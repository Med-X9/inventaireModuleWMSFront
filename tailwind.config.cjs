// tailwind.config.js
/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

// Import des couleurs et typographie depuis le thème
const colors = {
  primary: {
    DEFAULT: '#4F46E5',
    light: '#6366F1',
    dark: '#4338CA',
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },
  secondary: {
    DEFAULT: '#6366F1',
    light: '#818CF8',
    dark: '#4F46E5',
  },
  success: {
    DEFAULT: '#10B981',
    light: '#DCFCE7',
    dark: '#059669',
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  error: {
    DEFAULT: '#EF4444',
    light: '#FEE2E2',
    dark: '#DC2626',
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },
  danger: {
    DEFAULT: '#DC2626',
    light: '#FEE2E2',
    dark: '#B91C1C',
  },
  warning: {
    DEFAULT: '#FBBF24',
    light: '#FEF3C7',
    dark: '#F59E0B',
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },
  info: {
    DEFAULT: '#3B82F6',
    light: '#DBEAFE',
    dark: '#2563EB',
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  text: {
    DEFAULT: '#0F172A',
    light: '#475569',
    dark: '#1E293B',
    muted: '#64748B',
  },
  background: {
    app: '#F8FAFC',
    card: '#FFFFFF',
    hover: '#E0E7FF',
    dark: '#1E293B',
    alertWarning: '#FEF3C7',
    alertError: '#FEE2E2',
    alertSuccess: '#DCFCE7',
  },
  border: {
    DEFAULT: '#E2E8F0',
    light: '#F1F5F9',
    dark: '#334155',
  },
};

const fontFamilies = {
  heading: ['Montserrat', 'sans-serif'],
  body: ['Roboto', 'sans-serif'],
  mono: ['Roboto Mono', 'monospace'],
};

const rotateX = plugin(function ({ addUtilities }) {
  addUtilities({ '.rotate-y-180': { transform: 'rotateY(180deg)' } });
});

module.exports = {
  content: ['./index.html','./src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    container: { center: true },
    extend: {
      colors: {
        // Palette principale - Indigo (Tech & Industrielle)
        primary: {
          DEFAULT: colors.primary.DEFAULT,
          light: colors.primary.light,
          dark: colors.primary.dark,
          50: colors.primary[50],
          100: colors.primary[100],
          200: colors.primary[200],
          300: colors.primary[300],
          400: colors.primary[400],
          500: colors.primary[500],
          600: colors.primary[600],
          700: colors.primary[700],
          800: colors.primary[800],
          900: colors.primary[900],
          'dark-light': 'rgba(79, 70, 229, 0.15)',
        },
        // Secondaire - Indigo clair
        secondary: {
          DEFAULT: colors.secondary.DEFAULT,
          light: colors.secondary.light,
          dark: colors.secondary.dark,
          50: colors.primary[50],
          'dark-light': 'rgba(99, 102, 241, 0.15)',
        },
        // Succès - Vert émeraude
        success: {
          DEFAULT: colors.success.DEFAULT,
          light: colors.success.light,
          dark: colors.success.dark,
          50: colors.success[50],
          100: colors.success[100],
          200: colors.success[200],
          300: colors.success[300],
          400: colors.success[400],
          500: colors.success[500],
          600: colors.success[600],
          700: colors.success[700],
          800: colors.success[800],
          900: colors.success[900],
          'dark-light': 'rgba(16, 185, 129, 0.15)',
        },
        // Erreur - Rouge vif
        error: {
          DEFAULT: colors.error.DEFAULT,
          light: colors.error.light,
          dark: colors.error.dark,
          50: colors.error[50],
          100: colors.error[100],
          200: colors.error[200],
          300: colors.error[300],
          400: colors.error[400],
          500: colors.error[500],
          600: colors.error[600],
          700: colors.error[700],
          800: colors.error[800],
          900: colors.error[900],
        },
        // Danger - Rouge sombre
        danger: {
          DEFAULT: colors.danger.DEFAULT,
          light: colors.danger.light,
          dark: colors.danger.dark,
          'dark-light': 'rgba(220, 38, 38, 0.15)',
        },
        // Avertissement - Jaune/Orange
        warning: {
          DEFAULT: colors.warning.DEFAULT,
          light: colors.warning.light,
          dark: colors.warning.dark,
          50: colors.warning[50],
          100: colors.warning[100],
          200: colors.warning[200],
          300: colors.warning[300],
          400: colors.warning[400],
          500: colors.warning[500],
          600: colors.warning[600],
          700: colors.warning[700],
          800: colors.warning[800],
          900: colors.warning[900],
          'dark-light': 'rgba(251, 191, 36, 0.15)',
        },
        // Information - Bleu clair
        info: {
          DEFAULT: colors.info.DEFAULT,
          light: colors.info.light,
          dark: colors.info.dark,
          50: colors.info[50],
          100: colors.info[100],
          200: colors.info[200],
          300: colors.info[300],
          400: colors.info[400],
          500: colors.info[500],
          600: colors.info[600],
          700: colors.info[700],
          800: colors.info[800],
          900: colors.info[900],
          'dark-light': 'rgba(59, 130, 246, 0.15)',
        },
        // Texte
        text: {
          DEFAULT: colors.text.DEFAULT,
          light: colors.text.light,
          dark: colors.text.dark,
          muted: colors.text.muted,
        },
        // Arrière-plans
        bg: {
          app: colors.background.app,
          card: colors.background.card,
          hover: colors.background.hover,
          dark: colors.background.dark,
          'alert-warning': colors.background.alertWarning,
          'alert-error': colors.background.alertError,
          'alert-success': colors.background.alertSuccess,
        },
        // Bordures
        border: {
          DEFAULT: colors.border.DEFAULT,
          light: colors.border.light,
          dark: colors.border.dark,
        },
        // Couleurs legacy (pour compatibilité)
        dark: {
          DEFAULT: '#3b3f5c',
          light: '#eaeaec',
          'dark-light': 'rgba(59,63,92,.15)',
        },
        black: {
          DEFAULT: '#0e1726',
          light: '#e3e4eb',
          'dark-light': 'rgba(14,23,38,.15)',
        },
        'dark-bg': '#1b2e4b',
        'dark-border': '#253b5c',
        white: {
          DEFAULT: '#ffffff',
          light: '#e0e6ed',
          dark: '#888ea8',
        },
      },
      fontFamily: {
        heading: fontFamilies.heading,
        body: fontFamilies.body,
        mono: fontFamilies.mono,
        nunito: ['Nunito', 'sans-serif'], // Legacy
      },
      spacing:    { 4.5: '18px' },
      boxShadow:  { '3xl': '0 2px 2px rgb(224 230 237 / 46%), 1px 6px 7px rgb(224 230 237 / 46%)' },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-invert-headings': theme('colors.white.dark'),
            '--tw-prose-invert-links':    theme('colors.white.dark'),
            h1: { fontSize: '40px', margin: '0 0 .5rem' },
            h2: { fontSize: '32px', margin: '0 0 .5rem' },
            h3: { fontSize: '28px', margin: '0 0 .5rem' },
            h4: { fontSize: '24px', margin: '0 0 .5rem' },
            h5: { fontSize: '20px', margin: '0 0 .5rem' },
            h6: { fontSize: '16px', margin: '0 0 .5rem' },
            p:  { marginBottom: '.5rem' },
            li: { margin: 0 },
            img:{ margin: 0 },
          },
        },
        accentColor: theme => ({
          primary:   theme('colors.primary.DEFAULT'),
          secondary: theme('colors.secondary.DEFAULT'),
        }),
      }),
    },
  },
  plugins: [
    require('@tailwindcss/forms')({ strategy: 'class' }),  
    require('@tailwindcss/typography'),
    // Exposer les variables CSS
    function ({ addBase, theme }) {
      addBase({
        ':root': {
          '--color-primary':   theme('colors.primary.DEFAULT'),
          '--color-secondary': theme('colors.secondary.DEFAULT'),
          '--color-success':   theme('colors.success.DEFAULT'),
          '--color-danger':    theme('colors.danger.DEFAULT'),
          '--color-warning':   theme('colors.warning.DEFAULT'),
          '--color-info':      theme('colors.info.DEFAULT'),
        },
      });
    },  
    rotateX,
  ],
};
