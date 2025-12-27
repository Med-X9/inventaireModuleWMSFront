/**
 * Composable pour gérer les handlers du DataTable
 *
 * Orchestre les composables spécialisés pour chaque fonctionnalité :
 * - Pagination → useDataTablePagination
 * - Recherche → useDataTableSearch
 * - Filtres → useDataTableFilters
 * - Tri → useDataTableSort
 * - Sélection → useDataTableSelectionHandler
 *
 * @module useDataTableHandlers
 */

import { computed, type Ref } from 'vue'
import type { DataTableProps } from '../types/dataTable'
import type { QueryModel } from '../types/QueryModel'
import type { UseQueryModelReturn } from './useQueryModel'
import { createQueryModelFromDataTableParams } from '../utils/queryModelConverter'
import { useDataTablePagination } from './useDataTablePagination'
import { useDataTableSearch } from './useDataTableSearch'
import { useDataTableFilters } from './useDataTableFilters'
import { useDataTableSort } from './useDataTableSort'
import { useDataTableSelectionHandler } from './useDataTableSelectionHandler'

/**
 * Configuration pour useDataTableHandlers
 */
export interface UseDataTableHandlersConfig {
    /** Props du DataTable */
    props: DataTableProps
    /** Émission d'événements (avec cache anti-répétition) */
    emit: {
        'pagination-changed': (queryModel: QueryModel) => void
        'sort-changed': (queryModel: QueryModel) => void
        'filter-changed': (queryModel: QueryModel) => void
        'global-search-changed': (queryModel: QueryModel) => void
        'selection-changed': (selectedRows: Set<string>) => void
    }
    /** Composable useDataTable */
    dataTable: any
    /** Composable useQueryModel */
    queryModel: any
    /** Composable useAutoDataTable (optionnel) */
    autoDataTable?: any
    /** État local du tri */
    currentSortModel: Ref<Array<{ colId: string; sort: 'asc' | 'desc' }>>
    /** Composable useMultiSort (optionnel) */
    multiSort?: any
    /** Délai de debounce pour la recherche (défaut: 500ms) */
    debounceDelay?: number
}

/**
 * Composable pour gérer les handlers du DataTable
 *
 * @param config - Configuration du composable
 * @returns Handlers et utilitaires pour le DataTable
 */
export function useDataTableHandlers(config: UseDataTableHandlersConfig) {
    const {
        props,
        emit,
        dataTable,
        queryModel,
        autoDataTable,
        currentSortModel,
        multiSort,
        debounceDelay = 500
    } = config

    /**
     * Crée un QueryModel depuis l'état actuel du DataTable
     *
     * Utilisé pour émettre les événements avec l'état complet.
     * Préserve toutes les valeurs : pagination, tri, filtres, recherche, customParams.
     *
     * Pour la pagination côté serveur, utilise les props du backend (currentPageProp, pageSizeProp)
     * qui reflètent l'état réel retourné par le backend selon PAGINATION_FRONTEND.md.
     *
     * @returns QueryModel complet reflétant l'état actuel
     */
    const createQueryModelFromCurrentState = (): QueryModel => {
        // En pagination serveur, utiliser les props du backend qui reflètent l'état réel
        // Sinon utiliser l'état local du DataTable
        const currentPage = props.serverSidePagination
            ? (props.currentPageProp ?? dataTable?.effectiveCurrentPage ?? 1)
            : (dataTable?.effectiveCurrentPage || 1)

        const currentPageSize = props.serverSidePagination
            ? (props.pageSizeProp ?? dataTable?.effectivePageSize ?? 20)
            : (dataTable?.effectivePageSize || 20)

        return createQueryModelFromDataTableParams({
            page: currentPage,
            pageSize: currentPageSize,
            sort: currentSortModel.value?.map(s => ({
                colId: s.colId,
                sort: s.sort
            })),
            filters: dataTable?.filterState || {},
            search: dataTable?.globalSearchTerm || undefined,
            customParams: props.customDataTableParams || {}
        })
    }

    // === COMPOSABLES SPÉCIALISÉS ===

    // Pagination
    const pagination = useDataTablePagination({
        props,
        dataTable,
        currentSortModel,
        autoDataTable,
        emit: emit['pagination-changed']
    })

    // Recherche
    const search = useDataTableSearch({
        props,
        dataTable,
        queryModel,
        currentSortModel,
        autoDataTable,
        emit: emit['global-search-changed'],
        debounceDelay
    })

    // Filtres
    const filters = useDataTableFilters({
        props,
        dataTable,
        queryModel,
        currentSortModel,
        autoDataTable,
        emit: emit['filter-changed']
    })

    // Tri
    const sort = useDataTableSort({
        props,
        dataTable,
        queryModel,
        currentSortModel,
        multiSort,
        autoDataTable,
        emit: emit['sort-changed']
    })

    // Sélection
    const selection = useDataTableSelectionHandler({
        dataTable,
        emit
    })

    return {
        createQueryModelFromCurrentState,
        // Handlers depuis les composables spécialisés
        handleGlobalSearchUpdate: search.handleGlobalSearchUpdate,
        handlePaginationChanged: pagination.handlePaginationChanged,
        handlePageSizeChanged: pagination.handlePageSizeChanged,
        handleSortChanged: sort.handleSortChanged,
        handleClearAllFilters: filters.handleClearAllFilters,
        handleFilterChanged: filters.handleFilterChanged,
        handleSelectionChanged: selection.handleSelectionChanged,
        // États
        isSearching: search.isSearching
    }
}

