<template>
  <div>
    <ul class="flex space-x-2 rtl:space-x-reverse">
      <li>
        <router-link :to="{ name: 'inventory-list' }" class="text-primary hover:underline">
          Gestion d'inventaire
        </router-link>
      </li>
      <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
        <span>gestion-des-plannings</span>
      </li>
    </ul>

    <!-- Toggle Buttons -->
    <div class="flex justify-start md:justify-end mb-6 mt-4 md:mt-0">
      <ToggleButtons v-model="viewMode" :options="viewOptions" />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Table View -->
      <div v-if="viewMode === 'table'" class="animate-fade-in panel py-4">
        <DataTable
          :columns="columns"
          :rowDataProp="stores"
          :actions="actions"
          :pagination="true"
          :enableFiltering="true"
          :showColumnSelector="false"
          storageKey="planning_table"
        />
      </div>

      <!-- Grid View -->
      <GridView
        v-else
        :data="stores"
        titleField="store_name"
        :selectedItem="selectedStore"
        :onItemClick="handleItemClick"
        :enableStats="true"
        :stats="[
          { label: 'Équipes', value: 'teams_count', suffix: 'équipes' },
          { label: 'Jobs', value: 'jobs_count', suffix: 'jobs' }
        ]"
        :enableActions="true"
        :actions="[
          {
            label: actions[0].label,
            icon: IconUser,
            handler: handleAssignTeams,
            variant: 'primary'
          },
          {
            label: actions[1].label,
            icon: IconCalendar,
            handler: handlePlanningAction,
            variant: 'secondary'
          }
        ]"
        :showActionsIcon="true"
        @actionsClick="handleActionsClick"
        :itemsPerPage="6"
        :enablePagination="true"
        class="animate-fade-in"
      >
        <template #header>
          <h2 class="text-xl font-semibold mb-6 text-gray-800 flex items-center">
            Magasins
          </h2>
        </template>
      </GridView>
    </template>

    <!-- Actions Menu -->
    <Teleport to="body">
      <div
        v-if="showActionsMenu"
        class="fixed z-50"
        :style="menuStyle"
        ref="menuRef"
      >
        <div class="bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 py-1 min-w-[160px]">
          <button
            @click="handleEditItem(selectedActionItem)"
            class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Modifier
          </button>
          <button
            @click="handleDeleteItem(selectedActionItem)"
            class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Supprimer
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import DataTable from '@/components/DataTable/DataTable.vue';
import ToggleButtons from '@/components/ToggleButtons/ToggleButtons.vue';
import GridView from '@/components/GridView/GridView.vue';
import type { GridDataItem } from '@/components/GridView/GridView.vue';
import IconUser from '@/components/icon/icon-user.vue';
import IconCalendar from '@/components/icon/icon-calendar.vue';
import IconListCheck from '@/components/icon/icon-list-check.vue';
import IconLayoutGrid from '@/components/icon/icon-layout-grid.vue';
import { usePlanningManagement } from '@/composables/usePlanningManagement';
import type { Store } from '@/interfaces/planningManagement';

const { viewMode, selectedStore, stores, loading, columns, actions, fetchStores, selectStore } =
  usePlanningManagement();

const viewOptions = [
  { value: 'table', icon: IconListCheck },
  { value: 'grid', icon: IconLayoutGrid }
];

// Actions menu state
const showActionsMenu = ref(false);
const selectedActionItem = ref<Store | null>(null);
const menuPosition = ref({ x: 0, y: 0 });
const menuRef = ref<HTMLElement | null>(null);

// Compute menu position to ensure it stays within viewport
const menuStyle = computed(() => {
  const padding = 10; // Padding from viewport edges
  let { x, y } = menuPosition.value;
  
  if (menuRef.value) {
    const menuRect = menuRef.value.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Check right edge
    if (x + menuRect.width > viewportWidth - padding) {
      x = viewportWidth - menuRect.width - padding;
    }

    // Check left edge
    if (x < padding) {
      x = padding;
    }

    // Check bottom edge
    if (y + menuRect.height > viewportHeight - padding) {
      y = viewportHeight - menuRect.height - padding;
    }

    // Check top edge
    if (y < padding) {
      y = padding;
    }
  }

  return {
    top: `${y}px`,
    left: `${x}px`
  };
});

// Type guard function to ensure type safety
function isStore(item: GridDataItem): item is Store {
  return (
    'id' in item &&
    'store_name' in item &&
    'teams_count' in item &&
    'jobs_count' in item &&
    typeof item.id === 'number' &&
    typeof item.store_name === 'string' &&
    typeof item.teams_count === 'number' &&
    typeof item.jobs_count === 'number'
  );
}

// Safe handler functions with type guards
const handleItemClick = (item: GridDataItem) => {
  if (isStore(item)) {
    selectStore(item);
  }
};

const handleAssignTeams = (item: GridDataItem) => {
  if (isStore(item)) {
    actions[0].handler(item);
  }
};

const handlePlanningAction = (item: GridDataItem) => {
  if (isStore(item)) {
    actions[1].handler(item);
  }
};

const handleActionsClick = (item: GridDataItem, event: MouseEvent) => {
  if (isStore(item)) {
    selectedActionItem.value = item;
    showActionsMenu.value = true;
    
    // Position the menu near the clicked button
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    menuPosition.value = {
      x: rect.left,
      y: rect.bottom + 5
    };

    // Add click outside listener
    setTimeout(() => {
      window.addEventListener('click', closeActionsMenu);
    }, 0);
  }
};

const closeActionsMenu = (event?: MouseEvent) => {
  if (event && menuRef.value?.contains(event.target as Node)) {
    return;
  }
  showActionsMenu.value = false;
  selectedActionItem.value = null;
  window.removeEventListener('click', closeActionsMenu);
};

const handleEditItem = (item: Store | null) => {
  if (item) {
    console.log('Edit item:', item);
    closeActionsMenu();
  }
};

const handleDeleteItem = (item: Store | null) => {
  if (item) {
    console.log('Delete item:', item);
    closeActionsMenu();
  }
};

// Clean up event listeners
onUnmounted(() => {
  window.removeEventListener('click', closeActionsMenu);
});
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>