import type { InventoryManagement } from './inventoryManagement';

export interface JobDetail extends Record<string, unknown> {
    name: string;
    status: string;
    date: string;
    operator: string;
}

export interface DetailData {
    inventory: InventoryManagement;
    magasins: string[];
    jobsData?: Record<string, JobDetail[]>;
    teams?: any[];
}
