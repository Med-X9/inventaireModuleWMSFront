import type { FieldConfig } from '@/interfaces/form';

export function useFormValidation(
    props: any,
    formData: Record<string, unknown>,
    errors: Record<string, string | null>,
    submitted: any,
    emit: any
) {
    // Valider un champ spécifique
    const validateField = (field: FieldConfig) => {
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
        emit('validation-change', true);
        return true;
    };

    // Valider tout le formulaire
    const validate = () => {
        submitted.value = true;
        let valid = true;
        props.fields.forEach(field => {
            if (!validateField(field)) {
                valid = false;
            }
        });
        emit('validation-change', valid);
        return valid;
    };

    return {
        validateField,
        validate
    };
}
