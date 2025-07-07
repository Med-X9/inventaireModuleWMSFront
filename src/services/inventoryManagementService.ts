import type { InventoryManagement } from '@/interfaces/inventoryManagement';
// at bottom of file, after mockInventories, before your export:
export function findInventoryByReference(ref: string) {
  return mockInventories.find(inv => inv.reference === ref);
}

// Inventaire statique avec l'ID 1 forcé
const staticInventory: InventoryManagement = {
  id: 1,
  reference: 'INV-2025-001',
  label: 'Inventaire général 2025',
  type: 'Inventaire Général',
  statut: 'En préparation',
  inventory_date: '2025-12-20',
  date_creation: '2025-06-24',
  date_lancement: '',
  date_echeance: '',
  date_cloture: '',
};

// Types et statuts disponibles pour les autres inventaires
const types = ['Inventaire Partiel', 'Contrôle Qualité'];
// Statuts possibles
const statuts = ['En préparation', 'En réalisation', 'Terminé', 'Clôturé'];

// Génère une date au format YYYY-MM-DD entre deux dates données
function randomDate(start: string, end: string): string {
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  const date = new Date(startTime + Math.random() * (endTime - startTime));
  return date.toISOString().split('T')[0];
}

// Génère des inventaires mock (ID 2 à 100) pour démonstration
function generateMockInventories(count = 99): InventoryManagement[] {
  return Array.from({ length: count }, (_, i) => {
    const id = i + 2;
    const reference = `INV-${new Date().getFullYear()}-${String(id).padStart(3, '0')}`;
    const label = `Inventaire ${id}`;
    const type = types[Math.floor(Math.random() * types.length)];
    const statut = statuts[Math.floor(Math.random() * statuts.length)];
    const date_creation = randomDate('2025-01-01', '2025-06-24');
    const date_lancement = randomDate(date_creation, '2025-12-31');
    const inventory_date = randomDate(date_lancement, '2026-06-30');
    const date_echeance = randomDate(date_lancement, inventory_date);
    const date_cloture = ['Clôturé', 'Terminé'].includes(statut)
      ? randomDate(date_echeance, '2026-12-31')
      : '';

    return {
      id,
      reference,
      label,
      type,
      statut,
      inventory_date,
      date_creation,
      date_lancement,
      date_echeance,
      date_cloture,
    };
  });
}

// Mock complet: premier inventaire fixe + 99 inventaires générés
const mockInventories: InventoryManagement[] = [staticInventory, ...generateMockInventories()];

export const inventoryManagementService = {
  async getInventories(): Promise<InventoryManagement[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...mockInventories];
  },

  async deleteInventory(id: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockInventories.findIndex(inv => inv.id === id);
    if (index > -1) {
      mockInventories.splice(index, 1);
    }
  },

  async createInventory(inventory: Omit<InventoryManagement, 'id'>): Promise<InventoryManagement> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newInventory: InventoryManagement = {
      ...inventory,
      id: Math.max(...mockInventories.map(i => i.id), 0) + 1
    };
    mockInventories.push(newInventory);
    return newInventory;
  },

  async updateInventory(id: number, inventory: Partial<InventoryManagement>): Promise<InventoryManagement> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockInventories.findIndex(inv => inv.id === id);
    if (index > -1) {
      mockInventories[index] = { ...mockInventories[index], ...inventory };
      return mockInventories[index];
    }
    throw new Error('Inventory not found');
  }
  
};