import type { InventoryManagement } from '@/interfaces/inventoryManagement';

function getRandomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0]; // Format YYYY-MM-DD
}

function getRandomStatus(): string {
  const statuses = ['Planifié', 'En cours', 'Terminé'];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

function getRandomLabel(monthIndex: number): string {
  const mois = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];
  return `Inventaire mensuel ${mois[monthIndex % 12]}`;
}

const mockInventories: InventoryManagement[] = Array.from({ length: 100 }, (_, i) => {
  const monthOffset = i % 12;
  const year = 2024 + Math.floor(i / 12);
  const reference = `INV-${year}-${(i + 1).toString().padStart(3, '0')}`;
  const inventory_date = getRandomDate(new Date(`${year}-01-01`), new Date(`${year}-12-31`));
  const statut = getRandomStatus();
  const date_status_launch = getRandomDate(new Date(`${year}-01-01`), new Date(inventory_date));
  const date_status_end = getRandomDate(new Date(inventory_date), new Date(`${year}-12-31`));
  const label = getRandomLabel(monthOffset);

  return {
    id: i + 1,
    reference,
    inventory_date,
    statut,
    date_status_launch,
    date_status_end,
    label
  };
});

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
    const newInventory = {
      ...inventory,
      id: Math.max(...mockInventories.map(i => i.id)) + 1
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
