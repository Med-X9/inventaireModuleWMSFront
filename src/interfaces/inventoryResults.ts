export interface InventoryOption {
    label: string;
    value: string;
  }
  
  export interface StoreOption {
    label: string;
    value: string;
  }
  
  export interface InventoryResult {
    id: number;
    article: string;
    emplacement: string;
    premier_contage: number;
    deuxieme_contage: number;
    ecart: number;
    troisieme_contage: number;
    resultats: string;
    inventory: string;
    store: string;
  }
  
  export interface ResultAction {
    label: string;
    icon: any;
    class: string;
    handler: (row: InventoryResult) => void | Promise<void>;
  }