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

type UseQueryModelReturn = ReturnType<typeof useQueryModel>

/**
 * Configuration pour useDataTableFilters
 */
export interface UseDataTableFiltersConfig {
    /** Props du DataTable */
    props: DataTableProps
    /** Composable useDataTable */
    dataTable: any
    /** Composable useQueryModel */
    queryModel: UseQueryModelReturn
    /** État du tri */
    currentSortModel: Ref<Array<{ colId: string; sort: 'asc' | 'desc' }>>
    /** Composable useAutoDataTable (optionnel) */
    autoDataTable?: any
    /** Fonction d'émission pour filter-changed */
    emit: (queryModel: QueryModel) => void
}

/**
 * Composable pour gérer les filtres
 */
export function useDataTableFilters(config: UseDataTableFiltersConfig) {
    const { props, dataTable, queryModel, currentSortModel, autoDataTable, emit } = config

    // Récupérer updatePagination de manière sécurisée
    const updateQueryPagination = queryModel?.updatePagination

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
    const createFiltersQueryModel = (filters: Record<string, any>, page: number = 1): QueryModel => {
        const currentPageSize = props.serverSidePagination
            ? (props.pageSizeProp ?? dataTable?.effectivePageSize ?? 20)
            : (dataTable?.effectivePageSize || 20)

        // ⚠️ CRITIQUE : Convertir le Proxy réactif en objet simple pour éviter les problèmes de sérialisation
        const filtersPlain = filters ? JSON.parse(JSON.stringify(filters)) : {}

        return createQueryModelFromDataTableParams({
            page,
            pageSize: currentPageSize,
            sort: currentSortModel.value?.map(s => ({
                colId: s.colId,
                sort: s.sort
            })),
            filters: filtersPlain,
            search: dataTable?.globalSearchTerm || undefined,
            customParams: props.customDataTableParams || {}
        })
    }

    /**
     * Handler pour les changements de filtres
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
    const handleFilterChanged = async (queryModel: QueryModel) => {
        if (!queryModel || typeof queryModel !== 'object') {
            console.warn('[useDataTableFilters] handleFilterChanged - QueryModel invalide:', queryModel)
            return
        }

        // ⚠️ DEBUG : Vérifier le QueryModel reçu
        console.log('[useDataTableFilters] handleFilterChanged - QueryModel reçu:', queryModel)
        console.log('[useDataTableFilters] handleFilterChanged - Type de filters:', typeof queryModel.filters)
        console.log('[useDataTableFilters] handleFilterChanged - Filtres dans QueryModel:', queryModel.filters)
        console.log('[useDataTableFilters] handleFilterChanged - Clés de filters:', queryModel.filters ? Object.keys(queryModel.filters) : 'null/undefined')

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
                        console.warn('[useDataTableFilters] QueryModel détecté dans filters, extraction des filtres réels')
                        filtersPlain = filtersPlain.filters || {}
                    }
                }
            } catch (e) {
                console.error('[useDataTableFilters] Erreur lors de la conversion des filtres:', e)
                filtersPlain = {}
            }
        }

        // S'assurer que les filtres sont toujours présents dans le QueryModel (même si vides)
        const finalQueryModel: QueryModel = {
            page: queryModel.page ?? 1,
            pageSize: queryModel.pageSize ?? (props.serverSidePagination
                ? (props.pageSizeProp ?? dataTable?.effectivePageSize ?? 20)
                : (dataTable?.effectivePageSize || 20)),
            sort: queryModel.sort,
            filters: filtersPlain, // ⚠️ CRITIQUE : Utiliser l'objet plain (pas le Proxy)
            search: queryModel.search,
            customParams: {
                ...props.customDataTableParams,
                ...queryModel.customParams
            }
        }

        // ⚠️ DEBUG : Vérifier le QueryModel final avant émission
        console.log('[useDataTableFilters] handleFilterChanged - QueryModel final créé:', finalQueryModel)
        console.log('[useDataTableFilters] handleFilterChanged - Filtres dans QueryModel final (plain):', finalQueryModel.filters)
        console.log('[useDataTableFilters] handleFilterChanged - Clés de filters final:', Object.keys(finalQueryModel.filters || {}))

        if (autoDataTable && shouldUseAutoHandlers.value) {
            await autoDataTable.handleFilterChanged(finalQueryModel)
            return
        }

        // Réinitialiser à la page 1 (conforme PAGINATION_FRONTEND.md)
        if (props.serverSidePagination && dataTable?.goToPage) {
            dataTable.goToPage(1)
        }

        // Mettre à jour la pagination dans le QueryModel si la méthode est disponible
        if (updateQueryPagination && typeof updateQueryPagination === 'function') {
            updateQueryPagination(finalQueryModel.page ?? 1, finalQueryModel.pageSize ?? 20)
        }

        // Mettre à jour le filterState pour que le TableHeader puisse afficher le compteur
        // Même en mode server-side, le filterState doit être mis à jour
        if (dataTable && 'setFilterState' in dataTable && typeof dataTable.setFilterState === 'function') {
            dataTable.setFilterState(finalQueryModel.filters || {})
        }

        console.log('[DataTable] 📤 FILTERS - Emitting filter-changed:', {
            filters: finalQueryModel.filters,
            page: finalQueryModel.page,
            timestamp: new Date().toISOString()
        })
        emit(finalQueryModel)
    }

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
            sort: currentSortModel.value?.map(s => ({
                colId: s.colId,
                sort: s.sort
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

