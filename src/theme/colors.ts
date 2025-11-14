/**
 * Palette de couleurs pour l'application WMS / Gestion d'inventaire
 * Style Tech & Industrielle
 *
 * @module theme/colors
 */

/**
 * Palette principale de couleurs
 */
export const colors = {
    /**
     * Couleur principale - Indigo
     * Utilisée pour : boutons principaux, titres, éléments importants
     */
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

    /**
     * Couleur secondaire - Indigo clair
     * Utilisée pour : hover, accents, éléments secondaires
     */
    secondary: {
        DEFAULT: '#6366F1',
        light: '#818CF8',
        dark: '#4F46E5',
    },

    /**
     * Couleur d'erreur - Rouge vif
     * Utilisée pour : alertes et erreurs importantes
     */
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

    /**
     * Couleur de succès - Vert émeraude
     * Utilisée pour : statuts OK, confirmations
     */
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

    /**
     * Couleur d'avertissement - Jaune/Orange
     * Utilisée pour : alertes modérées
     */
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

    /**
     * Couleur de danger - Rouge sombre
     * Utilisée pour : situations critiques
     */
    danger: {
        DEFAULT: '#DC2626',
        light: '#FEE2E2',
        dark: '#B91C1C',
    },

    /**
     * Couleur d'information - Bleu clair
     * Utilisée pour : messages informatifs
     */
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

    /**
     * Typographie principale - Bleu nuit très foncé
     * Utilisée pour : textes et labels
     */
    text: {
        DEFAULT: '#0F172A',
        light: '#475569',
        dark: '#1E293B',
        muted: '#64748B',
    },

    /**
     * Arrière-plans
     */
    background: {
        /**
         * Arrière-plan principal de l'application
         */
        app: '#F8FAFC',

        /**
         * Arrière-plan secondaire (cards, panels)
         */
        card: '#FFFFFF',

        /**
         * Arrière-plan hover / highlight
         */
        hover: '#E0E7FF',

        /**
         * Arrière-plan sombre / alternative
         */
        dark: '#1E293B',

        /**
         * Arrière-plan alert warning
         */
        alertWarning: '#FEF3C7',

        /**
         * Arrière-plan alert error
         */
        alertError: '#FEE2E2',

        /**
         * Arrière-plan alert success
         */
        alertSuccess: '#DCFCE7',
    },

    /**
     * Bordures
     */
    border: {
        DEFAULT: '#E2E8F0',
        light: '#F1F5F9',
        dark: '#334155',
    },
} as const

/**
 * Type pour les couleurs
 */
export type ColorKey = keyof typeof colors

/**
 * Couleurs pour le mode sombre
 */
export const darkColors = {
    text: {
        DEFAULT: '#F8FAFC',
        light: '#CBD5E1',
        dark: '#94A3B8',
        muted: '#64748B',
    },
    background: {
        app: '#0F172A',
        card: '#1E293B',
        hover: '#334155',
        dark: '#0F172A',
    },
    border: {
        DEFAULT: '#334155',
        light: '#475569',
        dark: '#1E293B',
    },
} as const

