import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { InventoryResultsService } from '@/services/inventoryResultsService';
import type { InventoryResult, StoreOption } from '@/interfaces/inventoryResults';
import type { AxiosResponse } from 'axios';
import { logger } from '@/services/loggerService';
import type { QueryModel } from '@/components/DataTable/types/QueryModel';
import { convertQueryModelToQueryParams } from '@/components/DataTable/utils/queryModelConverter';

export const useResultsStore = defineStore('results', () => {
    // State
    const results = ref<InventoryResult[]>([]);
    const stores = ref<StoreOption[]>([]);
    const selectedStore = ref<string | null>(null);
    const selectedResults = ref<InventoryResult[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const currentInventoryId = ref<number | null>(null);
    const totalCount = ref(0);
    // Métadonnées de pagination depuis la dernière réponse
    const paginationMetadata = ref<{
        page?: number;
        totalPages?: number;
        pageSize?: number;
        total?: number;
    } | null>(null);

    // Getters
    const getResults = computed(() => results.value);
    const getStores = computed(() => stores.value);
    const getSelectedStore = computed(() => selectedStore.value);
    const getSelectedResults = computed(() => selectedResults.value);
    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);
    const getCurrentInventoryId = computed(() => currentInventoryId.value);

    // Actions

    /**
     * Action wrapper pour la gestion automatique du DataTable
     * Accepte un QueryModel avec customParams (inventory_id, store_id)
     * et appelle fetchResults automatiquement
     * 
     * @param queryModel - QueryModel contenant les paramètres DataTable et customParams
     * @returns Réponse avec les résultats et la pagination
     */
    const fetchResultsAuto = async (queryModel: QueryModel) => {
        // Extraire inventory_id et store_id des customParams
        const customParams = (queryModel as any)?.customParams || {}
        const inventoryId = customParams.inventory_id || currentInventoryId.value
        const storeId = customParams.store_id || selectedStore.value

        if (!inventoryId || !storeId) {
            throw new Error('inventory_id et store_id sont requis dans customParams')
        }

        // Appeler fetchResults avec les paramètres extraits
        return await fetchResults(inventoryId, storeId, queryModel)
    }

    /**
     * Récupère les résultats pour un inventaire et un magasin
     * Le store stocke uniquement les données et métadonnées brutes du backend
     * Le DataTable/useBackendDataTable gère la pagination
     */
    const fetchResults = async (
        inventoryId: number,
        storeId: string | number,
        params?: QueryModel
    ) => {
        loading.value = true;
        error.value = null;
        try {
            // Convertir QueryModel en paramètres de requête
            const requestParams = params ? convertQueryModelToQueryParams(params) : {};
            const response = await InventoryResultsService.getResults(inventoryId, storeId, requestParams);

            // Stocker les données brutes
            results.value = response.data || [];
            currentInventoryId.value = inventoryId;

            // Stocker les métadonnées de pagination brutes du backend (sans calcul)
            paginationMetadata.value = {
                page: response.page ?? 1,
                totalPages: response.totalPages ?? 1,
                pageSize: response.pageSize ?? 20,
                total: response.total ?? response.recordsFiltered ?? response.recordsTotal ?? 0
            };

            // Retourner la réponse complète
            return response;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Erreur lors de la récupération des résultats';
            logger.error('Store: Erreur lors de la récupération des résultats', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Modifier la valeur d'un résultat
     */
    const updateValue = async (id: number | string, data: Partial<InventoryResult>): Promise<AxiosResponse<any>> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await InventoryResultsService.updateValue(id, data);
            // Mettre à jour le résultat local
            const index = results.value.findIndex(r => r.id === id);
            if (index !== -1) {
                Object.assign(results.value[index], data);
            }
            return response;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Erreur lors de la modification du résultat';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Valider un ou plusieurs résultats
     */
    const validateResults = async (ids: number): Promise<AxiosResponse<any>> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await InventoryResultsService.validateResults(ids);
            // Retirer les résultats validés de la liste
            results.value = results.value.filter(r => r.id !== ids);
            selectedResults.value = [];
            return response;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Erreur lors de la validation des résultats';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Récupérer les magasins disponibles pour un inventaire
     */
    const fetchStores = async (inventoryId: number) => {
        loading.value = true;
        error.value = null;
        try {
            const data = await InventoryResultsService.getStoreOptions(inventoryId);
            stores.value = data;
            return data;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Erreur lors de la récupération des magasins';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Sélectionner un magasin
     */
    const setSelectedStore = (storeId: string | null) => {
        selectedStore.value = storeId;
    };

    /**
     * Ajouter un résultat à la sélection
     */
    const addSelectedResult = (result: InventoryResult) => {
        if (!selectedResults.value.find(r => r.id === result.id)) {
            selectedResults.value.push(result);
        }
    };

    /**
     * Retirer un résultat de la sélection
     */
    const removeSelectedResult = (resultId: number) => {
        selectedResults.value = selectedResults.value.filter(r => r.id !== resultId);
    };

    /**
     * Sélectionner plusieurs résultats
     */
    const setSelectedResults = (results: InventoryResult[]) => {
        selectedResults.value = results;
    };

    /**
     * Vider la sélection
     */
    const clearSelectedResults = () => {
        selectedResults.value = [];
    };

    /**
     * Vider l'erreur
     */
    const clearError = () => {
        error.value = null;
    };

    /**
     * Réinitialiser l'état
     */
    const resetState = () => {
        results.value = [];
        stores.value = [];
        selectedStore.value = null;
        selectedResults.value = [];
        loading.value = false;
        error.value = null;
        currentInventoryId.value = null;
    };

    return {
        // State
        results,
        stores,
        selectedStore,
        selectedResults,
        loading,
        error,
        currentInventoryId,
        totalCount,
        paginationMetadata,

        // Getters
        getResults,
        getStores,
        getSelectedStore,
        getSelectedResults,
        isLoading,
        getError,
        getCurrentInventoryId,

        // Actions
        fetchResults,
        fetchResultsAuto,
        updateValue,
        validateResults,
        fetchStores,
        setSelectedStore,
        addSelectedResult,
        removeSelectedResult,
        setSelectedResults,
        clearSelectedResults,
        clearError,
        resetState
    };
});

