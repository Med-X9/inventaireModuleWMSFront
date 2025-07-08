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

    // Getters
    const getCurrentInventory = computed(() => currentInventory.value);
    const getCurrentInventoryDetail = computed(() => currentInventoryDetail.value);
    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    // Actions
    const fetchInventories = async (params?: {
        sort?: any[];
        filter?: any;
        page?: number;
        pageSize?: number;
    }) => {
        loading.value = true;
        error.value = null;
        try {
            // Construire les paramètres de requête pour Django
            const queryParams: any = {};

            if (params?.sort && params.sort.length > 0) {
                // Convertir le modèle de tri AG Grid (getColumnState) en format Django REST Framework
                const sortParams = params.sort.map(sort => {
                    const field = sort.colId;
                    const direction = sort.sort === 'asc' ? field : `-${field}`;
                    return direction;
                });
                // Django REST Framework utilise un seul paramètre ordering
                queryParams.ordering = sortParams.join(',');
            }

            if (params?.filter) {
                Object.keys(params.filter).forEach(field => {
                    const filter = params.filter[field];
                    if (filter) {
                        // Pour les filtres de type number/date
                        if (filter.type) {
                            let op: string | null = '';
                            switch (filter.type) {
                                case 'equals':
                                case 'exact':
                                    op = '';
                                    break;
                                case 'greaterThan':
                                    op = '__gt';
                                    break;
                                case 'greaterThanOrEqual':
                                    op = '__gte';
                                    break;
                                case 'lessThan':
                                    op = '__lt';
                                    break;
                                case 'lessThanOrEqual':
                                    op = '__lte';
                                    break;
                                case 'inRange':
                                    // Pour les dates
                                    if (filter.dateFrom !== undefined && filter.dateFrom !== null && filter.dateFrom !== '') {
                                        queryParams[`${field}__gte`] = filter.dateFrom;
                                    }
                                    if (filter.dateTo !== undefined && filter.dateTo !== null && filter.dateTo !== '') {
                                        queryParams[`${field}__lte`] = filter.dateTo;
                                    }
                                    // Pour les nombres
                                    if (filter.filter !== undefined && filter.filter !== null && filter.filter !== '') {
                                        queryParams[`${field}__gte`] = filter.filter;
                                    }
                                    if (filter.filterTo !== undefined && filter.filterTo !== null && filter.filterTo !== '') {
                                        queryParams[`${field}__lte`] = filter.filterTo;
                                    }
                                    op = null; // On ne traite pas la suite
                                    break;
                                default:
                                    op = '';
                            }                            // Pour les dates, AG Grid utilise dateFrom

                            const value = filter.filter ?? filter.dateFrom;
                            if (op !== null && value !== undefined && value !== null && value !== '') {
                                queryParams[`${field}${op}`] = value;
                            }
                        } else if (filter.filter) {
                            // Filtres texte classiques
                            queryParams[field] = filter.filter;
                        }
                    }
                });
            }

            if (params?.page) {
                queryParams.page = params.page;
            }

            if (params?.pageSize) {
                queryParams.page_size = params.pageSize;
            }


            // Construire l'URL pour l'affichage
            const baseUrl = API.endpoints.inventory.base;
            const queryString = new URLSearchParams(queryParams).toString();
            const fullUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;

            const response: AxiosResponse<{ count: number; results: InventoryTable[]; next: string | null; previous: string | null }> = await InventoryService.getAll(queryParams);

            // Extraire les données du champ 'results' de la réponse paginée
            const inventoryData = response.data.results || response.data;

            inventories.value = inventoryData;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Erreur lors de la récupération des inventaires';
            throw err;
        } finally {
            loading.value = false;
        }
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

        // Getters
        getCurrentInventory,
        getCurrentInventoryDetail,
        isLoading,
        getError,

        // Actions
        fetchInventories,
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
