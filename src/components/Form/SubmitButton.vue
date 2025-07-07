<template>
  <button
    v-bind="$attrs"
    class="px-4 py-2 bg-primary text-white rounded-lg shadow transition-all duration-200 flex items-center justify-center relative"
    :class="{ 'opacity-50 cursor-not-allowed': loading || disabled }"
    :disabled="loading || disabled"
    @click="handleClick"
  >
    <span
      v-if="loading"
      class="absolute left-4 w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
    />
    <span :class="{ 'ml-6': loading }">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  validate?: () => Promise<boolean> | boolean;
}>();

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void;
}>();

async function handleClick(event: MouseEvent) {
  if (props.loading || props.disabled) {
    event.preventDefault();
    return;
  }

  if (props.validate) {
    const isValid = await props.validate();
    if (!isValid) {
      event.preventDefault();
      return;
    }
  }

  emit('click', event);
}
</script>