/**
 * Helpers centralisés pour DataTable (DRY - Don't Repeat Yourself)
 * Fusion de useDataTableHelpers et utilitaires communs
 */

import type { FilterOperator } from '../types/dataTable'
import { calculatePagination, normalizePagination, type PaginationState } from './paginationUtils'
import { applyFilters, applyGlobalSearch, type FilterValue } from './filterUtils'
import { sortData, type SortRule } from './sortUtils'

/**
 * Mappe les champs frontend vers les champs backend Django
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
 * Filtre et trie les données côté client
 */
export function filterAndSortData<T extends Record<string, any>>(
    data: T[],
    filters: Record<string, FilterValue> = {},
    sortRules: SortRule[] = [],
    globalSearch: string = ''
): T[] {
    let result = [...data]
    
    // Appliquer la recherche globale
    if (globalSearch) {
        result = result.filter(row => applyGlobalSearch(row, globalSearch))
    }
    
    // Appliquer les filtres
    if (Object.keys(filters).length > 0) {
        result = result.filter(row => applyFilters(row, filters))
    }
    
    // Appliquer le tri
    if (sortRules.length > 0) {
        result = sortData(result, sortRules)
    }
    
    return result
}

/**
 * Met à jour la pagination depuis une réponse backend
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

