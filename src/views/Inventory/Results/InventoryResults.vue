<!-- <template>
    <div class="panel">

        <!-- Tabs Navigation
        <div class="border-b border-[#e0e6ed] dark:border-[#1b2e4b]">
            <ul class="flex flex-wrap -mb-[1px]">
                <li v-for="store in stores" :key="store.value" class="mr-2">
                    <button type="button"
                        class="relative inline-block px-8 py-4 hover:text-primary transition-colors duration-300"
                        :class="{
                            'text-primary before:w-full': selectedStore === store.value,
                            'text-gray-500 dark:text-gray-400 before:w-0': selectedStore !== store.value
                        }" @click="handleStoreSelect(store.value)">
                        {{ store.label }}
                        <span class="absolute bottom-0 left-0 h-[2px] bg-primary transition-all duration-300" :class="{
                            'w-full': selectedStore === store.value,
                            'w-0': selectedStore !== store.value
                        }"></span>
                    </button>
                </li>
            </ul>
        </div>

        <!-- Results Table
        <div v-if="selectedStore" class="py-6">
            <DataTable :columns="columns" :rowDataProp="results" :actions="actions" :pagination="true"
                :enableFiltering="true" :rowSelection="true" :selectedRows="selectedResults"
                @selection-changed="onSelectionChanged" storageKey="inventory_results_table" inlineEditing>
                <template #table-actions>
                    <div class="flex items-center flex-wrap gap-2">
                        <button class="btn btn-primary p-2 px-4 mb-4 btn-sm" @click="handleBulkValidate">
                            <IconValider class="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            Valider
                        </button>
                    </div>
                </template>
            </DataTable>
        </div>
    </div>
</template> -->

<script setup lang="ts">
// import { onMounted, watch } from 'vue';
// import DataTable from '@/components/DataTable/DataTable.vue';
// import { useInventoryResults } from '@/composables/useInventoryResults';
// // import { findInventoryByReference } from '@/services/inventoryManagementService';
// import type { InventoryManagement } from '@/interfaces/inventoryManagement';
// import type { InventoryResult } from '@/interfaces/inventoryResults';
// import IconValider from '@/components/icon/icon-check.vue';

// // Accept the reference param from the route
// const props = defineProps<{ reference: string }>();

// // Lookup the full inventory by reference
// // const inventory: InventoryManagement | undefined = findInventoryByReference(props.reference);
// if (!inventory) {
//     throw new Error(`Inventaire \"${props.reference}\" introuvable`);
// }

// // Use the inventory's ID in the composable
// const {
//     loading,
//     stores,
//     results,
//     columns,
//     actions,
//     selectedStore,
//     selectedResults,
//     fetchStores,
//     fetchResults,
//     handleBulkValidate
// } = useInventoryResults(inventory.id);

// // When a tab (store) is clicked
// const handleStoreSelect = async (storeId: string) => {
//     selectedStore.value = storeId;
//     selectedResults.value = [];
//     await fetchResults(storeId);
// };

// // Track selection changes
// const onSelectionChanged = (selectedRows: InventoryResult[]) => {
//     selectedResults.value = selectedRows;
// };

// // Initial load: fetch stores and first store's results
// onMounted(async () => {
//     await fetchStores();
//     if (stores.value.length > 0) {
//         await handleStoreSelect(stores.value[0].value);
//     }
// });

// // React if the reference prop changes
// watch(() => props.reference, async (newRef) => {
//     const inv = findInventoryByReference(newRef);
//     if (!inv) return;
//     selectedResults.value = [];
//     await fetchStores();
//     if (stores.value.length) {
//         await handleStoreSelect(stores.value[0].value);
//     }
// });
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
