import type { Count } from '@/models/Count';

export class CountingValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CountingValidationError';
    }
}

function ruleOrderRequired(data: Count): string | null {
    if (!data.order) return "- L'ordre du comptage est obligatoire.";
    return null;
}

function ruleUnitScannedFalse(data: Count): string | null {
    if (data.unit_scanned) return "- Pour le mode 'par article', unit_scanned doit être false.";
    return null;
}

function ruleEntryQuantityFalse(data: Count): string | null {
    if (data.entry_quantity) return "- Pour le mode 'par article', entry_quantity doit être false.";
    return null;
}

function ruleStockSituationFalse(data: Count): string | null {
    if (data.stock_situation) return "- Pour le mode 'par article', stock_situation doit être false.";
    return null;
}

function ruleNSerieExclusif(data: Count): string | null {
    if (data.n_serie && data.n_lot) return "- Pour le mode 'par article', n_serie et n_lot ne peuvent pas être true simultanément.";
    return null;
}

const ARTICLE_RULES: ((data: Count) => string | null)[] = [
    ruleOrderRequired,
    ruleUnitScannedFalse,
    ruleEntryQuantityFalse,
    ruleStockSituationFalse,
    ruleNSerieExclusif,
];

export class CountingByArticle {
    /**
     * Valide les données du comptage sans créer l'objet.
     * @throws CountingValidationError si les données sont invalides
     */
    validateCount(data: Count): void {
        const errors = ARTICLE_RULES.map(rule => rule(data)).filter(Boolean);
        if (errors.length) {
            throw new CountingValidationError(errors.join('\n'));
        }
    }

}
