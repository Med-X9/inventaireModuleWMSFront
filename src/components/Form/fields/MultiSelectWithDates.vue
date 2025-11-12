<template>
    <div class="space-y-3">
        <SelectField
            :key="`multi-select-${field.key}-${selectedItems.length || 0}`"
            :selected="selectedItems"
            :options="formattedOptions(field.options)"
            :multiple="true"
            :searchable="field.searchable ?? true"
            :clearable="field.clearable ?? true"
            :placeholder="(field.props?.placeholder as string) || 'Sélectionnez des éléments'"
            :disabled="disabled"
            :error="error"
            :error-message="errorMessage"
            @update:modelValue="onItemSelectionChange" />

        <!-- Date inputs for selected items -->
        <div v-if="selectedItems.length > 0" class="space-y-2 mt-3">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ field.dateLabel || 'Dates par magasin' }} :
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div v-for="itemValue in selectedItems" :key="itemValue" class="flex flex-col gap-2">
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                        {{ getLabelForItem(itemValue) }} :
                    </span>
                    <DateInput
                        :field="{ ...field, key: `${field.key}-date-${itemValue}`, min: field.min }"
                        :value="itemDates[itemValue]"
                        :error="false"
                        :disabled="disabled"
                        @update:value="val => updateItemDate(itemValue, String(val))"
                        @change="updateItemsWithDates"
                    />
                </div>
            </div>
        </div>

        <!-- Error message -->
        <p v-if="errorMessage" class="text-sm text-red-500 mt-1">
            {{ errorMessage }}
        </p>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import SelectField from '../SelectField.vue';
import DateInput from './DateInput.vue';
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

// État local pour les éléments sélectionnés et leurs dates
const selectedItems = ref<string[]>([]);
const itemDates = reactive<Record<string, string>>({});

// Initialiser les données
const initializeData = () => {
    if (Array.isArray(props.value)) {
        const fieldData = props.value as Array<Record<string, string>>;
        const itemKey = props.field.itemKey || 'item';
        // Convertir les valeurs en string pour la cohérence
        selectedItems.value = fieldData.map(item => String(item[itemKey]));
        fieldData.forEach(item => {
            itemDates[String(item[itemKey])] = item.date;
        });
    }
};

// Initialiser au montage
initializeData();

// Surveiller les changements de valeur
watch(() => props.value, initializeData, { deep: true });

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

const getFilteredOptions = (): SelectOption[] => {
    const allOptions = formattedOptions(props.field.options);
    return allOptions.filter(option => {
        // Comparer les valeurs converties en string
        const optionValue = String(option.value);
        return !selectedItems.value.some(selected => String(selected) === optionValue);
    });
};

const getLabelForItem = (itemValue: string): string => {
    // Convertir itemValue en string pour la comparaison
    const searchValue = String(itemValue);
    const option = formattedOptions(props.field.options).find(opt => {
        // Comparer les valeurs converties en string pour éviter les problèmes de type
        return String(opt.value) === searchValue;
    });
    return option?.label || itemValue;
};

const onItemSelectionChange = (value: string | number | string[] | number[] | null) => {
    if (Array.isArray(value)) {
        selectedItems.value = value.map(v => String(v));
    } else {
        selectedItems.value = [];
    }

    // Supprimer les dates pour les éléments non sélectionnés
    Object.keys(itemDates).forEach(itemValue => {
        if (!selectedItems.value.includes(itemValue)) {
            delete itemDates[itemValue];
        }
    });

    updateItemsWithDates();
};

const updateItemDate = (itemValue: string, val: string) => {
    itemDates[itemValue] = val;
    updateItemsWithDates();
};

const updateItemsWithDates = () => {
    const selected = selectedItems.value;
    const itemKey = props.field.itemKey || 'item';
    const itemsWithDates = selected.map(itemValue => ({
        [itemKey]: itemValue,
        date: itemDates[itemValue] || ''
    }));

    emit('update:value', itemsWithDates);
    emit('change');
};
</script>
