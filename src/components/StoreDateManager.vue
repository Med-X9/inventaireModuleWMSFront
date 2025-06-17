<template>
  <div v-if="selectedStores.length > 0" class="space-y-4">
    <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
      Dates par magasin
    </h4>
    
    <!-- Simple date input when only one store is selected -->
    <div v-if="selectedStores.length === 1" class="w-full">
      <div class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="flex-shrink-0">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ selectedStores[0] }}
          </span>
        </div>
        
        <div class="flex-1">
          <flat-pickr
            :model-value="getDateForStore(selectedStores[0])"
            @update:model-value="(date) => updateStoreDate(selectedStores[0], date)"
            :config="dateConfig"
            placeholder="Sélectionner une date"
            class="w-full form-input px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-10 outline-none"
          />
        </div>
      </div>
    </div>

    <!-- Flex layout when multiple stores are selected -->
    <div v-else class="space-y-3">
      <div 
        v-for="store in selectedStores" 
        :key="store"
        class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      >
        <div class="flex-shrink-0 min-w-0 flex-1">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
            {{ store }}
          </span>
        </div>
        
        <div class="flex-1">
          <flat-pickr
            :model-value="getDateForStore(store)"
            @update:model-value="(date) => updateStoreDate(store, date)"
            :config="dateConfig"
            placeholder="Date"
            class="w-full form-input px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-10 outline-none"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import flatPickr from 'vue-flatpickr-component';
import 'flatpickr/dist/flatpickr.css';
import { French } from 'flatpickr/dist/l10n/fr.js';
import type { Options } from 'flatpickr/dist/types/options';
import type { StoreDate } from '@/interfaces/inventoryCreation';

const props = defineProps<{
  selectedStores: string[];
  storeDates: StoreDate[];
}>();

const emit = defineEmits<{
  (e: 'update:store-dates', dates: StoreDate[]): void;
}>();

const dateConfig: Options = {
  locale: French,
  dateFormat: 'Y-m-d',
  altInput: true,
  altFormat: 'd/m/Y',
  allowInput: true,
  enableTime: false,
  monthSelectorType: 'static' as const,
  nextArrow: '<svg class="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M1 1l4 4.5L1 10" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  prevArrow: '<svg class="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M6 1L2 5.5 6 10" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

function getDateForStore(store: string): string {
  const storeDate = props.storeDates.find(sd => sd.store === store);
  return storeDate?.date || '';
}

function updateStoreDate(store: string, date: string | Date | null) {
  const dateString = date ? (typeof date === 'string' ? date : date.toISOString().split('T')[0]) : '';
  
  const updatedDates = [...props.storeDates];
  const existingIndex = updatedDates.findIndex(sd => sd.store === store);
  
  if (existingIndex >= 0) {
    if (dateString) {
      updatedDates[existingIndex].date = dateString;
    } else {
      updatedDates.splice(existingIndex, 1);
    }
  } else if (dateString) {
    updatedDates.push({ store, date: dateString });
  }
  
  // Remove dates for stores that are no longer selected
  const filteredDates = updatedDates.filter(sd => props.selectedStores.includes(sd.store));
  
  emit('update:store-dates', filteredDates);
}
</script>