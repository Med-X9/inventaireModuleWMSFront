import type { InventoryCreationState, ContageMode } from '@/interfaces/inventoryCreation';

class InventoryCreationService {
  getAvailableModesForStep(
    state: InventoryCreationState,
    stepIndex: number
  ): ContageMode[] {
    // Emplacements standard pour Contage 1
    const firstOptions: ContageMode[] = [
      'liste emplacement',
      'article + emplacement',
      'hybride',
      'etat de stock'
    ];

    if (stepIndex === 0) {
      // Toujours les 4 options
      return firstOptions;
    }

    const first = state.contages[0].mode as ContageMode;
    const second = state.contages[1].mode as ContageMode;

    if (stepIndex === 1) {
      // Contage 2 : si premier = 'etat de stock', sinon même 3
      return ['liste emplacement', 'article + emplacement', 'hybride'];
    }

    if (stepIndex === 2) {
      // Contage 3 : si premier = 'etat de stock' → unique second, sinon [first, second]
      if (first === 'etat de stock') {
        return [second];
      }
      return [first, second];
    }

    return [];
  }
}

export const inventoryCreationService = new InventoryCreationService();