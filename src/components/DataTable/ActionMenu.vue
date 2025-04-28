<template>
  <div ref="menu" class="relative flex h-full items-center justify-center">
    <button @click="toggle" class="flex p-1 hover:bg-gray-200 border border-gray-300 rounded-full">
      <IconHorizontalDots class="text-gray-700" />
    </button>
    <teleport to="body">
      <transition name="fade">
        <ul
          v-if="open"
          ref="dropdown"
          :style="dropdownStyle"
          class="absolute bg-white border rounded shadow-lg z-50 min-w-[110px] py-1"
        >
          <li
            v-for="(a, i) in actions"
            :key="i"
            class="text-sm text-gray-700 hover:bg-gray-100"
          >
            <a
              href="#"
              @click.prevent="handleAction(a)"
              class="flex items-center gap-2 px-3 py-2"
              :class="a.class"
            >
              <component :is="a.icon" class="w-4 h-4" />
              <span>{{ a.label }}</span>
            </a>
          </li>
        </ul>
      </transition>
    </teleport>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, shallowRef, markRaw, nextTick, onMounted, onBeforeUnmount } from 'vue'
import IconHorizontalDots from '@/components/icon/icon-horizontal-dots.vue'

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
    const menu = ref<HTMLElement|null>(null)
    const dropdown = ref<HTMLElement|null>(null)
    const dropdownStyle = ref<Record<string,string>>({})

    const raw = (props.params.actions ?? []) as ActionConfig[]
    const actions = shallowRef(raw.map(a => ({
      ...a,
      icon: a.icon ? markRaw(a.icon) : undefined
    })))

    const toggle = async () => {
      open.value = !open.value
      if (open.value) {
        await nextTick()
        const r = menu.value!.getBoundingClientRect()
        const w = dropdown.value!.offsetWidth
        dropdownStyle.value = {
          position: 'absolute',
          top:  `${r.bottom + window.scrollY + 4}px`,
          left: `${r.left   + window.scrollX + r.width/2 - w/2}px`
        }
      }
    }

    const handleAction = (a: ActionConfig) => {
      a.handler(props.params.data)
      open.value = false
    }

    const onOutside = (e: MouseEvent) => {
      const t = e.target as Node
      if (!menu.value?.contains(t) && !dropdown.value?.contains(t)) open.value = false
    }
    onMounted(() => document.addEventListener('click', onOutside))
    onBeforeUnmount(() => document.removeEventListener('click', onOutside))

    return { open, toggle, menu, dropdown, dropdownStyle, actions, handleAction }
  }
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease }
.fade-enter-from, .fade-leave-to     { opacity: 0 }
</style>
