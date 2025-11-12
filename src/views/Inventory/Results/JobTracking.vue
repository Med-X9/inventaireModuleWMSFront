<template>
    <div class="panel">
        <header class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
                <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
                    Suivi des jobs
                </h1>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    Visualisez l'avancement des comptages pour chaque emplacement.
                </p>
            </div>

            <div class="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div class="field-group">
                    <label class="field-label">
                        Magasin
                    </label>
                    <SelectField
                        v-model="selectedStore"
                        :options="storeOptions"
                        :clearable="false"
                        :searchable="false"
                        placeholder="Sélectionner un magasin"
                        :disabled="storeLoading || storeOptions.length === 0"
                        class="store-select w-full sm:w-64"
                    />
                </div>

                <div class="field-group">
                    <label class="field-label">
                        Comptage
                    </label>
                    <SelectField
                        v-model="selectedCountingOrder"
                        :options="countingOptions"
                        :clearable="false"
                        :searchable="false"
                        placeholder="Sélectionner un comptage"
                        :disabled="storeLoading || countingOptions.length === 0"
                        class="store-select w-full sm:w-56"
                    />
                </div>
            </div>
        </header>

        <div class="mb-4 flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400 md:flex-row md:items-center md:justify-between">
            <span>
                Référence inventaire :
                <span class="font-semibold text-gray-900 dark:text-white">{{ inventoryReference }}</span>
            </span>
            <span v-if="selectedWarehouse" class="text-xs text-gray-500 dark:text-gray-400">
                Entrepôt sélectionné :
                <span class="font-medium text-gray-900 dark:text-white">
                    {{ selectedWarehouse.warehouse_name || selectedWarehouse.reference || `Entrepôt ${selectedWarehouse.id}` }}
                </span>
            </span>
            <span v-if="!storeLoading">
                {{ rows.length }} ligne(s) affichée(s)
            </span>
        </div>

        <DataTable
            :columns="displayColumns"
            :rowDataProp="rows"
            :loading="loading"
            :actions="[]"
            :pagination="false"
            :enableGlobalSearch="false"
            :enableFiltering="false"
            :enableAdvancedEditing="false"
            :enableGrouping="false"
            :enablePivot="false"
            emptyMessage="Aucune donnée disponible pour ces critères"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import DataTable from '@/components/DataTable/DataTable.vue'
import SelectField from '@/components/Form/SelectField.vue'
import { useJobTracking } from '@/composables/useJobTracking'
import { useWarehouseStore } from '@/stores/warehouse'
import type { DataTableColumn } from '@/types/dataTable'

const route = useRoute()
const referenceParam = computed(() => route.params.reference as string)

const warehouseStore = useWarehouseStore()
const { warehouses, loading: warehousesLoading } = storeToRefs(warehouseStore)

const {
    inventoryReference,
    loading,
    storeOptions,
    selectedStore,
    countingOptions,
    selectedCountingOrder,
    rows,
    columns,
    initialize,
    reinitialize
} = useJobTracking({ inventoryReference: referenceParam.value })

const storeLoading = computed(() => loading.value || warehousesLoading.value)

const selectedWarehouse = computed(() => {
    if (!selectedStore.value) {
        return null
    }
    return warehouses.value.find(warehouse => String(warehouse.id) === String(selectedStore.value)) || null
})

const displayColumns = computed<DataTableColumn[]>(() => columns.value as DataTableColumn[])

onMounted(async () => {
    if (warehouses.value.length === 0) {
        await warehouseStore.fetchWarehouses()
    }
    await initialize(referenceParam.value)
})

watch(referenceParam, async newReference => {
    if (!newReference) {
        return
    }

    await reinitialize(newReference)
})
</script>

<style scoped>
.panel {
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark .panel {
    background: #1b2e4b;
}

.field-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.field-label {
    font-size: 0.85rem;
    font-weight: 500;
    color: #4b5563;
}

.dark .field-label {
    color: #cbd5f5;
}

.store-select :deep(.vs__dropdown-toggle) {
    padding: 0.625rem 1rem;
    border: 1px solid #e0e6ed;
    border-radius: 0.75rem;
    background-color: white;
    color: #1e293b;
    font-size: 0.95rem;
    transition: all 0.2s;
}

.store-select :deep(.vs__dropdown-toggle:hover) {
    border-color: #cbd5f5;
}

.store-select :deep(.vs__dropdown-toggle:focus-within) {
    border-color: #facc15;
    box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.12);
}

.store-select :deep(.vs__dropdown-menu) {
    max-height: calc(5 * 2.5rem);
    overflow-y: auto;
}

.store-select :deep(.vs__dropdown-option) {
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
}

.store-select :deep(.vs__dropdown-toggle[aria-disabled="true"]) {
    background-color: #f8f9fa;
    cursor: not-allowed;
    opacity: 0.6;
}

.dark .store-select :deep(.vs__dropdown-toggle) {
    background-color: #1b2e4b;
    border-color: #3b4863;
    color: #e0e6ed;
}

.dark .store-select :deep(.vs__dropdown-toggle:focus-within) {
    border-color: #facc15;
    box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.25);
}

.dark .store-select :deep(.vs__dropdown-menu) {
    background-color: #243a5e;
    border-color: #3b4863;
}
</style>

