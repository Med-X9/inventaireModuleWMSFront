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