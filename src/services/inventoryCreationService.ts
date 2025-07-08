import type { InventoryCreationState, ComptageMode, ComptageConfig } from '@/interfaces/inventoryCreation';

export class InventoryCreationService {
    getAvailableModesForStep(
        state: InventoryCreationState,
        stepIndex: number
    ): ComptageMode[] {
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

    getOptionsForMode(mode: ComptageMode): {
        hasEnVracOptions: boolean;
        hasParArticleOptions: boolean;
        hasNoOptions: boolean;
    } {
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
            return {
                isVariante: firstComptage.isVariante || secondComptage.isVariante,
                guideQuantite: firstComptage.guideQuantite || secondComptage.guideQuantite,
                guideArticle: firstComptage.guideArticle || secondComptage.guideArticle,
                dlc: firstComptage.dlc || secondComptage.dlc,
                numeroSerie: firstComptage.numeroSerie || secondComptage.numeroSerie,
                numeroLot: firstComptage.numeroLot || secondComptage.numeroLot,
                // Reset options "en vrac"
                inputMethod: '',
                saisieQuantite: false,
                scannerUnitaire: false,
            };
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
}

export const inventoryCreationService = new InventoryCreationService();