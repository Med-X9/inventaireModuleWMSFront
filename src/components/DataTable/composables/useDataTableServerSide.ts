/**
 * ⚡ Composable pour la logique server-side du DataTable
 * 
 * Centralise toute la logique liée au mode server-side uniquement :
 * - Pagination server-side
 * - Tri server-side
 * - Filtres server-side
 * - Recherche server-side
 * 
 * @module useDataTableServerSide
 */

import { computed, ref, type Ref } from 'vue'
import type { DataTableProps } from '../types/dataTable'
import type { QueryModel } from '../types/QueryModel'
import type { EmitFunction } from '../types/composables'
import { useDataTablePagination } from './useDataTablePagination'
import { useDataTableSort } from './useDataTableSort'
import { useDataTableFilters } from './useDataTableFilters'
import { useDataTableSearch } from './useDataTableSearch'
import { useDataTableOptimizations } from './useDataTableOptimizations'
import { DATA_TABLE_CONSTANTS } from '../constants'

/**
 * Configuration pour useDataTableServerSide
 */
export interface UseDataTableServerSideConfig {
    /** Props du DataTable */
    props: DataTableProps
    /** Fonction d'émission d'événements */
    emit: EmitFunction
    /** Instance du DataTable */
    dataTable: import('../types/composables').DataTableInstance
    /** Instance du QueryModel */
    queryModel: import('./useQueryModel').UseQueryModelReturn & {
        updateSort: (sort: import('../types/composables').SortModelItem[]) => void
        updateFilter: (filters: import('../types/composables').FilterState) => void
        updatePagination: (page: number, pageSize: number) => void
        updateGlobalSearch: (search: string | undefined) => void
    }
    /** Instance AutoDataTable (optionnel) */
    autoDataTable?: import('../types/composables').AutoDataTableInstance
    /** Instance MultiSort (optionnel) */
    multiSort?: import('../types/composables').MultiSortInstance
    /** Instance tableConfig pour la persistance (optionnel) */
    tableConfig?: import('./useDataTableConfig').UseDataTableConfigReturn
}

/**
 * ⚡ Composable pour gérer toute la logique server-side
 * 
 * Orchestre les composables spécialisés pour :
 * - Pagination server-side
 * - Tri server-side
 * - Filtres server-side
 * - Recherche server-side
 * 
 * @param config - Configuration du composable
 * @returns Handlers et état pour les opérations server-side
 */
export function useDataTableServerSide(config: UseDataTableServerSideConfig) {
    const { props, emit, dataTable, queryModel, autoDataTable, multiSort, tableConfig } = config

    // Optimisations pour éviter les émissions répétées
    const optimizations = useDataTableOptimizations()

    // État du tri
    const currentSortModel = ref<Array<{ colId: string; sort: 'asc' | 'desc' }>>([])

    // ⚡ Wrappers d'émission avec cache anti-répétition
    const emitPaginationChanged = (queryModel: QueryModel) => {
        if (optimizations.hasQueryModelChanged(queryModel)) {
            emit('pagination-changed', queryModel)
        }
    }

    const emitSortChanged = (queryModel: QueryModel) => {
        if (optimizations.hasQueryModelChanged(queryModel)) {
            emit('sort-changed', queryModel)
        }
    }

    const emitFilterChanged = (queryModel: QueryModel) => {
        if (optimizations.hasQueryModelChanged(queryModel)) {
            emit('filter-changed', queryModel)
        }
    }

    const emitGlobalSearchChanged = (queryModel: QueryModel) => {
        if (optimizations.hasQueryModelChanged(queryModel)) {
            emit('global-search-changed', queryModel)
        }
    }

    // ⚡ Composables spécialisés pour chaque fonctionnalité server-side
    const pagination = useDataTablePagination({
        props,
        dataTable,
        currentSortModel,
        autoDataTable,
        emit: emitPaginationChanged
    })

    const sort = useDataTableSort({
        props,
        dataTable,
        queryModel,
        currentSortModel,
        multiSort,
        autoDataTable,
        emit: emitSortChanged
    })

    const filters = useDataTableFilters({
        props,
        dataTable,
        queryModel,
        currentSortModel,
        autoDataTable,
        emit: emitFilterChanged,
        debounceFilterDelay: 300
    })

    const search = useDataTableSearch({
        props,
        dataTable,
        queryModel,
        currentSortModel,
        autoDataTable,
        emit: emitGlobalSearchChanged,
        debounceDelay: DATA_TABLE_CONSTANTS.DEBOUNCE_SEARCH_DELAY
    })

    /**
     * Crée un QueryModel depuis l'état actuel du DataTable
     * 
     * ⚡ SERVER-SIDE ONLY : Utilise les props du backend qui reflètent l'état réel
     * 
     * @returns QueryModel complet reflétant l'état actuel
     */
    const createQueryModelFromCurrentState = (): QueryModel => {
        // ⚡ SERVER-SIDE ONLY : Utiliser les props du backend
        const currentPage = props.currentPageProp ?? dataTable?.effectiveCurrentPage ?? 1
        const currentPageSize = props.pageSizeProp ?? dataTable?.effectivePageSize ?? 20
        
        // Lire directement depuis dataTable pour garantir la synchronisation
        const currentFilters = dataTable?.filterState || {}
        const currentSearch = dataTable?.globalSearchTerm || ''
        const currentSort = currentSortModel.value || []

        return {
            page: currentPage,
            pageSize: currentPageSize,
            filters: currentFilters,
            search: currentSearch || undefined,
            sort: currentSort.map(s => ({
                colId: s.colId,
                sort: s.sort
            })),
            customParams: props.customParams || {}
        }
    }

    // ⚡ Helpers pour sauvegarder dans tableConfig
    const savePageToConfig = (page: number) => {
        if (tableConfig && page > 0) {
            tableConfig.updatePage(page)
        }
    }

    const savePageSizeToConfig = (pageSize: number) => {
        if (tableConfig && pageSize > 0) {
            tableConfig.updatePageSize(pageSize)
        }
    }

    const saveFiltersToConfig = (filters: import('../types/composables').FilterState) => {
        if (tableConfig && filters) {
            tableConfig.updateFilters(filters)
        }
    }

    const saveSearchToConfig = (search: string | undefined) => {
        if (tableConfig) {
            tableConfig.updateSearch(search)
        }
    }

    const saveSortToConfig = (sortModel: Array<{ colId: string; sort: 'asc' | 'desc' }>) => {
        if (tableConfig && sortModel) {
            const sortToSave = sortModel.map(s => ({
                field: s.colId,
                direction: s.sort
            }))
            tableConfig.updateSort(sortToSave)
        }
    }

    // ⚡ Wrappers des handlers avec sauvegarde automatique
    const handlePaginationChangedWrapper = async (page: number) => {
        savePageToConfig(page)
        await pagination.handlePaginationChanged(page)
    }

    const handlePageSizeChangedWrapper = (size: number) => {
        savePageSizeToConfig(size)
        savePageToConfig(1) // Réinitialiser à la page 1
        pagination.handlePageSizeChanged(size)
        
        // Émettre query-model-changed
        const queryModel = createQueryModelFromCurrentState()
        queryModel.page = 1
        queryModel.pageSize = size
        emit('query-model-changed', queryModel)
        emit('page-size-changed', queryModel)
    }

    const handleFilterChangedWrapper = async (queryModelOrFilters: QueryModel | import('../types/composables').FilterState) => {
        const queryModel = ('page' in queryModelOrFilters && 'pageSize' in queryModelOrFilters)
            ? queryModelOrFilters as QueryModel
            : (() => {
                const qm = createQueryModelFromCurrentState()
                qm.filters = queryModelOrFilters as import('../types/composables').FilterState
                return qm
            })()
        
        await filters.handleFilterChanged(queryModel)
        saveFiltersToConfig(queryModel.filters || {})
        emit('query-model-changed', queryModel)
    }

    const handleSortChangedWrapper = async (sortData: { field: string; direction: 'asc' | 'desc'; isActive: boolean }) => {
        await sort.handleSortChanged(sortData)
        saveSortToConfig(currentSortModel.value)
        
        const queryModel = createQueryModelFromCurrentState()
        emit('query-model-changed', queryModel)
    }

    const handleGlobalSearchUpdateWrapper = async (searchTerm: string | QueryModel) => {
        const searchString = typeof searchTerm === 'string' ? searchTerm : searchTerm.search || ''
        await search.handleGlobalSearchUpdate(searchString)
        saveSearchToConfig(searchString || undefined)
        
        const queryModel = createQueryModelFromCurrentState()
        emit('query-model-changed', queryModel)
    }

    return {
        // Handlers avec sauvegarde automatique
        handlePaginationChanged: handlePaginationChangedWrapper,
        handlePageSizeChanged: handlePageSizeChangedWrapper,
        handleSortChanged: handleSortChangedWrapper,
        handleFilterChanged: handleFilterChangedWrapper,
        handleGlobalSearchUpdate: handleGlobalSearchUpdateWrapper,
        handleClearAllFilters: filters.handleClearAllFilters,

        // État
        currentSortModel,
        isSearching: search.isSearching,

        // Utilitaires
        createQueryModelFromCurrentState
    }
}

