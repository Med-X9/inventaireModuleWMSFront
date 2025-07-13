// Interfaces pour le planning management
export interface Store {
    id: number;
    store_name: string;
    teams_count: number;
    jobs_count: number;
    reference: string;
}

export interface PlanningAction {
    label: string;
    icon: any;
    handler: (store: Store) => void;
}

export type ViewModeType = 'table' | 'grid';

export interface GridDataItem {
    id: number;
    store_name: string;
    teams_count: number;
    jobs_count: number;
    reference: string;
}

export interface Action<T> {
    label: string;
    icon: any;
    handler: (item: T) => void;
    variant?: 'primary' | 'secondary' | 'danger';
}

export interface ActionConfig {
    label: string;
    icon: any;
    onClick: (row: Record<string, unknown>) => void;
    color: 'primary' | 'secondary' | 'danger';
}
