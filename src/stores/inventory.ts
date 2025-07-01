import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { InventoryService } from '@/services/InventoryService';
import type { Inventory, CreateInventoryRequest } from '@/models/Inventory';
import type { AxiosResponse } from 'axios';

export const useInventoryStore = defineStore('inventory', () => {
    // State
    const inventories = ref<Inventory[]>([]);
    const currentInventory = ref<Inventory | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Getters
    const getInventories = computed(() => inventories.value);
    const getCurrentInventory = computed(() => currentInventory.value);
    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    // Actions
    const fetchInventories = async () => {
        loading.value = true;
        error.value = null;
        try {
            console.log('🌐 Appel API - Récupération des inventaires...');
            const response: AxiosResponse<{ count: number; results: Inventory[]; next: string | null; previous: string | null }> = await InventoryService.getAll();
            console.log('📡 Réponse API brute:', response);
            console.log('📦 Données reçues:', response.data);

            // Extraire les données du champ 'results' de la réponse paginée
            const inventoryData = response.data.results || response.data;
            console.log('📋 Données d\'inventaires extraites:', inventoryData);

            inventories.value = Array.isArray(inventoryData) ? inventoryData : [];
            console.log('💾 Données stockées dans le store:', inventories.value);
        } catch (err: any) {
            console.error('💥 Erreur dans le store inventory:', err);
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
            const response: AxiosResponse<Inventory> = await InventoryService.getById(id);
            currentInventory.value = response.data;
            return response.data;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Erreur lors de la récupération de l\'inventaire';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const createInventory = async (data: CreateInventoryRequest) => {
        loading.value = true;
        error.value = null;
        try {
            const response: AxiosResponse<Inventory> = await InventoryService.create(data);
            inventories.value.push(response.data);
            return response.data;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Erreur lors de la création de l\'inventaire';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const updateInventory = async (id: number | string, data: Partial<Inventory>) => {
        loading.value = true;
        error.value = null;
        try {
            const response: AxiosResponse<Inventory> = await InventoryService.update(id, data);
            const index = inventories.value.findIndex(inv => inv.id === id);
            if (index !== -1) {
                inventories.value[index] = response.data;
            }
            if (currentInventory.value?.id === id) {
                currentInventory.value = response.data;
            }
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
        loading,
        error,

        // Getters
        getInventories,
        getCurrentInventory,
        isLoading,
        getError,

        // Actions
        fetchInventories,
        fetchInventoryById,
        createInventory,
        updateInventory,
        deleteInventory,
        clearError,
        clearCurrentInventory,
    };
});
