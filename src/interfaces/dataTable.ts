import type { ColDef } from 'ag-grid-community'

export interface ActionConfig {
  label: string
  icon?: unknown
  class?: string                      // pour vos classes CSS
  handler: (row: any) => void | Promise<void>  // accepte aussi les Promises
}

export type DataTableColumn = ColDef