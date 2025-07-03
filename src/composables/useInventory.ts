import { computed } from 'vue';
import { useInventoryStore } from '@/stores/inventory';
import { useAppStore } from '@/stores/app';
import type { CreateInventoryRequest, Inventory } from '@/models/Inventory';

export const useInventory = () => {
    const inventoryStore = useInventoryStore();
    const globalStore = useAppStore();

    // Getters réactifs
    const inventories = computed(() => inventoryStore.getInventories);
    const currentInventory = computed(() => inventoryStore.getCurrentInventory);
    const isLoading = computed(() => inventoryStore.isLoading);
    const error = computed(() => inventoryStore.getError);

    // Actions avec gestion des notifications
    const fetchInventories = async () => {
        try {
            console.log('🔄 Chargement des inventaires...');
            await inventoryStore.fetchInventories();
            console.log('✅ Inventaires récupérés:', inventories.value);
            console.log('📊 Nombre d\'inventaires:', inventories.value?.length || 0);

            // Vérifier que les données sont un tableau avant d'utiliser forEach
            if (Array.isArray(inventories.value)) {
                // Afficher les détails de chaque inventaire
                inventories.value.forEach((inventory, index) => {
                    console.log(`📋 Inventaire ${index + 1}:`, {
                        id: inventory.id,
                        label: inventory.label,
                        date: inventory.date,
                        status: inventory.status,
                        account_name: inventory.account_name,
                        warehouse_count: inventory.warehouse?.length || 0,
                        comptages_count: inventory.comptages?.length || 0
                    });
                });
            } else {
                console.warn('⚠️ Les données ne sont pas un tableau:', inventories.value);
            }

            // Vérifier que globalStore.addNotification existe avant de l'appeler
            if (globalStore.addNotification) {
                globalStore.addNotification({
                    type: 'success',
                    title: 'Succès',
                    message: 'Inventaires récupérés avec succès'
                });
            } else {
                console.warn('⚠️ addNotification non disponible dans globalStore');
            }
        } catch (err: any) {
            console.error('❌ Erreur lors de la récupération des inventaires:', err);
            if (globalStore.addNotification) {
                globalStore.addNotification({
                    type: 'error',
                    title: 'Erreur',
                    message: err.message || 'Erreur lors de la récupération des inventaires'
                });
            }
            throw err;
        }
    };

    const fetchInventoryById = async (id: number | string) => {
        try {
            console.log(`🔍 Récupération de l'inventaire ID: ${id}`);
            const result = await inventoryStore.fetchInventoryById(id);
            console.log('✅ Inventaire récupéré:', result);
            globalStore.addNotification({
                type: 'success',
                title: 'Succès',
                message: 'Inventaire récupéré avec succès'
            });
            return result;
        } catch (err: any) {
            console.error(`❌ Erreur lors de la récupération de l'inventaire ${id}:`, err);
            globalStore.addNotification({
                type: 'error',
                title: 'Erreur',
                message: err.message || 'Erreur lors de la récupération de l\'inventaire'
            });
            throw err;
        }
    };

    const createInventory = async (data: CreateInventoryRequest) => {
        // Forcer le typage de account_id en number
        data.account_id = Number(data.account_id);
        try {
            console.log('➕ Création d\'un nouvel inventaire:', data);
            const result = await inventoryStore.createInventory(data);
            console.log('✅ Inventaire créé:', result);
            globalStore.addNotification({
                type: 'success',
                title: 'Succès',
                message: 'Inventaire créé avec succès'
            });
            return result;
        } catch (err: any) {
            console.error('❌ Erreur lors de la création de l\'inventaire:', err);
            globalStore.addNotification({
                type: 'error',
                title: 'Erreur',
                message: err.message || 'Erreur lors de la création de l\'inventaire'
            });
            throw err;
        }
    };

    const updateInventory = async (id: number | string, data: Partial<Inventory>) => {
        try {
            console.log(`✏️ Mise à jour de l'inventaire ID: ${id}`, data);
            const result = await inventoryStore.updateInventory(id, data);
            console.log('✅ Inventaire mis à jour:', result);
            globalStore.addNotification({
                type: 'success',
                title: 'Succès',
                message: 'Inventaire mis à jour avec succès'
            });
            return result;
        } catch (err: any) {
            console.error(`❌ Erreur lors de la mise à jour de l'inventaire ${id}:`, err);
            globalStore.addNotification({
                type: 'error',
                title: 'Erreur',
                message: err.message || 'Erreur lors de la mise à jour de l\'inventaire'
            });
            throw err;
        }
    };

    const deleteInventory = async (id: number | string) => {
        try {
            console.log(`🗑️ Suppression de l'inventaire ID: ${id}`);
            await inventoryStore.deleteInventory(id);
            console.log('✅ Inventaire supprimé avec succès');
            globalStore.addNotification({
                type: 'success',
                title: 'Succès',
                message: 'Inventaire supprimé avec succès'
            });
        } catch (err: any) {
            console.error(`❌ Erreur lors de la suppression de l'inventaire ${id}:`, err);
            globalStore.addNotification({
                type: 'error',
                title: 'Erreur',
                message: err.message || 'Erreur lors de la suppression de l\'inventaire'
            });
            throw err;
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
