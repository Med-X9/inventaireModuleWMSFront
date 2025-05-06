import type { InventoryCreationState, ContageMode } from '@/interfaces/inventoryCreation';
import { validateContages } from '@/utils/validate';

class InventoryCreationService {
  validateContages(state: InventoryCreationState): boolean {
    const validation = validateContages(state.contages);
    return validation.isValid;
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

export const inventoryCreationService = new InventoryCreationService();