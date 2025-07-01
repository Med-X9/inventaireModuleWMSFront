<template>
  <div ref="menuRef" class="relative flex items-center">
    <!-- Bouton de déclenchement -->
    <button 
      @click="toggleMenu" 
      :class="[
        'group relative p-1.5 rounded-lg transition-all duration-200 ease-in-out',
        'hover:bg-gray-100 dark:hover:bg-gray-800/50',
        'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-gray-100 dark:focus:bg-gray-800/50',
        'active:scale-95',
        isOpen ? 'bg-gray-100 dark:bg-gray-800/50 shadow-sm' : ''
      ]"
      :aria-expanded="isOpen"
      aria-haspopup="true"
    >
      <IconHorizontalDots 
        :class="[
          'w-4 h-4 transition-all duration-200',
          'text-gray-600 dark:text-gray-400',
          'group-hover:text-gray-900 dark:group-hover:text-gray-200',
          isOpen ? 'rotate-90' : ''
        ]"
      />
    </button>

    <!-- Menu déroulant avec Teleport -->
    <teleport to="body">
      <transition name="dropdown-transition">
        <div
          v-if="isOpen"
          ref="dropdownRef"
          :style="dropdownStyle"
          class="fixed z-[9999] animate-in fade-in-0 zoom-in-95 duration-200"
          @click.stop
        >
          <!-- Container principal du menu -->
          <div class="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200/80 dark:border-gray-700/60 min-w-[160px] overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
            <!-- Liste des actions -->
            <div class="py-1">
              <template v-for="(action, i) in filteredActions" :key="i">
                <!-- Séparateur si spécifié -->
                <div 
                  v-if="action.separator && i > 0" 
                  class="h-px bg-gray-200 dark:bg-gray-700  mx-2"
                ></div>

                <!-- Item d'action -->
                <button
                  @click="handleActionClick(action)"
                  :class="[
                    'group w-full flex items-center gap-2 px-3 py-2.5 text-left transition-all duration-200',
                    'hover:bg-gray-50 dark:hover:bg-gray-800/60',
                    'focus:outline-none',
                    'active:bg-gray-100 dark:active:bg-gray-800',
                    action.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                    action.class || ''
                  ]"
                  :disabled="action.disabled"
                >
                  <!-- Icône de l'action -->
                  <div 
                    :class="[
                      'flex items-center justify-center w-6 h-6 rounded flex-shrink-0 transition-colors duration-200',
                      'text-gray-500 dark:text-gray-400',
                      'group-hover:text-gray-700 dark:group-hover:text-gray-200'
                    ]"
                  >
                    <component 
                      :is="action.icon" 
                      class="w-4 h-4"
                    />
                  </div>

                  <!-- Contenu du label -->
                  <div class="flex-1 min-w-0">
                    <div 
                      :class="[
                        'font-medium text-sm truncate transition-colors duration-200',
                        'text-gray-700 dark:text-gray-200',
                        'group-hover:text-gray-900 dark:group-hover:text-gray-50'
                      ]"
                    >
                      {{ action.label }}
                    </div>
                  </div>
                </button>
              </template>

              <!-- Message si aucune action -->
              <div 
                v-if="filteredActions.length === 0" 
                class="px-3 py-4 text-center text-gray-500 dark:text-gray-400"
              >
                <div class="w-6 h-6 mx-auto mb-1 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <IconHorizontalDots class="w-3 h-3" />
                </div>
                <p class="text-xs">Aucune action disponible</p>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, markRaw, onMounted, onUnmounted } from 'vue'
import type { InventoryAction, InventoryManagement } from '@/interfaces/inventoryManagement'
import IconHorizontalDots from '../icon/icon-horizontal-dots.vue'

// Interface simplifiée
interface SimplifiedInventoryAction extends InventoryAction {
  disabled?: boolean
  separator?: boolean
}

const props = defineProps<{ 
  params: { 
    actions: SimplifiedInventoryAction[]
    data: InventoryManagement 
  }
}>()

// État du composant
const isOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})

// Propriétés calculées
const filteredActions = computed(() => {
  const inv = props.params.data
  return props.params.actions
    .filter(a => a.showWhen ? a.showWhen(inv) : true)
    .map(a => {
      // ici on génère toujours un string
      const labelText = typeof a.label === 'function'
        ? (a.label as Function)(inv)
        : a.label as string

      return {
        ...a,
        label: labelText,     
        icon: a.icon ? markRaw(a.icon) : undefined
      }
    })
})

// Calcul de la position
const calculatePosition = async () => {
  await nextTick()
  if (!menuRef.value || !dropdownRef.value) return

  const button = menuRef.value.getBoundingClientRect()
  const dropdown = dropdownRef.value
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY
  }

  // Position initiale
  let top = button.bottom + viewport.scrollY + 4
  let left = button.right + viewport.scrollX - dropdown.offsetWidth

  // Ajustements
  const padding = 12

  // Ajustement horizontal
  if (left < padding) {
    left = button.left + viewport.scrollX
  }
  if (left + dropdown.offsetWidth > viewport.width - padding) {
    left = viewport.width - dropdown.offsetWidth - padding
  }

  // Ajustement vertical
  if (top + dropdown.offsetHeight > viewport.height + viewport.scrollY - padding) {
    top = button.top + viewport.scrollY - dropdown.offsetHeight - 4
  }
  if (top < viewport.scrollY + padding) {
    top = viewport.scrollY + padding
  }

  dropdownStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    minWidth: '160px',
    maxWidth: '220px'
  }
}

// Gestion des événements
const toggleMenu = async () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    await calculatePosition()
    // Supprimé le focus automatique sur le premier bouton
  }
}

const handleActionClick = (action: SimplifiedInventoryAction) => {
  if (action.disabled) return
  
  action.handler(props.params.data)
  isOpen.value = false
}

const closeMenu = () => {
  isOpen.value = false
}

// Gestionnaires d'événements globaux
const handleClickOutside = (e: MouseEvent) => {
  if (
    menuRef.value && !menuRef.value.contains(e.target as Node) &&
    dropdownRef.value && !dropdownRef.value.contains(e.target as Node)
  ) {
    closeMenu()
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    closeMenu()
  }
}

const handleScrollResize = () => {
  if (isOpen.value) {
    closeMenu()
  }
}

// Cycle de vie
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
  window.addEventListener('scroll', handleScrollResize, true)
  window.addEventListener('resize', handleScrollResize)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('scroll', handleScrollResize, true)
  window.removeEventListener('resize', handleScrollResize)
})
</script>

<style scoped>
/* Animations */
.dropdown-transition-enter-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: top left;
}

.dropdown-transition-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 1, 1);
  transform-origin: top left;
}

.dropdown-transition-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

.dropdown-transition-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

@keyframes animate-in {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-in {
  animation: animate-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@media (prefers-reduced-motion: reduce) {
  .dropdown-transition-enter-active,
  .dropdown-transition-leave-active {
    transition-duration: 0.05s;
  }
  
  .animate-in {
    animation-duration: 0.05s;
  }
}

@media (hover: none) {
  button:hover {
    background-color: transparent;
  }
}
</style>