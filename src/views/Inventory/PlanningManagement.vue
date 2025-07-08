<template>
    <div>
        <div class="flex justify-end mb-6">
            <ToggleButtons v-model="viewMode" :options="viewOptions" />
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
            <div v-if="viewMode === 'table'" class="panel py-4 animate-fade-in">
                <DataTable :columns="columns" :rowDataProp="stores" :actions="actions" pagination enableFiltering
                    :showColumnSelector="false" storageKey="planning_table" />
            </div>
            <GridView v-else class="panel animate-fade-in border border-white-dark/20" :data="stores"
                titleField="store_name" :selectedItem="selectedStore" :onItemClick="handleItemClick" enableStats :stats="[
                    { label: 'Équipes', value: 'teams_count', suffix: 'équipes' },
                    { label: 'Jobs', value: 'jobs_count', suffix: 'jobs' }
                ]" enableActions :actions="gridActions" showActionsIcon @actionsClick="handleActionsClick"
                :itemsPerPage="6" enablePagination>
                <template #header>
                    <h2 class="text-xl font-semibold mb-6 text-gray-800">Magasins</h2>
                </template>
            </GridView>
        </template>

        <Teleport to="body">
            <div v-if="showActionsMenu" ref="menuRef" :style="menuStyle" class="fixed z-50">
                <div class="bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black/10 py-1 min-w-[160px]">
                    <button @click="handleEditItem(selectedActionItem)"
                        class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">Modifier</button>
                    <button @click="handleDeleteItem(selectedActionItem)"
                        class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100">Supprimer</button>
                </div>
            </div>
        </Teleport>
    </div>
</template>


<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import DataTable from '@/components/DataTable/DataTable.vue';
import ToggleButtons from '@/components/ToggleButtons/ToggleButtons.vue';
import GridView, {
    type GridDataItem,
    type Action
} from '@/components/GridView/GridView.vue';
import IconUser from '@/components/icon/icon-user.vue';
import IconCalendar from '@/components/icon/icon-calendar.vue';
import IconListCheck from '@/components/icon/icon-list-check.vue';
import IconLayoutGrid from '@/components/icon/icon-layout-grid.vue';
import { useRouter, useRoute } from 'vue-router';
import { usePlanningManagement } from '@/composables/usePlanningManagement';
import { useInventoryStore } from '@/stores/inventory';
import type { Store } from '@/interfaces/planningManagement';

// Props
interface Props {
    reference: string;
}
const props = defineProps<Props>();

const router = useRouter();
const route = useRoute();
const inventoryStore = useInventoryStore();

const {
    viewMode,
    selectedStore,
    stores,
    loading,
    columns,
    actions,
    inventoryStatus,
    fetchStores,
    selectStore,
    setInventoryStatus,
    setInventoryReference
} = usePlanningManagement();

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

// Menu contextuel
const showActionsMenu = ref(false);
const selectedActionItem = ref<Store | null>(null);
const menuPosition = ref({ x: 0, y: 0 });
const menuRef = ref<HTMLElement | null>(null);

const menuStyle = computed(() => {
    const pad = 10;
    let { x, y } = menuPosition.value;
    if (menuRef.value) {
        const r = menuRef.value.getBoundingClientRect();
        const W = window.innerWidth, H = window.innerHeight;
        x = Math.min(Math.max(x, pad), W - r.width - pad);
        y = Math.min(Math.max(y, pad), H - r.height - pad);
    }
    return { top: `${y}px`, left: `${x}px` };
});

function isStore(item: GridDataItem): item is Store {
    return (
        typeof item.id === 'number' &&
        typeof item.store_name === 'string'
    );
}

const handleItemClick = (item: GridDataItem) => {
    if (isStore(item)) selectStore(item);
};

const handlePlanningAction = (item: GridDataItem) => {
    if (isStore(item)) actions.value[0]?.handler(item);
};

const handleAssignTeams = (item: GridDataItem) => {
    if (!isStore(item)) return;
    const a = actions.value.find(act =>
        typeof act.label === 'string' &&
        (act.label.includes('Affecter') || act.label.includes('Transférer'))
    );
    a?.handler(item);
};

const handleActionsClick = (item: GridDataItem, e: MouseEvent) => {
    if (!isStore(item)) return;
    selectedActionItem.value = item;
    showActionsMenu.value = true;
    const r = (e.target as HTMLElement).getBoundingClientRect();
    menuPosition.value = { x: r.left, y: r.bottom + 5 };
    setTimeout(() => window.addEventListener('click', closeActionsMenu), 0);
};

const closeActionsMenu = (e?: MouseEvent) => {
    if (e && menuRef.value?.contains(e.target as Node)) return;
    showActionsMenu.value = false;
    selectedActionItem.value = null;
    window.removeEventListener('click', closeActionsMenu);
};

const handleEditItem = (item: Store | null) => {
    if (item) {
        closeActionsMenu();
        // Rediriger vers la page d'édition de l'inventaire
        router.push({
            name: 'inventory-edit',
            params: { reference: props.reference }
        });
    }
};
const handleDeleteItem = (item: Store | null) => {
    if (item) { closeActionsMenu() }
};

// ─── gridActions : on utilise le type Action<GridDataItem> ───
const gridActions = computed<Action<GridDataItem>[]>(() => {
    const list: Action<GridDataItem>[] = [];

    if (inventoryStatus.value !== 'EN REALISATION') {
        list.push({
            label: 'Planifier',
            icon: IconCalendar,
            handler: handlePlanningAction,
            variant: 'primary'
        });
    }

    list.push({
        label: inventoryStatus.value === 'EN REALISATION' ? 'Transférer' : 'Affecter',
        icon: IconUser,
        handler: handleAssignTeams,
        variant: 'primary'
    });

    return list;
});

onUnmounted(() => window.removeEventListener('click', closeActionsMenu));
</script>



<style scoped>
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
