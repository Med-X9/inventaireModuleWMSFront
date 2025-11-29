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
    processDataTableResponse,
    type DataTableResponse
} from '@/utils/dataTableUtils';
import type { StandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter';
import { buildStandardParamsUrl, normalizeToStandardParams } from '@/components/DataTable/utils/dataTableParamsConverter';
import type { QueryModel } from '@/components/DataTable/types/QueryModel';

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

    // Getters
    const getCurrentInventory = computed(() => currentInventory.value);
    const getCurrentInventoryDetail = computed(() => currentInventoryDetail.value);
    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    // ===== FONCTIONS UTILITAIRES =====

    /**
     * Gère les erreurs de manière uniforme avec extraction du message d'erreur backend
     */
    const handleError = (err: unknown, defaultMessage: string): never => {
        let errorMessage = defaultMessage;

        if (err && typeof err === 'object' && 'response' in err) {
            const response = (err as any).response;
            if (response?.data) {
                const backendData = response.data;
                if (backendData.message) {
                    errorMessage = backendData.message;
                } else if (backendData.detail) {
                    errorMessage = backendData.detail;
                } else if (backendData.error) {
                    errorMessage = backendData.error;
                } else if (Array.isArray(backendData.errors)) {
                    const errorMessages = backendData.errors
                        .map((errItem: any) => {
                            if (typeof errItem === 'string') {
                                return errItem;
                            }
                            if (errItem?.message) {
                                return errItem.message;
                            }
                            if (errItem?.field && errItem?.message) {
                                return `${errItem.field}: ${errItem.message}`;
                            }
                            return null;
                        })
                        .filter((msg: string | null): msg is string => msg !== null);
                    if (errorMessages.length > 0) {
                        errorMessage = errorMessages.join(' | ');
                    }
                } else if (typeof backendData === 'string') {
                    errorMessage = backendData;
                }
            }
        } else if (err instanceof Error) {
            errorMessage = err.message;
        }

        error.value = errorMessage;
        throw err;
    };

    // ===== ACTIONS =====
    // 🚀 Accepte QueryModel ou StandardDataTableParams - conversion automatique
    const fetchInventories = async (
        params?: QueryModel | StandardDataTableParams
    ): Promise<DataTableResponse<InventoryTable>> => {
        loading.value = true;
        error.value = null;
        try {
            // Normaliser les paramètres (détecte et convertit QueryModel si nécessaire)
            // Note: Les colonnes ne sont pas disponibles ici, mais le DataTable a déjà converti
            // QueryModel -> StandardDataTableParams avant d'appeler le store
            const standardParams: StandardDataTableParams = normalizeToStandardParams(
                params,
                {
                    draw: 1,
                    defaultPage: currentPage.value,
                    defaultPageSize: pageSize.value
                }
            );

            // Construire l'URL avec les paramètres StandardDataTableParams
            // Utiliser buildStandardParamsUrl pour préserver les crochets dans les noms de paramètres
            const baseUrl = API.endpoints.inventory?.base;
            const queryString = buildStandardParamsUrl(standardParams);
            const url = `${baseUrl}?${queryString}`;

            // Appeler l'API avec les paramètres StandardDataTableParams
            const responseData = await InventoryService.getAllByUrl(url);

            const inventoryData = responseData.data || [];
            inventories.value = inventoryData;
            totalItems.value = responseData.recordsFiltered || inventoryData.length;

            // Retourner le format attendu
            return {
                draw: responseData.draw || 1,
                data: inventoryData,
                recordsTotal: responseData.recordsTotal || 0,
                recordsFiltered: responseData.recordsFiltered || inventoryData.length
            };
        } catch (err: any) {
            const errorMessage = err instanceof Error
                ? err.message
                : err?.response?.data?.message || 'Erreur lors de la récupération des inventaires';
            error.value = errorMessage;
            loading.value = false;
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
            handleError(err, 'Erreur lors de la récupération de l\'inventaire');
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
            handleError(err, 'Erreur lors de la récupération de l\'inventaire');
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
            handleError(err, 'Erreur lors de la récupération des détails de l\'inventaire');
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
            handleError(err, 'Erreur lors de la création de l\'inventaire');
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
            handleError(err, 'Erreur lors de la mise à jour de l\'inventaire');
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
            handleError(err, 'Erreur lors de la suppression de l\'inventaire');
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
            handleError(err, 'Erreur lors du lancement de l\'inventaire');
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
            handleError(err, 'Erreur lors de l\'annulation de l\'inventaire');
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
            handleError(err, 'Erreur lors de la terminaison de l\'inventaire');
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
            handleError(err, 'Erreur lors de la clôture de l\'inventaire');
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
            handleError(err, 'Erreur lors de la récupération des statistiques de planning');
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
            handleError(err, 'Erreur lors de l\'import du stock');
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
