<template>
    <!-- Mode Select -->
    <div class="relative px-4">
      <label for="mode" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mode</label>
      <div class="relative w-full mt-6 mb-6">
        <select
          id="mode"
          v-model="local.mode"
          class="w-full px-4 pr-10 py-3 bg-field-bg dark:bg-gray-700 border-2 border-field-border dark:border-gray-600 rounded-md text-field-text dark:text-white appearance-none focus:outline-none focus:border-field-border-focus focus:ring-0 transition-colors duration-300"
        >
          <option value="">-- Sélectionner un mode --</option>
          <option value="etat de stock">État de stock</option>
          <option value="liste emplacement">Liste emplacement</option>
          <option value="article+emplacement">Article + emplacement</option>
        </select>
  
        <!-- Flèche SVG superposée -->
        <svg
          class="pointer-events-none absolute top-1/2 right-3 transform -translate-y-1/2 w-5 h-5 text-field-placeholder"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
        </svg>
      </div>
    </div>
  
    <!-- Liste emplacement options (1 seule case cochable à la fois) -->
    <div v-if="local.mode === 'liste emplacement'" class="mt-6 space-y-4 px-4">
      <div v-for="item in ['Scanner', 'Saisie', 'Hybride']" :key="item" class="flex items-center space-x-2">
        <input
          type="checkbox"
          :checked="local['use' + item]"
          @change="selectSingleOption(item)"
          class="w-5 h-5 text-field-focus border-2 border-field-border dark:border-gray-600 rounded-md cursor-pointer focus:outline-none transition-all duration-300"
        />
        <label class="text-sm text-field-text mt-2 dark:text-gray-300 cursor-pointer">{{ item }}</label>
      </div>
    </div>
  
    <!-- Article+emplacement option -->
    <div v-if="local.mode === 'article+emplacement'" class="mt-6 flex items-center space-x-2 px-4">
      <input
        type="checkbox"
        v-model="local.isVariant"
        @change="emitLocal"
        class="w-5 h-5 text-field-focus border-2 border-field-border dark:border-gray-600 rounded-md cursor-pointer focus:outline-none transition-all duration-300"
      />
      <label class="text-sm text-field-text dark:text-gray-300 mt-2 cursor-pointer">Variantes</label>
    </div>
  </template>
  
  <script setup lang="ts">
  import { reactive, watch } from 'vue'
  
  type ParamData = {
    mode: string
    isVariant: boolean
    useScanner: boolean
    useSaisie: boolean
    useHybride: boolean
  }
  
  const props = defineProps<{ modelValue: ParamData }>()
  const emit = defineEmits<{ (e: 'update:modelValue', value: ParamData): void }>()
  
  const local = reactive<ParamData>({ ...props.modelValue })
  
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
        val.useHybride = false
      }
      if (val.mode !== 'article+emplacement') {
        val.isVariant = false
      }
      emit('update:modelValue', { ...val })
    },
    { deep: true }
  )
  
  function emitLocal() {
    emit('update:modelValue', { ...local })
  }
  
  // Permet de cocher une seule case à la fois
  function selectSingleOption(option: string) {
    local.useScanner = false
    local.useSaisie = false
    local.useHybride = false
  
    local['use' + option] = true
    emitLocal()
  }
  </script>
  