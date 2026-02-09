/**
 * Constantes pour le DataTable
 *
 * Centralise toutes les valeurs magiques pour faciliter la maintenance
 *
 * @module DataTableConstants
 */

/**
 * Délais et timeouts
 */
export const DATA_TABLE_CONSTANTS = {
    /** Délai de debounce pour les filtres (ms) */
    DEBOUNCE_FILTER_DELAY: 300,

    /** Délai de debounce pour la recherche globale (ms) */
    DEBOUNCE_SEARCH_DELAY: 500,

    /** Délai de sauvegarde de la persistance (ms) */
    PERSISTENCE_SAVE_DELAY: 500,

    /** Timeout du cache des valeurs de cellules (ms) - 5 minutes */
    CELL_VALUE_CACHE_TIMEOUT: 300000,

    /** Taille de page par défaut */
    DEFAULT_PAGE_SIZE: 20,

    /** Taille de page minimale */
    MIN_PAGE_SIZE: 20,

    /** Options de taille de page disponibles */
    PAGE_SIZE_OPTIONS: [20, 50, 100, 200, 500, 'all'] as const,

    /** Seuil pour activer le virtual scrolling automatiquement */
    VIRTUAL_SCROLLING_THRESHOLD: 2000,

    /** Nombre de colonnes visibles par défaut */
    DEFAULT_VISIBLE_COLUMNS_COUNT: 50,

    /** Nombre de lignes skeleton par défaut */
    DEFAULT_SKELETON_ROWS_COUNT: 20,

    /** Overscan pour le virtual scrolling (lignes à pré-charger) */
    VIRTUAL_SCROLLING_OVERSCAN: 15,

    /** Hauteur par défaut d'une ligne (px) */
    DEFAULT_ROW_HEIGHT: 50,

    /** Hauteur par défaut du conteneur virtual scrolling (px) */
    DEFAULT_VIRTUAL_SCROLLING_CONTAINER_HEIGHT: 600
} as const

/**
 * Types pour les constantes
 */
export type PageSizeOption = typeof DATA_TABLE_CONSTANTS.PAGE_SIZE_OPTIONS[number]

