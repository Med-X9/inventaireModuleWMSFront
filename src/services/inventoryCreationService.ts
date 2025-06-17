import type { InventoryCreationState, ComptageMode, ComptageConfig } from '@/interfaces/inventoryCreation';

export class InventoryCreationService {
  getAvailableModesForStep(
    state: InventoryCreationState,
    stepIndex: number
  ): ComptageMode[] {
    if (stepIndex === 0) {
      // Comptage 1: 3 options
      return [
        'image de stock',
        'en vrague',
        'en vrague par article'
      ];
    }

    if (stepIndex === 1) {
      // Comptage 2: 2 options (jamais "image de stock")
      return [
        'en vrague',
        'en vrague par article'
      ];
    }

    if (stepIndex === 2) {
      // Comptage 3: dépend des choix précédents
      const firstComptage = state.comptages[0];
      const secondComptage = state.comptages[1];

      if (firstComptage.mode === 'image de stock') {
        // Si Comptage 1 = "image de stock", alors Comptage 3 = valeur de Comptage 2
        return [secondComptage.mode].filter(Boolean) as ComptageMode[];
      }

      // Sinon, on prend l'ensemble {Comptage 1, Comptage 2} et on supprime les doublons
      const uniqueModes = new Set([firstComptage.mode, secondComptage.mode].filter(Boolean));
      return Array.from(uniqueModes) as ComptageMode[];
    }

    return [];
  }

  getOptionsForMode(mode: ComptageMode): {
    hasEnVragueOptions: boolean;
    hasEnVragueParArticleOptions: boolean;
    hasNoOptions: boolean;
  } {
    switch (mode) {
      case 'en vrague':
        return {
          hasEnVragueOptions: true,
          hasEnVragueParArticleOptions: false,
          hasNoOptions: false
        };
      case 'en vrague par article':
        return {
          hasEnVragueOptions: false,
          hasEnVragueParArticleOptions: true,
          hasNoOptions: false
        };
      case 'image de stock':
        return {
          hasEnVragueOptions: false,
          hasEnVragueParArticleOptions: false,
          hasNoOptions: true
        };
      default:
        return {
          hasEnVragueOptions: false,
          hasEnVragueParArticleOptions: false,
          hasNoOptions: true
        };
    }
  }

  getInheritedOptionsForComptage3(
    state: InventoryCreationState
  ): Partial<ComptageConfig> {
    const firstComptage = state.comptages[0];
    const secondComptage = state.comptages[1];

    if (firstComptage.mode === 'image de stock') {
      // Hérite des options du Comptage 2
      return { ...secondComptage };
    }

    // Logic for "en vrague" mode with specific scenarios
    if (firstComptage.mode === 'en vrague' && secondComptage.mode === 'en vrague') {
      const result: Partial<ComptageConfig> = {};

      // Cas 1: Les deux ont saisie quantité
      if (firstComptage.inputMethod === 'saisie' && secondComptage.inputMethod === 'saisie') {
        result.inputMethod = 'saisie';
      }
      // Cas 2: Les deux ont scanner unitaire
      else if (firstComptage.inputMethod === 'scanner' && secondComptage.inputMethod === 'scanner') {
        result.inputMethod = 'scanner';
      }
      // Cas 3: Un a saisie, l'autre a scanner - permettre les deux options dans le radio group
      else if (
        (firstComptage.inputMethod === 'saisie' && secondComptage.inputMethod === 'scanner') ||
        (firstComptage.inputMethod === 'scanner' && secondComptage.inputMethod === 'saisie')
      ) {
        // Dans ce cas, on laisse le choix libre - pas de pré-sélection
        result.inputMethod = '';
      }

      // Guide quantité si présent dans l'un des deux
      result.guideQuantite = firstComptage.guideQuantite || secondComptage.guideQuantite;

      return result;
    }

    // Si même mode "en vrague par article" dans les deux comptages
    if (firstComptage.mode === 'en vrague par article' && secondComptage.mode === 'en vrague par article') {
      return {
        isVariante: firstComptage.isVariante || secondComptage.isVariante,
        guideQuantite: firstComptage.guideQuantite || secondComptage.guideQuantite,
        guideArticle: firstComptage.guideArticle || secondComptage.guideArticle,
        dlc: firstComptage.dlc || secondComptage.dlc,
        guideArticleQuantite: firstComptage.guideArticleQuantite || secondComptage.guideArticleQuantite,
        numeroLot: firstComptage.numeroLot || secondComptage.numeroLot,
      };
    }

    return {};
  }

  // Helper method to check specific scenarios for Comptage 3
  getComptage3Constraints(state: InventoryCreationState): {
    restrictedToSaisie: boolean;
    restrictedToScanner: boolean;
    allowBoth: boolean;
  } {
    const firstComptage = state.comptages[0];
    const secondComptage = state.comptages[1];

    if (firstComptage.mode === 'en vrague' && secondComptage.mode === 'en vrague') {
      // Cas 1: Les deux ont saisie quantité → Comptage 3 = saisie uniquement
      if (firstComptage.inputMethod === 'saisie' && secondComptage.inputMethod === 'saisie') {
        return { restrictedToSaisie: true, restrictedToScanner: false, allowBoth: false };
      }
      
      // Cas 2: Les deux ont scanner unitaire → Comptage 3 = scanner uniquement
      if (firstComptage.inputMethod === 'scanner' && secondComptage.inputMethod === 'scanner') {
        return { restrictedToSaisie: false, restrictedToScanner: true, allowBoth: false };
      }
      
      // Cas 3: Un a saisie, l'autre a scanner → Comptage 3 = les deux options
      if (
        (firstComptage.inputMethod === 'saisie' && secondComptage.inputMethod === 'scanner') ||
        (firstComptage.inputMethod === 'scanner' && secondComptage.inputMethod === 'saisie')
      ) {
        return { restrictedToSaisie: false, restrictedToScanner: false, allowBoth: true };
      }
    }

    return { restrictedToSaisie: false, restrictedToScanner: false, allowBoth: false };
  }
}

export const inventoryCreationService = new InventoryCreationService();