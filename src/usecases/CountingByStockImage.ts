import type { Count } from '@/models/Count';
import { CountingValidationError } from './CountingByArticle';

function ruleOrderRequired(data: Count): string | null {
    if (!data.order) return "L'ordre du comptage est obligatoire.";
    return null;
}

function ruleStockSituationTrue(data: Count): string | null {
    if (!data.stock_situation) return "Pour le mode 'image de stock', le champ stock_situation doit être true.";
    return null;
}

function ruleUnitScannedFalse(data: Count): string | null {
    if (data.unit_scanned) return "Pour le mode 'image de stock', le champ unit_scanned doit être false.";
    return null;
}

function ruleEntryQuantityFalse(data: Count): string | null {
    if (data.entry_quantity) return "Pour le mode 'image de stock', le champ entry_quantity doit être false.";
    return null;
}

function ruleIsVariantFalse(data: Count): string | null {
    if (data.is_variant) return "Pour le mode 'image de stock', le champ is_variant doit être false.";
    return null;
}

function ruleNlotFalse(data: Count): string | null {
    if (data.n_lot) return "Pour le mode 'image de stock', le champ n_lot doit être false.";
    return null;
}

function ruleNserieFalse(data: Count): string | null {
    if (data.n_serie) return "Pour le mode 'image de stock', le champ n_serie doit être false.";
    return null;
}

function ruleDlcFalse(data: Count): string | null {
    if (data.dlc) return "Pour le mode 'image de stock', le champ dlc doit être false.";
    return null;
}

function ruleShowProductFalse(data: Count): string | null {
    if (data.show_product) return "Pour le mode 'image de stock', le champ show_product doit être false.";
    return null;
}

function ruleQuantityShowFalse(data: Count): string | null {
    if (data.quantity_show) return "Pour le mode 'image de stock', le champ quantity_show doit être false.";
    return null;
}

const STOCK_IMAGE_RULES: ((data: Count) => string | null)[] = [
    ruleOrderRequired,
    ruleStockSituationTrue,
    ruleUnitScannedFalse,
    ruleEntryQuantityFalse,
    ruleIsVariantFalse,
    ruleNlotFalse,
    ruleNserieFalse,
    ruleDlcFalse,
    ruleShowProductFalse,
    ruleQuantityShowFalse,
];

export class CountingByStockImage {
    /**
     * Valide les données du comptage pour le mode 'image de stock'.
     * @throws CountingValidationError si les données sont invalides
     */
    validateCount(data: Count): void {
        const errors = STOCK_IMAGE_RULES.map(rule => rule(data)).filter(Boolean);
        if (errors.length) {
            throw new CountingValidationError(errors.join(' | '));
        }
    }
}
