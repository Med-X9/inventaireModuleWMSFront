import { format, isValid, parse } from 'date-fns';

export interface Validator {
  fn: (value: unknown) => boolean;
  msg: string;
}

// Base validators
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
    if (!value) return false;
    if (typeof value !== 'string') return false;
    const parsed = parse(value, 'yyyy-MM-dd', new Date());
    return isValid(parsed);
  },
  msg
});

export const minLength = (min: number, msg = `Minimum ${min} caractères`): Validator => ({
  fn: (value: unknown) => {
    if (typeof value !== 'string') return false;
    return value.length >= min;
  },
  msg
});

export const maxLength = (max: number, msg = `Maximum ${max} caractères`): Validator => ({
  fn: (value: unknown) => {
    if (typeof value !== 'string') return false;
    return value.length <= max;
  },
  msg
});

// Planning specific validators
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

export const teamNameRequired = (msg = "Le nom de l'équipe est requis"): Validator => ({
  fn: (value: unknown) => {
    if (typeof value !== 'string') return false;
    return value.trim().length >= 2;
  },
  msg
});

export const jobLocationsRequired = (msg = 'Au moins un emplacement doit être sélectionné'): Validator => ({
  fn: (value: unknown) => {
    if (!Array.isArray(value)) return false;
    return value.length > 0;
  },
  msg
});

// Inventory specific validators
export interface ContageValidationResult {
  isValid: boolean;
  errors: string[];
  fieldErrors: Record<string, string[]>;
}

export const validateContages = (contages: any[]): ContageValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string[]> = {
    mode: [],
    isVariant: [],
    useScanner: [],
    useSaisie: []
  };
  
  // Base validation
  if (!Array.isArray(contages) || contages.length !== 3) {
    errors.push('Configuration des contages invalide');
    return { isValid: false, errors, fieldErrors };
  }

  const [c1, c2, c3] = contages;

  // First contage validation
  if (!c1.mode) {
    fieldErrors.mode.push('Le mode du premier contage est requis');
  }

  // Second contage validation
  if (!c2.mode) {
    fieldErrors.mode.push('Le mode du deuxième contage est requis');
  }

  // Third contage validation
  if (!c3.mode) {
    fieldErrors.mode.push('Le mode du troisième contage est requis');
  }

  // Specific rules for 'etat de stock'
  if (c1.mode === 'etat de stock') {
    if (c2.mode !== c3.mode) {
      errors.push('Les contages 2 et 3 doivent avoir le même mode');
      fieldErrors.mode.push('Les modes des contages 2 et 3 doivent être identiques');
    }
  } else {
    // Rules for other modes
    if (c3.mode !== c1.mode && c3.mode !== c2.mode) {
      errors.push('Le contage 3 doit correspondre au mode du contage 1 ou 2');
      fieldErrors.mode.push('Le mode du contage 3 doit correspondre au mode du contage 1 ou 2');
    }
  }

  // Input method validation for 'liste emplacement'
  if (c1.mode === 'liste emplacement' && !c1.useScanner && !c1.useSaisie) {
    fieldErrors.useScanner.push('Veuillez sélectionner au moins une méthode de saisie (scanner ou saisie manuelle)');
  }

  return {
    isValid: errors.length === 0 && Object.values(fieldErrors).every(arr => arr.length === 0),
    errors,
    fieldErrors
  };
};