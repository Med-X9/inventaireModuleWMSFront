<template>
  <input
    v-bind="props.field?.props"
    :id="props.field?.key"
    :type="props.field?.type || 'text'"
    :value="props.value"
    :disabled="props.disabled"
    :placeholder="props.field?.props?.placeholder || ''"
    @input="onInput"
    class="form-input px-4 py-3 bg-white border border-gray-200 rounded-lg transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-10 outline-none"
    :class="{ 'border-red-500': props.error }"
  />
</template>

<script setup lang="ts">
const props = defineProps({
  field: Object,
  value: [String, Number],
  error: Boolean,
  errorMessage: String,
  disabled: Boolean
});
const emit = defineEmits(['update:value', 'change']);
const onInput = (e: Event) => {
  emit('update:value', (e.target as HTMLInputElement).value);
  emit('change');
};
</script>
