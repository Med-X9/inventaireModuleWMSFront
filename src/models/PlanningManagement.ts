// src/models/PlanningManagement.ts

// Interface pour les données d'un warehouse
export interface WarehouseStats {
    warehouse_id: number;
    warehouse_reference: string;
    warehouse_name: string;
    jobs_count: number;
    teams_count: number;
}

// Interface pour la réponse de l'API de gestion du planning
export interface PlanningManagementResponse {
    status: 'success' | 'error';
    message: string;
    inventory_id: number;
    warehouses_count: number;
    data: WarehouseStats[];
}

// Interface pour les filtres de recherche
export interface PlanningManagementFilters {
    inventory_id?: number;
    warehouse_id?: number;
    status?: string;
}

// Interface pour les statistiques globales
export interface GlobalPlanningStats {
    total_warehouses: number;
    total_jobs: number;
    total_teams: number;
    active_warehouses: number;
    warehouses_with_jobs: number;
    warehouses_with_teams: number;
}

// Interface pour les actions de planning
export interface PlanningAction {
    label: string;
    icon?: any;
    handler: (warehouse: WarehouseStats) => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'info' | 'success';
    disabled?: boolean;
}

// Interface pour les colonnes de tableau
export interface PlanningColumn {
    headerName: string;
    field: string;
    sortable?: boolean;
    filter?: string;
    width?: number;
    cellRenderer?: (params: any) => string;
}

// Interface pour les données formatées pour l'affichage
export interface FormattedWarehouseData {
    id: number;
    reference: string;
    name: string;
    jobsCount: number;
    teamsCount: number;
    status: 'active' | 'inactive' | 'maintenance';
    lastActivity?: string;
}

// Interface pour les métadonnées de pagination
export interface PlanningPagination {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
}

// Interface pour les réponses paginées
export interface PaginatedPlanningResponse<T> {
    status: 'success' | 'error';
    message: string;
    data: T[];
    pagination: PlanningPagination;
}

// Interface pour les paramètres de requête
export interface PlanningQueryParams {
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    filters?: PlanningManagementFilters;
}

// Interface pour les options de tri
export interface PlanningSortOptions {
    field: string;
    order: 'asc' | 'desc';
}

// Interface pour les filtres avancés
export interface AdvancedPlanningFilters extends PlanningManagementFilters {
    date_from?: string;
    date_to?: string;
    jobs_min?: number;
    jobs_max?: number;
    teams_min?: number;
    teams_max?: number;
    search?: string;
}

// Interface pour les statistiques détaillées par warehouse
export interface DetailedWarehouseStats extends WarehouseStats {
    jobs_by_status: {
        pending: number;
        in_progress: number;
        completed: number;
        cancelled: number;
    };
    teams_by_status: {
        active: number;
        inactive: number;
        assigned: number;
    };
    last_job_date?: string;
    last_team_assignment?: string;
    completion_rate?: number;
    efficiency_score?: number;
}

// Interface pour les métriques de performance
export interface PerformanceMetrics {
    warehouse_id: number;
    warehouse_name: string;
    jobs_completion_rate: number;
    average_job_duration: number;
    team_utilization_rate: number;
    on_time_delivery_rate: number;
    quality_score: number;
    efficiency_score: number;
}

// Interface pour les rapports de planning
export interface PlanningReport {
    report_id: string;
    report_type: 'daily' | 'weekly' | 'monthly' | 'custom';
    generated_at: string;
    period_start: string;
    period_end: string;
    inventory_id: number;
    summary: {
        total_warehouses: number;
        total_jobs: number;
        total_teams: number;
        completed_jobs: number;
        pending_jobs: number;
        overall_completion_rate: number;
    };
    details: DetailedWarehouseStats[];
    performance_metrics: PerformanceMetrics[];
}

// Interface pour les notifications de planning
export interface PlanningNotification {
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    warehouse_id?: number;
    job_id?: number;
    team_id?: number;
    created_at: string;
    read: boolean;
    action_required: boolean;
}

// Interface pour les événements de planning
export interface PlanningEvent {
    id: string;
    event_type: 'job_created' | 'job_completed' | 'team_assigned' | 'team_removed' | 'warehouse_updated';
    warehouse_id: number;
    warehouse_name: string;
    job_id?: number;
    team_id?: number;
    user_id?: number;
    user_name?: string;
    timestamp: string;
    details: Record<string, any>;
}

// Interface pour les logs d'activité
export interface PlanningActivityLog {
    id: string;
    action: string;
    entity_type: 'warehouse' | 'job' | 'team' | 'planning';
    entity_id: number;
    user_id: number;
    user_name: string;
    timestamp: string;
    changes?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
}

// Interface pour les exports de données
export interface PlanningExportOptions {
    format: 'csv' | 'excel' | 'pdf' | 'json';
    filters?: AdvancedPlanningFilters;
    columns?: string[];
    include_summary?: boolean;
    include_details?: boolean;
    date_range?: {
        start: string;
        end: string;
    };
}

// Interface pour les paramètres de configuration
export interface PlanningConfig {
    auto_refresh_interval: number;
    default_page_size: number;
    max_page_size: number;
    enable_real_time_updates: boolean;
    enable_notifications: boolean;
    default_sort_field: string;
    default_sort_order: 'asc' | 'desc';
    available_filters: string[];
    export_formats: string[];
}
