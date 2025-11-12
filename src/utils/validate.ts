import { format, isValid, parse } from 'date-fns';
import type { ComptageConfig, InventoryCreationState } from '@/interfaces/inventoryCreation';

export interface Validator {
fn: (value: unknown) => boolean;
msg: string;
}

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

// Validation pour magasins avec dates obligatoires
export const magasinWithDatesRequired = (msg = 'Veuillez sélectionner au moins un magasin et renseigner toutes les dates'): Validator => ({
fn: (value: unknown) => {
if (!Array.isArray(value)) return false;
if (value.length === 0) return false;

// Vérifier que chaque magasin a une date renseignée
return value.every(item => {
  if (typeof item === 'object' && item !== null) {
    const magasinItem = item as { magasin: string; date: string };
    return magasinItem.magasin && magasinItem.date && magasinItem.date.trim() !== '';
  }
  return false;
});
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

export interface ComptageValidationResult {
isValid: boolean;
errors: string[];
fieldErrors: Record<string, string[]>;
}

export const validateComptages = (comptages: ComptageConfig[]): ComptageValidationResult => {
const errors: string[] = [];
const fieldErrors: Record<string, string[]> = {
mode: [],
};

if (!Array.isArray(comptages) || comptages.length !== 3) {
errors.push('Configuration des comptages invalide');
return { isValid: false, errors, fieldErrors };
}

comptages.forEach((comptage, index) => {
if (!comptage.mode) {
fieldErrors.mode[index] = `Le mode du comptage ${index + 1} est requis`;
}
});

const isValidOverall = errors.length === 0 &&
Object.values(fieldErrors).every(arr => arr.every(error => !error));

return { isValid: isValidOverall, errors, fieldErrors };
};

export interface CreationValidationResult {
isValid: boolean;
step1Errors: Record<string, string>;
comptageResult: ComptageValidationResult;
}

export const validateCreation = (state: InventoryCreationState): CreationValidationResult => {
    const step1Errors: Record<string, string> = {};

    if (!state.step1Data) {
        step1Errors.general = 'Les données de l\'étape 1 sont manquantes';
        const comptageResult = validateComptages(state.comptages);
        return { isValid: false, step1Errors, comptageResult };
    }

    if (!required().fn(state.step1Data.libelle)) {
        step1Errors.libelle = required().msg;
    }
    if (!date().fn(state.step1Data.date)) {
        step1Errors.date = date().msg;
    }
    if (!selectRequired().fn(state.step1Data.compte)) {
        step1Errors.compte = selectRequired().msg;
    }
    // Utiliser la validation avec dates obligatoires pour magasins
    if (!magasinWithDatesRequired().fn(state.step1Data.magasin)) {
        step1Errors.magasin = magasinWithDatesRequired().msg;
    }

    const comptageResult = validateComptages(state.comptages);

    const isValid = Object.keys(step1Errors).length === 0 && comptageResult.isValid;

    return { isValid, step1Errors, comptageResult };
};
