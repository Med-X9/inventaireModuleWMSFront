import type { InventoryCreationState, ComptageMode } from '../interfaces/inventoryCreation';
import type { InventoryManagement } from '../interfaces/inventoryManagement';
import { inventoryCreationService } from './inventoryCreationService';

class InventoryEditService {
  private mockInventoryMap: Map<number, InventoryManagement> = new Map([
    [1, {
      id: 1,
      reference: 'INV-001',
      inventory_date: '2025-04-18',
      statut: 'En attente',
      date_status_launch: '2025-04-20',
      date_status_end: '2025-04-21',
      label: 'Inventaire Général Avril',
    }],
    [2, {
      id: 2,
      reference: 'INV-002',
      inventory_date: '2025-05-20',
      statut: 'En cours',
      date_status_launch: '2025-05-22',
      date_status_end: '2025-05-23',
      label: 'Inventaire Général Mai',
    }],
    [3, {
      id: 3,
      reference: 'INV-003',
      inventory_date: '2025-06-15',
      statut: 'Terminé',
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

  validateComptages(state: InventoryCreationState): boolean {
    const [c1, c2, c3] = state.comptages;
    
    // First comptage must have a mode
    if (!c1.mode) return false;
    
    // Second comptage must have a mode and can't be 'image de stock'
    if (!c2.mode || c2.mode === 'image de stock') return false;
    
    // Third comptage validation
    if (c1.mode === 'image de stock') {
      // If first is 'image de stock', third must match second
      return c3.mode === c2.mode;
    } else {
      // Third must match either first or second
      return c3.mode === c1.mode || c3.mode === c2.mode;
    }
  }

  // Réutilise la logique du service de création
  getOptionsForMode(mode: ComptageMode) {
    return inventoryCreationService.getOptionsForMode(mode);
  }

  getAvailableModesForStep(state: InventoryCreationState, stepIndex: number): ComptageMode[] {
    return inventoryCreationService.getAvailableModesForStep(state, stepIndex);
  }

  getInheritedOptionsForComptage3(state: InventoryCreationState) {
    return inventoryCreationService.getInheritedOptionsForComptage3(state);
  }

  getComptage3Constraints(state: InventoryCreationState) {
    return inventoryCreationService.getComptage3Constraints(state);
  }
}

export const inventoryEditService = new InventoryEditService();