<template>
    <div>
        <!-- En-tête avec les informations de contexte -->
        <div v-if="inventoryReference || warehouseReference" class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <div v-if="inventoryReference" class="flex items-center space-x-2">
                        <span class="text-sm font-medium text-gray-600">Inventaire:</span>
                        <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-semibold">
                            {{ inventoryReference }}
                        </span>
                    </div>
                    <div v-if="warehouseReference" class="flex items-center space-x-2">
                        <span class="text-sm font-medium text-gray-600">Entrepôt:</span>
                        <span class="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-semibold">
                            {{ warehouseReference }}
                        </span>
                    </div>
                </div>

            </div>
        </div>

        <div>
            <!-- Section Jobs -->
            <section>
                <!-- Table 1: Jobs créés -->
                <div class="panel">
                    <h3 class="text-lg font-semibold mb-2">Jobs créés</h3>
                    <div class="">
                        <DataTable :key="jobsKey" :columns="storeJobsColumns" :rowDataProp="storeJobs"
                            :rowSelection="true" @selection-changed="onJobSelectionChanged" :showColumnSelector="false"
                            storageKey="planning_jobs_table" :actions="[]" :pagination="true" :enableFiltering="false"
                            :showDetails="true" @row-expanded="onJobRowExpanded">
                            <template #table-actions>
                                <div class="flex items-center justify-end gap-4 mb-4">
                                    <button @click="onBulkValidate" class="btn btn-primary flex items-center"
                                        :disabled="isSubmitting">
                                        <span v-if="!isSubmitting">
                                            ✓ Valider ({{ selectedJobs.length }})
                                        </span>
                                        <span v-else class="flex items-center">
                                            <svg class="animate-spin w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg"
                                                fill="none" viewBox="0 0 24 24">
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                                    stroke-width="4" />
                                                <path class="opacity-75" fill="currentColor"
                                                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                            </svg>
                                            Valider...
                                        </span>
                                    </button>
                                    <button @click="onReturnSelectedJobs" class="btn btn-primary">
                                        ↩ Retourner ({{ selectedJobs.length }})
                                    </button>

                                </div>
                            </template>
                        </DataTable>
                    </div>

                    <div v-if="!storeJobs.length" class="text-center py-12 border-dashed border-2 rounded-lg">
                        <p class="text-gray-500">Aucun job créé</p>
                        <p class="text-sm text-gray-400 mt-2">Sélectionnez des emplacements dans la table ci-dessous
                            pour créer un job</p>
                    </div>
                </div>

                <!-- Table 2: Emplacements disponibles -->
                <div class="mt-6 panel">
                    <h3 class="text-lg font-semibold mb-2">Emplacements disponibles</h3>

                    <!-- Barre de recherche et filtres -->
                    <div class="flex items-center gap-4 mb-4">
                        <div class="flex-1">
                            <input v-model="locationSearchQuery" type="search"
                                placeholder="Rechercher un emplacement..."
                                @input="onSearchLocations"
                                class="w-full max-w-md px-3 py-2 border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-10 transition-all duration-200" />
                        </div>
                    </div>

                    <div class="">
                        <DataTable :key="availableLocationsKey" :columns="availableLocationColumns"
                            :rowDataProp="tableData" :pagination="true" :paginationPageSize="pageSize" :rowSelection="true"
                            @selection-changed="onAvailableSelectionChanged" storageKey="available_locations"
                            :showColumnSelector="false" :actions="[]" :enableFiltering="true"
                            @sort-changed="onLocationSortChanged" @filter-changed="onLocationFilterChanged"
                            @pagination-changed="onLocationPaginationChanged">
                            <template #table-actions>
                                <div class="flex items-center gap-4 w-full justify-end">
                                    <button @click="createSingleJob" class="btn btn-primary">
                                        Créer Job ({{ selectedAvailable.length }})
                                    </button>
                                    <div v-if="hasAvailableJobs" class="min-w-[250px]">
                                        <SelectField :key="`job-select-${selectFieldKey}`" v-model="selectedJobId"
                                            :options="jobSelectOptions" :searchable="true" :clearable="true"
                                            :compact="true" placeholder="Ajouter à un job existant..."
                                            no-options-text="Aucun job trouvé"
                                            @update:modelValue="onSelectJobForLocation" />
                                    </div>
                                </div>
                            </template>
                        </DataTable>
                    </div>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { usePlanning } from '@/composables/usePlanning';
import { alertService } from '@/services/alertService';
import DataTable from '@/components/DataTable/DataTable.vue';
import SelectField from '@/components/Form/SelectField.vue';

// Import CSS pour vue-select
import '@/assets/css/select2.css';

const route = useRoute();
const inventoryReference = route.params.reference as string;
const warehouseReference = route.params.warehouse as string;

const {
    // Jobs
    planningJobs,
    availableJobsForLocation,
    hasAvailableJobs,
    jobSelectOptions,
    selectedAvailable,
    selectedJobs,
    selectedJobToAddLocation,
    showJobDropdown,
    isSubmitting,
    expandedJobIds,
    createJob,
    createJobFromSelectedLocations,
    addLocationToJob,
    removeLocationFromJob,
    returnSelectedJobs,
    validateJob,

    // DataTable des locations
    tableData,
    tableColumns,
    availableLocationColumns,
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
    filters,
    sortModel,
    filterModel,
    locationSearchQuery,
    availableLocations,
    loadLocations,
    handleLocationSort,
    handleLocationPageChange,
    handleLocationPageSizeChange,
    handleLocationFilterChange,
    searchLocations,
    handleLocationServerPagination,
    locationStore,

    // Jobs du store
    storeJobs,
    storeJobsColumns,

    // Handlers pour les sélections et actions
    onAvailableSelectionChanged,
    onJobSelectionChanged,
    onSelectJobForLocation,
    onBulkValidate,
    onReturnSelectedJobs,
    onRefreshLocations,
    onLocationPaginationChanged,
    onLocationFilterChanged,

    // Paramètres de route et IDs
    storeId,
    inventoryId,
    warehouseId,
    initializeIdsFromReferences,
    refreshIdsFromReferences,

    // New handlers
    onJobPaginationChanged,
    onJobSortChanged,
    onJobFilterChanged
} = usePlanning({ inventoryReference, warehouseReference });

console.log('🔗 Paramètres de route reçus:', {
    storeId,
    inventoryReference,
    warehouseReference
});

// Keys pour forcer le re-render des tables
const availableLocationsKey = ref(0);
const jobsKey = ref(0);
const selectFieldKey = ref(0);

// État pour le SelectField
const selectedJobId = ref<string | null>(null);

// Recherche de locations
async function onSearchLocations() {
    await searchLocations(locationSearchQuery.value);
}

// Création / ajout
async function createSingleJob() {
    const ok = await createJobFromSelectedLocations();
    if (ok) {
        // Forcer le re-render seulement après création réussie
        availableLocationsKey.value++;
        jobsKey.value++;
    }
}

// Fonction pour actualiser les données et les IDs
async function onRefreshData() {
    console.log('🔄 Actualisation des données...');

    // Actualiser les IDs depuis les références
    await refreshIdsFromReferences();

    // Actualiser les locations
    await onRefreshLocations();

    // Forcer le re-render des tables
    availableLocationsKey.value++;
    jobsKey.value++;

    console.log('✅ Données actualisées');
}

// Charger les données au montage
onMounted(async () => {
    console.log('🚀 Chargement des données de planning avec les paramètres:', {
        storeId,
        inventoryReference,
        warehouseReference
    });

    // Les IDs sont automatiquement initialisés dans le composable
    await loadLocations();
});

function onJobRowExpanded(event: any) {
    // Ne rien faire, juste pour empêcher tout reload
    // console.log('Expansion ligne job:', event)
}

// Ajout d'un handler local pour le tri des emplacements
function onLocationSortChanged(sortModel: Array<{ colId: string; sort: 'asc' | 'desc' }>) {
    // Recharge les données avec le tri demandé
    loadLocations({
        ordering: sortModel.length > 0
            ? (sortModel[0].sort === 'desc' ? `-${sortModel[0].colId}` : sortModel[0].colId)
            : undefined
    });
}

console.log('tableData.length', tableData.value.length, 'pageSize', pageSize.value);
</script>

<style scoped>
.delete-location-btn:hover {
    background-color: #fee2e2 !important;
    transform: scale(1.05);
}

.delete-location-btn:active {
    transform: scale(0.95);
}

/* Enhanced search input styling */
input[type="search"] {
    background-image: none;
}

input[type="search"]::-webkit-search-decoration,
input[type="search"]::-webkit-search-cancel-button,
input[type="search"]::-webkit-search-results-button,
input[type="search"]::-webkit-search-results-decoration {
    display: none;
}
</style>
