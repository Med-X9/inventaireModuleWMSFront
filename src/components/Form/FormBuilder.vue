
<template>
  <div class="container mx-auto">
    <h2 v-if="title" class="text-xl font-bold text-gray-800 mb-6">
      {{ title }}
    </h2>

    <form :class="formGridClass" @submit.prevent>
      <div
        v-for="field in fields"
        :key="field.key"
        class="w-full"
      >
        <!-- Label pour tous sauf checkbox -->
        <label
          v-if="field.type !== 'checkbox'"
          :for="field.key"
          class="block text-sm font-medium dark:text-gray-400  text-gray-700 mb-2"
        >
          {{ field.label }}
          <span v-if="field.validators?.some(v => v.key === field.key && v.fn === required().fn)" class="text-red-500">*</span>
        </label>

        <!-- Input texte/email/date -->
        <input
          v-if="['text', 'email', 'date'].includes(field.type)"
          :id="field.key"
          v-model="formData[field.key]"
          :type="field.type"
          v-bind="field.props"
          class="w-full form-input px-4   py-3 bg-white border border-gray-200 rounded-lg transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-10 outline-none"
          :class="{'border-red-500': errors[field.key]}"
          @blur="validateField(field)"
          @input="onFieldChange(field)"
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
            @change="validateField(field)"
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
              name="default_radio" class="form-radio" checked
              @change="validateField(field)"
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
  class="vs-custom  dark"
  :class="{'vs-error': errors[field.key]}"
  @input="onFieldChange(field)"
/>

        </div>

        <!-- Button-group -->
        <div v-else-if="field.type === 'button-group'">
          <div class="flex flex-wrap max-h-[200px] overflow-x-auto gap-2 dark:border-dark-border dark:bg-[#0e1726]  bg-white p-4 rounded-lg border border-gray-200">
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

        <!-- Message d'erreur -->
        <p v-if="errors[field.key]" class="text-sm text-red-500 mt-1">
          {{ errors[field.key] }}
        </p>
      </div>

      <!-- Bouton de soumission (non utilisé si hideSubmit) -->
      <div v-if="!hideSubmit" class="col-span-full">
        <SubmitButton
          type="button"
          :loading="isSubmitting"
          :disabled="!isValid"
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
import 'vue-select/dist/vue-select.css';

const props = defineProps<{
  fields: FieldConfig[];
  modelValue: unknown;
  hideSubmit?: boolean;
  submitLabel?: string;
  title?: string;
  columns?: number;
}>();

const emit = defineEmits<{
  (e: 'submit', data: Record<string, unknown>): void;
  (e: 'update:modelValue', data: Record<string, unknown>): void;
  (e: 'validation-change', isValid: boolean): void;
}>();

const isSubmitting = ref(false);
const formData = reactive<Record<string, unknown>>(props.modelValue as Record<string, unknown>);
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
  validateField(field);
}

// Réémettre à chaque changement
watch(
  () => formData,
  val => {
    emit('update:modelValue', { ...val });
    props.fields.forEach(validateField);
  },
  { deep: true }
);

// Grille
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
  validateField(props.fields.find(f => f.key === key)!);
}

// Soumission via le SubmitButton interne
async function handleSubmit() {
  const valid = validate();
  if (!valid) return;
  
  isSubmitting.value = true;
  await emit('submit', { ...formData });
  isSubmitting.value = false;
}

// Méthode de validation exposée
function validate(): boolean {
  let valid = true;
  props.fields.forEach(field => {
    if (!validateField(field)) {
      valid = false;
    }
  });
  emit('validation-change', valid);
  return valid;
}

// Expose validate() au parent
defineExpose({ validate });
</script>

<style>
.vs-error {
  --vs-border-color: #ef4444;
}
</style>



<style>
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

/* Styles pour vue-select */
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
  color: var(--color-primary-600);
}
.dark .vs-custom .vs__dropdown-toggle {
  background-color: #121e32;
  border-color: #17263c;
  color:var(--color-primary-600);
}
.vs-custom .vs__selected {
  color:var(--color-white-light);
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
  
  color: #ffcc11; /* Primary color for highlighted option */
}

</style>