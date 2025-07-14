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
            // Comptage 3: Règles métier spécifiques
            const firstComptage = state.comptages[0];
            const secondComptage = state.comptages[1];

            // Vérifier que les comptages précédents existent et ont des modes définis
            if (!firstComptage?.mode || !secondComptage?.mode) {
                console.warn('Comptages précédents non définis pour le 3e comptage:', {
                    firstComptage: firstComptage?.mode,
                    secondComptage: secondComptage?.mode
                });
                return [];
            }

            console.log('Détermination des modes pour le 3e comptage:', {
                firstComptage: firstComptage.mode,
                secondComptage: secondComptage.mode
            });

            // Scénario 1: 1er comptage = "image de stock"
            if (firstComptage.mode === 'image de stock') {
                // 3e comptage doit être identique au 2e
                const result = [secondComptage.mode].filter(Boolean) as ComptageMode[];
                console.log('Scénario 1 - Image de stock, modes disponibles:', result);
                return result;
            }

            // Scénario 2: 1er et 2e = "en vrac"
            if (firstComptage.mode === 'en vrac' && secondComptage.mode === 'en vrac') {
                // 3e doit être "en vrac" (correction selon règles métier)
                const result = ['en vrac'] as ComptageMode[];
                console.log('Scénario 2 - Double en vrac, modes disponibles:', result);
                return result;
            }

            // Scénario 3: 1er = "en vrac" et 2e = "par article" OU 1er = "par article" et 2e = "en vrac"
            if (
                (firstComptage.mode === 'en vrac' && secondComptage.mode === 'par article') ||
                (firstComptage.mode === 'par article' && secondComptage.mode === 'en vrac')
            ) {
                // 3e doit être soit "en vrac" OU "par article"
                const result = ['en vrac', 'par article'] as ComptageMode[];
                console.log('Scénario 3 - Modes mixtes, modes disponibles:', result);
                return result;
            }

            // Scénario 4: 1er et 2e = "par article" (sous-scénario du scénario 3)
            if (firstComptage.mode === 'par article' && secondComptage.mode === 'par article') {
                // 3e doit être "par article"
                const result = ['par article'] as ComptageMode[];
                console.log('Scénario 4 - Double par article, modes disponibles:', result);
                return result;
            }

            // Cas par défaut: prendre l'ensemble des modes uniques
            const uniqueModes = new Set([firstComptage.mode, secondComptage.mode].filter(Boolean));
            const result = Array.from(uniqueModes) as ComptageMode[];
            console.log('Cas par défaut, modes disponibles:', result);
            return result;
        }

        return [];
    }

    getOptionsForMode(mode: ComptageMode): {
        hasEnVracOptions: boolean;
        hasParArticleOptions: boolean;
        hasNoOptions: boolean;
    } {
        const result = (() => {
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
        })();

        return result;
    }

    getInheritedOptionsForComptage3(
        state: InventoryCreationState
    ): Partial<ComptageConfig> {
        const firstComptage = state.comptages[0];
        const secondComptage = state.comptages[1];

        // Scénario 1: 1er comptage = "image de stock"
        if (firstComptage.mode === 'image de stock') {
            // 3e comptage hérite complètement du 2e comptage
            const result = { ...secondComptage };
            return result;
        }

        // Scénario 2: 1er et 2e = "en vrac"
        if (firstComptage.mode === 'en vrac' && secondComptage.mode === 'en vrac') {
            const result: Partial<ComptageConfig> = {};

            // Hériter de la méthode opératoire si identique, sinon permettre les deux
            if (firstComptage.inputMethod === secondComptage.inputMethod) {
                result.inputMethod = firstComptage.inputMethod;
                result.saisieQuantite = firstComptage.inputMethod === 'saisie';
                result.scannerUnitaire = firstComptage.inputMethod === 'scanner';
            } else {
                // Si méthodes différentes, permettre les deux options (radio buttons visibles)
                result.inputMethod = ''; // Laisser l'utilisateur choisir
                result.saisieQuantite = false; // Pas d'héritage automatique
                result.scannerUnitaire = false; // Pas d'héritage automatique
            }

            // Hériter du guide quantité si présent dans l'un des deux
            if (firstComptage.guideQuantite || secondComptage.guideQuantite) {
                result.guideQuantite = true;
            }

            return result;
        }

        // Scénario 3: 1er = "en vrac" et 2e = "par article" OU 1er = "par article" et 2e = "en vrac"
        if (
            (firstComptage.mode === 'en vrac' && secondComptage.mode === 'par article') ||
            (firstComptage.mode === 'par article' && secondComptage.mode === 'en vrac')
        ) {
            // Pas d'héritage automatique, l'utilisateur choisit le mode
            return {};
        }

        // Scénario 4: 1er et 2e = "par article" (sous-scénario du scénario 3)
        if (firstComptage.mode === 'par article' && secondComptage.mode === 'par article') {
            const result: Partial<ComptageConfig> = {
                // Reset options "en vrac"
                inputMethod: '',
                saisieQuantite: false,
                scannerUnitaire: false,
            };

            // Hériter des options uniquement si elles sont identiques entre les deux comptages
            if (firstComptage.isVariante === secondComptage.isVariante) {
                result.isVariante = firstComptage.isVariante;
            }

            if (firstComptage.guideQuantite === secondComptage.guideQuantite) {
                result.guideQuantite = firstComptage.guideQuantite;
            }

            if (firstComptage.guideArticle === secondComptage.guideArticle) {
                result.guideArticle = firstComptage.guideArticle;
            }

            if (firstComptage.dlc === secondComptage.dlc) {
                result.dlc = firstComptage.dlc;
            }

            if (firstComptage.numeroSerie === secondComptage.numeroSerie) {
                result.numeroSerie = firstComptage.numeroSerie;
            }

            if (firstComptage.numeroLot === secondComptage.numeroLot) {
                result.numeroLot = firstComptage.numeroLot;
            }

            // Appliquer les règles d'exclusion pour "par article" si des options sont héritées
            if (result.numeroSerie) {
                // Si n_serie est hérité, désactiver n_lot et dlc
                result.numeroLot = false;
                result.dlc = false;
            } else if (result.numeroLot || result.dlc) {
                // Si n_lot ou dlc est hérité, désactiver UNIQUEMENT n_serie
                // (n_lot et dlc peuvent être combinés avec variante)
                result.numeroSerie = false;
            }

            return result;
        }

        return {};
    }

    // Helper method to check specific scenarios for Comptage 3
    getComptage3Constraints(state: InventoryCreationState): {restrictedToSaisie: boolean;restrictedToScanner: boolean;allowBoth: boolean;}
    {
        const firstComptage = state.comptages[0];
        const secondComptage = state.comptages[1];

        // Vérifier que les comptages existent et ont des valeurs valides
        if (!firstComptage || !secondComptage || !firstComptage.mode || !secondComptage.mode) {
            return { restrictedToSaisie: false, restrictedToScanner: false, allowBoth: true };
        }

        // Scénario 1: 1er comptage = "image de stock"
        if (firstComptage.mode === 'image de stock') {
            // 3e comptage doit être identique au 2e, mais radio buttons toujours visibles
            if (secondComptage.mode === 'en vrac') {
                const result = {
                    restrictedToSaisie: secondComptage.inputMethod === 'saisie',
                    restrictedToScanner: secondComptage.inputMethod === 'scanner',
                    allowBoth: true  // Toujours permettre les deux pour visibilité
                };
                return result;
            }
        }

        // Scénario 2: 1er et 2e = "en vrac"
        if (firstComptage.mode === 'en vrac' && secondComptage.mode === 'en vrac') {
            // Si les deux ont la même méthode opératoire, pré-sélectionner cette méthode
            if (firstComptage.inputMethod === secondComptage.inputMethod) {
                const result = {
                    restrictedToSaisie: firstComptage.inputMethod === 'saisie',
                    restrictedToScanner: firstComptage.inputMethod === 'scanner',
                    allowBoth: true  // Toujours permettre les deux pour visibilité
                };
                return result;
            } else {
                // Si méthodes différentes, permettre les deux
                const result = {
                    restrictedToSaisie: false,
                    restrictedToScanner: false,
                    allowBoth: true  // Toujours permettre les deux pour visibilité
                };
                return result;
            }
        }

        // Scénario 3: 1er = "en vrac" et 2e = "par article" OU 1er = "par article" et 2e = "en vrac"
        if (
            (firstComptage.mode === 'en vrac' && secondComptage.mode === 'par article') ||
            (firstComptage.mode === 'par article' && secondComptage.mode === 'en vrac')
        ) {
            // Pas de contraintes sur les options, l'utilisateur choisit le mode
            const result = {
                restrictedToSaisie: false,
                restrictedToScanner: false,
                allowBoth: true  // Toujours permettre les deux pour visibilité
            };
            return result;
        }

        // Scénario 4: 1er et 2e = "par article" (sous-scénario du scénario 3)
        if (firstComptage.mode === 'par article' && secondComptage.mode === 'par article') {
            // Pas de contraintes sur les options "en vrac" car mode "par article"
            const result = {
                restrictedToSaisie: false,
                restrictedToScanner: false,
                allowBoth: true  // Toujours permettre les deux pour visibilité
            };
            return result;
        }

        return { restrictedToSaisie: false, restrictedToScanner: false, allowBoth: true };
    }
}

export const inventoryCreationService = new InventoryCreationService();
