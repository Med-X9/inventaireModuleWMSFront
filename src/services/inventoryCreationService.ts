import type { InventoryCreationState, ContageMode } from '@/interfaces/inventoryCreation';

class InventoryCreationService {
  validateContages(state: InventoryCreationState): boolean {
    const [c1, c2, c3] = state.contages;
    
    if (c1.mode === 'etat de stock') {
      return c2.mode !== '' && c3.mode === c2.mode;
    }
    
    return c1.mode !== '' && 
           c2.mode !== '' && 
           (c3.mode === c1.mode || c3.mode === c2.mode);
  }

  getAvailableModesForStep(
    state: InventoryCreationState,
    stepIndex: number
  ): ContageMode[] {
    const standardModes: ContageMode[] = [
      'liste emplacement',
      'article + emplacement',
      'hybride'
    ];

    // First contage: all options available
    if (stepIndex === 0) {
      return [...standardModes, 'etat de stock'];
    }

    const firstContage = state.contages[0].mode;

    // Second contage
    if (stepIndex === 1) {
      return standardModes;
    }

    // Third contage
    if (stepIndex === 2) {
      if (firstContage === 'etat de stock') {
        return [state.contages[1].mode];
      }
      return [firstContage, state.contages[1].mode];
    }

    return [];
  }
}

export const inventoryCreationService = new InventoryCreationService();