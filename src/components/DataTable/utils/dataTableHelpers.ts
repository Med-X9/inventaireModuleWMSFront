/**
 * Helpers centralisés pour DataTable (DRY - Don't Repeat Yourself)
 * 
 * Utilitaires généraux pour le DataTable :
 * - Mapping frontend/backend (champs, opérateurs)
 * - Construction de paramètres URL
 * - Transformation de filtres
 * - Transformation de filtres (server-side uniquement)
 * - Mise à jour de pagination depuis les réponses backend
 * 
 * @module dataTableHelpers
 */

import type { FilterOperator } from '../types/dataTable'
import { calculatePagination, normalizePagination, type PaginationState } from './paginationUtils'
import { applyFilters, applyGlobalSearch, type FilterValue } from './filterUtils'
import { sortData, type SortRule } from './sortUtils'

/**
 * Mappe les champs frontend vers les champs backend Django
 * 
 * Convertit les noms de champs du frontend vers le format attendu par le backend Django.
 * Gère les relations Django avec la notation `__` (ex: `article__code_article`).
 * 
 * @param frontendField - Nom du champ côté frontend
 * @returns Nom du champ côté backend Django
 * 
 * @example
 * ```typescript
 * mapFrontendFieldToBackend('article_code_article') // 'article__code_article'
 * mapFrontendFieldToBackend('emplacement') // 'emplacement'
 * mapFrontendFieldToBackend('unknown_field') // 'unknown_field' (non mappé, retourné tel quel)
 * ```
 */
export function mapFrontendFieldToBackend(frontendField: string): string {
    const fieldMap: Record<string, string> = {
        'article_code_article': 'article__code_article',
        'article_designation': 'article__designation',
        'emplacement': 'emplacement',
        'reference': 'reference',
        'status': 'status',
        'label': 'label'
    }
    return fieldMap[frontendField] || frontendField
}

/**
 * Mappe les opérateurs DataTable vers Django ORM
 * 
 * Convertit les opérateurs utilisés par le DataTable vers les opérateurs
 * acceptés par Django ORM pour les requêtes de filtrage.
 * 
 * @param operator - Opérateur du DataTable
 * @returns Opérateur Django ORM (par défaut: 'contains')
 * 
 * @example
 * ```typescript
 * mapDataTableOperatorToBackend('equals') // 'exact'
 * mapDataTableOperatorToBackend('greater_than') // 'gt'
 * mapDataTableOperatorToBackend('contains') // 'contains'
 * mapDataTableOperatorToBackend('unknown') // 'contains' (défaut)
 * ```
 */
export function mapDataTableOperatorToBackend(operator: FilterOperator): string {
    const operatorMap: Record<string, string> = {
        'equals': 'exact',
        'not_equals': 'ne',
        'contains': 'contains',
        'starts_with': 'startswith',
        'ends_with': 'endswith',
        'greater_than': 'gt',
        'less_than': 'lt',
        'greater_equal': 'gte',
        'less_equal': 'lte',
        'between': 'range',
        'in': 'in',
        'is_null': 'isnull',
        'is_not_null': 'isnotnull'
    }
    return operatorMap[operator] || 'contains'
}

/**
 * Construit les paramètres URL au format DataTable standard
 * 
 * Crée des paramètres URLSearchParams au format DataTables standard
 * (compatible avec l'ancien format DataTables pour compatibilité).
 * 
 * Note : Pour les nouvelles implémentations, préférer `convertQueryModelToQueryParams`
 * de `queryModelConverter.ts` qui utilise le format QueryModel standard.
 * 
 * @param params - Paramètres de la table
 * @param params.page - Numéro de page
 * @param params.pageSize - Taille de page
 * @param params.search - Recherche globale (optionnel)
 * @param params.sortModel - Modèle de tri (optionnel)
 * @param params.filters - Filtres (optionnel)
 * @returns URLSearchParams au format DataTables standard
 * 
 * @deprecated Préférer `convertQueryModelToQueryParams` de `queryModelConverter.ts`
 * 
 * @example
 * ```typescript
 * buildDataTableParams({
 *   page: 2,
 *   pageSize: 20,
 *   search: 'test',
 *   sortModel: [{ field: 'name', direction: 'asc' }],
 *   filters: { status: { operator: 'equals', value: 'active' } }
 * })
 * ```
 */
export function buildDataTableParams(params: {
    page: number
    pageSize: number
    search?: string
    sortModel?: Array<{ field: string; direction: 'asc' | 'desc' }>
    filters?: Record<string, FilterValue>
}): URLSearchParams {
    const urlParams = new URLSearchParams()
    const normalized = normalizePagination(params.page, params.pageSize, 0)
    const calculations = calculatePagination(normalized)
    
    urlParams.append('draw', '1')
    urlParams.append('start', String(calculations.start - 1))
    urlParams.append('length', String(params.pageSize))
    
    if (params.search) {
        urlParams.append('search[value]', params.search)
        urlParams.append('search[regex]', 'false')
    }
    
    if (params.sortModel && params.sortModel.length > 0) {
        params.sortModel.forEach((sort, index) => {
            urlParams.append(`order[${index}][column]`, '0')
            urlParams.append(`order[${index}][dir]`, sort.direction)
        })
    }
    
    if (params.filters) {
        Object.entries(params.filters).forEach(([field, filter]) => {
            if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
                const backendField = mapFrontendFieldToBackend(field)
                const backendOperator = mapDataTableOperatorToBackend(filter.operator || 'contains')
                urlParams.append(`${backendField}_${backendOperator}`, String(filter.value))
            }
        })
    }
    
    return urlParams
}

/**
 * Transforme les filtres DataTable vers le format backend
 * 
 * Normalise les filtres depuis différents formats vers le format unifié FilterValue.
 * 
 * @param filters - Filtres au format variable (peut avoir value ou values)
 * @returns Filtres normalisés au format FilterValue
 * 
 * @example
 * ```typescript
 * transformDataTableFilters({
 *   status: { operator: 'equals', value: 'active' },
 *   tags: { operator: 'in', values: ['tag1', 'tag2'] }
 * })
 * // Résultat : { status: { operator: 'equals', value: 'active' }, tags: { operator: 'in', values: ['tag1', 'tag2'] } }
 * ```
 */
export function transformDataTableFilters(filters: Record<string, any>): Record<string, FilterValue> {
    const transformed: Record<string, FilterValue> = {}
    
    Object.entries(filters).forEach(([field, filter]) => {
        if (filter && (filter.value !== undefined || filter.values !== undefined)) {
            transformed[field] = {
                operator: filter.operator || 'contains',
                value: filter.value,
                value2: filter.value2,
                values: filter.values
            }
        }
    })
    
    return transformed
}

/**
 * ⚡ SUPPRIMÉ : filterAndSortData
 * 
 * Cette fonction était utilisée pour le filtrage et tri côté client.
 * En mode server-side uniquement, toutes les opérations sont gérées par le serveur.
 * 
 * @deprecated Supprimé - Utiliser le serveur pour toutes les opérations de filtrage/tri
 */

/**
 * Met à jour la pagination depuis une réponse backend
 * 
 * Extrait le nombre total d'éléments depuis différentes propriétés possibles
 * de la réponse backend et met à jour l'état de pagination.
 * 
 * Propriétés recherchées (par ordre de priorité) :
 * - recordsFiltered (format DataTables)
 * - totalRows
 * - recordsTotal (format DataTables)
 * - total
 * 
 * @param result - Réponse du backend
 * @param state - État de pagination actuel (non utilisé, conservé pour compatibilité)
 * @param setTotalItems - Fonction pour mettre à jour le nombre total d'éléments
 * 
 * @example
 * ```typescript
 * updatePaginationFromResult(
 *   { recordsFiltered: 100 },
 *   { currentPage: 1, pageSize: 20, totalItems: 0 },
 *   (total) => { totalItems.value = total }
 * )
 * // totalItems.value devient 100
 * ```
 */
export function updatePaginationFromResult(
    result: any,
    state: PaginationState,
    setTotalItems: (value: number) => void
): void {
    if (result) {
        const total = result.recordsFiltered || result.totalRows || result.recordsTotal || result.total || 0
        setTotalItems(total)
    }
}

