<template>
  <div v-if="shouldShowSteps && inventorySteps.length > 0" 
       class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-1">
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300 mr-4">
          Progression de l'inventaire :
        </span>
        
        <div class="flex items-center space-x-2">
          <div 
            v-for="(step, index) in inventorySteps" 
            :key="step.id"
            class="flex items-center"
          >
            <!-- Étape -->
            <div class="flex items-center">
              <!-- Cercle de l'étape -->
              <div 
                class="flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200"
                :class="{
                  'bg-green-500 border-green-500 text-white': step.isCompleted,
                  'bg-blue-500 border-blue-500 text-white': step.isActive && !step.isCompleted,
                  'bg-gray-200 border-gray-300 text-gray-500 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-400': !step.isActive && !step.isCompleted
                }"
              >
                <!-- Icône de validation pour les étapes terminées -->
                <svg 
                  v-if="step.isCompleted" 
                  class="w-4 h-4" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path 
                    fill-rule="evenodd" 
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                    clip-rule="evenodd"
                  />
                </svg>
                <!-- Numéro de l'étape pour les autres -->
                <span v-else class="text-sm font-semibold">{{ step.order }}</span>
              </div>
              
              <!-- Label de l'étape -->
              <span 
                class="ml-2 text-sm font-medium transition-colors duration-200"
                :class="{
                  'text-green-600 dark:text-green-400': step.isCompleted,
                  'text-blue-600 dark:text-blue-400': step.isActive && !step.isCompleted,
                  'text-gray-500 dark:text-gray-400': !step.isActive && !step.isCompleted
                }"
              >
                {{ step.label }}
              </span>
            </div>
            
            <!-- Séparateur entre les étapes -->
            <div 
              v-if="index < inventorySteps.length - 1"
              class="mx-4 h-0.5 w-12 transition-colors duration-200"
              :class="{
                'bg-green-500': step.isCompleted,
                'bg-gray-300 dark:bg-gray-600': !step.isCompleted
              }"
            />
          </div>
        </div>
      </div>
      
      <!-- Actions optionnelles -->
      <div class="flex items-center space-x-2">
        <button
          v-if="!isLastStepActive"
          @click="nextStep"
          class="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
        >
          Étape suivante →
        </button>
        
        <div class="text-xs text-gray-500 dark:text-gray-400">
          {{ currentStepLabel }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useInventoryStatus } from '@/composables/useInventoryStatus';

const { 
  inventorySteps, 
  shouldShowSteps, 
  nextStep, 
  currentInventoryStatus 
} = useInventoryStatus();

// Label de l'étape actuelle
const currentStepLabel = computed(() => {
  const activeStep = inventorySteps.value.find(step => step.isActive);
  return activeStep ? `Étape actuelle: ${activeStep.label}` : '';
});

// Vérifier si on est à la dernière étape
const isLastStepActive = computed(() => {
  const lastStep = inventorySteps.value[inventorySteps.value.length - 1];
  return lastStep?.isActive;
});
</script>