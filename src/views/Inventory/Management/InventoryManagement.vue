<template>
    <div class="datatable panel py-7">
        <DataTable :columns="columns" :rowDataProp="inventories" :actions="actions" :pagination="true"
            :rowSelection="false" :enableFiltering="true" storageKey="inventory_management_table" :showColumnSelector="true"
            :onPaginationChanged="handlePaginationChanged" @sort-changed="onSortChanged" @filter-changed="onFilterChanged">
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
import { defineComponent, onMounted, ref, watch } from 'vue';
import { useInventoryManagement } from '@/composables/useInventoryManagement';
import DataTable from '@/components/DataTable/DataTable.vue';
import IconPlus from '@/components/icon/icon-plus.vue';

export default defineComponent({
    name: 'InventoryManagement',
    components: {
        DataTable,
        IconPlus,
    },
    setup() {
        const {
            inventories,
            loading,
            columns,
            actions,
            redirectToAdd,
            fetchInventories,
            handlePaginationChanged,
            handleSortChanged,
            handleFilterChanged,
        } = useInventoryManagement();

        // Charger les données une fois le composant monté
        onMounted(async () => {
            console.log('🚀 Chargement initial des inventaires...');
            await fetchInventories();
        });

        // Surveiller les changements dans le store
        watch(inventories, (newInventories) => {
            console.log('📊 Inventaires mis à jour:', newInventories.length, 'éléments');
        }, { deep: true });

        return {
            inventories,
            columns,
            actions,
            redirectToAdd,
            onSortChanged: handleSortChanged,
            onFilterChanged: handleFilterChanged,
            handlePaginationChanged,
        };
    },
});
</script>
