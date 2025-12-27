/**
 * Composable générique pour la gestion de n'importe quel DataTable avec Pinia
 *
 * Ce composable gère :
 * - La pagination, le tri et le filtrage côté serveur
 * - La conversion automatique des paramètres vers le format standard DataTable
 * - L'intégration avec les stores Pinia
 *
 * @module useInventoryDataTable
 */

// ===== IMPORTS VUE =====
import { ref, computed, type Ref, type ComputedRef } from 'vue'

// ===== IMPORTS SERVICES =====
import { logger } from '@/services/loggerService'

// ===== IMPORTS UTILS =====
import { type StandardDataTableParams, convertToStandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter'
import { useQueryModel } from '@/components/DataTable/composables/useQueryModel'
import { convertQueryModelToQueryParams, convertQueryModelToRestApi, createQueryModelFromDataTableParams } from '@/components/DataTable/utils/queryModelConverter'
import type { QueryModel } from '@/components/DataTable/types/QueryModel'

// ===== IMPORTS STORES =====
import { useInventoryStore } from '@/stores/inventory'

// ===== IMPORTS TYPES =====
import type { InventoryTable } from '@/models/Inventory'

// ===== INTERFACES =====

/**
 * Mode de sortie pour les paramètres de requête
 */
export type QueryOutputMode = 'queryModel' | 'dataTable' | 'restApi' | 'queryParams'

/**
 * Configuration pour le composable générique DataTable
 */
export interface GenericDataTableConfig<T = any> {
    /** Store Pinia à utiliser */
    store: any

    /** Action du store pour récupérer les données */
    fetchAction: string

    /** Valeurs par défaut */
    defaultPageSize?: number

    /** Mode de sortie pour les paramètres de requête (défaut: 'queryParams') */
    queryOutputMode?: QueryOutputMode

    /** Paramètres additionnels pour certaines actions (ex: inventoryId, warehouseId) */
    additionalParams?: Record<string, any> | Ref<Record<string, any>> | ComputedRef<Record<string, any>>
}

/**
 * Format des filtres DataTable
 */
export interface DataTableFilters {
    [key: string]: { value: any; operator?: string }
}

/**
 * Format du tri DataTable
 */
export interface DataTableSort {
    colId: string
    sort: 'asc' | 'desc'
}

/**
 * Paramètres DataTable (ancien format)
 */
export interface DataTableParams {
    page: number
    pageSize: number
    globalSearch?: string
    filters?: DataTableFilters
    sort?: DataTableSort[]
}

/**
 * Résultat d'une requête DataTable
 */
export interface DataTableResult<T = any> {
    data: T[]
    recordsTotal: number
    recordsFiltered: number
}

/**
 * Informations de pagination
 */
export interface PaginationInfo {
    total_pages: number
    total: number
    has_next: boolean
    has_previous: boolean
}

// ===== COMPOSABLE GÉNÉRIQUE =====

/**
 * Composable générique pour gérer un DataTable avec Pinia
 *
 * @param config - Configuration du composable
 * @returns État et méthodes pour gérer le DataTable
 */
export function useGenericDataTable<T = any>(config: GenericDataTableConfig<T>) {
    const { store, fetchAction, defaultPageSize = 20, queryOutputMode = 'queryParams', additionalParams } = config

    // ===== ÉTAT RÉACTIF =====

    /** Données de la table */
    const data = ref<T[]>([])

    /** État de chargement */
    const loading = ref(false)

    /** Page courante */
    const currentPage = ref(1)

    /** Taille de page */
    const pageSize = ref(defaultPageSize)

    /** Requête de recherche globale */
    const searchQuery = ref('')

    /** Modèle de tri */
    const sortModel = ref<DataTableSort[]>([])

    /** Modèle de filtres */
    const filters = ref<DataTableFilters>({})

    // ===== PAGINATION =====

    /** Informations de pagination */
    const pagination = ref<PaginationInfo>({
        total_pages: 0,
        total: 0,
        has_next: false,
        has_previous: false
    })

    // ===== QUERYMODEL =====

    /**
     * Colonnes pour QueryModel (vide par défaut, sera rempli par les colonnes du DataTable)
     */
    const columnsRef = computed(() => [])

    /**
     * QueryModel pour gérer les requêtes avec mode de sortie configurable
     */
    const {
        queryModel: queryModelRef,
        toStandardParams,
        updatePagination: updateQueryPagination,
        updateSort: updateQuerySort,
        updateFilter: updateQueryFilter,
        updateGlobalSearch: updateQueryGlobalSearch,
        fromDataTableParams: fromDataTableParamsQueryModel
    } = useQueryModel({
        columns: columnsRef,
        enabled: true
    })

    /**
     * Convertit le QueryModel selon le mode configuré
     */
    const convertQueryModelToOutputFn = (queryModelData: QueryModel) => {
        switch (queryOutputMode) {
            case 'queryModel':
                return queryModelData
            case 'restApi':
                return convertQueryModelToRestApi(queryModelData)
            case 'queryParams':
                return convertQueryModelToQueryParams(queryModelData)
            case 'dataTable':
            default:
                return toStandardParams.value
        }
    }

    // ===== MÉTHODES =====

    /**
     * Charger les données depuis le store
     */
    const loadData = async () => {
        loading.value = true
        try {
            // Vérifier que l'action existe dans le store
            if (typeof store[fetchAction] !== 'function') {
                throw new Error(`Action ${fetchAction} introuvable dans le store`)
            }

            // Récupérer les paramètres additionnels (déréférencer si c'est une ref ou computed)
            let resolvedAdditionalParams: Record<string, any> | undefined
            if (additionalParams) {
                if (typeof additionalParams === 'object' && 'value' in additionalParams) {
                    resolvedAdditionalParams = additionalParams.value
                } else {
                    resolvedAdditionalParams = additionalParams
                }
            }

            // Convertir DataTableParams en StandardDataTableParams pour le store
            // Le store attend StandardDataTableParams avec 'length' au lieu de 'pageSize'
            // Convertir DataTableFilters (value) en DataTableFilterModel (filter)
            const convertedFilters: Record<string, { filter: string | string[] | number; operator?: string }> = {}
            Object.keys(filters.value).forEach(key => {
                const filter = filters.value[key]
                if (filter && filter.value !== undefined && filter.value !== null) {
                    convertedFilters[key] = {
                        filter: filter.value,
                        operator: filter.operator
                    }
                }
            })

            // Créer un QueryModel depuis les paramètres actuels
            const queryModelData = createQueryModelFromDataTableParams({
                page: currentPage.value,
                pageSize: pageSize.value,
                sort: sortModel.value.length > 0 ? sortModel.value.map(s => ({
                    field: s.colId || '',
                    direction: s.sort || 'asc'
                })) : undefined,
                filters: convertedFilters ? Object.fromEntries(
                    Object.entries(convertedFilters).map(([field, filterConfig]) => [
                        field,
                        {
                            field,
                            dataType: 'text' as const,
                            operator: (filterConfig.operator || 'contains') as any,
                            value: filterConfig.filter
                        }
                    ])
                ) : undefined,
                globalSearch: searchQuery.value || undefined,
                customParams: resolvedAdditionalParams || {}
            })

            // Convertir selon le mode configuré
            const outputParams = convertQueryModelToOutputFn(queryModelData)

            // Appeler l'action du store avec les paramètres convertis
            let result: DataTableResult<T>
            if (resolvedAdditionalParams && Object.keys(resolvedAdditionalParams).length > 0) {
                const args: any[] = Object.values(resolvedAdditionalParams)
                args.push(outputParams)
                result = await store[fetchAction](...args)
            } else {
                result = await store[fetchAction](outputParams)
            }

            // Mettre à jour les données et la pagination
            if (result) {
                data.value = result.data || []
                pagination.value = {
                    total_pages: Math.ceil((result.recordsFiltered || 0) / pageSize.value),
                    total: result.recordsFiltered || 0,
                    has_next: currentPage.value < Math.ceil((result.recordsFiltered || 0) / pageSize.value),
                    has_previous: currentPage.value > 1
                }
            }
        } catch (error) {
            logger.error('Erreur lors du chargement des données', error)
            throw error
        } finally {
            loading.value = false
        }
    }

    /**
     * Transformer les filtres du DataTable vers le format attendu
     *
     * @param filterModel - Modèle de filtres du DataTable
     * @returns Filtres transformés
     */
    const transformFilters = (filterModel: Record<string, any>): DataTableFilters => {
        const transformedFilters: DataTableFilters = {}

        Object.keys(filterModel).forEach(key => {
            const filter = filterModel[key]

            if (filter) {
                // Format 1: { filter: string }
                if (filter.filter !== undefined && filter.filter !== null && filter.filter !== '') {
                    transformedFilters[key] = {
                        value: filter.filter,
                        operator: 'contains'
                    }
                }
                // Format 2: { value: string }
                else if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
                    transformedFilters[key] = {
                        value: filter.value,
                        operator: 'contains'
                    }
                }
                // Format 3: String direct
                else if (typeof filter === 'string' && filter !== '') {
                    transformedFilters[key] = {
                        value: filter,
                        operator: 'contains'
                    }
                }
            }
        })

        return transformedFilters
    }

    /**
     * Extraire les informations depuis les paramètres standard DataTable
     *
     * @param standardParams - Paramètres au format standard DataTable
     * @returns Objet contenant page, pageSize, searchQuery, sortModel, filters
     */
    const extractFromStandardParams = (standardParams: StandardDataTableParams) => {
        const page = Math.floor((standardParams.start || 0) / (standardParams.length || 20)) + 1
        const extractedPageSize = standardParams.length || 20
        const extractedSearch = standardParams['search[value]'] || ''

        // Extraire les filtres depuis les paramètres standard
        const extractedFilters: DataTableFilters = {}
        Object.keys(standardParams).forEach(key => {
            if (key.startsWith('columns[') && key.includes('][search][value]')) {
                const match = key.match(/columns\[(\d+)\]\[search\]\[value\]/)
                if (match && standardParams[key]) {
                    const columnIndex = parseInt(match[1])
                    const fieldKey = `columns[${columnIndex}][data]`
                    const fieldName = standardParams[fieldKey]
                    if (fieldName) {
                        extractedFilters[fieldName] = {
                            value: standardParams[key],
                            operator: 'contains'
                        }
                    }
                }
            }
        })

        // Extraire le tri depuis les paramètres standard
        const extractedSort: DataTableSort[] = []
        let sortIndex = 0
        while (standardParams[`order[${sortIndex}][column]`] !== undefined) {
            const columnIndex = standardParams[`order[${sortIndex}][column]`]
            const direction = standardParams[`order[${sortIndex}][dir]`] as 'asc' | 'desc'
            const fieldKey = `columns[${columnIndex}][data]`
            const fieldName = standardParams[fieldKey]
            if (fieldName) {
                extractedSort.push({
                    colId: fieldName,
                    sort: direction
                })
            }
            sortIndex++
        }

        return {
            page,
            pageSize: extractedPageSize,
            searchQuery: extractedSearch,
            sortModel: extractedSort,
            filters: extractedFilters
        }
    }

    /**
     * Handler pour les changements de filtres
     * Reçoit TOUJOURS le format QueryModel standard du DataTable
     *
     * @param queryModel - Modèle de requête au format QueryModel standard
     */
    const handleFilterChanged = async (queryModel: QueryModel) => {
        try {
            // Vérifier que queryModel existe
            if (!queryModel || typeof queryModel !== 'object') {
                return
            }

            // Mettre à jour la pagination si fournie
            if (queryModel.page) {
                currentPage.value = queryModel.page
            }
            if (queryModel.pageSize) {
                pageSize.value = queryModel.pageSize
            }

            // Mettre à jour les filtres
            if (queryModel.filters) {
                // Convertir les filtres du format QueryModel vers DataTableFilters
                const convertedFilters: DataTableFilters = {}
                Object.entries(queryModel.filters).forEach(([field, filterValue]) => {
                    if (Array.isArray(filterValue)) {
                        // Format array simple
                        convertedFilters[field] = { value: filterValue, operator: 'in' }
                    } else if (typeof filterValue === 'object' && filterValue !== null) {
                        // Format object avec type/operator/value
                        const filterObj = filterValue as any
                        if ('value' in filterObj) {
                            convertedFilters[field] = {
                                value: filterObj.value,
                                operator: filterObj.operator || 'contains'
                            }
                        } else if ('values' in filterObj) {
                            convertedFilters[field] = {
                                value: filterObj.values,
                                operator: 'in'
                            }
                        }
                    }
                })
                filters.value = convertedFilters
            }

            // Mettre à jour le tri si fourni
            if (queryModel.sort && Array.isArray(queryModel.sort)) {
                sortModel.value = queryModel.sort.map(s => ({
                    colId: (s as any).field || s.colId || '',
                    sort: ((s as any).direction || s.sort || 'asc') as 'asc' | 'desc'
                }))
            }

            // Mettre à jour la recherche globale si fournie
            if (queryModel.search !== undefined) {
                searchQuery.value = queryModel.search || ''
            }

            await loadData()
        } catch (error) {
            logger.error('Erreur dans handleFilterChanged', error)
            throw error
        }
    }

    /**
     * Handler pour les changements de tri
     * Reçoit TOUJOURS le format QueryModel standard du DataTable
     *
     * @param queryModel - Modèle de requête au format QueryModel standard
     */
    const handleSortChanged = async (queryModel: QueryModel) => {
        try {
            // Vérifier que queryModel existe
            if (!queryModel || typeof queryModel !== 'object') {
                return
            }

            // Mettre à jour la pagination si fournie
            if (queryModel.page) {
                currentPage.value = queryModel.page
            }
            if (queryModel.pageSize) {
                pageSize.value = queryModel.pageSize
            }

            // Mettre à jour le tri
            if (queryModel.sort && Array.isArray(queryModel.sort)) {
                sortModel.value = queryModel.sort.map(s => ({
                    colId: (s as any).field || s.colId || '',
                    sort: ((s as any).direction || s.sort || 'asc') as 'asc' | 'desc'
                }))
            } else {
                sortModel.value = []
            }

            // Mettre à jour les filtres si fournis
            if (queryModel.filters) {
                const convertedFilters: DataTableFilters = {}
                Object.entries(queryModel.filters).forEach(([field, filterValue]) => {
                    if (Array.isArray(filterValue)) {
                        convertedFilters[field] = { value: filterValue, operator: 'in' }
                    } else if (typeof filterValue === 'object' && filterValue !== null) {
                        const filterObj = filterValue as any
                        if ('value' in filterObj) {
                            convertedFilters[field] = {
                                value: filterObj.value,
                                operator: filterObj.operator || 'contains'
                            }
                        }
                    }
                })
                filters.value = convertedFilters
            }

            // Mettre à jour la recherche globale si fournie
            if (queryModel.search !== undefined) {
                searchQuery.value = queryModel.search || ''
            }

            await loadData()
        } catch (error) {
            logger.error('Erreur dans handleSortChanged', error)
            throw error
        }
    }

    /**
     * Handler pour les changements de recherche globale
     * Reçoit TOUJOURS le format QueryModel standard du DataTable
     *
     * @param queryModel - Modèle de requête au format QueryModel standard
     */
    const handleSearchChanged = async (queryModel: QueryModel) => {
        try {
            // Vérifier que queryModel existe
            if (!queryModel || typeof queryModel !== 'object') {
                return
            }

            // Mettre à jour la pagination si fournie
            if (queryModel.page) {
                currentPage.value = queryModel.page
            }
            if (queryModel.pageSize) {
                pageSize.value = queryModel.pageSize
            }

            // Mettre à jour la recherche globale
            const searchTerm = queryModel.search || ''
            searchQuery.value = searchTerm

            // Mettre à jour le tri si fourni
            if (queryModel.sort && Array.isArray(queryModel.sort)) {
                sortModel.value = queryModel.sort.map(s => ({
                    colId: (s as any).field || s.colId || '',
                    sort: ((s as any).direction || s.sort || 'asc') as 'asc' | 'desc'
                }))
            }

            // Mettre à jour les filtres si fournis
            if (queryModel.filters) {
                const convertedFilters: DataTableFilters = {}
                Object.entries(queryModel.filters).forEach(([field, filterValue]) => {
                    if (Array.isArray(filterValue)) {
                        convertedFilters[field] = { value: filterValue, operator: 'in' }
                    } else if (typeof filterValue === 'object' && filterValue !== null) {
                        const filterObj = filterValue as any
                        if ('value' in filterObj) {
                            convertedFilters[field] = {
                                value: filterObj.value,
                                operator: filterObj.operator || 'contains'
                            }
                        }
                    }
                })
                filters.value = convertedFilters
            }

            // Réinitialiser à la page 1 lors d'une nouvelle recherche
            currentPage.value = 1
            await loadData()
        } catch (error) {
            logger.error('Erreur dans handleSearchChanged', error)
            throw error
        }
    }

    /**
     * Handler pour les changements de pagination
     * Reçoit TOUJOURS le format QueryModel standard du DataTable
     *
     * @param queryModel - Modèle de requête au format QueryModel standard
     */
    const handlePaginationChanged = async (queryModel: QueryModel) => {
        try {
            // Vérifier que queryModel existe
            if (!queryModel || typeof queryModel !== 'object') {
                return
            }

            // Mettre à jour la pagination
            if (queryModel.page) {
                currentPage.value = queryModel.page
            }
            if (queryModel.pageSize) {
                pageSize.value = queryModel.pageSize
            }

            // Mettre à jour le tri si fourni
            if (queryModel.sort && Array.isArray(queryModel.sort)) {
                sortModel.value = queryModel.sort.map(s => ({
                    colId: (s as any).field || s.colId || '',
                    sort: ((s as any).direction || s.sort || 'asc') as 'asc' | 'desc'
                }))
            }

            // Mettre à jour les filtres si fournis
            if (queryModel.filters) {
                const convertedFilters: DataTableFilters = {}
                Object.entries(queryModel.filters).forEach(([field, filterValue]) => {
                    if (Array.isArray(filterValue)) {
                        convertedFilters[field] = { value: filterValue, operator: 'in' }
                    } else if (typeof filterValue === 'object' && filterValue !== null) {
                        const filterObj = filterValue as any
                        if ('value' in filterObj) {
                            convertedFilters[field] = {
                                value: filterObj.value,
                                operator: filterObj.operator || 'contains'
                            }
                        }
                    }
                })
                filters.value = convertedFilters
            }

            // Mettre à jour la recherche globale si fournie
            if (queryModel.search !== undefined) {
                searchQuery.value = queryModel.search || ''
            }

            await loadData()
        } catch (error) {
            logger.error('Erreur dans handlePaginationChanged', error)
            throw error
        }
    }

    /**
     * Réinitialiser tous les filtres et paramètres
     */
    const resetFilters = async () => {
        filters.value = {}
        searchQuery.value = ''
        sortModel.value = []
        currentPage.value = 1
        await loadData()
    }

    /**
     * Rafraîchir les données
     */
    const refresh = async () => {
        await loadData()
    }

    // ===== RETURN =====

    return {
        // État
        data: computed(() => data.value),
        loading: computed(() => loading.value),
        currentPage: computed(() => currentPage.value),
        pageSize: pageSize, // Exposer directement le ref pour une meilleure réactivité
        searchQuery: computed(() => searchQuery.value),
        sortModel: computed(() => sortModel.value),
        pagination: computed(() => pagination.value),

        // QueryModel
        queryModel: computed(() => queryModelRef.value),
        queryOutputMode: computed(() => queryOutputMode),
        convertQueryModelToOutput: convertQueryModelToOutputFn,

        // Actions
        handleFilterChanged,
        handleSortChanged,
        handleSearchChanged,
        handlePaginationChanged,
        resetFilters,
        refresh,
        loadData
    }
}

// ===== COMPOSABLE SPÉCIALISÉ =====

/**
 * Composable spécialisé pour les inventaires
 * Utilise le composable générique avec la configuration des inventaires
 *
 * @returns État et méthodes pour gérer le DataTable des inventaires
 */
export function useInventoryDataTable() {
    const inventoryStore = useInventoryStore()

    return useGenericDataTable<InventoryTable>({
        store: inventoryStore,
        fetchAction: 'fetchInventories',
        defaultPageSize: 20
    })
}
