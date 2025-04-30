// src/utils/validation.ts
import type {
  InventoryCreationStep1,
  InventoryCreationStep2,
} from '@/interfaces/inventoryCreation';

export function validateStep1(data: InventoryCreationStep1): true | string {
  if (!data.libelle.trim()) {
    return 'Le libellé ne peut pas être vide.';
  }
  if (!data.date) {
    return 'La date est obligatoire.';
  }
  // Optionnel : vérifier le format, ex. YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    return 'Le format de la date doit être AAAA-MM-JJ.';
  }
  return true;
}

export function validateStep2(data: InventoryCreationStep2): true | string {
  if (!data.compte) {
    return 'Le compte doit être sélectionné.';
  }
  if (!Array.isArray(data.magasin) || data.magasin.length === 0) {
    return 'Au moins un magasin doit être sélectionné.';
  }
  return true;
}
