<template>
  <div ref="menu" class="relative inline-block text-left">
    <button @click="toggle" class="flex items-center justify-center p-2 hover:bg-gray-200 border border-gray-300 rounded-full">
      <IconHorizontalDots />
    </button>

    <teleport to="body">
      <ul
        v-if="open"
        ref="dropdown"
        :style="ulStyles"
        class="w-40 bg-white border border-gray-200 rounded shadow-lg z-50"
      >
        <li
          v-for="(action, idx) in actions"
          :key="idx"
          class="text-sm text-gray-700 hover:bg-gray-100"
        >
          <a
            href="#"
            @click.prevent="handleAction(action)"
            class="flex items-center gap-2 px-3 py-2"
          >
            <component :is="action.icon" class="w-4 h-4" />
            <span>{{ action.label }}</span>
          </a>
        </li>
      </ul>
    </teleport>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  shallowRef,
  markRaw,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from 'vue';
import IconHorizontalDots from '@/components/icon/icon-horizontal-dots.vue';

interface ActionConfig {
  label: string;
  icon?: any;
  handler: (row: Record<string, unknown>) => void;
}

export default defineComponent({
  name: 'ActionMenu',
  components: { IconHorizontalDots },
  props: {
    params: { type: Object as () => any, required: true },
  },
  setup(props) {
    const open = ref(false);
    const menu = ref<HTMLElement | null>(null);
    const dropdown = ref<HTMLElement | null>(null);
    const ulStyles = ref<Record<string, string>>({});

    const rawActions = (props.params.actions ?? []) as ActionConfig[];
    const actions = shallowRef(
      rawActions.map(a => ({
        ...a,
        icon: a.icon ? markRaw(a.icon) : undefined,
      }))
    );

    const toggle = async () => {
      open.value = !open.value;
      if (open.value) {
        await nextTick();
        if (menu.value && dropdown.value) {
          const m = menu.value.getBoundingClientRect();
          const d = dropdown.value.getBoundingClientRect();
          ulStyles.value = {
            position: 'absolute',
            top: `${m.bottom + window.scrollY}px`,
            left: `${m.left + window.scrollX + (m.width / 2) - (d.width / 2)}px`,
          };
        }
      }
    };

    const handleAction = (action: ActionConfig) => {
      action.handler(props.params.data);
      open.value = false;
    };

    const onClickOutside = (e: MouseEvent) => {
      const tgt = e.target as Node;
      if (
        !menu.value?.contains(tgt) &&
        !dropdown.value?.contains(tgt)
      ) {
        open.value = false;
      }
    };

    onMounted(() => document.addEventListener('click', onClickOutside));
    onBeforeUnmount(() => document.removeEventListener('click', onClickOutside));

    return {
      open,
      toggle,
      menu,
      dropdown,
      ulStyles,
      actions,
      handleAction,
    };
  },
});
</script>
