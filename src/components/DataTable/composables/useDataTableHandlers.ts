/**
 * Factory de handlers génériques pour DataTable
 * Crée des handlers réutilisables pour pagination, tri, filtres, etc.
 */

import { Ref } from 'vue';
import { buildDataTableParams, transformDataTableFilters } from './useDataTableHelpers';

export interface DataTableHandlersConfig {
    store: any; // Store Pinia
    moduleName: string;
    actionName: string;
    totalItems: Ref<number>;
    totalPages: Ref<number>;
    backendPagination: Ref<any>;
    backendSearchQuery: Ref<string>;
    backendSortModel: Ref<Array<{ field: string; direction: 'asc' | 'desc' }>>;
    backendFilters: Ref<Record<string, any>>;
    backendSetPage: (page: number) => void;
    backendSetPageSize: (size: number) => void;
    backendSetSortModel: (sortModel: Array<{ field: string; direction: 'asc' | 'desc' }>) => void;
    backendSetFilters: (filters: Record<string, any>) => void;
    backendRefresh?: () => Promise<void>;
    additionalUrlParams?: string; // Pour des params supplémentaires comme /inventaire/${id}/
}

/**
 * Crée des handlers génériques pour un DataTable
 */
export function useDataTableHandlers(config: DataTableHandlersConfig) {
    const {
        store,
        moduleName,
        actionName,
        totalItems,
        totalPages,
        backendPagination,
        backendSearchQuery,
        backendSortModel,
        backendFilters,
        backendSetPage,
        backendSetPageSize,
        backendSetSortModel,
        backendSetFilters,
        backendRefresh,
        additionalUrlParams
    } = config;

    /**
     * Handler pour le changement de page
     * Construit l'URL directement avec les bons paramètres pour éviter les problèmes de timing
     */
    const onDtPageChanged = async (params: { page: number; pageSize: number }) => {
        // Mettre à jour les paramètres
        backendSetPage(params.page);
        backendSetPageSize(params.pageSize);

        // Construire l'URL directement avec les NOUVEAUX paramètres
        const urlParams = buildDataTableParams({
            page: params.page,
            pageSize: params.pageSize,
            search: backendSearchQuery.value,
            sortModel: backendSortModel.value,
            filters: backendFilters.value
        });

        const baseUrl = additionalUrlParams || '';
        const url = `${baseUrl}?${urlParams.toString()}`;

        // Charger les données directement (Pinia n'utilise pas dispatch)
        const result = await store[actionName](url);

        if (result) {
            const filteredCount = result.recordsFiltered || result.totalRows || result.recordsTotal || 0;
            totalItems.value = filteredCount;
            totalPages.value = Math.ceil(filteredCount / params.pageSize);
        }
    };

    /**
     * Handler pour le changement de tri
     */
    const onDtSortChanged = async (sortModel: Array<{ field: string; direction: 'asc' | 'desc' }>) => {
        backendSetSortModel(sortModel);

        if (backendRefresh) {
            await backendRefresh();
        }
    };

    /**
     * Handler pour le changement de filtres
     */
    const onDtFilterChanged = async (newFilters: Record<string, any>) => {
        // Transformer les filtres vers le format backend
        const transformedFilters = transformDataTableFilters(newFilters);

        backendSetFilters(transformedFilters);

        if (backendRefresh) {
            await backendRefresh();
        }
    };

    /**
     * Handler pour le changement de recherche
     */
    const onDtSearchChanged = async (searchTerm: string) => {

        if (backendRefresh) {
            await backendRefresh();
        }
    };

    return {
        onDtPageChanged,
        onDtSortChanged,
        onDtFilterChanged,
        onDtSearchChanged
    };
}

