// src/services/inventoryCreationService.ts
import type { InventoryCreationState, ContageMode } from '@/interfaces/inventoryCreation';

class InventoryCreationService {
  validateContages(state: InventoryCreationState): boolean {
    const [c1, c2, c3] = state.contages.map(c => c.mode);
    if (c1 === 'etat de stock') {
      return c2 !== '' && c3 === c2;
    } else {
      return c1 !== '' && c2 !== '' && (c3 === c1 || c3 === c2);
    }
  }

  getAvailableModesForStep(
    state: InventoryCreationState,
    stepIndex: number
  ): ContageMode[] {
    const all: ContageMode[] = [
      'etat de stock',
      'liste emplacement',
      'article + emplacement',
      'hybride',
    ];

    if (stepIndex === 0) {
      return all;                                                                         // Contage 1 
    }

    const first = state.contages[0].mode;

    if (stepIndex === 1) {
      return first === 'etat de stock'
        ? all.filter(m => m !== 'etat de stock')                                           // Contage 2 cas “état de stock” 
        : all.filter(m => m !== 'etat de stock' && m !== first);                          // Contage 2 autre cas
    }

    const second = state.contages[1].mode;

    if (stepIndex === 2) {
      return first === 'etat de stock'
        ? [second]                                                                         // Contage 3 cas “état de stock”
        : [first, second];                                                                 // Contage 3 sinon
    }

    return [];
  }
}

export const inventoryCreationService = new InventoryCreationService();
