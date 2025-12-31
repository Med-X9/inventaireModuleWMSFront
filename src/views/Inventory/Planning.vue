<template>
    <div class="min-h-screen bg-app dark:bg-[#0e1726] p-8">
        <!-- Header avec titre et navigation -->
        <div class="bg-card dark:bg-[#1b2e4b] rounded-[20px] p-8 mb-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-border dark:border-gray-700">
            <div class="flex justify-between items-center gap-8">
                <div class="flex-1">
                    <h1 class="flex items-center gap-4 text-[2.5rem] font-extrabold text-text-dark dark:text-white-light m-0 mb-2">
                        <IconCalendar class="w-10 h-10 text-primary" />
                        Planning des jobs
                    </h1>
                </div>
                <div class="flex gap-4 items-center ml-auto">
                    <ButtonGroup :buttons="navigationButtons" justify="end" />
                </div>
            </div>
        </div>

        <!-- Tables des jobs et emplacements -->
        <div v-if="isDataLoaded" class="space-y-8">
            <!-- Section Jobs créés -->
        <div class="bg-card dark:bg-[#1b2e4b] rounded-[20px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-border dark:border-gray-700 mb-8 md:p-4">
            <div class="flex justify-between items-center mb-8 pb-4 border-b border-border dark:border-gray-700">
                <div class="flex items-center gap-4">
                    <h2 class="text-2xl font-bold text-text-dark dark:text-white-light m-0">Jobs créés</h2>
                </div>
                <div class="flex gap-4 items-center justify-end">
                    <ButtonGroup :buttons="jobsActionButtons" justify="end" />
                    <div class="relative inline-block" ref="statusLegendTooltip">
                        <button
                            @mouseenter="showStatusTooltip"
                            @mouseleave="hideStatusTooltip"
                            class="w-6 h-6 rounded-full bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 flex items-center justify-center transition-colors cursor-help"
                            type="button"
                            aria-label="Signification des statuts">
                            <svg class="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </button>
                        <Teleport to="body">
                            <div
                                v-if="showStatusLegend"
                                ref="tooltipElement"
                                :style="tooltipStyle"
                                class="fixed z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-4 pointer-events-none max-w-sm"
                                style="min-width: 280px;">
                                <h4 class="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Signification des statuts</h4>
                                <div class="space-y-2">
                                    <div class="flex items-center gap-2">
                                        <span class="inline-flex items-center rounded-md bg-slate-200 px-2 py-1 text-xs font-medium text-slate-900 ring-1 ring-slate-300/20 ring-inset">EN ATTENTE</span>
                                        <span class="text-xs text-slate-600 dark:text-slate-400">Job en attente de validation</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="inline-flex items-center rounded-md bg-slate-700 px-2 py-1 text-xs font-medium text-white ring-1 ring-slate-600/20 ring-inset">VALIDE</span>
                                        <span class="text-xs text-slate-600 dark:text-slate-400">Job validé</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="inline-flex items-center rounded-md bg-teal-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-teal-600/20 ring-inset">AFFECTE</span>
                                        <span class="text-xs text-slate-600 dark:text-slate-400">Job affecté à une équipe</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="inline-flex items-center rounded-md bg-purple-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-purple-600/20 ring-inset">PRET</span>
                                        <span class="text-xs text-slate-600 dark:text-slate-400">Job prêt pour le comptage</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="inline-flex items-center rounded-md bg-amber-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-amber-600/20 ring-inset">TRANSFERT</span>
                                        <span class="text-xs text-slate-600 dark:text-slate-400">Job en transfert</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="inline-flex items-center rounded-md bg-blue-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-blue-600/20 ring-inset">ENTAME</span>
                                        <span class="text-xs text-slate-600 dark:text-slate-400">Comptage entamé</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="inline-flex items-center rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white ring-1 ring-green-700/20 ring-inset">TERMINE</span>
                                        <span class="text-xs text-slate-600 dark:text-slate-400">Comptage terminé</span>
                                    </div>
                                </div>
                                <div class="absolute w-2 h-2 bg-white dark:bg-slate-800 border-l border-b border-slate-200 dark:border-slate-700 transform rotate-45 -bottom-1 right-4"></div>
                            </div>
                        </Teleport>
                    </div>
                </div>
            </div>

            <!-- DataTable des jobs avec configuration complète optimisée -->
            <DataTable
                :key="jobsKey"
                :columns="adaptedStoreJobsColumns"
                :rowDataProp="jobs"
                :actions="jobsActions as any"
                :enableVirtualScrolling="false"
                :currentPageProp="jobPaginationMetadata?.page"
                :totalPagesProp="jobPaginationMetadata?.totalPages"
                :totalItemsProp="jobPaginationMetadata?.total"
                :pageSizeProp="jobPaginationMetadata?.pageSize"
                :rowSelection="true"
                :loading="jobsLoading"
                @selection-changed="onJobSelectionChanged"
                :exportTitle="'Jobs créés'"
                v-if="jobs && jobs.length > 0"
                @pagination-changed="(queryModel) => onJobsTableEvent('pagination', queryModel)"
                @page-size-changed="(queryModel) => onJobsTableEvent('page-size-changed', queryModel)"
                @sort-changed="(queryModel) => onJobsTableEvent('sort', queryModel)"
                @filter-changed="(queryModel) => onJobsTableEvent('filter', queryModel)"
                @global-search-changed="(queryModel) => onJobsTableEvent('search', queryModel)"
                storageKey="planning_jobs_table"
                ref="jobsTableRef">
            </DataTable>
        </div>

        <!-- Section Emplacements disponibles -->
        <div class="bg-card dark:bg-[#1b2e4b] rounded-[20px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-border dark:border-gray-700 mb-8 md:p-4">
            <div class="flex justify-between items-center mb-8 pb-4 border-b border-border dark:border-gray-700">
                <div class="flex gap-4 items-center justify-end">
                    <ButtonGroup :buttons="locationsActionButtons" justify="end" />
                </div>
            </div>

            <!-- DataTable des locations -->
            <DataTable
                :key="availableLocationsKey"
                :columns="adaptedAvailableLocationColumns"
                :rowDataProp="locations"
                :enableVirtualScrolling="false"
                :currentPageProp="locationPaginationMetadata?.page"
                :totalPagesProp="locationPaginationMetadata?.totalPages"
                :totalItemsProp="locationPaginationMetadata?.total"
                :pageSizeProp="locationPaginationMetadata?.pageSize"
                :rowSelection="true"
                :loading="locationsLoading"
                @selection-changed="onAvailableSelectionChanged"
                :actions="locationsActions as any"
                @pagination-changed="(queryModel) => onLocationsTableEvent('pagination', queryModel)"
                @page-size-changed="(queryModel) => onLocationsTableEvent('page-size-changed', queryModel)"
                @sort-changed="(queryModel) => onLocationsTableEvent('sort', queryModel)"
                @filter-changed="(queryModel) => onLocationsTableEvent('filter', queryModel)"
                @global-search-changed="(queryModel) => onLocationsTableEvent('search', queryModel)"
                storageKey="planning_locations_table"
                ref="availableLocationsTableRef" />
            </div>
        </div>

        <!-- État de chargement -->
        <div v-else class="bg-card dark:bg-[#1b2e4b] rounded-[20px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] border border-border dark:border-gray-700 overflow-hidden md:p-4 flex items-center justify-center min-h-[400px]">
            <div class="flex flex-col items-center gap-4">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p class="text-text-dark dark:text-white-light">Chargement du planning...</p>
            </div>
        </div>

        <!-- Modal pour ajouter des emplacements à un job -->
        <Modal v-model="showAddToJobModal" title="Ajouter des emplacements à un job" size="md">
            <div class="space-y-6">
                <div>
                    <p class="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        {{ planningState.selectedAvailable.length }} emplacement(s) sélectionné(s)
                    </p>
                    <SelectField
                        v-model="selectedJobForModal"
                        :options="jobSelectOptions"
                        :searchable="true"
                        :clearable="true"
                        placeholder="Rechercher un job..."
                        no-options-text="Aucun job trouvé"
                        class="job-select-modal" />
                </div>
                <div class="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                        @click="closeAddToJobModal"
                        type="button"
                        class="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        Annuler
                    </button>
                    <button
                        @click="confirmAddToJob"
                        :disabled="!selectedJobForModal"
                        type="button"
                        class="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary-light border border-transparent rounded-md hover:from-primary-light hover:to-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        Ajouter
                    </button>
                </div>
            </div>
        </Modal>
    </div>
</template>

<script setup lang="ts">
/**
 * Vue Planning - Gestion du planning des jobs d'inventaire
 *
 * Cette vue permet de :
 * - Visualiser les jobs créés avec leurs emplacements
 * - Gérer les emplacements disponibles
 * - Créer de nouveaux jobs à partir d'emplacements sélectionnés
 * - Valider ou supprimer des jobs en masse
 * - Ajouter des emplacements à des jobs existants
 *
 * @component Planning
 */

// ===== IMPORTS VUE =====
import { useRoute } from 'vue-router'
import { ref, computed, nextTick, Teleport, onMounted } from 'vue'

// ===== IMPORTS COMPOSABLES =====
import { usePlanning } from '@/composables/usePlanning'

// ===== IMPORTS COMPOSANTS =====
import DataTable from '@/components/DataTable/DataTable.vue'
import SelectField from '@/components/Form/SelectField.vue'
import Modal from '@/components/Modal.vue'
import ButtonGroup from '@/components/Form/ButtonGroup.vue'
import type { ButtonGroupButton } from '@/components/Form/ButtonGroup.vue'

// ===== IMPORTS ICÔNES =====
import IconCalendar from '@/components/icon/icon-calendar.vue'
import IconCheck from '@/components/icon/icon-check.vue'
import IconEye from '@/components/icon/icon-eye.vue'
import IconPlus from '@/components/icon/icon-plus.vue'
import IconArrowLeft from '@/components/icon/icon-arrow-left.vue'
import IconUser from '@/components/icon/icon-user.vue'
import IconTrash from '@/components/icon/icon-trash.vue'
import IconXCircle from '@/components/icon/icon-x-circle.vue'

// ===== IMPORTS UTILITAIRES =====
// Les fonctions d'optimisation sont maintenant disponibles via usePlanning

// ===== IMPORTS STYLES =====
import '@/assets/css/select2.css'

// ===== ROUTER =====
const route = useRoute()

// ===== CHARGEMENT INITIAL DES DONNÉES =====
/**
 * Charger les données initiales via l'initialisation complète du composable
 */
onMounted(async () => {
    try {
        // L'initialisation complète inclut : résolution IDs + chargement données
        await initializeWithData()
        isDataLoaded.value = true
    } catch (error) {
        console.error('Erreur lors de l\'initialisation du planning:', error)
        // En cas d'erreur, on peut quand même afficher l'interface
        isDataLoaded.value = true
    }
})

// ===== COMPOSABLE =====
/**
 * Initialisation du composable usePlanning
 */
const {
    // Données
    jobs,
    locations,

    // États
    jobsLoading,
    locationsLoading,
    jobsError,
    locationsError,

    // Colonnes
    adaptedStoreJobsColumns,
    adaptedAvailableLocationColumns,

    // Actions
    jobsActions,
    locationsActions,

    // Handlers DataTable (isolés par instance)
    onJobsTableEvent,
    onLocationsTableEvent,
    onAvailableSelectionChanged,
    onJobSelectionChanged,


    // Sélections et actions
    selectedAvailableLocations,
    selectedJobs,
    hasSelectedLocations,
    hasSelectedJobs,
    selectedJobsCount,
    jobSelectOptions,

    // Actions principales
    createJobFromSelectedLocations,
    bulkValidateJobs,
    bulkDeleteJobs,
    bulkDeactivateLocations,
    onSelectJobForLocation,

    // Navigation
    handleGoToInventoryDetail,
    handleGoToAffectation,

    // Initialisation
    initializeWithData,

    // État du planning
    planningState,

    // Interface et états UI
    isDataLoaded,

    // Tooltips
    showStatusLegend,
    statusLegendTooltip,
    tooltipElement,
    tooltipStyle,
    showStatusTooltip,
    hideStatusTooltip,
    positionStatusTooltip,

    // Boutons d'actions
    navigationButtons,
    jobsActionButtons,
    locationsActionButtons,

    // Gestion des modals
    showAddToJobModal,
    selectedJobForModal,
    openAddToJobModal,
    closeAddToJobModal,
    confirmAddToJob,

    // Fonctions utilitaires
    getFileType,
    formatDate,

    // Références
    availableLocationsTableRef,
    jobsTableRef,
    availableLocationsKey,
    jobsKey,

    // Métadonnées de pagination
    jobPaginationMetadata,
    locationPaginationMetadata
} = usePlanning({
    inventoryReference: route.params.reference as string,
    warehouseReference: route.params.warehouse as string
})


// ===== ÉTATS LOCAUX =====

// ===== ÉTAT LOCAL POUR LE MODAL =====

// ===== MÉTHODES DU MODAL =====
</script>

<style scoped>
/* Limiter la hauteur du dropdown du select à 3 éléments avec scroll */
:deep(.job-select-modal .vs__dropdown-menu) {
    max-height: calc(3 * 3rem + 0.5rem) !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    z-index: 10000 !important;
}

:deep(.job-select-modal .vs__dropdown-option) {
    min-height: 3rem;
    padding: 0.75rem 1rem;
    line-height: 1.5;
}

/* Scrollbar personnalisée */
:deep(.job-select-modal .vs__dropdown-menu::-webkit-scrollbar) {
    width: 6px;
}

:deep(.job-select-modal .vs__dropdown-menu::-webkit-scrollbar-track) {
    background: #f1f5f9;
    border-radius: 10px;
}

:deep(.job-select-modal .vs__dropdown-menu::-webkit-scrollbar-thumb) {
    background: #6366f1;
    border-radius: 10px;
}

:deep(.job-select-modal .vs__dropdown-menu::-webkit-scrollbar-thumb:hover) {
    background: #4f46e5;
}

/* Style pour ButtonGroup avec bordure primary et fond blanc */
:deep(.inline-flex button) {
    font-size: 0.875rem;
    padding: 0.75rem 1.5rem;
}

:deep(.inline-flex button:first-child) {
    border-top-left-radius: 0.75rem;
    border-bottom-left-radius: 0.75rem;
}

:deep(.inline-flex button:last-child) {
    border-top-right-radius: 0.75rem;
    border-bottom-right-radius: 0.75rem;
}

:deep(.inline-flex button:not(:first-child):not(:last-child)) {
    border-radius: 0;
}
</style>
