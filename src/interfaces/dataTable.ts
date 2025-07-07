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

// DataTable column interface extending ColDef
export interface DataTableColumn extends ColDef {
  description?: string
  field?: string
  headerName?: string
  detailConfig?: DetailConfig // Configuration pour les détails expandables
}

// Interface pour les lignes avec détails et tri hiérarchique
export interface RowWithDetails extends TableRow {
  isChild?: boolean
  parentId?: string | null
  childType?: string
  originalItem?: unknown
  // NOUVEAU: Champs pour le tri hiérarchique
  _sortOrder?: number
  _parentSortOrder?: number
  _isMainRow?: boolean
}

// Interface étendue pour le groupement avec tri
export interface RowWithGrouping extends RowWithDetails {
  groupId?: string
  sortOrder?: number
  originalSortValue?: unknown
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