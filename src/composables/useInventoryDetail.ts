import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { InventoryManagement } from '@/interfaces/inventoryManagement';
import type { ViewModeType } from '@/interfaces/planningManagement';
import type { DetailData } from '@/interfaces/Detail';
import { inventoryDetailService } from '@/services/inventoryDetailService';
import { useAppStore } from '@/stores';
import { generatePDF } from '@/utils/pdfGenerator';
import type { DataTableColumn } from '@/interfaces/dataTable';

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
    { id: 'comptage1', label: 'Premier comptage' },
    { id: 'comptage2', label: 'Deuxième comptage' },
    { id: 'comptage3', label: 'Troisième comptage' },
  ];

  const jobColumns: DataTableColumn[] = [
    {
      headerName: 'Job',
      field: 'name',
      sortable: true,
      filter: 'agTextColumnFilter',
      flex: 2,
      detailConfig: {
        key: 'locations',
        displayField: 'name',
        countSuffix: 'emplacements',
        columns: [
          {
            field: 'name',
            formatter: (value, item) => {
              // Les emplacements sont des strings directement
              if (typeof item === 'string') {
                const [emplacement] = item.split(' | ');
                return emplacement;
              }
              return String(item || '');
            }
          },
          {
            field: 'zone',
            formatter: (value, item) => {
              if (typeof item === 'string') {
                const [, zone] = item.split(' | ');
                return zone || '';
              }
              return '';
            }
          },
          {
            field: 'sousZone',
            formatter: (value, item) => {
              if (typeof item === 'string') {
                const [, , sousZone] = item.split(' | ');
                return sousZone || '';
              }
              return '';
            }
          }
        ]
      }
    },
    {
      headerName: 'Zone',
      field: 'zone',
      sortable: true,
      filter: 'agTextColumnFilter',
      flex: 1
    },
    {
      headerName: 'Sous-zone',
      field: 'sousZone',
      sortable: true,
      filter: 'agTextColumnFilter',
      flex: 1
    },
    {
      headerName: 'Statut',
      field: 'status',
      sortable: true,
      cellRenderer: (params: any) => {
        if (!params.data || params.data.isChild) return '';
        const statusClass = getStatusClass(params.data.status);
        return `<span class="px-3 py-1 rounded-full text-sm ${statusClass}">${params.data.status}</span>`;
      }
    },
    { 
      headerName: 'Date', 
      field: 'date', 
      sortable: true,
      valueFormatter: (params: any) => {
        if (!params.data) return '';
        if (params.data.isChild) return '';
        return params.value || '';
      }
    },
    {
      headerName: 'Opérateur',
      field: 'operator',
      sortable: true,
      cellRenderer: (params: any) => {
        if (!params.data) return '';
        if (params.data.isChild) return '';
        return params.data.status.toLowerCase() === 'terminé' ? params.data.operator : '';
      }
    }
  ];

  // Formatage des données pour GridView - Équipes
  const teamsGridData = computed(() => {
    return detailData.value.inventory.teams?.map(team => ({
      id: team.id,
      name: team.name,
      initial: team.name.charAt(0),
      type: 'Équipe'
    })) || [];
  });

  // Formatage des données pour GridView - Magasins
  const magasinsGridData = computed(() => {
    return detailData.value.magasins.map((magasin, index) => ({
      id: index + 1,
      name: magasin,
      type: 'Magasin',
      status: 'Actif'
    }));
  });

  // Actions pour les équipes
  const teamActions = [
    {
      label: 'Voir détails',
      handler: (item: any) => {
        console.log('Voir détails équipe:', item);
      },
      variant: 'primary' as const
    }
  ];

  // Actions pour les magasins
  const magasinActions = [
    {
      label: 'Configurer',
      handler: (item: any) => {
        console.log('Configurer magasin:', item);
      },
      variant: 'primary' as const
    }
  ];

  const getStatusClass = (status: string | undefined): string => {
    if (!status) return 'bg-secondary';

    switch (status.toLowerCase()) {
      case 'en attente': return 'bg-warning-light text-warning';
      case 'en cours': return 'bg-info-light text-info';
      case 'terminé': return 'bg-success-light text-success';
      case 'en préparation': return 'bg-warning-light text-warning';
      case 'en réalisation': return 'bg-info-light text-info';
      case 'clôturé': return 'bg-secondary-light text-secondary';
      default: return 'bg-secondary-light text-secondary';
    }
  };

  // Fonction pour transformer les données des jobs en s'assurant que les locations sont correctement structurées
  const getJobsForTab = (tabId: string) => {
    const rawJobs = detailData.value.jobsData[tabId] || [];
    
    // Transformer les jobs pour s'assurer que la structure des locations est correcte
    return rawJobs.map(job => {
      // Créer une copie du job avec les locations correctement formatées
      const processedJob = {
        ...job,
        // S'assurer que l'ID est défini pour l'expansion
        id: job.id || job.name || Math.random().toString(36).substr(2, 9),
        // S'assurer que les locations sont un array
        locations: Array.isArray(job.locations) ? job.locations : []
      };

      console.log('Processing job:', processedJob.name, 'locations:', processedJob.locations);
      
      return processedJob;
    });
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
      detailData.value.inventory.statut = 'En réalisation';
    }
  };

  const editInventory = () => {
    router.push({ name: 'inventory-edit', params: { id: inventoryId } });
  };

  const cancelInventory = async () => {
    const success = await inventoryDetailService.cancelInventory();
    if (success) {
      detailData.value.inventory.statut = 'En préparation';
    }
  };

  const terminateInventory = async () => {
    const success = await inventoryDetailService.terminateInventory(detailData.value.inventory);
    if (success) {
      detailData.value.inventory.statut = 'Terminé';
    }
  };

  const closeInventory = async () => {
    const success = await inventoryDetailService.closeInventory(detailData.value.inventory);
    if (success) {
      detailData.value.inventory.statut = 'Clôturé';
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const loadDetailData = async () => {
    try {
      const data = await inventoryDetailService.getInventoryDetail(inventoryId);
      detailData.value = data;
      
      // Debug: Log the structure of jobsData to understand the data format
      console.log('Loaded jobsData:', detailData.value.jobsData);
      
      // Process each tab's jobs to ensure proper structure
      Object.keys(detailData.value.jobsData).forEach(tabId => {
        const jobs = detailData.value.jobsData[tabId];
        console.log(`Jobs for tab ${tabId}:`, jobs);
      });
    } catch (error) {
      console.error('Error loading inventory details:', error);
    }
  };

  const exportToPDF = async () => {
    const data = {
      inventory: detailData.value.inventory,
      magasins: detailData.value.magasins,
      jobsData: detailData.value.jobsData,
      stats: tabs.reduce((acc, tab) => {
        if (tab.id !== 'general') {
          acc[tab.id] = {
            completed: getCompletedJobsCount(tab.id),
            inProgress: getInProgressJobsCount(tab.id),
            remaining: getRemainingJobsCount(tab.id),
            total: getTotalJobsCount(tab.id)
          };
        }
        return acc;
      }, {} as Record<string, any>)
    };

    await generatePDF(data, `Inventaire_${detailData.value.inventory.reference}`);
  };

  return {
    currentTab,
    viewMode,
    inventory: computed(() => detailData.value.inventory),
    magasins: computed(() => detailData.value.magasins),
    teamsGridData,
    magasinsGridData,
    teamActions,
    magasinActions,
    tabs,
    jobColumns,
    launchInventory,
    editInventory,
    cancelInventory,
    terminateInventory,
    closeInventory,
    formatDate,
    getStatusClass,
    getJobsForTab,
    loadDetailData,
    getCompletedJobsCount,
    getInProgressJobsCount,
    getRemainingJobsCount,
    getTotalJobsCount,
    exportToPDF,
  };
}