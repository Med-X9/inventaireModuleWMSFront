<template>
  <div>
    <nav 
      v-if="items && items.length > 0" 
      class="flex flex-col lg:flex-row gap-3 lg:gap-2 justify-between lg:space-x-2 text-sm py-3 md:py-4 px-4 md:px-6 border-b border-gray-200" 
      aria-label="Fil d'Ariane"
    >
      <!-- Section du fil d'Ariane -->
      <div class="flex-1 min-w-0">
        <ul class="flex items-center space-x-1 rtl:space-x-reverse overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <li v-for="(item, index) in items" :key="index" class="flex items-center flex-shrink-0">
            <!-- Séparateur - affiché seulement entre les éléments -->
            <span 
              v-if="index > 0" 
              class="mx-1 sm:mx-2 text-gray-400 flex-shrink-0"
            >
              /
            </span>

            <!-- Élément avec tooltip pour INV-001 -->
            <div
              v-if="item.label === 'INV-001'"
              class="relative group cursor-pointer flex-shrink-0"
              v-tippy="{
                content: tooltipContent,
                allowHTML: true,
                placement: 'bottom',
                interactive: true,
                theme: '--color-primary',
                zIndex: 100
              }"
            >
              <span 
                class="text-gray-700 hover:text-primary hover:underline font-medium whitespace-nowrap"
              >
                {{ item.label }}
              </span>
            </div>

            <!-- Lien pour les éléments avec path -->
            <router-link
              v-else-if="item.path && !item.isActive"
              :to="item.path"
              class="text-gray-600 hover:text-primary-700 hover:underline transition-colors whitespace-nowrap"
            >
              {{ item.label }}
            </router-link>
            
            <!-- Texte simple pour les éléments actifs ou sans lien -->
            <span 
              v-else
              class="whitespace-nowrap"
              :class="{
                'text-primary font-medium': item.isActive,
                'text-gray-500': !item.isActive
              }"
            >
              {{ item.label }}
            </span>
          </li>
        </ul>
      </div>

      <!-- Étapes d'inventaire -->
      <div v-if="shouldShowSteps && inventorySteps.length > 0" class="flex-shrink-0">
        <div class="flex items-center justify-start lg:justify-end">
          <div class="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div 
              v-for="(step, index) in inventorySteps" 
              :key="step.id"
              class="flex items-center flex-shrink-0"
            >
              <!-- Étape -->
              <div class="flex items-center">
                <div 
                  class="flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 text-xs flex-shrink-0"
                  :class="{
                    'bg-primary text-white': step.isCompleted || (step.isActive && !step.isCompleted),
                    'bg-gray-200 text-gray-700': !step.isActive && !step.isCompleted
                  }"
                >
                  <svg 
                    v-if="step.isCompleted" 
                    class="w-3 h-3" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fill-rule="evenodd" 
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span v-else class="font-semibold">{{ step.order }}</span>
                </div>
                <span 
                  class="ml-2 text-xs sm:text-sm font-medium whitespace-nowrap"
                  :class="{
                    'text-primary': step.isCompleted || (step.isActive && !step.isCompleted),
                    'text-gray-500': !step.isActive && !step.isCompleted
                  }"
                >
                  {{ step.label }}
                </span>
              </div>
              
              <!-- Connecteur entre les étapes -->
              <div 
                v-if="index < inventorySteps.length - 1"
                class="mx-2 sm:mx-3 h-0.5 w-6 sm:w-8 transition-colors duration-200 flex-shrink-0"
                :class="{
                  'bg-primary': step.isCompleted,
                  'bg-gray-300': !step.isCompleted
                }"
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
    
    <!-- Debug: afficher les items pour diagnostiquer -->
    <div v-if="showDebug" class="p-2 bg-gray-100 text-xs overflow-x-auto">
      <strong>Debug breadcrumb:</strong>
      <pre class="whitespace-pre-wrap break-words">{{ JSON.stringify(items, null, 2) }}</pre>
      <strong>Debug inventory steps:</strong>
      <pre class="whitespace-pre-wrap break-words">{{ JSON.stringify(inventorySteps, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useInventoryStatus } from '../../composables/useInventoryStatus';

type BreadcrumbItem = {
  label: string;
  path?: string;
  isActive?: boolean;
};

interface Props {
  items: BreadcrumbItem[];
  showDebug?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showDebug: false
});

const route = useRoute();
const { inventorySteps, shouldShowSteps, updateStatusFromInventory } = useInventoryStatus();

// Contenu du tooltip pour INV-001
const tooltipContent = computed(() => `
  <div class="p-3 text-sm max-w-xs">
    <div class="space-y-1">
      <div><strong>Référence:</strong> INV-001</div>
      <div><strong>Date:</strong> 2025-04-30</div>
      <div><strong>Libellé:</strong> Inventaire de printemps</div>
      <div><strong>Type:</strong> Inventaire Général</div>
    </div>
  </div>
`);

// Initialiser le statut quand le composant est monté
onMounted(async () => {
  await updateStatusFromInventory();
});

// Mettre à jour le statut quand l'ID de l'inventaire change
watch(
  () => route.params.id,
  async () => {
    await updateStatusFromInventory();
  },
  { immediate: false }
);
</script>

<style scoped>
/* Styles pour les barres de défilement personnalisées */
.scrollbar-thin {
  scrollbar-width: thin;
}

.scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 6px;
}

.scrollbar-track-gray-100::-webkit-scrollbar-track {
  background-color: #f3f4f6;
}

.scrollbar-thin::-webkit-scrollbar {
  height: 4px;
}

/* Masquer les barres de défilement sur mobile si nécessaire */
@media (max-width: 640px) {
  .scrollbar-thin::-webkit-scrollbar {
    display: none;
  }
  
  .scrollbar-thin {
    scrollbar-width: none;
  }
}
</style>