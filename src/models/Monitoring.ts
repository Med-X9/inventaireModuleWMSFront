/**
 * Types pour le monitoring d'inventaire
 */

/**
 * Assignment dans un comptage
 */
export interface CountingAssignment {
    status: 'TERMINE' | 'ENTAME' | 'TRANSFERT'
    count: number
    percentage: number
}

/**
 * Réponse d'un comptage dans le monitoring par zone
 */
export interface CountingMonitoring {
    counting_id: number
    counting_reference: string
    counting_order: number
    assignments?: CountingAssignment[]
}

/**
 * Réponse d'une zone dans le monitoring
 */
export interface ZoneMonitoringResponse {
    zone_id: number
    zone_reference: string
    zone_name: string
    status: string
    nombre_equipes: number
    nombre_jobs: number
    nombre_emplacements: number
    countings: CountingMonitoring[]
}

/**
 * Réponse du monitoring par zone
 */
export interface MonitoringByZoneResponse {
    success: boolean
    message: string
    data: {
        zones: ZoneMonitoringResponse[]
    }
}

/**
 * Réponse d'un comptage dans le monitoring global
 */
export interface GlobalCountingMonitoring {
    counting_id: number
    counting_order: number
    jobs_termines: number
    jobs_termines_percent: number
}

/**
 * Réponse du monitoring global
 */
export interface GlobalMonitoringResponse {
    success: boolean
    message: string
    data: {
        total_equipes: number
        total_jobs: number
        countings: GlobalCountingMonitoring[]
    }
}

/**
 * Données transformées pour l'affichage - Zone
 */
export interface ZoneMonitoringData {
    zoneId: number
    zoneName: string
    zoneDescription: string
    nombreEquipes: number
    totalJobs: number
    totalEmplacements: number
    premierComptage: {
        cloture: number
        cloturePourcentage: number
        enCours: number
        enCoursPourcentage: number
        nonEntame: number
        nonEntamePourcentage: number
    }
    deuxiemeComptage: {
        cloture: number
        cloturePourcentage: number
        enCours: number
        enCoursPourcentage: number
        nonEntame: number
        nonEntamePourcentage: number
    }
    troisiemeComptage: {
        jobs: number
        termine: number
        terminePourcentage: number
        enCours: number
        enCoursPourcentage: number
        nonEntame: number
        nonEntamePourcentage: number
    }
    statusLed: 'success' | 'warning' | 'danger' | 'info'
}

/**
 * Données transformées pour l'affichage - Total
 */
export interface MonitoringTotalData {
    nombreEquipes: number
    totalJobs: number
    premierComptage: {
        cloture: number
        cloturePourcentage: number
        enCours: number
        enCoursPourcentage: number
        nonEntame: number
        nonEntamePourcentage: number
    }
    deuxiemeComptage: {
        cloture: number
        cloturePourcentage: number
        enCours: number
        enCoursPourcentage: number
        nonEntame: number
        nonEntamePourcentage: number
    }
    troisiemeComptage: {
        jobs: number
        termine: number
        terminePourcentage: number
        enCours: number
        enCoursPourcentage: number
        nonEntame: number
        nonEntamePourcentage: number
    }
}

/**
 * Données complètes de monitoring pour l'affichage
 */
export interface MonitoringStats {
    zones: ZoneMonitoringData[]
    total: MonitoringTotalData
}

