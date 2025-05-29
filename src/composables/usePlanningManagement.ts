// src/composables/usePlanningManagement.ts
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';              // ← Ajout
import type { Store, PlanningAction, ViewModeType } from '@/interfaces/planningManagement';
import { planningManagementService } from '@/services/planningManagementService';
import { useAppStore } from '@/stores';
import IconUser from '@/components/icon/icon-user.vue';
import IconCalendar from '@/components/icon/icon-calendar.vue';

export function usePlanningManagement() {
  const appStore = useAppStore();
  const router = useRouter();                         // ← Création de l’instance du router

  // viewMode dans Pinia (persisté en localStorage)
  const viewMode = computed<ViewModeType>({
    get: () => appStore.viewMode,
    set: (mode: ViewModeType) => appStore.setViewMode(mode),
  });

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
      handler: (store: Store) => {
        // ← Navigation vers ta page d’affectation
        router.push({
          name: 'inventory-affecter',
          query: { storeId: store.id.toString() }
        });
      },
    },
    {
      label: 'Planifier',
      icon: IconCalendar,
      handler: (store: Store) => {
        // ← Navigation vers ta page d’affectation
        router.push({
          name: 'inventory-planning',
          query: { storeId: store.id.toString() }
        });
      },
    },
        {
      label: 'Lancer',
      icon: IconCalendar,
      handler: (store: Store) => {
        router.push({ name: 'jobs-launch', query: { storeId: store.id.toString() } });
      },
    },
  ];

  async function fetchStores() {
    loading.value = true;
    try {
      stores.value = await planningManagementService.getStores();
    } finally {
      loading.value = false;
    }
  }

  onMounted(fetchStores);

  function selectStore(store: Store) {
    selectedStore.value = store;
  }

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
