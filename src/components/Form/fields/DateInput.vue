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
    padding-right: 2.5rem; /* Espace pour l'icône du calendrier */
}

.dark input[type="date"] {
    background-color: #1f2937;
    border-color: #374151;
    color: #f9fafb;
}

/* Style pour l'icône du calendrier (Chrome, Safari, Edge) */
input[type="date"]::-webkit-calendar-picker-indicator {
    cursor: pointer;
    opacity: 1 !important;
    width: 1.5rem;
    height: 1.5rem;
    padding: 0.25rem;
    margin-right: 0.5rem;
    background-color: transparent;
    /* Filtre pour améliorer la visibilité de l'icône native */
    filter: brightness(0) saturate(100%) invert(27%) sepia(8%) saturate(1234%) hue-rotate(182deg) brightness(95%) contrast(87%);
}

.dark input[type="date"]::-webkit-calendar-picker-indicator {
    filter: brightness(0) saturate(100%) invert(65%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
}

/* Style pour Firefox */
input[type="date"]::-moz-calendar-picker-indicator {
    cursor: pointer;
    opacity: 1;
    width: 1.25rem;
    height: 1.25rem;
    padding: 0.25rem;
    margin-right: 0.5rem;
}

/* Hover effect */
input[type="date"]::-webkit-calendar-picker-indicator:hover {
    opacity: 0.8;
}

input[type="date"]::-moz-calendar-picker-indicator:hover {
    opacity: 0.8;
}
</style>
