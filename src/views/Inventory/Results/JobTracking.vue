<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6 lg:p-8">
        <!-- Carte unifiée : Titre + sélection magasin -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 mb-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <!-- Titre + select magasin (même structure qu'InventoryResults.vue) -->
            <div class="flex flex-col gap-6 mb-4">
                <div class="flex justify-between items-start flex-wrap gap-6">
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
                                    <span v-if="inventoryReference" class="text-2xl font-semibold text-primary ml-3">
                                        {{ inventoryReference }}
                                    </span>
                            </h1>
                            <p class="text-base text-slate-600 dark:text-slate-400">
                                Visualisez l'avancement des comptages pour chaque emplacement
                            </p>
                                <p v-if="selectedWarehouse" class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Entrepôt :
                                    <span class="font-semibold text-slate-700 dark:text-slate-200">
                                    {{ selectedWarehouse.warehouse_name || selectedWarehouse.reference || `Entrepôt ${selectedWarehouse.id}` }}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <!-- Sélection du magasin -->
                    <div class="w-full md:w-80 lg:w-96">
                        <label class="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
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
                            class="w-full"
                    />
                    </div>
                </div>

                <!-- Boutons d'action (Résultats + Imprimer) alignés à droite -->
                <div class="flex justify-end">
                    <ButtonGroup :buttons="actionButtons" justify="end" />
                </div>
            </div>
        </div>

        <!-- DataTable avec container moderne -->
        <div v-if="selectedStore" class="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <DataTable
                :columns="columns"
                :rowDataProp="rows"
                :loading="storeLoading"
                :actions="[]"
                :pagination="false"
                :rowSelection="true"
                :enableGlobalSearch="true"
                :enableFiltering="true"
                :enableAdvancedEditing="false"
                :enableGrouping="false"
                :enablePivot="false"
                :serverSideFiltering="true"
                :serverSideSorting="true"
                storageKey="job_tracking_table"
                emptyMessage="Aucune donnée disponible pour ces critères"
                @selection-changed="onSelectionChanged"
                @sort-changed="onSortChanged"
                @filter-changed="onFilterChanged"
                @global-search-changed="onGlobalSearchChanged"
            />
        </div>

        <!-- Message si aucun magasin sélectionné -->
        <div v-else class="bg-white dark:bg-slate-800 rounded-3xl p-16 text-center shadow-xl border border-slate-200 dark:border-slate-700">
            <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-xl">
                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            </div>
            <h3 class="text-2xl font-bold text-slate-900 dark:text-slate-100 m-0 mb-2">Sélectionnez un magasin</h3>
            <p class="text-base text-slate-600 dark:text-slate-400 m-0">Veuillez sélectionner un magasin pour afficher le suivi des jobs</p>
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
import { useRoute, useRouter } from 'vue-router'

// ===== IMPORTS PINIA =====
import { storeToRefs } from 'pinia'

// ===== IMPORTS COMPOSANTS =====
import DataTable from '@/components/DataTable/DataTable.vue'
import SelectField from '@/components/Form/SelectField.vue'
import ButtonGroup, { type ButtonGroupButton } from '@/components/Form/ButtonGroup.vue'

// ===== IMPORTS COMPOSABLES =====
import { useJobTracking } from '@/composables/useJobTracking'

// ===== IMPORTS STORES =====
import { useWarehouseStore } from '@/stores/warehouse'

// ===== IMPORTS TYPES =====
import type { DataTableColumn } from '@/types/dataTable'

// ===== IMPORTS ICÔNES =====
import IconListCheck from '@/components/icon/icon-list-check.vue'
import IconPrinter from '@/components/icon/icon-printer.vue'

// ===== ROUTE =====
const route = useRoute()
const router = useRouter()
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
    rows,
    columns,
    selectedRows,
    selectedRowsCount,
    hasSelectedRows,
    initialize,
    reinitialize,
    printJobs,
    onSelectionChanged,
    resetSelection,
    onSortChanged,
    onFilterChanged,
    onGlobalSearchChanged
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

// Style commun pour les boutons d'action (fond blanc + bordure primary)
const ACTION_BUTTON_CLASS =
    'bg-white text-primary border border-primary hover:bg-primary hover:text-white ' +
    'dark:bg-slate-900 dark:text-primary dark:border-primary dark:hover:bg-primary ' +
    'dark:hover:text-white'

// ===== BOUTONS D'ACTION (pour le ButtonGroup) =====
const actionButtons = computed<ButtonGroupButton[]>(() => {
    const buttons: ButtonGroupButton[] = []

    buttons.push({
        id: 'results',
        label: 'Résultats',
        icon: IconListCheck,
        variant: 'default',
        class: ACTION_BUTTON_CLASS,
        disabled: !inventoryReference.value,
        visible: !!inventoryReference.value,
        onClick: () => {
            if (inventoryReference.value) {
                void router.push({ name: 'inventory-results', params: { reference: inventoryReference.value } })
            }
        }
    })

    buttons.push({
        id: 'print-jobs',
        label: 'Imprimer jobs',
        icon: IconPrinter,
        variant: 'default',
        class: ACTION_BUTTON_CLASS,
        disabled: storeLoading.value,
        visible: true,
        onClick: () => { void printJobs() }
    })

    return buttons
})

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

/**
 * Watcher pour déboguer les données
 */
watch(rows, (newRows) => {
    console.log('🔍 JobTracking - rows changed:', {
        rowsLength: newRows?.length || 0,
        firstRow: newRows?.[0],
        allRows: newRows,
        isArray: Array.isArray(newRows),
        type: typeof newRows
    })
}, { immediate: true, deep: true })

/**
 * Watcher pour vérifier que les colonnes sont bien créées
 */
watch(columns, (newColumns) => {
    console.log('🔍 JobTracking - columns changed:', {
        columnsLength: newColumns?.length || 0,
        columnFields: newColumns?.map((c: any) => c.field) || []
    })
}, { immediate: true })
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
