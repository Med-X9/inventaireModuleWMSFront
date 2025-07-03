import type { Count } from '@/models/Count';
import { CountingValidationError } from './CountingByArticle';

function ruleOrderRequired(data: Count): string | null {
    if (!data.order) return "- L'ordre du comptage est obligatoire.";
    return null;
}

function ruleUnitScannedEntryQuantity(data: Count): string | null {
    if (data.unit_scanned && data.entry_quantity) {
        return "- Pour le mode 'en vrac', unit_scanned et entry_quantity ne peuvent pas être true simultanément.";
    }
    return null;
}

function ruleUnitScannedBlock(data: Count): string | null {
    if (!data.unit_scanned && !data.entry_quantity) {
        return "- Pour le mode 'en vrac', au moins un des champs unit_scanned ou entry_quantity doit être true.";
    }
    return null;
}

function ruleEntryQuantityBlock(data: Count): string | null {
    if (data.stock_situation) {
        return "- Pour le mode 'en vrac', stock_situation doit être false.";
    }
    return null;
}

const BULK_RULES: ((data: Count) => string | null)[] = [
    ruleOrderRequired,
    ruleUnitScannedEntryQuantity,
    ruleUnitScannedBlock,
    ruleEntryQuantityBlock,
];

export class CountingByInBulk {
    /**
     * Valide les données du comptage sans créer l'objet.
     * @throws CountingValidationError si les données sont invalides
     */
    validateCount(data: Count): void {
        const errors = BULK_RULES.map(rule => rule(data)).filter(Boolean);
        if (errors.length) {
            throw new CountingValidationError(errors.join('\n'));
        }
    }
}
