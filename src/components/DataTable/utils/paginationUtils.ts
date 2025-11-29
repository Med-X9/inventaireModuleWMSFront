/**
 * Utilitaires pour la pagination (DRY - Don't Repeat Yourself)
 * Centralise toute la logique de pagination réutilisable
 */

export interface PaginationState {
    currentPage: number
    pageSize: number
    totalItems: number
}

export interface PaginationCalculations {
    totalPages: number
    start: number
    end: number
    hasNext: boolean
    hasPrevious: boolean
}

/**
 * Calcule les informations de pagination
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
 */
export function validatePagination(page: number, pageSize: number, totalItems: number): boolean {
    if (page < 1) return false
    if (pageSize < 1) return false
    if (totalItems < 0) return false
    return true
}

/**
 * Normalise les paramètres de pagination
 */
export function normalizePagination(page: number, pageSize: number, totalItems: number): PaginationState {
    return {
        currentPage: Math.max(1, Math.floor(page)),
        pageSize: Math.max(1, Math.floor(pageSize)),
        totalItems: Math.max(0, Math.floor(totalItems))
    }
}

