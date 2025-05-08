
import { format, isValid, parse } from 'date-fns';
import type { ContageConfig } from '@/interfaces/inventoryCreation';

export interface Validator {
  fn: (value: unknown) => boolean;
  msg: string;
}

// Validators de base
export const required = (msg = 'Ce champ est requis'): Validator => ({
  fn: (value: unknown) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim() !== '';
    return value !== null && value !== undefined;
  },
  msg
});

export const selectRequired = (msg = 'Veuillez sélectionner une option'): Validator => ({
  fn: (value: unknown) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined && value !== '';
  },
  msg
});

export const date = (msg = 'Format de date invalide'): Validator => ({
  fn: (value: unknown) => {
    if (!value || typeof value !== 'string') return false;
    const parsed = parse(value, 'yyyy-MM-dd', new Date());
    return isValid(parsed);
  },
  msg
});

export const futureDate = (msg = 'La date doit être dans le futur'): Validator => ({
  fn: (value: unknown) => {
    if (!value || typeof value !== 'string') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parsed = parse(value, 'yyyy-MM-dd', new Date());
    return isValid(parsed) && parsed >= today;
  },
  msg
});

export const minLength = (min: number, msg = `Minimum ${min} caractères`): Validator => ({
  fn: (value: unknown) => typeof value === 'string' && value.length >= min,
  msg
});

export const maxLength = (max: number, msg = `Maximum ${max} caractères`): Validator => ({
  fn: (value: unknown) => typeof value === 'string' && value.length <= max,
  msg
});

export const email = (msg = 'Adresse email invalide'): Validator => ({
  fn: (value: unknown) => {
    if (typeof value !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },
  msg
});

export const number = (msg = 'Valeur numérique invalide'): Validator => ({
  fn: (value: unknown) => !isNaN(Number(value)),
  msg
});

// Validation des contages
export interface ContageValidationResult {
  isValid: boolean;
  errors: string[];
  fieldErrors: Record<string, string[]>;
}

export const validateContages = (contages: ContageConfig[]): ContageValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string[]> = {
    mode: [],
    isVariant: [],
    useScanner: [],
    useSaisie: []
  };

  if (!Array.isArray(contages) || contages.length !== 3) {
    errors.push('Configuration des contages invalide');
    return { isValid: false, errors, fieldErrors };
  }

  contages.forEach((contage, index) => {
    if (!contage.mode) {
      fieldErrors.mode[index] = `Le mode du contage ${index + 1} est requis`;
    }

    if (contage.mode !== 'etat de stock' && !(contage.useScanner || contage.useSaisie)) {
      fieldErrors.useScanner[index] = `Méthode de saisie requise pour le contage ${index + 1}`;
    }
  });

  const isValidOverall = errors.length === 0 &&
    Object.values(fieldErrors).every(arr => arr.every(error => !error));

  return { isValid: isValidOverall, errors, fieldErrors };
};

// Validation globale de la création d'inventaire
import type { InventoryCreationState } from '@/interfaces/inventoryCreation';

export interface CreationValidationResult {
  isValid: boolean;
  step1Errors: Record<string, string>;
  step2Errors: Record<string, string>;
  contageResult: ContageValidationResult;
}

export const validateCreation = (state: InventoryCreationState): CreationValidationResult => {
  const step1Errors: Record<string, string> = {};
  const step2Errors: Record<string, string> = {};

  // Étape 1: libelle, date
  if (!required().fn(state.step1Data.libelle)) {
    step1Errors.libelle = required().msg;
  }
  if (!date().fn(state.step1Data.date)) {
    step1Errors.date = date().msg;
  }

  // Étape 2: compte, magasin
  if (!selectRequired().fn(state.step2Data.compte)) {
    step2Errors.compte = selectRequired().msg;
  }
  if (!selectRequired().fn(state.step2Data.magasin)) {
    step2Errors.magasin = selectRequired().msg;
  }

  const contageResult = validateContages(state.contages);

  const isValid = Object.keys(step1Errors).length === 0 &&
    Object.keys(step2Errors).length === 0 &&
    contageResult.isValid;

  return { isValid, step1Errors, step2Errors, contageResult };
};
