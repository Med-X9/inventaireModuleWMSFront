import { defineStore } from 'pinia';
import { ref } from 'vue';
import { WarehouseService } from '@/services/WarehouseService';
import type { Warehouse } from '@/models/Warehouse';
import { Job } from '@/models/Job';

export const useWarehouseStore = defineStore('warehouse', () => {
    const warehouses = ref<Warehouse[]>([]);
    const warehouseJobs = ref<Job[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const fetchWarehouses = async () => {
        loading.value = true;
        error.value = null;
        try {
            const response = await WarehouseService.getAll();
            warehouses.value = response.data.data || [];
        } catch (err: unknown) {
            error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des entrepôts';
            warehouses.value = []; // S'assurer que c'est toujours un tableau
            console.error('Erreur lors du chargement des warehouses:', err);
        } finally {
            loading.value = false;
        }
    }; 

    const fetchJobsByWarehouseId = async (warehouseId: number) => {
        loading.value = true;
        error.value = null;
        try {
            const response = await WarehouseService.getAllJobsByWarehouseId(warehouseId);
            warehouseJobs.value = response.data.data || [];
        } catch (err: unknown) {
            error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des jobs';
            warehouseJobs.value = [];
            console.error('Erreur lors du chargement des jobs:', err);
        } finally {
            loading.value = false;
        }
    };

    const fetchWarehouseByReference = async (reference: string): Promise<number | null> => {
        try {
            const response = await WarehouseService.getByReference(reference);
            const warehouse = response.data.data;
            return warehouse ? warehouse.id : null;
        } catch (err: unknown) {
            console.error('Erreur lors de la récupération de l\'entrepôt par référence:', err);
            return null;
        }
    };

    return { warehouses, warehouseJobs, loading, error, fetchWarehouses, fetchJobsByWarehouseId, fetchWarehouseByReference };
});
