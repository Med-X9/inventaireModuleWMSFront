/**
 * Composable générique pour la gestion de n'importe quel DataTable avec Pinia
 * Récupère directement les filtres du DataTable et les transmet au store
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue';
import { logger } from '@/services/loggerService';

export interface GenericDataTableConfig<T = any> {
    // Store Pinia à utiliser
    store: any;

    // Action du store pour récupérer les données
    fetchAction: string;

    // Valeurs par défaut
    defaultPageSize?: number;

    // Paramètres additionnels pour certaines actions (ex: inventoryId, warehouseId)
    // Peut être un objet statique, une ref, ou une computed
    additionalParams?: Record<string, any> | Ref<Record<string, any>> | ComputedRef<Record<string, any>>;
}

export interface DataTableFilters {
    [key: string]: { value: any; operator?: string };
}

export interface DataTableSort {
    colId: string;
    sort: 'asc' | 'desc';
}

export interface DataTableParams {
    page: number;
    pageSize: number;
    globalSearch?: string;
    filters?: DataTableFilters;
    sort?: DataTableSort[];
}

export interface DataTableResult<T = any> {
    data: T[];
    recordsTotal: number;
    recordsFiltered: number;
}

export interface PaginationInfo {
    total_pages: number;
    total: number;
    has_next: boolean;
    has_previous: boolean;
}

/**
 * Composable générique pour gérer un DataTable avec Pinia
 * @param config - Configuration du composable
 */
export function useGenericDataTable<T = any>(config: GenericDataTableConfig<T>) {
    const { store, fetchAction, defaultPageSize = 20, additionalParams } = config;

    // État réactif
    const data = ref<T[]>([]);
    const loading = ref(false);
    const currentPage = ref(1);
    const pageSize = ref(defaultPageSize);
    const searchQuery = ref('');
    const sortModel = ref<DataTableSort[]>([]);
    const filters = ref<DataTableFilters>({});

    // Pagination
    const pagination = ref<PaginationInfo>({
        total_pages: 0,
        total: 0,
        has_next: false,
        has_previous: false
    });

    /**
     * Charger les données depuis le store
     */
    const loadData = async () => {
        loading.value = true;
        try {
            // Vérifier que l'action existe dans le store
            if (typeof store[fetchAction] !== 'function') {
                throw new Error(`Action ${fetchAction} introuvable dans le store`);
            }

            // Préparer les paramètres
            const params: DataTableParams = {
                page: currentPage.value,
                pageSize: pageSize.value,
                globalSearch: searchQuery.value,
                filters: filters.value,
                sort: sortModel.value.length > 0 ? sortModel.value : undefined
            };

            // Appeler l'action du store avec les paramètres additionnels si nécessaire
            let result: DataTableResult<T>;

            // Récupérer les paramètres additionnels (déréférencer si c'est une ref ou computed)
            let resolvedAdditionalParams: Record<string, any> | undefined;
            if (additionalParams) {
                // Si c'est une ref ou computed, on doit appeler .value
                if (typeof additionalParams === 'object' && 'value' in additionalParams) {
                    resolvedAdditionalParams = additionalParams.value;
                } else {
                    resolvedAdditionalParams = additionalParams;
                }
            }

            if (resolvedAdditionalParams && Object.keys(resolvedAdditionalParams).length > 0) {
                // Si l'action nécessite des paramètres additionnels (ex: fetchJobsValidated(inventoryId, warehouseId, params))
                const args: any[] = Object.values(resolvedAdditionalParams);
                args.push(params);
                result = await store[fetchAction](...args);
            } else {
                // Action simple sans paramètres additionnels
                result = await store[fetchAction](params);
            }

            if (result) {
                data.value = result.data || [];
                pagination.value = {
                    total_pages: Math.ceil((result.recordsFiltered || 0) / pageSize.value),
                    total: result.recordsFiltered || 0,
                    has_next: currentPage.value < Math.ceil((result.recordsFiltered || 0) / pageSize.value),
                    has_previous: currentPage.value > 1
                };
            }
        } catch (error) {
            logger.error('Erreur lors du chargement des données', error);
            throw error;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Transformer les filtres du DataTable vers le format attendu
     */
    const transformFilters = (filterModel: Record<string, any>): DataTableFilters => {
        const transformedFilters: DataTableFilters = {};

        Object.keys(filterModel).forEach(key => {
            const filter = filterModel[key];

            // Gestion de différents formats de filtres
            if (filter) {
                // Format 1: { filter: string }
                if (filter.filter !== undefined && filter.filter !== null && filter.filter !== '') {
                    transformedFilters[key] = {
                        value: filter.filter,
                        operator: 'contains'
                    };
                }
                // Format 2: { value: string }
                else if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
                    transformedFilters[key] = {
                        value: filter.value,
                        operator: 'contains'
                    };
                }
                // Format 3: String direct
                else if (typeof filter === 'string' && filter !== '') {
                    transformedFilters[key] = {
                        value: filter,
                        operator: 'contains'
                    };
                }
            }
        });

        return transformedFilters;
    };

    /**
     * Handler pour les changements de filtres
     */
    const handleFilterChanged = async (filterModel: Record<string, { filter: string }>) => {
        // Transformer les filtres
        const transformedFilters = transformFilters(filterModel);

        // Mettre à jour les filtres et recharger
        filters.value = transformedFilters;
        currentPage.value = 1; // Retour à la première page
        await loadData();
    };

    /**
     * Handler pour les changements de tri
     */
    const handleSortChanged = async (newSortModel: Array<{ field: string; direction: 'asc' | 'desc' }>) => {
        // Convertir le format field/direction vers colId/sort
        sortModel.value = newSortModel.map(sort => ({
            colId: sort.field,
            sort: sort.direction
        }));

        currentPage.value = 1; // Retour à la première page
        await loadData();
    };

    /**
     * Handler pour les changements de recherche globale
     */
    const handleSearchChanged = async (searchValue: string) => {
        searchQuery.value = searchValue;
        currentPage.value = 1; // Retour à la première page
        await loadData();
    };

    /**
     * Handler pour les changements de pagination
     */
    const handlePaginationChanged = async (params: { page: number; pageSize: number }) => {
        currentPage.value = params.page;
        pageSize.value = params.pageSize;
        await loadData();
    };

    /**
     * Réinitialiser tous les filtres et paramètres
     */
    const resetFilters = async () => {
        filters.value = {};
        searchQuery.value = '';
        sortModel.value = [];
        currentPage.value = 1;
        await loadData();
    };

    /**
     * Rafraîchir les données
     */
    const refresh = async () => {
        await loadData();
    };

    return {
        // État
        data: computed(() => data.value),
        loading: computed(() => loading.value),
        currentPage: computed(() => currentPage.value),
        pageSize: computed(() => pageSize.value),
        searchQuery: computed(() => searchQuery.value),
        sortModel: computed(() => sortModel.value),
        pagination: computed(() => pagination.value),

        // Actions
        handleFilterChanged,
        handleSortChanged,
        handleSearchChanged,
        handlePaginationChanged,
        resetFilters,
        refresh,
        loadData
    };
}

/**
 * Composable spécialisé pour les inventaires
 * Utilise le composable générique avec la configuration des inventaires
 */
import { useInventoryStore } from '@/stores/inventory';
import type { InventoryTable } from '@/models/Inventory';

export function useInventoryDataTable() {
    const inventoryStore = useInventoryStore();

    return useGenericDataTable<InventoryTable>({
        store: inventoryStore,
        fetchAction: 'fetchInventories',
        defaultPageSize: 20
    });
}
