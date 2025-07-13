import { reactive, computed, watch } from 'vue';
import type { FieldConfig } from '@/interfaces/form';

export function useFormData(props: any, emit: any) {
    // Données réactives du formulaire
    const formData = reactive<Record<string, unknown>>(props.modelValue);
    const errors = reactive<Record<string, string | null>>({});

    // Mettre à jour la valeur d'un champ
    const updateFieldValue = (key: string, value: unknown) => {
        formData[key] = value;
        emit('update:modelValue', { ...formData });
    };

    // Validation du formulaire
    const isValid = computed(() => {
        const hasErrors = Object.values(errors).some(error => error !== null && error !== undefined);
        return !hasErrors && props.fields.every(field => {
            const value = formData[field.key];
            return field.validators ? field.validators.every(v => v.fn(value)) : true;
        });
    });

    // Surveiller les changements de données
    watch(
        () => formData,
        val => {
            emit('update:modelValue', { ...val });
        },
        { deep: true }
    );

    return {
        formData,
        errors,
        updateFieldValue,
        isValid
    };
}
