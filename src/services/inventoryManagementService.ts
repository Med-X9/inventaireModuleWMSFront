import type { InventoryManagement } from '@/interfaces/inventoryManagement';

// Mock data for demonstration
const mockInventories: InventoryManagement[] = [
  {
    id: 1,
    reference: 'INV-2024-001',
    inventory_date: '2024-01-15',
    statut: 'En cours',
    date_status_launch: '2024-01-10',
    date_status_end: '2024-01-20',
    label: 'Inventaire mensuel janvier'
  },
  {
    id: 2,
    reference: 'INV-2024-002',
    inventory_date: '2024-02-15',
    statut: 'Planifié',
    date_status_launch: '2024-02-10',
    date_status_end: '2024-02-20',
    label: 'Inventaire mensuel février'
  },
  {
    id: 3,
    reference: 'INV-2024-003',
    inventory_date: '2024-03-15',
    statut: 'Terminé',
    date_status_launch: '2024-03-10',
    date_status_end: '2024-03-20',
    label: 'Inventaire mensuel mars'
  }
];

export const inventoryManagementService = {
  async getInventories(): Promise<InventoryManagement[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...mockInventories];
  },

  async deleteInventory(id: number): Promise<void> {
    // Simulate API call delay
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