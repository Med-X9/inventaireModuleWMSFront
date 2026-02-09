/**
 * Composable pour gérer le tri du DataTable
 * 
 * Responsabilité unique : Gestion du tri (simple et multi-colonnes)
 * 
 * @module useDataTableSort
 */

import { computed, type Ref } from 'vue'
import type { DataTableProps } from '../types/dataTable'
import type { QueryModel } from '../types/QueryModel'
import { createQueryModelFromDataTableParams } from '../utils/queryModelConverter'
import type { UseQueryModelReturn } from './useQueryModel'

/**
 * Configuration pour useDataTableSort
 */
export interface UseDataTableSortConfig {
    /** Props du DataTable */
    props: DataTableProps
    /** Composable useDataTable */
    dataTable: any
    /** Composable useQueryModel */
    queryModel: UseQueryModelReturn
    /** État du tri */
    currentSortModel: Ref<Array<{ colId: string; sort: 'asc' | 'desc' }>>
    /** Composable useMultiSort (optionnel) */
    multiSort?: any
    /** Composable useAutoDataTable (optionnel) */
    autoDataTable?: any
    /** Fonction d'émission pour sort-changed */
    emit: (queryModel: QueryModel) => void
}

/**
 * Composable pour gérer le tri
 */
export function useDataTableSort(config: UseDataTableSortConfig) {
    const { props, dataTable, queryModel, currentSortModel, multiSort, autoDataTable, emit } = config

    const { updateSort: updateQuerySort } = queryModel

    /**
     * Détermine si les handlers automatiques doivent être utilisés
     */
    const shouldUseAutoHandlers = computed(() => !!autoDataTable)

    /**
     * Crée un QueryModel avec le tri actuel
     */
    // ⚡ SERVER-SIDE ONLY : Créer un QueryModel avec le tri
    const createSortQueryModel = (sortModel: Array<{ colId: string; sort: 'asc' | 'desc' }>): QueryModel => {
        const currentPage = props.currentPageProp ?? dataTable?.effectiveCurrentPage ?? 1
        const currentPageSize = props.pageSizeProp ?? dataTable?.effectivePageSize ?? 20
        
        return createQueryModelFromDataTableParams({
            page: currentPage,
            pageSize: currentPageSize,
            sort: sortModel,
            filters: dataTable?.filterState || {},
            search: dataTable?.globalSearchTerm || undefined,
            customParams: props.customDataTableParams || {}
        })
    }

    /**
     * Handler pour les changements de tri
     * 
     * Gère le tri simple et multi-colonnes.
     * Préserve l'état actuel (pagination, filtres, recherche) et met uniquement à jour le tri.
     * Émet un QueryModel complet avec le nouveau tri.
     */
    const handleSortChanged = async (sortData: { field: string; direction: 'asc' | 'desc'; isActive: boolean }) => {
        if (autoDataTable && shouldUseAutoHandlers.value) {
            await autoDataTable.handleSortChanged(sortData)
            return
        }

        if (multiSort) {
            // Tri multi-colonnes
            if (sortData.isActive) {
                multiSort.addSort(sortData.field, sortData.direction)
            } else {
                multiSort.removeSort(sortData.field)
            }

            const sortModel = multiSort.dataTablesSortModel.value
            currentSortModel.value = sortModel

            // ⚡ SERVER-SIDE ONLY : Mettre à jour le QueryModel et émettre
            const sortModels = sortModel.map((s, index) => ({
                field: s.colId,
                direction: s.sort,
                priority: index + 1
            }))
            updateQuerySort(sortModels)

            // Émettre directement le QueryModel
            const queryModel = createSortQueryModel(sortModel)
            emit(queryModel)
        } else {
            // Tri simple
            const sortModel = sortData.isActive ? [{
                colId: sortData.field,
                sort: sortData.direction
            }] : []

            currentSortModel.value = sortModel

            // ⚡ SERVER-SIDE ONLY : Émettre directement le QueryModel
            const queryModel = createSortQueryModel(sortModel)
            emit(queryModel)
        }
    }

    return {
        handleSortChanged
    }
}

