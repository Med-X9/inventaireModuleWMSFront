import { defineStore } from 'pinia';
import { ref } from 'vue';
import { WarehouseService } from '@/services/WarehouseService';
import type { Warehouse } from '@/models/Warehouse';

export const useWarehouseStore = defineStore('warehouse', () => {
    const warehouses = ref<Warehouse[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const fetchWarehouses = async () => {
        loading.value = true;
        error.value = null;
        try {
            const response = await WarehouseService.getAll();
            warehouses.value = response.data.data || [];
            console.log('📦 Warehouses chargés:', warehouses.value);
        } catch (err: any) {
            error.value = err.message || 'Erreur lors du chargement des entrepôts';
            warehouses.value = []; // S'assurer que c'est toujours un tableau
            console.error('❌ Erreur chargement warehouses:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    return { warehouses, loading, error, fetchWarehouses };
});
