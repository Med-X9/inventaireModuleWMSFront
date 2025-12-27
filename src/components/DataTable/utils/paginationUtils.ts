/**
 * Utilitaires pour la pagination (DRY - Don't Repeat Yourself)
 * 
 * Centralise toute la logique de pagination réutilisable pour le DataTable.
 * Gère le calcul, la validation et la normalisation des paramètres de pagination.
 * 
 * @module paginationUtils
 */

/**
 * État de pagination
 */
export interface PaginationState {
    /** Page actuelle (commence à 1) */
    currentPage: number
    /** Nombre d'éléments par page */
    pageSize: number
    /** Nombre total d'éléments */
    totalItems: number
}

/**
 * Calculs de pagination
 */
export interface PaginationCalculations {
    /** Nombre total de pages */
    totalPages: number
    /** Index de début (1-based) */
    start: number
    /** Index de fin (1-based) */
    end: number
    /** Indique s'il y a une page suivante */
    hasNext: boolean
    /** Indique s'il y a une page précédente */
    hasPrevious: boolean
}

/**
 * Calcule les informations de pagination
 * 
 * @param state - État de pagination
 * @returns Calculs de pagination (totalPages, start, end, hasNext, hasPrevious)
 * 
 * @example
 * ```typescript
 * calculatePagination({ currentPage: 2, pageSize: 20, totalItems: 100 })
 * // Résultat : { totalPages: 5, start: 21, end: 40, hasNext: true, hasPrevious: true }
 * ```
 */
export function calculatePagination(state: PaginationState): PaginationCalculations {
    const totalPages = Math.ceil(state.totalItems / state.pageSize)
    const start = (state.currentPage - 1) * state.pageSize + 1
    const end = Math.min(state.currentPage * state.pageSize, state.totalItems)
    const hasNext = state.currentPage < totalPages
    const hasPrevious = state.currentPage > 1

    return {
        totalPages,
        start,
        end,
        hasNext,
        hasPrevious
    }
}

/**
 * Valide les paramètres de pagination
 * 
 * @param page - Numéro de page (doit être >= 1)
 * @param pageSize - Taille de page (doit être >= 1)
 * @param totalItems - Nombre total d'éléments (doit être >= 0)
 * @returns true si les paramètres sont valides, false sinon
 * 
 * @example
 * ```typescript
 * validatePagination(1, 20, 100) // true
 * validatePagination(0, 20, 100) // false (page < 1)
 * validatePagination(1, 0, 100) // false (pageSize < 1)
 * ```
 */
export function validatePagination(page: number, pageSize: number, totalItems: number): boolean {
    if (page < 1) return false
    if (pageSize < 1) return false
    if (totalItems < 0) return false
    return true
}

/**
 * Normalise les paramètres de pagination
 * 
 * Assure que tous les paramètres sont des entiers valides (>= 1 pour page/pageSize, >= 0 pour totalItems).
 * 
 * @param page - Numéro de page
 * @param pageSize - Taille de page
 * @param totalItems - Nombre total d'éléments
 * @returns État de pagination normalisé
 * 
 * @example
 * ```typescript
 * normalizePagination(0, -5, -10)
 * // Résultat : { currentPage: 1, pageSize: 1, totalItems: 0 }
 * ```
 */
export function normalizePagination(page: number, pageSize: number, totalItems: number): PaginationState {
    return {
        currentPage: Math.max(1, Math.floor(page)),
        pageSize: Math.max(1, Math.floor(pageSize)),
        totalItems: Math.max(0, Math.floor(totalItems))
    }
}

