/**
 * Utilitaire pour convertir les paramètres du DataTable vers le format standard DataTable
 * Compatible avec le format décrit dans EXEMPLE_ENDPOINT_COMPLET.md
 */

import { convertQueryModelToStandardParams } from './queryModelConverter'

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
        // Chercher l'index de colonne dans le mapping
        let columnIndex = fieldIndexMap[sortItem.colId]
        
        // Si la colonne n'est pas trouvée dans le mapping, essayer de la trouver dans columns
        if (columnIndex === undefined) {
            columnIndex = columns.findIndex(col => col.field === sortItem.colId)
        }
        
        // Si toujours pas trouvé, utiliser l'index 0 par défaut
        if (columnIndex === -1 || columnIndex === undefined) {
            columnIndex = 0
        }
        
        standardParams[`order[${index}][column]`] = columnIndex
        standardParams[`order[${index}][dir]`] = sortItem.sort
        
        // Ajouter les paramètres de colonne pour que le backend sache quel champ est trié
        // Même si la colonne n'est pas dans le mapping, on doit quand même l'inclure
        standardParams[`columns[${columnIndex}][data]`] = sortItem.colId
        standardParams[`columns[${columnIndex}][name]`] = sortItem.colId
        standardParams[`columns[${columnIndex}][searchable]`] = true
        standardParams[`columns[${columnIndex}][orderable]`] = true
    })

    // Identifier les colonnes utilisées dans le tri pour les inclure même sans filtre
    const columnsInSort = new Set<number>()
    sort.forEach((sortItem) => {
        let columnIndex = fieldIndexMap[sortItem.colId]
        if (columnIndex === undefined) {
            columnIndex = columns.findIndex(col => col.field === sortItem.colId)
        }
        if (columnIndex === -1 || columnIndex === undefined) {
            columnIndex = 0
        }
        columnsInSort.add(columnIndex)
    })

    // Ajouter UNIQUEMENT les paramètres de colonnes avec filtres actifs
    Object.entries(filters).forEach(([field, filterConfig]) => {
        if (!filterConfig) {
            return
        }

        // Support du format DataTableFilterModel : { filter: string | string[] | number, operator?: string }
        let filterValue: string | string[] | number | undefined

        if (filterConfig.filter !== undefined && filterConfig.filter !== null) {
            // Format DataTableFilterModel
            filterValue = filterConfig.filter
        } else if (filterConfig.operator === 'is_null' || filterConfig.operator === 'is_not_null') {
            // Pour les opérateurs null/not_null, on peut avoir un filtre valide même sans valeur
            filterValue = filterConfig.operator === 'is_null' ? '' : ''
        } else {
            // Aucune valeur de filtre valide trouvée
            return
        }

        // Convertir en string si nécessaire
        let filterValueString: string
        if (Array.isArray(filterValue)) {
            filterValueString = filterValue.join(',')
        } else {
            filterValueString = String(filterValue)
        }

        // Ignorer les valeurs vides ou "undefined"
        if (!filterValueString || filterValueString === '' || filterValueString === 'undefined' || filterValueString === 'null') {
            // Sauf pour les opérateurs null/not_null
            if (filterConfig.operator !== 'is_null' && filterConfig.operator !== 'is_not_null') {
                return
            }
        }

        const columnIndex = fieldIndexMap[field] ?? 0

        // Ajouter les informations de la colonne UNIQUEMENT si elle a un filtre valide
        standardParams[`columns[${columnIndex}][data]`] = field
        standardParams[`columns[${columnIndex}][name]`] = field
        
        // Pour les opérateurs null/not_null, ne pas envoyer de valeur de filtre
        if (filterConfig.operator === 'is_null' || filterConfig.operator === 'is_not_null') {
            // Le backend doit gérer ces opérateurs différemment
            standardParams[`columns[${columnIndex}][search][value]`] = ''
        } else {
            standardParams[`columns[${columnIndex}][search][value]`] = filterValueString
        }
        
        standardParams[`columns[${columnIndex}][search][regex]`] = false

        // Ajouter l'opérateur si différent de 'contains' (par défaut)
        const operator = filterConfig.operator || 'contains'
        if (operator && operator !== 'contains') {
            standardParams[`columns[${columnIndex}][operator]`] = operator
        }
    })

    // Ajouter UNIQUEMENT les colonnes utilisées dans le tri (sans filtre) si nécessaire
    // Pour le tri, le backend a généralement besoin du nom du champ, pas de toute la config
    // Donc on peut simplifier en ne gardant que order[][column] qui référence l'index

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
 * Détecte et normalise les paramètres vers StandardDataTableParams
 * Supporte QueryModel, StandardDataTableParams et valeurs par défaut
 * 
 * Cette fonction permet aux stores d'accepter n'importe quel format
 * et de le convertir automatiquement vers StandardDataTableParams
 * 
 * @param params - Paramètres au format QueryModel, StandardDataTableParams ou undefined
 * @param options - Options pour la conversion (colonnes, draw, etc.)
 * @returns Paramètres au format StandardDataTableParams
 */
export function normalizeToStandardParams(
    params?: any,
    options: {
        columns?: Array<{ field: string; [key: string]: any }>
        draw?: number
        defaultPage?: number
        defaultPageSize?: number
    } = {}
): StandardDataTableParams {
    const { columns = [], draw = 1, defaultPage = 1, defaultPageSize = 20 } = options

    // Si pas de paramètres, retourner les valeurs par défaut
    if (!params) {
        return {
            draw,
            start: (defaultPage - 1) * defaultPageSize,
            length: defaultPageSize
        }
    }

    // Si c'est déjà un StandardDataTableParams (a draw, start, length)
    if (typeof params === 'object' && ('start' in params || 'draw' in params || 'length' in params)) {
        return params as StandardDataTableParams
    }

    // Si c'est un QueryModel (a pagination, sort, filters, globalSearch)
    if (typeof params === 'object' && ('pagination' in params || 'sort' in params || 'filters' in params || 'globalSearch' in params)) {
        // Convertir QueryModel vers StandardDataTableParams
        return convertQueryModelToStandardParams(params, {
            columns,
            draw
        })
    }

    // Format inconnu, retourner les valeurs par défaut
    return {
        draw,
        start: (defaultPage - 1) * defaultPageSize,
        length: defaultPageSize
    }
}

/**
 * Convertit StandardDataTableParams en chaîne d'URL avec préservation des crochets
 * Nettoie automatiquement les valeurs undefined, null, vides ou "undefined"
 * 
 * Cette fonction est utilisée par tous les stores pour construire les URLs API
 * depuis les paramètres StandardDataTableParams fournis par le DataTable.
 * 
 * @param params - Paramètres au format StandardDataTableParams (déjà optimisés par DataTable)
 * @returns Chaîne d'URL avec les paramètres encodés correctement
 * 
 * @example
 * ```typescript
 * import { buildStandardParamsUrl } from '@/components/DataTable/utils/dataTableParamsConverter'
 * 
 * const standardParams: StandardDataTableParams = {
 *   draw: 1,
 *   start: 0,
 *   length: 20,
 *   'search[value]': 'test',
 *   'columns[0][data]': 'status',
 *   'columns[0][search][value]': 'ACTIVE'
 * }
 * 
 * const url = `${baseUrl}?${buildStandardParamsUrl(standardParams)}`
 * // Résultat: ?draw=1&start=0&length=20&search%5Bvalue%5D=test&columns%5B0%5D%5Bdata%5D=status&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=ACTIVE
 * ```
 */
export function buildStandardParamsUrl(params: StandardDataTableParams): string {
    const parts: string[] = [];

    Object.entries(params).forEach(([key, value]) => {
        // Ignorer undefined, null et chaînes vides
        if (value === undefined || value === null || value === '') {
            return;
        }

        const stringValue = String(value);

        // Ignorer la chaîne littérale "undefined" ou "null"
        if (stringValue === 'undefined' || stringValue === 'null') {
            return;
        }

        // Encoder la clé et la valeur, mais préserver les crochets dans les clés
        const encodedKey = encodeURIComponent(key);
        const encodedValue = encodeURIComponent(stringValue);
        parts.push(`${encodedKey}=${encodedValue}`);
    });

    return parts.join('&');
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

