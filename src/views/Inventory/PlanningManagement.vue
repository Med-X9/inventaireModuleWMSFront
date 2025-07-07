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
import type { Store } from '@/interfaces/planningManagement';

const router = useRouter();  
const route = useRoute();  
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
  setInventoryStatus
} = usePlanningManagement();

// Simuler le statut d'inventaire
onMounted(() => setInventoryStatus('En préparation'));

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
  if (item) { console.log('Edit', item); closeActionsMenu() }
};
const handleDeleteItem = (item: Store | null) => {
  if (item) { console.log('Delete', item); closeActionsMenu() }
};

// ─── gridActions : on utilise le type Action<GridDataItem> ───
const gridActions = computed<Action<GridDataItem>[]>(() => {
  const list: Action<GridDataItem>[] = [];

  if (inventoryStatus.value !== 'En réalisation') {
    list.push({
      label: 'Planifier',
      icon: IconCalendar,
      handler: handlePlanningAction,
      variant: 'primary'
    });
  }

  list.push({
    label: inventoryStatus.value === 'En réalisation' ? 'Transférer' : 'Affecter',
    icon: IconUser,
    handler: handleAssignTeams,
    variant: 'primary'
  });

  return list;
});

onUnmounted(() => window.removeEventListener('click', closeActionsMenu));
</script>

<template>
  <div>
    <div class="flex justify-end mb-6">
      <ToggleButtons v-model="viewMode" :options="viewOptions" />
    </div>

    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>

    <template v-else>
      <div v-if="viewMode==='table'" class="panel py-4 animate-fade-in">
        <DataTable
          :columns="columns"
          :rowDataProp="stores"
          :actions="actions"
          pagination
          enableFiltering
          :showColumnSelector="false"
          storageKey="planning_table"
        />
      </div>
      <GridView
        v-else
        class="panel animate-fade-in border border-white-dark/20"
        :data="stores"
        titleField="store_name"
        :selectedItem="selectedStore"
        :onItemClick="handleItemClick"
        enableStats
        :stats="[
          { label:'Équipes', value:'teams_count', suffix:'équipes' },
          { label:'Jobs',   value:'jobs_count', suffix:'jobs' }
        ]"
        enableActions
        :actions="gridActions"
        showActionsIcon
        @actionsClick="handleActionsClick"
        :itemsPerPage="6"
        enablePagination
      >
        <template #header>
          <h2 class="text-xl font-semibold mb-6 text-gray-800">Magasins</h2>
        </template>
      </GridView>
    </template>

    <Teleport to="body">
      <div v-if="showActionsMenu" ref="menuRef" :style="menuStyle" class="fixed z-50">
        <div class="bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black/10 py-1 min-w-[160px]">
          <button @click="handleEditItem(selectedActionItem)" class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100">Modifier</button>
          <button @click="handleDeleteItem(selectedActionItem)" class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100">Supprimer</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.animate-fade-in { animation: fadeIn 0.4s ease; }
@keyframes fadeIn { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }
</style>
