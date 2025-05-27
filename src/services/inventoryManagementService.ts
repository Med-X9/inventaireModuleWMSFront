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
    reference: 'INV-002',
    inventory_date: '2025-05-20',
    statut: 'En cours',
    pending_status_date: '2025-05-20',
    current_status_date: '2025-05-21',
    date_status_launch: '2025-05-22',
    date_status_end: '2025-05-23',
    label: 'Inventaire Général Mai',
  },
  {
    id: 3,
    reference: 'INV-003',
    inventory_date: '2025-06-15',
    statut: 'Terminé',
    pending_status_date: '2025-06-15',
    current_status_date: '2025-06-16',
    date_status_launch: '2025-06-17',
    date_status_end: '2025-06-18',
    label: 'Inventaire Général Juin',
  },
  {
    id: 4,
    reference: 'INV-004',
    inventory_date: '2025-07-10',
    statut: 'Planifié',
    pending_status_date: '2025-07-10',
    current_status_date: '2025-07-11',
    date_status_launch: '2025-07-12',
    date_status_end: '2025-07-13',
    label: 'Inventaire Général Juillet',
  },
  {
    id: 4,
    reference: 'INV-004',
    inventory_date: '2025-07-10',
    statut: 'Planifié',
    pending_status_date: '2025-07-10',
    current_status_date: '2025-07-11',
    date_status_launch: '2025-07-12',
    date_status_end: '2025-07-13',
    label: 'Inventaire Général Juillet',
  },
 
    {
    id: 4,
    reference: 'INV-004',
    inventory_date: '2025-07-10',
    statut: 'Planifié',
    pending_status_date: '2025-07-10',
    current_status_date: '2025-07-11',
    date_status_launch: '2025-07-12',
    date_status_end: '2025-07-13',
    label: 'Inventaire Général Juillet',
  },
    {
    id: 4,
    reference: 'INV-004',
    inventory_date: '2025-07-10',
    statut: 'Planifié',
    pending_status_date: '2025-07-10',
    current_status_date: '2025-07-11',
    date_status_launch: '2025-07-12',
    date_status_end: '2025-07-13',
    label: 'Inventaire Général Juillet',
  },
    {
    id: 4,
    reference: 'INV-004',
    inventory_date: '2025-07-10',
    statut: 'Planifié',
    pending_status_date: '2025-07-10',
    current_status_date: '2025-07-11',
    date_status_launch: '2025-07-12',
    date_status_end: '2025-07-13',
    label: 'Inventaire Général Juillet',
  },
    {
    id: 4,
    reference: 'INV-004',
    inventory_date: '2025-07-10',
    statut: 'Planifié',
    pending_status_date: '2025-07-10',
    current_status_date: '2025-07-11',
    date_status_launch: '2025-07-12',
    date_status_end: '2025-07-13',
    label: 'Inventaire Général Juillet',
  },
    {
    id: 4,
    reference: 'INV-004',
    inventory_date: '2025-07-10',
    statut: 'Planifié',
    pending_status_date: '2025-07-10',
    current_status_date: '2025-07-11',
    date_status_launch: '2025-07-12',
    date_status_end: '2025-07-13',
    label: 'Inventaire Général Juillet',
  },
    {
    id: 4,
    reference: 'INV-004',
    inventory_date: '2025-07-10',
    statut: 'Planifié',
    pending_status_date: '2025-07-10',
    current_status_date: '2025-07-11',
    date_status_launch: '2025-07-12',
    date_status_end: '2025-07-13',
    label: 'Inventaire Général Juillet',
  },
    {
    id: 4,
    reference: 'INV-004',
    inventory_date: '2025-07-10',
    statut: 'Planifié',
    pending_status_date: '2025-07-10',
    current_status_date: '2025-07-11',
    date_status_launch: '2025-07-12',
    date_status_end: '2025-07-13',
    label: 'Inventaire Général Juillet',
  },
    {
    id: 4,
    reference: 'INV-004',
    inventory_date: '2025-07-10',
    statut: 'Planifié',
    pending_status_date: '2025-07-10',
    current_status_date: '2025-07-11',
    date_status_launch: '2025-07-12',
    date_status_end: '2025-07-13',
    label: 'Inventaire Général Juillet',
  },
    {
    id: 4,
    reference: 'INV-004',
    inventory_date: '2025-07-10',
    statut: 'Planifié',
    pending_status_date: '2025-07-10',
    current_status_date: '2025-07-11',
    date_status_launch: '2025-07-12',
    date_status_end: '2025-07-13',
    label: 'Inventaire Général Juillet',
  },
   {
    id: 4,
    reference: 'INV-004',
    inventory_date: '2025-07-10',
    statut: 'Planifié',
    pending_status_date: '2025-07-10',
    current_status_date: '2025-07-11',
    date_status_launch: '2025-07-12',
    date_status_end: '2025-07-13',
    label: 'Inventaire Général Juillet',
  },
   {
    id: 4,
    reference: 'INV-004',
    inventory_date: '2025-07-10',
    statut: 'Planifié',
    pending_status_date: '2025-07-10',
    current_status_date: '2025-07-11',
    date_status_launch: '2025-07-12',
    date_status_end: '2025-07-13',
    label: 'Inventaire Général Juillet',
  },
   {
    id: 4,
    reference: 'INV-004',
    inventory_date: '2025-07-10',
    statut: 'Planifié',
    pending_status_date: '2025-07-10',
    current_status_date: '2025-07-11',
    date_status_launch: '2025-07-12',
    date_status_end: '2025-07-13',
    label: 'Inventaire Général Juillet',
  },
   {
    id: 4,
    reference: 'INV-004',
    inventory_date: '2025-07-10',
    statut: 'Planifié',
    pending_status_date: '2025-07-10',
    current_status_date: '2025-07-11',
    date_status_launch: '2025-07-12',
    date_status_end: '2025-07-13',
    label: 'Inventaire Général Juillet',
  },
   {
    id: 4,
    reference: 'INV-004',
    inventory_date: '2025-07-10',
    statut: 'Planifié',
    pending_status_date: '2025-07-10',
    current_status_date: '2025-07-11',
    date_status_launch: '2025-07-12',
    date_status_end: '2025-07-13',
    label: 'Inventaire Général Juillet',
  },
   {
    id: 4,
    reference: 'INV-004',
    inventory_date: '2025-07-10',
    statut: 'Planifié',
    pending_status_date: '2025-07-10',
    current_status_date: '2025-07-11',
    date_status_launch: '2025-07-12',
    date_status_end: '2025-07-13',
    label: 'Inventaire Général Juillet',
  },
   {
    id: 4,
    reference: 'INV-004',
    inventory_date: '2025-07-10',
    statut: 'Planifié',
    pending_status_date: '2025-07-10',
    current_status_date: '2025-07-11',
    date_status_launch: '2025-07-12',
    date_status_end: '2025-07-13',
    label: 'Inventaire Général Juillet',
  },
  
  
];

export const inventoryManagementService = {
  async getInventories(): Promise<InventoryManagement[]> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockInventories;
  },

  async getInventoryById(id: number): Promise<InventoryManagement | undefined> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockInventories.find(inventory => inventory.id === id);
  },

  async deleteInventory(id: number): Promise<void> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 700));
    console.log('Inventory deleted:', id);
  },

  async updateInventory(id: number, data: Partial<InventoryManagement>): Promise<void> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const index = mockInventories.findIndex(inv => inv.id === id);
    if (index !== -1) {
      mockInventories[index] = { ...mockInventories[index], ...data };
    }
    
    console.log('Inventory updated:', id, data);
  }
};