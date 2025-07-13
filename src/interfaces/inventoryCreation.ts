export type ComptageMode =
    | 'image de stock'
    | 'en vrac'
    | 'par article'
    | '';

export interface ComptageConfig {
    mode: ComptageMode;
    // Options pour "en vrac" - maintenant comme string pour radio group
    inputMethod?: 'saisie' | 'scanner' | ''; // Radio group pour saisie quantité vs scanner unitaire
    guideQuantite: boolean;
    // Options pour "par article"
    isVariante: boolean;
    guideArticle: boolean;
    dlc: boolean;
    numeroSerie: boolean;
    numeroLot: boolean;
    // Legacy props (deprecated mais nécessaires pour la synchronisation)
    saisieQuantite: boolean;
    scannerUnitaire: boolean;
    // Props pour compatibilité avec l'ancien système
    useScanner?: boolean;
    useSaisie?: boolean;
    // Propriété pour le mode "image de stock"
    stock_situation?: boolean;
}

export interface InventoryCreationStep1 {
    libelle: string;
    date: string;
    inventory_type: string;
    compte: string; // ID du compte (string pour le moment, sera converti en number)
    magasin: Array<{ magasin: string; date: string }>; // magasin contient l'ID du magasin
}

export interface InventoryCreationState {
    step1Data: InventoryCreationStep1;
    comptages: ComptageConfig[];
    currentStep: number;
}

export const COMPTAGE_MODES = {
    IMAGE_STOCK: 'image de stock' as ComptageMode,
    EN_VRAC: 'en vrac' as ComptageMode,
    PAR_ARTICLE: 'par article' as ComptageMode,
} as const;
