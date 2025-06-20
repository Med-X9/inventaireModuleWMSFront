import { ref } from 'vue';
import { useRouter } from 'vue-router';
import type { InventoryManagement, InventoryAction } from '../interfaces/inventoryManagement';
import type { DataTableColumn } from '@/interfaces/dataTable';
import { inventoryManagementService } from '../services/inventoryManagementService';
import { alertService } from '@/services/alertService';
import IconEdit from '@/components/icon/icon-edit.vue';
import IconTrashLines from '@/components/icon/icon-trash-lines.vue';
import IconEye from '@/components/icon/icon-eye.vue';
import IconCalendar from '@/components/icon/icon-calendar.vue';
import IconSquareCheck from '@/components/icon/icon-square-check.vue';

export function useInventoryManagement() {
  const router = useRouter();
  const inventories = ref<InventoryManagement[]>([]);
  const loading = ref(false);

const columns: DataTableColumn[] = [
  { 
    headerName: 'Référence', 
    field: 'reference', 
    sortable: true, 
    filter: 'agTextColumnFilter',
    description: 'Référence unique de l\'inventaire utilisée pour l\'identification'
  },
  { 
    headerName: "Date d'inventaire", 
    field: 'inventory_date', 
    sortable: true, 
    filter: 'agDateColumnFilter',
    description: 'Date prévue ou effectuée pour la réalisation de l\'inventaire'
  },
  { 
    headerName: 'Statut', 
    field: 'statut', 
    sortable: true, 
    filter: 'agTextColumnFilter',
    description: 'État actuel de l\'inventaire (planifié, en cours, terminé, etc.)',
    cellRenderer: (params) => {
      const val = (params.value || '').toString();
      const s   = val.toLowerCase();
      let cls   = '';
      switch (s) {
        case 'en attente':
          cls = 'bg-warning-light text-warning';
          break;
        case 'en cours':
          cls = 'bg-info-light text-info';
          break;
        case 'terminé':
          cls = 'bg-success-light text-success';
          break;
        case 'planifié':
          cls = 'bg-secondary-light text-secondary';
          break;
        case 'en préparation':
          cls = 'bg-warning-light text-warning';
          break;
        default:
          cls = 'bg-secondary-light text-secondary';
      }
      return `<span class="${cls} px-3 py-1 rounded-full">${val}</span>`;
    }
  },
  { 
    headerName: 'Date lancement statut', 
    field: 'date_status_launch', 
    sortable: true, 
    filter: 'agDateColumnFilter',
    description: 'Date à laquelle le statut actuel a été activé',
  },
  { 
    headerName: 'Date fin statut', 
    field: 'date_status_end', 
    sortable: true, 
    filter: 'agDateColumnFilter',
    description: 'Date prévue de fin pour le statut actuel'
  },
  { 
    headerName: 'Libellé', 
    field: 'label', 
    sortable: true, 
    filter: 'agTextColumnFilter',
    description: 'Description ou nom descriptif de l\'inventaire pour faciliter son identification'
  },
];


  const fetchInventories = async () => {
    try {
      loading.value = true;
      inventories.value = await inventoryManagementService.getInventories();
    } catch (error) {
      await alertService.error({
        text: "Erreur lors du chargement des inventaires"
      });
    } finally {
      loading.value = false;
    }
  };

  const handleDelete = async (inventory: InventoryManagement) => {
    try {
      const result = await alertService.confirm({
        title: 'Confirmation de suppression',
        text: `Voulez-vous vraiment supprimer cet inventaire ?`
      });

      if (result.isConfirmed) {
        await inventoryManagementService.deleteInventory(inventory.id);
        await alertService.success({
          text: "L'inventaire a été supprimé avec succès"
        });
        await fetchInventories();
      }
    } catch (error) {
      await alertService.error({
        text: "Erreur lors de la suppression de l'inventaire"
      });
    }
  };

  const actions: InventoryAction[] = [
    {
      label: 'Détail',
      icon: IconEye,
      class: 'flex items-center gap-1 px-2 py-1 text-secondary text-md',
      handler: (inventory: InventoryManagement) => {
        router.push({ name: 'inventory-detail', params: { id: inventory.id } });
      },
    },
    {
      label: 'Préparer',
      icon: IconCalendar,
      class: 'flex items-center gap-1 px-2 py-1 text-secondary text-md',
      handler: (inventory: InventoryManagement) => {
        router.push({ name: 'planning-management', params: { id: inventory.id } });
      },
    },
    {
      label: 'Modifier',
      icon: IconEdit,
      class: 'flex items-center gap-1 px-2 py-1 text-secondary text-md',
      handler: (inventory: InventoryManagement) => {
        router.push({ name: 'inventory-edit', params: { id: inventory.id } });
      },
    },
    {
      label: 'Résultats',
      icon: IconSquareCheck,
      class: 'flex items-center gap-1 px-2 py-1 text-secondary text-md',
      handler: inv => {
        router.push({ name: 'inventory-results', params: { id: inv.id } })
      },
    },
    {
      label: 'Supprimer',
      icon: IconTrashLines,
      class: 'flex items-center gap-1 px-2 py-1 text-secondary text-md',
      handler: handleDelete,
    },
  ];

  const redirectToAdd = () => {
    router.push({ name: 'inventory-create' });
  };

  return {
    inventories,
    loading,
    columns,
    actions,
    redirectToAdd,
    fetchInventories,
  };
}