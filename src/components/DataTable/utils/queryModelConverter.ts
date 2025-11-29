/**
 * Convertisseur QueryModel
 * 
 * Convertit le QueryModel vers différents formats backend :
 * - StandardDataTableParams (DataTables.js)
 * - Format REST API personnalisé
 * - Format Django QuerySet
 */

import type { QueryModel, SortModel, FilterModel, QueryModelConversionOptions } from '../types/QueryModel'
import type { StandardDataTableParams } from './dataTableParamsConverter'

/**
 * Convertit un QueryModel vers StandardDataTableParams
 * 
 * @param queryModel - Modèle de requête
 * @param options - Options de conversion
 * @returns Paramètres au format DataTables.js
 */
export function convertQueryModelToStandardParams(
    queryModel: QueryModel,
    options: QueryModelConversionOptions = {}
): StandardDataTableParams {
    const {
        fieldToColumnIndex,
        columns = [],
        draw = 1
    } = options

    // Construire le mapping champ -> index de colonne
    const fieldIndexMap: Record<string, number> = fieldToColumnIndex || {}
    if (columns.length > 0 && !fieldToColumnIndex) {
        columns.forEach((col, index) => {
            if (col.field && !fieldIndexMap[col.field]) {
                fieldIndexMap[col.field] = index
            }
        })
    }

    // Paramètres de base
    const page = queryModel.pagination?.page || 1
    const pageSize = queryModel.pagination?.pageSize || 20
    const start = (page - 1) * pageSize

    const standardParams: StandardDataTableParams = {
        draw,
        start,
        length: pageSize,
        ...queryModel.customParams
    }

    // Ajouter la recherche globale
    if (queryModel.globalSearch) {
        standardParams['search[value]'] = queryModel.globalSearch
        standardParams['search[regex]'] = false
    }

    // Ajouter les paramètres de tri
    if (queryModel.sort && queryModel.sort.length > 0) {
        queryModel.sort.forEach((sortItem, index) => {
            const columnIndex = fieldIndexMap[sortItem.field] ?? 0
            standardParams[`order[${index}][column]`] = columnIndex
            standardParams[`order[${index}][dir]`] = sortItem.direction
        })
    }

    // Ajouter les paramètres de filtres
    if (queryModel.filters) {
        Object.entries(queryModel.filters).forEach(([field, filterModel]) => {
            // Ignorer les filtres avec des valeurs vides (sauf pour les opérateurs null/not_null)
            const hasValue = filterModel.value !== undefined && filterModel.value !== null && 
                            filterModel.value !== '' && String(filterModel.value).trim() !== '' &&
                            String(filterModel.value) !== 'undefined' && String(filterModel.value) !== 'null'
            const hasValue2 = filterModel.value2 !== undefined && filterModel.value2 !== null && 
                             filterModel.value2 !== '' && String(filterModel.value2).trim() !== ''
            const hasValues = filterModel.values && Array.isArray(filterModel.values) && filterModel.values.length > 0
            const isNullOperator = filterModel.operator === 'is_null' || filterModel.operator === 'is_not_null'
            
            // Ignorer le filtre si aucune valeur valide n'est présente (sauf pour null/not_null)
            if (!isNullOperator && !hasValue && !hasValue2 && !hasValues) {
                return
            }

            const columnIndex = fieldIndexMap[field] ?? 0

            // Informations de la colonne
            standardParams[`columns[${columnIndex}][data]`] = field
            standardParams[`columns[${columnIndex}][name]`] = field
            standardParams[`columns[${columnIndex}][searchable]`] = true
            standardParams[`columns[${columnIndex}][orderable]`] = true

            // Construire la valeur du filtre selon l'opérateur
            let filterValue = ''
            
            if (filterModel.operator === 'between' && filterModel.value !== undefined && filterModel.value2 !== undefined) {
                filterValue = `${filterModel.value},${filterModel.value2}`
            } else if (filterModel.operator === 'in' && filterModel.values) {
                filterValue = filterModel.values.join(',')
            } else if (filterModel.operator === 'not_in' && filterModel.values) {
                filterValue = `!${filterModel.values.join(',')}`
            } else if (filterModel.value !== undefined) {
                filterValue = String(filterModel.value)
            }

            // Ajouter le filtre
            standardParams[`columns[${columnIndex}][search][value]`] = filterValue
            standardParams[`columns[${columnIndex}][search][regex]`] = filterModel.operator === 'regex' ? true : false
            
            // Ajouter l'opérateur si différent de 'contains' (par défaut)
            if (filterModel.operator && filterModel.operator !== 'contains') {
                standardParams[`columns[${columnIndex}][operator]`] = filterModel.operator
            }
        })
    }

    // Ajouter les colonnes sans filtre (pour compléter la configuration)
    if (columns.length > 0) {
        columns.forEach((col, index) => {
            const field = col.field || ''
            if (field && !queryModel.filters?.[field]) {
                standardParams[`columns[${index}][data]`] = field
                standardParams[`columns[${index}][name]`] = field
                standardParams[`columns[${index}][searchable]`] = col.searchable !== false
                standardParams[`columns[${index}][orderable]`] = col.orderable !== false
                standardParams[`columns[${index}][search][value]`] = ''
                standardParams[`columns[${index}][search][regex]`] = false
            }
        })
    }

    return standardParams
}

/**
 * Convertit un QueryModel vers un format REST API personnalisé
 * 
 * @param queryModel - Modèle de requête
 * @returns Paramètres au format REST API
 */
export function convertQueryModelToRestApi(
    queryModel: QueryModel
): Record<string, any> {
    const params: Record<string, any> = {
        ...queryModel.customParams
    }

    // Pagination
    if (queryModel.pagination) {
        params.page = queryModel.pagination.page
        params.page_size = queryModel.pagination.pageSize
    }

    // Recherche globale
    if (queryModel.globalSearch) {
        params.search = queryModel.globalSearch
    }

    // Tri
    if (queryModel.sort && queryModel.sort.length > 0) {
        params.ordering = queryModel.sort
            .map(s => s.direction === 'desc' ? `-${s.field}` : s.field)
            .join(',')
    }

    // Filtres
    if (queryModel.filters) {
        Object.entries(queryModel.filters).forEach(([field, filterModel]) => {
            const paramName = `${field}_${filterModel.operator}`
            
            if (filterModel.operator === 'between' && filterModel.value !== undefined && filterModel.value2 !== undefined) {
                params[`${field}_gte`] = filterModel.value
                params[`${field}_lte`] = filterModel.value2
            } else if (filterModel.operator === 'in' && filterModel.values) {
                params[paramName] = filterModel.values
            } else if (filterModel.operator === 'not_in' && filterModel.values) {
                params[`${field}_not_in`] = filterModel.values
            } else if (filterModel.value !== undefined) {
                params[paramName] = filterModel.value
            }
        })
    }

    return params
}

/**
 * Convertit un QueryModel vers un format Django QuerySet
 * 
 * @param queryModel - Modèle de requête
 * @returns Paramètres au format Django
 */
export function convertQueryModelToDjango(
    queryModel: QueryModel
): Record<string, any> {
    const params: Record<string, any> = {
        ...queryModel.customParams
    }

    // Pagination
    if (queryModel.pagination) {
        params.page = queryModel.pagination.page
        params.page_size = queryModel.pagination.pageSize
    }

    // Recherche globale
    if (queryModel.globalSearch) {
        params.search = queryModel.globalSearch
    }

    // Tri
    if (queryModel.sort && queryModel.sort.length > 0) {
        params.order_by = queryModel.sort.map(s => ({
            field: s.field,
            direction: s.direction
        }))
    }

    // Filtres
    if (queryModel.filters) {
        params.filters = Object.entries(queryModel.filters).map(([field, filterModel]) => ({
            field,
            operator: filterModel.operator,
            value: filterModel.value,
            value2: filterModel.value2,
            values: filterModel.values
        }))
    }

    return params
}

/**
 * Convertit un QueryModel vers le format query params (EXEMPLES_REQUETES_QUERYMODEL)
 * 
 * Format attendu :
 * - sortModel: [{"colId":"reference","sort":"asc"}] (JSON stringifié)
 * - filterModel: {"status":{"filterType":"text","type":"equals","filter":"AFFECTE"}} (JSON stringifié)
 * - search: "test" (texte simple)
 * - startRow: 0, endRow: 20 (pagination)
 * - export: "excel" | "csv" (optionnel)
 * 
 * @param queryModel - Modèle de requête
 * @returns Paramètres au format query params
 */
export function convertQueryModelToQueryParams(
    queryModel: QueryModel
): Record<string, any> {
    const params: Record<string, any> = {
        ...queryModel.customParams
    }

    // Pagination : convertir page/pageSize en startRow/endRow
    if (queryModel.pagination) {
        const page = queryModel.pagination.page || 1
        const pageSize = queryModel.pagination.pageSize || 20
        params.startRow = (page - 1) * pageSize
        params.endRow = page * pageSize
    }

    // Recherche globale
    if (queryModel.globalSearch) {
        params.search = queryModel.globalSearch
    }

    // Tri : convertir vers format sortModel
    if (queryModel.sort && queryModel.sort.length > 0) {
        const sortModel = queryModel.sort.map(s => ({
            colId: s.field,
            sort: s.direction
        }))
        // Stringifier le tableau JSON pour l'URL
        params.sortModel = JSON.stringify(sortModel)
    }

    // Filtres : convertir vers format filterModel
    if (queryModel.filters && Object.keys(queryModel.filters).length > 0) {
        const filterModel: Record<string, any> = {}
        
        Object.entries(queryModel.filters).forEach(([field, filterModelItem]) => {
            // Ignorer les filtres avec des valeurs vides (sauf pour les opérateurs null/not_null)
            const hasValue = filterModelItem.value !== undefined && filterModelItem.value !== null && 
                            filterModelItem.value !== '' && String(filterModelItem.value).trim() !== '' &&
                            String(filterModelItem.value) !== 'undefined' && String(filterModelItem.value) !== 'null'
            const hasValue2 = filterModelItem.value2 !== undefined && filterModelItem.value2 !== null && 
                             filterModelItem.value2 !== '' && String(filterModelItem.value2).trim() !== ''
            const hasValues = filterModelItem.values && Array.isArray(filterModelItem.values) && filterModelItem.values.length > 0
            const isNullOperator = filterModelItem.operator === 'is_null' || filterModelItem.operator === 'is_not_null'
            
            // Ignorer le filtre si aucune valeur valide n'est présente (sauf pour null/not_null)
            if (!isNullOperator && !hasValue && !hasValue2 && !hasValues) {
                return
            }
            // Mapper le dataType
            let filterType: string
            switch (filterModelItem.dataType) {
                case 'text':
                    filterType = 'text'
                    break
                case 'number':
                    filterType = 'number'
                    break
                case 'date':
                case 'datetime':
                    filterType = 'date'
                    break
                default:
                    filterType = 'text'
            }

            // Mapper l'opérateur vers le type du format attendu
            let type: string
            switch (filterModelItem.operator) {
                case 'equals':
                    type = 'equals'
                    break
                case 'not_equals':
                    type = 'notEqual'
                    break
                case 'contains':
                    type = 'contains'
                    break
                case 'not_contains':
                    type = 'notContains'
                    break
                case 'starts_with':
                    type = 'startsWith'
                    break
                case 'ends_with':
                    type = 'endsWith'
                    break
                case 'greater_than':
                    type = 'greaterThan'
                    break
                case 'less_than':
                    type = 'lessThan'
                    break
                case 'greater_equal':
                    type = 'greaterThanOrEqual'
                    break
                case 'less_equal':
                    type = 'lessThanOrEqual'
                    break
                case 'between':
                    type = 'inRange'
                    break
                case 'in':
                    type = 'in'
                    break
                case 'not_in':
                    type = 'notIn'
                    break
                default:
                    type = 'contains'
            }

            // Construire l'objet filtre selon le format attendu
            const filterConfig: any = {
                filterType,
                type
            }

            // Ajouter les valeurs selon le type de filtre
            if (filterType === 'date') {
                // Pour les dates, utiliser dateFrom et dateTo
                if (filterModelItem.operator === 'between' && filterModelItem.value !== undefined && filterModelItem.value2 !== undefined) {
                    filterConfig.dateFrom = filterModelItem.value
                    filterConfig.dateTo = filterModelItem.value2
                } else if (filterModelItem.value !== undefined) {
                    filterConfig.dateFrom = filterModelItem.value
                    if (filterModelItem.operator === 'less_than' || filterModelItem.operator === 'less_equal') {
                        filterConfig.dateTo = filterModelItem.value
                    }
                }
            } else if (filterType === 'number') {
                // Pour les nombres, utiliser filter et filterTo pour inRange
                if (filterModelItem.operator === 'between' && filterModelItem.value !== undefined && filterModelItem.value2 !== undefined) {
                    filterConfig.filter = filterModelItem.value
                    filterConfig.filterTo = filterModelItem.value2
                } else if (filterModelItem.value !== undefined) {
                    filterConfig.filter = filterModelItem.value
                }
            } else {
                // Pour le texte, utiliser filter
                if (filterModelItem.operator === 'in' && filterModelItem.values) {
                    filterConfig.filter = filterModelItem.values
                } else if (filterModelItem.value !== undefined) {
                    filterConfig.filter = filterModelItem.value
                }
            }

            filterModel[field] = filterConfig
        })

        // Stringifier l'objet JSON pour l'URL
        params.filterModel = JSON.stringify(filterModel)
    }

    return params
}

/**
 * Crée un QueryModel depuis les paramètres du DataTable
 * 
 * @param params - Paramètres du DataTable
 * @returns QueryModel
 */
export function createQueryModelFromDataTableParams(params: {
    page?: number
    pageSize?: number
    sort?: Array<{ field: string; direction: 'asc' | 'desc' }>
    filters?: Record<string, any>
    globalSearch?: string
    customParams?: Record<string, any>
}): QueryModel {
    const queryModel: QueryModel = {
        customParams: params.customParams
    }

    // Pagination
    if (params.page !== undefined || params.pageSize !== undefined) {
        queryModel.pagination = {
            page: params.page || 1,
            pageSize: params.pageSize || 20
        }
    }

    // Tri
    if (params.sort && params.sort.length > 0) {
        queryModel.sort = params.sort.map((s, index) => ({
            field: s.field,
            direction: s.direction,
            priority: index + 1
        }))
    }

    // Filtres
    if (params.filters) {
        queryModel.filters = {}
        Object.entries(params.filters).forEach(([field, filterConfig]) => {
            queryModel.filters![field] = {
                field,
                dataType: filterConfig.dataType || 'text',
                operator: filterConfig.operator || 'contains',
                value: filterConfig.value,
                value2: filterConfig.value2,
                values: filterConfig.values
            }
        })
    }

    // Recherche globale
    if (params.globalSearch) {
        queryModel.globalSearch = params.globalSearch
    }

    return queryModel
}

