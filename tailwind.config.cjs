/**
 * Configuration Tailwind CSS - Utilise le thème du package @SMATCH-Digital-dev/vue-system-design
 * 
 * Cette configuration utilise les valeurs du thème du package comme source unique de vérité
 * Les couleurs, polices et autres valeurs proviennent du package
 * 
 * @type {import('tailwindcss').Config}
 */
const plugin = require('tailwindcss/plugin');

// Import du thème depuis le package (via bridge CommonJS)
const { colors: themeColors, typography: themeTypography } = require('./src/theme/theme.package.cjs');

const rotateX = plugin(function ({ addUtilities }) {
  addUtilities({ '.rotate-y-180': { transform: 'rotateY(180deg)' } });
});

module.exports = {
    // Inclure le contenu du package @SMATCH-Digital-dev/vue-system-design
    // pour que les classes Tailwind du package soient disponibles
    content: [
        './index.html',
        './src/**/*.{vue,js,ts,jsx,tsx}',
        './node_modules/@SMATCH-Digital-dev/vue-system-design/dist/**/*.{vue,js,ts,jsx,tsx}'
    ],
  darkMode: 'class',
  theme: {
    container: { center: true },
    extend: {
      colors: {
        // ===== PALETTE PRINCIPALE =====
        primary: {
          DEFAULT: themeColors.primary.DEFAULT,
          light: themeColors.primary.light,
          dark: themeColors.primary.dark,
          50: themeColors.primary[50],
          100: themeColors.primary[100],
          200: themeColors.primary[200],
          300: themeColors.primary[300],
          400: themeColors.primary[400],
          500: themeColors.primary[500],
          600: themeColors.primary[600],
          700: themeColors.primary[700],
          800: themeColors.primary[800],
          900: themeColors.primary[900],
        },
        secondary: {
          DEFAULT: themeColors.secondary.DEFAULT,
          light: themeColors.secondary.light,
          dark: themeColors.secondary.dark,
        },
        // ===== COULEURS D'ÉTAT =====
        success: {
          DEFAULT: themeColors.success.DEFAULT,
          light: themeColors.success.light,
          dark: themeColors.success.dark,
          50: themeColors.success[50],
          100: themeColors.success[100],
          200: themeColors.success[200],
          300: themeColors.success[300],
          400: themeColors.success[400],
          500: themeColors.success[500],
          600: themeColors.success[600],
          700: themeColors.success[700],
          800: themeColors.success[800],
          900: themeColors.success[900],
        },
        error: {
          DEFAULT: themeColors.error.DEFAULT,
          light: themeColors.error.light,
          dark: themeColors.error.dark,
          50: themeColors.error[50],
          100: themeColors.error[100],
          200: themeColors.error[200],
          300: themeColors.error[300],
          400: themeColors.error[400],
          500: themeColors.error[500],
          600: themeColors.error[600],
          700: themeColors.error[700],
          800: themeColors.error[800],
          900: themeColors.error[900],
        },
        danger: {
          DEFAULT: themeColors.danger.DEFAULT,
          light: themeColors.danger.light,
          dark: themeColors.danger.dark,
        },
        warning: {
          DEFAULT: themeColors.warning.DEFAULT,
          light: themeColors.warning.light,
          dark: themeColors.warning.dark,
          50: themeColors.warning[50],
          100: themeColors.warning[100],
          200: themeColors.warning[200],
          300: themeColors.warning[300],
          400: themeColors.warning[400],
          500: themeColors.warning[500],
          600: themeColors.warning[600],
          700: themeColors.warning[700],
          800: themeColors.warning[800],
          900: themeColors.warning[900],
        },
        info: {
          DEFAULT: themeColors.info.DEFAULT,
          light: themeColors.info.light,
          dark: themeColors.info.dark,
          50: themeColors.info[50],
          100: themeColors.info[100],
          200: themeColors.info[200],
          300: themeColors.info[300],
          400: themeColors.info[400],
          500: themeColors.info[500],
          600: themeColors.info[600],
          700: themeColors.info[700],
          800: themeColors.info[800],
          900: themeColors.info[900],
        },
        // ===== TYPOGRAPHIE (Couleurs de texte) =====
        text: {
          DEFAULT: themeColors.text.DEFAULT,
          light: themeColors.text.light,
          dark: themeColors.text.dark,
          muted: themeColors.text.muted,
        },
        // ===== ARRIÈRE-PLANS =====
        // Alias directs pour simplifier (bg-app, bg-card, etc.)
        app: themeColors.background.app,
        card: themeColors.background.card,
        hover: themeColors.background.hover,
        'alert-warning': themeColors.background.alertWarning,
        'alert-error': themeColors.background.alertError,
        'alert-success': themeColors.background.alertSuccess,
        // Structure imbriquée pour compatibilité (bg-bg-app, etc.)
        bg: {
          app: themeColors.background.app,
          card: themeColors.background.card,
          hover: themeColors.background.hover,
          dark: themeColors.background.dark,
          'alert-warning': themeColors.background.alertWarning,
          'alert-error': themeColors.background.alertError,
          'alert-success': themeColors.background.alertSuccess,
        },
        // ===== BORDURES =====
        border: {
          DEFAULT: themeColors.border.DEFAULT,
          light: themeColors.border.light,
          dark: themeColors.border.dark,
        },
        // ===== COULEURS LEGACY (pour compatibilité) =====
        dark: {
          DEFAULT: '#3b3f5c',
          light: '#eaeaec',
        },
        black: {
          DEFAULT: '#0e1726',
          light: '#e3e4eb',
        },
        white: {
          DEFAULT: '#ffffff',
          light: '#e0e6ed',
          dark: '#888ea8',
        },
      },
            // ===== POLICES (Source: package @SMATCH-Digital-dev/vue-system-design) =====
      fontFamily: {
        heading: themeTypography.fontFamilies.heading,
        body: themeTypography.fontFamilies.body,
        mono: themeTypography.fontFamilies.mono,
      },
      // ===== TAILLES DE POLICE =====
      fontSize: themeTypography.fontSizes,
      // ===== POIDS DE POLICE =====
      fontWeight: themeTypography.fontWeights,
      // ===== HAUTEURS DE LIGNE =====
      lineHeight: themeTypography.lineHeights,
      // ===== ESPACEMENT DES LETTRES =====
      letterSpacing: themeTypography.letterSpacings,
      // ===== ESPACEMENT =====
      spacing: { 4.5: '18px' },
      // ===== OMBRES =====
      boxShadow: { 
        '3xl': '0 2px 2px rgb(224 230 237 / 46%), 1px 6px 7px rgb(224 230 237 / 46%)' 
      },
      // ===== TYPOGRAPHIE PROSE =====
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-invert-headings': theme('colors.white.dark'),
            '--tw-prose-invert-links': theme('colors.white.dark'),
            h1: { fontSize: '40px', margin: '0 0 .5rem' },
            h2: { fontSize: '32px', margin: '0 0 .5rem' },
            h3: { fontSize: '28px', margin: '0 0 .5rem' },
            h4: { fontSize: '24px', margin: '0 0 .5rem' },
            h5: { fontSize: '20px', margin: '0 0 .5rem' },
            h6: { fontSize: '16px', margin: '0 0 .5rem' },
            p: { marginBottom: '.5rem' },
            li: { margin: 0 },
            img: { margin: 0 },
          },
        },
        accentColor: theme => ({
          primary: theme('colors.primary.DEFAULT'),
          secondary: theme('colors.secondary.DEFAULT'),
        }),
      }),
    },
  },
  plugins: [
    require('@tailwindcss/forms')({ strategy: 'class' }),  
    require('@tailwindcss/typography'),
        // Plugin pour exposer les variables CSS du thème du package
    function ({ addBase, theme }) {
            // Récupérer les polices depuis le thème du package
            const { typography: packageTypography } = require('./src/theme/theme.package.cjs');
      const getFontFamily = (key) => {
                const packageFont = packageTypography.fontFamilies[key];
                if (Array.isArray(packageFont)) {
                    return packageFont.join(', ');
        }
                return packageFont || 'sans-serif';
      };

      addBase({
        ':root': {
          // Couleurs principales
          '--color-primary': theme('colors.primary.DEFAULT'),
          '--color-primary-light': theme('colors.primary.light'),
          '--color-primary-dark': theme('colors.primary.dark'),
          '--color-secondary': theme('colors.secondary.DEFAULT'),
          '--color-secondary-light': theme('colors.secondary.light'),
          '--color-secondary-dark': theme('colors.secondary.dark'),
          // Couleurs d'état
          '--color-success': theme('colors.success.DEFAULT'),
          '--color-success-light': theme('colors.success.light'),
          '--color-success-dark': theme('colors.success.dark'),
          '--color-error': theme('colors.error.DEFAULT'),
          '--color-error-light': theme('colors.error.light'),
          '--color-error-dark': theme('colors.error.dark'),
          '--color-warning': theme('colors.warning.DEFAULT'),
          '--color-warning-light': theme('colors.warning.light'),
          '--color-warning-dark': theme('colors.warning.dark'),
          '--color-danger': theme('colors.danger.DEFAULT'),
          '--color-danger-light': theme('colors.danger.light'),
          '--color-danger-dark': theme('colors.danger.dark'),
          '--color-info': theme('colors.info.DEFAULT'),
          '--color-info-light': theme('colors.info.light'),
          '--color-info-dark': theme('colors.info.dark'),
          // Typographie
          '--color-text': theme('colors.text.DEFAULT'),
          '--color-text-light': theme('colors.text.light'),
          '--color-text-dark': theme('colors.text.dark'),
          '--color-text-muted': theme('colors.text.muted'),
          // Arrière-plans
          '--color-bg-app': theme('colors.bg.app'),
          '--color-bg-card': theme('colors.bg.card'),
          '--color-bg-hover': theme('colors.bg.hover'),
          '--color-bg-dark': theme('colors.bg.dark'),
          '--color-bg-alert-warning': theme('colors.bg.alert-warning'),
          '--color-bg-alert-error': theme('colors.bg.alert-error'),
          '--color-bg-alert-success': theme('colors.bg.alert-success'),
          // Bordures
          '--color-border': theme('colors.border.DEFAULT'),
          '--color-border-light': theme('colors.border.light'),
          '--color-border-dark': theme('colors.border.dark'),
          // Polices (utiliser directement depuis le bridge)
          '--font-heading': getFontFamily('heading'),
          '--font-body': getFontFamily('body'),
          '--font-mono': getFontFamily('mono'),
        },
      });
    },  
    rotateX,
  ],
};
