import { ref, watch, onMounted, toRaw } from 'vue';
import type { Store, PlanningAction, ViewModeType } from '@/interfaces/planningManagement';
import { planningManagementService } from '@/services/planningManagementService';
import IconUser from '@/components/icon/icon-user.vue';
import IconCalendar from '@/components/icon/icon-calendar.vue';
import { indexedDBService } from '@/services/indexedDBService';

export function usePlanningManagement() {
  const viewMode = ref<ViewModeType>('table');
  const selectedStore = ref<Store | null>(null);
  const stores = ref<Store[]>([]);
  const loading = ref(false);

  const columns = [
    { headerName: 'Nom du magasin', field: 'store_name', sortable: true, filter: 'agTextColumnFilter' },
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
        planningManagementService.navigateToPlanning(store.id);
      },
    },
  ];

  const storageKey = 'planning-management';

  onMounted(async () => {
    const saved = await indexedDBService.getState(storageKey);
    if (saved?.viewMode) viewMode.value = saved.viewMode;
    await fetchStores();
  });

  watch(viewMode, async mode => {
    await indexedDBService.saveState({ viewMode: toRaw(mode) }, storageKey);
  });

  const fetchStores = async () => {
    loading.value = true;
    try {
      stores.value = await planningManagementService.getStores();
    } finally {
      loading.value = false;
    }
  };

  const selectStore = (store: Store) => {
    selectedStore.value = store;
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
  };
}