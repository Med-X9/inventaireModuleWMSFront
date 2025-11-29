/**
 * Pont entre le thème TypeScript et Tailwind CSS (CommonJS)
 * Ce fichier exporte le thème dans un format compatible avec tailwind.config.cjs
 * 
 * IMPORTANT: Les valeurs doivent être synchronisées avec src/theme/colors.ts et src/theme/typography.ts
 * 
 * @module theme/theme.bridge
 */

// ===== COULEURS (Source: src/theme/colors.ts) =====
const themeColors = {
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

// ===== TYPOGRAPHIE (Source: src/theme/typography.ts) =====
const themeTypography = {
    fontFamilies: {
        heading: ['Montserrat', 'sans-serif'],
        body: ['Roboto', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
    },
    fontSizes: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
    },
    fontWeights: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
    },
    lineHeights: {
        none: 1,
        tight: 1.25,
        snug: 1.375,
        normal: 1.5,
        relaxed: 1.625,
        loose: 2,
    },
    letterSpacings: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0em',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
    },
};

module.exports = {
    colors: themeColors,
    typography: themeTypography,
};

