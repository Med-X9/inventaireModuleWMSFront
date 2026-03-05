/**
 * Constantes pour useInventoryResults
 *
 * Centralise toutes les valeurs configurables pour faciliter la maintenance
 */

// Délais en millisecondes
export const INITIALIZATION_DELAY_MS = 150 // Délai pour laisser le DataTable s'initialiser
export const MODAL_CLOSE_DELAY_MS = 300 // Délai avant de fermer/démontrer une modal
export const STORES_FETCH_TIMEOUT_MS = 500 // Timeout pour le fetch des magasins

// Valeurs par défaut
export const DEFAULT_PAGE = 1
export const DEFAULT_PAGE_SIZE = 50
export const DEFAULT_MAX_PENDING_EVENTS = 10 // Taille max de la file d'attente
export const DEFAULT_KEEP_PENDING_EVENTS = 5 // Nombre d'événements à garder si dépassement

// Clés de stockage
export const STORAGE_KEYS = {
    INVENTORY_RESULTS_TABLE: 'inventory_results_table'
} as const

// Messages d'erreur
export const ERROR_MESSAGES = {
    LOAD_RESULTS: 'Erreur lors du chargement des résultats',
    INITIALIZATION: 'Erreur lors de l\'initialisation des résultats',
    STORE_SELECTION: 'Erreur lors de la sélection du magasin',
    INVENTORY_NOT_FOUND: (ref: string) => `Inventaire "${ref}" introuvable`
} as const

