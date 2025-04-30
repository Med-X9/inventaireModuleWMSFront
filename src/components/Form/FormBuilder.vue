<template>
  <div class="container mx-auto px-4">
    <h2 v-if="title" class="text-xl font-bold text-gray-800 mb-6">
      {{ title }}
    </h2>

    <form @submit.prevent="handleSubmit" :class="formGridClass">
      <div v-for="field in fields" :key="field.key" class="w-full mb-6">
        <label
          v-if="field.type !== 'checkbox'"
          :for="field.key"
          class="block text-sm font-medium text-gray-700 mb-2"
        >
          {{ field.label }}
        </label>

        <!-- Text / Email -->
        <div v-if="field.type === 'text' || field.type === 'email'">
          <input
            :id="field.key"
            v-model="formData[field.key]"
            :type="field.type"
            :placeholder="field.props?.placeholder || `Entrer ${field.label.toLowerCase()}`"
            v-bind="field.props"
            class="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-10 outline-none"
          />
        </div>

        <!-- Date -->
        <div v-else-if="field.type === 'date'">
          <input
            :id="field.key"
            v-model="formData[field.key]"
            type="date"
            class="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-10 outline-none"
          />
        </div>

        <!-- Checkbox -->
        <div v-else-if="field.type === 'checkbox'" class="flex items-center space-x-2">
          <input
            :id="field.key"
            v-model="formData[field.key]"
            type="checkbox"
            @change="onSingleCheckbox(field.key)"
            class="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary-600"
          />
          <label :for="field.key" class="text-sm text-gray-700">
            {{ field.label }}
          </label>
        </div>

        <!-- Select (vue-select) -->
        <div v-else-if="field.type === 'select'">
          <v-select
            :id="field.key"
            v-model="formData[field.key]"
            :options="formattedOptions(field.options)"
            :multiple="field.multiple || false"
            :searchable="field.searchable ?? false"
            :clearable="field.clearable ?? true"
            :placeholder="field.props?.placeholder || '-- Sélectionner --'"
            label="label"
            :reduce="opt => opt.value"
            class="vs-custom"
          />
        </div>
      </div>

      <!-- Si vous souhaitez toujours un bouton Enregistrer interne, laissez-le visible -->
      <div v-if="!hideSubmit" class="col-span-full mt-6">
        <button
          type="submit"
          class="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 hover:bg-blue-700 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20"
        >
          {{ submitLabel || 'Enregistrer' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import { alertService } from '@/services/alertService'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'

import type { FieldConfig } from '@/interfaces/form'

const props = defineProps<{
  fields: FieldConfig[]
  modelValue: Record<string, any>
  hideSubmit?: boolean
  submitLabel?: string
  title?: string
}>()

const emit = defineEmits<{
  (e: 'submit', data: Record<string, any>): void
  (e: 'update:modelValue', data: Record<string, any>): void
}>()

// Initialise formData à partir de la prop modelValue
const formData = reactive<{ [key: string]: any }>({ ...props.modelValue })

// Sync si parent change modelValue de l'extérieur
watch(
  () => props.modelValue,
  val => Object.assign(formData, val),
  { deep: true }
)

// À chaque modif de formData, on émet pour mettre à jour le parent
watch(
  () => formData,
  val => emit('update:modelValue', { ...val }),
  { deep: true }
)

const formGridClass = computed(() => {
  const count = props.fields.length
  const cols = count >= 3 ? 3 : count === 2 ? 2 : 1
  return `grid grid-cols-1 md:grid-cols-${cols} gap-6`
})

function formattedOptions(options: Array<string | { label: string; value: any }> = []) {
  return options.map(opt =>
    typeof opt === 'string'
      ? { label: opt, value: opt }
      : opt
  )
}

function onSingleCheckbox(changedKey: string) {
  props.fields.forEach(f => {
    if (f.type === 'checkbox' && f.key !== changedKey) {
      formData[f.key] = false
    }
  })
}

async function handleSubmit() {
  emit('submit', { ...formData })
  await alertService.success({ text: 'Formulaire soumis avec succès' })
}
</script>


<style>
/* Styles personnalisés pour vue-select */
:root {
  --vs-colors-lightest: rgba(60, 60, 60, 0.26);
  --vs-colors-light:     rgba(60, 60, 60, 0.5);
  --vs-colors-dark:      #333;
  --vs-colors-darkest:   rgba(0, 0, 0, 0.15);

  --vs-border-color:     #e2e8f0;
  --vs-border-width:     1px;
  --vs-border-style:     solid;
  --vs-border-radius:    0.5rem;

  --vs-dropdown-bg:      #fff;
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
  border-color: #cbd5e1;
}

.vs-custom .vs__dropdown-toggle:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
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
  background: #f1f5f9;
  color: #1e293b;
}
</style>