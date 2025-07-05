import type { Count, CreateCountRequest } from './Count';
import type { TableRow } from '@/interfaces/dataTable';

export interface InventoryWarehouse {
    id: number;
    date: string;
}

export interface InventoryTable extends TableRow {
    id: number;
    reference: string;
    label: string;
    date: string;
    status: string;
    en_preparation_status_date: string | null;
    en_realisation_status_date: string | null;
    ternime_status_date: string | null;
    cloture_status_date: string | null;
    account_id: number;
    account_name: string;
    warehouse: InventoryWarehouse[];
    comptages: Count[];
}

export interface CreateInventoryRequest {
    label: string;
    date: string;
    account_id: number;
    warehouse: InventoryWarehouse[];
    comptages: CreateCountRequest[];
}
