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
import { type StandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter'

// ===== IMPORTS STORES =====
import { useInventoryStore } from '@/stores/inventory'

// ===== IMPORTS TYPES =====
import type { InventoryTable } from '@/models/Inventory'

// ===== INTERFACES =====

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
    const { store, fetchAction, defaultPageSize = 20, additionalParams } = config

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

            // Préparer les paramètres
            const params: DataTableParams = {
                page: currentPage.value,
                pageSize: pageSize.value,
                globalSearch: searchQuery.value,
                filters: filters.value,
                sort: sortModel.value.length > 0 ? sortModel.value : undefined
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

            // Appeler l'action du store
            let result: DataTableResult<T>
            if (resolvedAdditionalParams && Object.keys(resolvedAdditionalParams).length > 0) {
                const args: any[] = Object.values(resolvedAdditionalParams)
                args.push(params)
                result = await store[fetchAction](...args)
            } else {
                result = await store[fetchAction](params)
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
     * Accepte soit le format standard DataTable (venant du composant), soit l'ancien format
     * 
     * @param filterModel - Modèle de filtres (format standard ou ancien format)
     */
    const handleFilterChanged = async (filterModel: Record<string, { filter: string }> | StandardDataTableParams) => {
        // Si c'est déjà le format standard (venant du DataTable), extraire les informations
        if ('draw' in filterModel && 'start' in filterModel && 'length' in filterModel) {
            const standardParams = filterModel as StandardDataTableParams
            const extracted = extractFromStandardParams(standardParams)
            
            currentPage.value = extracted.page
            pageSize.value = extracted.pageSize
            searchQuery.value = extracted.searchQuery
            sortModel.value = extracted.sortModel
            filters.value = extracted.filters
            
            await loadData()
            return
        }

        // Sinon, convertir l'ancien format
        const filterModelObj = filterModel as Record<string, { filter: string }>
        const transformedFilters = transformFilters(filterModelObj)
        filters.value = transformedFilters
        currentPage.value = 1
        await loadData()
    }

    /**
     * Handler pour les changements de tri
     * Accepte soit le format standard DataTable (venant du composant), soit l'ancien format
     * 
     * @param newSortModel - Modèle de tri (format standard ou ancien format)
     */
    const handleSortChanged = async (newSortModel: Array<{ field: string; direction: 'asc' | 'desc' }> | StandardDataTableParams) => {
        // Si c'est déjà le format standard (venant du DataTable), extraire les informations
        if ('draw' in newSortModel && 'start' in newSortModel && 'length' in newSortModel) {
            const standardParams = newSortModel as StandardDataTableParams
            const extracted = extractFromStandardParams(standardParams)
            
            currentPage.value = extracted.page
            pageSize.value = extracted.pageSize
            searchQuery.value = extracted.searchQuery
            sortModel.value = extracted.sortModel
            filters.value = extracted.filters
            
            await loadData()
            return
        }

        // Sinon, convertir l'ancien format
        const sortModelArray = newSortModel as Array<{ field: string; direction: 'asc' | 'desc' }>
        sortModel.value = sortModelArray.map(sort => ({
            colId: sort.field,
            sort: sort.direction
        }))
        currentPage.value = 1
        await loadData()
    }

    /**
     * Handler pour les changements de recherche globale
     * Accepte soit le format standard DataTable (venant du composant), soit l'ancien format
     * 
     * @param searchValue - Terme de recherche (format standard ou string)
     */
    const handleSearchChanged = async (searchValue: string | StandardDataTableParams) => {
        // Si c'est déjà le format standard (venant du DataTable), extraire les informations
        if (typeof searchValue === 'object' && 'draw' in searchValue && 'start' in searchValue && 'length' in searchValue) {
            const standardParams = searchValue as StandardDataTableParams
            const extracted = extractFromStandardParams(standardParams)
            
            currentPage.value = extracted.page
            pageSize.value = extracted.pageSize
            searchQuery.value = extracted.searchQuery
            sortModel.value = extracted.sortModel
            filters.value = extracted.filters
            
            await loadData()
            return
        }

        // Sinon, utiliser directement la valeur string
        searchQuery.value = searchValue as string
        currentPage.value = 1
        await loadData()
    }

    /**
     * Handler pour les changements de pagination
     * Accepte soit le format standard DataTable (venant du composant), soit l'ancien format
     * 
     * @param params - Paramètres de pagination (format standard ou ancien format)
     */
    const handlePaginationChanged = async (params: { page: number; pageSize: number } | StandardDataTableParams) => {
        // Si c'est déjà le format standard (venant du DataTable), extraire les informations
        if ('draw' in params && 'start' in params && 'length' in params) {
            const standardParams = params as StandardDataTableParams
            const extracted = extractFromStandardParams(standardParams)
            
            currentPage.value = extracted.page
            pageSize.value = extracted.pageSize
            searchQuery.value = extracted.searchQuery
            sortModel.value = extracted.sortModel
            filters.value = extracted.filters
            
            await loadData()
            return
        }

        // Sinon, convertir l'ancien format
        const paginationParams = params as { page: number; pageSize: number }
        currentPage.value = paginationParams.page
        pageSize.value = paginationParams.pageSize
        await loadData()
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
        pageSize: computed(() => pageSize.value),
        searchQuery: computed(() => searchQuery.value),
        sortModel: computed(() => sortModel.value),
        pagination: computed(() => pagination.value),

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
