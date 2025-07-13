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
      d="M12 4L12 8M12 4L9 7M12 4L15 7"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.5"
    />
    <path
      d="M12 20L12 16M12 20L9 17M12 20L15 17"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.5"
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
  return `icon-sort-both ${props.class}`.trim()
})
</script>

<style scoped>
.icon-sort-both {
  transition: all 0.2s ease;
}

.icon-sort-both:hover {
  transform: scale(1.1);
}
</style>
