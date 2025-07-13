<template>
    <div class="space-y-2">
        <div v-for="opt in formattedOptions(field.options)" :key="opt.value"
            class="flex items-center space-x-2">
            <input
                :id="`${field.key}-${opt.value}`"
                :value="opt.value"
                :checked="value === opt.value"
                type="radio"
                name="default_radio"
                class="form-radio"
                :disabled="disabled"
                @change="handleChange(opt.value)" />
            <label :for="`${field.key}-${opt.value}`"
                class="text-sm mt-2 text-gray-700 dark:text-white">
                {{ opt.label }}
            </label>
        </div>
    </div>
</template>

<script setup lang="ts">
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
