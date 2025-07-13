<template>
    <div>
        <!-- En-tête moderne -->
        <div class="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-gray-200">
            <h1 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <IconCalendar class="w-7 h-7 text-yellow-400" />
                Planning des magasins
            </h1>
            <ToggleButtons v-model="viewMode" :options="viewOptions" class="mt-4 sm:mt-0" />
        </div>

        <!-- Raccourci vers le détail de l'inventaire -->
        <div class="flex justify-end mb-6">
            <button class="shortcut-detail-btn flex items-center gap-2" @click="goToInventoryDetail">
                <IconEye class="w-5 h-5" />
            </button>
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
                <DataTableNew
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import DataTableNew from '@/components/DataTable/DataTableNew.vue';
import ToggleButtons from '@/components/ToggleButtons/ToggleButtons.vue';
import GridView from '@/components/GridView/GridView.vue';
import IconCalendar from '@/components/icon/icon-calendar.vue';
import IconListCheck from '@/components/icon/icon-list-check.vue';
import IconLayoutGrid from '@/components/icon/icon-layout-grid.vue';
import IconEye from '@/components/icon/icon-eye.vue';
import { useRouter, useRoute } from 'vue-router';
import { useInventoryStore } from '@/stores/inventory';
import type { Store, GridDataItem } from '@/interfaces/planningManagement';
import { usePlanningManagement } from '@/composables/usePlanningManagement';

// Props
interface Props {
    reference: string;
}
const props = defineProps<Props>();

const router = useRouter();
const route = useRoute();
const inventoryStore = useInventoryStore();

// Utiliser le nouveau composable usePlanning
const {
    // États du planning management
    stores,
    selectedStore,
    loading,
    inventoryStatus,
    inventoryReference,

    // Colonnes et actions
    actions,

    // Fonctions
    fetchStores,
    selectStore,
    setInventoryStatus,
    setInventoryReference,
} = usePlanningManagement();

// Ajouter viewMode manuellement car il n'est pas dans usePlanning
const viewMode = ref<'table' | 'grid'>('table');

// Adapter les colonnes pour supprimer les propriétés non reconnues
const adaptedColumns = computed(() => [
    {
        field: 'store_name',
        headerName: 'Nom du magasin',
        sortable: true,
        width: 200,
        editable: false
    },
    {
        field: 'teams_count',
        headerName: 'Équipes',
        sortable: true,
        width: 100,
        editable: false
    },
    {
        field: 'jobs_count',
        headerName: 'Jobs',
        sortable: true,
        width: 100,
        editable: false
    },
    {
        field: 'reference',
        headerName: 'Référence',
        sortable: true,
        width: 150,
        editable: false
    }
]);

// Adapter les actions pour DataTableNew
const adaptedActions = computed(() =>
    actions.value.map(action => ({
        label: action.label,
        icon: action.icon,
        onClick: (row: Record<string, unknown>) => action.handler(row as unknown as Store),
        color: 'primary' as const
    }))
);

// Adapter les actions pour GridView
const adaptedGridActions = computed(() =>
    actions.value.map(action => ({
        label: action.label,
        icon: action.icon,
        handler: (item: any) => action.handler(item),
        variant: 'primary' as const
    }))
);

// Adapter le handler pour GridView
const adaptedHandleItemClick = (item: any) => {
    // This function is not directly used in the new usePlanningManagement,
    // but keeping it for now as it might be used elsewhere or for future compatibility.
    // The actual item click handling is now part of the actions.
};

const adaptedHandleActionsClick = (item: any, e: MouseEvent) => {
    // This function is not directly used in the new usePlanningManagement,
    // but keeping it for now as it might be used elsewhere or for future compatibility.
    // The actual actions click handling is now part of the actions.
};

// Récupérer l'ID d'inventaire à partir de la référence
const inventoryId = ref<number | null>(null);
const inventoryLoading = ref(false);
const inventoryError = ref<string | null>(null);

// Fonction pour récupérer l'ID de l'inventaire par sa référence
const fetchInventoryIdByReference = async (reference: string) => {
    inventoryLoading.value = true;
    inventoryError.value = null;

    try {
        // Charger la liste des inventaires pour trouver celui avec la bonne référence
        await inventoryStore.fetchInventories();
        const inventory = inventoryStore.inventories.find(inv => inv.reference === reference);

        if (inventory) {
            inventoryId.value = inventory.id;
        } else {
            inventoryError.value = `Aucun inventaire trouvé avec la référence: ${reference}`;
        }
    } catch (error) {
        inventoryError.value = 'Erreur lors de la récupération de l\'inventaire';
    } finally {
        inventoryLoading.value = false;
    }
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
                console.error('Erreur lors du chargement des magasins:', error);
            }
        }
    } else {
        console.warn('Aucune référence d\'inventaire fournie');
    }
});

const viewOptions = [
    { value: 'table', icon: IconListCheck },
    { value: 'grid', icon: IconLayoutGrid }
];

const goToInventoryDetail = () => {
    router.push({ name: 'inventory-results', params: { reference: props.reference } });
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
