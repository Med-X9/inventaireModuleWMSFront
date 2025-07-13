<template>
    <div class="planning-page">
        <!-- Header moderne avec informations de contexte -->
        <div class="page-header">
            <div class="header-content">
                <div class="header-left">
                    <h1 class="page-title">
                        <IconCalendar class="title-icon" />
                        Planning des jobs
                    </h1>
                    <div class="context-info">
                        <div v-if="inventoryReference" class="context-badge">
                            <span class="badge-label">Inventaire:</span>
                            <span class="badge-value">{{ inventoryReference }}</span>
                        </div>
                        <div v-if="warehouseReference" class="context-badge">
                            <span class="badge-label">Entrepôt:</span>
                            <span class="badge-value">{{ warehouseReference }}</span>
                        </div>
                    </div>
                </div>
                <div class="header-right">
                    <button class="refresh-btn" @click="onRefreshData" :disabled="isSubmitting">
                        <IconRefresh class="w-4 h-4" />
                        <span>Actualiser</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Cartes de statistiques -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon stat-jobs">
                    <IconCheck class="w-6 h-6" />
                </div>
                <div class="stat-content">
                    <div class="stat-value">{{ storeJobs.length }}</div>
                    <div class="stat-label">Jobs créés</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon stat-locations">
                    <IconBox class="w-6 h-6" />
                </div>
                <div class="stat-content">
                    <div class="stat-value">{{ tableData.length }}</div>
                    <div class="stat-label">Emplacements</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon stat-selected">
                    <IconEye class="w-6 h-6" />
                </div>
                <div class="stat-content">
                    <div class="stat-value">{{ selectedAvailable.length }}</div>
                    <div class="stat-label">Sélectionnés</div>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon stat-validated">
                    <IconCircleCheck class="w-6 h-6" />
                </div>
                <div class="stat-content">
                    <div class="stat-value">{{ selectedJobs.length }}</div>
                    <div class="stat-label">À valider</div>
                </div>
            </div>
        </div>

        <!-- Section Jobs créés -->
        <div class="section-container">
            <div class="section-header">
                <h2 class="section-title">Jobs créés</h2>
                <div class="section-actions">
                    <button @click="onBulkValidate" class="action-btn validate-btn" :disabled="isSubmitting || selectedJobs.length === 0">
                        <IconCheck class="w-4 h-4" />
                        <span>Valider ({{ selectedJobs.length }})</span>
                    </button>
                    <button @click="onReturnSelectedJobsFromStore" class="action-btn return-btn" :disabled="selectedJobs.length === 0">
                        <IconArrowLeft class="w-4 h-4" />
                        <span>Retourner ({{ selectedJobs.length }})</span>
                    </button>
                </div>
            </div>

            <div class="table-container">
                <DataTableNew
                    :key="jobsKey"
                    :columns="adaptedStoreJobsColumns"
                    :rowDataProp="storeJobs"
                    :rowSelection="true"
                    @selection-changed="onJobSelectionChanged"
                    :showColumnSelector="false"
                    storageKey="planning_jobs_table"
                    :actions="[]"
                    :pagination="true"
                    :enableFiltering="true"
                    :inlineEditing="false"
                    :exportTitle="'Jobs créés'"
                    enableRowDetails
                    groupColumn="emplacements"
                    :loading="loading"
                    :serverSidePagination="true"
                    :serverSideFiltering="true"
                    :serverSideSorting="true"
                    @pagination-changed="onJobPaginationChanged"
                    @sort-changed="onJobSortChanged"
                    @filter-changed="onJobFilterChanged"
                    ref="jobsTableRef"
                >
                </DataTableNew>
            </div>

            <div v-if="!storeJobs.length && !loading" class="empty-state">
                <IconBox class="empty-icon" />
                <h3 class="empty-title">Aucun job créé</h3>
                <p class="empty-description">Sélectionnez des emplacements dans la table ci-dessous pour créer un job</p>
            </div>
        </div>

        <!-- Section Emplacements disponibles -->
        <div class="section-container">
            <div class="section-header">
                <h2 class="section-title">Emplacements disponibles</h2>
                <div class="section-actions">
                    <button @click="createSingleJob" class="action-btn create-btn" :disabled="selectedAvailable.length === 0">
                        <IconPlus class="w-4 h-4" />
                        <span>Créer Job ({{ selectedAvailable.length }})</span>
                    </button>
                    <div v-if="hasAvailableJobs" class="job-selector">
                        <SelectField
                            :key="`job-select-${selectFieldKey}`"
                            v-model="selectedJobId"
                            :options="jobSelectOptions"
                            :searchable="true"
                            :clearable="true"
                            :compact="true"
                            placeholder="Ajouter à un job existant..."
                            no-options-text="Aucun job trouvé"
                            @update:modelValue="onSelectJobForLocation"
                        />
                    </div>
                </div>
            </div>


            <div class="table-container">
                <DataTableNew
                    :key="availableLocationsKey"
                    :columns="adaptedAvailableLocationColumns"
                    :rowDataProp="tableData"
                    :pagination="true"
                    :rowSelection="true"
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
                    @pagination-changed="onLocationPaginationChanged"
                    @sort-changed="onLocationSortChanged"
                    @filter-changed="onLocationFilterChanged"
                    ref="availableLocationsTableRef"
                />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref,  onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { usePlanning } from '@/composables/usePlanning';
import DataTableNew from '@/components/DataTable/DataTableNew.vue';
import SelectField from '@/components/Form/SelectField.vue';

// Import des icônes
import IconCalendar from '@/components/icon/icon-calendar.vue';
import IconCheck from '@/components/icon/icon-check.vue';
import IconBox from '@/components/icon/icon-box.vue';
import IconEye from '@/components/icon/icon-eye.vue';
import IconCircleCheck from '@/components/icon/icon-circle-check.vue';
import IconRefresh from '@/components/icon/icon-refresh.vue';
import IconPlus from '@/components/icon/icon-plus.vue';
import IconArrowLeft from '@/components/icon/icon-arrow-left.vue';

// Import CSS pour vue-select
import '@/assets/css/select2.css';

const route = useRoute();
const inventoryReference = route.params.reference as string;
const warehouseReference = route.params.warehouse as string;

const {
    // Jobs

    hasAvailableJobs,
    jobSelectOptions,
    selectedAvailable,
    selectedJobs,
    selectedJobToAddLocation,
    isSubmitting,
    expandedJobIds,
    createJobFromSelectedLocations,
    addLocationToJob,
    removeLocationFromJob,
    returnSelectedJobs,
    validateJob,
    validateJobs,
    loading,

    // DataTable des locations
    tableData,
    pageSize,

    locationSearchQuery,
    loadLocations,

    searchLocations,
    handleLocationServerPagination,

    // Jobs du store
    storeJobs,

    // Handlers pour les sélections et actions
    onAvailableSelectionChanged,
    onJobSelectionChanged,
    onSelectJobForLocation,
    onReturnSelectedJobsFromStore,
    onRefreshLocations,
    onLocationPaginationChanged,
    onLocationFilterChanged,
    onJobPaginationChanged,
    onJobSortChanged,
    onJobFilterChanged
} = usePlanning({ inventoryReference, warehouseReference });

console.log('🔗 Paramètres de route reçus:', {
    inventoryReference,
    warehouseReference
});

// Keys pour forcer le re-render des tables
const availableLocationsKey = ref(0);
const jobsKey = ref(0);
const selectFieldKey = ref(0);

// Références aux DataTableNew pour vider les sélections
const availableLocationsTableRef = ref();
const jobsTableRef = ref();

// État pour le SelectField - utiliser la variable du composable
const selectedJobId = selectedJobToAddLocation;

// Adapter les colonnes pour DataTableNew.vue
const adaptedStoreJobsColumns = computed(() => [

    {
        field: 'id',
        headerName: 'ID',
        sortable: true,
        filterable: true,
        width: 80,
        editable: false,
        hide: true,
        description: 'Identifiant unique du job',
        draggable: true,
        autoSize: true
    },
    {
        field: 'reference',
        headerName: 'Référence',
        sortable: true,
        filterable: true,
        width: 200,
        editable: false,
        draggable: true,
        autoSize: true
    },
    {
        field: 'status',
        headerName: 'Statut',
        sortable: true,
        filterable: true,
        width: 120,
        editable: false,
        draggable: true,
        autoSize: true,
        badgeStyles: [
            { value: 'EN ATTENTE', class: 'inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-yellow-600/20 ring-inset' },
            { value: 'VALIDE', class: 'inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-800 ring-1 ring-green-600/20 ring-inset' }
        ],
        badgeDefaultClass: 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset'
    },
    {
    field: 'emplacements',
    headerName: 'Emplacements',
    sortable: false,
    filterable: false,
    nestedData: {
        key: 'emplacements',
        displayKey: 'location_reference',
        countSuffix: 'emplacements',
        expandable: true
    },
    draggable: true,
    autoSize: true
    },
    {
        field: 'created_at',
        headerName: 'Date création',
        sortable: true,
        filterable: true,
        width: 120,
        editable: false,
        draggable: true,
        autoSize: true,
        dataType: 'date' as const,
        dateFormat: 'fr-FR',
        dateOptions: {
            year: 'numeric' as const,
            month: '2-digit' as const,
            day: '2-digit' as const
        }
    }
]);

const adaptedAvailableLocationColumns = computed(() => [
    {
        field: 'id',
        headerName: 'ID',
        hide: true, // Masquée par défaut
        description: 'Identifiant unique',
        sortable: true,
        filterable: true
    },
    {
        field: 'reference',
        headerName: 'Référence',
        sortable: true,
        filterable: true,
        width: 150,
        editable: false,
        draggable: true,
        autoSize: true
    },
    {
        field: 'location_reference',
        headerName: 'Réf. Location',
        sortable: true,
        filterable: true,
        width: 150,
        editable: false,
        draggable: true,
        autoSize: true
    },
    {
        field: 'sous_zone',
        headerName: 'Sous-zone',
        sortable: true,
        filterable: true,
        width: 120,
        editable: false,
        draggable: true,
        autoSize: true
    },
    {
        field: 'zone',
        headerName: 'Zone',
        sortable: true,
        filterable: true,
        width: 120,
        editable: false,
        draggable: true,
        autoSize: true
    },
]);

// Debug: vérifier les données passées au DataTable
console.log('🔍 Données des emplacements disponibles:', tableData.value);
console.log('🔍 Premier emplacement:', tableData.value[0]);

// Debug: vérifier les données des jobs
console.log('🔍 Données des jobs:', storeJobs.value);
console.log('🔍 Premier job:', storeJobs.value[0]);
console.log('🔍 Emplacements du premier job:', storeJobs.value[0]?.emplacements);

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

        // Vider les sélections dans les tables
        if (availableLocationsTableRef.value) {
            availableLocationsTableRef.value.clearAllSelections();
        }
    }
}

// Handler pour la validation en masse
async function onBulkValidate() {
    await validateJobs(selectedJobs.value);

    // Vider les sélections dans la table des jobs
    if (jobsTableRef.value) {
        jobsTableRef.value.clearAllSelections();
    }
}

// Fonction pour actualiser les données et les IDs
async function onRefreshData() {
    console.log('🔄 Actualisation des données...');

    // Actualiser les IDs depuis les références
    // await refreshIdsFromReferences(); // This line was removed from the composable

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
        inventoryReference,
        warehouseReference
    });

    // Les IDs sont automatiquement initialisés dans le composable
    await loadLocations();

    // Ajouter event listener pour l'expansion des jobs (seulement sur l'icône)
    document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const chevronIcon = target.closest('.chevron-icon');
        if (chevronIcon) {
            const jobId = chevronIcon.getAttribute('data-job-id');
            if (jobId) {
                if (expandedJobIds.value.has(jobId)) {
                    expandedJobIds.value.delete(jobId);
                } else {
                    expandedJobIds.value.add(jobId);
                }
                jobsKey.value++;
            }
        }
    });
});

// Ajout d'un handler local pour le tri des emplacements
function onLocationSortChanged(sortModel: Array<{ field: string; direction: 'asc' | 'desc' }>) {
    // Recharge les données avec le tri demandé
    loadLocations({
        ordering: sortModel.length > 0
            ? (sortModel[0].direction === 'desc' ? `-${sortModel[0].field}` : sortModel[0].field)
            : undefined
    });
}

console.log('tableData.length', tableData.value.length, 'pageSize', pageSize.value);
</script>

<style scoped>
/* Page principale */
.planning-page {
    min-height: 100vh;
    background: #ffffff;
    padding: 2rem;
}

/* Header de la page */
.page-header {
    background: #ffffff;
    border-radius: 20px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 20px rgba(139, 142, 148, 0.08);
    border: 1px solid #B4B6BA;
}

.header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
}

.header-left {
    flex: 1;
}

.page-title {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 2.5rem;
    font-weight: 800;
    color: #8A8E94;
    margin: 0 0 1rem 0;
}

.title-icon {
    width: 2.5rem;
    height: 2.5rem;
    color: #FECD1C;
}

.context-info {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.context-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #ffffff;
    border: 1px solid #B4B6BA;
    border-radius: 12px;
    font-size: 0.9rem;
}

.badge-label {
    color: #8A8E94;
    font-weight: 600;
}

.badge-value {
    color: #8A8E94;
    font-weight: 700;
    padding: 0.25rem 0.75rem;
    background: #FECD1C;
    border-radius: 8px;
    color: #8A8E94;
}

.refresh-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 2rem;
    background: #FECD1C;
    color: #8A8E94;
    border: none;
    border-radius: 16px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 16px rgba(254, 205, 28, 0.3);
}

.refresh-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(254, 205, 28, 0.4);
}

.refresh-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

/* Grille de statistiques */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: #ffffff;
    border-radius: 20px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(139, 142, 148, 0.08);
    border: 1px solid #B4B6BA;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    min-height: 120px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: #FECD1C;
}

.stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(139, 142, 148, 0.12);
}

.stat-card:nth-child(1) {
    --stat-color: #FACC15;
    --stat-color-light: #EAB308;
}

.stat-card:nth-child(2) {
    --stat-color: #3b82f6;
    --stat-color-light: #1d4ed8;
}

.stat-card:nth-child(3) {
    --stat-color: #10b981;
    --stat-color-light: #059669;
}

.stat-card:nth-child(4) {
    --stat-color: #f59e0b;
    --stat-color-light: #d97706;
}

.stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 12px;
    margin-bottom: 1rem;
    background: #FECD1C;
    color: #8A8E94;
    box-shadow: 0 4px 12px rgba(139, 142, 148, 0.15);
    flex-shrink: 0;
}

.stat-content {
    text-align: left;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.stat-value {
    font-size: 2rem;
    font-weight: 800;
    color: #8A8E94;
    margin-bottom: 0.5rem;
    line-height: 1;
}

.stat-label {
    font-size: 0.9rem;
    color: #B4B6BA;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* Sections */
.section-container {
    background: #ffffff;
    border-radius: 20px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 20px rgba(139, 142, 148, 0.08);
    border: 1px solid #B4B6BA;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #B4B6BA;
}

.section-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #8A8E94;
    margin: 0;
}

.section-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.action-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 12px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
}

.validate-btn {
    background: #FECD1C;
    color: #8A8E94;
    box-shadow: 0 4px 12px rgba(254, 205, 28, 0.3);
}

.validate-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(254, 205, 28, 0.4);
}

.return-btn {
    background: #B4B6BA;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(180, 182, 186, 0.3);
}

.return-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(180, 182, 186, 0.4);
}

.create-btn {
    background: #FECD1C;
    color: #8A8E94;
    box-shadow: 0 4px 12px rgba(254, 205, 28, 0.3);
}

.create-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(254, 205, 28, 0.4);
}

.action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

/* Job selector */
.job-selector {
    min-width: 250px;
}

/* Search container */
.search-container {
    margin-bottom: 1.5rem;
}

.search-wrapper {
    position: relative;
    max-width: 400px;
}

.search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    height: 1rem;
    color: #B4B6BA;
    z-index: 1;
}

.search-input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    border: 2px solid #B4B6BA;
    border-radius: 12px;
    font-size: 0.9rem;
    background-color: #ffffff;
    transition: all 0.2s ease;
    color: #8A8E94;
}

.search-input:focus {
    outline: none;
    border-color: #FECD1C;
    background-color: #ffffff;
    box-shadow: 0 0 0 3px rgba(254, 205, 28, 0.1);
}

.search-input::placeholder {
    color: #B4B6BA;
}

/* Table container */
.table-container {
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #B4B6BA;
}

/* Empty state */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
    border: 2px dashed #B4B6BA;
    border-radius: 16px;
    background: #ffffff;
}

.empty-icon {
    width: 4rem;
    height: 4rem;
    color: #B4B6BA;
    margin-bottom: 1rem;
}

.empty-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #8A8E94;
    margin-bottom: 0.5rem;
}

.empty-description {
    color: #B4B6BA;
    font-size: 0.9rem;
    max-width: 400px;
}

/* Responsive */
@media (max-width: 768px) {
    .planning-page {
        padding: 1rem;
    }

    .header-content {
        flex-direction: column;
        gap: 1.5rem;
        text-align: center;
    }

    .page-title {
        font-size: 2rem;
        justify-content: center;
    }

    .context-info {
        justify-content: center;
    }

    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }

    .section-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }

    .section-actions {
        flex-direction: column;
        gap: 0.75rem;
    }

    .action-btn {
        justify-content: center;
    }

    .job-selector {
        min-width: auto;
    }
}

@media (max-width: 480px) {
    .stats-grid {
        grid-template-columns: 1fr;
    }

    .page-title {
        font-size: 1.75rem;
    }
}

/* Styles pour les emplacements avec icône */
.emplacements-cell {
    padding: 0.5rem 0;
}

.emplacements-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    padding: 0.25rem 0;
    border-radius: 6px;
    transition: all 0.2s ease;
}

.emplacements-header:hover {
    background-color: rgba(254, 205, 28, 0.1);
}

.chevron-icon {
    transition: transform 0.2s ease;
    flex-shrink: 0;
}

.chevron-icon.chevron-down {
    transform: rotate(90deg);
}

.chevron-icon.chevron-right {
    transform: rotate(0deg);
}

.emplacements-count {
    font-size: 0.9rem;
    color: #8A8E94;
    font-weight: 600;
}

.emplacements-list {
    margin-top: 0.5rem;
    padding-left: 1.5rem;
    border-left: 2px solid #FECD1C;
    animation: slideDown 0.3s ease;
}

.emplacement-item {
    padding: 0.25rem 0;
    font-size: 0.85rem;
    color: #8A8E94;
    font-family: 'Courier New', monospace;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
