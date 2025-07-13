<template>
    <div class="flex flex-wrap max-h-[200px] overflow-x-auto gap-2 dark:border-dark-border dark:bg-[#0e1726] bg-white p-4 rounded-lg border border-gray-200">
        <button
            v-for="opt in formattedOptions(field.options)"
            :key="opt.value"
            type="button"
            @click="toggleValue(opt.value)"
            :class="[
                'px-4 py-2 rounded-lg text-sm transition-all duration-200',
                isSelected(opt.value)
                    ? 'bg-primary text-white '
                    : 'bg-gray-50 dark:text-white-dark dark:bg-[#121e32] text-gray-700 hover:bg-gray-100'
            ]"
            :disabled="disabled">
            {{ opt.label }}
        </button>
    </div>
</template>

<script setup lang="ts">
import type { FieldConfig, SelectOption } from '@/interfaces/form';

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

const isSelected = (value: unknown): boolean => {
    const val = props.value;
    return Array.isArray(val) && (val as unknown[]).includes(value);
};

const toggleValue = (value: unknown) => {
    const arr = (props.value as unknown[]) || [];
    const idx = arr.indexOf(value);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(value);
    emit('update:value', arr);
    emit('change');
};
</script>
