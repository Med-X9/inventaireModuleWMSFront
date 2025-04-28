<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
    <h2 v-if="title" class="text-2xl font-medium text-gray-900 dark:text-white mb-6">
      {{ title }}
    </h2>

    <form @submit.prevent="handleSubmit" :class="formGridClass">
      <div v-for="field in fields" :key="field.key" class="space-y-6">
        <label
          v-if="field.type !== 'checkbox'"
          :for="field.key"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {{ field.label }}
        </label>

        <!-- Text / Email -->
        <div class="relative" v-if="field.type === 'text' || field.type === 'email'">
          <input
            :id="field.key"
            v-model="formData[field.key]"
            :type="field.type"
            :placeholder="field.props?.placeholder || `Entrer ${field.label.toLowerCase()}`"
            class="w-full px-4 py-3 bg-field-bg dark:bg-gray-700 border-2 border-field-border dark:border-gray-600 rounded-md text-field-text dark:text-white placeholder-field-placeholder focus:outline-none focus:border-field-border-focus focus:ring-0 transition-colors duration-300"
            v-bind="field.props"
          />
        </div>

        <!-- Date -->
        <div class="relative" v-else-if="field.type === 'date'">
          <input
            :id="field.key"
            v-model="formData[field.key]"
            type="date"
            class="w-full px-4 py-3 bg-field-bg dark:bg-gray-700 border-2 border-field-border dark:border-gray-600 rounded-md text-field-text dark:text-white focus:outline-none focus:border-field-border-focus focus:ring-0 transition-colors duration-300"
          />
        </div>

        <div v-else-if="field.type === 'checkbox'" class="flex items-center space-x-2">
          <input
            :id="field.key"
            v-model="formData[field.key]"
            type="checkbox"
            class="w-5 h-5 text-field-focus border-2 border-field-border dark:border-gray-600 rounded-md cursor-pointer focus:outline-none transition-all duration-300"
            @change="onSingleCheckbox(field.key)"
          />
          <label
            :for="field.key"
            class="text-sm text-field-text mt-2 dark:text-gray-300 cursor-pointer"
          >
            {{ field.key }}
          </label>
        </div>

        <!-- Select -->
        <div class="relative" v-else-if="field.type === 'select'">
          <!-- Searchable -->
          <v-select
            v-if="field.searchable"
            :id="field.key"
            v-model="formData[field.key]"
            :options="formattedOptions(field.options)"
            :multiple="field.multiple || false"
            :clearable="true"
            :searchable="true"
            :placeholder="field.props?.placeholder || '-- Sélectionner --'"
            label="label"
            :reduce="option => option.value"
            class="w-full px-4 py-3 bg-field-bg dark:bg-gray-700 border-2 border-field-border dark:border-gray-600 rounded-md text-field-text dark:text-white focus:outline-none focus:border-field-border-focus focus:ring-0 transition-colors duration-300"
          />

          <!-- Native -->
          <select
            v-else
            :id="field.key"
            v-model="formData[field.key]"
            class="w-full px-4 py-3 bg-field-bg dark:bg-gray-700 border-2 border-field-border dark:border-gray-600 rounded-md text-field-text dark:text-white appearance-none focus:outline-none focus:border-field-border-focus focus:ring-0 transition-colors duration-300"
          >
            <option disabled value="">-- Sélectionner --</option>
            <option
              v-for="option in field.options"
              :key="typeof option === 'string' ? option : option.value"
              :value="typeof option === 'string' ? option : option.value"
            >
              {{ typeof option === 'string' ? option : option.label }}
            </option>
          </select>

          <!-- Flèche personnalisée -->
          <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <svg class="w-5 h-5 text-field-placeholder" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Submit Button -->
      <div v-if="!hideSubmit" class="mt-6 col-span-full">
        <button
          type="submit"
          class="px-6 py-2 bg-button-bg hover:bg-button-hover text-white font-medium rounded-md shadow-md hover:shadow-lg transition-all duration-300"
        >
          <span class="text-sm">{{ submitLabel || 'Enregistrer' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import Swal from 'sweetalert2'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'

export interface SelectOption {
  label: string
  value: any
}

export interface FieldConfig {
  key: string
  label: string
  type: 'text' | 'email' | 'checkbox' | 'select' | 'date'
  options?: Array<string | SelectOption>
  props?: Record<string, any>
  searchable?: boolean
  multiple?: boolean
}

const props = defineProps<{
  fields: FieldConfig[]
  initialData?: Record<string, any>
  title?: string
  submitLabel?: string
  hideSubmit?: boolean
}>()

const emit = defineEmits<{ (e: 'submit', data: Record<string, any>): void }>()

// Initialisation réactive des données de formulaire
const formData = reactive<Record<string, any>>({})
props.fields.forEach(field => {
  formData[field.key] =
    props.initialData?.[field.key] ??
    (field.multiple ? [] : field.type === 'checkbox' ? false : '')
})

// Grille responsive en fonction du nombre de champs
const formGridClass = computed(() => {
  const cols = Math.min(props.fields.length, 3)
  return `grid grid-cols-1 md:grid-cols-${cols} gap-6`
})

// Pour formater les options des selects
function formattedOptions(options: Array<string | SelectOption> = []) {
  return options.map(opt =>
    typeof opt === 'string'
      ? { label: opt, value: opt }
      : opt
  )
}

// Décoche toutes les autres checkbox quand on en coche une
function onSingleCheckbox(changedKey: string) {
  props.fields.forEach(f => {
    if (f.type === 'checkbox' && f.key !== changedKey) {
      formData[f.key] = false
    }
  })
}

// Soumission du formulaire
function handleSubmit() {
  emit('submit', { ...formData })
  Swal.fire({
    icon: 'success',
    text: 'Votre formulaire a été soumis avec succès.',
    padding: '2em',
    customClass: { popup: 'sweet-alerts' }
  })
}
</script>

<style scoped>
input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(0.5);
}

.dark input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
}

.vue-select .vs__dropdown-toggle {
  padding-right: 2.5rem;
}
.vue-select .vs__actions {
  right: 0.75rem;
}
</style>
