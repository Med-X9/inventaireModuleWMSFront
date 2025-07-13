import { computed } from 'vue';
import type { FieldConfig } from '@/interfaces/form';

export function useFormGrid(props: any) {
    // Séparer les champs checkbox des autres
    const nonCheckboxFields = computed(() => {
        return props.fields.filter(field => field.type !== 'checkbox');
    });

    const checkboxFields = computed(() => {
        return props.fields.filter(field => field.type === 'checkbox');
    });

    // Classe CSS pour la grille du formulaire
    const formGridClass = computed(() => {
        const fieldCount = nonCheckboxFields.value.length;
        const requestedCols = props.columns;

        // Si un nombre de colonnes spécifique est demandé
        if (requestedCols) {
            if (fieldCount <= 2) {
                return 'space-y-6';
            }
            return `grid grid-cols-1 md:grid-cols-${Math.min(requestedCols, fieldCount)} gap-6`;
        }

        // Logique automatique basée sur le nombre de champs
        if (fieldCount === 1) {
            return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
        } else if (fieldCount === 2) {
            return 'space-y-6';
        } else if (fieldCount >= 3) {
            return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
        }

        return 'space-y-6';
    });

    // Classe CSS pour un champ spécifique
    const getFieldClass = (field: FieldConfig, idx: number) => {
        const total = nonCheckboxFields.value.length;

        // Si field.gridCols est défini, utiliser une approche plus flexible
        if (field.gridCols) {
            if (field.gridCols === 1) return '';
            if (field.gridCols === 2) return 'md:col-span-2';
            if (field.gridCols === 3) return 'md:col-span-3';
            if (field.gridCols === 4) return 'md:col-span-4';
            if (field.gridCols === 5) return 'md:col-span-5';
            if (field.gridCols === 6) return 'md:col-span-6';
            if (field.gridCols === 12) return 'col-span-full';
        }

        // Logique pour le dernier élément si nécessaire
        const cols = props.columns || (total >= 3 ? 3 : total === 2 ? 2 : 1);
        if (idx === total - 1 && total % cols !== 0) {
            return 'col-span-full';
        }

        return '';
    };

    return {
        formGridClass,
        getFieldClass,
        nonCheckboxFields,
        checkboxFields
    };
}
