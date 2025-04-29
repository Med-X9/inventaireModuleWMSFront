import type { InventoryCreationState, ContageMode } from '../interfaces/inventoryCreation';
import type { InventoryManagement } from '../interfaces/inventoryManagement';
import { alertService } from './alertService';

class InventoryEditService {
  // Mocked inventory data
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
    // In a real application, this would be an API call
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API latency
    
    const inventory = this.mockInventoryMap.get(id);
    if (!inventory) {
      throw new Error(`Inventory with ID ${id} not found`);
    }
    
    return inventory;
  }

  async updateInventory(id: number, inventoryData: InventoryCreationState): Promise<void> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would send data to an API
      console.log('Updating inventory:', id, inventoryData);
      
      // Update the mock data
      const existingInventory = this.mockInventoryMap.get(id);
      if (existingInventory) {
        this.mockInventoryMap.set(id, {
          ...existingInventory,
          label: inventoryData.step1Data.libelle,
          inventory_date: inventoryData.step1Data.date,
          // Update other fields as needed
        });
      }
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw new Error('Erreur lors de la mise à jour de l\'inventaire');
    }
  }

  validateContages(state: InventoryCreationState): boolean {
    if (state.contages[0].mode === 'etat de stock') {
      return state.contages[1].mode !== '' && 
             state.contages[2].mode === state.contages[1].mode;
    }

    return state.contages[0].mode !== '' && 
           state.contages[1].mode !== '' && 
           state.contages[2].mode === state.contages[0].mode;
  }

  getAvailableModesForStep(state: InventoryCreationState, stepIndex: number): ContageMode[] {
    if (stepIndex === 0) {
      return ['etat de stock', 'liste emplacement', 'article + emplacement', 'hybride'];
    }

    if (state.contages[0].mode === 'etat de stock') {
      if (stepIndex === 1) {
        return ['liste emplacement', 'article + emplacement', 'hybride'];
      }
      return [state.contages[1].mode];
    }

    const usedModes = state.contages
      .slice(0, stepIndex)
      .map(c => c.mode)
      .filter((mode): mode is ContageMode => mode !== '');

    if (stepIndex === 2) {
      return [state.contages[0].mode, state.contages[1].mode];
    }

    const allModes: ContageMode[] = ['liste emplacement', 'article + emplacement', 'hybride'];
    return allModes.filter(mode => !usedModes.includes(mode));
  }
}

export const inventoryEditService = new InventoryEditService();