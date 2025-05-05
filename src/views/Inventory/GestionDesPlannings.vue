<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

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

const {
  viewMode,
  selectedStore,
  stores,
  loading,
  columns,
  actions,
  fetchStores,
  selectStore
} = usePlanningManagement();

const viewOptions = [
  { value: 'table', icon: IconListCheck },
  { value: 'grid', icon: IconLayoutGrid }
];

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
</script>

<template>
  <div class="px-6">
    <!-- Toggle Buttons -->
    <div class="flex justify-end mb-6">
      <ToggleButtons v-model="viewMode" :options="viewOptions" />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Table View -->
      <div v-if="viewMode === 'table'" class="animate-fade-in">
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
      >
        <template #header>
          <h2 class="text-xl font-semibold mb-6 text-gray-800 flex items-center">
            Magasins
          </h2>
        </template>
      </GridView>
    </template>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>