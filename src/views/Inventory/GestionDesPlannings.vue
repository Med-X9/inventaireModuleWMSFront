<template>
    <div class="container mx-auto px-6">
      <DataTable
        :columns="columns"
        :rowDataProp="rowData"
        :actions="actions"
        actionsHeaderName="Opérations"
        :pagination="true"
        :enableFiltering="true"
        :enableRowSelection="true"
      />
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref } from 'vue';
  import DataTable from '@/components/DataTable/DataTable.vue';
  import { ColDef } from 'ag-grid-community';
  import { useRouter } from 'vue-router';
  
  // Icônes personnalisées
  import IconUser from '@/components/icon/icon-user.vue';
  import IconCalendar from '@/components/icon/icon-calendar.vue';
  
  export default defineComponent({
    name: 'gestion-des-plannings',
    components: { DataTable },
    setup() {
      const router = useRouter();
  
      const columns: ColDef[] = [
        { headerName: 'ID', field: 'id', sortable: true, filter: 'agTextColumnFilter' },
        { headerName: 'Nom du magasin', field: 'store_name', sortable: true, filter: 'agTextColumnFilter' },
      ];
  
      const rowData = ref<Record<string, unknown>[]>([
        { id: 1, store_name: 'Magasin A' },
        { id: 2, store_name: 'Magasin B' },
        { id: 3, store_name: 'Magasin C' },
      ]);
  
      const actions = [
        {
          label: 'Affecter',
          icon: IconUser,
          class: 'flex items-center gap-1 px-2 py-1 text-yellow-500 text-xs',
          handler: (row: Record<string, unknown>) => {
            console.log('Affecter la ligne', row);
          },
        },
        {
          label: 'Planifier',
          icon: IconCalendar,
          class: 'flex items-center gap-1 px-2 py-1 text-blue-500 text-xs',
          handler: (row: Record<string, unknown>) => {
            const storeId = row.id as string | number;
            router.push({
              name: 'inventory-planning',
              params: { storeId },
            });
          },
        },
      ];
  
      return {
        columns,
        rowData,
        actions,
      };
    },
  });
  </script>
  
  <style scoped>
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
  .ag-theme-alpine .ag-cell-action {
    display: inline-flex;
  }
  .ag-theme-alpine .ag-cell-action a {
    text-decoration: none;
    color: inherit;
  }
  .ag-theme-alpine .ag-cell-action a:hover {
    color: #1a73e8;
  }
  </style>
  