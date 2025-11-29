/**
 * Composable pour gérer le QueryModel dans DataTable
 * 
 * Fournit une interface unifiée pour gérer les requêtes avec QueryModel
 */

import { ref, computed, type Ref } from 'vue'
import type { QueryModel, SortModel, FilterModel } from '../types/QueryModel'
import { convertQueryModelToStandardParams, createQueryModelFromDataTableParams } from '../utils/queryModelConverter'

export interface UseQueryModelOptions {
    /** Colonnes de la table */
    columns: Ref<Array<{ field: string; [key: string]: any }>>
    /** Activer le QueryModel */
    enabled?: boolean
}

/**
 * Composable pour gérer le QueryModel
 */
export function useQueryModel(options: UseQueryModelOptions) {
    const { columns, enabled = true } = options

    // État du QueryModel
    const queryModel = ref<QueryModel>({
        pagination: {
            page: 1,
            pageSize: 20
        }
    })

    /**
     * Met à jour le QueryModel
     */
    const updateQueryModel = (updates: Partial<QueryModel>) => {
        queryModel.value = {
            ...queryModel.value,
            ...updates
        }
    }

    /**
     * Met à jour le tri
     */
    const updateSort = (sort: SortModel[]) => {
        updateQueryModel({ sort })
    }

    /**
     * Ajoute ou met à jour un filtre
     */
    const updateFilter = (field: string, filter: FilterModel) => {
        const filters = { ...queryModel.value.filters }
        filters[field] = filter
        updateQueryModel({ filters })
    }

    /**
     * Supprime un filtre
     */
    const removeFilter = (field: string) => {
        const filters = { ...queryModel.value.filters }
        delete filters[field]
        updateQueryModel({ filters })
    }

    /**
     * Réinitialise tous les filtres
     */
    const clearFilters = () => {
        updateQueryModel({ filters: {} })
    }

    /**
     * Met à jour la pagination
     */
    const updatePagination = (page: number, pageSize: number) => {
        updateQueryModel({
            pagination: { page, pageSize }
        })
    }

    /**
     * Met à jour la recherche globale
     */
    const updateGlobalSearch = (search: string) => {
        updateQueryModel({ globalSearch: search })
    }

    /**
     * Réinitialise le QueryModel
     */
    const reset = () => {
        queryModel.value = {
            pagination: {
                page: 1,
                pageSize: 20
            }
        }
    }

    /**
     * Convertit le QueryModel vers StandardDataTableParams
     */
    const toStandardParams = computed(() => {
        if (!enabled) return null
        return convertQueryModelToStandardParams(queryModel.value, {
            columns: columns.value
        })
    })

    /**
     * Crée un QueryModel depuis les paramètres DataTable
     */
    const fromDataTableParams = (params: {
        page?: number
        pageSize?: number
        sort?: Array<{ field: string; direction: 'asc' | 'desc' }>
        filters?: Record<string, any>
        globalSearch?: string
    }) => {
        const newQueryModel = createQueryModelFromDataTableParams(params)
        queryModel.value = newQueryModel
    }

    return {
        // État
        queryModel: computed(() => queryModel.value),
        
        // Méthodes
        updateQueryModel,
        updateSort,
        updateFilter,
        removeFilter,
        clearFilters,
        updatePagination,
        updateGlobalSearch,
        reset,
        
        // Conversion
        toStandardParams,
        fromDataTableParams
    }
}

