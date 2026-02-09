/**
 * ⚡ Composable pour l'état global du DataTable
 * 
 * Centralise la gestion de l'état global :
 * - États de chargement (loading, searching)
 * - États d'erreur (error, retry)
 * - États calculés (hasActiveFilters, hasActiveSearch)
 * - Synchronisation QueryModel
 * 
 * @module useDataTableState
 */

import { ref, computed, type Ref } from 'vue'
import type { DataTableProps } from '../types/dataTable'
import type { QueryModel } from '../types/QueryModel'
import type { EmitFunction, FilterState } from '../types/composables'

/**
 * Configuration pour useDataTableState
 */
export interface UseDataTableStateConfig {
    /** Props du DataTable */
    props: DataTableProps
    /** Fonction d'émission d'événements */
    emit: EmitFunction
    /** Instance du DataTable */
    dataTable: import('../types/composables').DataTableInstance
    /** État de recherche (isSearching) */
    isSearching?: Ref<boolean>
    /** États de master/detail (optionnel) */
    masterDetail?: {
        detailStates?: Ref<Map<string, { isLoading: boolean }>>
    }
}

/**
 * ⚡ Composable pour gérer l'état global du DataTable
 * 
 * @param config - Configuration du composable
 * @returns État global et utilitaires
 */
export function useDataTableState(config: UseDataTableStateConfig) {
    const { props, dataTable, isSearching, masterDetail } = config

    // ⚡ ÉTAT DE CHARGEMENT
    const isLoadingCombined = computed(() => {
        return props.loading ||
            (isSearching?.value || false) ||
            (masterDetail?.detailStates?.value &&
                masterDetail.detailStates.value.size > 0 &&
                Array.from(masterDetail.detailStates.value.values()).some(state => state.isLoading))
    })

    // ⚡ ÉTATS CALCULÉS
    const hasActiveFilters = computed(() => {
        try {
            const filterState = dataTable?.filterState
            const filters = typeof filterState === 'object' && filterState !== null
                ? (filterState as any)?.value || filterState
                : filterState || {}
            const keyCount = Object.keys(filters).length
            return keyCount > 0
        } catch {
            return false
        }
    })

    const hasActiveSearch = computed(() => {
        try {
            const searchTerm = dataTable?.globalSearchTerm
            const search = typeof searchTerm === 'string'
                ? searchTerm
                : (searchTerm as any)?.value || ''
            return search.trim().length > 0
        } catch {
            return false
        }
    })

    // ⚡ GESTION DES ERREURS
    const errorState = ref<string | null>(null)
    const retryFunction = ref<(() => void) | null>(null)

    /**
     * Définit un état d'erreur avec une fonction de retry
     */
    const setError = (message: string, retryFn?: () => void) => {
        errorState.value = message
        retryFunction.value = retryFn || null
    }

    /**
     * Efface l'état d'erreur
     */
    const clearError = () => {
        errorState.value = null
        retryFunction.value = null
    }

    /**
     * Retry la dernière action qui a échoué
     */
    const retryLastAction = () => {
        if (retryFunction.value) {
            retryFunction.value()
            clearError()
        }
    }

    return {
        // États de chargement
        isLoading: isLoadingCombined,
        isSearching: isSearching || ref(false),

        // États calculés
        hasActiveFilters,
        hasActiveSearch,

        // Gestion des erreurs
        errorState,
        retryFunction,
        setError,
        clearError,
        retryLastAction
    }
}

