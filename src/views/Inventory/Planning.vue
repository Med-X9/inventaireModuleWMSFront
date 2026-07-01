<template>
    <div class="min-h-screen bg-app dark:bg-bg-dark p-8 font-body">
        <!-- Header avec titre et navigation -->
        <div class="bg-card dark:bg-bg-card rounded-2xl p-8 mb-8 shadow-lg border border-border dark:border-border">
            <div class="flex justify-between items-center gap-8">
                <div class="flex-1">
                    <h1 class="flex items-center gap-4 text-4xl font-extrabold font-heading text-text-dark dark:text-text m-0 mb-2">
                        <MdiIcon name="mdi-calendar-outline" size="xl" class="text-primary" />
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
        <div class="bg-card dark:bg-bg-card rounded-2xl p-8 shadow-lg border border-border dark:border-border mb-8 md:p-4">
            <div class="flex justify-between items-center mb-8 pb-4 border-b border-border dark:border-border">
                <div class="flex items-center gap-4">
                    <h2 class="text-2xl font-bold font-heading text-text-dark dark:text-text m-0">Jobs créés</h2>
                </div>
                <div class="flex gap-4 items-center justify-end">
                    <ButtonGroup :buttons="jobsActionButtons" justify="end" />
                    <JobStatusLegendTooltip />
                </div>
            </div>

            <!-- DataTable des jobs - config harmonisée avec InventoryResults.vue -->
            <DataTable
                :key="jobsTableKey"
                :columns="adaptedStoreJobsColumns"
                :rowDataProp="jobs"
                :actions="jobsActions as any"
                :currentPageProp="jobPaginationMetadata?.page"
                :totalPagesProp="jobPaginationMetadata?.totalPages"
                :totalItemsProp="jobPaginationMetadata?.total"
                :pageSizeProp="jobPaginationMetadata?.pageSize"
                :rowSelection="true"
                :loading="jobsLoading"
                :customDataTableParams="jobsCustomParams"
                v-on="jobsTableEvents"
                storageKey="planning_jobs_table"
                ref="jobsTableRef"
                :enableDynamicColumns="false"
                :debounceFilter="300"
                :debounceSearch="500"
                :pagination="true"
                :enableFiltering="true"
                :enableGlobalSearch="true"
                :exportTitle="'Jobs créés'"
                @selection-changed="onJobSelectionChanged"
            />
        </div>

        <!-- Section Emplacements disponibles -->
        <div class="bg-card dark:bg-bg-card rounded-2xl p-8 shadow-lg border border-border dark:border-border mb-8 md:p-4">
            <div class="flex justify-between items-center mb-8 pb-4 border-b border-border dark:border-border">
                <div class="flex gap-4 items-center justify-end">
                    <ButtonGroup :buttons="locationsActionButtons" justify="end" />
                </div>
            </div>

            <!-- DataTable des locations - config harmonisée avec InventoryResults.vue -->
            <DataTable
                :key="locationsTableKey"
                :columns="adaptedAvailableLocationColumns"
                :rowDataProp="locations"
                :actions="locationsActions as any"
                :currentPageProp="locationPaginationMetadata?.page"
                :totalPagesProp="locationPaginationMetadata?.totalPages"
                :totalItemsProp="locationPaginationMetadata?.total"
                :pageSizeProp="locationPaginationMetadata?.pageSize"
                :rowSelection="true"
                :loading="locationsLoading"
                :customDataTableParams="locationsCustomParams"
                v-on="locationsTableEvents"
                storageKey="planning_locations_table"
                ref="availableLocationsTableRef"
                :enableDynamicColumns="false"
                :debounceFilter="300"
                :debounceSearch="500"
                :pagination="true"
                :enableFiltering="true"
                :enableGlobalSearch="true"
                @selection-changed="onAvailableSelectionChanged"
            />
            </div>
        </div>

        <!-- État de chargement -->
        <div v-else class="bg-card dark:bg-bg-card rounded-2xl p-8 shadow-lg border border-border dark:border-border overflow-hidden md:p-4 flex items-center justify-center min-h-[400px]">
            <div class="flex flex-col items-center gap-4">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p class="text-text-dark dark:text-text">Chargement du planning...</p>
            </div>
        </div>

        <!-- Modal pour ajouter des emplacements à un job -->
        <Modal v-model="showAddToJobModal" title="Ajouter des emplacements à un job" size="md">
            <div class="space-y-6">
                <div>
                    <p class="text-sm text-text-muted dark:text-text-light mb-4">
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
                <div class="flex justify-end gap-3 pt-4 border-t border-border dark:border-border">
                    <button
                        @click="closeAddToJobModal"
                        type="button"
                        class="px-4 py-2 text-sm font-medium text-text-dark dark:text-text bg-card dark:bg-bg-card border border-border dark:border-border rounded-lg hover:bg-hover dark:hover:bg-hover transition-colors">
                        Annuler
                    </button>
                    <button
                        @click="confirmAddToJob"
                        :disabled="!selectedJobForModal"
                        type="button"
                        class="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
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
import { onMounted, watch } from 'vue'

// ===== IMPORTS COMPOSABLES =====
import { usePlanning } from '@/composables/usePlanning'

// ===== IMPORTS COMPOSANTS =====
import { DataTable } from '@SMATCH-Digital-dev/vue-system-design'
import SelectField from '@/components/Form/SelectField.vue'
import Modal from '@/components/Modal.vue'
import ButtonGroup from '@/components/Form/ButtonGroup.vue'
import JobStatusLegendTooltip from '@/components/JobStatusLegendTooltip.vue'

// ===== IMPORTS ICÔNES =====
import MdiIcon from '@/components/MdiIcon.vue'
import { bindDataTableServerEvents } from '@/composables/dataTable/bindDataTableServerEvents'


// ===== IMPORTS STYLES =====
import '@/assets/css/select2.css'

// ===== ROUTER =====
const route = useRoute()

const {
    jobs,
    locations,
    jobsLoading,
    locationsLoading,
    adaptedStoreJobsColumns,
    adaptedAvailableLocationColumns,
    jobsActions,
    locationsActions,
    onJobsTableEvent,
    onLocationsTableEvent,
    onAvailableSelectionChanged,
    onJobSelectionChanged,
    jobSelectOptions,
    planningState,
    isDataLoaded,
    navigationButtons,
    jobsActionButtons,
    locationsActionButtons,
    showAddToJobModal,
    selectedJobForModal,
    closeAddToJobModal,
    confirmAddToJob,
    initializeWithData,
    availableLocationsTableRef,
    jobsTableRef,
    locationsTableKey,
    jobsTableKey,
    jobPaginationMetadata,
    locationPaginationMetadata,
    jobsCustomParams,
    locationsCustomParams,
} = usePlanning({
    inventoryReference: route.params.reference as string,
    warehouseReference: route.params.warehouse as string
})

const jobsTableEvents = bindDataTableServerEvents(onJobsTableEvent)
const locationsTableEvents = bindDataTableServerEvents(onLocationsTableEvent)

// ===== CHARGEMENT INITIAL DES DONNÉES =====
const mountPlanning = async () => {
    try {
        await initializeWithData()
    } catch (error) {
        console.error('Erreur lors de l\'initialisation du planning:', error)
        isDataLoaded.value = true
    }
}

onMounted(() => {
    void mountPlanning()
})

watch(
    () => [route.params.reference, route.params.warehouse] as const,
    ([reference, warehouse], previous) => {
        if (!previous) return
        if (reference === previous[0] && warehouse === previous[1]) return
        void mountPlanning()
    }
)
</script>

<style scoped>
/* Limiter la hauteur du dropdown du select à 3 éléments avec scroll */
:deep(.job-select-modal .vs__dropdown-menu) {
    @apply max-h-[9.5rem] overflow-y-auto overflow-x-hidden z-[10000];
}

:deep(.job-select-modal .vs__dropdown-option) {
    @apply min-h-[3rem] px-4 py-3 leading-normal;
}
</style>
