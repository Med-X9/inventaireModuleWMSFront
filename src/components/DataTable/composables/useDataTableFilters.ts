/**
 * Composable pour gérer les filtres du DataTable
 *
 * Responsabilité unique : Gestion des filtres avec réinitialisation de la page
 *
 * @module useDataTableFilters
 */

import { computed, type Ref } from 'vue'
import type { DataTableProps } from '../types/dataTable'
import type { QueryModel } from '../types/QueryModel'
import { createQueryModelFromDataTableParams } from '../utils/queryModelConverter'
import { useQueryModel } from './useQueryModel'
import { useDataTableOptimizations } from './useDataTableOptimizations'

type UseQueryModelReturn = ReturnType<typeof useQueryModel>

/**
 * Configuration pour useDataTableFilters
 */
export interface UseDataTableFiltersConfig {
    /** Props du DataTable */
    props: DataTableProps
    /** Composable useDataTable */
    dataTable: import('../types/composables').DataTableInstance
    /** Composable useQueryModel */
    queryModel: UseQueryModelReturn
    /** État du tri */
    currentSortModel: Ref<Array<{ colId: string; sort: 'asc' | 'desc' }>>
    /** Composable useAutoDataTable (optionnel) */
    autoDataTable?: import('../types/composables').AutoDataTableInstance
    /** Fonction d'émission pour filter-changed */
    emit: (queryModel: QueryModel) => void
    /** Délai de debounce pour les filtres (défaut: 300ms) */
    debounceFilterDelay?: number
}

/**
 * Composable pour gérer les filtres
 */
export function useDataTableFilters(config: import('../types/composables').UseDataTableFiltersConfig) {
    const { props, dataTable, queryModel, currentSortModel, autoDataTable, emit, debounceDelay = 300 } = config

    // Optimisations
    const optimizations = useDataTableOptimizations({ debounceFilterDelay: debounceDelay })

    /**
     * Détermine si les handlers automatiques doivent être utilisés
     */
    const shouldUseAutoHandlers = computed(() => !!autoDataTable)

    /**
     * Crée un QueryModel avec les filtres depuis l'état actuel du DataTable
     *
     * @param filters - Objet de filtres { field: { operator, value, ... } }
     * @param page - Numéro de page (défaut: 1)
     * @returns QueryModel complet avec les filtres
     */
    // ⚡ SERVER-SIDE ONLY : Créer un QueryModel avec les filtres
    const createFiltersQueryModel = (filters: Record<string, any>, page: number = 1): QueryModel => {
        const currentPageSize = props.pageSizeProp ?? dataTable?.effectivePageSize ?? 20

        // ⚠️ CRITIQUE : Convertir le Proxy réactif en objet simple pour éviter les problèmes de sérialisation
        const filtersPlain = filters ? JSON.parse(JSON.stringify(filters)) : {}

        return createQueryModelFromDataTableParams({
            page,
            pageSize: currentPageSize,
            sort: currentSortModel.value?.map((sortItem: { colId: string; sort: 'asc' | 'desc' }) => ({
                colId: sortItem.colId,
                sort: sortItem.sort
            })),
            filters: filtersPlain,
            search: dataTable?.globalSearchTerm || undefined,
            customParams: props.customDataTableParams || {}
        })
    }

    /**
     * Handler interne pour les changements de filtres (sans debounce)
     * Appelé par le debounced handler
     */
    const handleFilterChangedInternal = async (queryModel: QueryModel) => {
        if (!queryModel || typeof queryModel !== 'object') {
            return
        }

        // ⚠️ DEBUG : Vérifier le QueryModel reçu (seulement en développement)
        optimizations.debugLog('[useDataTableFilters] handleFilterChangedInternal - QueryModel reçu:', queryModel)
        optimizations.debugLog('[useDataTableFilters] handleFilterChangedInternal - Type de filters:', typeof queryModel.filters)
        optimizations.debugLog('[useDataTableFilters] handleFilterChangedInternal - Filtres dans QueryModel:', queryModel.filters)
        optimizations.debugLog('[useDataTableFilters] handleFilterChangedInternal - Clés de filters:', queryModel.filters ? Object.keys(queryModel.filters) : 'null/undefined')

        // ⚠️ CRITIQUE : Convertir le Proxy réactif en objet simple pour garantir la sérialisation correcte
        let filtersPlain: Record<string, any> = {}
        if (queryModel.filters) {
            try {
                const filtersStr = JSON.stringify(queryModel.filters)
                filtersPlain = JSON.parse(filtersStr)

                // ⚠️ IMPORTANT : Vérifier que filtersPlain n'est pas un QueryModel complet
                // Si filtersPlain contient 'page', 'pageSize', 'filters', etc., c'est un QueryModel imbriqué incorrectement
                if (filtersPlain && typeof filtersPlain === 'object') {
                    const filterKeys = Object.keys(filtersPlain)
                    const hasQueryModelKeys = filterKeys.some(key => ['page', 'pageSize', 'filters', 'sort', 'search', 'customParams'].includes(key))

                    if (hasQueryModelKeys && 'filters' in filtersPlain && typeof filtersPlain.filters === 'object') {
                        // C'est un QueryModel imbriqué, extraire uniquement les filtres réels
                        optimizations.debugLog('[useDataTableFilters] QueryModel détecté dans filters, extraction des filtres réels')
                        filtersPlain = filtersPlain.filters || {}
                    }
                }
            } catch (e) {
                optimizations.errorLog('[useDataTableFilters] Erreur lors de la conversion des filtres:', e)
                filtersPlain = {}
            }
        }

        // ⚡ SERVER-SIDE ONLY : S'assurer que les filtres sont toujours présents dans le QueryModel (même si vides)
        const finalQueryModel: QueryModel = {
            page: queryModel.page ?? 1,
            pageSize: queryModel.pageSize ?? (props.pageSizeProp ?? dataTable?.effectivePageSize ?? 20),
            sort: queryModel.sort,
            filters: filtersPlain, // ⚠️ CRITIQUE : Utiliser l'objet plain (pas le Proxy)
            search: queryModel.search,
            customParams: {
                ...props.customDataTableParams,
                ...queryModel.customParams
            }
        }

        // ⚠️ DEBUG : Vérifier le QueryModel final avant émission (seulement en développement)
        optimizations.debugLog('[useDataTableFilters] handleFilterChangedInternal - QueryModel final créé:', finalQueryModel)
        optimizations.debugLog('[useDataTableFilters] handleFilterChangedInternal - Filtres dans QueryModel final (plain):', finalQueryModel.filters)
        optimizations.debugLog('[useDataTableFilters] handleFilterChangedInternal - Clés de filters final:', Object.keys(finalQueryModel.filters || {}))

        // Vérifier si le QueryModel a changé (cache avec hash)
        if (!optimizations.hasQueryModelChanged(finalQueryModel)) {
            optimizations.debugLog('[useDataTableFilters] QueryModel identique, évitement de l\'émission')
            return
        }

        if (autoDataTable && shouldUseAutoHandlers.value) {
            await autoDataTable.handleFilterChanged(finalQueryModel)
            return
        }

        // ⚡ SERVER-SIDE ONLY : Réinitialiser à la page 1 (conforme PAGINATION_FRONTEND.md)
        if (dataTable?.goToPage) {
            dataTable.goToPage(1)
        }

        // Mettre à jour le filterState pour que le TableHeader puisse afficher le compteur
        // Même en mode server-side, le filterState doit être mis à jour
        if (dataTable && 'setFilterState' in dataTable && typeof dataTable.setFilterState === 'function') {
            dataTable.setFilterState(finalQueryModel.filters || {})
        }

        optimizations.debugLog('[DataTable] 📤 FILTERS - Emitting filter-changed:', {
            filters: finalQueryModel.filters,
            page: finalQueryModel.page,
            timestamp: new Date().toISOString()
        })
        emit(finalQueryModel)
    }

    /**
     * Handler pour les changements de filtres (avec debounce)
     *
     * Conformément à PAGINATION_FRONTEND.md :
     * - Réinitialise la page à 1 lors d'un changement de filtre
     * - Émet un QueryModel complet avec les nouveaux filtres
     *
     * Préserve l'état actuel (tri, recherche) et met uniquement à jour les filtres.
     *
     * ⚠️ IMPORTANT : Accepte UNIQUEMENT un QueryModel (format standard du DataTable)
     * Le wrapper dans DataTable.vue convertit les filtres bruts en QueryModel avant d'appeler ce handler.
     *
     * @param queryModel - QueryModel complet du DataTable (contient filters, page, pageSize, sort, search)
     */
    const handleFilterChanged = optimizations.createDebouncedFilter(
        handleFilterChangedInternal,
        debounceDelay
    )

    /**
     * Handler pour réinitialiser tous les filtres et la recherche
     *
     * Réinitialise tous les filtres, la recherche globale et la page à 1.
     * Préserve uniquement le tri et la taille de page.
     */
    const handleClearAllFilters = () => {
        dataTable?.clearAllFilters()

        const currentPageSize = dataTable?.effectivePageSize || 10
        const queryModel = createQueryModelFromDataTableParams({
            page: 1,
            pageSize: currentPageSize,
            sort: currentSortModel.value?.map((sortItem: { colId: string; sort: 'asc' | 'desc' }) => ({
                colId: sortItem.colId,
                sort: sortItem.sort
            })),
            filters: {},
            search: undefined,
            customParams: props.customDataTableParams || {}
        })

        emit(queryModel)
    }

    return {
        handleFilterChanged,
        handleClearAllFilters
    }
}

