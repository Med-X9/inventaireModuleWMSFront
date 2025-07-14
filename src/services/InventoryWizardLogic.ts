import type { InventoryCreationState, ComptageMode, ComptageConfig } from '@/interfaces/inventoryCreation';
import { CountingDispatcher } from '@/usecases/CountingDispatcher';
import type { Count } from '@/models/Count';

export class InventoryWizardLogic {
    getAvailableModesForStep(state: InventoryCreationState, stepIndex: number): ComptageMode[] {
        if (stepIndex === 0) {
            // Comptage 1: 3 options
            return [
                'image de stock',
                'en vrac',
                'par article'
            ];
        }

        if (stepIndex === 1) {
            // Comptage 2: 2 options (jamais "image de stock")
            return [
                'en vrac',
                'par article'
            ];
        }

        if (stepIndex === 2) {
            // Comptage 3: dépend des choix précédents
            const firstComptage = state.comptages[0];
            const secondComptage = state.comptages[1];

            if (firstComptage.mode === 'image de stock') {
                // Si Comptage 1 = "image de stock", alors Comptage 3 = valeur de Comptage 2
                return [secondComptage.mode].filter(Boolean) as ComptageMode[];
            }

            // Sinon, on prend l'ensemble {Comptage 1, Comptage 2} et on supprime les doublons
            const uniqueModes = new Set([firstComptage.mode, secondComptage.mode].filter(Boolean));
            return Array.from(uniqueModes) as ComptageMode[];
        }

        return [];
    }

    /**
     * Valide les combinaisons d'options pour le mode "par article"
     * @param comptageConfig Configuration du comptage à valider
     * @throws Error si la combinaison n'est pas autorisée
     */
    validateParArticleCombination(comptageConfig: ComptageConfig): void {
        if (comptageConfig.mode !== 'par article') {
            return; // Pas de validation pour les autres modes
        }

        const options = {
            n_serie: comptageConfig.numeroSerie,
            n_lot: comptageConfig.numeroLot,
            dlc: comptageConfig.dlc,
            variante: comptageConfig.isVariante
        };

        // Règles de validation
        const hasNserie = options.n_serie;
        const hasNlot = options.n_lot;
        const hasDlc = options.dlc;
        const hasVariante = options.variante;

        // Règle 1: n_serie et n_lot ne peuvent pas coexister
        if (hasNserie && hasNlot) {
            throw new Error('Les options "Numéro de série" et "Numéro de lot" ne peuvent pas être utilisées ensemble');
        }

        // Règle 2: n_serie et DLC ne peuvent pas coexister
        if (hasNserie && hasDlc) {
            throw new Error('Les options "Numéro de série" et "DLC" ne peuvent pas être utilisées ensemble');
        }

        // Règle 3: n_serie ne peut pas être combiné avec d'autres options sauf variante
        if (hasNserie && (hasNlot || hasDlc)) {
            throw new Error('Le "Numéro de série" ne peut être combiné qu\'avec "Variante"');
        }

        // Combinaisons autorisées
        const validCombinations = [
            { n_serie: true, n_lot: false, dlc: false, variante: false }, // (n_serie)
            { n_serie: true, n_lot: false, dlc: false, variante: true },  // (n_serie, variante)
            { n_serie: false, n_lot: false, dlc: false, variante: true }, // (variante)
            { n_serie: false, n_lot: true, dlc: false, variante: false }, // (n_lot)
            { n_serie: false, n_lot: false, dlc: true, variante: false }, // (DLC)
            { n_serie: false, n_lot: true, dlc: true, variante: false },  // (DLC, n_lot)
            { n_serie: false, n_lot: false, dlc: true, variante: true },  // (DLC, variante)
            { n_serie: false, n_lot: true, dlc: false, variante: true },  // (n_lot, variante)
            { n_serie: false, n_lot: true, dlc: true, variante: true }    // (DLC, n_lot, variante)
        ];

        const currentCombination = { n_serie: hasNserie, n_lot: hasNlot, dlc: hasDlc, variante: hasVariante };
        const isValid = validCombinations.some(valid =>
            valid.n_serie === currentCombination.n_serie &&
            valid.n_lot === currentCombination.n_lot &&
            valid.dlc === currentCombination.dlc &&
            valid.variante === currentCombination.variante
        );

        if (!isValid) {
            throw new Error('Combinaison d\'options non autorisée pour le mode "par article"');
        }
    }

    /**
     * Valide un comptage en utilisant le CountingDispatcher
     * @param comptageConfig Configuration du comptage à valider
     * @throws CountingValidationError si les données sont invalides
     */
    validateComptage(comptageConfig: ComptageConfig): void {
        // Validation spécifique pour "par article"
        if (comptageConfig.mode === 'par article') {
            this.validateParArticleCombination(comptageConfig);
        }

        // Convertir ComptageConfig en Count pour la validation
        const countData: Count = {
            id: null,
            reference: null,
            order: 0,
            count_mode: comptageConfig.mode,
            unit_scanned: false,
            entry_quantity: false,
            is_variant: false,
            n_lot: false,
            n_serie: false,
            dlc: false,
            show_product: false,
            stock_situation: false,
            quantity_show: false,
            inventory: 0,
            created_at: '',
            updated_at: '',
            ...this.convertComptageConfigToCount(comptageConfig)
        };

        // Utiliser le CountingDispatcher pour valider
        CountingDispatcher.validateCount(countData);
    }

    /**
     * Valide l'ensemble des comptages d'un inventaire
     * @param state État de création de l'inventaire
     * @throws CountingValidationError si un comptage est invalide
     */
    validateAllComptages(state: InventoryCreationState): void {
        for (const comptage of state.comptages) {
            this.validateComptage(comptage);
        }

        // Validation spécifique pour "image de stock"
        if (!this.checkImageDeStockConsistency(state)) {
            throw new Error('Configuration incohérente pour le mode "image de stock"');
        }
    }

    /**
     * Convertit ComptageConfig en Count pour la validation
     */
    private convertComptageConfigToCount(comptageConfig: ComptageConfig): Partial<Count> {
        const countData: Partial<Count> = {};

        switch (comptageConfig.mode) {
            case 'en vrac':
                countData.unit_scanned = comptageConfig.scannerUnitaire;
                countData.entry_quantity = comptageConfig.saisieQuantite;
                countData.quantity_show = comptageConfig.guideQuantite;
                break;

            case 'par article':
                countData.is_variant = comptageConfig.isVariante;
                countData.show_product = comptageConfig.guideArticle;
                countData.quantity_show = comptageConfig.guideQuantite;
                countData.dlc = comptageConfig.dlc;
                countData.n_serie = comptageConfig.numeroSerie;
                countData.n_lot = comptageConfig.numeroLot;
                break;

            case 'image de stock':
                countData.stock_situation = comptageConfig.stock_situation || false;
                break;
        }

        return countData;
    }

    getOptionsForMode(mode: ComptageMode): {
        hasEnVracOptions: boolean;
        hasParArticleOptions: boolean;
        hasNoOptions: boolean;
    }
    {
        switch (mode) {
            case 'en vrac':
                return {
                    hasEnVracOptions: true,
                    hasParArticleOptions: false,
                    hasNoOptions: false
                };
            case 'par article':
                return {
                    hasEnVracOptions: false,
                    hasParArticleOptions: true,
                    hasNoOptions: false
                };
            case 'image de stock':
                return {
                    hasEnVracOptions: false,
                    hasParArticleOptions: false,
                    hasNoOptions: true
                };
            default:
                return {
                    hasEnVracOptions: false,
                    hasParArticleOptions: false,
                    hasNoOptions: true
                };
        }
    }

    /**
     * Obtient les combinaisons autorisées pour le mode "par article"
     */
    getValidParArticleCombinations(): Array<{
        n_serie: boolean;
        n_lot: boolean;
        dlc: boolean;
        variante: boolean;
        label: string;
    }> {
        return [
            { n_serie: true, n_lot: false, dlc: false, variante: false, label: 'Numéro de série' },
            { n_serie: true, n_lot: false, dlc: false, variante: true, label: 'Numéro de série + Variante' },
            { n_serie: false, n_lot: false, dlc: false, variante: true, label: 'Variante' },
            { n_serie: false, n_lot: true, dlc: false, variante: false, label: 'Numéro de lot' },
            { n_serie: false, n_lot: false, dlc: true, variante: false, label: 'DLC' },
            { n_serie: false, n_lot: true, dlc: true, variante: false, label: 'DLC + Numéro de lot' },
            { n_serie: false, n_lot: false, dlc: true, variante: true, label: 'DLC + Variante' },
            { n_serie: false, n_lot: true, dlc: false, variante: true, label: 'Numéro de lot + Variante' },
            { n_serie: false, n_lot: true, dlc: true, variante: true, label: 'DLC + Numéro de lot + Variante' }
        ];
    }

    /**
     * Valide et fusionne les options de deux comptages "par article"
     * en respectant les combinaisons autorisées
     */
    mergeParArticleOptions(first: ComptageConfig, second: ComptageConfig): Partial<ComptageConfig> {
        const mergedOptions = {
            isVariante: first.isVariante || second.isVariante,
            numeroSerie: first.numeroSerie || second.numeroSerie,
            numeroLot: first.numeroLot || second.numeroLot,
            dlc: first.dlc || second.dlc,
            guideArticle: first.guideArticle || second.guideArticle,
            guideQuantite: first.guideQuantite || second.guideQuantite
        };

        // Créer un objet temporaire pour la validation
        const tempConfig: ComptageConfig = {
            mode: 'par article',
            ...mergedOptions,
            // Propriétés requises par l'interface
            saisieQuantite: false,
            scannerUnitaire: false
        };

        // Valider la combinaison fusionnée
        this.validateParArticleCombination(tempConfig);

        return mergedOptions;
    }

    getInheritedOptionsForComptage3(
        state: InventoryCreationState
    ): Partial<ComptageConfig> {
        const firstComptage = state.comptages[0];
        const secondComptage = state.comptages[1];

        if (firstComptage.mode === 'image de stock') {
            // Hérite des options du Comptage 2
            return { ...secondComptage };
        }

        // Logic for "en vrac" mode with specific scenarios
        if (firstComptage.mode === 'en vrac' && secondComptage.mode === 'en vrac') {
            const result: Partial<ComptageConfig> = {};

            // Cas 1: Les deux ont saisie quantité
            if (firstComptage.inputMethod === 'saisie' && secondComptage.inputMethod === 'saisie') {
                result.inputMethod = 'saisie';
                result.saisieQuantite = true;
                result.scannerUnitaire = false;
            }
            // Cas 2: Les deux ont scanner unitaire
            else if (firstComptage.inputMethod === 'scanner' && secondComptage.inputMethod === 'scanner') {
                result.inputMethod = 'scanner';
                result.saisieQuantite = false;
                result.scannerUnitaire = true;
            }
            // Cas 3: Un a saisie, l'autre a scanner - permettre les deux options dans le radio group
            else if (
                (firstComptage.inputMethod === 'saisie' && secondComptage.inputMethod === 'scanner') ||
                (firstComptage.inputMethod === 'scanner' && secondComptage.inputMethod === 'saisie')
            ) {
                // Dans ce cas, on laisse le choix libre - valeur par défaut scanner
                result.inputMethod = 'scanner';
                result.saisieQuantite = false;
                result.scannerUnitaire = true;
            }

            // Guide quantité si présent dans l'un des deux
            result.guideQuantite = firstComptage.guideQuantite || secondComptage.guideQuantite;

            return result;
        }

        // Si même mode "par article" dans les deux comptages
        if (firstComptage.mode === 'par article' && secondComptage.mode === 'par article') {
            // Utiliser la nouvelle méthode de fusion avec validation
            return this.mergeParArticleOptions(firstComptage, secondComptage);
        }

        return {};
    }

    // Helper method to check specific scenarios for Comptage 3
    getComptage3Constraints(state: InventoryCreationState): {
        restrictedToSaisie: boolean;
        restrictedToScanner: boolean;
        allowBoth: boolean;
    } {
        const firstComptage = state.comptages[0];
        const secondComptage = state.comptages[1];

        // Vérifier que les comptages existent et ont des valeurs valides
        if (!firstComptage || !secondComptage || !firstComptage.mode || !secondComptage.mode) {
            return { restrictedToSaisie: false, restrictedToScanner: false, allowBoth: false };
        }

        if (firstComptage.mode === 'en vrac' && secondComptage.mode === 'en vrac') {
            // Cas 1: Les deux ont saisie quantité → Comptage 3 = saisie uniquement
            if (firstComptage.inputMethod === 'saisie' && secondComptage.inputMethod === 'saisie') {
                return { restrictedToSaisie: true, restrictedToScanner: false, allowBoth: false };
            }

            // Cas 2: Les deux ont scanner unitaire → Comptage 3 = scanner uniquement
            if (firstComptage.inputMethod === 'scanner' && secondComptage.inputMethod === 'scanner') {
                return { restrictedToSaisie: false, restrictedToScanner: true, allowBoth: false };
            }

            // Cas 3: Un a saisie, l'autre a scanner → Comptage 3 = les deux options
            if (
                (firstComptage.inputMethod === 'saisie' && secondComptage.inputMethod === 'scanner') ||
                (firstComptage.inputMethod === 'scanner' && secondComptage.inputMethod === 'saisie')
            ) {
                return { restrictedToSaisie: false, restrictedToScanner: false, allowBoth: true };
            }
        }

        return { restrictedToSaisie: false, restrictedToScanner: false, allowBoth: false };
    }

    checkImageDeStockConsistency(state: InventoryCreationState): boolean {
        const first = { ...state.comptages[0] };
        if (first.mode === 'image de stock') {
            delete (first as any).order;
            for (let i = 1; i < state.comptages.length; i++) {
                const c = { ...state.comptages[i] };
                delete (c as any).order;
                if (JSON.stringify(first) !== JSON.stringify(c)) {
                    return false;
                }
            }
        }
        return true;
    }
}

export const inventoryWizardLogic = new InventoryWizardLogic();
