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
export type DataTableColumn = ColDef