<template>
    <button
      :type="type"
      class="px-4 py-2 bg-primary text-white rounded-lg shadow hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center"
      :disabled="disabled"
      @click="onClick"
    >
      <!-- Loader SVG -->
      <svg
        v-if="loading"
        class="animate-spin h-5 w-5 mr-2"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4l3-3-3-3v4a12 12 0 00-12 12h4z"
        />
      </svg>
      <span>{{ label }}</span>
    </button>
  </template>
  
  <script setup lang="ts">
  const props = defineProps<{
    type?: 'button' | 'submit' | 'reset';
    loading?: boolean;
    disabled?: boolean;
    label?: string;
  }>();
  
  // Déclare l’emit 'click'
  const emit = defineEmits(['click'] as const);
  
  function onClick() {
    emit('click');
  }
  </script>
  