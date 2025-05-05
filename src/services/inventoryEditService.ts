import type { InventoryCreationState, ContageMode } from '../interfaces/inventoryCreation';
import type { InventoryManagement } from '../interfaces/inventoryManagement';

class InventoryEditService {
  private mockInventoryMap: Map<number, InventoryManagement> = new Map([
    [1, {
      id: 1,
      reference: 'INV-001',
      inventory_date: '2025-04-18',
      statut: 'En attente',
      pending_status_date: '2025-04-18',
      current_status_date: '2025-04-19',
      date_status_launch: '2025-04-20',
      date_status_end: '2025-04-21',
      label: 'Inventaire Général Avril',
    }],
    [2, {
      id: 2,
      reference: 'INV-002',
      inventory_date: '2025-05-20',
      statut: 'En cours',
      pending_status_date: '2025-05-20',
      current_status_date: '2025-05-21',
      date_status_launch: '2025-05-22',
      date_status_end: '2025-05-23',
      label: 'Inventaire Général Mai',
    }],
    [3, {
      id: 3,
      reference: 'INV-003',
      inventory_date: '2025-06-15',
      statut: 'Terminé',
      pending_status_date: '2025-06-15',
      current_status_date: '2025-06-16',
      date_status_launch: '2025-06-17',
      date_status_end: '2025-06-18',
      label: 'Inventaire Général Juin',
    }]
  ]);

  async getInventoryById(id: number): Promise<InventoryManagement> {
    await new Promise(resolve => setTimeout(resolve, 800));
    const inventory = this.mockInventoryMap.get(id);
    if (!inventory) {
      throw new Error(`Inventory with ID ${id} not found`);
    }
    return inventory;
  }

  async updateInventory(id: number, inventoryData: InventoryCreationState): Promise<void> {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const existingInventory = this.mockInventoryMap.get(id);
      if (existingInventory) {
        this.mockInventoryMap.set(id, {
          ...existingInventory,
          label: inventoryData.step1Data.libelle,
          inventory_date: inventoryData.step1Data.date,
        });
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw new Error('Erreur lors de la mise à jour de l\'inventaire');
    }
  }

  validateContages(state: InventoryCreationState): boolean {
    const [c1, c2, c3] = state.contages;
    
    if (c1.mode === 'etat de stock') {
      return c2.mode !== '' && c3.mode === c2.mode;
    }
    
    return c1.mode !== '' && 
           c2.mode !== '' && 
           (c3.mode === c1.mode || c3.mode === c2.mode);
  }

  getAvailableModesForStep(state: InventoryCreationState, stepIndex: number): ContageMode[] {
    const standardModes: ContageMode[] = [
      'liste emplacement',
      'article + emplacement',
      'hybride'
    ];

    if (stepIndex === 0) {
      return [...standardModes, 'etat de stock'];
    }

    const firstContage = state.contages[0].mode;

    if (stepIndex === 1) {
      return standardModes;
    }

    if (stepIndex === 2) {
      if (firstContage === 'etat de stock') {
        return [state.contages[1].mode];
      }
      return [firstContage, state.contages[1].mode];
    }

    return [];
  }
}

export const inventoryEditService = new InventoryEditService();