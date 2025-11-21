import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { InventoryService } from '@/services/InventoryService';
import type { InventoryTable, CreateInventoryRequest, InventoryDetails, ResponseInventoryDetails } from '@/models/Inventory';
import type { InventoryDetail, InventoryDetailResponse } from '@/models/InventoryDetail';
import type { AxiosResponse } from 'axios';
import API from '@/api';
import { PlanningManagementResponse } from '@/models/PlanningManagement';
import { logger } from '@/services/loggerService';
import {
    buildDataTableParams,
    processDataTableResponse,
    type DataTableParams,
    type DataTableResponse
} from '@/utils/dataTableUtils';

export const useInventoryStore = defineStore('inventory', () => {
    // State
    const inventories = ref<InventoryTable[]>([]);
    const currentInventory = ref<InventoryTable | null>(null);
    const currentInventoryDetails = ref<InventoryDetails | null>(null);
    const currentInventoryDetail = ref<InventoryDetail | null>(null);
    const planningManagementData = ref<any[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // États pour la pagination
    const totalItems = ref(0);
    const totalPages = ref(1);
    const currentPage = ref(1);
    const pageSize = ref(20);

    // États pour le tri et le filtrage
    const currentSortModel = ref<Array<{ colId: string; sort: 'asc' | 'desc' }>>([]);
    const currentFilterModel = ref<Record<string, any>>({}); // Changé pour accepter les filtres transformés
    const currentGlobalSearch = ref<string>('');

    // Getters
    const getCurrentInventory = computed(() => currentInventory.value);
    const getCurrentInventoryDetail = computed(() => currentInventoryDetail.value);
    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    // Actions
    const fetchInventories = async (params?: DataTableParams): Promise<DataTableResponse<InventoryTable>> => {
        loading.value = true;
        error.value = null;
        try {
            // Construire les paramètres DataTable au format Django
            const queryParams = buildDataTableParams({
                page: params?.page || currentPage.value,
                pageSize: params?.pageSize || pageSize.value,
                globalSearch: params?.globalSearch,
                sort: params?.sort,
                filter: params?.filter
            });

            // Construire l'URL avec les paramètres DataTable
            const baseUrl = API.endpoints.inventory?.base;
            const url = `${baseUrl}?${queryParams.toString()}`;

            // Appeler l'API avec les paramètres DataTable
            const responseData = await InventoryService.getAllByUrl(url);

            const inventoryData = responseData.data || [];
            inventories.value = inventoryData;
            totalItems.value = responseData.recordsFiltered || inventoryData.length;

            // Retourner le format attendu par useGenericDataTable
            return {
                draw: responseData.draw || 1,
                data: inventoryData,
                recordsTotal: responseData.recordsTotal || 0,
                recordsFiltered: responseData.recordsFiltered || inventoryData.length
            };
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
    const updateFilterModel = (filterModel: Record<string, any>) => { // Changé pour accepter les filtres transformés
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


    const fetchInventoryByReference = async (reference: string) => {
        loading.value = true;
        error.value = null;
        try {
            const response: AxiosResponse<ResponseInventoryDetails> = await InventoryService.getByReference(reference);
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


    const launchInventory = async (id: number | string) => {
        loading.value = true;
        error.value = null;
        try {
            const response = await InventoryService.launch(id);

            // Vérifier si c'est une réponse de succès avec des infos
            if (response.data && response.data.message) {
                // Si il y a des infos, les afficher
                if (response.data.infos && response.data.infos.length > 0) {
                }
            }

            fetchInventories();
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Erreur lors du lancement de l\'inventaire';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const cancelInventory = async (id: number | string) => {
        loading.value = true;
        error.value = null;
        try {
            await InventoryService.cancel(id);
            fetchInventories();
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Erreur lors de l\'annulation de l\'inventaire';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const terminateInventory = async (id: number | string) => {
        loading.value = true;
        error.value = null;
        try {
            await InventoryService.terminate(id);
            fetchInventories();
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Erreur lors de la terminaison de l\'inventaire';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const closeInventory = async (id: number | string) => {
        loading.value = true;
        error.value = null;
        try {
            await InventoryService.close(id);
            fetchInventories();
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Erreur lors de la clôture de l\'inventaire';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const fetchPlanningManagement = async (id: number, params?: any) => {
        loading.value = true;
        error.value = null;
        try {
            logger.debug('fetchPlanningManagement appelé', { id, params });
            const response: AxiosResponse<PlanningManagementResponse> = await InventoryService.getPlanningManagement(id, params);
            const responseData = response.data;

            logger.debug('fetchPlanningManagement réponse reçue', {
                dataCount: responseData.data?.length || 0,
                warehousesCount: responseData.warehouses_count
            });

            // Stocker les données dans le store
            planningManagementData.value = responseData.data || [];

            // Adapter le format de réponse pour le DataTable
            // PlanningManagementResponse a: { status, message, inventory_id, warehouses_count, data: WarehouseStats[] }
            // On doit retourner: { data: T[], recordsTotal: number, recordsFiltered: number }
            return {
                data: responseData.data || [],
                recordsTotal: responseData.warehouses_count || 0,
                recordsFiltered: responseData.warehouses_count || 0
            };
        } catch (err: any) {
            logger.error('Erreur dans fetchPlanningManagement', err);
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
        planningManagementData,
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
        launchInventory,
        cancelInventory,
        terminateInventory,
        closeInventory,
        fetchPlanningManagement,
        importStockImage,
        clearError,
        clearCurrentInventory,
        fetchInventoryByReference,
    };
});
