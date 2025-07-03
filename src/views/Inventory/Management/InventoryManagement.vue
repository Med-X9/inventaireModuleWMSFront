<template>
    <div class="datatable panel py-7">

        <DataTable :columns="columns" :rowDataProp="inventories" :actions="actions as any" :pagination="true"
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
import { defineComponent, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import DataTable from '@/components/DataTable/DataTable.vue';
import { useInventoryManagement } from '@/composables/useInventoryManagement';
import IconPlus from '@/components/icon/icon-plus.vue';
import type { ColDef } from 'ag-grid-community';
import type { InventoryAction } from '@/interfaces/inventoryManagement';

export default defineComponent({
    name: 'InventoryManagement',
    components: { DataTable, IconPlus },

    setup() {
        const router = useRouter();
        const {
            inventories,
            loading,
            columns,
            actions,
            redirectToAdd,
            fetchInventories
        } = useInventoryManagement();

        // Debug: Afficher les données dans la console
        console.log('🔍 Debug InventoryManagement - État initial:', {
            inventories: inventories.value,
            loading: loading.value
        });

        // Watcher pour surveiller les changements de données
        watch(inventories, (newInventories) => {
            console.log('📊 Inventaires mis à jour dans le composant:', newInventories);
            console.log('📈 Nombre d\'inventaires:', newInventories?.length || 0);
        }, { immediate: true });

        // Charger les données au montage
        onMounted(async () => {
            console.log('🚀 Composant monté - Chargement des données...');
            try {
                await fetchInventories();
                console.log('✅ Données chargées avec succès');
                console.log('📊 Données finales pour DataTable:', inventories.value);
            } catch (err) {
                console.error('❌ Erreur lors du chargement:', err);
            }
        });

        return {
            inventories,
            loading,
            columns,
            actions: actions as InventoryAction[],
            redirectToAdd
        };
    }
});
</script>
