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
import type { QueryModel } from '@SMATCH-Digital-dev/vue-system-design';
import { convertQueryModelToQueryParams } from '@SMATCH-Digital-dev/vue-system-design';

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
    // Métadonnées de pagination depuis la dernière réponse
    const paginationMetadata = ref<{
        page?: number;
        totalPages?: number;
        pageSize?: number;
        total?: number;
    } | null>(null);

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

    /**
     * Récupère la liste des inventaires avec pagination, tri et filtres
     * @param params - QueryModel contenant les paramètres de pagination, tri, filtres et recherche
     */

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
    /**
     * Récupère la liste des inventaires avec pagination, tri et filtres
     * Le store stocke uniquement les données et métadonnées brutes du backend
     * Le DataTable/useBackendDataTable gère la pagination
     */
    const fetchInventories = async (params?: QueryModel): Promise<DataTableResponse<InventoryTable>> => {
        loading.value = true;
        error.value = null;
        try {
            // Convertir QueryModel en paramètres de requête
            const requestParams = params ? convertQueryModelToQueryParams(params) : {};
            const responseData = await InventoryService.getAll(requestParams);

            // Stocker les données brutes
            inventories.value = responseData.data || [];

            // Stocker les métadonnées de pagination brutes du backend (sans calcul)
            paginationMetadata.value = {
                page: responseData.page ?? 1,
                totalPages: responseData.totalPages ?? 1,
                pageSize: responseData.pageSize ?? 20,
                total: responseData.total ?? responseData.recordsFiltered ?? responseData.recordsTotal ?? 0
            };

            // Retourner le format DataTable minimal (le DataTable gère la pagination)
            return {
                draw: responseData.draw || 1,
                data: inventories.value,
                recordsTotal: responseData.recordsTotal ?? paginationMetadata.value.total,
                recordsFiltered: responseData.recordsFiltered ?? paginationMetadata.value.total
            } as any;
        } catch (err: any) {
            handleError(err, 'Erreur lors de la récupération des inventaires');
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const fetchInventoryDetail = async (id: number | string) => {
        loading.value = true;
        error.value = null;
        try {
            // Utiliser les nouveaux endpoints modulaires
            const [
                basicResponse,
                accountResponse,
                warehousesResponse,
                countingsResponse,
                teamResponse,
                resourcesResponse
            ] = await Promise.all([
                InventoryService.getInventoryBasic(id),
                InventoryService.getInventoryAccount(id),
                InventoryService.getInventoryWarehouses(id),
                InventoryService.getInventoryCountings(id),
                InventoryService.getInventoryTeam(id),
                InventoryService.getInventoryResources(id)
            ]);

            // Assembler les données dans un objet InventoryDetail
            const basicData = basicResponse.data.data;
            const accountData = accountResponse.data.data;
            const warehousesData = warehousesResponse.data.data;
            const countingsData = countingsResponse.data.data;
            const teamData = teamResponse.data.data;
            const resourcesData = resourcesResponse.data.data;

            const assembledDetail: InventoryDetail = {
                id: typeof id === 'string' ? parseInt(id) : id,
                reference: basicData.reference,
                label: basicData.label,
                date: basicData.date,
                status: basicData.status,
                inventory_type: basicData.inventory_type,
                en_preparation_status_date: basicData.en_preparation_status_date,
                en_realisation_status_date: basicData.en_realisation_status_date,
                termine_status_date: basicData.termine_status_date,
                cloture_status_date: basicData.cloture_status_date,
                account_name: accountData.account_name || undefined,
                account_reference: accountData.account_reference || undefined,
                magasins: warehousesData.magasins || [],
                comptages: countingsData.comptages || [],
                equipe: teamData.equipe.map(membre => ({
                    reference: membre.reference,
                    user: membre.user,
                    nombre_comptage: membre.nombre_comptage
                })) || [],
                ressources: resourcesData.ressources.map(ressource => ({
                    reference: ressource.reference,
                    ressource_reference: ressource.ressource_reference ?? null,
                    ressource_nom: ressource.ressource_nom ?? null,
                    quantity: ressource.quantity
                })) || []
            };

            currentInventoryDetail.value = assembledDetail;
            return assembledDetail;
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


    const launchInventoryByWarehause = async (idInventory: number, idWarehouse: number) => {
        loading.value = true;
        error.value = null;
        try {
            await InventoryService.launchByWarehause(idInventory, idWarehouse);
            await fetchInventories();
        } catch (err: any) {
            handleError(err, 'Erreur lors du lancement de l\'inventaire');
        } finally {
            loading.value = false;
        }
    };

    /**
     * Actions sur les inventaires (annuler, terminer, clôturer)
     * Ces fonctions suivent le même pattern : appel API puis rafraîchissement
     */
    const cancelInventory = async (id: number | string) => {
        loading.value = true;
        error.value = null;
        try {
            await InventoryService.cancel(id);
            await fetchInventories();
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
            await fetchInventories();
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
            await fetchInventories();
        } catch (err: any) {
            handleError(err, 'Erreur lors de la clôture de l\'inventaire');
        } finally {
            loading.value = false;
        }
    };

    const fetchPlanningManagement = async (id: number, params?: QueryModel): Promise<DataTableResponse<any>> => {
        loading.value = true;
        error.value = null;
        try {
            // Convertir QueryModel en paramètres de requête
            const requestParams = params ? convertQueryModelToQueryParams(params) : {};
            logger.debug('fetchPlanningManagement appelé', { id, params, requestParams });

            const response: AxiosResponse<PlanningManagementResponse> = await InventoryService.getPlanningManagement(id, requestParams);
            const responseData = response.data;

            logger.debug('fetchPlanningManagement réponse reçue', {
                rowsCount: responseData.rows?.length || 0,
                total: responseData.total
            });

            // Stocker les données brutes
            planningManagementData.value = responseData.rows || [];

            // Stocker les métadonnées de pagination basées sur la réponse actuelle
            paginationMetadata.value = {
                page: responseData.page ?? params?.page ?? 1,
                totalPages: responseData.totalPages ?? 1,
                pageSize: responseData.pageSize ?? params?.pageSize ?? 20,
                total: responseData.total ?? 0
            };

            // Mettre à jour le total des éléments pour la pagination
            totalItems.value = responseData.total || 0;

            // Retourner le format DataTable complet
            return {
                draw: responseData.page ?? params?.page ?? 1,
                data: planningManagementData.value,
                recordsTotal: responseData.total ?? 0,
                recordsFiltered: responseData.total ?? 0
            } as any;
        } catch (err: any) {
            logger.error('Erreur dans fetchPlanningManagement', err);
            handleError(err, 'Erreur lors de la récupération des statistiques de planning');
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
            handleError(err, 'Erreur lors de l\'import du stock');
        } finally {
            loading.value = false;
        }
    };

    /**
     * Importe la planification (location-jobs) depuis un fichier Excel (asynchrone)
     * @param id - ID de l'inventaire
     * @param formData - Données du formulaire contenant le fichier Excel
     * @returns Promise avec la réponse d'import (contient import_task_id pour suivre le statut)
     */
    const importLocationJobsSync = async (id: string | number, formData: FormData) => {
        loading.value = true;
        error.value = null;
        try {
            const response = await InventoryService.importLocationJobsSync(id, formData);
            return response.data;
        } catch (err: any) {
            handleError(err, 'Erreur lors de l\'import de la planification');
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Récupère le statut d'un import de planification en cours (par importTaskId)
     * @param importTaskId - ID de la tâche d'import
     * @returns Promise avec le statut de l'import
     */
    const getImportLocationJobsStatus = async (importTaskId: number) => {
        try {
            const response = await InventoryService.getImportLocationJobsStatus(importTaskId);
            return response.data;
        } catch (err: any) {
            handleError(err, 'Erreur lors de la récupération du statut de l\'import');
            throw err;
        }
    };

    /**
     * Récupère le statut d'un import de planification par inventoryId
     * @param inventoryId - ID de l'inventaire
     * @returns Promise avec le statut de l'import
     */
    const getImportLocationJobsStatusByInventory = async (inventoryId: number) => {
        try {
            const response = await InventoryService.getImportLocationJobsStatusByInventory(inventoryId);
            return response.data;
        } catch (err: any) {
            handleError(err, 'Erreur lors de la récupération du statut de l\'import');
            throw err;
        }
    };
    const clearError = () => {
        error.value = null;
    };

    const clearCurrentInventory = () => {
        currentInventory.value = null;
    };

    /**
     * Exporter les inventaires en CSV ou Excel
     * @param params - Paramètres au format FORMAT_ACTUEL.md avec export: 'csv' ou 'excel'
     * @returns Promise avec la réponse contenant le blob du fichier
     */
    const exportInventories = async (params: Record<string, any>): Promise<AxiosResponse<Blob>> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await InventoryService.exportAll(params);
            return response;
        } catch (err: any) {
            handleError(err, 'Erreur lors de l\'export des inventaires');
            throw err;
        } finally {
            loading.value = false;
        }
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
        paginationMetadata,

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
        launchInventoryByWarehause,
        cancelInventory,
        terminateInventory,
        closeInventory,
        fetchPlanningManagement,
        importStockImage,
        importLocationJobsSync,
        getImportLocationJobsStatus,
        getImportLocationJobsStatusByInventory,
        exportInventories,
        clearError,
        clearCurrentInventory,
        fetchInventoryByReference,
    };
});
