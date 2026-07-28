/**
 * Types KPI magasin — alignés sur KPIS_INVENTAIRE_PAR_WAREHOUSE.md
 * Endpoints individuels : GET .../kpis/{slug}/
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

export interface MagasinStatusBucket {
    count: number
    percent: number
}

export interface MagasinsByStatus {
    total_magasins: number
    by_status: Record<string, MagasinStatusBucket>
}

export interface StockGapsSummary {
    total?: number
    with_gap?: number
    without_gap?: number
    count?: number
    percent?: number
    valides?: number
    total_lignes?: number
}

export interface InventoryKpiStores {
    'KPI-S01'?: number
    'KPI-S02'?: MagasinsByStatus
}

export interface InventoryKpiStockGaps {
    'KPI-E01'?: StockGapsSummary | number
    'KPI-E02'?: StockGapsSummary | number
}

export interface InventoryKpiData {
    volume?: InventoryKpiVolume
    jobs_termines_by_counting?: Record<string, JobsTerminesByCounting>
    assignments_by_counting?: Record<string, AssignmentsByCounting>
    discrepancies?: InventoryKpiDiscrepancies
    teams_summary?: InventoryKpiTeamsSummary
    teams?: InventoryKpiTeam[]
    stores?: InventoryKpiStores
    stock_gaps?: InventoryKpiStockGaps
}

export interface InventoryKpiMeta {
    inventory_id: number
    warehouse_id?: number | null
    warehouse_name?: string | null
    scope?: 'inventory' | 'warehouse'
    aggregation?: string | null
    generated_at?: string
}

/** Meta renvoyée par un endpoint KPI individuel */
export interface InventoryKpiEndpointMeta {
    catalog_id?: string
    slug?: string
    /** Slug KPI (champ backend actuel) */
    kpi?: string
    label?: string
    generated_at?: string
    inventory_id?: number
    warehouse_id?: number | null
    warehouse_name?: string | null
    scope?: 'inventory' | 'warehouse'
    aggregation?: string | null
}

export interface InventoryKpiSingleResponse {
    success?: boolean
    message?: string
    meta?: InventoryKpiEndpointMeta
    data?: unknown
}

/** Réponse agrégée côté front (compat dashboard) */
export interface InventoryKpiApiResponse {
    success?: boolean
    message?: string
    meta?: InventoryKpiMeta
    data?: InventoryKpiData
}

export type InventoryKpiCatalogId =
    | 'KPI-A01'
    | 'KPI-A02'
    | 'KPI-A03'
    | 'KPI-B01'
    | 'KPI-B02'
    | 'KPI-C01'
    | 'KPI-C02'
    | 'KPI-C03'
    | 'KPI-C04'
    | 'KPI-D01'
    | 'KPI-D02'
    | 'KPI-D03'
    | 'KPI-D04'
    | 'KPI-T01'
    | 'KPI-T02'
    | 'KPI-T03'
    | 'KPI-T04'
    | 'KPI-T05'
    | 'KPI-T06'
    | 'KPI-T07'
    | 'KPI-S01'
    | 'KPI-S02'
    | 'KPI-E01'
    | 'KPI-E02'

export type InventoryKpiCategory =
    | 'volume'
    | 'jobs_termines'
    | 'assignments'
    | 'discrepancies'
    | 'teams'
    | 'stores'
    | 'stock_gaps'

export interface InventoryKpiEndpointDef {
    catalogId: InventoryKpiCatalogId
    slug: string
    /** Clé métier renvoyée dans `data` par le backend */
    dataKey: string
    category: InventoryKpiCategory
}
