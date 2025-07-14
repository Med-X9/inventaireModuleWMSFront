<template>
  <svg
    :class="classes"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.1" />
    <path
      d="M12 4L12 20M12 4L6 10M12 4L18 10"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: number | string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 16,
  class: ''
})

const classes = computed(() => {
  return `icon-sort-asc ${props.class}`.trim()
})
</script>

<style scoped>
.icon-sort-asc {
  transition: all 0.2s ease;
}

.icon-sort-asc:hover {
  transform: scale(1.1);
}
</style>
