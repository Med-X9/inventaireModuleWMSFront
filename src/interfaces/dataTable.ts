import { Count } from '@/models/Count'
import { InventoryWarehouse } from '@/models/Inventory'
import type { ColDef } from 'ag-grid-community'

// Action générique
export interface ActionConfig<T = Record<string, unknown>> {
    label: string | ((row: T) => string)
    icon?: unknown
    class?: string
    handler: (row: T) => void | Promise<void>
    visible?: boolean | ((row: T) => boolean)
    disabled?: boolean | ((row: T) => boolean)
}

// Table row générique
export interface TableRow {
    [key: string]: unknown
}

// Configuration pour les détails expandables
export interface DetailConfig {
    key: string
    displayField: string
    labelField?: string
    iconCollapsed?: string
    iconExpanded?: string
    countSuffix?: string
    columns?: {
        field: string
        valueKey?: string
        formatter?: (value: unknown, item: unknown) => string
    }[]
}

// DataTableColumn générique
export interface DataTableColumn<T = TableRow> extends ColDef {
    description?: string
    field?: string
    headerName?: string
    detailConfig?: DetailConfig
}

// Interface pour les lignes avec détails
export interface RowWithDetails extends TableRow {
    isChild?: boolean
    parentId?: string | null
    childType?: string
    originalItem?: unknown
}

// Specific inventory interfaces
export interface InventoryManagement extends TableRow {
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
