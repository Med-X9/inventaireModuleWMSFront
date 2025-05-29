import type { InventoryCreationState, ContageMode } from '@/interfaces/inventoryCreation';

export class InventoryCreationService {
  getAvailableModesForStep(
    state: InventoryCreationState,
    stepIndex: number
  ): ContageMode[] {
    // First contage - all options available, default to 'etat de stock'
    if (stepIndex === 0) {
      return [
        'etat de stock',
        'liste emplacement',
        'article + emplacement',
        'hybride'
      ];
    }

    // Second contage - always three options (no 'etat de stock')
    if (stepIndex === 1) {
      return [
        'liste emplacement',
        'article + emplacement',
        'hybride'
      ];
    }

    // Third contage - depends on previous selections
    if (stepIndex === 2) {
      const firstContage = state.contages[0];
      const secondContage = state.contages[1];

      // If first contage is 'etat de stock', only show second contage's mode
      if (firstContage.mode === 'etat de stock') {
        return [secondContage.mode];
      }

      // Otherwise, show unique values from first and second contage
      const uniqueModes = new Set([firstContage.mode, secondContage.mode]);
      return Array.from(uniqueModes) as ContageMode[];
    }

    return [];
  }

  getOptionsForMode(mode: ContageMode): { hasVariant: boolean; hasScanner: boolean; hasQuantite: boolean; } {
    switch (mode) {
      case 'liste emplacement':
        return {
          hasVariant: false,
          hasScanner: true,
          hasQuantite: false
        };
      case 'article + emplacement':
        return {
          hasVariant: true,
          hasScanner: false,
          hasQuantite: true
        };
      case 'hybride':
        return {
          hasVariant: true,
          hasScanner: false,
          hasQuantite: false
        };
      default:
        return {
          hasVariant: false,
          hasScanner: false,
          hasQuantite: false
        };
    }
  }
}

export const inventoryCreationService = new InventoryCreationService();