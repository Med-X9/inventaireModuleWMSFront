import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { InventoryManagement } from '@/interfaces/inventoryManagement';
import type { ViewModeType } from '@/interfaces/planningManagement';
import type { DetailData } from '@/interfaces/Detail';
import { inventoryDetailService } from '@/services/inventoryDetailService';
import { useAppStore } from '@/stores';

export function useInventoryDetail(inventoryId: number) {
  const router = useRouter();
  const appStore = useAppStore();
  const detailData = ref<DetailData>({
    inventory: {} as InventoryManagement,
    magasins: [],
    jobsData: {}
  });

  const currentTab = computed<string>({
    get: () => appStore.inventoryCurrentTab,
    set: (tab: string) => appStore.setInventoryCurrentTab(tab)
  });

  const viewMode = computed<ViewModeType>({
    get: () => appStore.inventoryViewMode,
    set: (mode: ViewModeType) => appStore.setInventoryViewMode(mode)
  });

  const tabs = [
    { id: 'general', label: 'Informations générales' },
    { id: 'contage1', label: 'Premier comptage' },
    { id: 'contage2', label: 'Deuxième comptage' },
    { id: 'contage3', label: 'Troisième comptage' },
  ];

  const jobColumns = [
    { headerName: 'Nom', field: 'name', sortable: true },
    { headerName: 'Statut', field: 'status', sortable: true },
    { headerName: 'Date', field: 'date', sortable: true },
    { 
      headerName: 'Opérateur', 
      field: 'operator', 
      sortable: true,
      cellRenderer: (params: any) => {
        return params.data.status.toLowerCase() === 'terminé' ? params.data.operator : '';
      }
    }
  ];

  const getStatusClass = (status: string | undefined): string => {
    if (!status) return 'bg-secondary-light text-secondary';
    
    switch (status.toLowerCase()) {
      case 'en attente': return 'bg-warning-light text-warning';
      case 'en cours': return 'bg-primary-light text-primary';
      case 'terminé': return 'bg-success-light text-success';
      case 'planifié': return 'bg-secondary-light text-secondary';
      case 'en préparation': return 'bg-warning-light text-warning';
      default: return 'bg-secondary-light text-secondary';
    }
  };

  const getJobsForTab = (tabId: string) => {
    return detailData.value.jobsData[tabId] || [];
  };

  const getCompletedJobsCount = (tabId: string) => {
    return getJobsForTab(tabId).filter(job => job.status.toLowerCase() === 'terminé').length;
  };

  const getInProgressJobsCount = (tabId: string) => {
    return getJobsForTab(tabId).filter(job => job.status.toLowerCase() === 'en cours').length;
  };

  const getRemainingJobsCount = (tabId: string) => {
    return getJobsForTab(tabId).filter(job => job.status.toLowerCase() === 'en attente').length;
  };

  const getTotalJobsCount = (tabId: string) => {
    return getJobsForTab(tabId).length;
  };

  const launchInventory = async () => {
    const success = await inventoryDetailService.launchInventory(detailData.value.inventory);
    if (success) {
      detailData.value.inventory.statut = 'En cours';
    }
  };

  const editInventory = () => {
    router.push({ name: 'inventory-edit', params: { id: inventoryId } });
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

  const loadDetailData = async () => {
    try {
      const data = await inventoryDetailService.getInventoryDetail(inventoryId);
      detailData.value = data;
    } catch (error) {
      console.error('Error loading inventory details:', error);
    }
  };

  return {
    currentTab,
    viewMode,
    inventory: computed(() => detailData.value.inventory),
    magasins: computed(() => detailData.value.magasins),
    tabs,
    jobColumns,
    launchInventory,
    editInventory,
    goBack,
    formatDate,
    getStatusClass,
    getJobsForTab,
    loadDetailData,
    getCompletedJobsCount,
    getInProgressJobsCount,
    getRemainingJobsCount,
    getTotalJobsCount
  };
}