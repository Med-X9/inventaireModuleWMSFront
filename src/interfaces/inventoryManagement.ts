import type { ActionConfig, DataTableColumn } from '@/interfaces/dataTable';

export interface InventoryManagement {
  id: number;
  reference: string;
  inventory_date: string;
  statut: string;
  date_status_launch: string;
  date_status_end: string;
  label: string;
}

export type InventoryAction = ActionConfig;
export type InventoryColumn = DataTableColumn;