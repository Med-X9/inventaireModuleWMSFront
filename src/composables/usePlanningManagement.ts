import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { Store, PlanningAction, ViewModeType } from '@/interfaces/planningManagement';
import { planningManagementService } from '@/services/planningManagementService';
import IconUser from '../components/icon/icon-user.vue';
import IconCalendar from '../components/icon/icon-calendar.vue';

export function usePlanningManagement() {
  const router = useRouter();
  const viewMode = ref<ViewModeType>('table');
  const selectedStore = ref<Store | null>(null);
  const stores = ref<Store[]>([]);
  const loading = ref(false);

  const columns = [
    { 
      headerName: 'Nom du magasin', 
      field: 'store_name', 
      sortable: true, 
      filter: 'agTextColumnFilter' 
    }
  ];

  const actions: PlanningAction[] = [
    {
      label: 'Affecter',
      icon: IconUser,
      
      handler: async (store: Store) => {
        await planningManagementService.assignTeams(store.id);
      },
      
    },
    {
      label: 'Planifier',
      icon: IconCalendar,
      
      handler: (store: Store) => {
        router.push({ 
          name: 'inventory-planning', 
          params: { storeId: store.id.toString() } 
        });
      },
    },
  ];

  const fetchStores = async () => {
    try {
      loading.value = true;
      stores.value = await planningManagementService.getStores();
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      loading.value = false;
    }
  };

  const selectStore = (store: Store) => {
    selectedStore.value = store;
  };

  const toggleViewMode = () => {
    viewMode.value = viewMode.value === 'table' ? 'grid' : 'table';
  };

  return {
    viewMode,
    selectedStore,
    stores,
    loading,
    columns,
    actions,
    fetchStores,
    selectStore,
    toggleViewMode
  };
}