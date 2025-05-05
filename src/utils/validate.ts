// src/utils/validate.ts
import type { InventoryCreationState, ContageConfig } from '@/interfaces/inventoryCreation';

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Valide l'étape 1 : libellé et date obligatoires
 */
export function validateStep1(data: { libelle: string; date: string; type: string; }): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!data.libelle?.trim()) {
    errors.push({ field: 'libelle', message: 'Le libellé est obligatoire.' });
  }
  if (!data.date) {
    errors.push({ field: 'date', message: 'La date est obligatoire.' });
  } else if (isNaN(Date.parse(data.date))) {
    errors.push({ field: 'date', message: 'La date n’est pas valide.' });
  }
  return errors;
}

/**
 * Valide l'étape 2 : compte et minimum un magasin
 */
export function validateStep2(data: { compte: string; magasin: any[]; }): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!data.compte) {
    errors.push({ field: 'compte', message: 'Le compte est obligatoire.' });
  }
  if (!Array.isArray(data.magasin) || data.magasin.length === 0) {
    errors.push({ field: 'magasin', message: 'Sélectionnez au moins un magasin.' });
  }
  return errors;
}

/**
 * Valide un seul contage (Paramétrage)
 */
export function validateContage(contage: ContageConfig): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!contage.mode) {
    errors.push({ field: 'mode', message: 'Le mode est requis.' });
    return errors;
  }
  if (contage.mode === 'liste emplacement') {
    if (!contage.useScanner && !contage.useSaisie) {
      errors.push({ field: 'useScanner', message: 'Pour « liste emplacement », au moins Scanner ou Saisie doit être activé.' });
    }
  }
  // Pas de validation spécifique pour 'article + emplacement', 'etat de stock', 'hybride'
  return errors;
}