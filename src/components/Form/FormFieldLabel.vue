<template>
    <label :for="field.key" class="block text-sm font-medium dark:text-gray-400 text-gray-700 mb-2">
        <span class="flex items-center gap-1">
            {{ field.label }}
            <span v-if="required" class="text-red-500">*</span>
            <Tooltip v-if="field.tooltip" :text="field.tooltip" position="top" :delay="300">
                <svg class="w-3 h-3 text-gray-400 cursor-help" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </Tooltip>
        </span>
    </label>
</template>

<script setup lang="ts">
import Tooltip from '@/components/Tooltip.vue';
import type { FieldConfig } from '@/interfaces/form';

defineProps<{
    field: FieldConfig;
    required?: boolean;
    error?: boolean;
}>();
</script>
