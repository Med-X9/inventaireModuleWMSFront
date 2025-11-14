import { computed } from 'vue';
import { useWarehouseStore } from '@/stores/warehouse';

export const useWarehouse = () => {
  const store = useWarehouseStore();
  const warehouses = computed(() => store.warehouses);
  const loading = computed(() => store.loading);
  const error = computed(() => store.error);

  const fetchWarehouses = async (accountId?: number) => {
    await store.fetchWarehouses(accountId);
  };

  return { warehouses, loading, error, fetchWarehouses };
};
