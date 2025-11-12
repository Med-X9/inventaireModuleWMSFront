import { computed } from 'vue';
import { useInventoryStore } from '@/stores/inventory';
import { useAppStore } from '@/stores/app';
import { logger } from '@/services/loggerService';
import type { CreateInventoryRequest } from '@/models/Inventory';

export const useInventory = () => {
    const inventoryStore = useInventoryStore();
    const globalStore = useAppStore();

    // Getters réactifs
    const inventories = computed(() => inventoryStore.inventories);
    const currentInventory = computed(() => inventoryStore.getCurrentInventory);
    const isLoading = computed(() => inventoryStore.isLoading);
    const error = computed(() => inventoryStore.getError);

    // Actions avec gestion des notifications
    const fetchInventories = async () => {
        try {
            await inventoryStore.fetchInventories();
        } catch (error) {
            logger.error('Erreur lors du chargement des inventaires', error);
        }
    };

    const fetchInventoryById = async (id: number | string) => {
        try {
            const result = await inventoryStore.fetchInventoryById(id);
            return result;
        } catch (error) {
            logger.error('Erreur lors de la récupération de l\'inventaire', error);
            throw error;
        }
    };

    const createInventory = async (data: CreateInventoryRequest) => {
        try {
            const result = await inventoryStore.createInventory(data);
            return result;
        } catch (error) {
            logger.error('Erreur lors de la création de l\'inventaire', error);
            throw error;
        }
    };

    const updateInventory = async (id: number | string, data: any) => {
        try {
            const result = await inventoryStore.updateInventory(id, data);
            return result;
        } catch (error) {
            logger.error('Erreur lors de la mise à jour de l\'inventaire', error);
            throw error;
        }
    };

    const deleteInventory = async (id: number | string) => {
        try {
            await inventoryStore.deleteInventory(id);
        } catch (error) {
            logger.error('Erreur lors de la suppression de l\'inventaire', error);
            throw error;
        }
    };

    const clearError = () => {
        inventoryStore.clearError();
    };

    const clearCurrentInventory = () => {
        inventoryStore.clearCurrentInventory();
    };

    // Utilitaires
    const getInventoryById = (id: number) => {
        return inventories.value.find(inv => inv.id === id);
    };

    const getInventoriesByStatus = (status: string) => {
        return inventories.value.filter(inv => inv.status === status);
    };

    const getInventoriesByAccount = (accountId: number) => {
        return inventories.value.filter(inv => inv.account_id === accountId);
    };

    return {
        // State
        inventories,
        currentInventory,
        isLoading,
        error,

        // Actions
        fetchInventories,
        fetchInventoryById,
        createInventory,
        updateInventory,
        deleteInventory,
        clearError,
        clearCurrentInventory,

        // Utilitaires
        getInventoryById,
        getInventoriesByStatus,
        getInventoriesByAccount,
    };
};
