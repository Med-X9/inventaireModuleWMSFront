import { ref, computed } from 'vue';
import type { StoreOption, InventoryResult, ResultAction } from '../interfaces/inventoryResults';
import { inventoryResultsService } from '../services/inventoryResultsService';
import { alertService } from '@/services/alertService';
import IconEdit from '@/components/icon/icon-edit.vue';
import IconLancer from '@/components/icon/icon-launch.vue';
import IconValider from '@/components/icon/icon-check.vue';

export function useInventoryResults(invId: number) {
  const loading = ref(false);
  const stores = ref<StoreOption[]>([]);
  const results = ref<InventoryResult[]>([]);
  const selectedStore = ref<string | null>(null);

  const columns = [
    { headerName: 'Article', field: 'article', sortable: true, filter: 'agTextColumnFilter' },
    { headerName: 'Emplacement', field: 'emplacement', sortable: true, filter: 'agTextColumnFilter' },
    { headerName: 'Premier Contage', field: 'premier_contage', sortable: true, filter: 'agNumberColumnFilter' },
    { headerName: 'Deuxième Contage', field: 'deuxieme_contage', sortable: true, filter: 'agNumberColumnFilter' },
    { headerName: 'Écart', field: 'ecart', sortable: true, filter: 'agNumberColumnFilter' },
    { headerName: 'Troisième Contage', field: 'troisieme_contage', sortable: true, filter: 'agNumberColumnFilter' },
    { headerName: 'Résultats', field: 'resultats', sortable: true, filter: 'agTextColumnFilter' },
  ];

  const fetchStores = async () => {
    try {
      loading.value = true;
      stores.value = await inventoryResultsService.getStoreOptionsForInventory(invId);
    } catch (error) {
      await alertService.error({
        text: "Erreur lors du chargement des magasins"
      });
    } finally {
      loading.value = false;
    }
  };

  const fetchResults = async (storeId: string) => {
    try {
      loading.value = true;
      results.value = await inventoryResultsService.getResultsForInventoryAndStore(invId, storeId);
    } catch (error) {
      await alertService.error({
        text: "Erreur lors du chargement des résultats"
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
    stores,
    results,
    columns,
    actions,
    selectedStore,
    fetchStores,
    fetchResults
  };
}