<template>
  <div class="px-4">
    <div class="grid grid-cols-1 gap-6">
      <div>
        <label for="mode" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mode</label>
        <v-select
          id="mode"
          v-model="local.mode"
          :options="formattedOptions"
          placeholder="-- Sélectionner un mode --"
          label="label"
          :reduce="option => option.value"
          class="vs-custom"
        />
      </div>

      <div v-if="local.mode === 'liste emplacement'" class="space-y-4">
        <div v-for="item in ['Scanner', 'Saisie']" :key="item" class="flex items-center space-x-2">
          <input
            type="checkbox"
            :checked="local['use' + item]"
            @change="selectSingleOption(item)"
            class="w-5 h-5 text-primary border border-gray-300 rounded focus:ring-2 transition-all duration-200"
          />
          <label class="text-sm text-gray-700 dark:text-gray-300 mt-2 cursor-pointer">{{ item }}</label>
        </div>
      </div>

      <div v-if="local.mode === 'article + emplacement'" class="flex items-center space-x-2">
        <input
          type="checkbox"
          v-model="local.isVariant"
          @change="emitLocal"
          class="w-5 h-5 text-primary border border-gray-300 rounded focus:ring-2 focus:ring-primary transition-all duration-200"
        />
        <label class="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">Variantes</label>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { reactive, watch, computed } from 'vue'
import vSelect from 'vue-select'
import 'vue-select/dist/vue-select.css'

import type { ContageConfig } from '../interfaces/inventoryCreation'

const props = defineProps<{
  modelValue: ContageConfig
  stepIndex: number
  availableModes: string[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: ContageConfig): void
}>()

const local = reactive<ContageConfig>({ ...props.modelValue })

watch(
  () => props.modelValue,
  (val) => Object.assign(local, val),
  { deep: true }
)

watch(
  () => local,
  (val) => {
    if (val.mode !== 'liste emplacement') {
      val.useScanner = false
      val.useSaisie = false
    }
    if (val.mode !== 'article + emplacement') {
      val.isVariant = false
    }
    emit('update:modelValue', { ...val })
  },
  { deep: true }
)

const formattedOptions = computed(() => 
  props.availableModes.map(mode => ({ label: mode, value: mode }))
)

function emitLocal() {
  emit('update:modelValue', { ...local })
}

function selectSingleOption(option: string) {
  local.useScanner = false
  local.useSaisie = false
  local['use' + option] = true
  emitLocal()
}
</script>
<style>
.vs-custom {
  font-family: inherit;
  width: 100%;
}
.vs-custom .vs__dropdown-toggle {
  padding: 0.75rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
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
</style>
