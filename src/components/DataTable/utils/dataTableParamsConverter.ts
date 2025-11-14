/**
 * Utilitaire pour convertir les paramètres du DataTable vers le format standard DataTable
 * Compatible avec le format décrit dans EXEMPLE_ENDPOINT_COMPLET.md
 */

/**
 * Format de filtre du DataTable (format interne)
 */
export interface DataTableFilterModel {
    [field: string]: {
        filter: string | string[] | number
        operator?: string
        type?: string
        field?: string
    }
}

/**
 * Format de tri du DataTable (format interne)
 */
export interface DataTableSortModel {
    colId: string
    sort: 'asc' | 'desc'
}

/**
 * Paramètres DataTable standards (format backend)
 */
export interface StandardDataTableParams {
    draw?: number
    start: number
    length: number
    'search[value]'?: string
    'search[regex]'?: boolean
    [key: string]: any // Pour les paramètres personnalisés et order/columns
}

/**
 * Options pour la conversion
 */
export interface ConversionOptions {
    /**
     * Mapping des noms de champs vers les index de colonnes
     * Si non fourni, les colonnes seront mappées par ordre d'apparition
     */
    fieldToColumnIndex?: Record<string, number>

    /**
     * Liste des colonnes dans l'ordre d'affichage
     * Utilisée pour mapper les champs aux index de colonnes
     */
    columns?: Array<{ field: string; [key: string]: any }>

    /**
     * Numéro de draw (pour synchronisation)
     */
    draw?: number

    /**
     * Recherche globale
     */
    globalSearch?: string

    /**
     * Paramètres personnalisés supplémentaires à ajouter
     */
    customParams?: Record<string, any>
}

/**
 * Convertit les paramètres du DataTable vers le format standard DataTable
 *
 * @param params - Paramètres du DataTable (pagination, filtres, tri)
 * @param options - Options de conversion
 * @returns Paramètres au format standard DataTable
 *
 * @example
 * ```typescript
 * const params = convertToStandardDataTableParams({
 *   page: 2,
 *   pageSize: 20,
 *   filters: {
 *     reference: { filter: 'A-01' },
 *     zone_name: { filter: 'Général' }
 *   },
 *   sort: [{ colId: 'reference', sort: 'asc' }]
 * }, {
 *   columns: [
 *     { field: 'id' },
 *     { field: 'reference' },
 *     { field: 'zone_name' }
 *   ],
 *   draw: 1,
 *   globalSearch: 'test'
 * })
 * ```
 */
export function convertToStandardDataTableParams(
    params: {
        page?: number
        pageSize?: number
        filters?: DataTableFilterModel
        sort?: DataTableSortModel[]
        globalSearch?: string
    },
    options: ConversionOptions = {}
): StandardDataTableParams {
    const {
        page = 1,
        pageSize = 20,
        filters = {},
        sort = [],
        globalSearch
    } = params

    const {
        fieldToColumnIndex,
        columns = [],
        draw = 1,
        globalSearch: optionsGlobalSearch,
        customParams = {}
    } = options

    // Calculer start (offset)
    const start = (page - 1) * pageSize
    const length = pageSize

    // Construire le mapping champ -> index de colonne
    const fieldIndexMap: Record<string, number> = fieldToColumnIndex || {}

    // Si columns est fourni mais pas fieldToColumnIndex, créer le mapping automatiquement
    if (columns.length > 0 && !fieldToColumnIndex) {
        columns.forEach((col, index) => {
            if (col.field && !fieldIndexMap[col.field]) {
                fieldIndexMap[col.field] = index
            }
        })
    }

    // Construire les paramètres de base
    const standardParams: StandardDataTableParams = {
        draw,
        start,
        length,
        ...customParams
    }

    // Ajouter la recherche globale
    const searchValue = globalSearch || optionsGlobalSearch
    if (searchValue) {
        standardParams['search[value]'] = searchValue
        standardParams['search[regex]'] = false
    }

    // Ajouter les paramètres de tri
    sort.forEach((sortItem, index) => {
        const columnIndex = fieldIndexMap[sortItem.colId] ?? 0
        standardParams[`order[${index}][column]`] = columnIndex
        standardParams[`order[${index}][dir]`] = sortItem.sort
    })

    // Ajouter les paramètres de colonnes avec leurs filtres
    Object.entries(filters).forEach(([field, filterConfig]) => {
        const columnIndex = fieldIndexMap[field] ?? 0
        const filterValue = Array.isArray(filterConfig.filter)
            ? filterConfig.filter.join(',')
            : String(filterConfig.filter)

        // Ajouter les informations de la colonne
        standardParams[`columns[${columnIndex}][data]`] = field
        standardParams[`columns[${columnIndex}][name]`] = field
        standardParams[`columns[${columnIndex}][searchable]`] = true
        standardParams[`columns[${columnIndex}][orderable]`] = true

        // Ajouter le filtre de la colonne
        if (filterValue) {
            standardParams[`columns[${columnIndex}][search][value]`] = filterValue
            standardParams[`columns[${columnIndex}][search][regex]`] = false
        } else {
            standardParams[`columns[${columnIndex}][search][value]`] = ''
            standardParams[`columns[${columnIndex}][search][regex]`] = false
        }
    })

    // Ajouter les colonnes sans filtre (pour compléter la configuration)
    if (columns.length > 0) {
        columns.forEach((col, index) => {
            const field = col.field || col.data || ''
            if (field && !filters[field]) {
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
 * Convertit les paramètres du DataTable vers le format standard avec support des opérateurs
 *
 * @param params - Paramètres du DataTable
 * @param options - Options de conversion
 * @returns Paramètres au format standard DataTable avec opérateurs
 */
export function convertToStandardDataTableParamsWithOperators(
    params: {
        page?: number
        pageSize?: number
        filters?: DataTableFilterModel
        sort?: DataTableSortModel[]
        globalSearch?: string
    },
    options: ConversionOptions = {}
): StandardDataTableParams {
    const standardParams = convertToStandardDataTableParams(params, options)

    // Ajouter les opérateurs pour les filtres si disponibles
    if (params.filters) {
        Object.entries(params.filters).forEach(([field, filterConfig]) => {
            const fieldIndexMap: Record<string, number> = options.fieldToColumnIndex || {}
            const columns = options.columns || []

            // Construire le mapping si nécessaire
            const fieldIndex: Record<string, number> = {}
            if (columns.length > 0 && !options.fieldToColumnIndex) {
                columns.forEach((col, index) => {
                    if (col.field && !fieldIndex[col.field]) {
                        fieldIndex[col.field] = index
                    }
                })
            } else {
                Object.assign(fieldIndex, fieldIndexMap)
            }

            const columnIndex = fieldIndex[field] ?? 0
            const operator = filterConfig.operator || 'contains'

            // Ajouter l'opérateur comme paramètre personnalisé
            if (operator && operator !== 'contains') {
                standardParams[`columns[${columnIndex}][operator]`] = operator
            }
        })
    }

    return standardParams
}

/**
 * Convertit les paramètres de pagination simples vers le format standard
 *
 * @param page - Numéro de page (commence à 1)
 * @param pageSize - Taille de la page
 * @param draw - Numéro de draw (optionnel)
 * @returns Paramètres de pagination au format standard
 */
export function convertPaginationToStandardParams(
    page: number,
    pageSize: number,
    draw: number = 1
): Pick<StandardDataTableParams, 'draw' | 'start' | 'length'> {
    return {
        draw,
        start: (page - 1) * pageSize,
        length: pageSize
    }
}

/**
 * Convertit les paramètres de tri simples vers le format standard
 *
 * @param sortModel - Modèle de tri
 * @param fieldToColumnIndex - Mapping champ -> index de colonne
 * @returns Paramètres de tri au format standard
 */
export function convertSortToStandardParams(
    sortModel: DataTableSortModel[],
    fieldToColumnIndex: Record<string, number> = {}
): Record<string, any> {
    const sortParams: Record<string, any> = {}

    sortModel.forEach((sortItem, index) => {
        const columnIndex = fieldToColumnIndex[sortItem.colId] ?? 0
        sortParams[`order[${index}][column]`] = columnIndex
        sortParams[`order[${index}][dir]`] = sortItem.sort
    })

    return sortParams
}

/**
 * Convertit les filtres simples vers le format standard
 *
 * @param filters - Modèle de filtres
 * @param fieldToColumnIndex - Mapping champ -> index de colonne
 * @returns Paramètres de filtres au format standard
 */
export function convertFiltersToStandardParams(
    filters: DataTableFilterModel,
    fieldToColumnIndex: Record<string, number> = {}
): Record<string, any> {
    const filterParams: Record<string, any> = {}

    Object.entries(filters).forEach(([field, filterConfig]) => {
        const columnIndex = fieldToColumnIndex[field] ?? 0
        const filterValue = Array.isArray(filterConfig.filter)
            ? filterConfig.filter.join(',')
            : String(filterConfig.filter)

        filterParams[`columns[${columnIndex}][data]`] = field
        filterParams[`columns[${columnIndex}][name]`] = field
        filterParams[`columns[${columnIndex}][searchable]`] = true
        filterParams[`columns[${columnIndex}][orderable]`] = true

        if (filterValue) {
            filterParams[`columns[${columnIndex}][search][value]`] = filterValue
            filterParams[`columns[${columnIndex}][search][regex]`] = false
        } else {
            filterParams[`columns[${columnIndex}][search][value]`] = ''
            filterParams[`columns[${columnIndex}][search][regex]`] = false
        }
    })

    return filterParams
}

/**
 * Exemple d'utilisation dans un composable
 *
 * @example
 * ```typescript
 * import { convertToStandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter'
 *
 * const onLocationFilterChanged = async (filterModel: Record<string, { filter: string }>) => {
 *   const standardParams = convertToStandardDataTableParams({
 *     page: locationsCurrentPage.value,
 *     pageSize: locationsPageSize.value,
 *     filters: filterModel,
 *     sort: locationsSortModel.value || [],
 *     globalSearch: locationsSearchQuery.value
 *   }, {
 *     columns: adaptedAvailableLocationColumns.value,
 *     draw: 1,
 *     customParams: {
 *       account_id: accountId.value,
 *       inventory_id: inventoryId.value,
 *       warehouse_id: warehouseId.value
 *     }
 *   })
 *
 *   await locationStore.fetchUnassignedLocations(standardParams)
 * }
 * ```
 */

