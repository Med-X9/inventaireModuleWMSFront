<template>
    <div class="panel">
        <!-- Sélection du magasin -->
        <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <IconHome class="w-4 h-4 inline mr-2" />
                Magasin
            </label>
            <SelectField
                v-model="selectedStore"
                :options="stores"
                :clearable="false"
                :searchable="false"
                placeholder="Sélectionner un magasin..."
                :disabled="loading || stores.length === 0"
                class="store-select vs-limit-height w-full md:w-1/3"
                @update:modelValue="onStoreChanged"
            />
        </div>

        <div class="mb-6 flex justify-end">
            <RouterLink
                v-if="inventoryReference"
                :to="{ name: 'inventory-job-tracking', params: { reference: inventoryReference } }"
                class="btn btn-outline-primary btn-sm"
            >
                Suivi des jobs
            </RouterLink>
        </div>

        <div v-if="selectedStore" class="py-6">
                <DataTable
                :columns="columns"
                :rowDataProp="results"
                :actions="actions as any"
                :pagination="true"
                :enableFiltering="true"
                :rowSelection="true"
                @selection-changed="onSelectionChanged"
                @pagination-changed="onPaginationChanged"
                @sort-changed="onSortChanged"
                @filter-changed="onFilterChanged"
                @global-search-changed="onGlobalSearchChanged"
                storageKey="inventory_results_table"
                :loading="loading"
            >

                <template #table-actions>
                    <div class="flex items-center flex-wrap gap-2">
                        <button class="btn btn-primary p-2 px-4 mb-4 btn-sm" @click="handleBulkValidateWrapper">
                            <IconCheck class="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                            Valider en lot
                        </button>
                    </div>
                </template>
            </DataTable>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { logger } from '@/services/loggerService'
import DataTable from '@/components/DataTable/DataTable.vue'
import { useInventoryResults } from '@/composables/useInventoryResults'
import type { InventoryResult } from '@/interfaces/inventoryResults'
import IconCheck from '@/components/icon/icon-check.vue'
import IconHome from '@/components/icon/icon-home.vue'
import SelectField from '@/components/Form/SelectField.vue'

// Récupérer la référence depuis l'URL
const route = useRoute()
const inventoryReference = computed(() => route.params.reference as string)

// État local pour les résultats sélectionnés
const selectedResultsLocal = ref<InventoryResult[]>([])

// Utiliser le composable avec la référence de l'URL
const {
    loading,
    stores,
    results,
    columns,
    actions,
    selectedStore,
    handleStoreSelect,
    onPaginationChanged,
    onSortChanged,
    onFilterChanged,
    onGlobalSearchChanged,
    initialize,
    reinitialize
} = useInventoryResults({ inventoryReference: inventoryReference.value })

const onStoreChanged = async (value: string | number | string[] | number[] | null) => {
    if (!value) {
        return
    }

    const storeId = Array.isArray(value) ? value[0] : value
    await handleStoreSelectWrapper(String(storeId))
}

// Wrapper pour le handler de sélection de magasin
const handleStoreSelectWrapper = async (storeId: string | null) => {
    if (!storeId) return
    await handleStoreSelect(storeId)
}

// Handler pour la validation en masse
const handleBulkValidateWrapper = async () => {
    try {
        // Le composable nécessite maintenant les résultats sélectionnés en paramètre
        // On utilise une méthode de validation alternative
        if (selectedResultsLocal.value.length === 0) {
            logger.warn('Aucun résultat sélectionné')
            return
        }

        // Appeler l'action de validation pour chaque résultat sélectionné
        for (const result of selectedResultsLocal.value) {
            const action = actions.find(a => a.label === 'Valider')
            if (action?.onClick) {
                await action.onClick(result)
            }
        }

        // Réinitialiser la sélection
        selectedResultsLocal.value = []
    } catch (error) {
        logger.error('Erreur lors de la validation en masse', error)
    }
}

// Track selection changes
const onSelectionChanged = (selectedRows: Set<string>) => {
    // Convertir Set<string> en InventoryResult[]
    const resultIds = Array.from(selectedRows)
    selectedResultsLocal.value = results.value.filter(r => resultIds.includes(String(r.id)))
}

// Initialisation au montage
onMounted(async () => {
    try {
        logger.debug('Initialisation de la page résultats', { reference: inventoryReference.value })
        await initialize(inventoryReference.value)
    } catch (error) {
        logger.error('Erreur lors de l\'initialisation', error)
    }
})

// Watch pour surveiller les changements de référence dans l'URL
watch(inventoryReference, async (newReference, oldReference) => {
    if (!newReference || newReference === oldReference) return

    try {
        logger.debug('Changement de référence détecté', { old: oldReference, new: newReference })
        await reinitialize(newReference)
    } catch (error) {
        logger.error('Erreur lors du changement de référence', error)
    }
})
</script>

<style scoped>
/* Styles pour le select de magasin */
.store-select {
    display: block;
}

.store-select :deep(.vs__dropdown-toggle) {
    padding: 0.625rem 1rem;
    border: 1px solid #e0e6ed;
    border-radius: 0.5rem;
    background-color: white;
    color: #1e293b;
    font-size: 0.95rem;
    transition: all 0.2s;
}

.store-select :deep(.vs__dropdown-toggle:hover) {
    border-color: #cbd5f5;
}

.store-select :deep(.vs__dropdown-toggle:focus-within) {
    border-color: #FACC15;
    box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.1);
}

.store-select :deep(.vs__dropdown-menu) {
    max-height: calc(5 * 2.5rem);
    overflow-y: auto;
}

.store-select :deep(.vs__dropdown-option) {
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
}

.store-select :deep(.vs__clear) {
    display: none;
}

.store-select :deep(.vs__search) {
    margin: 0;
}

.store-select :deep(.vs__selected) {
    color: #1e293b;
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
    border-color: #FACC15;
    box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.2);
}

.dark .store-select :deep(.vs__dropdown-menu) {
    background-color: #243a5e;
    border-color: #3b4863;
}

.panel {
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark .panel {
    background: #1b2e4b;
}
</style>
