export type ContageMode =
  | 'etat de stock'
  | 'liste emplacement'
  | 'article + emplacement'
  | 'hybride'
  | '';

export interface ContageConfig {
  mode: ContageMode;
  isVariant: boolean;
  useScanner: boolean;
  useSaisie: boolean;
   inputMethod?: 'scanner' | 'manual';
}

export interface InventoryCreationStep1 {
  libelle: string;
  date: string;
  type: string;
}

export interface InventoryCreationStep2 {
  compte: string;
  magasin: string[];
}

export interface InventoryCreationState {
  step1Data: InventoryCreationStep1;
  step2Data: InventoryCreationStep2;
  contages: ContageConfig[];
  currentStep: number;
}

// Constants for available modes
export const CONTAGE_MODES = {
  ETAT_STOCK: 'etat de stock' as ContageMode,
  LISTE_EMPLACEMENT: 'liste emplacement' as ContageMode,
  ARTICLE_EMPLACEMENT: 'article + emplacement' as ContageMode,
  HYBRIDE: 'hybride' as ContageMode,
} as const;

// Helper type for mode options
export type ContageOptions = {
  hasVariant: boolean;
  hasScanner: boolean;
  hasSaisie: boolean;
};

// Mode configuration map
export const MODE_OPTIONS: Record<ContageMode, ContageOptions> = {
  'etat de stock': {
    hasVariant: false,
    hasScanner: false,
    hasSaisie: false,
  },
  'liste emplacement': {
    hasVariant: false,
    hasScanner: true,
    hasSaisie: true,
  },
  'article + emplacement': {
    hasVariant: true,
    hasScanner: false,
    hasSaisie: false,
  },
  'hybride': {
    hasVariant: true,
    hasScanner: false,
    hasSaisie: false,
  },
  '': {
    hasVariant: false,
    hasScanner: false,
    hasSaisie: false,
  },
};