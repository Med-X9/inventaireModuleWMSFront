export interface Count {
    id: number | null;
    reference: string | null;
    order: number;
    count_mode: string;
    unit_scanned: boolean;
    entry_quantity: boolean;
    is_variant: boolean;
    n_lot: boolean;
    n_serie: boolean;
    dlc: boolean;
    show_product: boolean;
    stock_situation: boolean;
    quantity_show: boolean;
    inventory: number;
    created_at: string;
    updated_at: string;
}
