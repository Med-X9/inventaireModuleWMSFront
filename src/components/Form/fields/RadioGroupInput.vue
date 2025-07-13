<template>
    <div class="flex gap-6">
        <div v-for="opt in formattedOptions(field.radioOptions || field.options)" :key="opt.value"
            class="flex items-center space-x-2">
            <input
                :id="`${field.key}-${opt.value}`"
                :value="opt.value"
                :checked="value === opt.value"
                type="radio"
                :name="field.key"
                class="form-radio text-primary focus:ring-primary"
                :disabled="disabled"
                @change="handleChange(opt.value)" />
            <label :for="`${field.key}-${opt.value}`"
                class="text-sm mt-2 text-gray-700 dark:text-white flex items-center gap-1">
                {{ opt.label }}
                <Tooltip v-if="opt.tooltip" :text="opt.tooltip" position="top" :delay="300">
                    <svg class="w-3 h-3 text-gray-400 cursor-help" fill="none" stroke="currentColor"
                        viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </Tooltip>
            </label>
        </div>
    </div>
</template>

<script setup lang="ts">
import Tooltip from '@/components/Tooltip.vue';
import type { FieldConfig, SelectOption } from '@/interfaces/form';

defineProps<{
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

const formattedOptions = (options: Array<string | SelectOption> = []): SelectOption[] => {
    return options.map(opt => {
        if (typeof opt === 'string') {
            const numValue = parseInt(opt);
            return {
                label: opt,
                value: isNaN(numValue) ? opt : numValue
            };
        }
        return opt;
    });
};

const handleChange = (selectedValue: unknown) => {
    emit('update:value', selectedValue);
    emit('change');
};
</script>
