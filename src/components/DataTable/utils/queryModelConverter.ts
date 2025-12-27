/**
 * Convertisseur QueryModel
 *
 * Convertit le QueryModel vers le format query params GET pour l'API.
 * Le DataTable utilise UNIQUEMENT QueryModel comme format standard.
 *
 * @module queryModelConverter
 */

import type { QueryModel } from '../types/QueryModel'

/**
 * Convertit un QueryModel vers le format query params GET
 *
 * Format de sortie conforme à PAGINATION_FRONTEND.md :
 * {
 *   page: 2,
 *   pageSize: 20,
 *   search: "terme de recherche",
 *   sort: [{ colId: "field", sort: "asc" }],
 *   filters: { field: { ... } },
 *   ...customParams
 * }
 *
 * Ces paramètres peuvent être utilisés directement dans une URL GET
 * ou dans le body d'une requête POST/GET.
 *
 * @param queryModel - Modèle de requête QueryModel
 * @returns Paramètres au format query params GET, prêts pour l'API
 *
 * @example
 * ```typescript
 * const queryModel: QueryModel = {
 *   page: 2,
 *   pageSize: 20,
 *   search: "test",
 *   sort: [{ colId: "name", sort: "asc" }],
 *   filters: { status: { operator: "equals", value: "active" } }
 * }
 *
 * const params = convertQueryModelToQueryParams(queryModel)
 * // Résultat : { page: 2, pageSize: 20, search: "test", sort: [...], filters: {...} }
 * ```
 */
export function convertQueryModelToQueryParams(
    queryModel: QueryModel
): Record<string, any> {
    // Commencer avec customParams en premier
    // Les paramètres spécifiques (page, pageSize, sort, filters, search) auront priorité
    const params: Record<string, any> = {
        ...queryModel.customParams
    }

    // Pagination (format standard QueryModel)
    params.page = queryModel.page ?? 1
    params.pageSize = queryModel.pageSize ?? 20

    // Recherche globale (format standard QueryModel)
    if (queryModel.search !== undefined && queryModel.search !== null && queryModel.search !== '') {
        params.search = queryModel.search
    }

    // Tri (format standard QueryModel) - JSON.stringify pour GET query params
    if (queryModel.sort && queryModel.sort.length > 0) {
        params.sort = JSON.stringify(queryModel.sort)
    }

    // Filtres (format standard QueryModel) - JSON.stringify pour GET query params
    // ⚠️ IMPORTANT : Préserver les filtres même s'ils sont un objet vide pour permettre le reset
    // Mais ne pas inclure si undefined ou null
    if (queryModel.filters !== undefined && queryModel.filters !== null && typeof queryModel.filters === 'object') {
        const filterKeys = Object.keys(queryModel.filters)
        // Inclure les filtres s'ils ont au moins une clé OU s'ils sont explicitement un objet vide (pour reset)
        // Ne pas inclure si undefined/null pour éviter d'envoyer des paramètres inutiles
        if (filterKeys.length > 0) {
            params.filters = JSON.stringify(queryModel.filters)
        }
        // Note : Si filters est un objet vide {}, on ne l'inclut pas pour éviter d'envoyer {} à l'API
        // Mais si filters est défini avec des valeurs, on les inclut toujours
    }

    return params
}

/**
 * Crée un QueryModel depuis des paramètres simples
 *
 * Convertit des paramètres simples vers le format QueryModel standard.
 * Accepte le tri au format {colId, sort} ou {field, direction} et le convertit.
 *
 * @param params - Paramètres au format QueryModel standard
 * @param params.page - Numéro de page (optionnel)
 * @param params.pageSize - Taille de page (optionnel)
 * @param params.sort - Tri au format [{colId, sort}] ou [{field, direction}] (optionnel)
 * @param params.filters - Filtres au format unifié (optionnel)
 * @param params.search - Recherche globale (optionnel)
 * @param params.customParams - Paramètres personnalisés additionnels (optionnel)
 * @returns QueryModel au format standard
 *
 * @example
 * ```typescript
 * const queryModel = createQueryModelFromDataTableParams({
 *   page: 2,
 *   pageSize: 20,
 *   search: "test",
 *   sort: [{ colId: "name", sort: "asc" }],
 *   filters: { status: { operator: "equals", value: "active" } }
 * })
 * ```
 */
export function createQueryModelFromDataTableParams(params: {
    page?: number
    pageSize?: number
    sort?: Array<{ colId: string; sort: 'asc' | 'desc' } | { field: string; direction: 'asc' | 'desc' }>
    filters?: Record<string, any>
    search?: string
    customParams?: Record<string, any>
}): QueryModel {
    const queryModel: QueryModel = {}

    // Pagination
    if (params.page !== undefined) {
        queryModel.page = params.page
    }
    if (params.pageSize !== undefined) {
        queryModel.pageSize = params.pageSize
    }

    // Tri : convertir vers format standard [{colId, sort}]
    if (params.sort && params.sort.length > 0) {
        queryModel.sort = params.sort.map(s => {
            if ('colId' in s && 'sort' in s) {
                return { colId: s.colId, sort: s.sort }
            }
            if ('field' in s && 'direction' in s) {
                return { colId: s.field, sort: s.direction }
            }
            return s as { colId: string; sort: 'asc' | 'desc' }
        })
    }

    // Filtres
    if (params.filters) {
        queryModel.filters = params.filters
    }

    // Recherche globale
    if (params.search) {
        queryModel.search = params.search
    }

    // Custom params
    if (params.customParams) {
        queryModel.customParams = params.customParams
    }

    return queryModel
}

/**
 * Fusionne un QueryModel avec des customParams additionnels
 *
 * Cette fonction garantit que TOUS les paramètres du QueryModel (filters, sort, search, page, pageSize)
 * sont préservés lors de la fusion avec les customParams.
 * Les customParams fournis ont priorité sur ceux existants dans le QueryModel.
 *
 * ⚠️ IMPORTANT : Cette fonction préserve explicitement les filtres pour garantir leur transmission à l'API.
 *
 * @param queryModel - QueryModel du DataTable (contient filters, sort, search, etc.)
 * @param customParams - Paramètres personnalisés à ajouter/fusionner (ex: inventory_id, warehouse_id)
 * @returns QueryModel fusionné avec tous les paramètres préservés
 *
 * @example
 * ```typescript
 * const queryModelFromDataTable: QueryModel = {
 *   page: 2,
 *   pageSize: 20,
 *   filters: { status: { operator: "equals", value: "active" } },
 *   sort: [{ colId: "name", sort: "asc" }],
 *   search: "test"
 * }
 *
 * const customParams = { inventory_id: 123, warehouse_id: 456 }
 *
 * const merged = mergeQueryModelWithCustomParams(queryModelFromDataTable, customParams)
 * // Résultat : {
 * //   page: 2,
 * //   pageSize: 20,
 * //   filters: { status: { operator: "equals", value: "active" } }, // ✅ Préservé
 * //   sort: [{ colId: "name", sort: "asc" }],
 * //   search: "test",
 * //   customParams: { inventory_id: 123, warehouse_id: 456 }
 * // }
 * ```
 */
export function mergeQueryModelWithCustomParams(
    queryModel: QueryModel,
    customParams: Record<string, any>
): QueryModel {
    // Fusionner les customParams : préserver ceux du QueryModel et ajouter ceux fournis
    const mergedCustomParams = {
        ...queryModel.customParams,
        ...customParams
    }

    // ⚠️ CRITIQUE : Convertir les Proxy réactifs Vue en objets plain pour garantir la sérialisation correcte
    // Cela évite que les filtres soient perdus lors de la transmission entre composants
    let filtersPlain: Record<string, any> = {}
    if (queryModel.filters) {
        try {
            const filtersStr = JSON.stringify(queryModel.filters)
            filtersPlain = JSON.parse(filtersStr)

            // ⚠️ IMPORTANT : Vérifier que filtersPlain n'est pas un QueryModel complet
            // Si filtersPlain contient 'page', 'pageSize', 'filters', etc., c'est un QueryModel imbriqué incorrectement
            // Dans ce cas, extraire uniquement les filtres réels
            if (filtersPlain && typeof filtersPlain === 'object') {
                const filterKeys = Object.keys(filtersPlain)
                const hasQueryModelKeys = filterKeys.some(key => ['page', 'pageSize', 'filters', 'sort', 'search', 'customParams'].includes(key))

                if (hasQueryModelKeys && 'filters' in filtersPlain && typeof filtersPlain.filters === 'object') {
                    // C'est un QueryModel imbriqué, extraire uniquement les filtres réels
                    console.warn('[mergeQueryModelWithCustomParams] QueryModel détecté dans filters, extraction des filtres réels')
                    filtersPlain = filtersPlain.filters || {}
                }
            }
        } catch (e) {
            console.error('[mergeQueryModelWithCustomParams] Erreur lors de la conversion des filtres:', e)
            filtersPlain = {}
        }
    }

    const sortPlain = queryModel.sort ? JSON.parse(JSON.stringify(queryModel.sort)) : undefined

    // Construire le QueryModel final en préservant TOUS les paramètres du format standard
    return {
        page: queryModel.page,
        pageSize: queryModel.pageSize,
        sort: sortPlain,
        filters: filtersPlain, // ⚠️ CRITIQUE : Utiliser l'objet plain (pas le Proxy réactif)
        search: queryModel.search,
        customParams: mergedCustomParams
    }
}
