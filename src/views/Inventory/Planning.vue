<template>
    <div class="min-h-screen bg-app p-8">
        <!-- Header avec titre et navigation -->
        <div class="bg-card rounded-[20px] p-8 mb-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-border">
            <div class="flex justify-between items-center gap-8">
                <div class="flex-1">
                    <h1 class="flex items-center gap-4 text-[2.5rem] font-extrabold text-text-dark m-0 mb-2">
                        <IconCalendar class="w-10 h-10 text-primary" />
                        Planning des jobs
                    </h1>
                </div>
                <div class="flex gap-4 items-center ml-auto">
                    <button class="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-300 whitespace-nowrap bg-gradient-to-br from-primary to-primary-light text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(79,70,229,0.4)] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none" @click="handleGoToInventoryDetail">
                        <IconEye class="w-4 h-4" />
                    </button>
                    <button class="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-300 whitespace-nowrap bg-gradient-to-br from-primary to-primary-light text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(79,70,229,0.4)] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none" @click="handleGoToAffectation">
                        <IconUser class="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>

        <!-- Section Jobs créés -->
        <div class="bg-card rounded-[20px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-border mb-8 md:p-4">
            <div class="flex justify-between items-center mb-8 pb-4 border-b border-border">
                <h2 class="text-2xl font-bold text-text-dark m-0">Jobs créés</h2>
                <div class="flex gap-4 items-center justify-end">
                    <button @click="onBulkValidateHandler" class="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-300 whitespace-nowrap bg-gradient-to-br from-primary to-primary-light text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(79,70,229,0.4)] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                        :disabled="planningState.isSubmitting || selectedJobsCount === 0">
                        <IconCheck class="w-4 h-4" />
                        <span>Valider ({{ selectedJobsCount }})</span>
                    </button>
                    <button @click="onReturnSelectedJobs" class="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-300 whitespace-nowrap bg-gradient-to-br from-text-muted to-text-light text-card shadow-[0_4px_12px_rgba(100,116,139,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(100,116,139,0.4)] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                        :disabled="selectedJobsCount === 0">
                        <IconArrowLeft class="w-4 h-4" />
                        <span>Retourner ({{ selectedJobsCount }})</span>
                    </button>
                </div>
            </div>

            <!-- DataTable des jobs -->
            <DataTable
                :key="jobsKey"
                :columns="adaptedStoreJobsColumns"
                :rowDataProp="jobs"
                :rowSelection="true"
                @selection-changed="onJobSelectionChanged"
                :showColumnSelector="false"
                storageKey="planning_jobs_table"
                :actions="[]"
                :pagination="true"
                :enableFiltering="true"
                :inlineEditing="false"
                :exportTitle="'Jobs créés'"
                :loading="loading"
                :serverSidePagination="true"
                :serverSideFiltering="true"
                :serverSideSorting="true"
                :customDataTableParams="jobsCustomParams"
                :pageSizeProp="jobsPageSize"
                @pagination-changed="onJobPaginationChanged"
                @sort-changed="onJobSortChanged"
                @filter-changed="handleJobFilterChanged"
                ref="jobsTableRef">
                <!-- Slot pour les actions dans la table imbriquée des emplacements -->
                <template #nested-actions="{ item, parentRow } ">
                    <button
                        :data-job-id="parentRow.id"
                        :data-location-id="item.id"
                        @click="removeLocationFromNestedTable(parentRow.id.toString(), item.location_reference)"
                        title="Supprimer cet emplacement"
                        class="bg-error text-card border-none px-2 py-1 rounded text-xs cursor-pointer">
                        <IconTrash class="w-3 h-3" />
                    </button>
                </template>
            </DataTable>
        </div>

        <!-- Section Emplacements disponibles -->
        <div class="bg-card rounded-[20px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-border mb-8 md:p-4">
            <div class="flex justify-between items-center mb-8 pb-4 border-b border-border">
                <h2 class="text-2xl font-bold text-text-dark m-0">Emplacements disponibles</h2>
                <div class="flex gap-4 items-center justify-end">
                    <button @click="createSingleJob" class="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-300 whitespace-nowrap bg-gradient-to-br from-primary to-primary-light text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(79,70,229,0.4)] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                        :disabled="planningState.selectedAvailable.length === 0">
                        <IconPlus class="w-4 h-4" />
                        <span>Créer Job ({{ planningState.selectedAvailable.length }})</span>
                    </button>
                    <div v-if="hasAvailableJobs" class="min-w-[250px] md:min-w-0">
                        <SelectField
                            :key="`job-select-${selectFieldKey}`"
                            v-model="planningState.selectedJobToAddLocation"
                            :options="jobSelectOptions"
                            :searchable="true"
                            :clearable="true"
                            :compact="true"
                            placeholder="Ajouter à un job existant..."
                            no-options-text="Aucun job trouvé"
                            @update:modelValue="onSelectJobForLocation" />
                    </div>
                </div>
            </div>

            <!-- DataTable des locations disponibles -->
            <DataTable
                :key="availableLocationsKey"
                :columns="adaptedAvailableLocationColumns as any"
                :rowDataProp="locations"
                :pagination="true"
                :rowSelection="true"
                :totalItemsProp="locationsTotalItems"
                :pageSizeProp="locationsPageSize"
                @selection-changed="onAvailableSelectionChanged"
                storageKey="available_locations"
                :showColumnSelector="false"
                :actions="[]"
                :enableFiltering="true"
                :inlineEditing="false"
                :exportTitle="'Emplacements disponibles'"
                :loading="loading"
                :serverSidePagination="true"
                :serverSideFiltering="true"
                :serverSideSorting="true"
                :customDataTableParams="locationsCustomParams"
                @pagination-changed="onLocationPaginationChanged"
                @sort-changed="onLocationSortChanged"
                @filter-changed="handleLocationFilterChanged"
                ref="availableLocationsTableRef" />
        </div>
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

// ===== IMPORTS COMPOSABLES =====
import { usePlanning } from '@/composables/usePlanning'

// ===== IMPORTS COMPOSANTS =====
import DataTable from '@/components/DataTable/DataTable.vue'
import SelectField from '@/components/Form/SelectField.vue'

// ===== IMPORTS ICÔNES =====
import IconCalendar from '@/components/icon/icon-calendar.vue'
import IconCheck from '@/components/icon/icon-check.vue'
import IconEye from '@/components/icon/icon-eye.vue'
import IconPlus from '@/components/icon/icon-plus.vue'
import IconArrowLeft from '@/components/icon/icon-arrow-left.vue'
import IconUser from '@/components/icon/icon-user.vue'
import IconTrash from '@/components/icon/icon-trash.vue'

// ===== IMPORTS STYLES =====
import '@/assets/css/select2.css'

// ===== ROUTER =====
const route = useRoute()

// ===== COMPOSABLE =====
/**
 * Initialisation du composable usePlanning
 * Toute la logique est gérée dans le composable
 */
const {
    // État
    jobs,
    locations,
    availableLocations,
    planningState,
    loading,
    selectedJobsCount,

    // Computed properties additionnelles
    hasAvailableJobs,
    jobSelectOptions,

    // Colonnes adaptées
    adaptedStoreJobsColumns,
    adaptedAvailableLocationColumns,

    // Pagination
    jobsPageSize,
    locationsTotalItems,
    locationsPageSize,

    // Paramètres personnalisés DataTable
    jobsCustomParams,
    locationsCustomParams,

    // Références DataTable
    availableLocationsTableRef,
    jobsTableRef,
    availableLocationsKey,
    jobsKey,
    selectFieldKey,

    // Handlers DataTable
    onJobPaginationChanged,
    onJobSortChanged,
    handleJobFilterChanged,
    onLocationPaginationChanged,
    onLocationSortChanged,
    handleLocationFilterChanged,
    onAvailableSelectionChanged,
    onJobSelectionChanged,

    // Actions
    createSingleJob,
    onBulkValidateHandler,
    onReturnSelectedJobs,
    onSelectJobForLocation,
    removeLocationFromNestedTable,

    // Navigation
    handleGoToInventoryDetail,
    handleGoToAffectation
} = usePlanning({
    inventoryReference: route.params.reference as string,
    warehouseReference: route.params.warehouse as string
})
</script>
