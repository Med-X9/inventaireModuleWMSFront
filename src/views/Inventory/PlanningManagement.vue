<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4 sm:p-6 lg:p-8">
        <!-- En-tête moderne avec gradient -->
        <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 mb-6 shadow-xl border border-slate-200 dark:border-slate-700">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div class="flex-1">
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
                            <IconCalendar class="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-1">
                                Planning des magasins
                            </h1>
                            <p class="text-base text-slate-600 dark:text-slate-400">
                                Gérez le planning et l'affectation des magasins pour cet inventaire
                            </p>
                        </div>
                    </div>
                </div>
                <div class="flex flex-col sm:flex-row gap-3">
                    <button
                        class="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-700 border-2 border-primary text-slate-900 dark:text-white font-semibold rounded-xl shadow-md hover:bg-primary-50 dark:hover:bg-slate-600 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                        @click="handleGoToInventoryDetail">
                        <IconEye class="w-5 h-5" />
                        <span>Détail inventaire</span>
                    </button>
                    <button
                        class="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-light text-white font-semibold rounded-xl shadow-md hover:from-primary-dark hover:to-primary transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                        @click="handleGoToJobTracking">
                        <IconChartSquare class="w-5 h-5" />
                        <span>Suivi</span>
                    </button>
                    <ToggleButtons
                        v-model="viewMode"
                        :options="updatedViewOptions"
                        class="mt-0" />
                </div>
            </div>
        </div>

        <!-- États de chargement et erreurs -->
        <div v-if="inventoryLoading" class="flex justify-center items-center h-64 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <div class="text-slate-600 dark:text-slate-400">Recherche de l'inventaire...</div>
            </div>
        </div>

        <div v-else-if="inventoryError" class="flex justify-center items-center h-64 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-red-200 dark:border-red-800">
            <div class="text-center">
                <div class="text-red-500 text-lg font-semibold mb-2">Erreur</div>
                <div class="text-slate-600 dark:text-slate-400">{{ inventoryError }}</div>
            </div>
        </div>

        <div v-else-if="!props.reference" class="flex justify-center items-center h-64 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-red-200 dark:border-red-800">
            <div class="text-center">
                <div class="text-red-500 text-lg font-semibold mb-2">Erreur</div>
                <div class="text-slate-600 dark:text-slate-400">Aucune référence d'inventaire fournie.</div>
            </div>
        </div>

        <!-- Chargement des données de planning -->
        <div v-else-if="loading" class="flex justify-center items-center h-64 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <div class="text-slate-600 dark:text-slate-400">Chargement des données de planning...</div>
            </div>
        </div>

        <!-- Contenu principal -->
        <template v-else>
            <!-- Vue Table -->
            <div v-if="viewMode === 'table'" class="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <DataTable
                    :columns="adaptedColumns"
                    :rowDataProp="stores"
                    :actions="adaptedActions"
                    :pagination="true"
                    :enableFiltering="true"
                    :rowSelection="true"
                    :inlineEditing="false"
                    :exportTitle="'Planning Management'"
                    :showColumnSelector="false"
                    storageKey="planning_table"
                    :loading="loading"
                    :serverSidePagination="true"
                    :serverSideFiltering="true"
                    :serverSideSorting="true"
                    :debounceFilter="500"
                    @selection-changed="onSelectionChanged"
                    @row-clicked="onRowClicked"
                    @cell-value-changed="onCellValueChanged"
                    @pagination-changed="handlePaginationChanged"
                    @sort-changed="handleSortChanged"
                    @filter-changed="handleFilterChanged"
                    @global-search-changed="handleGlobalSearchChanged"
                />
            </div>

            <!-- Vue Grid -->
            <GridView
                v-else
                class="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700"
                :data="stores"
                titleField="store_name"
                :selectedItem="selectedStore"
                :onItemClick="adaptedHandleItemClick"
                enableStats
                :stats="[]"
                enableActions
                :actions="adaptedGridActions"
                showActionsIcon
                @actionsClick="adaptedHandleActionsClick"
                :itemsPerPage="6"
                enablePagination>
                <template #header>
                    <h2 class="text-xl font-semibold mb-6 text-slate-800 dark:text-slate-100">Magasins</h2>
                </template>
            </GridView>
        </template>
    </div>
</template>

<script setup lang="ts">
/**
 * Vue PlanningManagement - Gestion du planning des magasins
 *
 * Cette vue permet de :
 * - Visualiser les magasins associés à un inventaire
 * - Naviguer vers le planning ou l'affectation pour chaque magasin
 * - Basculer entre vue tableau et vue grille
 * - Gérer la pagination, le tri et le filtrage côté serveur
 *
 * @component PlanningManagement
 */

// ===== IMPORTS VUE =====
import { ref, onMounted } from 'vue'

// ===== IMPORTS SERVICES =====
import { logger } from '@/services/loggerService'

// ===== IMPORTS COMPOSANTS =====
import DataTable from '@/components/DataTable/DataTable.vue'
import ToggleButtons from '@/components/ToggleButtons/ToggleButtons.vue'
import GridView from '@/components/GridView/GridView.vue'

// ===== IMPORTS ICÔNES =====
import IconCalendar from '@/components/icon/icon-calendar.vue'
import IconListCheck from '@/components/icon/icon-list-check.vue'
import IconLayoutGrid from '@/components/icon/icon-layout-grid.vue'
import IconEye from '@/components/icon/icon-eye.vue'
import IconChartSquare from '@/components/icon/icon-chart-square.vue'

// ===== IMPORTS COMPOSABLES =====
import { usePlanningManagement } from '@/composables/usePlanningManagement'

// ===== PROPS =====

/**
 * Props du composant
 */
interface Props {
    /** Référence de l'inventaire */
    reference: string
}

const props = defineProps<Props>()

// ===== COMPOSABLE =====

/**
 * Initialisation du composable usePlanningManagement
 * Gère toute la logique métier de la page
 */
const {
    // États
    stores,
    selectedStore,
    loading,
    inventoryStatus,
    inventoryReference,
    inventoryId,
    inventoryLoading,
    inventoryError,

    // Colonnes et actions
    adaptedColumns,
    adaptedActions,
    adaptedGridActions,
    adaptedHandleItemClick,
    adaptedHandleActionsClick,

    // Méthodes
    selectStore,
    setInventoryStatus,
    setInventoryReference,
    fetchInventoryIdByReference,
    goToInventoryDetail,
    goToAffectation,
    goToJobTracking,
    initialize,

    // Handlers DataTable
    handlePaginationChanged,
    handleSortChanged,
    handleFilterChanged,
    handleGlobalSearchChanged,

    // Pagination
    currentPage,
    totalPages,
    totalItems,

    // Méthodes de chargement
    loadPlanningData
} = usePlanningManagement()

// ===== ÉTAT LOCAL =====

/**
 * Mode d'affichage (table ou grid)
 */
const viewMode = ref<'table' | 'grid'>('table')

/**
 * Options de vue avec icônes
 */
const updatedViewOptions = [
    { value: 'table', icon: IconListCheck },
    { value: 'grid', icon: IconLayoutGrid }
]

// ===== HANDLERS DATATABLE =====

/**
 * Gère le changement de sélection dans le DataTable
 *
 * @param selectedRows - Set contenant les IDs des lignes sélectionnées
 */
const onSelectionChanged = (selectedRows: Set<string>) => {
    // Gestion de la sélection si nécessaire
}

/**
 * Gère le clic sur une ligne du DataTable
 *
 * @param row - Ligne cliquée
 */
const onRowClicked = (row: any) => {
    // Gestion du clic sur une ligne si nécessaire
}

/**
 * Gère le changement de valeur d'une cellule
 *
 * @param event - Événement contenant les données de changement
 */
const onCellValueChanged = (event: { data: any; field: string; newValue: any; oldValue: any }) => {
    // Gestion du changement de valeur si nécessaire
}

// ===== HANDLERS NAVIGATION =====

/**
 * Navigue vers la page de détail de l'inventaire
 */
const handleGoToInventoryDetail = () => {
    goToInventoryDetail(props.reference)
}

/**
 * Navigue vers la page d'affectation
 */
const handleGoToAffectation = () => {
    goToAffectation(props.reference)
}

/**
 * Navigue vers la page de suivi des jobs
 */
const handleGoToJobTracking = () => {
    goToJobTracking(props.reference)
}

// ===== LIFECYCLE =====

/**
 * Initialisation au montage du composant
 */
onMounted(async () => {
    setInventoryStatus('En préparation')

    if (props.reference) {
        setInventoryReference(props.reference)
        // Initialiser le composable (résout l'ID et charge les données)
        try {
            await initialize()
        } catch (error) {
            logger.error('Erreur lors de l\'initialisation du planning management', error)
        }
    }
})
</script>
