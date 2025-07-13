import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { InventoryService } from '@/services/InventoryService';
import type { InventoryTable, CreateInventoryRequest, InventoryDetails, ResponseInventoryDetails } from '@/models/Inventory';
import type { InventoryDetail, InventoryDetailResponse } from '@/models/InventoryDetail';
import type { AxiosResponse } from 'axios';
import API from '@/api';
import { PlanningManagementResponse } from '@/models/PlanningManagement';

export const useInventoryStore = defineStore('inventory', () => {
    // State
    const inventories = ref<InventoryTable[]>([]);
    const currentInventory = ref<InventoryTable | null>(null);
    const currentInventoryDetails = ref<InventoryDetails | null>(null);
    const currentInventoryDetail = ref<InventoryDetail | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // États pour la pagination
    const totalItems = ref(0);
    const totalPages = ref(1);
    const currentPage = ref(1);
    const pageSize = ref(10);

    // États pour le tri et le filtrage
    const currentSortModel = ref<Array<{ colId: string; sort: 'asc' | 'desc' }>>([]);
    const currentFilterModel = ref<Record<string, { filter: string }>>({});
    const currentGlobalSearch = ref<string>('');

    // Getters
    const getCurrentInventory = computed(() => currentInventory.value);
    const getCurrentInventoryDetail = computed(() => currentInventoryDetail.value);
    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    // Actions
    const fetchInventories = async (params?: {
        sort?: Array<{ colId: string; sort: 'asc' | 'desc' }>;
        filter?: Record<string, { filter: string }>;
        page?: number;
        pageSize?: number;
        globalSearch?: string;
    }) => {
        loading.value = true;
        error.value = null;
        try {
            // Mettre à jour les modèles actuels si fournis
            if (params?.sort) currentSortModel.value = params.sort;
            if (params?.filter) currentFilterModel.value = params.filter;
            if (params?.globalSearch !== undefined) currentGlobalSearch.value = params.globalSearch;

            // Construire les paramètres de requête pour Django
            const queryParams: any = {};

            // Gestion du tri
            if (currentSortModel.value.length > 0) {
                const sortParams = currentSortModel.value.map(sort => {
                    const field = sort.colId;
                    const direction = sort.sort === 'asc' ? field : `-${field}`;
                    return direction;
                });
                queryParams.ordering = sortParams.join(',');
            }

            // Gestion du filtrage
            if (currentFilterModel.value && Object.keys(currentFilterModel.value).length > 0) {
                Object.keys(currentFilterModel.value).forEach(field => {
                    const filter = currentFilterModel.value[field];
                    if (filter && filter.filter) {
                        queryParams[field] = filter.filter;
                    }
                });
            }

            // Gestion de la recherche globale
            if (currentGlobalSearch.value) {
                queryParams.search = currentGlobalSearch.value;
            }

            // Toujours mettre à jour pageSize AVANT le fetch
            if (params?.pageSize) {
                pageSize.value = params.pageSize;
                queryParams.page_size = params.pageSize;
            }

            // On ne met à jour currentPage que si fourni, sinon on garde la valeur actuelle
            if (params?.page) {
                currentPage.value = params.page;
                queryParams.page = params.page;
            } else {
                queryParams.page = currentPage.value;
            }

            console.log('🔍 Paramètres de requête:', queryParams);

            const response: AxiosResponse<{ count: number; results: InventoryTable[]; next: string | null; previous: string | null }> = await InventoryService.getAll(queryParams);

            const inventoryData = response.data.results || response.data;
            inventories.value = inventoryData;

            // Mettre à jour la pagination
            if (response.data.count !== undefined) {
                totalItems.value = response.data.count;
                // Utiliser le pageSize courant (celui envoyé à l'API)
                const usedPageSize = params?.pageSize ?? pageSize.value;
                totalPages.value = Math.max(1, Math.ceil(response.data.count / usedPageSize));
                // Si la page demandée est hors limite, revenir à la dernière page existante
                if (currentPage.value > totalPages.value) {
                    currentPage.value = totalPages.value;
                }
                // Si la page demandée est < 1, revenir à la première page
                if (currentPage.value < 1) {
                    currentPage.value = 1;
                }
                // Log du calcul de pagination
                console.log('[Pagination] totalItems:', totalItems.value, '| pageSize:', usedPageSize, '| totalPages:', totalPages.value, '| currentPage:', currentPage.value);
            }
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Erreur lors de la récupération des inventaires';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    // Méthodes pour gérer le tri
    const updateSortModel = (sortModel: Array<{ colId: string; sort: 'asc' | 'desc' }>) => {
        currentSortModel.value = sortModel;
        // Recharger les données avec le nouveau tri
        return fetchInventories({
            page: 1, // Retour à la première page lors d'un nouveau tri
            pageSize: pageSize.value,
            sort: sortModel,
            filter: currentFilterModel.value,
            globalSearch: currentGlobalSearch.value
        });
    };

    // Méthodes pour gérer le filtrage
    const updateFilterModel = (filterModel: Record<string, { filter: string }>) => {
        currentFilterModel.value = filterModel;
        // Recharger les données avec le nouveau filtre
        return fetchInventories({
            page: 1, // Retour à la première page lors d'un nouveau filtre
            pageSize: pageSize.value,
            sort: currentSortModel.value,
            filter: filterModel,
            globalSearch: currentGlobalSearch.value
        });
    };

    // Méthodes pour gérer la recherche globale
    const updateGlobalSearch = (searchTerm: string) => {
        currentGlobalSearch.value = searchTerm;
        // Recharger les données avec la nouvelle recherche
        return fetchInventories({
            page: 1, // Retour à la première page lors d'une nouvelle recherche
            pageSize: pageSize.value,
            sort: currentSortModel.value,
            filter: currentFilterModel.value,
            globalSearch: searchTerm
        });
    };

    // Méthodes pour gérer la pagination
    const updatePagination = (page: number, newPageSize?: number) => {
        if (newPageSize) {
            pageSize.value = newPageSize;
        }
        currentPage.value = page;
        return fetchInventories({
            page,
            pageSize: newPageSize || pageSize.value,
            sort: currentSortModel.value,
            filter: currentFilterModel.value,
            globalSearch: currentGlobalSearch.value
        });
    };

    // Méthodes pour réinitialiser les filtres
    const clearFilters = () => {
        currentFilterModel.value = {};
        currentGlobalSearch.value = '';
        return fetchInventories({
            page: 1,
            pageSize: pageSize.value,
            sort: currentSortModel.value,
            filter: {},
            globalSearch: ''
        });
    };

    const fetchInventoryById = async (id: number | string) => {
        loading.value = true;
        error.value = null;
        try {
            const response: AxiosResponse<ResponseInventoryDetails> = await InventoryService.getById(id);
            currentInventoryDetails.value = response.data.data;
            return response.data.data;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Erreur lors de la récupération de l\'inventaire';
            throw err;
        } finally {
            loading.value = false;
        }
    };


    const fetchInventoryDetail = async (id: number | string) => {
        loading.value = true;
        error.value = null;
        try {
            const response: AxiosResponse<InventoryDetailResponse> = await InventoryService.getInventoryDetail(id);

            // La structure de réponse est { message: "...", data: {...} }
            if (response.data && response.data.data) {
                currentInventoryDetail.value = response.data.data;
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Erreur lors de la récupération des détails');
            }
        } catch (err: any) {
            error.value = err.response?.data?.message || err.message || 'Erreur lors de la récupération de l\'inventaire';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const createInventory = async (data: CreateInventoryRequest) => {
        loading.value = true;
        error.value = null;
        try {
            // Forcer le typage de account_id en number
            data.account_id = Number(data.account_id);
            const response = await InventoryService.create(data);
            return response.data;
        } catch (err: any) {
            error.value = err.message || 'Erreur lors de la création';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const updateInventory = async (id: number | string, data: Partial<InventoryTable>) => {
        loading.value = true;
        error.value = null;
        try {
            const response: AxiosResponse<InventoryTable> = await InventoryService.update(id, data);
            return response.data;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Erreur lors de la mise à jour de l\'inventaire';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const deleteInventory = async (id: number | string) => {
        loading.value = true;
        error.value = null;
        try {
            await InventoryService.delete(id);
            inventories.value = inventories.value.filter(inv => inv.id !== id);
            if (currentInventory.value?.id === id) {
                currentInventory.value = null;
            }
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Erreur lors de la suppression de l\'inventaire';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const fetchPlanningManagement = async (id: number) => {
        loading.value = true;
        error.value = null;
        try {
            const response: AxiosResponse<PlanningManagementResponse> = await InventoryService.getPlanningManagement(id);
            return response.data;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Erreur lors de la récupération des statistiques de planning';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const importStockImage = async (id: number, formData: FormData) => {
        loading.value = true;
        error.value = null;
        try {
            const response = await InventoryService.importStocks(id, formData);
            return response.data;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Erreur lors de l\'import du stock';
            throw err;
        } finally {
            loading.value = false;
        }
    };
    const clearError = () => {
        error.value = null;
    };

    const clearCurrentInventory = () => {
        currentInventory.value = null;
    };

    return {
        // State
        inventories,
        currentInventory,
        currentInventoryDetail,
        loading,
        error,
        totalItems,
        totalPages,
        currentPage,
        pageSize,

        // Getters
        getCurrentInventory,
        getCurrentInventoryDetail,
        isLoading,
        getError,

        // Actions
        fetchInventories,
        updateSortModel,
        updateFilterModel,
        updateGlobalSearch,
        updatePagination,
        clearFilters,
        fetchInventoryById,
        fetchInventoryDetail,
        createInventory,
        updateInventory,
        deleteInventory,
        fetchPlanningManagement,
        importStockImage,
        clearError,
        clearCurrentInventory,
    };
});
