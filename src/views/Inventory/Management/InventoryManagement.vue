<template>
    <div class="datatable panel py-7">
        <DataTable :columns="columns" :rowDataProp="inventories" :actions="actions" :pagination="true"
            :enableRowSelection="true" :enableFiltering="true" storageKey="inventory_management_table" inlineEditing>
            <template #table-actions>
                <div class="flex items-center flex-wrap gap-2">
                    <button class=" btn btn-primary p-2 px-4 mb-4 btn-sm " @click="redirectToAdd">
                        <icon-plus class="w-5 h-5 ltr:mr-2 rtl:ml-2 " />
                        Créer
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
import IconPlus from '@/components/icon/icon-plus.vue';

export default defineComponent({
    name: 'InventoryManagement',
    components: { DataTable, IconPlus },

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