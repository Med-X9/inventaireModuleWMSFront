<template>
    <div
        class="flex flex-wrap gap-2 max-h-[220px] overflow-y-auto p-3 md:p-4 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-[#0e1726]"
    >
        <button
            v-for="opt in formattedOptions(field.options)"
            :key="opt.value"
            type="button"
            @click="toggleValue(opt.value)"
            :class="[
                'inline-flex items-center justify-center px-3.5 py-2 rounded-full text-xs md:text-sm font-medium',
                'transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0e1726]',
                disabled
                    ? 'cursor-not-allowed opacity-50 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                    : isSelected(opt.value)
                        ? 'bg-primary text-white shadow-sm shadow-primary/40 scale-[1.02]'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:bg-[#121e32] dark:text-white-dark dark:hover:bg-[#1b2940]'
            ]"
            :disabled="disabled"
        >
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
