<template>
  <nav class="flex items-center gap-2 ml-auto w-fit" role="navigation" aria-label="Navigation des pages d'inventaire">
    <Tooltip
      v-for="action in actions"
      :key="action"
      :text="tooltips[action]"
      position="bottom"
      class="inline-block"
    >
      <RouterLink
        :to="routes[action]"
        class="nav-link"
        :aria-label="tooltips[action]"
      >
        <component 
          :is="icons[action]" 
          class="nav-link__icon"
        />
      </RouterLink>
    </Tooltip>
  </nav>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'
import { useRoute } from 'vue-router'
import Tooltip from '@/components/Tooltip.vue'

// Types
type ActionType = 'detail' | 'planning' | 'affectation' | 'edit' | 'results'

interface Props {
  inventoryId: string | number
  actions: ActionType[]
}

// Props avec validation
const props = withDefaults(defineProps<Props>(), {
  actions: () => ['detail', 'planning', 'affectation', 'edit', 'results']
})

// Composables
const route = useRoute()

// Composants d'icônes SVG optimisés
const DetailIcon = defineComponent({
  name: 'DetailIcon',
  render: () => h('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    strokeWidth: 2,
    class: 'w-5 h-5'
  }, [
    h('path', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    })
  ])
})

const PlanningIcon = defineComponent({
  name: 'PlanningIcon',
  render: () => h('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    strokeWidth: 2,
    class: 'w-5 h-5'
  }, [
    h('path', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
    })
  ])
})

const AffectationIcon = defineComponent({
  name: 'AffectationIcon',
  render: () => h('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    strokeWidth: 2,
    class: 'w-5 h-5'
  }, [
    h('path', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
    })
  ])
})

const EditIcon = defineComponent({
  name: 'EditIcon',
  render: () => h('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    strokeWidth: 2,
    class: 'w-5 h-5'
  }, [
    h('path', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      d: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
    })
  ])
})

const ResultsIcon = defineComponent({
  name: 'ResultsIcon',
  render: () => h('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    fill: 'none',
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    strokeWidth: 2,
    class: 'w-5 h-5'
  }, [
    h('path', {
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    })
  ])
})

// Configuration des icônes
const icons: Record<ActionType, any> = {
  detail: DetailIcon,
  planning: PlanningIcon,
  affectation: AffectationIcon,
  edit: EditIcon,
  results: ResultsIcon,
} as const

// Configuration des tooltips
const tooltips: Record<ActionType, string> = {
  detail: 'Voir les détails',
  planning: 'Planification',
  affectation: 'Affectation',
  edit: 'Modifier',
  results: 'Résultats',
} as const

// Routes calculées avec mémoisation
const routes = computed(() => {
  const inventoryId = String(props.inventoryId)
  
  return {
    detail: { 
      name: 'inventory-detail', 
      params: { id: inventoryId } 
    },
    planning: { 
      name: 'inventory-planning', 
      query: { inventoryId } 
    },
    affectation: { 
      name: 'inventory-affecter', 
      query: { inventoryId } 
    },
    edit: { 
      name: 'inventory-edit', 
      params: { id: inventoryId } 
    },
    results: { 
      name: 'inventory-results', 
      params: { reference: inventoryId } 
    },
  } satisfies Record<ActionType, any>
})
</script>

<style scoped>
.nav-link {
  /* Styles de base */
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 0.75rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  border: 1px solid rgb(229 231 235);
  /* Couleurs par défaut */
  background-color: white;
  color: rgb(107 114 128);
  
  /* Focus et accessibilité */
  outline: none;
  position: relative;
}

.nav-link:hover {
  background-color: rgb(249 250 251);
  border-color: rgb(209 213 219);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  color: rgb(75 85 99);
  transform: translateY(-1px);
}


.nav-link__icon {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-link:hover .nav-link__icon {
  transform: scale(1.1);
}

/* Mode sombre */
@media (prefers-color-scheme: dark) {
  .nav-link {
    background-color: rgb(31 41 55);
    color: rgb(156 163 175);
    border-color: rgb(75 85 99);
  }

  .nav-link:hover {
    background-color: rgb(75 85 99);
    border-color: rgb(107 114 128);
    color: rgb(209 213 219);
  }

  .nav-link.router-link-active {
    box-shadow: 0 10px 15px -3px rgb(59 130 246 / 0.25);
  }
}

/* Responsive */
@media (max-width: 640px) {
  .nav-link {
    width: 2.25rem;
    height: 2.25rem;
  }
  
  .nav-link__icon :deep(svg) {
    width: 1rem;
    height: 1rem;
  }
}

/* Animation d'entrée */
.nav-link {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Amélioration de l'accessibilité */
.nav-link:focus-visible::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 0.875rem;
  border: 2px solid var(--color-primary);
  pointer-events: none;
}

/* Indicateur de chargement pour les transitions */
.nav-link.loading {
  pointer-events: none;
  opacity: 0.7;
}

.nav-link.loading .nav-link__icon {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>