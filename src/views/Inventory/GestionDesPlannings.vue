<template>
  <div class="px-6">
    <!-- Toggle Buttons -->
    <div class="flex justify-end mb-6">
      <div class="bg-gray-100 p-1 rounded-lg shadow-sm">
        <button
          @click="viewMode = 'table'"
          :class="[
            'px-4 py-2 rounded-md transition-all duration-300 transform',
            viewMode === 'table' 
              ? 'bg-white text-blue-600 shadow-sm scale-100' 
              : 'text-gray-600 hover:text-gray-800 scale-95 hover:scale-100'
          ]"
        >
          <IconListCheck class="w-5 h-5" />
        </button>
        <button
          @click="viewMode = 'grid'"
          :class="[
            'px-4 py-2 rounded-md transition-all duration-300 transform',
            viewMode === 'grid' 
              ? 'bg-white text-blue-600 shadow-sm scale-100' 
              : 'text-gray-600 hover:text-gray-800 scale-95 hover:scale-100'
          ]"
        >
          <IconLayoutGrid class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
      <div v-else class="bg-white rounded-xl shadow-lg p-6 animate-fade-in">
        <h2 class="text-xl font-semibold mb-6 text-gray-800 flex items-center">
          <span class="mr-2">🏪</span>
          Magasins
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="store in stores"
            :key="store.id"
            class="group border border-gray-200 p-5 rounded-lg cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
            :class="{'bg-blue-50 border-blue-300 shadow-md': selectedStore?.id === store.id}"
            @click="selectStore(store)"
          >
            <h3 class="font-semibold text-lg text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
              {{ store.store_name }}
            </h3>
            <div class="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm">
              <div class="text-gray-600">
                <span class="font-medium">5</span> équipes
              </div>
              <div class="text-gray-600">
                <span class="font-medium">3</span> jobs
              </div>
            </div>
            <div class="mt-4 flex gap-3">
              <button
                @click.stop="actions[0].handler(store)"
                class="flex-1 flex items-center justify-center gap-2 py-2.5 text-yellow-600 text-sm font-medium border border-yellow-200 rounded-lg hover:bg-yellow-50 transition-all duration-300 transform hover:scale-[1.02]"
              >
                <IconUser class="w-4 h-4" />
                <span>{{ actions[0].label }}</span>
              </button>
              <button
                @click.stop="actions[1].handler(store)"
                class="flex-1 flex items-center justify-center gap-2 py-2.5 text-blue-600 text-sm font-medium border border-blue-200 rounded-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-[1.02]"
              >
                <IconCalendar class="w-4 h-4" />
                <span>{{ actions[1].label }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import DataTable from '@/components/DataTable/DataTable.vue';
import IconUser from '@/components/icon/icon-user.vue';
import IconCalendar from '@/components/icon/icon-calendar.vue';
import IconListCheck from '@/components/icon/icon-list-check.vue';
import IconLayoutGrid from '@/components/icon/icon-layout-grid.vue';
import { usePlanningManagement } from '@/composables/usePlanningManagement';

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

onMounted(fetchStores);
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