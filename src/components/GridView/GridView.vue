<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Component } from 'vue';

// Generic record for items
export type GridDataItem = Record<string, unknown>;

// Definition of a single stat (with a key of the item)
export interface Stat<T> {
  label: string;
  value: keyof T;
  suffix?: string;
}

// Definition of a single action button
export interface Action<T> {
  label: string;
  icon?: Component;
  handler: (item: T) => void;
  variant?: 'primary' | 'secondary';
}

// Props with explicit types
const props = withDefaults(
  defineProps<{
    data: GridDataItem[];
    titleField: keyof GridDataItem;
    enableStats?: boolean;
    stats?: Stat<GridDataItem>[];
    enableActions?: boolean;
    actions?: Action<GridDataItem>[];
    selectedItem: GridDataItem | null;
    onItemClick?: (item: GridDataItem) => void;
    columns?: number;
    itemsPerPage?: number;
    enablePagination?: boolean;
    showActionsIcon?: boolean;
  }>(),
  {
    columns: 3,
    stats: () => [],
    actions: () => [],
    enableStats: true,
    enableActions: true,
    selectedItem: null,
    itemsPerPage: 9,
    enablePagination: true,
    showActionsIcon: false,
  }
);

const emit = defineEmits<{
  (e: 'actionsClick', item: GridDataItem, event: MouseEvent): void;
}>();

// Pagination state
const currentPage = ref(1);
const totalPages = computed(() => Math.ceil(props.data.length / props.itemsPerPage));

// Compute paginated data
const paginatedData = computed(() => {
  if (!props.enablePagination) return props.data;
  
  const start = (currentPage.value - 1) * props.itemsPerPage;
  const end = start + props.itemsPerPage;
  return props.data.slice(start, end);
});

// Reset pagination when data changes
watch(() => props.data, () => {
  currentPage.value = 1;
});

// Compute grid classes based on columns
const gridColsClass = computed(() => {
  const baseClass = 'grid grid-cols-1 gap-6';
  const responsive = {
    1: 'sm:grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }[props.columns] || 'sm:grid-cols-2 lg:grid-cols-3';
  return `${baseClass} ${responsive}`;
});

// Color classes for actions
const getActionColorClasses = (variant: 'primary' | 'secondary' = 'primary') => ({
  primary: 'btn-outline-primary',
  secondary: 'btn-outline-secondary',
}[variant]);

// Handle actions icon click
const handleActionsClick = (item: GridDataItem, event: MouseEvent) => {
  event.stopPropagation();
  emit('actionsClick', item, event);
};

// Pagination methods
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

// Generate page numbers array
const pageNumbers = computed(() => {
  const pages: number[] = [];
  const maxVisiblePages = 5;
  const halfVisible = Math.floor(maxVisiblePages / 2);

  let startPage = Math.max(1, currentPage.value - halfVisible);
  let endPage = Math.min(totalPages.value, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return pages;
});

const goToPage = (page: number) => {
  currentPage.value = page;
};
</script>

<template>
  <div class="panel border border-white-dark/20">
    <slot name="header"></slot>

    <div :class="gridColsClass">
      <div
        v-for="item in paginatedData"
        :key="String(item.id || JSON.stringify(item))"
        class="group relative border dark:border-dark-border dark:text-white-light border-gray-500/20 p-5 rounded-lg cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
        :class="{ 'bg-bg-white shadow-md': selectedItem?.id === item.id }"
        @click="onItemClick?.(item)"
      >
        <!-- Three dots menu icon -->
        <div v-if="showActionsIcon" class="absolute top-2 right-2">
          <button
            @click="handleActionsClick(item, $event)"
            class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
          >
            ⋮
          </button>
        </div>

        <h3 class="font-semibold text-lg dark:text-white-dark text-secondary group-hover:text-primary transition-colors duration-300">
          {{ String(item[titleField]) }}
        </h3>

        <div
          v-if="enableStats && stats.length"
          class="mt-4 pt-3 border-t dark:text-white-dark border-white-dark/10 grid grid-cols-2 gap-4 text-sm"
        >
          <div v-for="(stat, index) in stats" :key="index" class="text-gray-600 dark:text-white-dark">
            <span class="font-medium">{{ String(item[stat.value]) }}</span>
            {{ stat.suffix || '' }}
          </div>
        </div>

        <div v-if="enableActions && actions.length" class="mt-4 flex gap-3">
          <button
            v-for="(action, index) in actions"
            :key="index"
            @click.stop="action.handler(item)"
            class="flex-1 flex items-center justify-center gap-2 btn"
            :class="getActionColorClasses(action.variant)"
          >
            <component :is="action.icon" class="w-4 h-4" v-if="action.icon" />
            <span>{{ action.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="enablePagination && totalPages > 1" class="mt-4">
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
        <p class="text-sm text-gray-700 dark:text-gray-400">
          Affichage de <span class="font-medium">{{ ((currentPage - 1) * itemsPerPage) + 1 }}</span> à
          <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, data.length) }}</span> sur
          <span class="font-medium">{{ data.length }}</span> éléments
        </p>
        
        <div class="flex items-center justify-center space-x-2">
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ease-in-out"
            :class="[
              currentPage === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
            ]"
          >
            Précédent
          </button>

          <div class="hidden sm:flex space-x-2">
            <button
              v-for="page in pageNumbers"
              :key="page"
              @click="goToPage(page)"
              class="px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 ease-in-out"
              :class="[
                currentPage === page
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
              ]"
            >
              {{ page }}
            </button>
          </div>

          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ease-in-out"
            :class="[
              currentPage === totalPages
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
            ]"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  </div>
</template>