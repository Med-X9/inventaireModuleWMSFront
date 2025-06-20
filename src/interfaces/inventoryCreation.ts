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
}

export interface InventoryCreationStep1 {
  libelle: string;
  date: string;
  type: string;
  compte: string;
  magasin: Array<{ magasin: string; date: string }>; // Changed to support dates per magasin
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