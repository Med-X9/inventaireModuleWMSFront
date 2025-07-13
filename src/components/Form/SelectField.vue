<template>
    <div>
        <v-select :key="`v-select-${fieldId}-${JSON.stringify(selected)}`" :id="fieldId" :model-value="selected"
            :options="formattedOptions" :multiple="multiple" :searchable="searchable" :clearable="clearable"
            :placeholder="placeholder" :disabled="disabled" :loading="loading" label="label"
            :reduce="(option: any) => option.value" :class="[
                'form-input',
                'px-4',
                'py-3',
                'bg-white',
                'border',
                'border-gray-200',
                'rounded-lg',
                'transition-all',
                'duration-200',
                'focus:border-primary',
                'focus:ring-2',
                'focus:ring-primary',
                'focus:ring-opacity-10',
                'outline-none',
                compact ? 'vs-compact' : '',
                multiple ? 'vs-multi' : 'vs-single',
                searchable ? 'vs-search-enhanced' : '',
                error ? 'vs-error' : '',
                'dark'
            ]" :filter="customFilter" @update:model-value="handleModelValueUpdate" @search="$emit('search', $event)"
            @open="handleOpen" @close="handleClose">

            <!-- Custom option template with tooltip support -->
            <template #option="{ option }">
                <div v-if="option" class="vs-option-with-tooltip relative w-full">
                    <div class="vs-option-content flex items-center justify-between w-full">
                        <span>{{ option.label }}</span>
                        <svg v-if="option.tooltip" class="w-3 h-3 text-gray-400 cursor-help vs-tooltip-trigger ml-2"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            @mouseenter="handleMouseEnter($event, option)" @mouseleave="handleMouseLeave">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    <!-- Tooltip affiché sous le label, pleine largeur -->
                    <div v-if="showTooltip === String(option.value) && option.tooltip"
                        class="tooltip-content w-full mt-1 p-1.5 bg-primary text-white text-xs rounded border border-primary z-50 absolute left-0"
                        :style="{ top: '100%' }">
                        {{ option.tooltip }}
                    </div>
                </div>
            </template>

            <!-- Template pour afficher les valeurs sélectionnées -->
            <template #selected-option="{ option }">
                <span v-if="option">{{ option.label }}</span>
            </template>

            <!-- Template pour afficher la valeur sélectionnée dans les selects simples -->
            <template #value="{ option }">
                <span v-if="option">
                    {{ typeof option === 'object' ? option.label : option }}
                </span>
            </template>

            <!-- Custom no options template -->
            <template #no-options>
                <div class="text-center py-2 text-gray-500">
                    {{ noOptionsText || 'Aucune option disponible' }}
                </div>
            </template>

            <!-- Custom search input template for enhanced search -->
            <template v-if="enhancedSearch" #search="{ attributes, events }">
                <input v-bind="attributes" v-on="events" class="vs-search-input"
                    :placeholder="searchPlaceholder || 'Rechercher...'" />
            </template>
        </v-select>

        <!-- Error message -->
        <p v-if="error && errorMessage" class="text-sm text-red-500 mt-1">
            {{ errorMessage }}
        </p>

        <!-- Helper text -->
        <p v-if="helperText" class="text-sm text-gray-500 mt-1">
            {{ helperText }}
        </p>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, watch } from 'vue';
import vSelect from 'vue-select';
import Tooltip from '@/components/Tooltip.vue';
import 'vue-select/dist/vue-select.css';
import '@/assets/css/select2.css';
import type { SelectOption, FieldConfig } from '@/interfaces/form';

// Props pour compatibilité avec FormBuilder
const props = withDefaults(defineProps<{
    // Props FormBuilder
    field?: FieldConfig;
    value?: unknown;
    error?: boolean;
    errorMessage?: string;
    disabled?: boolean;

    // Props SelectField originales
    modelValue?: string | number | string[] | number[] | null;
    selected?: string | number | string[] | number[] | null;
    options?: Array<string | SelectOption>;
    label?: string;
    placeholder?: string;
    searchable?: boolean;
    clearable?: boolean;
    multiple?: boolean;
    loading?: boolean;
    required?: boolean;
    helperText?: string;
    tooltip?: string;
    compact?: boolean;
    enhancedSearch?: boolean;
    searchPlaceholder?: string;
    noOptionsText?: string;
    customFilter?: (option: SelectOption, label: string, search: string) => boolean;
}>(), {
    searchable: true,
    clearable: true,
    multiple: false,
    disabled: false,
    loading: false,
    required: false,
    error: false,
    compact: false,
    enhancedSearch: false,
    customFilter: undefined
});

// Émettre les événements
const emit = defineEmits<{
    'update:value': [value: unknown];
    'change': [];
    'update:modelValue': [value: string | number | string[] | number[] | null];
    'search': [query: string];
    'open': [];
    'close': [];
}>();

// Générer un ID unique pour le champ
const fieldId = ref(`select-${Math.random().toString(36).substr(2, 9)}`);

// État du tooltip
const showTooltip = ref<string | null>(null);

// Formater les options de manière cohérente
const formattedOptions = computed((): SelectOption[] => {
    // Si on a un field avec des options, les utiliser
    if (props.field?.options) {
        const options = props.field.options.map(opt =>
            typeof opt === 'string' ? { label: opt, value: opt } : opt
        );
        return options;
    }
    // Sinon utiliser les options directes
    const options = (props.options || []).map(opt =>
        typeof opt === 'string' ? { label: opt, value: opt } : opt
    );
    return options;
});

// Watcher pour forcer la mise à jour quand les options changent
watch(() => props.field?.options, () => {
    // Forcer un recalcul
    nextTick(() => {
        // Recalcul automatique
    });
}, { deep: true });

// Watcher pour les options directes
watch(() => props.options, () => {
    nextTick(() => {
        // Recalcul automatique
    });
}, { deep: true });

// Utiliser la prop value si fournie (FormBuilder), sinon utiliser selected ou modelValue
const selected = computed(() => {
    if (props.value !== undefined) {
        return props.value;
    }
    return props.selected !== undefined ? props.selected : props.modelValue;
});

// Extraire les propriétés du field pour la compatibilité avec FormBuilder
const multiple = computed(() => {
    return props.field?.multiple || props.multiple || false;
});

const searchable = computed(() => {
    return props.field?.searchable || props.searchable || true;
});

const clearable = computed(() => {
    return props.field?.clearable || props.clearable || true;
});

const placeholder = computed(() => {
    return props.field?.props?.placeholder || props.placeholder || '';
});

// Fonction pour obtenir le label à partir d'une value
const getLabelFromValue = (value: string | number): string => {
    const option = formattedOptions.value.find(opt => opt.value === value);
    return option ? option.label : String(value);
};

// Gestion des événements de tooltip
const handleMouseEnter = (event: MouseEvent, option: SelectOption) => {
    showTooltip.value = String(option.value);
};

const handleMouseLeave = () => {
    showTooltip.value = null;
};

// Gestion sécurisée des événements
const handleModelValueUpdate = (value: any) => {
    console.log('🔍 SelectField - Valeur reçue:', value, typeof value, Array.isArray(value));
    console.log('🔍 SelectField - Multiple:', multiple.value);

    // Émettre pour FormBuilder
    emit('update:value', value);
    emit('change');

    // Émettre pour compatibilité avec v-select
    emit('update:modelValue', value);
};

const handleOpen = () => {
    emit('open');
};

const handleClose = () => {
    emit('close');
};
</script>

<style scoped>
/* Style pour les options avec tooltip */
.vs-option-with-tooltip {
    position: relative;
    overflow: visible;
    width: 100%;
}

.vs-option-content {
    position: relative;
    z-index: 1;
    width: 100%;
}

.v-select {
    box-shadow: none !important;
    background: transparent !important;
    border-radius: 0 !important;
  }

/* Tooltip pleine largeur sous l'option */
.tooltip-content {
    position: absolute;
    left: 0;
    right: 0;
    top: 100%;
    z-index: 1000;
    margin-top: 2px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Assurer que le dropdown a un overflow visible */
.vs-custom :deep(.vs__dropdown-menu) {
    overflow: visible !important;
}

/* Assurer que chaque option a un overflow visible */
.vs-custom :deep(.vs__dropdown-option) {
    overflow: visible !important;
    position: relative !important;
}

/* Espacement pour éviter que le tooltip ne soit coupé */
.vs-custom :deep(.vs__dropdown-option--highlight) {
    padding-bottom: 0.5rem;
}

/* Animation douce pour l'apparition du tooltip */
.tooltip-content {
    animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-4px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
