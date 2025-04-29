// src/services/inventoryCreationService.ts
import type { InventoryCreationState, ContageMode } from '@/interfaces/inventoryCreation';

class InventoryCreationService {
  // Validation inchangée
  validateContages(state: InventoryCreationState): boolean {
    if (state.contages[0].mode === 'etat de stock') {
      return (
        state.contages[1].mode !== '' &&
        state.contages[2].mode === state.contages[1].mode
      );
    }
    return (
      state.contages[0].mode !== '' &&
      state.contages[1].mode !== '' &&
      state.contages[2].mode === state.contages[0].mode
    );
  }

  // Nouvelle logique de disponibilité des modes
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

    // Étape 1 : toujours tous les modes
    if (stepIndex === 0) {
      return all;
    }

    const first = state.contages[0].mode as ContageMode;

    // Étape 2
    if (stepIndex === 1) {
      if (first === 'etat de stock') {
        // proposer les 3 autres
        return all.filter((m) => m !== 'etat de stock');
      } else {
        // proposer les deux restants parmi les trois non-‘etat de stock’
        return all
          .filter((m) => m !== 'etat de stock' && m !== first);
      }
    }

    const second = state.contages[1].mode as ContageMode;

    // Étape 3
    if (stepIndex === 2) {
      if (first === 'etat de stock') {
        // n’afficher que le choix de l’étape 2
        return [second];
      } else {
        // afficher les deux choix : 1 et 2
        return [first, second];
      }
    }

    // Pas d’autres étapes
    return [];
  }
}

export const inventoryCreationService = new InventoryCreationService();
