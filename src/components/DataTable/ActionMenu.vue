<template>
  <div ref="menuRef" class="relative dropdown h-full flex items-center justify-center">
    <button
      @click="toggleMenu"
      class="p-1.5 hover:bg-gray-500/10 dark:hover:bg-dark-border2 rounded-full transition-colors"
    >
      <IconHorizontalDots class="w-5 h-5 dark:hover:text-primary hover:text-primary text-gray-600 dark:text-gray-300" />
    </button>

    <teleport to="body">
      <transition name="dropdown-transition">
        <ul
          v-if="isOpen"
          ref="dropdownRef"
          :style="dropdownStyle"
          class="fixed min-w-[140px] bg-white dark:bg-dark-bg dark:border-dark-border rounded-lg shadow-lg border z-[1000] py-1.5"
          @click.stop
        >
          <li
            v-for="(action, index) in actions"
            :key="index"
            class="hover:bg-gray-500/10 dark:hover:bg-dark-light/10 dark:border-dark-border"
          >
            <a
              href="#"
              @click.prevent="handleActionClick(action)"
              class="flex items-center text-sm text-secondary dark:text-white w-full gap-2 px-3 py-2 transition-colors"
            >
              <component
                :is="action.icon"
                class="w-4 h-4 text-secondary dark:text-gray-400 shrink-0"
              />
              <span class="truncate font-medium">{{ action.label }}</span>
            </a>
          </li>
        </ul>
      </transition>
    </teleport>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  shallowRef,
  markRaw,
  nextTick,
  onMounted,
  onUnmounted
} from 'vue'
import IconHorizontalDots from '@/components/icon/icon-horizontal-dots.vue'
import { useAppStore } from '@/stores'

interface ActionConfig {
  label: string
  icon?: any
  class?: string
  handler: (row: Record<string, unknown>) => void
}

export default defineComponent({
  name: 'ActionMenu',
  components: { IconHorizontalDots },
  props: {
    params: { type: Object as () => any, required: true },
  },
  setup(props) {
    const isOpen = ref(false)
    const menuRef = ref<HTMLElement | null>(null)
    const dropdownRef = ref<HTMLElement | null>(null)
    const dropdownStyle = ref<Record<string, string>>({})
    const store = useAppStore()

    const actions = shallowRef(
      (props.params.actions ?? []).map((action: ActionConfig) => ({
        ...action,
        icon: action.icon ? markRaw(action.icon) : undefined,
      }))
    )

    const calculatePosition = async () => {
  if (!menuRef.value || !dropdownRef.value) return
  await nextTick()

  const btn = menuRef.value.getBoundingClientRect()
  const dd  = dropdownRef.value
  const w   = dd.offsetWidth  || 160
  const h   = dd.offsetHeight || 100
  const vw  = window.innerWidth
  const vh  = window.innerHeight
  const sx  = window.scrollX
  const sy  = window.scrollY

  // 1) Position par défaut :
  //    - top juste sous le bouton
  //    - left = droite du bouton moins la largeur du dropdown
  let top  = btn.bottom + sy + 4
  let left = btn.right  + sx - w

  // 2) Si on sort trop à gauche, on colle à 8px du bord
  if (left < 8) {
    left = 8
  }

  // 3) Si on sort à droite (rare avec ce calcul), on colle à 8px de la droite
  if (left + w > vw) {
    left = vw - w - 8
  }

  // 4) Si pas assez de place en bas, on ouvre au-dessus
  if (top + h > vh + sy) {
    top = btn.top + sy - h - 4
  }

  // 5) On s’assure pas de sortir en haut
  if (top < sy + 8) {
    top = sy + 8
  }

  dropdownStyle.value = {
    top:      `${top}px`,
    left:     `${left}px`,
    'min-width': `${w}px`,
  }
}


    const toggleMenu = async () => {
      isOpen.value = !isOpen.value
      if (isOpen.value) {
        await nextTick()
        await calculatePosition()
      }
    }

    const handleActionClick = (action: ActionConfig) => {
      action.handler(props.params.data)
      closeMenu()
    }

    const closeMenu = () => {
      isOpen.value = false
    }

    // Gestion des clics en dehors du menu (inspiré du dropdown d'export)
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        menuRef.value && 
        !menuRef.value.contains(target) && 
        dropdownRef.value && 
        !dropdownRef.value.contains(target)
      ) {
        closeMenu()
      }
    }

    // Fermer le menu lors du scroll ou redimensionnement
    const handleScrollOrResize = () => {
      if (isOpen.value) {
        closeMenu()
      }
    }

    // Gestion des touches du clavier
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen.value) {
        closeMenu()
      }
    }

    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
      window.addEventListener('resize', handleScrollOrResize)
      window.addEventListener('scroll', handleScrollOrResize, true)
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleScrollOrResize)
      window.removeEventListener('scroll', handleScrollOrResize, true)
    })

    return {
      isOpen,
      toggleMenu,
      closeMenu,
      menuRef,
      dropdownRef,
      dropdownStyle,
      actions,
      handleActionClick,
    }
  },
})
</script>

<style scoped>
.dropdown-transition-enter-active,
.dropdown-transition-leave-active {
  transition: all 0.15s ease;
  transform-origin: top left;
}

.dropdown-transition-enter-from,
.dropdown-transition-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.95);
}

.dropdown-transition-enter-to,
.dropdown-transition-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* Assurer que le dropdown reste au-dessus de tous les éléments */
.dropdown-transition-enter-active {
  z-index: 1001;
}
</style>