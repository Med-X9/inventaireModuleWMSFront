export type ComptageMode =
  | 'image de stock'
  | 'en vrague'
  | 'en vrague par article'
  | '';

export interface ComptageConfig {
  mode: ComptageMode;
  // Options pour "en vrague" - maintenant comme string pour radio group
  inputMethod?: 'saisie' | 'scanner' | ''; // Radio group pour saisie quantité vs scanner unitaire
  guideQuantite: boolean;
  // Options pour "en vrague par article"
  isVariante: boolean;
  guideArticle: boolean;
  dlc: boolean;
  guideArticleQuantite: boolean;
  numeroLot: boolean;
  // Legacy props (deprecated)
  saisieQuantite: boolean;
  scannerUnitaire: boolean;
  useScanner: boolean;
  useSaisie: boolean;
  stock: boolean;
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
  EN_VRAGUE: 'en vrague' as ComptageMode,
  EN_VRAGUE_PAR_ARTICLE: 'en vrague par article' as ComptageMode,
} as const;