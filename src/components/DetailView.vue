<script setup lang="ts">
defineProps<{
  show: boolean;
  title: string;
  onClose: () => void;
}>();
</script>

<template>
  <Transition name="modal">
    <div v-if="show" class="fixed inset-0 z-50">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-black bg-opacity-50" @click="onClose"></div>
      
      <!-- Content -->
      <div class="absolute inset-4 bg-white rounded-xl shadow-2xl overflow-auto">
        <div class="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 class="text-xl font-semibold">{{ title }}</h2>
          <button 
            @click="onClose"
            class="p-2 hover:bg-gray-100 rounded-full"
          >
            ✕
          </button>
        </div>
        
        <div class="p-6">
          <slot></slot>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>