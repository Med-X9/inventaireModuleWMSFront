/**
 * Modèle CountingDetail
 * Représente les données de synchronisation pour un utilisateur mobile
 */

/**
 * Inventaire dans les données de synchronisation
 */
export interface SyncInventory {
    web_id: number
    reference: string
    label: string
    date: string
    status: string
    inventory_type: string
    warehouse_web_id: number
    warehouse_name: string
    en_preparation_status_date: string | null
    en_realisation_status_date: string | null
    termine_status_date: string | null
    cloture_status_date: string | null
    created_at: string
    updated_at: string
}

/**
 * Détail de job dans les données de synchronisation
 */
export interface SyncJobDetail {
    web_id: number
    reference: string
    status: string
    location_web_id: number
    location_reference: string
    counting_web_id: number
}

/**
 * Job dans les données de synchronisation
 */
export interface SyncJob {
    web_id: number
    reference: string
    status: string
    inventory_web_id: number
    warehouse_web_id: number
    job_details: SyncJobDetail[]
    en_attente_date: string | null
    affecte_date: string | null
    pret_date: string | null
    transfert_date: string | null
    entame_date: string | null
    valide_date: string | null
    termine_date: string | null
    created_at: string
    updated_at: string
}

/**
 * Assignment dans les données de synchronisation
 */
export interface SyncAssignment {
    web_id: number
    reference: string
    status: string
    job_web_id: number
    personne_web_id: number
    personne_two_web_id: number | null
    counting_web_id: number
    session_web_id: number
    transfert_date: string | null
    entame_date: string | null
    affecte_date: string | null
    pret_date: string | null
    date_start: string | null
    created_at: string
    updated_at: string
}

/**
 * Counting dans les données de synchronisation
 */
export interface SyncCounting {
    web_id: number
    reference: string
    order: number
    count_mode: string
    unit_scanned: boolean
    entry_quantity: number
    is_variant: boolean
    n_lot: boolean | null
    n_serie: boolean | null
    dlc: boolean | null
    show_product: boolean
    stock_situation: string
    quantity_show: number
    inventory_web_id: number
    created_at: string
    updated_at: string
}

/**
 * Données de synchronisation complètes
 */
export interface SyncData {
    inventories: SyncInventory[]
    jobs: SyncJob[]
    assignments: SyncAssignment[]
    countings: SyncCounting[]
}

/**
 * Réponse interne de synchronisation
 */
export interface SyncResponseData {
    success: boolean
    sync_id: string
    timestamp: string
    data: SyncData
}

/**
 * Réponse complète de l'API de synchronisation
 */
export interface CountingDetailResponse {
    success: boolean
    message: string
    data: SyncResponseData
}

/**
 * Paramètres pour la requête de synchronisation
 */
export interface GetCountingDetailRequest {
    params?: Record<string, any>
}

