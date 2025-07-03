import type { ColDef } from 'ag-grid-community'

// Generic action configuration that works with any row type
export interface ActionConfig<T = Record<string, unknown>> {
    label: string | ((row: T) => string)
    icon?: unknown
    class?: string
    handler: (row: T) => void | Promise<void>
    visible?: boolean | ((row: T) => boolean)
    disabled?: boolean | ((row: T) => boolean)
}

// Generic table row interface
export interface TableRow {
    [key: string]: unknown
}

// DataTable column interface extending ColDef
export interface DataTableColumn extends ColDef {
    description?: string
    field?: string
    headerName?: string
}

// Specific inventory interfaces
export interface InventoryManagement {
    id: string
    reference: string
    inventory_date: string
    date_creation: string
    status: string
    [key: string]: unknown
}

export interface InventoryResult {
    id: string
    store_id: string
    product_id: string
    quantity: number
    status: string
    [key: string]: unknown
}

// Inventory-specific action type
export type InventoryAction = ActionConfig<InventoryManagement>
export type InventoryResultAction = ActionConfig<InventoryResult>

export type { DataTableColumn as default }