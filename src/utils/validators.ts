/**
 * Utilitaires de validation pour l'application
 */
import type { InventoryHeader, Comptage, ComptageMode } from '@/interfaces/inventoryCreation';

export class Validators {
    /**
     * Valide l'en-tête de l'inventaire
     */
    static validateHeader(header: InventoryHeader): string[] {
        const errors: string[] = [];

        if (!header.libelle || header.libelle.trim() === '') {
            errors.push('Le libellé est obligatoire');
        }

        if (!header.date) {
            errors.push('La date est obligatoire');
        }

        if (!header.inventory_type) {
            errors.push('Le type d\'inventaire est obligatoire');
        }

        if (!header.compte) {
            errors.push('Le compte est obligatoire');
        }

        if (!header.magasin || header.magasin.length === 0) {
            errors.push('Au moins un magasin doit être sélectionné');
        } else {
            // Validation de la date pour chaque magasin
            header.magasin.forEach((warehouse, index) => {
                if (!warehouse.date || warehouse.date.trim() === '') {
                    errors.push(`La date du magasin ${index + 1} est obligatoire`);
                }
            });
        }

        return errors;
    }

    /**
     * Valide un comptage
     */
    static validateComptage(comptage: Comptage, index: number): string[] {
        const errors: string[] = [];

        if (!comptage.mode) {
            errors.push(`Le mode de comptage ${index + 1} est obligatoire`);
            return errors;
        }

        // Validation spécifique selon le mode
        if (comptage.mode === 'en vrac') {
            if (!comptage.inputMethod) {
                errors.push(`La méthode de saisie est obligatoire pour le mode "en vrac" (comptage ${index + 1})`);
            }
        } else if (comptage.mode === 'par article') {
            // Pour par article, les options sont optionnelles
            // Validation des combinaisons interdites seulement si des options sont sélectionnées
            if (comptage.numeroSerie && (comptage.numeroLot || comptage.dlc)) {
                errors.push(`Le "Numéro de série" ne peut être combiné qu'avec "Variante" (comptage ${index + 1})`);
            }
        }

        return errors;
    }

    /**
     * Extrait les options d'un comptage
     */
    static getComptageOptions(comptage: Comptage): string[] {
        const options: string[] = [];

        if (comptage.mode === 'en vrac') {
            if (comptage.saisieQuantite) options.push('saisieQuantite');
            if (comptage.scannerUnitaire) options.push('scannerUnitaire');
            if (comptage.guideQuantite) options.push('guideQuantite');
            // guideArticle n'est pas disponible pour le mode "en vrac"
        } else if (comptage.mode === 'par article') {
            if (comptage.numeroSerie) options.push('numeroSerie');
            if (comptage.numeroLot) options.push('numeroLot');
            if (comptage.dlc) options.push('dlc');
            if (comptage.isVariante) options.push('isVariante');
            if (comptage.guideQuantite) options.push('guideQuantite');
            if (comptage.guideArticle) options.push('guideArticle');
        }

        return options.sort();
    }

    /**
     * Compare si deux listes d'options sont identiques
     */
    static areOptionsIdentical(options1: string[], options2: string[]): boolean {
        if (options1.length !== options2.length) return false;
        return options1.every((option, index) => option === options2[index]);
    }

    /**
     * Valide les options du 3e comptage selon les nouvelles règles
     */
    static validateThirdComptage(comptages: Comptage[]): string[] {
        const errors: string[] = [];

        if (comptages.length < 3) {
            return errors; // Pas assez de comptages pour valider
        }

        const firstOptions = this.getComptageOptions(comptages[0]);
        const secondOptions = this.getComptageOptions(comptages[1]);
        const thirdOptions = this.getComptageOptions(comptages[2]);

        // Vérifier que les options du 3e correspondent à celles du 1er OU du 2e
        if (!this.areOptionsIdentical(thirdOptions, firstOptions) &&
            !this.areOptionsIdentical(thirdOptions, secondOptions)) {
            errors.push('Les options du 3e comptage doivent être identiques à celles du 1er OU du 2e comptage');
        }

        return errors;
    }

    /**
     * Valide si deux comptages sont identiques
     */
    static areComptagesIdentical(comptage1: Comptage, comptage2: Comptage): boolean {
        // Vérifier que les modes sont identiques
        if (comptage1.mode !== comptage2.mode) {
            return false;
        }

        // Si les modes sont identiques, vérifier les options selon le mode
        if (comptage1.mode === 'en vrac') {
            return (
                comptage1.inputMethod === comptage2.inputMethod &&
                comptage1.saisieQuantite === comptage2.saisieQuantite &&
                comptage1.scannerUnitaire === comptage2.scannerUnitaire &&
                comptage1.guideQuantite === comptage2.guideQuantite
                // guideArticle n'est pas comparé pour le mode "en vrac"
            );
        } else if (comptage1.mode === 'par article') {
            return (
                comptage1.numeroSerie === comptage2.numeroSerie &&
                comptage1.numeroLot === comptage2.numeroLot &&
                comptage1.dlc === comptage2.dlc &&
                comptage1.guideQuantite === comptage2.guideQuantite &&
                comptage1.guideArticle === comptage2.guideArticle &&
                comptage1.isVariante === comptage2.isVariante
            );
        }

        // Pour image de stock, toujours identiques car pas d'options
        return true;
    }

    /**
     * Valide les règles métier pour les comptages
     */
    static validateBusinessRules(comptages: Comptage[]): string[] {
        const errors: string[] = [];

        // Vérifier qu'il y a exactement 3 comptages
        if (comptages.length !== 3) {
            errors.push('Un inventaire doit contenir exactement 3 comptages');
            return errors;
        }

        // Validation spécifique du 3e comptage selon les nouvelles règles
        const thirdComptageErrors = this.validateThirdComptage(comptages);
        errors.push(...thirdComptageErrors);

        return errors;
    }
}
