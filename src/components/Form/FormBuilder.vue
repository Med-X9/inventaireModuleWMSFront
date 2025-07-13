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

                    <!-- Label avec tooltip -->
                    <FormFieldLabel :field="field" :required="isFieldRequired(field)"
                        :error="!!(errors[field.key] && submitted)" />

                    <!-- Rendu des champs selon leur type -->
                    <component :is="getFieldComponent(field.type)" :field="field" :value="formData[field.key]"
                        :error="!!(errors[field.key] && submitted)" :error-message="errors[field.key]"
                        :disabled="getFieldDisabled(field)"
                        @update:value="(value: unknown) => updateFieldValue(field.key, value)"
                        @change="() => onFieldChange(field)" />

                    <!-- Message d'erreur -->
                    <FormFieldError
                        v-if="errors[field.key] && submitted && !['multi-select-with-dates'].includes(field.type)"
                        :message="errors[field.key]" />
                </div>
            </div>

            <!-- Section des checkboxes séparée -->
            <CheckboxSection v-if="checkboxFields.length > 0" :fields="checkboxFields" :form-data="formData"
                :errors="errors" :submitted="submitted" @update:value="updateFieldValue" />

            <!-- Submit button -->
            <div v-if="!hideSubmit" class="col-span-full mt-3 flex justify-end">
                <SubmitButton type="button" :loading="isSubmitting" :disabled="submitted && !isValid"
                    :label="submitLabel || 'Enregistrer'" @click="handleSubmit" />
            </div>
        </form>
    </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch, ref, nextTick } from 'vue';
import SubmitButton from './SubmitButton.vue';
import SelectField from './SelectField.vue';
import FormFieldLabel from './FormFieldLabel.vue';
import FormFieldError from './FormFieldError.vue';
import CheckboxSection from './CheckboxSection.vue';
import TextInput from './fields/TextInput.vue';
import DateInput from './fields/DateInput.vue';
import RadioInput from './fields/RadioInput.vue';
import RadioGroupInput from './fields/RadioGroupInput.vue';
import MultiSelectWithDates from './fields/MultiSelectWithDates.vue';
import ButtonGroupInput from './fields/ButtonGroupInput.vue';
import type { FieldConfig, SelectOption } from '@/interfaces/form';
import { required } from '@/utils/validate';
import { safeExecute } from '@/utils/domUtils';
import { useFormValidation } from '../../composables/useFormValidation';
import { useFormGrid } from '../../composables/useFormGrid';
import { useFormData } from '../../composables/useFormData';

// Props
const props = defineProps<{
    fields: FieldConfig[];
    modelValue: Record<string, unknown>;
    hideSubmit?: boolean;
    submitLabel?: string;
    title?: string;
    columns?: number;
}>();

// Forcer columns à 3 si non défini (3 champs par ligne)
const columns = computed(() => props.columns ?? 3);

// Émettre les événements
const emit = defineEmits<{
    (e: 'submit', data: Record<string, unknown>): void;
    (e: 'update:modelValue', data: Record<string, unknown>): void;
    (e: 'validation-change', isValid: boolean): void;
}>();

// État du formulaire
const isSubmitting = ref(false);
const submitted = ref(false);

// Composables
const { formData, errors, updateFieldValue, isValid } = useFormData(props, emit);
const { validateField, validate } = useFormValidation(props, formData, errors, submitted, emit);
const { formGridClass, getFieldClass, nonCheckboxFields, checkboxFields } = useFormGrid({ ...props, columns: columns.value });

// Fonctions utilitaires
const getFieldDisabled = (field: FieldConfig): boolean => {
    return Boolean(field.props?.disabled);
};

const isFieldRequired = (field: FieldConfig): boolean => {
    return field.validators?.some(v => v.fn === required().fn) || false;
};

// Composant à utiliser selon le type de champ
const getFieldComponent = (type: string) => {
    const componentMap: Record<string, any> = {
        'text': TextInput,
        'email': TextInput,
        'date': DateInput,
        'radio': RadioInput,
        'radio-group': RadioGroupInput,
        'select': SelectField,
        'multi-select-with-dates': MultiSelectWithDates,
        'button-group': ButtonGroupInput
    };
    return componentMap[type] || TextInput;
};

// Gestion des changements de champs
const onFieldChange = (field: FieldConfig) => {
    if (submitted.value) validateField(field);
};

// Gestion de la soumission
const handleSubmit = async () => {
    submitted.value = true;
    props.fields.forEach(field => validateField(field));

    if (!isValid.value) return;

    isSubmitting.value = true;
    await emit('submit', { ...formData });
    isSubmitting.value = false;
};

// Exposer la méthode validate
defineExpose({ validate });

// Surveiller les changements de données
watch(
    () => formData,
    val => {
        nextTick(() => {
            emit('update:modelValue', { ...val });
            if (submitted.value) props.fields.forEach(validateField);
        });
    },
    { deep: true }
);

// Surveiller les changements de props.modelValue
watch(() => props.modelValue, async (newValue) => {
    const fieldKeys = props.fields.map(f => f.key);
    const hasRelevantData = fieldKeys.some(key => key in newValue);

    if (!hasRelevantData) {
        return;
    }

    safeExecute(() => {
        nextTick().then(async () => {
            // Initialiser les données avec les valeurs par défaut si elles n'existent pas
            Object.keys(newValue).forEach(key => {
                if (fieldKeys.includes(key)) {
                    // S'assurer que la valeur n'est pas undefined ou null
                    if (newValue[key] !== undefined && newValue[key] !== null) {
                        formData[key] = newValue[key];
                    }
                }
            });

            // Initialiser les champs manquants avec des valeurs par défaut
            fieldKeys.forEach(key => {
                if (!(key in formData)) {
                    const field = props.fields.find(f => f.key === key);
                    if (field) {
                        // Définir une valeur par défaut selon le type
                        if (field.type === 'select' || field.type === 'multi-select-with-dates') {
                            formData[key] = [];
                        } else if (field.type === 'date') {
                            formData[key] = '';
                        } else {
                            formData[key] = '';
                        }
                    }
                }
            });
        });
    }, () => {
        console.warn('⚠️ Erreur lors de l\'initialisation des données FormBuilder');
    });
}, { immediate: true, deep: true });
</script>

<style lang="postcss" scoped>
/* Styles spécifiques au FormBuilder */
.container {
    @apply max-w-7xl mx-auto px-4;
}

/* Responsive design */
@media (max-width: 768px) {
    .container {
        @apply px-2;
    }
}
</style>
