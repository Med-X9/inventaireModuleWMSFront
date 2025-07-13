<template>
    <input
        :id="field.key"
        :value="value"
        type="date"
        v-bind="field.props"
        class="form-input px-4 py-3 bg-white border border-gray-200 rounded-lg transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-10 outline-none"
        :class="{ 'border-red-500': error }"
        :disabled="disabled"
        :min="getMinDate()"
        @input="handleInput"
        @change="handleChange" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { FieldConfig } from '@/interfaces/form';

const props = defineProps<{
    field: FieldConfig;
    value: unknown;
    error: boolean;
    errorMessage?: string;
    disabled: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:value', value: unknown): void;
    (e: 'change'): void;
}>();

const getMinDate = () => {
    if (props.field.min) {
        return props.field.min;
    }
    const today = new Date();
    return today.toISOString().split('T')[0];
};

const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    emit('update:value', target.value);
};

const handleChange = () => {
    emit('change');
};
</script>

<style scoped>
input[type="date"] {
    position: relative;
}
.dark input[type="date"] {
    background-color: #1f2937;
    border-color: #374151;
    color: #f9fafb;
}
input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(1);
    cursor: pointer;
}
.dark input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(0);
}
</style>
