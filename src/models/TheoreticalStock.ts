/**
 * Types API — stock théorique (import Excel) et écarts stock
 * @see api docs.md
 */

export type StockImportTaskStatus =
    | 'PENDING'
    | 'VALIDATING'
    | 'PROCESSING'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'FAILED'

export interface StockImportTaskError {
    row?: number
    message?: string
    type?: string
}

export interface StockImportTaskData {
    import_task_id: number
    status: StockImportTaskStatus
    file_name?: string
    inventory_id?: number
    warehouse_id?: number
    inventory_type?: string
    total_rows?: number
    processed_rows?: number
    validated_rows?: number
    imported_count?: number
    error_count?: number
    error_message?: string | null
    created_at?: string
    errors?: StockImportTaskError[]
}

export interface StockImportStartResponse {
    success: boolean
    message: string
    data: StockImportTaskData
}

export interface StockImportStatusResponse {
    success: boolean
    message: string
    data: StockImportTaskData
}

export interface StockGapRow {
    ecart_id: number
    cle: string
    designation: string
    qte_theorique: number
    qte_inventoriee: number
    ecart: number
    resultat_final: number | null
    valide: boolean
    /** Identifiants DataTable (sélection / actions) */
    id?: number
    _rowId?: string
}

export interface StockGapTotaux {
    qte_theorique: number
    qte_inventoriee: number
    ecart: number
    nombre_lignes: number
    nombre_valides: number
}

export interface StockGapResponse {
    rows: StockGapRow[]
    total: number
    page: number
    pageSize: number
    totalPages: number
    inventory_id?: number
    warehouse_id?: number
    source?: string
    totaux?: StockGapTotaux
}

/** Détail écart stock théorique (PATCH / POST valider) */
export interface EcartStockDetail {
    id: number
    reference: string
    inventory: number
    warehouse: number
    warehouse_name?: string
    article_cle: string
    mode_groupement?: string
    designation?: string
    product?: number | null
    qte_theorique: number
    qte_pratique: number
    ecart: number
    resultat_final: number | null
    valide: boolean
    validated_at?: string | null
    validated_by?: number | null
    validated_by_username?: string | null
    created_at?: string
    updated_at?: string
}

export interface EcartStockMutationResponse {
    success: boolean
    message: string
    data?: EcartStockDetail
    errors?: Record<string, string[]>
}

export interface EcartStockBulkValidatedItem {
    id: number
    article_cle?: string
    resultat_final?: number | null
    valide?: boolean
}

export interface EcartStockBulkFailedItem {
    id?: number
    ecart_id?: number
    message?: string
    error?: string
}

export interface EcartStockBulkValidateData {
    requested_count: number
    validated_count: number
    failed_count: number
    validated: EcartStockBulkValidatedItem[]
    failed: EcartStockBulkFailedItem[]
    success: boolean
}

export interface EcartStockBulkValidateResponse {
    success: boolean
    message: string
    data?: EcartStockBulkValidateData
    errors?: Record<string, string[]>
}
