import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { InventoryResultsService } from '@/services/inventoryResultsService';
import { EcartComptageService, type BulkResolveEcartsResponse } from '@/services/EcartComptageService';
import type { InventoryResult, StoreOption } from '@/interfaces/inventoryResults';
import type { AxiosResponse } from 'axios';
import { logger } from '@/services/loggerService';
import type { QueryModel } from '@SMATCH-Digital-dev/vue-system-design';
import { convertQueryModelToQueryParams } from '@SMATCH-Digital-dev/vue-system-design';

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
            const urlSearchParams = params ? convertQueryModelToQueryParams(params) : new URLSearchParams();
            const requestParams = Object.fromEntries(urlSearchParams.entries());

            // ⚡ IMPORTANT : Ne pas inclure inventory_id et store_id dans requestParams
            // car ils sont déjà dans l'URL de l'endpoint
            // Les retirer de requestParams s'ils y sont (via customParams)
            const { inventory_id, store_id, ...cleanParams } = requestParams;

            // Créer le body de la requête
            // ⚡ NOTE : inventory_id et store_id sont dans l'URL, pas besoin de les mettre dans params
            const requestBody = cleanParams;

            const response = await InventoryResultsService.getResults(inventoryId, storeId, requestBody);

            // DEBUG données : réponse API → store
            const rows = (response.rows as InventoryResult[]) || [];
            const rowsLength = Array.isArray(rows) ? rows.length : 0;
            console.log('[DEBUG resultsStore.fetchResults]', {
                inventoryId,
                storeId,
                rowsLength,
                pagination: { page: response.page, pageSize: response.pageSize, total: response.total, totalPages: response.totalPages },
                firstRowKeys: rowsLength > 0 && typeof rows[0] === 'object' ? Object.keys(rows[0]).slice(0, 10) : []
            });

            // Stocker les données brutes (rows selon FORMAT_ACTUEL.md)
            results.value = rows;
            currentInventoryId.value = inventoryId;

            // Stocker les métadonnées de pagination brutes du backend (selon FORMAT_ACTUEL.md)
            paginationMetadata.value = {
                page: response.page,
                totalPages: response.totalPages,
                pageSize: response.pageSize,
                total: response.total
            };

            // Retourner la réponse complète
            return response;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Erreur lors de la récupération des résultats';
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
     * Résoudre tous les écarts de comptage d'un inventaire en masse
     */
    const bulkResolveEcarts = async (inventoryId: number): Promise<AxiosResponse<BulkResolveEcartsResponse>> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await EcartComptageService.bulkResolveEcarts(inventoryId);

            // Ne pas forcer resolved: true - laisser l'API décider du statut réel
            // Le rechargement des données mettra à jour les statuts correctement
            return response;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Erreur lors de la résolution en masse des écarts';
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
        bulkResolveEcarts,
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

