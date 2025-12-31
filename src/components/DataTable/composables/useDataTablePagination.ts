/**
 * Composable pour gérer la pagination du DataTable
 * 
 * Responsabilité unique : Gestion de la pagination (page, pageSize)
 * 
 * @module useDataTablePagination
 */

import { computed, type Ref } from 'vue'
import type { DataTableProps } from '../types/dataTable'
import type { QueryModel } from '../types/QueryModel'
import { createQueryModelFromDataTableParams } from '../utils/queryModelConverter'

/**
 * Configuration pour useDataTablePagination
 */
export interface UseDataTablePaginationConfig {
    /** Props du DataTable */
    props: DataTableProps
    /** Composable useDataTable */
    dataTable: any
    /** État du tri */
    currentSortModel: Ref<Array<{ colId: string; sort: 'asc' | 'desc' }>>
    /** Composable useAutoDataTable (optionnel) */
    autoDataTable?: any
    /** Fonction d'émission pour pagination-changed */
    emit: (queryModel: QueryModel) => void
}

/**
 * Composable pour gérer la pagination
 */
export function useDataTablePagination(config: UseDataTablePaginationConfig) {
    const { props, dataTable, currentSortModel, autoDataTable, emit } = config

    /**
     * Détermine si les handlers automatiques doivent être utilisés
     */
    const shouldUseAutoHandlers = computed(() => !!autoDataTable)

    /**
     * Crée un QueryModel pour la pagination avec les paramètres actuels
     */
    const createPaginationQueryModel = (page: number, pageSize: number): QueryModel => {
        return createQueryModelFromDataTableParams({
            page,
            pageSize,
            sort: currentSortModel.value?.map(s => ({
                colId: s.colId,
                sort: s.sort
            })),
            filters: dataTable?.filterState || {},
            search: dataTable?.globalSearchTerm || undefined,
            customParams: props.customDataTableParams || {}
        })
    }

    /**
     * Handler pour les changements de pagination
     * 
     * Préserve l'état actuel (tri, filtres, recherche) et met uniquement à jour la page.
     * Émet un QueryModel complet avec la nouvelle page.
     */
    const handlePaginationChanged = async (page: number) => {
        const currentPageSize = props.serverSidePagination
            ? (props.pageSizeProp ?? dataTable?.effectivePageSize ?? 20)
            : (dataTable?.effectivePageSize || 20)

        const newQueryModel = createPaginationQueryModel(page, currentPageSize)

        if (autoDataTable && shouldUseAutoHandlers.value) {
            await autoDataTable.handlePaginationChanged(newQueryModel)
            return
        }

        // ✅ Émettre l'événement pagination-changed pour que le parent gère la pagination serveur
        // Cela permet aux composables comme useInventoryResults, usePlanning, etc. de réagir
        emit(newQueryModel)

        // Mettre à jour l'état local uniquement pour la pagination côté client
        // Pour la pagination serveur, on attend que le parent mette à jour les props depuis la réponse du backend
        // Ne PAS modifier effectiveCurrentPage en pagination serveur car c'est un getter computed en lecture seule
        if (!props.serverSidePagination) {
            dataTable?.goToPage?.(page)
        }
        // En pagination serveur, on n'a pas besoin de mettre à jour effectiveCurrentPage
        // car il est calculé depuis les props (currentPageProp) qui sont mises à jour par le parent

        // Émettre le QueryModel avec la nouvelle page
        console.log('[DataTable] 📤 PAGINATION - Emitting pagination-changed:', {
            page: newQueryModel.page,
            pageSize: newQueryModel.pageSize,
            filters: newQueryModel.filters,
            timestamp: new Date().toISOString()
        })
        emit(newQueryModel)
    }

    /**
     * Handler pour les changements de taille de page
     * 
     * Conformément à PAGINATION_FRONTEND.md :
     * - Réinitialise la page à 1 lors d'un changement de taille de page
     * - Émet un QueryModel complet avec la nouvelle taille de page
     */
    const handlePageSizeChanged = (size: number) => {
        console.log('[useDataTablePagination] handlePageSizeChanged called with size:', size)
        if (dataTable && typeof dataTable.changePageSize === 'function') {
            dataTable.changePageSize(size)
        }

        // Réinitialiser à la page 1 (conforme PAGINATION_FRONTEND.md)
        const newQueryModel = createPaginationQueryModel(1, size)
        console.log('[useDataTablePagination] Emitting pagination-changed with queryModel:', newQueryModel)
        emit(newQueryModel)
    }

    return {
        handlePaginationChanged,
        handlePageSizeChanged
    }
}

