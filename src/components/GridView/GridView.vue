<script setup lang="ts">
import { computed } from 'vue';
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
  }>(),
  {
    columns: 3,
    stats: () => [],
    actions: () => [],
    enableStats: true,
    enableActions: true,
    selectedItem: null,
  }
);

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
  primary: 'text-primary border-primary hover:bg-primary-light',
  secondary: 'text-secondary border-secondary hover:bg-secondary-light',
}[variant]);
</script>

<template>
  <div class="bg-white rounded-xl shadow-md p-6">
    <slot name="header"></slot>

    <div :class="gridColsClass">
      <div
        v-for="item in data"
        :key="String(item.id || JSON.stringify(item))"
        class="group border border-gray-200 p-5 rounded-lg cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
        :class="{ 'bg-bg-white border-secondary shadow-md': selectedItem?.id === item.id }"
        @click="onItemClick?.(item)"
      >
        <h3 class="font-semibold text-lg text-secondary group-hover:text-primary transition-colors duration-300">
          {{ String(item[titleField]) }}
        </h3>

        <div
          v-if="enableStats && stats.length"
          class="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-4 text-sm"
        >
          <div v-for="(stat, index) in stats" :key="index" class="text-gray-600">
            <span class="font-medium">{{ String(item[stat.value]) }}</span>
            {{ stat.suffix || '' }}
          </div>
        </div>

        <div v-if="enableActions && actions.length" class="mt-4 flex gap-3">
          <button
            v-for="(action, index) in actions"
            :key="index"
            @click.stop="action.handler(item)"
            class="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium border rounded-lg transition-all duration-300 transform hover:scale-[1.02]"
            :class="getActionColorClasses(action.variant)"
          >
            <component :is="action.icon" class="w-4 h-4" v-if="action.icon" />
            <span>{{ action.label }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>