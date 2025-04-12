<template>
    <div class="max-w-3xl mx-auto p-6 rounded-2xl shadow-lg bg-white dark:bg-[#050608]">
      <h2 class="text-3xl font-bold text-gray-700 dark:text-white mb-8">{{ title }}</h2>
  
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div v-for="field in fields" :key="field.key" class="space-y-1">
          <label :for="field.key" class="form-label text-primary dark:text-white">
            {{ field.label }}
          </label>
  
          <input
            v-if="field.type === 'text' || field.type === 'email'"
            :id="field.key"
            v-model="formData[field.key]"
            :type="field.type"
            class="form-input"
            v-bind="field.props"
          />
  
          <input
            v-else-if="field.type === 'date'"
            :id="field.key"
            v-model="formData[field.key]"
            type="date"
            class="form-input"
          />
  
          <div v-else-if="field.type === 'checkbox'" class="flex items-center">
            <input
              :id="field.key"
              v-model="formData[field.key]"
              type="checkbox"
              class="form-checkbox outline-yellow"
            />
            <label :for="field.key" class="ml-2 text-sm font-medium">{{ field.label }}</label>
          </div>
  
          <select
            v-else-if="field.type === 'select'"
            :id="field.key"
            v-model="formData[field.key]"
            class="form-select"
          >
            <option disabled value="">-- Sélectionner --</option>
            <option v-for="option in field.options" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
        </div>
  
        <div class="flex justify-end">
          <button type="submit" class="btn btn-primary rounded-full flex px-4 justify-end gap-2">
            <IconSave class="w-5 h-5 ltr:mr-1.5 rtl:ml-1.5 shrink-0" />
            {{ submitLabel || 'Enregistrer' }}
          </button>
        </div>
      </form>
    </div>
  </template>
  
  <script lang="ts" setup>
  import { reactive } from 'vue'
  import Swal from 'sweetalert2'
  import IconSave from '@/components/icon/icon-save.vue'
  
  interface FieldConfig {
    key: string
    label: string
    type: 'text' | 'email' | 'checkbox' | 'select' | 'date'
    options?: string[]
    props?: Record<string, any>
  }
  
  const props = defineProps<{
    fields: FieldConfig[]
    initialData?: Record<string, any>
    title?: string
    submitLabel?: string
  }>()
  
  const emit = defineEmits<{
    (e: 'submit', data: Record<string, any>): void
  }>()
  
  const formData = reactive<Record<string, any>>({})
  
  props.fields.forEach(field => {
    formData[field.key] = props.initialData?.[field.key] ?? (field.type === 'checkbox' ? false : '')
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
  
  <style scoped lang="postcss">
</style>

  