/**
 * Types KPI magasin — alignés sur INVENTORY_KPI_CATALOG.md
 */

export interface KpiBucketCount {
    count: number
    percent: number
}

export interface JobsTerminesByCounting {
    counting_order: number
    jobs_termines: number
    jobs_eligibles: number
    percent: number
}

export interface AssignmentsByCounting {
    counting_order: number
    total_assignments?: number
    en_attente: KpiBucketCount
    en_cours: KpiBucketCount
    termine: KpiBucketCount
}

export interface TeamCountingRate {
    percent: number
    termines: number
    total: number
}

export interface TeamMultiDiscrepancy {
    open_discrepancies_count: number
    is_multi_discrepancy: boolean
}

export interface TeamJobsWithDiscrepancy {
    jobs_with_discrepancy_count: number
}

export interface InventoryKpiTeam {
    team_key: string
    username?: string | null
    'KPI-T02'?: TeamCountingRate
    'KPI-T03'?: TeamCountingRate
    'KPI-T04'?: AssignmentsByCounting
    'KPI-T05'?: AssignmentsByCounting
    'KPI-T06'?: TeamMultiDiscrepancy
    'KPI-T07'?: TeamJobsWithDiscrepancy
}

export interface TeamsSummaryT06 {
    count: number
    team_keys?: string[]
}

export interface InventoryKpiVolume {
    'KPI-A01'?: number
    'KPI-A02'?: number
    'KPI-A03'?: number
}

export interface InventoryKpiDiscrepancies {
    'KPI-D01'?: number
    'KPI-D02'?: number
    'KPI-D03'?: number
    'KPI-D04'?: number
}

export interface InventoryKpiTeamsSummary {
    'KPI-T01'?: number
    'KPI-T06'?: TeamsSummaryT06 | number
}

export interface InventoryKpiData {
    volume?: InventoryKpiVolume
    jobs_termines_by_counting?: Record<string, JobsTerminesByCounting>
    assignments_by_counting?: Record<string, AssignmentsByCounting>
    discrepancies?: InventoryKpiDiscrepancies
    teams_summary?: InventoryKpiTeamsSummary
    teams?: InventoryKpiTeam[]
}

export interface InventoryKpiMeta {
    inventory_id: number
    warehouse_id: number
    warehouse_name?: string
    generated_at?: string
}

export interface InventoryKpiApiResponse {
    success?: boolean
    message?: string
    meta?: InventoryKpiMeta
    data?: InventoryKpiData
}
