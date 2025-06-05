<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Component } from 'vue';

export type GridDataItem = Record<string, unknown>;

export interface Stat<T> {
  label: string;
  value: keyof T;
  suffix?: string;
}

export interface Action<T> {
  label: string;
  icon?: Component;
  handler: (item: T) => void;
  variant?: 'primary' | 'secondary';
}

const props = withDefaults(
  defineProps<{ 
    data: GridDataItem[];
    titleField: keyof GridDataItem;
    enableStats?: boolean;
    stats?: Stat<GridDataItem>[];
    enableActions?: boolean;
    actions?: Action<GridDataItem>[];
    showActionsIcon?: boolean;
    selectedItem: GridDataItem | null;
    onItemClick?: (item: GridDataItem) => void;
    columns?: number;
    itemsPerPage?: number;
    enablePagination?: boolean;
  }>(),
  {
    columns: 3,
    stats: () => [],
    enableStats: true,
    titleField: '', 
    enableActions: true,
    actions: () => [],
    showActionsIcon: false,
    selectedItem: null,
    itemsPerPage: 6,
    enablePagination: true,
  }
);

const emit = defineEmits<{ (e: 'actionsClick', item: GridDataItem, event: MouseEvent): void; }>();

const currentPage = ref(1);
const totalPages = computed(() => Math.ceil(props.data.length / props.itemsPerPage));
const paginatedData = computed(() => {
  if (!props.enablePagination) return props.data;
  const start = (currentPage.value - 1) * props.itemsPerPage;
  return props.data.slice(start, start + props.itemsPerPage);
});
watch(() => props.data, () => { currentPage.value = 1; });

const gridColsClass = computed(() => {
  const base = 'grid grid-cols-1 gap-6';
  const map: Record<number, string> = {
    1: 'sm:grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  };
  return `${base} ${map[props.columns] || map[3]}`;
});

const getActionColorClasses = (variant: 'primary' | 'secondary' = 'primary') =>
  ({ primary: 'btn-outline-primary', secondary: 'btn-outline-secondary' })[variant];

const handleActionsClick = (item: GridDataItem, event: MouseEvent) => {
  event.stopPropagation();
  emit('actionsClick', item, event);
};

const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };
const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };
const pageNumbers = computed(() => {
  const pages: number[] = [];
  const maxVisible = 5;
  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage.value - half);
  let end = Math.min(totalPages.value, start + maxVisible - 1);
  if ((end - start + 1) < maxVisible) start = Math.max(1, end - maxVisible + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
});
const goToPage = (page: number) => { currentPage.value = page; };
</script>

<template>
  <div class="panel border border-white-dark/20">
    <slot name="header"></slot>

    <div :class="gridColsClass">
      <div
        v-for="item in paginatedData"
        :key="String(item.id ?? JSON.stringify(item))"
        class="group relative border dark:border-dark-border dark:text-white-light border-gray-500/20 p-4 rounded-lg cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
        :class="{ 'bg-bg-white shadow-md': selectedItem?.id === item.id }"
        @click="onItemClick?.(item)"
      >
        <div v-if="showActionsIcon" class="absolute top-2 right-2">
          <button
            @click="handleActionsClick(item, $event)"
            class="p-1.5 rounded-full transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gra"
          >
            ⋮
          </button>
        </div>

        <h3 v-if="titleField" class="font-semibold text-lg dark:text-white-dark text-secondary group-hover:text-primary transition-colors duration-300">
          {{ String(item[titleField]) }}
        </h3>

        <slot name="content" :item="item">
          <div
            v-if="enableStats && stats.length"
            class="mt-4 pt-3 border-t dark:text-white-dark border-white-dark/10 grid grid-cols-2 gap-4 text-sm"
          >
            <div v-for="(stat, idx) in stats" :key="idx" class="text-gray-600 dark:text-white-dark">
              <span class="font-medium">{{ String(item[stat.value]) }}</span>
              {{ stat.suffix || '' }}
            </div>
          </div>

          <div v-if="enableActions && actions.length" class="mt-4">
            <div class="inline-flex rounded-md shadow-sm" role="group">
              <button
                v-for="(action, idx) in actions"
                :key="idx"
                @click.stop="action.handler(item)"
                class="btn-sm text-sm font-medium flex items-center justify-center gap-2 first:rounded-l-lg last:rounded-r-lg border"
                :class="[
                  idx !== 0 ? '-ml-px' : '',
                  action.variant === 'primary' 
                    ? ' text-white  border-gray-200/10   bg-primary border-border-dark' 
                    : 'bg-white text-gray-600 hover:bg-gray-100 border-gray-300'
                ]"
              >
                <component :is="action.icon" class="w-4 h-4" v-if="action.icon" />
                <span>{{ action.label }}</span>
              </button>
            </div>
          </div>
        </slot>
      </div>
    </div>

    <div v-if="enablePagination && totalPages > 1" class="mt-4">
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
        <p class="text-sm text-gray-700 dark:text-gray-400">
          Affichage de <span class="font-medium">{{ ((currentPage - 1) * itemsPerPage) + 1 }}</span>
          à <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, data.length) }}</span>
          sur <span class="font-medium">{{ data.length }}</span>
        </p>
        <div class="flex items-center justify-center space-x-2">
          <button @click="prevPage" :disabled="currentPage === 1" class="px-3 py-2 rounded-md text-sm font-medium">
            Précédent
          </button>
          <button
            v-for="page in pageNumbers"
            :key="page"
            @click="goToPage(page)"
            class="px-3 py-1 rounded-md text-sm font-medium"
            :class="currentPage === page ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'"
          >{{ page }}</button>
          <button @click="nextPage" :disabled="currentPage === totalPages" class="px-3 py-2 rounded-md text-sm font-medium">
            Suivant
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 1024px) {
  .grid { grid-template-columns: 1fr; gap: 1rem; }
}
</style>