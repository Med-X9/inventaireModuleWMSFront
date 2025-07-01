<template>
  <div class="flex items-center space-x-3">
    <!-- Parcourir les actions en fonction de la prop actions -->
    <Tooltip
      v-for="action in actions"
      :key="action"
      :text="tooltips[action]"
      position="bottom"
      class="inline-block"
    >
      <router-link
        :to="getRoute(action)"
        class="hover:opacity-75"
      >
        <component :is="icons[action]" class="h-6 w-6" />
      </router-link>
    </Tooltip>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
// Utilisation du tooltip custom
import Tooltip from '@/components/Tooltip.vue';

// Props: inventoryId et liste d'actions à afficher
const props = defineProps<{ 
  inventoryId: number | string;
  actions: ('detail' | 'planning' | 'affectation')[];
}>();

// Map des icônes SVG sous forme de composants inline
const icons = {
  detail: {
    template: `<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
      <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z' />
    </svg>`
  },
  planning: {
    template: `<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
      <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
    </svg>`
  },
  affectation: {
    template: `<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
      <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M9 5l7 7-7 7' />
    </svg>`
  }
};

// Tooltips pour chaque action
const tooltips = {
  detail: 'Voir le détail',
  planning: 'Ouvrir la planification',
  affectation: 'Gérer l\'affectation'
};

// Générateur de route selon l'action
function getRoute(action: string) {
  switch (action) {
    case 'detail':
      return { name: 'inventory-detail', params: { id: props.inventoryId } };
    case 'planning':
      return { name: 'inventory-planning', query: { inventoryId: props.inventoryId } };
    case 'affectation':
      return { name: 'inventory-affecter', query: { inventoryId: props.inventoryId } };
    default:
      return {};
  }
}
</script>

<style scoped>
/* Ajoute tes styles ici (couleurs hover, marges, etc.) */
</style>
