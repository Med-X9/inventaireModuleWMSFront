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

        <!-- Erreur de chargement des données de planning -->
        <div v-else-if="dataTableError" class="flex justify-center items-center h-64 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-red-200 dark:border-red-800">
            <div class="text-center">
                <div class="text-red-500 text-lg font-semibold mb-4">Erreur de chargement</div>
                <div class="text-slate-600 dark:text-slate-400 mb-6">{{ dataTableError }}</div>
                <button
                    @click="retryLoadStores"
                    class="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl shadow-md hover:bg-primary-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                    <IconCalendar class="w-5 h-5" />
                    Réessayer
                </button>
            </div>
        </div>

        <!-- Contenu principal -->
        <template v-else>
            <!-- Vue Table -->
        <div v-if="viewMode === 'table'" class="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <DataTable
                :columns="adaptedColumns"
                :actions="adaptedActions"
                :rowDataProp="stores"
                :serverSidePagination="true"
                :pagination="true"
                storageKey="planning-management"
                @filter-changed="handleFilterChanged"
                @pagination-changed="handlePaginationChanged"
                @sort-changed="handleSortChanged"
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
 * Page de gestion du planning des magasins
 *
 * Affiche une table des magasins avec possibilité de :
 * - Consulter le planning de chaque magasin
 * - Affecter des ressources aux magasins
 * - Monitorer l'activité des magasins
 * - Basculer entre vue tableau et vue grille
 *
 * @component PlanningManagement
 */

// ===== IMPORTS =====
import { ref, onMounted, watch } from 'vue'
import DataTable from '@/components/DataTable/DataTable.vue'
import ToggleButtons from '@/components/ToggleButtons/ToggleButtons.vue'
import GridView from '@/components/GridView/GridView.vue'
import { usePlanningManagement } from '@/composables/usePlanningManagement'

// ===== IMPORTS ICÔNES =====
import IconCalendar from '@/components/icon/icon-calendar.vue'
import IconListCheck from '@/components/icon/icon-list-check.vue'
import IconLayoutGrid from '@/components/icon/icon-layout-grid.vue'
import IconEye from '@/components/icon/icon-eye.vue'

// ===== PROPS =====
interface Props {
    reference: string
}

const props = defineProps<Props>()

// ===== COMPOSABLE PRINCIPAL =====
const {
    // Données
    stores,
    loadStores,

    // États
    selectedStore,
    loading,
    dataTableError,
    inventoryLoading,
    inventoryError,

    // Configuration DataTable
    adaptedColumns,
    adaptedActions,
    adaptedGridActions,

    // Navigation
    goToInventoryDetail,

    // Handlers DataTable
    handlePaginationChanged,
    handleSortChanged,
    handleFilterChanged,
    handleGlobalSearchChanged,

    // Handlers GridView
    adaptedHandleItemClick,
    adaptedHandleActionsClick,

    // Initialisation
    initialize,
    retryLoadStores,

    // Export
    handleExportCsv,
    handleExportExcel
} = usePlanningManagement(props.reference)

// ===== ÉTATS LOCAUX =====
const viewMode = ref<'table' | 'grid'>('table')

const updatedViewOptions = [
    { value: 'table', icon: IconListCheck },
    { value: 'grid', icon: IconLayoutGrid }
]

// ===== UTILITAIRES =====
const handleGoToInventoryDetail = () => {
    goToInventoryDetail(props.reference)
}

// ===== LIFECYCLE =====
onMounted(async () => {
    if (props.reference) {
        try {
            await initialize()
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du planning management:', error)
        }
    }
})
</script>
