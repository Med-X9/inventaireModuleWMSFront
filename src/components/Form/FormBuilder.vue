<template>
  <div class="max-w-3xl py-5 px-3 rounded-xl shadow-md mb-10 dark:bg-[#050608]">
    <h2 v-if="title" class="text-xl text-gray-700 dark:text-white mb-10">{{ title }}</h2>

    <form @submit.prevent="handleSubmit" :class="formGridClass">
      <div v-for="field in fields" :key="field.key" class="space-y-1">
        <label :for="field.key" class="form-label text-gray-700 dark:text-white">
          {{ field.label }}
        </label>

        <!-- Texte / Email -->
        <input
          v-if="field.type === 'text' || field.type === 'email'"
          :id="field.key"
          v-model="formData[field.key]"
          :type="field.type"
          :placeholder="field.props?.placeholder || `Entrer ${field.label.toLowerCase()}`"
          class="form-input w-full"
          v-bind="field.props"
        />

        <!-- Date -->
        <input
          v-else-if="field.type === 'date'"
          :id="field.key"
          v-model="formData[field.key]"
          type="date"
          :placeholder="field.props?.placeholder || `Choisir ${field.label.toLowerCase()}`"
          class="form-input w-full"
        />

        <!-- Checkbox -->
        <div v-else-if="field.type === 'checkbox'" class="flex items-center pt-2">
          <input
            :id="field.key"
            v-model="formData[field.key]"
            type="checkbox"
            class="form-checkbox"
          />
          <label :for="field.key" class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
            {{ field.label }}
          </label>
        </div>

        <!-- Select -->
        <template v-else-if="field.type === 'select'">
          <v-select
            v-if="field.searchable"
            :id="field.key"
            v-model="formData[field.key]"
            :options="field.options"
            :multiple="field.multiple || false"
            :placeholder="field.props?.placeholder || '-- Sélectionner --'"
            :clearable="true"
            label="label"
            :reduce="option => option.value"
            class="py-1 w-full vue-select"
          />
          <select
            v-else
            :id="field.key"
            v-model="formData[field.key]"
            class="form-input"
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
        </template>
      </div>

      <!-- Bouton -->
      <div v-if="!hideSubmit" class="md:col-span-3 flex justify-start pt-3">
        <button
          type="submit"
          class="btn btn-primary w-full md:w-auto px-8 py-2 rounded-lg text-white bg-primary transition-all flex items-center gap-2 justify-center"
        >
          <IconSave class="w-5 h-5" />
          {{ submitLabel || 'Enregistrer' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import Swal from 'sweetalert2'
import IconSave from '@/components/icon/icon-save.vue'
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

const emit = defineEmits<{
  (e: 'submit', data: Record<string, any>): void
}>()

const formData = reactive<Record<string, any>>({})

props.fields.forEach(field => {
  formData[field.key] = props.initialData?.[field.key] ?? (
    field.multiple ? [] : field.type === 'checkbox' ? false : ''
  )
})

const formGridClass = computed(() => {
  const cols = Math.min(props.fields.length, 3)
  return `grid grid-cols-${cols} gap-6`
})

function handleSubmit() {
  emit('submit', { ...formData })
  Swal.fire({
    icon: 'success',
    text: 'Votre formulaire a été soumis avec succès.',
    padding: '2em',
    customClass: {
      popup: 'sweet-alerts'
    }
  })
}
</script>

<style scoped>
.vue-select {
  width: 100%;
}

</style>
