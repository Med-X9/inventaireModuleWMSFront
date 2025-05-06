import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { InventoryManagement } from '@/interfaces/inventoryManagement';
import type { ViewModeType } from '@/interfaces/planningManagement';
import { inventoryDetailService } from '@/services/inventoryDetailService';
import { useAppStore } from '@/stores';

export function useInventoryDetail(initialInventory: InventoryManagement) {
  const router = useRouter();
  const appStore = useAppStore();

  // Onglet courant persistant
  const currentTab = computed<string>({
    get: () => appStore.inventoryCurrentTab,
    set: (tab: string) => appStore.setInventoryCurrentTab(tab)
  });

  // Mode d'affichage persistant ("table" | "grid")
  const viewMode = computed<ViewModeType>({
    get: () => appStore.inventoryViewMode,
    set: (mode: ViewModeType) => appStore.setInventoryViewMode(mode)
  });

  const inventory = ref<InventoryManagement>(initialInventory);

  const tabs = [
    { id: 'general', label: 'Informations générales' },
    { id: 'contage1', label: 'Premier comptage' },
    { id: 'contage2', label: 'Deuxième comptage' },
    { id: 'contage3', label: 'Troisième comptage' },
  ];

  const jobColumns = [
    { headerName: 'Nom', field: 'name', sortable: true },
    { headerName: 'Statut', field: 'status', sortable: true }
  ];

  const jobsData = [
    { name: 'Préparation zone', status: 'Terminé' },
    { name: 'Scan emplacements', status: 'En cours' },
    { name: 'Vérification', status: 'En attente' }
  ];

  const magasins = ['Magasin Central', 'Dépôt Nord', 'Entrepôt Sud'];

  const getStatusClass = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'en attente': return 'bg-warning-light text-warning';
      case 'en cours': return 'bg-primary-light text-primary';
      case 'terminé': return 'bg-success-light text-success';
      case 'planifié': return 'bg-secondary-light text-secondary';
      case 'en préparation': return 'bg-warning-light text-warning';
      default: return 'bg-secondary-light text-secondary';
    }
  };

  const launchInventory = async () => {
    const success = await inventoryDetailService.launchInventory(inventory.value);
    if (success) {
      inventory.value.statut = 'En cours';
    }
  };

  const editInventory = () => {
    router.push({ name: 'inventory-edit', params: { id: inventory.value.id } });
  };

  const goBack = () => {
    router.push({ name: 'inventory-list' });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  return {
    currentTab,
    viewMode,
    inventory,
    tabs,
    jobColumns,
    jobsData,
    magasins,
    launchInventory,
    editInventory,
    goBack,
    formatDate,
    getStatusClass,
  };
}