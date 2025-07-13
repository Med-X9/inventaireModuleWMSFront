import type { Count, CreateCountRequest } from './Count';
import type { TableRow } from '@/interfaces/dataTable';
export interface ResponseInventoryDetails {
    data: InventoryDetails;
    message: string;
    status: string;
}
export interface InventoryWarehouse {
    id: number;
    date: string;
}

export interface InventoryWarehouseDetails {
    id: number;
    reference: string;
    warehouse_name: string;
    warehouse_type: string;
    description: string;
    status: string;
    address: string;
    setting_id: number;
    setting_reference: string;
    setting_created_at: string;
    setting_updated_at: string;
    inventory_start_date: string;
    inventory_end_date: string;
}

export interface InventoryDetails {
    id: number;
    reference: string;
    label: string;
    date: string;
    status: string;
    inventory_type: string;
    created_at: string;
    updated_at: string;
    en_preparation_status_date: string;
    en_realisation_status_date: string;
    termine_status_date: string;
    cloture_status_date: string;
    account_id: number;
    warehouses: InventoryWarehouseDetails[];
    comptages: Count[];
}

export interface InventoryTable extends TableRow {
    id: number;
    reference: string;
    label: string;
    date: string;
    status: string;
    inventory_type: string;
    en_preparation_status_date: string | null;
    en_realisation_status_date: string | null;
    termine_status_date: string | null;
    cloture_status_date: string | null;
    account_id: number;
    account_name: string;
    warehouse: InventoryWarehouse[];
    comptages: Count[];
}

export interface CreateInventoryRequest {
    label: string;
    date: string;
    inventory_type: string;
    account_id: number;
    warehouse: InventoryWarehouse[];
    comptages: CreateCountRequest[];
}
