<script setup lang="ts">
import type { Component } from 'vue'

interface ToggleOption {
  value: string
  icon?: Component
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
  <div class="bg-secondary-light dark:bg-dark-bg dark:border-dark-borde p-1 rounded-lg shadow-sm">
    <button
      v-for="option in options"
      :key="option.value"
      @click="emit('update:modelValue', option.value)"
      :class="[
        'px-4 py-2 rounded-md transition-all duration-300 transform',
        modelValue === option.value
          ? 'bg-white dark:bg-dark-light/10 text-primary shadow-sm scale-100'
          : 'text-secondary hover:text-secondary-dark scale-95 hover:scale-100'
      ]"
    >
      <component :is="option.icon" class="w-5 h-5" v-if="option.icon" />
    </button>
  </div>
</template>
