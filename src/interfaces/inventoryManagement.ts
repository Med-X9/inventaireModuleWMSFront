import { Count } from '@/models/Count';
import { InventoryWarehouse } from '@/models/Inventory';
import type { Component } from 'vue'
// src/interfaces/inventoryManagement.ts
export interface Team {
    id: number;
    name: string;
}

export interface InventoryManagement {
    id: number ;
    reference: string ;
    label: string;
    date: string;
    inventory_type : string
    status: string;
    created_at: string;
    en_preparation_status_date: string | null;
    en_realisation_status_date: string | null;
    ternime_status_date: string | null;
    cloture_status_date: string | null;
    account_name: string;
    warehouse: InventoryWarehouse[];
    comptages: Count[];
}

// Ajout de showWhen dans InventoryAction
export interface InventoryAction {
    label: string | ((inventory: InventoryManagement) => string)

    icon?: Component

    class?: string

    handler: (inventory: InventoryManagement) => void | Promise<void>

    showWhen?: (inventory: InventoryManagement) => boolean
}
