export interface InventoryManagement {
    id: number;
    reference: string;
    inventory_date: string;
    statut: string;
    pending_status_date: string;
    current_status_date: string;
    date_status_launch: string;
    date_status_end: string;
    label: string;
  }
  
  export interface InventoryAction {
    label: string;
    icon: any;
    class: string;
    handler: (row: InventoryManagement) => void | Promise<void>;
  }
  
  export interface InventoryColumn {
    headerName: string;
    field: string;
    sortable: boolean;
    filter: string;
  }