import { Ref, ref, computed } from 'vue';
import type { InventoryOption, StoreOption, InventoryResult, ResultAction } from '../interfaces/inventoryResults';
import { inventoryResultsService } from '../services/inventoryResultsService';
import { alertService } from '@/services/alertService';
import IconEdit from '@/components/icon/icon-edit.vue';
import IconLancer from '@/components/icon/icon-launch.vue';
import IconValider from '@/components/icon/icon-check.vue';

export function useInventoryResults(
  filterForm: Ref<{ inventory: string | null; store: string | null }>
) {
  const loading = ref(false);
  const inventories = ref<InventoryOption[]>([]);
  const stores = ref<StoreOption[]>([]);
  const results = ref<InventoryResult[]>([]);

  const columns = [
    { headerName: 'Article', field: 'article', sortable: true, filter: 'agTextColumnFilter' },
    { headerName: 'Emplacement', field: 'emplacement', sortable: true, filter: 'agTextColumnFilter' },
    { headerName: 'Premier Contage', field: 'premier_contage', sortable: true, filter: 'agNumberColumnFilter' },
    { headerName: 'Deuxième Contage', field: 'deuxieme_contage', sortable: true, filter: 'agNumberColumnFilter' },
    { headerName: 'Écart', field: 'ecart', sortable: true, filter: 'agNumberColumnFilter' },
    { headerName: 'Troisième Contage', field: 'troisieme_contage', sortable: true, filter: 'agNumberColumnFilter' },
    { headerName: 'Résultats', field: 'resultats', sortable: true, filter: 'agTextColumnFilter' },
  ];

  // Filtrage basé sur filterForm passé en paramètre
  const filteredResults = computed(() => {
    return results.value.filter(item => {
      const matchesInventory =
        !filterForm.value.inventory || item.inventory === filterForm.value.inventory;
      const matchesStore =
        !filterForm.value.store || item.store === filterForm.value.store;
      return matchesInventory && matchesStore;
    });
  });

  const fetchData = async () => {
    try {
      loading.value = true;
      const [inventoryOptions, storeOptions, resultData] = await Promise.all([
        inventoryResultsService.getInventoryOptions(),
        inventoryResultsService.getStoreOptions(),
        inventoryResultsService.getResults()
      ]);
      
      inventories.value = inventoryOptions;
      stores.value = storeOptions;
      results.value = resultData;
    } catch (error) {
      await alertService.error({
        text: "Erreur lors du chargement des données"
      });
    } finally {
      loading.value = false;
    }
  };

  const handleEdit = async (result: InventoryResult) => {
    try {
      await inventoryResultsService.editResult(result.id);
      await alertService.success({ text: "Modification effectuée avec succès" });
    } catch (error) {
      await alertService.error({ text: "Erreur lors de la modification" });
    }
  };

  const handleLaunch = async (result: InventoryResult) => {
    try {
      await inventoryResultsService.launchResult(result.id);
      await alertService.success({ text: "Lancement effectué avec succès" });
    } catch (error) {
      await alertService.error({ text: "Erreur lors du lancement" });
    }
  };

  const handleValidate = async (result: InventoryResult) => {
    try {
      const confirmation = await alertService.confirm({
        title: "Confirmation de validation",
        text: "Voulez-vous vraiment valider ce résultat ?"
      });

      if (confirmation.isConfirmed) {
        await inventoryResultsService.validateResult(result.id);
        await alertService.success({ text: "Validation effectuée avec succès" });
      }
    } catch (error) {
      await alertService.error({ text: "Erreur lors de la validation" });
    }
  };

  const actions: ResultAction[] = [
    {
      label: 'Éditer',
      icon: IconEdit,
      class: 'flex items-center gap-1 px-2 py-1 text-secondary text-xs',
      handler: handleEdit
    },
    {
      label: 'Lancer',
      icon: IconLancer,
      class: 'flex items-center gap-1 px-2 py-1 text-secondary text-xs',
      handler: handleLaunch
    },
    {
      label: 'Valider',
      icon: IconValider,
      class: 'flex items-center gap-1 px-2 py-1 text-secondary text-xs',
      handler: handleValidate
    }
  ];

  return {
    loading,
    inventories,
    stores,
    columns,
    actions,
    filteredResults,
    fetchData
  };
}
