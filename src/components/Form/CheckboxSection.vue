<template>
    <div v-if="fields.length > 0" class="mt-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div v-for="field in fields" :key="field.key" class="flex items-center space-x-2">
                <input
                    :id="field.key"
                    v-model="formData[field.key]"
                    type="checkbox"
                    class="form-checkbox text-primary focus:ring-primary"
                    :disabled="getFieldDisabled(field)" />
                <label :for="field.key"
                    class="text-sm mt-2 text-gray-700 dark:text-white flex items-center gap-1">
                    {{ field.label }}
                    <Tooltip v-if="field.tooltip" :text="field.tooltip" position="top" :delay="300">
                        <svg class="w-3 h-3 text-gray-400 cursor-help" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </Tooltip>
                </label>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import Tooltip from '@/components/Tooltip.vue';
import type { FieldConfig } from '@/interfaces/form';

defineProps<{
    fields: FieldConfig[];
    formData: Record<string, unknown>;
    errors: Record<string, string | null>;
    submitted: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:value', key: string, value: unknown): void;
}>();

const getFieldDisabled = (field: FieldConfig): boolean => {
    return Boolean(field.props?.disabled);
};
</script>
