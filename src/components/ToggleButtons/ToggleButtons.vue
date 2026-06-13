<script setup lang="ts">
import type { Component } from 'vue'
import MdiIcon from '@/components/MdiIcon.vue'

interface ToggleOption {
  value: string
  /** Composant Vue ou nom d'icône MDI (`mdi-view-list`, etc.) */
  icon?: Component | string
}

interface Props {
  modelValue: string
  options: ToggleOption[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <div class="bg-gray-500/5 dark:bg-dark-bg dark:border-dark-borde py-1 px-4 rounded-lg shadow-sm">
    <button
      v-for="option in options"
      :key="option.value"
      @click="emit('update:modelValue', option.value)"
      :class="[
        'px-3 py-1 rounded-md transition-all duration-300 transform',
        modelValue === option.value
          ? 'bg-white dark:bg-dark-light/10 text-primary shadow-sm scale-100'
          : 'text-secondary hover:text-secondary-dark scale-95 hover:scale-100'
      ]"
    >
      <MdiIcon
        v-if="typeof option.icon === 'string'"
        :name="option.icon"
        size="sm" />
      <component
        v-else-if="option.icon"
        :is="option.icon"
        class="w-5 h-5" />
    </button>
  </div>
</template>
