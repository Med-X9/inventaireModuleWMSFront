<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6 lg:p-8">
        <!-- En-tête moderne avec gradient -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 mb-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div class="flex-1">
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        <div>
                            <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-1">
                                Suivi des jobs
                            </h1>
                            <p class="text-base text-slate-600 dark:text-slate-400">
                                Visualisez l'avancement des comptages pour chaque emplacement
                            </p>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <button
                        @click="handlePrintJobs"
                        :disabled="storeLoading"
                        class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Imprimer job
                    </button>
                </div>
            </div>
        </div>

        <!-- Carte de filtres -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 mb-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <div class="border-b-2 border-slate-200 dark:border-slate-700 pb-4 mb-6">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <h2 class="flex items-center gap-3 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                        <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filtres de sélection
                    </h2>
                    <!-- Informations intégrées -->
                    <div class="flex flex-wrap items-center gap-4 lg:gap-6">
                        <!-- Référence inventaire -->
                        <div class="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div>
                                <div class="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Référence</div>
                                <div class="text-sm font-bold text-blue-900 dark:text-blue-100">{{ inventoryReference || 'N/A' }}</div>
                            </div>
                        </div>

                        <!-- Entrepôt sélectionné -->
                        <div v-if="selectedWarehouse" class="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800">
                            <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <div>
                                <div class="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">Entrepôt</div>
                                <div class="text-sm font-bold text-green-900 dark:text-green-100 truncate max-w-[150px]">
                                    {{ selectedWarehouse.warehouse_name || selectedWarehouse.reference || `Entrepôt ${selectedWarehouse.id}` }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="flex flex-col gap-2">
                    <label class="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                        <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Magasin
                    </label>
                    <SelectField
                        v-model="selectedStore"
                        :options="storeOptions || []"
                        :clearable="false"
                        :searchable="false"
                        placeholder="Sélectionner un magasin"
                        :disabled="storeLoading || !storeOptions || (storeOptions && storeOptions.length === 0)"
                        class="modern-select w-full"
                    />
                </div>

                <div class="flex flex-col gap-2">
                    <label class="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                        <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        Comptage
                    </label>
                    <SelectField
                        v-model="selectedCountingOrder"
                        :options="countingOptions || []"
                        :clearable="false"
                        :searchable="false"
                        placeholder="Sélectionner un comptage"
                        :disabled="storeLoading || !countingOptions || countingOptions.length === 0"
                        class="modern-select w-full"
                    />
                </div>
            </div>
        </div>

        <!-- DataTable avec container moderne -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <DataTable
                :columns="displayColumns"
                :rowDataProp="rows"
                :loading="storeLoading"
                :actions="[]"
                :pagination="false"
                :rowSelection="true"
                :enableGlobalSearch="false"
                :enableFiltering="false"
                :enableAdvancedEditing="false"
                :enableGrouping="false"
                :enablePivot="false"
                storageKey="job_tracking_table"
                emptyMessage="Aucune donnée disponible pour ces critères"
                @selection-changed="onSelectionChanged"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * Vue JobTracking - Suivi des jobs d'inventaire
 *
 * Cette vue permet de :
 * - Visualiser l'avancement des comptages pour chaque emplacement
 * - Filtrer par magasin et par comptage
 * - Afficher les dates de transfert, lancement et fin pour chaque job
 *
 * @component JobTracking
 */

// ===== IMPORTS VUE =====
import { computed, onMounted, watch } from 'vue'

// ===== IMPORTS ROUTER =====
import { useRoute } from 'vue-router'

// ===== IMPORTS PINIA =====
import { storeToRefs } from 'pinia'

// ===== IMPORTS COMPOSANTS =====
import DataTable from '@/components/DataTable/DataTable.vue'
import SelectField from '@/components/Form/SelectField.vue'

// ===== IMPORTS COMPOSABLES =====
import { useJobTracking } from '@/composables/useJobTracking'

// ===== IMPORTS STORES =====
import { useWarehouseStore } from '@/stores/warehouse'

// ===== IMPORTS TYPES =====
import type { DataTableColumn } from '@/types/dataTable'

// ===== ROUTE =====
const route = useRoute()
const referenceParam = computed(() => route.params.reference as string)

// ===== STORES =====
const warehouseStore = useWarehouseStore()
const { warehouses, loading: warehousesLoading } = storeToRefs(warehouseStore)

// ===== COMPOSABLE =====
/**
 * Initialisation du composable useJobTracking
 * Gère toute la logique métier de la page
 */
const {
    inventoryReference,
    loading,
    storeOptions,
    selectedStore,
    countingOptions,
    selectedCountingOrder,
    rows,
    columns,
    selectedRows,
    selectedRowsCount,
    hasSelectedRows,
    initialize,
    reinitialize,
    printJobs,
    onSelectionChanged,
    resetSelection
} = useJobTracking({ inventoryReference: referenceParam.value })

// ===== COMPUTED =====

/**
 * État de chargement global (composable + stores)
 */
const storeLoading = computed(() => loading.value || warehousesLoading.value)

/**
 * Magasin sélectionné (objet complet depuis le store)
 */
const selectedWarehouse = computed(() => {
    if (!selectedStore.value) {
        return null
    }
    return warehouses.value.find(warehouse => String(warehouse.id) === String(selectedStore.value)) || null
})

/**
 * Colonnes formatées pour le DataTable
 */
const displayColumns = computed<DataTableColumn[]>(() => columns.value as DataTableColumn[])

/**
 * Handler pour le bouton d'impression
 */
const handlePrintJobs = async () => {
    await printJobs()
}

// ===== LIFECYCLE =====

/**
 * Initialisation au montage du composant
 */
onMounted(async () => {
    await initialize(referenceParam.value)
})

/**
 * Watcher sur la référence de l'inventaire
 * Réinitialise le composable quand la référence change
 */
watch(referenceParam, async newReference => {
    if (!newReference) {
        return
    }

    await reinitialize(newReference)
})
</script>

<style scoped>
/* Styles pour le select moderne (nécessaires pour le composant externe) */
.modern-select :deep(.vs__dropdown-toggle) {
    padding: 0.875rem 1.25rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.75rem;
    background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
    color: #1e293b;
    font-size: 0.95rem;
    font-weight: 500;
    transition: all 0.3s ease;
    min-height: 3rem;
}

.modern-select :deep(.vs__dropdown-toggle:hover) {
    border-color: var(--color-primary);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
    transform: translateY(-1px);
}

.modern-select :deep(.vs__dropdown-toggle:focus-within) {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.2);
    background: #ffffff;
}

.dark .modern-select :deep(.vs__dropdown-toggle) {
    background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
    border-color: #4a5568;
    color: #e0e6ed;
}

.dark .modern-select :deep(.vs__dropdown-toggle:hover) {
    border-color: var(--color-primary);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
}

.dark .modern-select :deep(.vs__dropdown-toggle:focus-within) {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.3);
}

.modern-select :deep(.vs__dropdown-menu) {
    border-radius: 0.75rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    border: 2px solid #e5e7eb;
    max-height: calc(5 * 3rem);
    overflow-y: auto;
}

.dark .modern-select :deep(.vs__dropdown-menu) {
    background: #2d3748;
    border-color: #4a5568;
}

.modern-select :deep(.vs__dropdown-option) {
    padding: 1rem 1.25rem;
    font-size: 0.95rem;
    transition: all 0.2s ease;
}

.modern-select :deep(.vs__dropdown-option:hover) {
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    color: #ffffff;
}

.modern-select :deep(.vs__dropdown-option--highlight) {
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    color: #ffffff;
}

.modern-select :deep(.vs__dropdown-toggle[aria-disabled="true"]) {
    background: #f3f4f6;
    cursor: not-allowed;
    opacity: 0.6;
}

.dark .modern-select :deep(.vs__dropdown-toggle[aria-disabled="true"]) {
    background: #374151;
}
</style>
