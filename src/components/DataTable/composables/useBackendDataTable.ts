/**
 * Composable pour l'intégration DataTable avec les stores Pinia
 *
 * Fournit une interface unifiée pour connecter les DataTables aux stores
 * avec gestion automatique de la pagination, du tri et des filtres côté serveur.
 *
 * @module useBackendDataTable
 */

import { ref, computed, watch, onMounted, type Ref } from 'vue'
import type { QueryModel } from '../types/QueryModel'

/**
 * Configuration pour useBackendDataTable
 */
export interface UseBackendDataTableConfig<T = any> {
    /** Store Pinia à utiliser */
    piniaStore: any
    /** ID du store pour la persistance */
    storeId: string
    /** Chargement automatique au montage */
    autoLoad?: boolean
    /** Taille de page par défaut */
    pageSize?: number
    /** Paramètres par défaut */
    defaultParams?: Partial<QueryModel>
    /** Fonction de chargement personnalisée */
    loadFunction?: (params: QueryModel) => Promise<void>
}

/**
 * Interface de retour de useBackendDataTable
 */
export interface UseBackendDataTableReturn<T = any> {
    // État
    data: Ref<T[]>
    loading: Ref<boolean>
    currentPage: Ref<number>
    pageSize: Ref<number>
    searchQuery: Ref<string>
    sortModel: Ref<any[]>
    filters: Ref<any>
    pagination: Ref<any>

    // Méthodes
    setPage: (page: number) => void
    setPageSize: (size: number) => void
    setSearch: (query: string) => void
    setSortModel: (sort: any[]) => void
    setFilters: (filters: any) => void
    resetFilters: () => void
    refresh: () => Promise<void>

    // Utilitaires
    getCurrentQueryModel: () => QueryModel
}

/**
 * Composable pour connecter DataTable aux stores Pinia
 *
 * @param endpoint - Endpoint API (optionnel si store gère tout)
 * @param config - Configuration du composable
 * @returns Interface unifiée pour le DataTable
 */
export function useBackendDataTable<T = any>(
    endpoint: string = '',
    config: UseBackendDataTableConfig<T>
): UseBackendDataTableReturn<T> {
    const {
        piniaStore,
        storeId,
        autoLoad = false,
        pageSize: defaultPageSize = 20,
        defaultParams = {},
        loadFunction
    } = config

    // Synchronisation avec le store Pinia
    const data = computed(() => {
        const storeData = piniaStore[storeId === 'job' ? 'jobs' : 'locations'] || []
        console.log(`[useBackendDataTable] ${storeId} data:`, {
            length: storeData.length,
            hasData: storeData.length > 0,
            firstItem: storeData[0] || null
        })
        return storeData
    })
    const loading = computed(() => piniaStore.loading || false)
    const currentPage = computed({
        get: () => piniaStore.paginationMetadata?.page || 1,
        set: (value) => {
            if (piniaStore.setCurrentPage) {
                piniaStore.setCurrentPage(value)
            }
        }
    })
    const pageSize = computed({
        get: () => piniaStore.paginationMetadata?.pageSize || defaultPageSize,
        set: (value) => {
            if (piniaStore.setPageSize) {
                piniaStore.setPageSize(value)
            }
        }
    })

    // État local pour la recherche et les filtres (non stockés dans le store)
    const searchQuery = ref('')
    const sortModel = ref<any[]>([])
    const filters = ref<any>({})

    // Pagination synchronisée avec le store
    const pagination = computed(() => {
        const metadata = piniaStore.paginationMetadata || {}
        const current = metadata.page || currentPage.value
        const totalPages = metadata.totalPages || 1
        const total = metadata.total || 0

        return {
            current_page: current,
            total_pages: totalPages,
            has_next: current < totalPages,
            has_previous: current > 1,
            page_size: metadata.pageSize || pageSize.value,
            total: total
        }
    })

    // Méthodes de contrôle synchronisées avec le store
    const setPage = (page: number) => {
        currentPage.value = page
        // Le watcher dans usePlanning gérera le rechargement
    }

    const setPageSize = (size: number) => {
        pageSize.value = size
        currentPage.value = 1 // Reset to first page
        // Le watcher dans usePlanning gérera le rechargement
    }

    const setSearch = (query: string) => {
        searchQuery.value = query
        currentPage.value = 1 // Reset to first page
        // Le watcher dans usePlanning gérera le rechargement
    }

    const setSortModel = (sort: any[]) => {
        sortModel.value = sort
        // Le watcher dans usePlanning gérera le rechargement
    }

    const setFilters = (filterData: any) => {
        filters.value = filterData
        currentPage.value = 1 // Reset to first page
        // Le watcher dans usePlanning gérera le rechargement
    }

    const resetFilters = () => {
        filters.value = {}
        currentPage.value = 1
        // Le watcher dans usePlanning gérera le rechargement
    }

    const refresh = async (): Promise<void> => {
        try {
            if (loadFunction) {
                // Utiliser la fonction de chargement personnalisée si fournie
                const params: QueryModel = {
                    page: currentPage.value,
                    pageSize: pageSize.value,
                    search: searchQuery.value || undefined,
                    sort: sortModel.value.length > 0 ? sortModel.value.map(s => ({
                        colId: s.field || s.colId,
                        sort: s.direction || s.sort
                    })) : undefined,
                    filters: Object.keys(filters.value).length > 0 ? filters.value : undefined,
                    customParams: defaultParams.customParams || {}
                }
                await loadFunction(params)
            } else {
                // Fallback: utiliser la méthode générique du store si elle existe
                if (piniaStore.refresh) {
                    await piniaStore.refresh()
                }
            }
        } catch (error) {
            console.error('Erreur lors du refresh:', error)
            throw error
        }
    }

    // Watchers pour synchroniser l'état local avec le store
    watch(() => piniaStore.paginationMetadata, (metadata) => {
        if (metadata) {
            // Synchroniser les valeurs depuis le store si elles ont changé
            if (metadata.page && metadata.page !== currentPage.value) {
                currentPage.value = metadata.page
            }
            if (metadata.pageSize && metadata.pageSize !== pageSize.value) {
                pageSize.value = metadata.pageSize
            }
        }
    }, { immediate: true, deep: true })

    // Auto-chargement si demandé
    if (autoLoad) {
        onMounted(async () => {
            try {
                await refresh()
            } catch (error) {
                console.error('Erreur lors du chargement automatique:', error)
            }
        })
    }

    return {
        // État
        data,
        loading,
        currentPage,
        pageSize,
        searchQuery,
        sortModel,
        filters,
        pagination,

        // Méthodes
        setPage,
        setPageSize,
        setSearch,
        setSortModel,
        setFilters,
        resetFilters,
        refresh,

        // Utilitaires
        getCurrentQueryModel: () => ({
            page: currentPage.value,
            pageSize: pageSize.value,
            search: searchQuery.value || undefined,
            sort: sortModel.value.length > 0 ? sortModel.value.map(s => ({
                colId: s.field || s.colId,
                sort: s.direction || s.sort
            })) : undefined,
            filters: Object.keys(filters.value).length > 0 ? filters.value : undefined,
            customParams: defaultParams.customParams || {}
        })
    }
}
