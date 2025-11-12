<template>
    <div>
        <!-- En-tête moderne -->
        <div class="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-gray-200">
            <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <IconCalendar class="w-7 h-7 text-yellow-400" />
                Planning des magasins
            </h1>
            <ToggleButtons v-model="viewMode" :options="updatedViewOptions" class="mt-4 sm:mt-0" />
        </div>

        <!-- Raccourci vers le détail de l'inventaire -->
        <div class="flex justify-end mb-6">
            <div class="navigation-buttons">
                <button class="nav-btn detail-btn flex items-center gap-2" @click="handleGoToInventoryDetail">
                    <IconEye class="w-4 h-4 text-white" />
                </button>
            </div>
        </div>

        <!-- Chargement de l'inventaire -->
        <div v-if="inventoryLoading" class="flex justify-center items-center h-64">
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <div class="text-gray-600">Recherche de l'inventaire...</div>
            </div>
        </div>

        <!-- Erreur de récupération de l'inventaire -->
        <div v-else-if="inventoryError" class="flex justify-center items-center h-64">
            <div class="text-center">
                <div class="text-red-500 text-lg font-semibold mb-2">Erreur</div>
                <div class="text-gray-600">{{ inventoryError }}</div>
            </div>
        </div>

        <!-- Message d'erreur si pas de référence -->
        <div v-else-if="!props.reference" class="flex justify-center items-center h-64">
            <div class="text-center">
                <div class="text-red-500 text-lg font-semibold mb-2">Erreur</div>
                <div class="text-gray-600">Aucune référence d'inventaire fournie.</div>
            </div>
        </div>

        <!-- Chargement des données de planning -->
        <div v-else-if="loading" class="flex justify-center items-center h-64">
            <div class="text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <div class="text-gray-600">Chargement des données de planning...</div>
            </div>
        </div>

        <!-- Contenu principal -->
        <template v-else>
            <div v-if="viewMode === 'table'" class="panel py-4 animate-fade-in bg-white rounded-2xl shadow-md border border-gray-100">
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
            <GridView v-else class="panel animate-fade-in border border-white-dark/20 bg-white rounded-2xl shadow-md"
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
                    <h2 class="text-xl font-semibold mb-6 text-gray-800">Magasins</h2>
                </template>
            </GridView>
        </template>

        <!-- Suppression du menu contextuel car les fonctions ne sont pas implémentées -->
    </div>
</template>


<script setup lang="ts">
import { ref, onMounted } from 'vue';
import DataTable from '@/components/DataTable/DataTable.vue';
import ToggleButtons from '@/components/ToggleButtons/ToggleButtons.vue';
import GridView from '@/components/GridView/GridView.vue';
import IconCalendar from '@/components/icon/icon-calendar.vue';
import IconListCheck from '@/components/icon/icon-list-check.vue';
import IconLayoutGrid from '@/components/icon/icon-layout-grid.vue';
import IconEye from '@/components/icon/icon-eye.vue';
import { usePlanningManagement } from '@/composables/usePlanningManagement';

// Props
interface Props {
    reference: string;
}
const props = defineProps<Props>();

// Utiliser le nouveau composable usePlanning
const {
    // États du planning management
    stores,
    selectedStore,
    loading,
    inventoryStatus,
    inventoryReference,
    inventoryId,
    inventoryLoading,
    inventoryError,

    // Colonnes et actions
    actions,
    adaptedColumns,
    adaptedActions,
    adaptedGridActions,
    adaptedHandleItemClick,
    adaptedHandleActionsClick,

    // Fonctions
    fetchStores,
    selectStore,
    setInventoryStatus,
    setInventoryReference,
    fetchInventoryIdByReference,
    goToInventoryDetail,
    goToAffectation, // Added goToAffectation
} = usePlanningManagement();

// Ajouter viewMode manuellement car il n'est pas dans usePlanning
const viewMode = ref<'table' | 'grid'>('table');

// Mettre à jour les options de vue avec les icônes
const updatedViewOptions = [
    { value: 'table', icon: IconListCheck },
    { value: 'grid', icon: IconLayoutGrid }
];

// Handlers pour les événements du DataTable
const onSelectionChanged = (selectedRows: Set<string>) => {
    // Gestion de la sélection
};

const onRowClicked = (row: any) => {
    // Gestion du clic sur une ligne
};

const onCellValueChanged = (event: { data: any; field: string; newValue: any; oldValue: any }) => {
    // Gestion du changement de valeur de cellule
};

const handlePaginationChanged = (params: { page: number; pageSize: number }) => {
    // Gestion de la pagination
};

const handleSortChanged = (sortModel: any) => {
    // Gestion du tri
};

const handleFilterChanged = (filterModel: any) => {
    // Gestion des filtres
};

const handleGlobalSearchChanged = (searchTerm: string) => {
    // Gestion de la recherche globale
};

// Charger les données au montage du composant
onMounted(async () => {
    setInventoryStatus('En préparation');

    if (props.reference) {
        // Définir la référence de l'inventaire dans le composable
        setInventoryReference(props.reference);

        await fetchInventoryIdByReference(props.reference);

        if (inventoryId.value) {
            try {
                await fetchStores(inventoryId.value);
            } catch (error) {
                // Gestion silencieuse des erreurs
            }
        }
    }
});

// Fonction pour naviguer vers le détail de l'inventaire
const handleGoToInventoryDetail = () => {
    goToInventoryDetail(props.reference);
};

// Fonction pour naviguer vers l'affectation
const handleGoToAffectation = () => {
    goToAffectation(props.reference);
};
</script>



<style scoped>
/* Modernisation UI */
.panel {
    background: #fff;
    border-radius: 1.5rem;
    box-shadow: 0 4px 24px rgba(0,0,0,0.07);
    border: 1px solid #f3f4f6;
    padding: 2rem 1.5rem;
}

.DataTableNew__row:hover, .grid-card:hover {
    background: #fef9c3;
    box-shadow: 0 2px 12px rgba(250,204,21,0.08);
    transition: all 0.2s;
}

.btn-outline-primary {
    border: 1px solid #FACC15;
    color: #FACC15;
    background: #fff;
    border-radius: 8px;
    padding: 0.25rem 0.75rem;
    font-size: 0.95rem;
    transition: all 0.2s;
}
.btn-outline-primary:hover {
    background: #fef9c3;
    color: #b45309;
    border-color: #eab308;
}

.shortcut-detail-btn {
    background: linear-gradient(90deg, #FACC15 0%, #EAB308 100%);
    color: #1e293b;
    font-weight: 600;
    border: none;
    border-radius: 10px;
    padding: 0.6rem 1.3rem;
    font-size: 1rem;
    box-shadow: 0 2px 8px rgba(250,204,21,0.10);
    transition: all 0.2s;
    cursor: pointer;
}
.shortcut-detail-btn:hover {
    background: linear-gradient(90deg, #fde047 0%, #facc15 100%);
    color: #b45309;
    box-shadow: 0 4px 16px rgba(250,204,21,0.18);
    transform: translateY(-2px) scale(1.03);
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
    background: linear-gradient(135deg, #FACC15 0%, #EAB308 100%);
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

.animate-fade-in {
    animation: fadeIn 0.4s ease;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-8px)
    }

    to {
        opacity: 1;
        transform: translateY(0)
    }
}
</style>
