<template>
  <div ref="menu" class="relative dropdown h-full flex items-center justify-center">
    <button
      @click="toggle"
      class="p-1.5 hover:bg-gray-500/10 dark:hover:bg-dark-border2 rounded-full transition-colors"
    >
      <IconHorizontalDots class="w-5 h-5 dark:hover:text-primary hover:text-primary text-gray-600 dark:text-gray-300" />
    </button>

    <teleport to="body">
      <transition name="dropdown-transition">
        <ul
          v-if="open"
          ref="dropdown"
          :style="dropdownStyle"
          class="fixed min-w-[140px] bg-white dark:bg-dark-bg dark:border-dark-borde rounded-lg shadow-lg z-[1000] py-1.5"
        >
          <li
            v-for="(a, i) in actions"
            :key="i"
            class="hover:bg-gray-500/10 dark:border-dark-borde"
          >
            <a
              href="#"
              @click.prevent="handleAction(a)"
              class="flex items-center text-sm text-secondary dark:text-white w-full gap-2 px-3 py-2"
            >
              <component
                :is="a.icon"
                class="w-4 h-4 text-secondary dark:text-gray-400 shrink-0"
              />
              <span class="truncate font-medium">{{ a.label }}</span>
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
  onBeforeUnmount
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
    const open = ref(false)
    const menu = ref<HTMLElement | null>(null)
    const dropdown = ref<HTMLElement | null>(null)
    const dropdownStyle = ref<Record<string, string>>({})
    const store = useAppStore()

    const actions = shallowRef(
      (props.params.actions ?? []).map(a => ({
        ...a,
        icon: a.icon ? markRaw(a.icon) : undefined,
      }))
    )

    const calculatePosition = () => {
      if (!menu.value || !dropdown.value) return

      const buttonRect = menu.value.getBoundingClientRect()
      const dropdownWidth = dropdown.value.offsetWidth || 160
      const viewportWidth = window.innerWidth
      const isRTL = store.rtlClass === 'rtl'

      let leftPosition = buttonRect.left - dropdownWidth - 8
      let topPosition = buttonRect.bottom 

      // Débordement à gauche
      if (leftPosition < 8) {
        leftPosition = isRTL ? buttonRect.right + 8 : 8
      }
      // Débordement à droite en RTL
      if (isRTL && (leftPosition + dropdownWidth) > viewportWidth) {
        leftPosition = viewportWidth - dropdownWidth - 8
      }

      dropdownStyle.value = {
        top: `${topPosition}px`,
        left: `${leftPosition}px`,
        'min-width': `${dropdownWidth}px`,
      }
    }

    const toggle = async () => {
      open.value = !open.value
      if (open.value) {
        await nextTick()
        calculatePosition()
      }
    }

    const handleAction = (a: ActionConfig) => {
      a.handler(props.params.data)
      open.value = false
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (!menu.value?.contains(target) && !dropdown.value?.contains(target)) {
        open.value = false
      }
    }

    const handleScrollOutside = () => {
      if (open.value) {
        open.value = false
      }
    }

    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
      window.addEventListener('resize', calculatePosition)
      window.addEventListener('scroll', handleScrollOutside)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('click', handleClickOutside)
      window.removeEventListener('resize', calculatePosition)
      window.removeEventListener('scroll', handleScrollOutside)
    })

    return {
      open,
      toggle,
      menu,
      dropdown,
      dropdownStyle,
      actions,
      handleAction,
    }
  },
})
</script>

<style scoped>
.dropdown-transition-enter-active,
.dropdown-transition-leave-active {
  transition: all 0.2s ease;
  transform-origin: top left;
}

.dropdown-transition-enter-from,
.dropdown-transition-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}
</style>
