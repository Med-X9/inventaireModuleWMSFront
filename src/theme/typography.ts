/**
 * Configuration de la typographie pour l'application WMS
 * Style Tech & Industrielle
 * 
 * @module theme/typography
 */

/**
 * Familles de polices
 */
export const fontFamilies = {
    /**
     * Police pour les titres (H1-H6)
     * Montserrat - moderne, industriel, lisible
     */
    heading: ['Montserrat', 'sans-serif'],

    /**
     * Police pour les textes et paragraphes
     * Roboto - standard, lisible pour dashboards et applications industrielles
     */
    body: ['Roboto', 'sans-serif'],

    /**
     * Police monospace pour le code
     */
    mono: ['Roboto Mono', 'monospace'],
} as const

/**
 * Tailles de police
 */
export const fontSizes = {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
} as const

/**
 * Poids de police
 */
export const fontWeights = {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
} as const

/**
 * Hauteurs de ligne
 */
export const lineHeights = {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
} as const

/**
 * Espacement des lettres
 */
export const letterSpacings = {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
} as const

/**
 * Styles de typographie prédéfinis
 */
export const typography = {
    /**
     * Style pour H1
     */
    h1: {
        fontFamily: fontFamilies.heading,
        fontSize: fontSizes['5xl'],
        fontWeight: fontWeights.bold,
        lineHeight: lineHeights.tight,
        letterSpacing: letterSpacings.tight,
    },

    /**
     * Style pour H2
     */
    h2: {
        fontFamily: fontFamilies.heading,
        fontSize: fontSizes['4xl'],
        fontWeight: fontWeights.bold,
        lineHeight: lineHeights.tight,
        letterSpacing: letterSpacings.tight,
    },

    /**
     * Style pour H3
     */
    h3: {
        fontFamily: fontFamilies.heading,
        fontSize: fontSizes['3xl'],
        fontWeight: fontWeights.semibold,
        lineHeight: lineHeights.snug,
        letterSpacing: letterSpacings.normal,
    },

    /**
     * Style pour H4
     */
    h4: {
        fontFamily: fontFamilies.heading,
        fontSize: fontSizes['2xl'],
        fontWeight: fontWeights.semibold,
        lineHeight: lineHeights.snug,
        letterSpacing: letterSpacings.normal,
    },

    /**
     * Style pour H5
     */
    h5: {
        fontFamily: fontFamilies.heading,
        fontSize: fontSizes.xl,
        fontWeight: fontWeights.semibold,
        lineHeight: lineHeights.normal,
        letterSpacing: letterSpacings.normal,
    },

    /**
     * Style pour H6
     */
    h6: {
        fontFamily: fontFamilies.heading,
        fontSize: fontSizes.lg,
        fontWeight: fontWeights.medium,
        lineHeight: lineHeights.normal,
        letterSpacing: letterSpacings.normal,
    },

    /**
     * Style pour le texte du corps
     */
    body: {
        fontFamily: fontFamilies.body,
        fontSize: fontSizes.base,
        fontWeight: fontWeights.normal,
        lineHeight: lineHeights.relaxed,
        letterSpacing: letterSpacings.normal,
    },

    /**
     * Style pour les petits textes
     */
    small: {
        fontFamily: fontFamilies.body,
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.normal,
        lineHeight: lineHeights.normal,
        letterSpacing: letterSpacings.normal,
    },

    /**
     * Style pour les labels
     */
    label: {
        fontFamily: fontFamilies.body,
        fontSize: fontSizes.sm,
        fontWeight: fontWeights.medium,
        lineHeight: lineHeights.normal,
        letterSpacing: letterSpacings.wide,
        textTransform: 'uppercase' as const,
    },
} as const

/**
 * Type pour les styles de typographie
 */
export type TypographyStyle = keyof typeof typography

