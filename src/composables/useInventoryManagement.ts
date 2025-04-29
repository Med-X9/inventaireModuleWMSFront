import { ref } from 'vue';
import { useRouter } from 'vue-router';
import type { InventoryManagement, InventoryAction, InventoryColumn } from '../interfaces/inventoryManagement';
import { inventoryManagementService } from '../services/inventoryManagementService';
import { alertService } from '@/services/alertService';
import IconEdit from '@/components/icon/icon-edit.vue';
import IconTrashLines from '@/components/icon/icon-trash-lines.vue';
import IconEye from '@/components/icon/icon-eye.vue';
import IconCalendar from '@/components/icon/icon-calendar.vue';

export function useInventoryManagement() {
  const router = useRouter();
  const inventories = ref<InventoryManagement[]>([]);
  const loading = ref(false);

  const columns: InventoryColumn[] = [
    { headerName: 'Référence', field: 'reference', sortable: true, filter: 'agTextColumnFilter' },
    { headerName: "Date d'inventaire", field: 'inventory_date', sortable: true, filter: 'agDateColumnFilter' },
    { headerName: 'Statut', field: 'statut', sortable: true, filter: 'agTextColumnFilter' },
    { headerName: 'Date statut en attente', field: 'pending_status_date', sortable: true, filter: 'agDateColumnFilter' },
    { headerName: 'Date statut actuel', field: 'current_status_date', sortable: true, filter: 'agDateColumnFilter' },
    { headerName: 'Date lancement statut', field: 'date_status_launch', sortable: true, filter: 'agDateColumnFilter' },
    { headerName: 'Date fin statut', field: 'date_status_end', sortable: true, filter: 'agDateColumnFilter' },
    { headerName: 'Libellé', field: 'label', sortable: true, filter: 'agTextColumnFilter' },
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
        label: 'planifier',
        icon: IconCalendar,
        class: 'flex items-center gap-1 px-2 py-1 text-green-500 text-xs',
        handler: (inventory: InventoryManagement) => {
          router.push({ name: 'gestion-des-plannings', params: { id: inventory.id } });
        },
      },
    {
      label: 'detail',
      icon: IconEye,
      class: 'flex items-center gap-1 px-2 py-1 text-blue-500 text-xs',
      handler: (inventory: InventoryManagement) => {
        router.push({ name: 'inventory-detail', params: { id: inventory.id } });
      },
    },
    {
      label: 'edit',
      icon: IconEdit,
      class: 'flex items-center gap-1 px-2 py-1 text-yellow-500 text-xs',
      handler: (inventory: InventoryManagement) => {
        router.push({ name: 'inventory-edit', params: { id: inventory.id } });
      },
    },
    {
      label: 'delete',
      icon: IconTrashLines,
      class: 'flex items-center gap-1 px-2 py-1 text-red-500 text-xs',
      handler: handleDelete,
    },
  ];

  const redirectToAdd = () => {
    router.push({ name: 'inventory-creation' });
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