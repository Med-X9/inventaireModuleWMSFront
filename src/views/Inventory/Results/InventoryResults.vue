<template>
  <div class="panel">

    <!-- Tabs Navigation -->
    <div class="border-b border-[#e0e6ed] dark:border-[#1b2e4b]">
      <ul class="flex flex-wrap -mb-[1px]">
        <li v-for="store in stores" :key="store.value" class="mr-2">
          <button
            type="button"
            class="relative inline-block px-8 py-4 hover:text-primary transition-colors duration-300"
            :class="{
              'text-primary before:w-full': selectedStore === store.value,
              'text-gray-500 dark:text-gray-400 before:w-0': selectedStore !== store.value
            }"
            @click="handleStoreSelect(store.value)"
          >
            {{ store.label }}
            <span 
              class="absolute bottom-0 left-0 h-[2px] bg-primary transition-all duration-300"
              :class="{
                'w-full': selectedStore === store.value,
                'w-0': selectedStore !== store.value
              }"
            ></span>
          </button>
        </li>
      </ul>
    </div>

    <!-- Results Table -->
    <div v-if="selectedStore" class="py-6">
      <DataTable
        :columns="columns"
        :rowDataProp="results"
        :actions="actions"
        :pagination="true"
        :enableFiltering="true"
        storageKey="inventory_results_table"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import DataTable from '@/components/DataTable/DataTable.vue';
import { useInventoryResults } from '@/composables/useInventoryResults';
import type { InventoryManagement } from '@/interfaces/inventoryManagement';

const props = defineProps<{
  inventory: InventoryManagement | null;
}>();

const {
  stores,
  results,
  columns,
  actions,
  selectedStore,
  fetchStores,
  fetchResults
} = useInventoryResults(props.inventory?.id || 0);

const handleStoreSelect = async (storeId: string) => {
  selectedStore.value = storeId;
  await fetchResults(storeId);
};

onMounted(async () => {
  await fetchStores();
  if (stores.value.length > 0) {
    await handleStoreSelect(stores.value[0].value);
  }
});

watch(() => props.inventory, async (newInventory) => {
  if (newInventory?.id) {
    await fetchStores();
    if (stores.value.length > 0) {
      await handleStoreSelect(stores.value[0].value);
    }
  }
});
</script>