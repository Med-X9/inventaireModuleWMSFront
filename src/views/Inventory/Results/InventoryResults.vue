<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-8">
        <!-- Header -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-8 mb-8 shadow-lg border border-slate-200 dark:border-slate-700">
            <div class="flex justify-between items-center flex-wrap gap-6">
                <div class="flex-1">
                    <div class="flex items-center gap-5">
                        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-xl">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100 m-0 mb-2 leading-tight">
                                Résultats d'inventaire
                                <span v-if="inventoryReference" class="text-xl font-semibold text-primary ml-3">
                                    {{ inventoryReference }}
                                </span>
                            </h1>
                            <p class="text-base text-slate-600 dark:text-slate-400 m-0 leading-relaxed">Consultez et validez les résultats des comptages par magasin</p>
                        </div>
                    </div>
                </div>
                <div class="flex gap-4 items-center">
                    <RouterLink
                        v-if="inventoryReference"
                        :to="{ name: 'inventory-job-tracking', params: { reference: inventoryReference } }"
                        class="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border-2 border-primary rounded-xl text-slate-900 dark:text-slate-100 font-semibold text-sm no-underline transition-all duration-300 shadow-md hover:-translate-y-0.5 hover:shadow-xl hover:bg-gradient-to-r hover:from-primary hover:to-primary-light hover:text-white">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <span>Suivi des jobs</span>
                    </RouterLink>
                </div>
            </div>
        </div>

        <!-- Carte de filtres -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-8 shadow-lg border border-slate-200 dark:border-slate-700 transition-all duration-300 hover:shadow-xl">
            <div class="mb-6 pb-4 border-b-2 border-slate-200 dark:border-slate-700">
                <div class="flex items-center gap-3">
                    <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span class="text-lg font-semibold text-slate-900 dark:text-slate-100">Sélection du magasin</span>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
                <div class="flex flex-col gap-3">
                    <label class="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                        <svg class="w-4.5 h-4.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Magasin
                    </label>
                    <SelectField
                        v-model="selectedStore"
                        :options="stores"
                        :clearable="false"
                        :searchable="true"
                        placeholder="Rechercher un magasin..."
                        :disabled="loading || stores.length === 0"
                        class="modern-select w-full"
                        searchPlaceholder="Tapez pour rechercher..."
                        @update:modelValue="onStoreChanged"
                    />
                </div>
            </div>
        </div>

        <!-- Bouton d'export des articles consolidés -->
        <div v-if="inventoryId" class="mb-6">
            <button
                @click="handleExportConsolidatedArticles"
                :disabled="exportLoading || !inventoryId"
                class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 border-none rounded-xl text-white font-semibold text-sm cursor-pointer transition-all duration-300 shadow-md hover:-translate-y-0.5 hover:shadow-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:transform-none dark:disabled:bg-slate-700 dark:disabled:text-slate-400">
                <svg v-if="!exportLoading" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{{ exportLoading ? 'Export en cours...' : 'Exporter les articles consolidés (Excel)' }}</span>
            </button>
        </div>

        <!-- DataTable -->
        <div v-if="selectedStore" class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <DataTable
                :columns="columns"
                :rowDataProp="results"
                :actions="actions as any"
                :pagination="true"
                :enableFiltering="true"
                :rowSelection="false"
                :serverSidePagination="true"
                :serverSideFiltering="true"
                :serverSideSorting="true"
                :enableColumnPinning="true"
                :totalItemsProp="resultsTotalItems"
                :totalPagesProp="pagination.total_pages"
                :currentPageProp="pagination.current_page"
                :pageSizeProp="pagination.page_size"
                @pagination-changed="onPaginationChanged"
                @sort-changed="onSortChanged"
                @filter-changed="onFilterChanged"
                @global-search-changed="onGlobalSearchChanged"
                @export-csv="onExportCsv"
                @export-excel="onExportExcel"
                @export-selected-csv="onExportSelectedCsv"
                @export-selected-excel="onExportSelectedExcel"
                storageKey="inventory_results_table"
                :loading="loading">
            </DataTable>
        </div>

        <!-- Message si aucun magasin sélectionné -->
        <div v-else class="bg-white dark:bg-slate-800 rounded-2xl p-16 text-center shadow-lg border border-slate-200 dark:border-slate-700">
            <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-xl">
                <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            </div>
            <h3 class="text-2xl font-bold text-slate-900 dark:text-slate-100 m-0 mb-2">Sélectionnez un magasin</h3>
            <p class="text-base text-slate-600 dark:text-slate-400 m-0">Veuillez sélectionner un magasin pour afficher les résultats d'inventaire</p>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * Vue InventoryResults - Résultats d'inventaire
 *
 * Cette vue permet de :
 * - Visualiser les résultats d'inventaire par magasin avec pagination, tri et filtrage côté serveur
 * - Valider les résultats individuellement ou en masse
 * - Modifier les résultats finaux
 * - Afficher les comptages et écarts dynamiquement
 *
 * @component InventoryResults
 */

// ===== IMPORTS VUE =====
import { ref, computed, watch, onMounted } from 'vue'

// ===== IMPORTS ROUTER =====
import { useRoute } from 'vue-router'

// ===== IMPORTS SERVICES =====
import { logger } from '@/services/loggerService'
import { InventoryResultsService } from '@/services/inventoryResultsService'
import { alertService } from '@/services/alertService'

// ===== IMPORTS COMPOSANTS =====
import DataTable from '@/components/DataTable/DataTable.vue'
import SelectField from '@/components/Form/SelectField.vue'

// ===== IMPORTS COMPOSABLES =====
import { useInventoryResults } from '@/composables/useInventoryResults'

// ===== IMPORTS TYPES =====
import type { InventoryResult } from '@/interfaces/inventoryResults'

// ===== IMPORTS ICÔNES =====
import IconCheck from '@/components/icon/icon-check.vue'
import Swal from 'sweetalert2'

// ===== ROUTE =====
const route = useRoute()

// ===== COMPUTED =====
/**
 * Référence de l'inventaire depuis l'URL
 */
const inventoryReference = computed(() => route.params.reference as string)


// ===== COMPOSABLE =====
/**
 * Initialisation du composable useInventoryResults
 * Gère toute la logique métier de la page
 */
const {
    loading,
    stores,
    results,
    columns,
    actions,
    selectedStore,
    inventoryId,
    resultsTotalItems,
    pagination,
    handleStoreSelect,
    onPaginationChanged,
    onSortChanged,
    onFilterChanged,
    onGlobalSearchChanged,
    exportToCsv,
    exportToExcel,
    initialize,
    reinitialize
} = useInventoryResults({ inventoryReference: inventoryReference.value })

// ===== ÉTAT EXPORT =====
const exportLoading = ref(false)

// ===== HANDLERS =====

/**
 * Handler pour le changement de magasin
 *
 * @param value - ID du magasin sélectionné
 */
const onStoreChanged = async (value: string | number | string[] | number[] | null) => {
    if (!value) {
        return
    }

    const storeId = Array.isArray(value) ? value[0] : value
    await handleStoreSelectWrapper(String(storeId))
}

/**
 * Wrapper pour le handler de sélection de magasin
 *
 * @param storeId - ID du magasin
 */
const handleStoreSelectWrapper = async (storeId: string | null) => {
    if (!storeId) return
    await handleStoreSelect(storeId)
}

/**
 * Handler pour l'export des articles consolidés
 */
const handleExportConsolidatedArticles = async () => {
    if (!inventoryId.value) {
        await alertService.warning({ text: 'Aucun inventaire sélectionné' })
            return
        }

    exportLoading.value = true

    try {
        // Afficher un loader
        const loadingSwal = Swal.fire({
            title: 'Export en cours...',
            text: 'Le fichier Excel est en cours de préparation. Veuillez patienter.',
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading()
            }
        })

        // Appeler le service d'export
        const response = await InventoryResultsService.exportConsolidatedArticles(inventoryId.value)

        // Vérifier que la réponse contient un blob
        if (!response.data || !(response.data instanceof Blob)) {
            throw new Error('Aucune donnée reçue du backend')
        }

        // Créer le blob avec le bon type MIME
        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })

        // Générer le nom du fichier
        const timestamp = new Date().toISOString().split('T')[0]
        const filename = `Articles_Consolides_${inventoryReference.value || inventoryId.value}_${timestamp}.xlsx`

        // Télécharger le fichier
        const downloadUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(downloadUrl)

        // Fermer le loader et afficher le succès
        await Swal.close()
        await alertService.success({
            text: 'Export Excel réussi'
        })

        logger.debug('Export des articles consolidés réussi', { filename })
    } catch (error: any) {
        logger.error('Erreur lors de l\'export des articles consolidés', error)

        // Extraire le message d'erreur
        const errorMessage = error?.response?.data?.message ||
                            error?.message ||
                            'Erreur lors de l\'export Excel'

        await Swal.close()
        await alertService.error({ text: errorMessage })
    } finally {
        exportLoading.value = false
    }
}

/**
 * Handler pour l'export CSV de tous les résultats
 */
const onExportCsv = async () => {
    await exportToCsv(false)
}

/**
 * Handler pour l'export Excel de tous les résultats
 */
const onExportExcel = async () => {
    await exportToExcel(false)
}

/**
 * Handler pour l'export CSV des résultats sélectionnés
 */
const onExportSelectedCsv = async () => {
    await exportToCsv(true)
}

/**
 * Handler pour l'export Excel des résultats sélectionnés
 */
const onExportSelectedExcel = async () => {
    await exportToExcel(true)
}

// ===== LIFECYCLE =====

/**
 * Initialisation au montage du composant
 */
onMounted(async () => {
    try {
        logger.debug('Initialisation de la page résultats', { reference: inventoryReference.value })
        await initialize(inventoryReference.value)
    } catch (error) {
        logger.error('Erreur lors de l\'initialisation', error)
    }
})

/**
 * Watch pour surveiller les changements de référence dans l'URL
 */
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
/* Styles pour le select moderne */
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
    max-height: calc(3 * 3rem + 0.5rem); /* Limite à 3 options avec un peu de marge */
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: var(--color-primary) rgba(0, 0, 0, 0.1);
}

.modern-select :deep(.vs__dropdown-menu::-webkit-scrollbar) {
    width: 6px;
}

.modern-select :deep(.vs__dropdown-menu::-webkit-scrollbar-track) {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 3px;
}

.modern-select :deep(.vs__dropdown-menu::-webkit-scrollbar-thumb) {
    background: var(--color-primary);
    border-radius: 3px;
}

.modern-select :deep(.vs__dropdown-menu::-webkit-scrollbar-thumb:hover) {
    background: var(--color-primary-dark);
}

.dark .modern-select :deep(.vs__dropdown-menu) {
    background: #2d3748;
    border-color: #4a5568;
    scrollbar-color: var(--color-primary) rgba(255, 255, 255, 0.1);
}

.dark .modern-select :deep(.vs__dropdown-menu::-webkit-scrollbar-track) {
    background: rgba(255, 255, 255, 0.05);
}

.dark .modern-select :deep(.vs__dropdown-menu::-webkit-scrollbar-thumb) {
    background: var(--color-primary);
}

.dark .modern-select :deep(.vs__dropdown-menu::-webkit-scrollbar-thumb:hover) {
    background: var(--color-primary-light);
}

.modern-select :deep(.vs__search) {
    padding: 0.75rem 1rem;
    margin: 0.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 0.95rem;
    color: #1e293b;
    background: #ffffff;
    transition: all 0.2s ease;
}

.modern-select :deep(.vs__search:focus) {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(254, 205, 28, 0.1);
}

.dark .modern-select :deep(.vs__search) {
    background: #1a202c;
    border-color: #4a5568;
    color: #e0e6ed;
}

.dark .modern-select :deep(.vs__search:focus) {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(254, 205, 28, 0.2);
}

.modern-select :deep(.vs__dropdown-option) {
    padding: 1rem 1.25rem;
    font-size: 0.95rem;
    transition: all 0.2s ease;
    cursor: pointer;
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

/* Styles pour le champ de recherche dans le toggle */
.modern-select :deep(.vs__search input) {
    padding: 0.5rem;
    border: none;
    background: transparent;
    color: #1e293b;
    font-size: 0.95rem;
    width: 100%;
}

.modern-select :deep(.vs__search input:focus) {
    outline: none;
}

.modern-select :deep(.vs__search input::placeholder) {
    color: #9ca3af;
    opacity: 0.7;
}

.dark .modern-select :deep(.vs__search input) {
    color: #e0e6ed;
}

.dark .modern-select :deep(.vs__search input::placeholder) {
    color: #6b7280;
}

/* Amélioration de l'icône de recherche */
.modern-select :deep(.vs__open-indicator) {
    fill: var(--color-primary);
    transition: transform 0.2s ease;
}

.modern-select :deep(.vs--open .vs__open-indicator) {
    transform: rotate(180deg);
}
</style>
