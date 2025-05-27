<template>
    <div class="datatable panel py-7">
      <DataTable
        :columns="columns"
        :rowDataProp="inventories"
        :actions="actions"
        :pagination="true"
        :enableFiltering="true"
        storageKey="inventory_management_table"
      >
        <template #table-actions>
          <div>
            <button
              class="text-white btn btn-primary mb-4 "
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
  import { defineComponent, onMounted } from 'vue';
  import DataTable from '@/components/DataTable/DataTable.vue';
  import { useInventoryManagement } from '@/composables/useInventoryManagement';
  
  export default defineComponent({
    name: 'InventoryManagement',
    components: { DataTable },
    
    setup() {
      const {
        inventories,
        columns,
        actions,
        redirectToAdd,
        fetchInventories
      } = useInventoryManagement();
  
      onMounted(fetchInventories);
  
      return {
        inventories,
        columns,
        actions,
        redirectToAdd
      };
    }
  });
  </script>