export interface Store {
    id: number;
    store_name: string;
  }
  
  export interface PlanningAction {
    label: string;
    icon: any;
    handler: (row: Store) => void;
  }
  
  export interface ViewMode {
    table: 'table';
    grid: 'grid';
  }
  
  export type ViewModeType = keyof ViewMode;