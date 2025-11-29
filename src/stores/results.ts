import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { InventoryResultsService } from '@/services/inventoryResultsService';
import type { InventoryResult, StoreOption } from '@/interfaces/inventoryResults';
import type { AxiosResponse } from 'axios';
import { logger } from '@/services/loggerService';
import type { StandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter';

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
     * Récupérer les résultats pour un inventaire et un magasin
     * @param inventoryId - ID de l'inventaire
     * @param storeId - ID du magasin (warehouse)
     * @param params - Paramètres DataTable optionnels (pagination, tri, filtres, recherche)
     */
    const fetchResults = async (
        inventoryId: number, 
        storeId: string | number, 
        params?: StandardDataTableParams | Record<string, any>
    ) => {
        loading.value = true;
        error.value = null;
        try {
            logger.debug('Store: Récupération des résultats', { inventoryId, storeId, params });
            const response = await InventoryResultsService.getResults(inventoryId, storeId, params);

            results.value = response.data;
            totalCount.value = response.recordsFiltered || response.data.length;
            currentInventoryId.value = inventoryId;
            logger.debug('Store: Résultats chargés', { 
                count: response.data.length, 
                totalCount: totalCount.value 
            });
            return response.data;
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
    const validateResults = async (ids: Array<number | string>): Promise<AxiosResponse<any>> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await InventoryResultsService.validateResults(ids);
            // Retirer les résultats validés de la liste
            const normalizedIds = ids.map(id => String(id));
            results.value = results.value.filter(r => !normalizedIds.includes(String(r.id)));
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

