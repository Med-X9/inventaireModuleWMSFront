<template>
  <div class="select-field-wrapper">
    <label v-if="label" :for="fieldId" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      <span class="flex items-center gap-1">
        {{ label }}
        <span v-if="required" class="text-red-500">*</span>
        <Tooltip v-if="tooltip" :text="tooltip" position="top" :delay="300">
          <svg
            class="w-3 h-3 text-gray-400 cursor-help"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </Tooltip>
      </span>
    </label>

    <v-select
      :id="fieldId"
      :model-value="modelValue"
      :options="formattedOptions"
      :multiple="multiple"
      :searchable="searchable"
      :clearable="clearable"
      :placeholder="placeholder"
      :disabled="disabled"
      :loading="loading"
      label="label"
      :reduce="(opt: SelectOption) => opt?.value || opt"
      :class="[
        'vs-custom',
        compact ? 'vs-compact' : '',
        multiple ? 'vs-multi' : 'vs-single',
        searchable ? 'vs-search-enhanced' : '',
        error ? 'vs-error' : '',
        'dark'
      ]"
      :filter="customFilter"
      @update:model-value="$emit('update:modelValue', $event)"
      @search="$emit('search', $event)"
      @open="$emit('open')"
      @close="$emit('close')"
    >
      <!-- Custom option template with tooltip support -->
      <template #option="option">
        <div class="vs-option-with-tooltip relative w-full">
          <div class="vs-option-content flex items-center justify-between w-full">
            <span>{{ option.label }}</span>
            <svg
              v-if="option.tooltip"
              class="w-3 h-3 text-gray-400 cursor-help vs-tooltip-trigger ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              @mouseenter="handleMouseEnter($event, option)"
              @mouseleave="handleMouseLeave"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          
          <!-- Tooltip affiché sous le label, pleine largeur -->
          <div 
            v-if="showTooltip === String(option.value) && option.tooltip"
            class="tooltip-content w-full mt-1 p-1.5 bg-primary text-white text-xs rounded  border border-primary z-50 absolute left-0"
            :style="{ top: '100%' }"
          >
            {{ option.tooltip }}
          </div>
        </div>
      </template>

      <!-- Custom no options template -->
      <template #no-options>
        <div class="text-center py-2 text-gray-500">
          {{ noOptionsText || 'Aucune option disponible' }}
        </div>
      </template>

      <!-- Custom search input template for enhanced search -->
      <template v-if="enhancedSearch" #search="{ attributes, events }">
        <input
          v-bind="attributes"
          v-on="events"
          class="vs-search-input"
          :placeholder="searchPlaceholder || 'Rechercher...'"
        />
      </template>
    </v-select>

    <!-- Error message -->
    <p v-if="error && errorMessage" class="text-sm text-red-500 mt-1">
      {{ errorMessage }}
    </p>

    <!-- Helper text -->
    <p v-if="helperText" class="text-sm text-gray-500 mt-1">
      {{ helperText }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import vSelect from 'vue-select';
import Tooltip from '@/components/Tooltip.vue';
import 'vue-select/dist/vue-select.css';
import '@/assets/css/select2.css';
import type { SelectOption, SelectFieldProps, SelectFieldEmits } from '@/interfaces/form';

const props = withDefaults(defineProps<SelectFieldProps>(), {
  searchable: true,
  clearable: true,
  multiple: false,
  disabled: false,
  loading: false,
  required: false,
  error: false,
  compact: false,
  enhancedSearch: false,
  customFilter: undefined
});

const emit = defineEmits<SelectFieldEmits>();

// Generate unique field ID
const fieldId = ref(`select-${Math.random().toString(36).substr(2, 9)}`);

// Tooltip state
const showTooltip = ref<string | null>(null);

// Format options consistently
const formattedOptions = computed((): SelectOption[] => {
  return props.options.map(opt => 
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );
});

// Gestion des événements de tooltip
const handleMouseEnter = (event: MouseEvent, option: SelectOption) => {
  showTooltip.value = String(option.value);
};

const handleMouseLeave = () => {
  showTooltip.value = null;
};
</script>

<style scoped>
/* Style pour les options avec tooltip */
.vs-option-with-tooltip {
  position: relative;
  overflow: visible;
  width: 100%;
}

.vs-option-content {
  position: relative;
  z-index: 1;
  width: 100%;
}

/* Tooltip pleine largeur sous l'option */
.tooltip-content {
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  z-index: 1000;
  margin-top: 2px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Assurer que le dropdown a un overflow visible */
.vs-custom :deep(.vs__dropdown-menu) {
  overflow: visible !important;
}

/* Assurer que chaque option a un overflow visible */
.vs-custom :deep(.vs__dropdown-option) {
  overflow: visible !important;
  position: relative !important;
}

/* Espacement pour éviter que le tooltip ne soit coupé */
.vs-custom :deep(.vs__dropdown-option--highlight) {
  padding-bottom: 0.5rem;
}

/* Animation douce pour l'apparition du tooltip */
.tooltip-content {
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

</style>