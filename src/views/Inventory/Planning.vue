<template>
    <div class="planning-page">
        <!-- Header avec titre et navigation -->
        <div class="page-header">
            <div class="header-content">
                <div class="header-left">
                    <h1 class="page-title">
                        <IconCalendar class="title-icon" />
                        Planning des jobs
                    </h1>
                </div>
                <div class="navigation-buttons header-right">
                    <button class="nav-btn detail-btn flex items-center gap-2" @click="handleGoToInventoryDetail">
                        <IconEye class="w-4 h-4 text-white" />
                    </button>
                    <button class="nav-btn affectation-btn flex items-center gap-2" @click="handleGoToAffectation">
                        <IconUser class="w-4 h-4 text-white" />
                    </button>
                </div>
            </div>
        </div>

        <!-- Grille de statistiques -->
        <div class="stats-grid">
            <div class="stat-card small">
                <div class="stat-header">
                    <div class="stat-icon stat-jobs">
                        <IconCheck class="w-4 h-4" />
                    </div>
                    <div class="stat-value">{{ jobs.length }}</div>
                </div>
                <div class="stat-label">Jobs créés</div>
            </div>

            <div class="stat-card small">
                <div class="stat-header">
                    <div class="stat-icon stat-locations">
                        <IconBox class="w-4 h-4" />
                    </div>
                    <div class="stat-value">{{ locations.length }}</div>
                </div>
                <div class="stat-label">Emplacements</div>
            </div>

            <div class="stat-card small">
                <div class="stat-header">
                    <div class="stat-icon stat-selected">
                        <IconEye class="w-4 h-4" />
                    </div>
                    <div class="stat-value">{{ availableLocations.length }}</div>
                </div>
                <div class="stat-label">Sélectionnés</div>
            </div>

            <div class="stat-card small">
                <div class="stat-header">
                    <div class="stat-icon stat-validated">
                        <IconCircleCheck class="w-4 h-4" />
                    </div>
                    <div class="stat-value">{{ selectedJobsCount }}</div>
                </div>
                <div class="stat-label">À valider</div>
            </div>
        </div>

        <!-- Section Jobs créés -->
        <div class="datatable-container">
            <div class="section-header">
                <h2 class="section-title">Jobs créés</h2>
                <div class="section-actions">
                    <button @click="onBulkValidateHandler" class="action-btn validate-btn"
                        :disabled="planningState.isSubmitting || selectedJobsCount === 0">
                        <IconCheck class="w-4 h-4" />
                        <span>Valider ({{ selectedJobsCount }})</span>
                    </button>
                    <button @click="onReturnSelectedJobs" class="action-btn return-btn"
                        :disabled="selectedJobsCount === 0">
                        <IconArrowLeft class="w-4 h-4" />
                        <span>Retourner ({{ selectedJobsCount }})</span>
                    </button>
                </div>
            </div>

            <!-- DataTable des jobs -->
            <DataTable :key="jobsKey" :columns="adaptedStoreJobsColumns" :rowDataProp="jobs"
                :rowSelection="true" @selection-changed="onJobSelectionChanged" :showColumnSelector="false"
                storageKey="planning_jobs_table" :actions="[]" :pagination="true" :enableFiltering="true"
                :inlineEditing="false" :exportTitle="'Jobs créés'" :loading="loading"
                :serverSidePagination="true" :serverSideFiltering="true" :serverSideSorting="true"
                :customDataTableParams="jobsCustomParams"
                @pagination-changed="onJobPaginationChanged" @sort-changed="onJobSortChanged"
                @filter-changed="onJobFilterChanged" ref="jobsTableRef">
                <!-- Slot pour les actions dans la table imbriquée des emplacements -->
                <template #nested-actions="{ item, parentRow } ">
                    <button
                        class="btn-supprimer-emplacement"
                        :data-job-id="parentRow.id"
                        :data-location-id="item.id"
                        @click="removeLocationFromNestedTable(parentRow.id.toString(), item.location_reference)"
                        title="Supprimer cet emplacement"
                        style="background: #ef4444; color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; cursor: pointer;">
                        <IconTrash class="w-3 h-3" />
                    </button>
                </template>
            </DataTable>
        </div>

        <!-- Section Emplacements disponibles -->
        <div class="datatable-container">
            <div class="section-header">
                <h2 class="section-title">Emplacements disponibles</h2>
                <div class="section-actions">
                    <button @click="createSingleJob" class="action-btn create-btn"
                        :disabled="planningState.selectedAvailable.length === 0">
                        <IconPlus class="w-4 h-4" />
                        <span>Créer Job ({{ planningState.selectedAvailable.length }})</span>
                    </button>
                    <div v-if="hasAvailableJobs" class="job-selector">
                        <SelectField :key="`job-select-${selectFieldKey}`" v-model="planningState.selectedJobToAddLocation"
                            :options="jobSelectOptions" :searchable="true" :clearable="true" :compact="true"
                            placeholder="Ajouter à un job existant..." no-options-text="Aucun job trouvé"
                            @update:modelValue="onSelectJobForLocation" />
                    </div>
                </div>
            </div>

            <!-- DataTable des locations disponibles -->
            <DataTable :key="availableLocationsKey" :columns="adaptedAvailableLocationColumns as any"
                :rowDataProp="locations" :pagination="true" :rowSelection="true"
                :totalItemsProp="locationsTotalItems" :pageSizeProp="locationsPageSize"
                @selection-changed="onAvailableSelectionChanged" storageKey="available_locations"
                :showColumnSelector="false" :actions="[]" :enableFiltering="true" :inlineEditing="false"
                :exportTitle="'Emplacements disponibles'" :loading="loading" :serverSidePagination="true"
                :serverSideFiltering="true" :serverSideSorting="true" :customDataTableParams="locationsCustomParams"
                @pagination-changed="onLocationPaginationChanged"
                @sort-changed="onLocationSortChanged" @filter-changed="onLocationFilterChanged"
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
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// ===== IMPORTS SERVICES =====
import { logger } from '@/services/loggerService'

// ===== IMPORTS COMPOSABLES =====
import { usePlanning } from '@/composables/usePlanning'

// ===== IMPORTS COMPOSANTS =====
import DataTable from '@/components/DataTable/DataTable.vue'
import SelectField from '@/components/Form/SelectField.vue'

// ===== IMPORTS ICÔNES =====
import IconCalendar from '@/components/icon/icon-calendar.vue'
import IconCheck from '@/components/icon/icon-check.vue'
import IconBox from '@/components/icon/icon-box.vue'
import IconEye from '@/components/icon/icon-eye.vue'
import IconCircleCheck from '@/components/icon/icon-circle-check.vue'
import IconPlus from '@/components/icon/icon-plus.vue'
import IconArrowLeft from '@/components/icon/icon-arrow-left.vue'
import IconUser from '@/components/icon/icon-user.vue'
import IconTrash from '@/components/icon/icon-trash.vue'

// ===== IMPORTS STYLES =====
import '@/assets/css/select2.css'

// ===== ROUTER =====
const route = useRoute()
const router = useRouter()

// ===== COMPOSABLE =====

/**
 * Initialisation du composable usePlanning
 * Récupère toutes les méthodes, états et handlers nécessaires
 */
const {
    // État
    jobs,
    locations,
    availableLocations,
    planningState,
    paginationState,
    filterState,
    loading,

    // Computed properties additionnelles
    hasAvailableJobs,
    jobSelectOptions,

    // Actions principales
    createJobFromSelectedLocations,
    applyJobFilters,
    applyLocationFilters,

    // Gestionnaires d'état
    updateSelection,
    clearSelection,
    updatePagination,
    updateFilters,

    // Handlers pour DataTable
    onJobPaginationChanged,
    onJobSortChanged,
    onJobFilterChanged,
    onLocationPaginationChanged,
    onLocationSortChanged,
    onLocationFilterChanged,
    onAvailableSelectionChanged,
    onJobSelectionChanged,
    resetAllSelections,
    onSelectJobForLocation,
    onBulkValidate,
    onReturnSelectedJobs,
    onRefreshLocations,
    onRefreshData,
    onNestedTableFilterChanged,

    // Colonnes adaptées
    adaptedStoreJobsColumns,
    adaptedAvailableLocationColumns,

    // Pagination
    locationsTotalItems,
    locationsPageSize,

    // Navigation
    inventoryReference,
    warehouseReference,
    inventoryId,
    accountId,
    warehouseId
} = usePlanning({
    inventoryReference: route.params.reference as string,
    warehouseReference: route.params.warehouse as string
})

// ===== COMPUTED PROPERTIES =====

/**
 * Nombre de jobs sélectionnés
 */
const selectedJobsCount = computed(() => {
    return planningState.value.selectedJobs.length
})

/**
 * Paramètres personnalisés pour la DataTable des jobs
 * Inclut les IDs nécessaires pour les appels API
 */
const jobsCustomParams = computed(() => ({
    inventory_id: inventoryId.value,
    warehouse_id: warehouseId.value
}))

/**
 * Paramètres personnalisés pour la DataTable des locations
 * Inclut les IDs nécessaires pour les appels API
 */
const locationsCustomParams = computed(() => ({
    account_id: accountId.value,
    inventory_id: inventoryId.value,
    warehouse_id: warehouseId.value
}))

// ===== RÉFÉRENCES =====

/** Clés pour forcer le re-render des tables */
const availableLocationsKey = ref(0)
const jobsKey = ref(0)
const selectFieldKey = ref(0)

/** Références aux composants DataTable pour accéder à leurs méthodes */
const availableLocationsTableRef = ref()
const jobsTableRef = ref()

// ===== MÉTHODES =====

/**
 * Réinitialiser les sélections dans les DataTables via les refs
 * Appelée après certaines actions pour synchroniser l'état visuel
 */
const resetDataTableSelections = () => {
    nextTick(() => {
        if (availableLocationsTableRef.value) {
            availableLocationsTableRef.value.clearAllSelections()
        }
        if (jobsTableRef.value) {
            jobsTableRef.value.clearAllSelections()
        }
    })
}

/**
 * Handler pour la validation en masse des jobs
 */
async function onBulkValidateHandler() {
    await onBulkValidate()
}

/**
 * Supprimer un emplacement d'un job (depuis la table imbriquée)
 *
 * @param jobId - ID du job
 * @param locationReference - Référence de l'emplacement à supprimer
 */
async function removeLocationFromNestedTable(jobId: string, locationReference: string) {
    try {
        // TODO: Implémenter la logique de suppression d'emplacement
        await onRefreshData()
    } catch (error) {
        logger.error('Erreur lors de la suppression de l\'emplacement', error)
    }
}

/**
 * Créer un job depuis les emplacements sélectionnés
 */
async function createSingleJob() {
    const ok = await createJobFromSelectedLocations()
    if (ok) {
        // Le composable gère déjà la réinitialisation des sélections
    }
}

/**
 * Navigation vers la page de détail de l'inventaire
 */
const handleGoToInventoryDetail = () => {
    router.push({
        name: 'inventory-detail',
        params: { reference: inventoryReference }
    })
}

/**
 * Navigation vers la page d'affectation
 */
const handleGoToAffectation = () => {
    router.push({
        name: 'inventory-affecter',
        params: {
            reference: inventoryReference,
            warehouse: warehouseReference
        }
    })
}

// ===== WATCHERS =====

/**
 * Flags pour éviter les boucles infinies lors de la réinitialisation des sélections
 */
let isResettingSelections = false
let isInitialMount = true

/**
 * Watcher pour surveiller les changements de sélection
 * Réinitialise les DataTables quand les sélections passent de non-vides à vides
 */
watch(
    () => [planningState.value.selectedAvailable.length, planningState.value.selectedJobs.length],
    ([availableLength, jobsLength], [oldAvailableLength, oldJobsLength]) => {
        // Ignorer le premier déclenchement au montage
        if (isInitialMount) {
            isInitialMount = false
            return
        }

        // Éviter les boucles infinies
        if (isResettingSelections) return

        // Si les sélections passent de non-vides à vides, réinitialiser aussi les DataTables
        if (availableLength === 0 && jobsLength === 0 && (oldAvailableLength > 0 || oldJobsLength > 0)) {
            isResettingSelections = true
            resetDataTableSelections()
            setTimeout(() => {
                isResettingSelections = false
            }, 100)
        }
    },
    { immediate: false }
)

// ===== LIFECYCLE =====

/**
 * Initialisation au montage du composant
 */
onMounted(async () => {
    // Le composable usePlanning gère automatiquement l'initialisation des données
    // dans son propre onMounted

    // Ajouter event listener pour l'expansion des jobs (seulement sur l'icône)
    document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement
        const chevronIcon = target.closest('.chevron-icon')
        if (chevronIcon) {
            const jobId = chevronIcon.getAttribute('data-job-id')
            if (jobId) {
                if (planningState.value.expandedJobIds.has(jobId)) {
                    planningState.value.expandedJobIds.delete(jobId)
                } else {
                    planningState.value.expandedJobIds.add(jobId)
                }
                jobsKey.value++
            }
        }
    })
})
</script>

<style scoped>
/* ===== PAGE PRINCIPALE ===== */
.planning-page {
    min-height: 100vh;
    background: #ffffff;
    padding: 2rem;
}

/* ===== HEADER ===== */
.page-header {
    background: #ffffff;
    border-radius: 20px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #e5e7eb;
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
    color: #1e293b;
    margin: 0 0 0.5rem 0;
}

.title-icon {
    width: 2.5rem;
    height: 2.5rem;
    color: var(--color-primary);
}

.navigation-buttons {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
}

.nav-btn {
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
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    color: #1e293b;
    box-shadow: 0 4px 12px rgba(250, 204, 21, 0.3);
}

.nav-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(250, 204, 21, 0.4);
}

.nav-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

/* ===== STATISTIQUES ===== */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.75rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: #ffffff;
    border-radius: 12px;
    padding: 0.75rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    border: 1px solid #e5e7eb;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    min-height: 60px;
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
    height: 2px;
    background: linear-gradient(90deg, var(--stat-color), var(--stat-color-light));
}

.stat-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.1);
}

.stat-card:nth-child(1),
.stat-card:nth-child(2),
.stat-card:nth-child(3),
.stat-card:nth-child(4) {
    --stat-color: var(--color-primary);
    --stat-color-light: var(--color-primary-light);
    grid-column: span 1;
}

.stat-card.small {
    grid-column: span 1;
    padding: 0.5rem;
    min-height: 50px;
}

.stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 6px;
    background: linear-gradient(135deg, var(--stat-color) 0%, var(--stat-color-light) 100%);
    color: #1e293b;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
}

.stat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.25rem;
}

.stat-value {
    font-size: 1.25rem;
    font-weight: 800;
    color: #1e293b;
    line-height: 1;
    text-align: right;
}

.stat-label {
    font-size: 0.625rem;
    color: #64748b;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.2px;
    line-height: 1.2;
    text-align: left;
}

/* ===== CONTAINER DATATABLE ===== */
.datatable-container {
    background: #ffffff;
    border-radius: 20px;
    padding: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #e5e7eb;
    margin-bottom: 2rem;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
}

.section-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
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
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    color: #1e293b;
    box-shadow: 0 4px 12px rgba(250, 204, 21, 0.3);
}

.validate-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(250, 204, 21, 0.4);
}

.return-btn {
    background: linear-gradient(135deg, #64748b 0%, #475569 100%);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(100, 116, 139, 0.3);
}

.return-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(100, 116, 139, 0.4);
}

.create-btn {
    background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
    color: #1e293b;
    box-shadow: 0 4px 12px rgba(250, 204, 21, 0.3);
}

.create-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(250, 204, 21, 0.4);
}

.action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.job-selector {
    min-width: 250px;
}

/* ===== RESPONSIVE ===== */
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

    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
    }

    .stat-card {
        padding: 0.5rem;
        min-height: 45px;
    }

    .stat-value {
        font-size: 1.125rem;
    }

    .stat-label {
        font-size: 0.5rem;
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

    .datatable-container {
        padding: 1rem;
    }
}

@media (max-width: 480px) {
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 0.375rem;
    }

    .stat-card {
        padding: 0.375rem;
        min-height: 40px;
    }

    .stat-value {
        font-size: 1rem;
    }

    .stat-label {
        font-size: 0.45rem;
    }

    .page-title {
        font-size: 1.75rem;
    }
}
</style>
