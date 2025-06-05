

<template>
  <div class="container mx-auto">
    <h2 v-if="title" class="text-xl font-bold text-gray-800 mb-6">
      {{ title }}
    </h2>

    <form :class="formGridClass" @submit.prevent="handleSubmit">
      <div
        v-for="field in fields"
        :key="field.key"
        class="w-full"
      >
        <!-- Label for all except checkbox -->
        <label
          v-if="field.type !== 'checkbox'"
          :for="field.key"
          class="block text-sm font-medium dark:text-gray-400 text-gray-700 mb-2"
        >
          {{ field.label }}
          <span v-if="field.validators?.some(v => v.fn === required().fn)" class="text-red-500">*</span>
        </label>

        <!-- Text/email input -->
        <input
          v-if="['text', 'email'].includes(field.type)"
          :id="field.key"
          v-model="formData[field.key]"
          :type="field.type"
          v-bind="field.props"
          class="w-full form-input px-4 py-3 bg-white border border-gray-200 rounded-lg transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-10 outline-none"
          :class="{'border-red-500': errors[field.key] && submitted}"
        />

        <!-- Date Picker -->
        <flat-pickr
          v-else-if="field.type === 'date'"
          v-model="formData[field.key] as DateOption"
           :config="{
            ...dateConfig,
            minDate: field.min,
            disable: [
              function(date) {
                if (field.min) {
                  return date < new Date(field.min);
                }
                return false;
              }
            ]
          }"

          placeholder="jj/mm/aaaa"
          class="w-full form-input px-4 py-3 bg-white border border-gray-200 rounded-lg transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-10 outline-none"
          :class="{'border-red-500': errors[field.key] && submitted}"
        />
        
        
        <!-- Checkbox -->
        <div
          v-else-if="field.type === 'checkbox'"
          class="inline-flex"
        >
          <input
            :id="field.key"
            v-model="formData[field.key]"
            type="checkbox"
            class="form-checkbox"
          />
          <label
            :for="field.key"
            class="text-sm text-gray-700"
          >
            {{ field.label }}
          </label>
        </div>

        <!-- Radio -->
        <div
          v-else-if="field.type === 'radio'"
          class="space-y-2"
        >
          <div
            v-for="opt in formattedOptions(field.options)"
            :key="opt.value"
            class="flex items-center space-x-2"
          >
            <input
              :id="`${field.key}-${opt.value}`"
              v-model="formData[field.key]"
              :value="opt.value"
              type="radio"
              name="default_radio" class="form-radio"
            />
            <label
              :for="`${field.key}-${opt.value}`"
              class="text-sm mt-2 text-gray-700 dark:text-white"
            >
              {{ opt.label }}
            </label>
          </div>
        </div>

        <!-- Select -->
        <div v-else-if="field.type === 'select'">
          <v-select
            :id="field.key"
            v-model="formData[field.key]"
            :options="formattedOptions(field.options)"
            :multiple="field.multiple || false"
            :searchable="field.searchable ?? false"
            :clearable="field.clearable ?? true"
            :placeholder="(field.props?.placeholder as string) || '-- Sélectionner --'"
            label="label"
            :reduce="opt => opt.value"
            class="vs-custom dark"
            :class="{'vs-error': errors[field.key] && submitted}"
          />
        </div>

        <!-- Button-group -->
        <div v-else-if="field.type === 'button-group'">
          <div class="flex flex-wrap max-h-[200px] overflow-x-auto gap-2 dark:border-dark-border dark:bg-[#0e1726] bg-white p-4 rounded-lg border border-gray-200">
            <button
              v-for="opt in formattedOptions(field.options)"
              :key="opt.value"
              type="button"
              @click="toggleValue(field.key, opt.value)"
              :class="[ 'px-4 py-2 rounded-lg text-sm transition-all duration-200',
                isSelected(field.key, opt.value)
                  ? 'bg-primary text-white '
                  : 'bg-gray-50 dark:text-white-dark dark:bg-[#121e32] text-gray-700 hover:bg-gray-100'
              ]"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- Error message -->
        <p v-if="errors[field.key] && submitted" class="text-sm text-red-500 mt-1">
          {{ errors[field.key] }}
        </p>
      </div>

      <!-- Submit button -->
      <div v-if="!hideSubmit" class="col-span-full">
        <SubmitButton
          type="button"
          :loading="isSubmitting"
          :disabled="submitted && !isValid"
          :label="submitLabel || 'Enregistrer'"
          @click="handleSubmit"
        />
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch, ref } from 'vue';
import vSelect from 'vue-select';
import SubmitButton from './SubmitButton.vue';
import type { FieldConfig, SelectOption } from '@/interfaces/form';
import { required } from '@/utils/validate';
import flatPickr from 'vue-flatpickr-component';
import 'flatpickr/dist/flatpickr.css';
import 'vue-select/dist/vue-select.css';
import { French } from 'flatpickr/dist/l10n/fr.js';
import type { Options, DateOption } from 'flatpickr/dist/types/options';

const props = defineProps<{
  fields: FieldConfig[];
  modelValue: Record<string, unknown>;
  hideSubmit?: boolean;
  submitLabel?: string;
  title?: string;
  columns?: number;
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

const emit = defineEmits<{
  (e: 'submit', data: Record<string, unknown>): void;
  (e: 'update:modelValue', data: Record<string, unknown>): void;
  (e: 'validation-change', isValid: boolean): void;
}>();

const isSubmitting = ref(false);
const submitted = ref(false);
const formData = reactive<Record<string, unknown>>(props.modelValue);
const errors = reactive<Record<string, string | null>>({});

// Validation
const isValid = computed(() => {
  return Object.keys(errors).length === 0 && 
    props.fields.every(field => {
      const value = formData[field.key];
      return field.validators
        ? field.validators.every(v => v.fn(value))
        : true;
    });
});

function validateField(field: FieldConfig) {
  const value = formData[field.key];
  if (field.validators) {
    for (const validator of field.validators) {
      if (!validator.fn(value)) {
        errors[field.key] = validator.msg;
        emit('validation-change', false);
        return false;
      }
    }
  }
  delete errors[field.key];
  emit('validation-change', isValid.value);
  return true;
}

function onFieldChange(field: FieldConfig) {
  if (submitted.value) validateField(field);
}

// Watch for changes
watch(
  () => formData,
  val => {
    emit('update:modelValue', { ...val });
    if (submitted.value) props.fields.forEach(validateField);
  },
  { deep: true }
);

// Grid
const formGridClass = computed(() => {
  const cols = props.columns ?? (props.fields.length >= 3 ? 3 : props.fields.length === 2 ? 2 : 1);
  return `grid grid-cols-1 md:grid-cols-${cols} gap-6`;
});

// Options
function formattedOptions(options: Array<string | SelectOption> = []): SelectOption[] {
  return options.map(opt => (typeof opt === 'string' ? { label: opt, value: opt } : opt));
}

// Button-group helpers
function isSelected(key: string, value: unknown): boolean {
  const val = formData[key];
  return Array.isArray(val) && (val as unknown[]).includes(value);
}

function toggleValue(key: string, value: unknown) {
  const arr = (formData[key] as unknown[]) || [];
  const idx = arr.indexOf(value);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(value);
  emit('update:modelValue', { ...formData });
  if (submitted.value) validateField(props.fields.find(f => f.key === key)!);
}

// Submit
async function handleSubmit() {
  submitted.value = true;
  props.fields.forEach(field => validateField(field));
  if (!isValid.value) return;
  isSubmitting.value = true;
  await emit('submit', { ...formData });
  isSubmitting.value = false;
}

// Validation method
function validate(): boolean {
  submitted.value = true;
  let valid = true;
  props.fields.forEach(field => {
    if (!validateField(field)) {
      valid = false;
    }
  });
  emit('validation-change', valid);
  return valid;
}

// Expose validate() to parent
defineExpose({ validate });
</script>

<style>
.vs-error {
  --vs-border-color: #ef4444;
}

/* Vue-select styles */
:root {
  --vs-colors-lightest: rgba(60, 60, 60, 0.26);
  --vs-colors-light: rgba(60, 60, 60, 0.5);
  --vs-colors-dark: #333;
  --vs-colors-darkest: rgba(197, 51, 51, 0.15);

  --vs-border-color: #e2e8f0;
  --vs-border-width: 1px;
  --vs-border-style: solid;
  --vs-border-radius: 0.5rem;

  --vs-dropdown-bg: #fff;
  --vs-dropdown-z-index: 1000;

  --vs-actions-padding: 4px 6px 0 3px;
}

.vs-custom {
  font-family: inherit;
  width: 100%;
}

.vs-custom .vs__dropdown-toggle {
  padding: 0.5rem;
  background: white;
  border: var(--vs-border-width) var(--vs-border-style) var(--vs-border-color);
  border-radius: var(--vs-border-radius);
  transition: all 0.2s;
}

.vs-custom .vs__dropdown-toggle:hover {
  border-color: var(--color-primary);
}

.vs-custom .vs__dropdown-toggle:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(255, 204, 17, 0.1);
  outline: none;
}

.vs-custom .vs__search {
  padding: 0 7px;
  margin: 4px 0 0 0;
  font-size: 0.875rem;
  border: none;
}

.vs-custom .vs__search::placeholder {
  color: #94a3b8;
}

.vs-custom .vs__dropdown-menu {
  padding: 0.5rem 0;
  border: 1px solid var(--vs-border-color);
  border-radius: var(--vs-border-radius);
  background: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
              0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.vs-custom .vs__dropdown-option {
  padding: 0.5rem 1rem;
  color: #64748b;
}

.vs-custom .vs__dropdown-option--highlight {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.dark .vs-custom .vs__dropdown-toggle {
  background-color: #121e32;
  border-color: #17263c;
  color: var(--color-primary);
}

.vs-custom .vs__selected {
  color: var(--color-white-light);
}

.dark .vs-custom .vs__dropdown-toggle:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(255, 204, 17, 0.1);
  outline: none;
}

.vs-custom .vs__search::placeholder {
  color: #94a3b8;
}

.dark .vs-custom .vs__dropdown-toggle:hover {
  border-color: var(--color-primary);
}

.dark .vs-custom .vs__search {
  background-color: #121e32;
  color: #e2e8f0;
}

.dark .vs-custom .vs__dropdown-menu {
  background-color: #121e32;
  border-color: #17263c;
}

.dark .vs-custom .vs__dropdown-option {
  color: var(--color-white-light);
}

.dark .vs-custom .vs__dropdown-option--highlight {
  color: #ffcc11;
}

/* Flatpickr custom styles */
.flatpickr-calendar {
  background: #fff;
  border-radius: 0.70rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  font-family: inherit;
  
}

.flatpickr-month {
  height: 36px;
}

.flatpickr-current-month {
  padding-top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.flatpickr-monthDropdown-months {
  font-weight: 600;
  font-size: 1rem;
}

.flatpickr-weekdays {
  margin-top: 0.1rem;
}

.flatpickr-weekday {
  font-size: 0.500rem;
  color: #64748b;
  font-weight: 500;
}

.flatpickr-day {
  border-radius: 0.5rem;
  margin: 2.5px;
  height: 34px;
  line-height: 32px;
  color: #1e293b;
  font-weight: 500;
}

.flatpickr-day.selected {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.flatpickr-day.selected:hover {
  border-color: var(--color-primary);
  background: var(--color-primary);
}

.flatpickr-day:hover {
  background: #f1f5f9;
  border-color: #f1f5f9;
}

.flatpickr-day.today {
  border-color: var(--color-primary);
}

.flatpickr-months .flatpickr-prev-month, 
.flatpickr-months .flatpickr-next-month {
  top: 0;
  padding: 0.5rem;
  height: auto;
}

.flatpickr-months .flatpickr-prev-month svg, 
.flatpickr-months .flatpickr-next-month svg {
  width: 7px;
  height: 11px;
}

/* Dark mode styles */
.dark .flatpickr-calendar {
  background: #121e32;
  border-color: #17263c;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

.dark .flatpickr-weekday {
  color: #94a3b8;
}

.dark .flatpickr-day {
  color: #e2e8f0;
}

.dark .flatpickr-day:hover {
  background: #1e293b;
  border-color: #1e293b;
}

.dark .flatpickr-day.today {
  border-color: var(--color-primary);
}

.dark .flatpickr-monthDropdown-months,
.dark .flatpickr-current-month input.cur-year {
  color: #e2e8f0;
}

.dark .flatpickr-months .flatpickr-prev-month, 
.dark .flatpickr-months .flatpickr-next-month {
  color: #e2e8f0;
}
</style>