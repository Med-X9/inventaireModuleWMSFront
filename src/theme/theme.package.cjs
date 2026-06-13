/**
 * Pont entre le thème TypeScript et Tailwind CSS (CommonJS)
 * Ce fichier exporte le thème dans un format compatible avec tailwind.config.cjs
 *
 * IMPORTANT: Les valeurs doivent être synchronisées avec src/theme/colors.ts et src/theme/typography.ts
 *
 * @module theme/theme.bridge
 */

// ===== COULEURS Prolog IMS (Source: src/theme/colors.ts — docs/prolog-ims-color-palette.html) =====
const themeColors = {
    primary: {
        DEFAULT: '#2353A4',
        light: '#1A9EFF',
        dark: '#0B1E3D',
        50: '#F0F3F8',
        100: '#DDE3EE',
        200: '#C5CEDD',
        300: '#8A99B3',
        400: '#3A6DC0',
        500: '#3A6DC0',
        600: '#2353A4',
        700: '#1A3D78',
        800: '#122A54',
        900: '#0B1E3D',
    },
    secondary: {
        DEFAULT: '#1A9EFF',
        light: '#5BBDFF',
        dark: '#006FCC',
    },
    success: {
        DEFAULT: '#0E9E6E',
        light: '#E8FAF4',
        dark: '#076949',
        50: '#E8FAF4',
        100: '#E8FAF4',
        500: '#0E9E6E',
        600: '#076949',
        700: '#065F46',
    },
    error: {
        DEFAULT: '#DC2626',
        light: '#FEE8E8',
        dark: '#991B1B',
        50: '#FEE8E8',
        100: '#FEE8E8',
        500: '#DC2626',
        600: '#DC2626',
        700: '#991B1B',
    },
    danger: {
        DEFAULT: '#DC2626',
        light: '#FEE8E8',
        dark: '#991B1B',
    },
    warning: {
        DEFAULT: '#D97706',
        light: '#FEF3CD',
        dark: '#92500A',
        50: '#FEF3CD',
        100: '#FEF3CD',
        500: '#D97706',
        600: '#D97706',
        700: '#92500A',
    },
    info: {
        DEFAULT: '#1A9EFF',
        light: '#E8F5FF',
        dark: '#006FCC',
        50: '#E8F5FF',
        100: '#BDE4FF',
        500: '#1A9EFF',
        600: '#006FCC',
        700: '#006FCC',
    },
    text: {
        DEFAULT: '#1E2A3B',
        light: '#5A6A87',
        dark: '#344560',
        muted: '#8A99B3',
    },
    background: {
        app: '#F5F7FA',
        card: '#FFFFFF',
        hover: '#E8F5FF',
        dark: '#0B1E3D',
        alertWarning: '#FEF3CD',
        alertError: '#FEE8E8',
        alertSuccess: '#E8FAF4',
    },
    border: {
        DEFAULT: '#DDE3EE',
        light: '#EEF1F6',
        dark: '#344560',
    },
    navy: {
        50: '#F0F3F8',
        100: '#DDE3EE',
        500: '#3A6DC0',
        600: '#2353A4',
        700: '#1A3D78',
        800: '#122A54',
        900: '#0B1E3D',
    },
    accent: {
        50: '#E8F5FF',
        100: '#BDE4FF',
        300: '#5BBDFF',
        500: '#1A9EFF',
        700: '#006FCC',
    },
};

// ===== TYPOGRAPHIE (Source: src/theme/typography.ts) =====
const themeTypography = {
    fontFamilies: {
        heading: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
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

// ===== SPACING (Source: src/theme/spacing.ts) =====
const themeSpacing = {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    32: '8rem',     // 128px
    40: '10rem',    // 160px
    48: '12rem',    // 192px
    64: '16rem',    // 256px
};

// ===== SHADOWS (Source: src/theme/shadows.ts) =====
const themeShadows = {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    colored: {
        primary: '0 4px 6px -1px rgb(35 83 164 / 0.35), 0 2px 4px -2px rgb(35 83 164 / 0.25)',
        success: '0 4px 6px -1px rgb(14 158 110 / 0.3), 0 2px 4px -2px rgb(14 158 110 / 0.25)',
        error: '0 4px 6px -1px rgb(220 38 38 / 0.3), 0 2px 4px -2px rgb(220 38 38 / 0.25)',
        warning: '0 4px 6px -1px rgb(217 119 6 / 0.3), 0 2px 4px -2px rgb(217 119 6 / 0.25)',
        info: '0 4px 6px -1px rgb(26 158 255 / 0.35), 0 2px 4px -2px rgb(26 158 255 / 0.25)',
    },
};

// ===== BORDERS (Source: src/theme/borders.ts) =====
const themeBorders = {
    radius: {
        none: '0',
        sm: '0.125rem',    // 2px
        DEFAULT: '0.25rem', // 4px
        md: '0.375rem',    // 6px
        lg: '0.5rem',      // 8px
        xl: '0.75rem',     // 12px
        '2xl': '1rem',     // 16px
        '3xl': '1.5rem',   // 24px
        full: '9999px',
    },
    width: {
        DEFAULT: '1px',
        0: '0',
        2: '2px',
        4: '4px',
        8: '8px',
    },
    style: {
        solid: 'solid',
        dashed: 'dashed',
        dotted: 'dotted',
        double: 'double',
        none: 'none',
    },
};

// ===== BREAKPOINTS (Source: src/theme/breakpoints.ts) =====
const themeBreakpoints = {
    xs: '0px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
};

// ===== Z-INDEX (Source: src/theme/zIndex.ts) =====
const themeZIndex = {
    auto: 'auto',
    0: '0',
    10: '10',
    20: '20',
    30: '30',
    40: '40',
    50: '50',
    dropdown: '1000',
    sticky: '1020',
    fixed: '1030',
    modalBackdrop: '1040',
    modal: '1050',
    popover: '1060',
    tooltip: '1070',
    notification: '1080',
};

// ===== ANIMATIONS (Source: src/theme/animations.ts) =====
const themeAnimations = {
    duration: {
        75: '75ms',
        100: '100ms',
        150: '150ms',
        200: '200ms',
        300: '300ms',
        500: '500ms',
        700: '700ms',
        1000: '1000ms',
    },
    timingFunction: {
        linear: 'linear',
        in: 'cubic-bezier(0.4, 0, 1, 1)',
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    delay: {
        75: '75ms',
        100: '100ms',
        150: '150ms',
        200: '200ms',
        300: '300ms',
        500: '500ms',
        700: '700ms',
        1000: '1000ms',
    },
};

// ===== OPACITY (Source: src/theme/opacity.ts) =====
const themeOpacity = {
    0: '0',
    5: '0.05',
    10: '0.1',
    20: '0.2',
    25: '0.25',
    30: '0.3',
    40: '0.4',
    50: '0.5',
    60: '0.6',
    70: '0.7',
    75: '0.75',
    80: '0.8',
    90: '0.9',
    95: '0.95',
    100: '1',
};

// ===== ICONS (Source: src/theme/icons.ts) =====
const themeIcons = {
    sizes: {
        xs: '0.75rem',    // 12px
        sm: '1rem',       // 16px
        md: '1.25rem',    // 20px
        lg: '1.5rem',     // 24px
        xl: '2rem',       // 32px
        '2xl': '2.5rem',  // 40px
        '3xl': '3rem',    // 48px
    },
    strokeWidth: {
        thin: '1',
        DEFAULT: '1.5',
        medium: '2',
        thick: '2.5',
        'extra-thick': '3',
    },
    opacity: {
        full: '1',
        high: '0.9',
        medium: '0.7',
        DEFAULT: '0.5',
        low: '0.3',
        veryLow: '0.1',
    },
};

module.exports = {
    colors: themeColors,
    typography: themeTypography,
    spacing: themeSpacing,
    shadows: themeShadows,
    borders: themeBorders,
    breakpoints: themeBreakpoints,
    zIndex: themeZIndex,
    animations: themeAnimations,
    opacity: themeOpacity,
    icons: themeIcons,
};

