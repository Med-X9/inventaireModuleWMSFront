/**
 * Utilitaire de normalisation des réponses DataTable
 *
 * Normalise toutes les réponses backend vers le format unifié :
 * { rows: [...], page: number, pageSize: number, total: number, totalPages: number }
 */

import { logger } from '@/services/loggerService'

/**
 * Format unifié de réponse DataTable
 */
export interface UnifiedDataTableResponse<T = any> {
    rows: T[]
    page: number
    pageSize: number
    total: number
    totalPages: number
}

/**
 * Normalise les réponses backend vers le format unifié
 *
 * Format attendu du backend :
 * { rows: [...], page: 2, pageSize: 10, total: 28, totalPages: 3 }
 *
 * @param payload - Réponse brute du backend
 * @returns Réponse normalisée au format unifié
 */
export function normalizeDataTableResponse<T = any>(
    payload: any
): UnifiedDataTableResponse<T> {
    // Vérifier que payload est un objet valide
    if (!payload || typeof payload !== 'object') {
        logger.warn('Format de réponse backend invalide (pas un objet)', payload)
        return {
            rows: [],
            page: 1,
            pageSize: 20,
            total: 0,
            totalPages: 0
        }
    }

    // Format unifié attendu selon PAGINATION_FRONTEND.md : { rows: [...], page, pageSize, total, totalPages }
    // ⚠️ Utiliser UNIQUEMENT les valeurs du backend - aucun calcul (le backend doit toujours fournir totalPages)
    if ('rows' in payload && Array.isArray(payload.rows)) {
        // Utiliser uniquement les valeurs retournées par le backend
        // Selon PAGINATION_FRONTEND.md, le backend doit toujours fournir ces valeurs
        const page = payload.page ?? 1
        const pageSize = payload.pageSize ?? 20
        // ⚠️ Certains backends renvoient pageSize dans "total" et le vrai total dans "total_count"
        // On doit donc prioriser total_count / totalCount avant total
        const total = payload.total_count ?? payload.totalCount ?? payload.total ?? 0

        // ⚠️ IMPORTANT : Utiliser UNIQUEMENT totalPages du backend selon PAGINATION_FRONTEND.md
        // Le backend doit toujours fournir totalPages calculé côté serveur
        // Fallback de sécurité uniquement si le backend ne fournit vraiment pas la valeur
        let totalPages = payload.totalPages
        if (totalPages === undefined || totalPages === null) {
            // Seulement si totalPages n'est vraiment pas fourni (undefined/null), calculer comme fallback
            // Cela ne devrait pas arriver si le backend suit PAGINATION_FRONTEND.md
            logger.warn('totalPages non fourni par le backend, calcul de fallback', { payload })
            totalPages = total > 0 && pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : (total === 0 ? 1 : 0)
        }

        // Format PAGINATION_FRONTEND.md détecté : { rows, page, pageSize, total, totalPages }

        return {
            rows: payload.rows as T[],
            page: Number(page),
            pageSize: Number(pageSize),
            total: Number(total),
            totalPages: Number(totalPages)
        }
    }

    // Format non reconnu - essayer de convertir depuis d'autres formats
    // Support des formats alternatifs pour compatibilité
    if ('data' in payload && Array.isArray(payload.data)) {
        // Format DataTable standard : { data: [...], recordsFiltered, recordsTotal, page, totalPages, pageSize, total }
        const page = payload.page ?? 1
        const pageSize = payload.pageSize ?? 20
        const total = payload.total ?? payload.recordsFiltered ?? payload.recordsTotal ?? 0
        const totalPages = payload.totalPages ?? (total > 0 ? Math.ceil(total / pageSize) : 0)

        return {
            rows: payload.data as T[],
            page: Number(page),
            pageSize: Number(pageSize),
            total: Number(total),
            totalPages: Number(totalPages)
        }
    }

    if ('results' in payload && Array.isArray(payload.results)) {
        // Format REST API : { results: [...], count, next, previous }
        const page = payload.page ?? 1
        const pageSize = payload.pageSize ?? 20
        const total = payload.total ?? payload.count ?? 0
        const totalPages = payload.totalPages ?? (total > 0 ? Math.ceil(total / pageSize) : 0)

        return {
            rows: payload.results as T[],
            page: Number(page),
            pageSize: Number(pageSize),
            total: Number(total),
            totalPages: Number(totalPages)
        }
    }

    logger.warn('Format de réponse backend non reconnu (pas de champ "rows", "data" ou "results")', payload)

    // Retourner un format vide par défaut
    return {
        rows: [],
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0
    }
}

/**
 * Convertit le format unifié vers le format DataTable standard (pour compatibilité)
 *
 * @param unifiedResponse - Réponse au format unifié
 * @returns Réponse au format DataTable standard
 */
export function convertUnifiedToStandardDataTable<T = any>(
    unifiedResponse: UnifiedDataTableResponse<T>
): {
    data: T[]
    recordsFiltered: number
    recordsTotal: number
    draw?: number
} {
    return {
        data: unifiedResponse.rows,
        recordsFiltered: unifiedResponse.total,
        recordsTotal: unifiedResponse.total,
        draw: 1
    }
}

