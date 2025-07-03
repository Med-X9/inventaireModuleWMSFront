import type { Component } from 'vue'
// src/interfaces/inventoryManagement.ts
export interface Team {
  id: number;
  name: string;
}

export interface InventoryManagement {
  id: number;
  reference: string;
  inventory_date: string;
  date_creation: string;
  date_lancement: string;
  date_echeance: string;
  date_cloture: string;
  label: string;
  type: string;
  statut: string;
  teams?: Team[];
  comptages?: import('./inventoryCreation').ComptageConfig[];
}

// Ajout de showWhen dans InventoryAction
export interface InventoryAction {
  label: string | ((inventory: InventoryManagement) => string)

  icon?: Component

  class?: string

  handler: (inventory: InventoryManagement) => void | Promise<void>

  showWhen?: (inventory: InventoryManagement) => boolean
}
