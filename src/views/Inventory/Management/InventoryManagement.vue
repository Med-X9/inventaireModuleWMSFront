<template>
    <div class="datatable panel py-7">
        <DataTable :columns="columns" :rowDataProp="inventories" :actions="actions" :pagination="true"
            :rowSelection="false" :enableFiltering="true" storageKey="inventory_management_table" :showColumnSelector="true"
            @sort-changed="onSortChanged" @filter-changed="onFilterChanged">
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
        console.log('🔄 InventoryManagement: setup() démarré');

        const {
            inventories,
            loading,
            columns,
            actions,
            redirectToAdd,
            fetchInventories,
        } = useInventoryManagement();

        console.log('🔄 InventoryManagement: composable chargé, inventories:', inventories);

        // États pour les paramètres de tri et filtre
        const sortModel = ref<Array<{ colId: string; sort: 'asc' | 'desc' }>>([]);
        const filterModel = ref<Record<string, { filter: string }>>({});

        // Charger les données une fois le composant monté
        onMounted(async () => {
            console.log('🔄 InventoryManagement: onMounted() - début du chargement');
            await fetchInventories();
            console.log('inventories:', inventories);
        });

        // Surveiller les changements dans le store
        watch(inventories, (newInventories) => {
            console.log('🔄 Inventories mis à jour dans la vue:', newInventories);
        }, { deep: true });

        // Handler pour les changements de tri
        const onSortChanged = (model: Array<{ colId: string; sort: 'asc' | 'desc' }>) => {
            console.log('🔄 Tri changé:', model);
            console.log('📊 Modèle de tri AG Grid:', JSON.stringify(model, null, 2));
            sortModel.value = model;
            fetchInventories({
                sort: sortModel.value,
                filter: filterModel.value
            });
        };

        // Handler pour les changements de filtre
        const onFilterChanged = (model: Record<string, { filter: string }>) => {
            console.log('🔄 Filtre changé:', model);
            console.log('🔍 Modèle de filtre AG Grid:', JSON.stringify(model, null, 2));
            filterModel.value = model;
            fetchInventories({
                sort: sortModel.value,
                filter: filterModel.value
            });
        };

        return {
            inventories,
            columns,
            actions,
            redirectToAdd,
            onSortChanged,
            onFilterChanged,
        };
    },
});
</script>
