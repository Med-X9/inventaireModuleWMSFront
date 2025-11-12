import type { FieldConfig } from '@/interfaces/stepConfig';

export class FieldFactory {
    static getFieldsForStep(stepIndex: number, config: any): FieldConfig[] {
        if (stepIndex === 0) {
            return [
                { key: 'libelle', label: 'Libellé', type: 'text' },
                { key: 'date', label: 'Date', type: 'date' },
                { key: 'inventory_type', label: 'Type', type: 'select' },
                { key: 'compte', label: 'Compte', type: 'select' },
                { key: 'magasin', label: 'Magasin', type: 'multi-select-with-dates' }
            ];
        }
        if (stepIndex === 1 || stepIndex === 2) {
            // stepIndex 1 : tous les modes, stepIndex 2 : modes filtrés par la logique métier
            const modeOptions = (config.availableModes || []);
            const fields: FieldConfig[] = [
                { key: 'mode', label: 'Mode de comptage', type: 'select', options: modeOptions, props: { disabled: !!config.modeLocked } }
            ];
            // Générer dynamiquement les options selon le mode sélectionné
            const mode = config.values?.mode;
            if (mode === 'en vrac') {
                fields.push(
                    {
                        key: 'inputMethod',
                        label: 'Méthode opératoire',
                        type: 'radio-group',
                        radioOptions: [
                            { label: 'Saisie quantité', value: 'saisie' },
                            { label: 'Scanner unitaire', value: 'scanner' }
                        ]
                    },
                    {
                        key: 'guideQuantite',
                        label: 'Guide quantité',
                        type: 'checkbox'
                    }
                );
            } else if (mode === 'par article') {
                fields.push(
                    {
                        key: 'guideQuantite',
                        label: 'Guide quantité',
                        type: 'checkbox'
                    },
                    {
                        key: 'guideArticle',
                        label: 'Guide Article',
                        type: 'checkbox'
                    },
                    {
                        key: 'isVariante',
                        label: 'Variante',
                        type: 'checkbox'
                    },
                    {
                        key: 'dlc',
                        label: 'DLC',
                        type: 'checkbox'
                    },
                    {
                        key: 'numeroSerie',
                        label: 'Numéro de série',
                        type: 'checkbox'
                    },
                    {
                        key: 'numeroLot',
                        label: 'Numéro de lot',
                        type: 'checkbox'
                    }
                );
            }
            // Si image de stock : aucune option
            return fields;
        }
        return [];
    }
}
