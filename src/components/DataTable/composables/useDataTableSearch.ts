/**
 * Composable pour gérer la recherche globale du DataTable
 *
 * Responsabilité unique : Gestion de la recherche globale avec debounce
 *
 * @module useDataTableSearch
 */

import { computed, ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { DataTableProps } from '../types/dataTable'
import type { QueryModel } from '../types/QueryModel'
import { createQueryModelFromDataTableParams } from '../utils/queryModelConverter'
import type { UseQueryModelReturn } from './useQueryModel'
import { useDataTableOptimizations } from './useDataTableOptimizations'
import { DATA_TABLE_CONSTANTS } from '../constants'

/**
 * Configuration pour useDataTableSearch
 */
export interface UseDataTableSearchConfig {
    /** Props du DataTable */
    props: DataTableProps
    /** Composable useDataTable */
    dataTable: any
    /** Composable useQueryModel */
    queryModel: UseQueryModelReturn
    /** État du tri */
    currentSortModel: any
    /** Composable useAutoDataTable (optionnel) */
    autoDataTable?: any
    /** Fonction d'émission pour global-search-changed */
    emit: (queryModel: QueryModel) => void
    /** Délai de debounce (défaut: 500ms) */
    debounceDelay?: number
}

/**
 * Composable pour gérer la recherche globale
 */
export function useDataTableSearch(config: UseDataTableSearchConfig) {
    const { props, dataTable, queryModel, currentSortModel, autoDataTable, emit, debounceDelay = DATA_TABLE_CONSTANTS.DEBOUNCE_SEARCH_DELAY } = config

    // Optimisations
    const optimizations = useDataTableOptimizations({ debounceFilterDelay: debounceDelay })

    // État pour indiquer qu'une recherche est en cours
    const isSearching = ref(false)

    // Récupérer les méthodes de manière sécurisée
    const updateQueryPagination = queryModel?.updatePagination
    const updateQueryGlobalSearch = queryModel?.updateSearch

    /**
     * Détermine si les handlers automatiques doivent être utilisés
     */
    const shouldUseAutoHandlers = computed(() => !!autoDataTable)

    /**
     * Crée un QueryModel avec la recherche
     */
    // ⚡ SERVER-SIDE ONLY : Créer un QueryModel avec la recherche
    const createSearchQueryModel = (searchTerm: string): QueryModel => {
        const currentPage = props.currentPageProp ?? dataTable?.effectiveCurrentPage ?? 1
        const currentPageSize = props.pageSizeProp ?? dataTable?.effectivePageSize ?? 20

        return createQueryModelFromDataTableParams({
            page: 1, // Réinitialiser à la page 1 lors d'une recherche
            pageSize: currentPageSize,
            sort: currentSortModel.value?.map((sortItem: { colId: string; sort: 'asc' | 'desc' }) => ({
                colId: sortItem.colId,
                sort: sortItem.sort
            })),
            filters: dataTable?.filterState || {},
            search: searchTerm || undefined,
            customParams: props.customDataTableParams || {}
        })
    }

    /**
     * Debounce pour la recherche globale
     * Conformément à PAGINATION_FRONTEND.md : réinitialise à la page 1 lors d'un changement de recherche
     */
    const debouncedGlobalSearch = useDebounceFn(async (searchTerm: string) => {
        try {
            isSearching.value = true

            // Mettre à jour la pagination dans le QueryModel si la méthode est disponible
            if (updateQueryPagination && typeof updateQueryPagination === 'function') {
                updateQueryPagination(1, dataTable?.effectivePageSize || 20)
            }
            // Mettre à jour la recherche dans le QueryModel si la méthode est disponible
            if (updateQueryGlobalSearch && typeof updateQueryGlobalSearch === 'function') {
                updateQueryGlobalSearch(searchTerm || '')
            }

            const queryModel = createSearchQueryModel(searchTerm)

            // Vérifier si le QueryModel a changé (cache avec hash)
            if (!optimizations.hasQueryModelChanged(queryModel)) {
                optimizations.debugLog('[useDataTableSearch] QueryModel identique, évitement de l\'émission')
                return
            }

            optimizations.debugLog('[DataTable] 📤 SEARCH - Emitting global-search-changed:', {
                search: queryModel.search,
                page: queryModel.page,
                timestamp: new Date().toISOString()
            })
            emit(queryModel)
        } finally {
            isSearching.value = false
        }
    }, debounceDelay)

    /**
     * Handler pour les changements de recherche globale
     *
     * Conformément à PAGINATION_FRONTEND.md :
     * - Réinitialise la page à 1 lors d'un changement de recherche
     * - Émet un QueryModel complet avec la nouvelle recherche
     */
    const handleGlobalSearchUpdate = async (searchTerm: string) => {
        dataTable.updateGlobalSearchTerm(searchTerm)

        // ⚡ SERVER-SIDE ONLY : Réinitialiser à la page 1 (conforme PAGINATION_FRONTEND.md)
        if (dataTable?.goToPage) {
            dataTable.goToPage(1)
        }

        if (autoDataTable && shouldUseAutoHandlers.value) {
            await autoDataTable.handleGlobalSearchChanged(searchTerm)
            return
        }

        debouncedGlobalSearch(searchTerm)
    }

    return {
        handleGlobalSearchUpdate,
        isSearching: computed(() => isSearching.value)
    }
}

