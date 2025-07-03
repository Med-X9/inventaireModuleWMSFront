<template>
    <div class="container mx-auto">
        <h2 v-if="title" class="text-xl font-bold text-gray-800 mb-6">
            {{ title }}
        </h2>

        <form @submit.prevent="handleSubmit">
            <!-- Champs non-checkbox avec grille -->
            <div :class="formGridClass">
                <div v-for="(field, idx) in nonCheckboxFields" :key="field.key"
                    :class="['w-full', getFieldClass(field, idx)]">

                    <!-- Label -->
                    <label :for="field.key" class="block text-sm font-medium dark:text-gray-400 text-gray-700 mb-2">
                        <span class="flex items-center gap-1">
                            {{ field.label }}
                            <span v-if="field.validators?.some(v => v.fn === required().fn)"
                                class="text-red-500">*</span>
                            <Tooltip v-if="field.tooltip" :text="field.tooltip" position="top" :delay="300">
                                <svg class="w-3 h-3 text-gray-400 cursor-help" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </Tooltip>
                        </span>
                    </label>

                    <!-- Text/email input -->
                    <input v-if="['text', 'email'].includes(field.type)" :id="field.key" v-model="formData[field.key]"
                        :type="field.type" v-bind="field.props"
                        class="w-full form-input px-4 py-3 bg-white border border-gray-200 rounded-lg transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-10 outline-none"
                        :class="{ 'border-red-500': errors[field.key] && submitted }" />

                    <!-- Date Picker -->
                    <flat-pickr v-else-if="field.type === 'date'" v-model="formData[field.key] as DateOption"
                        :config="getDateConfig(field)" placeholder="jj/mm/aaaa"
                        class="w-full form-input px-4 py-3 bg-white border border-gray-200 rounded-lg transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-10 outline-none"
                        :class="{ 'border-red-500': errors[field.key] && submitted }" />

                    <!-- Radio Group (for saisie/scanner selection) -->
                    <div v-else-if="field.type === 'radio-group'" class="flex gap-6">
                        <div v-for="opt in formattedOptions(field.radioOptions || field.options)" :key="opt.value"
                            class="flex items-center space-x-2">
                            <input :id="`${field.key}-${opt.value}`" v-model="formData[field.key]" :value="opt.value"
                                type="radio" :name="field.key" class="form-radio text-primary focus:ring-primary"
                                :disabled="getFieldDisabled(field)" />
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

                    <!-- Radio -->
                    <div v-else-if="field.type === 'radio'" class="space-y-2">
                        <div v-for="opt in formattedOptions(field.options)" :key="opt.value"
                            class="flex items-center space-x-2">
                            <input :id="`${field.key}-${opt.value}`" v-model="formData[field.key]" :value="opt.value"
                                type="radio" name="default_radio" class="form-radio"
                                :disabled="getFieldDisabled(field)" />
                            <label :for="`${field.key}-${opt.value}`"
                                class="text-sm mt-2 text-gray-700 dark:text-white">
                                {{ opt.label }}
                            </label>
                        </div>
                    </div>

                    <!-- Multi-select with dates - Using SelectField -->
                    <div v-else-if="field.type === 'multi-select-with-dates'" class="space-y-3">
                        <SelectField :model-value="selectedItems[field.key]" :options="getFilteredOptions(field)"
                            :multiple="true" :searchable="field.searchable ?? true" :clearable="field.clearable ?? true"
                            :placeholder="(field.props?.placeholder as string) || 'Sélectionnez des éléments'"
                            :disabled="getFieldDisabled(field)" :error="!!(errors[field.key] && submitted)"
                            :error-message="errors[field.key] || undefined"
                            @update:modelValue="(value) => onItemSelectionChange(field, value)" />

                        <!-- Date inputs for selected items -->
                        <div v-if="selectedItems[field.key]?.length > 0"
                            class="space-y-2 mt-3 py-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {{ field.dateLabel || 'Dates par élément' }} :
                            </h4>
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div v-for="itemValue in selectedItems[field.key]" :key="itemValue"
                                    class="flex flex-col gap-3">

                                    <span class="text-sm text-gray-600 dark:text-gray-400 min-w-[120px]">
                                        {{ getLabelForItem(field, itemValue) }} :
                                    </span>
                                    <flat-pickr v-model="itemDates[field.key][itemValue]" :config="getDateConfig(field)"
                                        placeholder="jj/mm/aaaa"
                                        class="w-full form-input px-4 py-3 bg-white border border-gray-200 rounded-lg transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-10 outline-none"
                                        @input="updateItemsWithDates(field)" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Select avec SelectField component -->
                    <SelectField v-else-if="field.type === 'select'" :model-value="getSelectFieldValue(field.key)"
                        :options="getSelectOptions(field)" :multiple="field.multiple || false"
                        :searchable="field.searchable ?? false" :clearable="field.clearable ?? true"
                        :placeholder="(field.props?.placeholder as string) || '-- Sélectionner --'"
                        :disabled="getFieldDisabled(field)" :error="!!(errors[field.key] && submitted)"
                        :error-message="errors[field.key] || undefined" @update:modelValue="(value) => {
                            formData[field.key] = value;
                            onFieldChange(field);
                        }" />

                    <!-- Button-group -->
                    <div v-else-if="field.type === 'button-group'">
                        <div
                            class="flex flex-wrap max-h-[200px] overflow-x-auto gap-2 dark:border-dark-border dark:bg-[#0e1726] bg-white p-4 rounded-lg border border-gray-200">
                            <button v-for="opt in formattedOptions(field.options)" :key="opt.value" type="button"
                                @click="toggleValue(field.key, opt.value)" :class="[
                                    'px-4 py-2 rounded-lg text-sm transition-all duration-200',
                                    isSelected(field.key, opt.value)
                                        ? 'bg-primary text-white '
                                        : 'bg-gray-50 dark:text-white-dark dark:bg-[#121e32] text-gray-700 hover:bg-gray-100'
                                ]">
                                {{ opt.label }}
                            </button>
                        </div>
                    </div>

                    <!-- Error message pour les autres types de champs -->
                    <p v-if="errors[field.key] && submitted && !['select', 'multi-select-with-dates'].includes(field.type)"
                        class="text-sm text-red-500 mt-1">
                        {{ errors[field.key] }}
                    </p>
                </div>
            </div>

            <!-- Section des checkboxes séparée -->
            <div v-if="checkboxFields.length > 0" class="mt-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div v-for="field in checkboxFields" :key="field.key" class="flex items-center space-x-2">
                        <input :id="field.key" v-model="formData[field.key]" type="checkbox"
                            class="form-checkbox text-primary focus:ring-primary" :disabled="getFieldDisabled(field)" />
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

            <!-- Submit button -->
            <div v-if="!hideSubmit" class="col-span-full mt-3 flex justify-end">
                <SubmitButton
                    :loading="loading"
                    :label="submitLabel || 'Enregistrer'"
                    @click="handleSubmit"
                />
            </div>
        </form>
    </div>
</template>


<script setup lang="ts">
import { reactive, computed, watch, ref } from 'vue';
import SubmitButton from './SubmitButton.vue';
import SelectField from './SelectField.vue';
import Tooltip from '@/components/Tooltip.vue';
import type { FieldConfig, SelectOption } from '@/interfaces/form';
import { required } from '@/utils/validate';
import flatPickr from 'vue-flatpickr-component';
import 'flatpickr/dist/flatpickr.css';
import 'vue-select/dist/vue-select.css';
import '@/assets/css/select2.css';
import { French } from 'flatpickr/dist/l10n/fr.js';
import type { Options, DateOption } from 'flatpickr/dist/types/options';

const props = defineProps<{
    fields: FieldConfig[];
    modelValue: Record<string, unknown>;
    hideSubmit?: boolean;
    submitLabel?: string;
    title?: string;
    columns?: number;
    loading?: boolean;
}>();

const baseDateConfig: Options = {
    locale: French,
    dateFormat: 'Y-m-d',
    altInput: true,
    altFormat: 'd/m/Y',
    allowInput: true,
    enableTime: false,
    monthSelectorType: 'static' as const,
    nextArrow: '<svg class="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M1 1l4 4.5L1 10" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    prevArrow: '<svg class="fill-current" width="7" height="11" viewBox="0 0 7 11"><path d="M6 1L2 5.5 6 10" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};

// Function to get date config with field-specific overrides
const getDateConfig = (field: FieldConfig): Options => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    const minDate = field.min ? new Date(field.min) : today;

    return {
        ...baseDateConfig,
        minDate: minDate,
        disable: [
            function (date) {
                const compareDate = new Date(date);
                compareDate.setHours(0, 0, 0, 0);
                return compareDate < minDate;
            }
        ]
    };
};

// Helper function to safely get disabled state
const getFieldDisabled = (field: FieldConfig): boolean => {
    return Boolean(field.props?.disabled);
};

// Helper function to safely cast formData values for SelectField
const getSelectFieldValue = (key: string): string | number | string[] | number[] | null => {
    const value = formData[key];
    if (value === null || value === undefined) {
        return null;
    }
    if (typeof value === 'string' || typeof value === 'number') {
        return value;
    }
    if (Array.isArray(value)) {
        return value as string[] | number[];
    }
    return null;
};

const emit = defineEmits<{
    (e: 'submit', data: Record<string, unknown>): void;
    (e: 'update:modelValue', data: Record<string, unknown>): void;
    (e: 'validation-change', isValid: boolean): void;
}>();

const submitted = ref(false);
const formData = reactive<Record<string, unknown>>(props.modelValue);
const errors = reactive<Record<string, string | null>>({});

// Generic multi-select with dates
const selectedItems = reactive<Record<string, string[]>>({});
const itemDates = reactive<Record<string, Record<string, string>>>({});

// Function to get filtered options for multi-select (removes selected values)
const getFilteredOptions = (field: FieldConfig): SelectOption[] => {
    const allOptions = formattedOptions(field.options);
    const selectedValues = selectedItems[field.key] || [];
    return allOptions.filter(option => !selectedValues.includes(option.value as string));
};

// Function to get options for single/multi select (removes selected values for multi-select)
const getSelectOptions = (field: FieldConfig): SelectOption[] => {
    const allOptions = formattedOptions(field.options);

    if (field.multiple) {
        const selectedValues = Array.isArray(formData[field.key])
            ? formData[field.key] as string[]
            : [];
        return allOptions.filter(option => !selectedValues.includes(option.value as string));
    }

    return allOptions;
};

// Initialize multi-select with dates fields
const initMultiSelectWithDates = () => {
    props.fields.forEach(field => {
        if (field.type === 'multi-select-with-dates') {
            if (!selectedItems[field.key]) {
                selectedItems[field.key] = [];
            }
            if (!itemDates[field.key]) {
                itemDates[field.key] = {};
            }

            if (Array.isArray(formData[field.key])) {
                const fieldData = formData[field.key] as Array<Record<string, string>>;
                const itemKey = field.itemKey || 'item';
                selectedItems[field.key] = fieldData.map(item => item[itemKey]);
                fieldData.forEach(item => {
                    itemDates[field.key][item[itemKey]] = item.date;
                });
            }
        }
    });
};

// Watch for initialization
watch(() => props.modelValue, () => {
    Object.assign(formData, props.modelValue);
    initMultiSelectWithDates();
}, { immediate: true });

// Update item selection for multi-select with dates
const onItemSelectionChange = (field: FieldConfig, value: string | number | string[] | number[] | null) => {
    if (Array.isArray(value)) {
        selectedItems[field.key] = value as string[];
    } else {
        selectedItems[field.key] = [];
    }

    // Remove dates for unselected items
    Object.keys(itemDates[field.key] || {}).forEach(itemValue => {
        if (!selectedItems[field.key].includes(itemValue)) {
            delete itemDates[field.key][itemValue];
        }
    });
    updateItemsWithDates(field);
};

// Update the form data with items and dates
const updateItemsWithDates = (field: FieldConfig) => {
    const selected = selectedItems[field.key] || [];
    const itemKey = field.itemKey || 'item';
    const itemsWithDates = selected.map(itemValue => ({
        [itemKey]: itemValue,
        date: itemDates[field.key]?.[itemValue] || ''
    }));
    formData[field.key] = itemsWithDates;
    emit('update:modelValue', { ...formData });
};

// Get label for item
const getLabelForItem = (field: FieldConfig, itemValue: string) => {
    const option = formattedOptions(field.options).find(opt => opt.value === itemValue);
    return option?.label || itemValue;
};

// Computed pour séparer les champs
const nonCheckboxFields = computed(() => {
    return props.fields.filter(field => field.type !== 'checkbox');
});

const checkboxFields = computed(() => {
    return props.fields.filter(field => field.type === 'checkbox');
});

// Get field CSS class based on grid configuration
// On ajoute idx et total
function getFieldClass(field: FieldConfig, idx: number) {
    const total = nonCheckboxFields.value.length;
    // Déterminez combien de colonnes vous voulez par défaut
    const cols = props.columns
        ? Math.min(props.columns, total)
        : total >= 3
            ? 3
            : total === 2
                ? 2
                : 1;

    // Si c'est le dernier et qu'il n'y a pas de place complète (total % cols != 0)
    if (idx === total - 1 && total % cols !== 0) {
        return 'col-span-full';
    }
    // Sinon, si field.gridCols est défini on l'applique
    if (field.gridCols) {
        return `col-span-${field.gridCols}`;
    }
    return '';
};


// Validation
const isValid = computed(() => {
    return Object.keys(errors).length === 0 && props.fields.every(field => {
        const value = formData[field.key];
        return field.validators ? field.validators.every(v => v.fn(value)) : true;
    });
});

function validateField(field: FieldConfig) {
    const value = formData[field.key];
    if (field.validators) {
        for (const validator of field.validators) {
            if (!validator.fn(value)) {
                errors[field.key] = validator.msg;
                emit('validation-change', false);
                return false;
            }
        }
    }
    delete errors[field.key];
    emit('validation-change', isValid.value);
    return true;
}

function onFieldChange(field: FieldConfig) {
    if (submitted.value) validateField(field);
}

// Watch for changes
watch(
    () => formData,
    val => {
        emit('update:modelValue', { ...val });
        if (submitted.value) props.fields.forEach(validateField);
    },
    { deep: true }
);

// Logique de grille améliorée
const formGridClass = computed(() => {
    const fieldCount = nonCheckboxFields.value.length;
    const requestedCols = props.columns;

    // Si un nombre de colonnes spécifique est demandé
    if (requestedCols) {
        // Si on a moins de champs que de colonnes demandées, utiliser une seule colonne
        if (fieldCount <= 2) {
            return 'space-y-6'; // Pas de grille, juste un espacement vertical
        }
        return `grid grid-cols-1 md:grid-cols-${Math.min(requestedCols, fieldCount)} gap-6`;
    }

    // Logique automatique basée sur le nombre de champs
    if (fieldCount === 1) {
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    } else if (fieldCount === 2) {
        return 'space-y-6'; // Deux champs, affichage vertical pour une meilleure lisibilité
    } else if (fieldCount >= 3) {
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'; // 3+ champs, grille responsive
    }

    return 'space-y-6'; // Fallback
});

// Options
function formattedOptions(options: Array<string | SelectOption> = []): SelectOption[] {
    return options.map(opt => (typeof opt === 'string' ? { label: opt, value: opt } : opt));
}

// Button-group helpers
function isSelected(key: string, value: unknown): boolean {
    const val = formData[key];
    return Array.isArray(val) && (val as unknown[]).includes(value);
}

function toggleValue(key: string, value: unknown) {
    const arr = (formData[key] as unknown[]) || [];
    const idx = arr.indexOf(value);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(value);
    emit('update:modelValue', { ...formData });
    if (submitted.value) validateField(props.fields.find(f => f.key === key)!);
}

// Submit
async function handleSubmit() {
    submitted.value = true;
    props.fields.forEach(field => validateField(field));
    if (!isValid.value) return;

    await emit('submit', { ...formData });
}

// Validation method
function validate(): boolean {
    submitted.value = true;
    let valid = true;
    props.fields.forEach(field => {
        if (!validateField(field)) {
            valid = false;
        }
    });
    emit('validation-change', valid);
    return valid;
}

// Expose validate() to parent
defineExpose({ validate });
</script>



<style>
/* Vue-select styles */
:root {
    --vs-colors-lightest: rgba(60, 60, 60, 0.26);
    --vs-colors-light: rgba(60, 60, 60, 0.5);
    --vs-colors-dark: #333;
    --vs-colors-darkest: rgba(197, 51, 51, 0.15);
    --vs-border-color: #e2e8f0;
    --vs-border-width: 1px;
    --vs-border-style: solid;
    --vs-border-radius: 0.5rem;
    --vs-dropdown-bg: #fff;
    --vs-dropdown-z-index: 1000;
    --vs-actions-padding: 4px 6px 0 3px;
}

.vs-custom {
    font-family: inherit;
    width: 100%;
}

.vs-custom .vs__dropdown-toggle {
    padding: 0.5rem;
    background: white;
    border: var(--vs-border-width) var(--vs-border-style) var(--vs-border-color);
    border-radius: var(--vs-border-radius);
    transition: all 0.2s;
}

.vs-custom .vs__dropdown-toggle:hover {
    border-color: var(--color-primary);
}

.vs-custom .vs__dropdown-toggle:focus-within {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(255, 204, 17, 0.1);
    outline: none;
}

.vs-custom .vs__search {
    padding: 0 7px;
    margin: 4px 0 0 0;
    font-size: 0.875rem;
    border: none;
}

.vs-custom .vs__search::placeholder {
    color: #94a3b8;
}

.vs-custom .vs__dropdown-menu {
    padding: 0.5rem 0;
    border: 1px solid var(--vs-border-color);
    border-radius: var(--vs-border-radius);
    background: white;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.vs-custom .vs__dropdown-option {
    padding: 0.5rem 1rem;
    color: #64748b;
}

.vs-custom .vs__dropdown-option--highlight {
    background: var(--color-primary-light);
    color: var(--color-primary);
}

.dark .vs-custom .vs__dropdown-toggle {
    background-color: #121e32;
    border-color: #17263c;
    color: var(--color-primary);
}

.vs-custom .vs__selected {
    color: var(--color-white-light);
}

.dark .vs-custom .vs__dropdown-toggle:focus-within {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(255, 204, 17, 0.1);
    outline: none;
}

.vs-custom .vs__search::placeholder {
    color: #94a3b8;
}

.dark .vs-custom .vs__dropdown-toggle:hover {
    border-color: var(--color-primary);
}

.dark .vs-custom .vs__search {
    background-color: #121e32;
    color: #e2e8f0;
}

.dark .vs-custom .vs__dropdown-menu {
    background-color: #121e32;
    border-color: #17263c;
}

.dark .vs-custom .vs__dropdown-option {
    color: var(--color-white-light);
}


.dark .vs-custom .vs__dropdown-option--highlight {
    color: #ffcc11;
}

/* Flatpickr custom styles */
.flatpickr-calendar {
    background: #fff;
    border-radius: 0.75rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid #e2e8f0;
    font-family: inherit;
}

.flatpickr-month {
    height: 36px;
}

.flatpickr-current-month {
    padding-top: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.flatpickr-monthDropdown-months {
    font-weight: 600;
    font-size: 1rem;
}

.flatpickr-weekdays {
    margin-top: 0.1rem;
}

.flatpickr-weekday {
    font-size: 0.5rem;
    color: #64748b;
    font-weight: 500;
}

.flatpickr-day {
    border-radius: 0.5rem;
    margin: 2.5px;
    height: 34px;
    line-height: 32px;
    color: #1e293b;
    font-weight: 500;
}

.flatpickr-day.selected {
    background: var(--color-primary);
    border-color: var(--color-primary);
}

.flatpickr-day.selected:hover {
    border-color: var(--color-primary);
    background: var(--color-primary);
}

.flatpickr-day:hover {
    background: #f1f5f9;
    border-color: #f1f5f9;
}

.flatpickr-day.today {
    border-color: var(--color-primary);
}

.flatpickr-months .flatpickr-prev-month,
.flatpickr-months .flatpickr-next-month {
    top: 0;
    padding: 0.5rem;
    height: auto;
}

.flatpickr-months .flatpickr-prev-month svg,
.flatpickr-months .flatpickr-next-month svg {
    width: 7px;
    height: 11px;
}

/* Dark mode styles */
.dark .flatpickr-calendar {
    background: #121e32;
    border-color: #17263c;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
}

.dark .flatpickr-weekday {
    color: #94a3b8;
}

.dark .flatpickr-day {
    color: #e2e8f0;
}

.dark .flatpickr-day:hover {
    background: #1e293b;
    border-color: #1e293b;
}

.dark .flatpickr-day.today {
    border-color: var(--color-primary);
}

.dark .flatpickr-monthDropdown-months,
.dark .flatpickr-current-month input.cur-year {
    color: #e2e8f0;
}

.dark .flatpickr-months .flatpickr-prev-month,
.dark .flatpickr-months .flatpickr-next-month {
    color: #e2e8f0;
}

/* Flatpickr compact styles - remplace les styles existants */
.flatpickr-calendar {
    background: #fff;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    font-family: inherit;

}

.flatpickr-month {
    height: 32px;
    /* Réduit de 36px */
}

.flatpickr-current-month {
    padding-top: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.flatpickr-monthDropdown-months {
    font-weight: 600;
    font-size: 0.9rem;
    /* Augmenté de 1rem */

}

.flatpickr-current-month input.cur-year {
    font-size: 0.9rem;
    /* Augmenté */
    font-weight: 600;

}

.flatpickr-weekdays {
    margin-top: 0.1rem;
    height: 24px;
    /* Plus compact */
}

.flatpickr-weekday {
    font-size: 0.75rem;
    /* Augmenté de 0.5rem */
    font-weight: 600;
    height: 24px;
    line-height: 24px;
}


.flatpickr-day {
    border-radius: 0.375rem;
    margin: 1px;
    /* Réduit de 2.5px */
    height: 30px;
    /* Réduit de 34px */
    line-height: 30px;
    width: 30px;
    /* Taille fixe */
    font-weight: 500;
    font-size: 0.875rem;
    /* Taille de police augmentée */
    max-width: 30px;
}


.flatpickr-months .flatpickr-prev-month,
.flatpickr-months .flatpickr-next-month {
    top: 0;
    padding: 0.375rem;
    /* Réduit */
    height: auto;
    width: 28px;
}

.flatpickr-months .flatpickr-prev-month svg,
.flatpickr-months .flatpickr-next-month svg {
    width: 8px;
    /* Augmenté de 7px */
    height: 12px;
    /* Augmenté de 11px */
}

/* Amélioration de l'input date */
.flatpickr-input {
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem !important;
    /* Padding réduit */
}

/* Responsive adjustments */
@media (max-width: 640px) {
    .flatpickr-calendar {
        width: 260px;
        /* Encore plus compact sur mobile */
    }



    .flatpickr-day {
        height: 28px;
        width: 28px;
        line-height: 28px;
        font-size: 0.8rem;
    }
}
</style>
