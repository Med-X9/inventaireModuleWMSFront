<!-- src/components/Modal.vue -->
<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center  px-4 pt-4 pb-20 text-center sm:block sm:p-0">
      <!-- Overlay semi-transparent -->
      <div class="fixed inset-0 transition-opacity" @click="close">
        <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>

      <div
       class="inline-block p-6 align-bottom panel rounded-lg text-left shadow-xl transform transition-all
              sm:my-8 sm:align-middle sm:max-w-3xl max-w-3xl w-full
               h-[72vh]   max-h-[80vh]"
       role="dialog"
       aria-modal="true"
       aria-labelledby="modal-headline"
     >
        <button
        type="button"
        class="absolute top-3 right-3 text-gray-500 hover:text-gray-700 focus:outline-none"
        @click="close"
        aria-label="Close modal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
          <div class="sm:flex mt-6 sm:items-start">
            <div class="mt-4 text-center sm:mt-0 sm:text-left w-full">
              <h3 v-if="title" class="text-lg leading-6 font-medium text-gray-900 mb-6 mt-2" id="modal-headline">
                {{ title }}
              </h3>
              <div class="mt-2">
                <slot />
              </div>
            </div>
        
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

/**
 * Cette modal expose :
 *  - Une prop `modelValue: boolean` pour le v-model.
 *  - Une prop optionnelle `title: string`.
 *  - Elle émet `update:modelValue` quand on ferme (clic sur overlay).
 */
const props = defineProps<{
  modelValue: boolean
  title?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

function close() {
  // Quand on clique sur l’overlay, on ferme la modal
  emit('update:modelValue', false)
}
</script>

<style scoped>
/* Rien de particulier ici ; la logique est dans la structure du template */
</style>
