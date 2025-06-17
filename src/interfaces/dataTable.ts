import type { ColDef } from 'ag-grid-community'

export interface ActionConfig {
  label: string
  icon?: unknown
  class?: string                 
  handler: (row: any) => void | Promise<void>  
}

export interface TableRow {
  [key: string]: unknown
}

// Étendre ColDef pour ajouter la description
export interface DataTableColumn extends ColDef {
  description?: string // Description pour le tooltip
}

export type { DataTableColumn as default }