<template>
  <div class="container mx-auto md:px-10 px-2 mt-6">
    <DataTable
      :columns="columns"
      :rowDataProp="rowData"
      :actions="actions"
      actionsHeaderName="Opérations"
      :pagination="true"
      :enableFiltering="true"
      :enableRowSelection="true"
    >
      <template #table-actions>
        <div class="flex gap-2 mb-2">
          <button
            class="px-3 py-1 text-blue-600 border border-blue-600 hover:bg-blue-600 hover:text-white rounded text-sm"
            @click="handleSchedule"
          >
            Planifier
          </button>
          <button
      class="px-3 py-1 text-green-600 border border-green-600 hover:bg-green-600 hover:text-white rounded text-sm"
      @click="redirectToAdd"
    >
      Ajouter
    </button>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import DataTable from '@/components/DataTable/DataTable.vue';
import { ColDef } from 'ag-grid-community';
import IconEdit from '@/components/icon/icon-edit.vue';
import IconTrashLines from '@/components/icon/icon-trash-lines.vue';
import IconEye from '@/components/icon/icon-eye.vue';

export default defineComponent({
  name: 'InventoryManagement',
  components: { DataTable },
  setup() {
    const router = useRouter();

    const handleCancel = async () => {
      const result = await Swal.fire({
        title: `Confirmation de l'annulation`,
        text: `Voulez-vous vraiment annuler cet inventaire ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Oui, annuler',
        cancelButtonText: 'Non, revenir',
        customClass: { popup: 'sweet-alerts' },
      });

      if (result.isConfirmed) {
        Swal.fire({
          title: 'Inventaire annulé',
          text: `L'inventaire a été annulé avec succès.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
        console.log('Inventaire annulé');
      } else {
        console.log(`Annulation annulée par l'utilisateur`);
      }
    };

    const handleSchedule = () => {
      router.push({ name: 'gestion-des-plannings' });
    };
    const redirectToAdd = () => {
    router.push({ name: 'inventory-creation' })
   }

    const handleEdit = (row: Record<string, any>) => {
      router.push({ name: 'inventory-edit', params: { id: row.id } });
    };

    const columns: ColDef[] = [
      { headerName: 'Référence', field: 'reference', sortable: true, filter: 'agTextColumnFilter' },
      { headerName: "Date d'inventaire", field: 'inventory_date', sortable: true, filter: 'agDateColumnFilter' },
      { headerName: 'Statut', field: 'statut', sortable: true, filter: 'agTextColumnFilter' },
      { headerName: 'Date statut en attente', field: 'pending_status_date', sortable: true, filter: 'agDateColumnFilter' },
      { headerName: 'Date statut actuel', field: 'current_status_date', sortable: true, filter: 'agDateColumnFilter' },
      { headerName: 'Date lancement statut', field: 'date_status_launch', sortable: true, filter: 'agDateColumnFilter' },
      { headerName: 'Date fin statut', field: 'date_status_end', sortable: true, filter: 'agDateColumnFilter' },
      { headerName: 'Libellé', field: 'label', sortable: true, filter: 'agTextColumnFilter' },
    ];

    const rowData = ref<Record<string, unknown>[]>([
      {
        id: 1,
        reference: 'INV-001',
        inventory_date: '2025-04-18',
        statut: 'En attente',
        pending_status_date: '2025-04-18',
        current_status_date: '2025-04-19',
        date_status_launch: '2025-04-20',
        date_status_end: '2025-04-21',
        label: 'Inventaire Général Avril',
      },
      {
        id: 2,
        reference: 'INV-002',
        inventory_date: '2025-04-17',
        statut: 'Validé',
        pending_status_date: '2025-04-17',
        current_status_date: '2025-04-18',
        date_status_launch: '2025-04-19',
        date_status_end: '2025-04-20',
        label: 'Inventaire Rayon A',
      },
      {
        id: 3,
        reference: 'INV-003',
        inventory_date: '2025-04-16',
        statut: 'En cours',
        pending_status_date: '2025-04-16',
        current_status_date: '2025-04-17',
        date_status_launch: '2025-04-18',
        date_status_end: '2025-04-19',
        label: 'Contrôle Qualité Stocks',
      },
      {
        id: 4,
        reference: 'INV-004',
        inventory_date: '2025-04-15',
        statut: 'Clôturé',
        pending_status_date: '2025-04-15',
        current_status_date: '2025-04-16',
        date_status_launch: '2025-04-17',
        date_status_end: '2025-04-18',
        label: 'Inventaire Produits Frais',
      },
      {
        id: 5,
        reference: 'INV-005',
        inventory_date: '2025-04-14',
        statut: 'Planifié',
        pending_status_date: '2025-04-14',
        current_status_date: '2025-04-15',
        date_status_launch: '2025-04-16',
        date_status_end: '2025-04-17',
        label: 'Inventaire Dépôt Principal',
      },
      {
        id: 6,
        reference: 'INV-006',
        inventory_date: '2025-04-13',
        statut: 'Annulé',
        pending_status_date: '2025-04-13',
        current_status_date: '2025-04-14',
        date_status_launch: '2025-04-15',
        date_status_end: '2025-04-16',
        label: 'Vérification des Retours',
      },
    ]);

    const actions = [
  {
    label: 'detail',
    icon: IconEye,
    class: 'flex items-center gap-1 px-2 py-1 text-blue-500 text-xs',
    handler: (row: Record<string, unknown>) => {
      console.log('Voir la ligne', row);
    },
  },
  {
    label: 'edit',
    icon: IconEdit,
    class: 'flex items-center gap-1 px-2 py-1 text-yellow-500 text-xs',
    handler: (row: Record<string, unknown>) => handleEdit(row),
  },
  {
    label: 'delete',
    icon: IconTrashLines,
    class: 'flex items-center gap-1 px-2 py-1 text-red-500 text-xs',
    handler: async (row: Record<string, unknown>) => {
      const result = await Swal.fire({
        title: 'Confirmation de suppression',
        text: `Voulez-vous vraiment supprimer cet inventaire ?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Oui, supprimer',
        cancelButtonText: 'Non, revenir',
        customClass: { popup: 'sweet-alerts' },
      });

      if (result.isConfirmed) {
        Swal.fire({
          title: 'Inventaire supprimé',
          text: `L'inventaire a été supprimé avec succès.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
        console.log('Inventaire supprimé', row);
      } else {
        console.log(`Suppression annulée par l'utilisateur`);
      }
    },
  },
];

    return {
      columns,
      rowData,
      actions,
      handleCancel,
      redirectToAdd,
      handleSchedule,
    };
  },
});
</script>
