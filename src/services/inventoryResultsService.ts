import type { InventoryOption, StoreOption, InventoryResult } from '../interfaces/inventoryResults';

const mockInventories: InventoryOption[] = [
  { label: 'Inventaire 1', value: 'inventory_1' },
  { label: 'Inventaire 2', value: 'inventory_2' },
];

const mockStores: StoreOption[] = [
  { label: 'Magasin A', value: 'store_A' },
  { label: 'Magasin B', value: 'store_B' },
];

const mockResults: InventoryResult[] = [
  {
    id: 1,
    article: 'Article A',
    emplacement: 'Emplacement 1',
    premier_contage: 100,
    deuxieme_contage: 105,
    ecart: 5,
    troisieme_contage: 110,
    resultats: '110',
    inventory: 'inventory_1',
    store: 'store_A'
  },
  {
    id: 2,
    article: 'Article B',
    emplacement: 'Emplacement 2',
    premier_contage: 200,
    deuxieme_contage: 198,
    ecart: -2,
    troisieme_contage: 200,
    resultats: '200',
    inventory: 'inventory_2',
    store: 'store_B'
  },
  {
    id: 3,
    article: 'Article C',
    emplacement: 'Emplacement 3',
    premier_contage: 50,
    deuxieme_contage: 52,
    ecart: 2,
    troisieme_contage: 50,
    resultats: '50',
    inventory: 'inventory_1',
    store: 'store_B'
  },
];

export const inventoryResultsService = {
  async getInventoryOptions(): Promise<InventoryOption[]> {
    // API call would go here
    return mockInventories;
  },

  async getStoreOptions(): Promise<StoreOption[]> {
    // API call would go here
    return mockStores;
  },

  async getResults(): Promise<InventoryResult[]> {
    // API call would go here
    return mockResults;
  },

  async editResult(id: number): Promise<void> {
    // API call would go here
    console.log('Edit result:', id);
  },

  async launchResult(id: number): Promise<void> {
    // API call would go here
    console.log('Launch result:', id);
  },

  async validateResult(id: number): Promise<void> {
    // API call would go here
    console.log('Validate result:', id);
  }
};


