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
  quantite?: boolean;
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

export const CONTAGE_MODES = {
  ETAT_STOCK: 'etat de stock' as ContageMode,
  LISTE_EMPLACEMENT: 'liste emplacement' as ContageMode,
  ARTICLE_EMPLACEMENT: 'article + emplacement' as ContageMode,
  HYBRIDE: 'hybride' as ContageMode,
} as const;