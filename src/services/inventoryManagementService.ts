import type { InventoryManagement } from '@/interfaces/inventoryManagement';

// Simulated API response
const mockInventories: InventoryManagement[] = [
  {
    id: 1,
    reference: 'INV-001',
    inventory_date: '2025-04-18',
    statut: 'En attente',
    pending_status_date: '2025-04-18',
    current_status_date: '2025-04-19',
    date_status_launch: '2025-04-20',
    date_status_end: '2025-04-21',
    label: 'Inventaire Général Avril',
  },
  {
    id: 2,
    reference: 'INV-001',
    inventory_date: '2025-04-18',
    statut: 'En attente',
    pending_status_date: '2025-04-18',
    current_status_date: '2025-04-19',
    date_status_launch: '2025-04-20',
    date_status_end: '2025-04-21',
    label: 'Inventaire Général Avril',
  },
  {
    id: 3,
    reference: 'INV-001',
    inventory_date: '2025-04-18',
    statut: 'En attente',
    pending_status_date: '2025-04-18',
    current_status_date: '2025-04-19',
    date_status_launch: '2025-04-20',
    date_status_end: '2025-04-21',
    label: 'Inventaire Général Avril',
  },
  {
    id: 4,
    reference: 'INV-001',
    inventory_date: '2025-04-18',
    statut: 'En attente',
    pending_status_date: '2025-04-18',
    current_status_date: '2025-04-19',
    date_status_launch: '2025-04-20',
    date_status_end: '2025-04-21',
    label: 'Inventaire Général Avril',
  },
  {
    id: 5,
    reference: 'INV-001',
    inventory_date: '2025-04-18',
    statut: 'En attente',
    pending_status_date: '2025-04-18',
    current_status_date: '2025-04-19',
    date_status_launch: '2025-04-20',
    date_status_end: '2025-04-21',
    label: 'Inventaire Général Avril',
  },
  // ... autres données mockées
];

export const inventoryManagementService = {
  async getInventories(): Promise<InventoryManagement[]> {
    // API call would go here
    return mockInventories;
  },

  async deleteInventory(id: number): Promise<void> {
    // API call would go here
    console.log('Inventory deleted:', id);
  },

  
};