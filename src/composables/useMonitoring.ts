import { ref, computed, onMounted, onUnmounted, watch, nextTick, readonly } from 'vue'
import { useRoute } from 'vue-router'
import { useMonitoringStore } from '@/stores/monitoring'
import type {
    ZoneMonitoringResponse,
    GlobalMonitoringResponse,
    CountingMonitoring,
    GlobalCountingMonitoring
} from '@/models/Monitoring'
import type { JobResult } from '@/models/Job'

// État réactif pour les zones récupérées depuis l'API
const zonesPredefinies = ref<Array<{
    id: number
    name: string
    description: string
}>>([])


// Fonction pour calculer le statut LED d'une zone
const calculerStatusLed = (zone: ZoneMonitoringData): 'success' | 'warning' | 'danger' | 'info' => {
    const totalJobs = zone.totalJobs
    if (totalJobs === 0) return 'info'

    // Calculer le pourcentage terminé (clôturé)
    const premierTermine = zone.premierComptage.cloture
    const deuxiemeTermine = zone.deuxiemeComptage.cloture
    const troisiemeTermine = zone.troisiemeComptage.termine

    // Si le 3ème comptage a commencé, on se base dessus
    if (troisiemeTermine > 0 || zone.troisiemeComptage.enCours > 0) {
        const troisiemePourcentage = (troisiemeTermine / zone.troisiemeComptage.jobs) * 100
        if (troisiemePourcentage >= 80) return 'success'
        if (troisiemePourcentage >= 50) return 'warning'
        return 'danger'
    }

    // Si le 2ème comptage est terminé, excellent
    if (deuxiemeTermine === totalJobs) return 'success'

    // Si le 1er comptage n'est pas terminé, danger
    if (premierTermine < totalJobs) return 'danger'

    // Si le 2ème comptage a commencé mais n'est pas terminé
    if (zone.deuxiemeComptage.enCours > 0 || zone.deuxiemeComptage.cloture > 0) {
        return 'warning'
    }

    // Par défaut
    return 'info'
}

export interface ZoneMonitoringData {
    zoneId: number
    zoneName: string
    zoneDescription: string
    nombreEquipes: number
    totalJobs: number
    // Total des emplacements liés à la zone
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

export interface MonitoringStats {
    zones: ZoneMonitoringData[]
    total: MonitoringTotalData
}

/**
 * Options pour initialiser le composable de monitoring
 */
interface MonitoringOptions {
    inventoryId?: number
    warehouseId?: number
}

export function useMonitoring(options?: MonitoringOptions) {
    const route = useRoute()
    const monitoringStore = useMonitoringStore()

    // Récupérer les IDs depuis les options ou la route
    const inventoryId = computed(() => {
        if (options?.inventoryId) return options.inventoryId
        const routeId = route.params.inventoryId
        if (!routeId) return null
        // Gérer le cas où routeId est un string ou un array
        const idStr = Array.isArray(routeId) ? routeId[0] : routeId
        const idNum = Number(idStr)
        return isNaN(idNum) ? null : idNum
    })

    const warehouseId = computed(() => {
        if (options?.warehouseId) return options.warehouseId
        const routeId = route.params.warehouseId
        if (!routeId) return null
        // Gérer le cas où routeId est un string ou un array
        const idStr = Array.isArray(routeId) ? routeId[0] : routeId
        const idNum = Number(idStr)
        return isNaN(idNum) ? null : idNum
    })

    const loading = computed(() => monitoringStore.loading)
    const monitoringData = ref<MonitoringStats | null>(null)
    const refreshInterval = ref<NodeJS.Timeout | null>(null)
    const autoRefreshEnabled = ref(true)
    const refreshIntervalMs = ref(120000) // 2 minutes par défaut



    /**
     * Analyse les jobs et calcule les statistiques par zone
     */
    const analyserJobsParZone = (jobs: JobResult[]): ZoneMonitoringData[] => {
        const zonesMap = new Map<number, ZoneMonitoringData>()

        // Initialiser les zones
        zonesPredefinies.value.forEach(zone => {
            zonesMap.set(zone.id, {
                zoneId: zone.id,
                zoneName: zone.name,
                zoneDescription: zone.description,
                nombreEquipes: 0,
                totalJobs: 0,
                totalEmplacements: 0,
                premierComptage: {
                    cloture: 0,
                    cloturePourcentage: 0,
                    enCours: 0,
                    enCoursPourcentage: 0,
                    nonEntame: 0,
                    nonEntamePourcentage: 0
                },
                deuxiemeComptage: {
                    cloture: 0,
                    cloturePourcentage: 0,
                    enCours: 0,
                    enCoursPourcentage: 0,
                    nonEntame: 0,
                    nonEntamePourcentage: 0
                },
                troisiemeComptage: {
                    jobs: 0,
                    termine: 0,
                    terminePourcentage: 0,
                    enCours: 0,
                    enCoursPourcentage: 0,
                    nonEntame: 0,
                    nonEntamePourcentage: 0
                },
                statusLed: 'info'
            })
        })

        // Analyser chaque job
        jobs.forEach(job => {
            // Grouper par zone en utilisant les emplacements
            const zonesJob = new Set<number>()

            job.emplacements?.forEach(emplacement => {
                // Extraire le numéro de zone depuis zone_name (ex: "Zone 1" -> 1)
                const zoneName = emplacement.zone?.zone_name || ''
                const zoneMatch = zoneName.match(/Zone\s*(\d+)/i)

                if (zoneMatch) {
                    const zoneId = parseInt(zoneMatch[1], 10)
                    if (zoneId >= 1 && zoneId <= 9) {
                        zonesJob.add(zoneId)
                        const zoneData = zonesMap.get(zoneId)
                        if (zoneData) {
                            zoneData.totalEmplacements++
                        }
                    }
                } else {
                    // Si le nom de zone ne correspond pas au pattern, essayer de mapper par nom
                    const zoneNameLower = zoneName.toLowerCase()
                    if (zoneNameLower.includes('reserve') || zoneNameLower.includes('rack')) {
                        zonesJob.add(1) // Zone 1 - Reserve Rack
                        const zoneData = zonesMap.get(1)
                        if (zoneData) {
                            zoneData.totalEmplacements++
                        }
                    } else if (zoneNameLower.includes('picking')) {
                        zonesJob.add(2) // Zone 2 - Picking Rack
                        const zoneData = zonesMap.get(2)
                        if (zoneData) {
                            zoneData.totalEmplacements++
                        }
                    } else if (zoneNameLower.includes('mezza') && zoneNameLower.includes('1')) {
                        zonesJob.add(3) // Zone 3 - Mezza 1
                        const zoneData = zonesMap.get(3)
                        if (zoneData) {
                            zoneData.totalEmplacements++
                        }
                    } else if (zoneNameLower.includes('mezza') && zoneNameLower.includes('2')) {
                        zonesJob.add(4) // Zone 4 - Mezza 2
                        const zoneData = zonesMap.get(4)
                        if (zoneData) {
                            zoneData.totalEmplacements++
                        }
                    } else if (zoneNameLower.includes('mezza') && zoneNameLower.includes('3')) {
                        zonesJob.add(5) // Zone 5 - Mezza 3
                        const zoneData = zonesMap.get(5)
                        if (zoneData) {
                            zoneData.totalEmplacements++
                        }
                    } else if (zoneNameLower.includes('cellule')) {
                        zonesJob.add(6) // Zone 6 - Cellule
                        const zoneData = zonesMap.get(6)
                        if (zoneData) {
                            zoneData.totalEmplacements++
                        }
                    } else {
                        // Zone par défaut si aucune correspondance
                        zonesJob.add(1)
                        const zoneData = zonesMap.get(1)
                        if (zoneData) {
                            zoneData.totalEmplacements++
                        }
                    }
                }
            })

            // Si aucune zone trouvée, distribuer dans toutes les zones ou zone 1 par défaut
            if (zonesJob.size === 0) {
                zonesJob.add(1) // Zone par défaut
            }

            // Analyser les assignments (comptages)
            const premierAssignment = job.assignments?.find(a => a.counting_order === 1)
            const deuxiemeAssignment = job.assignments?.find(a => a.counting_order === 2)
            const troisiemeAssignment = job.assignments?.find(a => a.counting_order === 3)

            // Compter les équipes (sessions uniques)
            const sessionsUniques = new Set<number>()
            job.assignments?.forEach(assignment => {
                if (assignment.session?.id) {
                    sessionsUniques.add(assignment.session.id)
                }
            })

            // Mettre à jour chaque zone concernée
            zonesJob.forEach(zoneId => {
                const zoneData = zonesMap.get(zoneId)
                if (!zoneData) return

                zoneData.totalJobs++
                zoneData.nombreEquipes = Math.max(zoneData.nombreEquipes, sessionsUniques.size)

                // Premier comptage
                if (premierAssignment) {
                    if (premierAssignment.status === 'TERMINE' || premierAssignment.status === 'CLOTURE') {
                        zoneData.premierComptage.cloture++
                    } else if (premierAssignment.status === 'EN COURS' || premierAssignment.status === 'ENTAME') {
                        zoneData.premierComptage.enCours++
                    } else {
                        zoneData.premierComptage.nonEntame++
                    }
                } else {
                    zoneData.premierComptage.nonEntame++
                }

                // Deuxième comptage
                if (deuxiemeAssignment) {
                    if (deuxiemeAssignment.status === 'TERMINE' || deuxiemeAssignment.status === 'CLOTURE') {
                        zoneData.deuxiemeComptage.cloture++
                    } else if (deuxiemeAssignment.status === 'EN COURS' || deuxiemeAssignment.status === 'ENTAME') {
                        zoneData.deuxiemeComptage.enCours++
                    } else {
                        zoneData.deuxiemeComptage.nonEntame++
                    }
                } else {
                    zoneData.deuxiemeComptage.nonEntame++
                }

                // Troisième comptage
                if (troisiemeAssignment) {
                    if (troisiemeAssignment.status === 'TERMINE' || troisiemeAssignment.status === 'CLOTURE') {
                        zoneData.troisiemeComptage.termine++
                    } else if (troisiemeAssignment.status === 'EN COURS' || troisiemeAssignment.status === 'ENTAME') {
                        zoneData.troisiemeComptage.enCours++
                    } else {
                        zoneData.troisiemeComptage.nonEntame++
                    }
                    zoneData.troisiemeComptage.jobs = zoneData.troisiemeComptage.termine + zoneData.troisiemeComptage.enCours + zoneData.troisiemeComptage.nonEntame
                }
            })
        })

        // Calculer les pourcentages et statuts LED
        zonesMap.forEach(zone => {
            if (zone.totalJobs > 0) {
                // Premier comptage
                zone.premierComptage.cloturePourcentage = Math.round(
                    (zone.premierComptage.cloture / zone.totalJobs) * 100
                )
                zone.premierComptage.enCoursPourcentage = Math.round(
                    (zone.premierComptage.enCours / zone.totalJobs) * 100
                )
                zone.premierComptage.nonEntamePourcentage = Math.round(
                    (zone.premierComptage.nonEntame / zone.totalJobs) * 100
                )

                // Deuxième comptage
                zone.deuxiemeComptage.cloturePourcentage = Math.round(
                    (zone.deuxiemeComptage.cloture / zone.totalJobs) * 100
                )
                zone.deuxiemeComptage.enCoursPourcentage = Math.round(
                    (zone.deuxiemeComptage.enCours / zone.totalJobs) * 100
                )
                zone.deuxiemeComptage.nonEntamePourcentage = Math.round(
                    (zone.deuxiemeComptage.nonEntame / zone.totalJobs) * 100
                )
            }

            // Calculer le total jobs du 3e comptage comme somme des 3 statuts
            zone.troisiemeComptage.jobs = zone.troisiemeComptage.termine + zone.troisiemeComptage.enCours + zone.troisiemeComptage.nonEntame

            // Troisième comptage - calculer les pourcentages basés sur le total jobs du 3e comptage
            if (zone.troisiemeComptage.jobs > 0) {
                zone.troisiemeComptage.terminePourcentage = Math.round(
                    (zone.troisiemeComptage.termine / zone.troisiemeComptage.jobs) * 100
                )
                zone.troisiemeComptage.enCoursPourcentage = Math.round(
                    (zone.troisiemeComptage.enCours / zone.troisiemeComptage.jobs) * 100
                )
                zone.troisiemeComptage.nonEntamePourcentage = Math.round(
                    (zone.troisiemeComptage.nonEntame / zone.troisiemeComptage.jobs) * 100
                )
            }

            zone.statusLed = calculerStatusLed(zone)
        })

        return Array.from(zonesMap.values())
    }

    /**
     * Calcule les totaux globaux
     */
    const calculerTotaux = (zones: ZoneMonitoringData[]) => {
        const total = {
            nombreEquipes: 0,
            totalJobs: 0,
            premierComptage: {
                cloture: 0,
                cloturePourcentage: 0,
                enCours: 0,
                enCoursPourcentage: 0,
                nonEntame: 0,
                nonEntamePourcentage: 0
            },
            deuxiemeComptage: {
                cloture: 0,
                cloturePourcentage: 0,
                enCours: 0,
                enCoursPourcentage: 0,
                nonEntame: 0,
                nonEntamePourcentage: 0
            },
            troisiemeComptage: {
                jobs: 0,
                termine: 0,
                terminePourcentage: 0,
                enCours: 0,
                enCoursPourcentage: 0,
                nonEntame: 0,
                nonEntamePourcentage: 0
            }
        }

        zones.forEach(zone => {
            total.nombreEquipes += zone.nombreEquipes
            total.totalJobs += zone.totalJobs
            total.premierComptage.cloture += zone.premierComptage.cloture
            total.premierComptage.enCours += zone.premierComptage.enCours
            total.premierComptage.nonEntame += zone.premierComptage.nonEntame
            total.deuxiemeComptage.cloture += zone.deuxiemeComptage.cloture
            total.deuxiemeComptage.enCours += zone.deuxiemeComptage.enCours
            total.deuxiemeComptage.nonEntame += zone.deuxiemeComptage.nonEntame
            total.troisiemeComptage.jobs += zone.troisiemeComptage.jobs
            total.troisiemeComptage.termine += zone.troisiemeComptage.termine
            total.troisiemeComptage.enCours += zone.troisiemeComptage.enCours
            total.troisiemeComptage.nonEntame += zone.troisiemeComptage.nonEntame
        })

        if (total.totalJobs > 0) {
            total.premierComptage.cloturePourcentage = Math.round(
                (total.premierComptage.cloture / total.totalJobs) * 100
            )
            total.premierComptage.enCoursPourcentage = Math.round(
                (total.premierComptage.enCours / total.totalJobs) * 100
            )
            total.premierComptage.nonEntamePourcentage = Math.round(
                (total.premierComptage.nonEntame / total.totalJobs) * 100
            )

            // Deuxième comptage
            total.deuxiemeComptage.cloturePourcentage = Math.round(
                (total.deuxiemeComptage.cloture / total.totalJobs) * 100
            )
            total.deuxiemeComptage.enCoursPourcentage = Math.round(
                (total.deuxiemeComptage.enCours / total.totalJobs) * 100
            )
            total.deuxiemeComptage.nonEntamePourcentage = Math.round(
                (total.deuxiemeComptage.nonEntame / total.totalJobs) * 100
            )
        }

        // Troisième comptage
        if (total.troisiemeComptage.jobs > 0) {
            total.troisiemeComptage.terminePourcentage = Math.round(
                (total.troisiemeComptage.termine / total.troisiemeComptage.jobs) * 100
            )
            total.troisiemeComptage.enCoursPourcentage = Math.round(
                (total.troisiemeComptage.enCours / total.troisiemeComptage.jobs) * 100
            )
            total.troisiemeComptage.nonEntamePourcentage = Math.round(
                (total.troisiemeComptage.nonEntame / total.troisiemeComptage.jobs) * 100
            )
        }

        return total
    }

    /**
     * Génère des données mock logiques pour le monitoring
     */
    const genererDonneesMock = (): MonitoringStats => {
        const zones: ZoneMonitoringData[] = zonesPredefinies.value.map((zone, index) => {
            // Générer des données proches du réel : gros volume de jobs, quelques équipes
            const baseJobs = [120, 80, 150, 200, 180, 60, 90, 110, 70][index] || 120
            const baseEquipes = [16, 6, 8, 10, 12, 4, 5, 7, 4][index] || 6

            // 1er comptage : généralement bien avancé (60–90% clôturé)
            const cloture = Math.floor(baseJobs * (0.6 + Math.random() * 0.3))
            const enCours = Math.floor(baseJobs * (0.05 + Math.random() * 0.15)) // 5–20% en cours
            const nonEntame = baseJobs - cloture - enCours

            const cloturePourcentage = Math.round((cloture / baseJobs) * 100)
            const enCoursPourcentage = Math.round((enCours / baseJobs) * 100)
            const nonEntamePourcentage = Math.round((nonEntame / baseJobs) * 100)

            // 2e comptage : moins avancé que le 1er (20–60% des jobs)
            const deuxiemeCloture = Math.floor(baseJobs * (0.2 + Math.random() * 0.4))
            const deuxiemeEnCours = Math.floor(baseJobs * (0.1 + Math.random() * 0.2))
            const deuxiemeNonEntame = baseJobs - deuxiemeCloture - deuxiemeEnCours
            const deuxiemeCloturePourcentage = Math.round((deuxiemeCloture / baseJobs) * 100)
            const deuxiemeEnCoursPourcentage = Math.round((deuxiemeEnCours / baseJobs) * 100)
            const deuxiemeNonEntamePourcentage = Math.round((deuxiemeNonEntame / baseJobs) * 100)

            // 3e comptage : très peu de jobs (3–10% du total)
            const troisiemeJobs = Math.max(1, Math.floor(baseJobs * (0.03 + Math.random() * 0.07)))
            const troisiemeTermine = Math.floor(troisiemeJobs * (0.5 + Math.random() * 0.3)) // 50–80% terminé
            const troisiemeEnCours = Math.floor(troisiemeJobs * (0.1 + Math.random() * 0.2)) // 10–30% en cours
            const troisiemeNonEntame = Math.max(0, troisiemeJobs - troisiemeTermine - troisiemeEnCours)
            const troisiemeTerminePourcentage = troisiemeJobs > 0 ? Math.round((troisiemeTermine / troisiemeJobs) * 100) : 0
            const troisiemeEnCoursPourcentage = troisiemeJobs > 0 ? Math.round((troisiemeEnCours / troisiemeJobs) * 100) : 0
            const troisiemeNonEntamePourcentage = troisiemeJobs > 0 ? Math.round((troisiemeNonEntame / troisiemeJobs) * 100) : 0

            // Déterminer le statut LED selon le pourcentage de clôture
            let statusLed: 'success' | 'warning' | 'danger' | 'info' = 'info'
            if (cloturePourcentage >= 80) {
                statusLed = 'success'
            } else if (cloturePourcentage >= 50) {
                statusLed = 'warning'
            } else if (enCours > 0) {
                statusLed = 'info'
            } else {
                statusLed = 'danger'
            }

            return {
                zoneId: zone.id,
                zoneName: zone.name,
                zoneDescription: zone.description,
                nombreEquipes: baseEquipes,
                totalJobs: baseJobs,
                totalEmplacements: baseJobs, // approximation logique pour les données mock
                premierComptage: {
                    cloture,
                    cloturePourcentage,
                    enCours,
                    enCoursPourcentage,
                    nonEntame,
                    nonEntamePourcentage
                },
                deuxiemeComptage: {
                    cloture: deuxiemeCloture,
                    cloturePourcentage: deuxiemeCloturePourcentage,
                    enCours: deuxiemeEnCours,
                    enCoursPourcentage: deuxiemeEnCoursPourcentage,
                    nonEntame: deuxiemeNonEntame,
                    nonEntamePourcentage: deuxiemeNonEntamePourcentage
                },
                troisiemeComptage: {
                    jobs: troisiemeJobs,
                    termine: troisiemeTermine,
                    terminePourcentage: troisiemeTerminePourcentage,
                    enCours: troisiemeEnCours,
                    enCoursPourcentage: troisiemeEnCoursPourcentage,
                    nonEntame: troisiemeNonEntame,
                    nonEntamePourcentage: troisiemeNonEntamePourcentage
                },
                statusLed
            }
        })

        const total = calculerTotaux(zones)

        return {
            zones,
            total
        }
    }

    /**
     * Mappe les données du backend vers le format attendu par le composant
     */
    const mapperDonneesBackend = (
        zoneResponse: ZoneMonitoringResponse[],
        globalResponse: GlobalMonitoringResponse['data']
    ): MonitoringStats => {
        const zones: ZoneMonitoringData[] = zoneResponse.map(zone => {
            // Trouver les comptages par ordre
            const premierComptage = zone.countings.find(c => c.counting_order === 1)
            const deuxiemeComptage = zone.countings.find(c => c.counting_order === 2)
            const troisiemeComptage = zone.countings.find(c => c.counting_order === 3)

            // Fonction helper pour calculer les métriques à partir des assignments
            const calculerMetriquesComptage = (counting: any) => {
                if (!counting?.assignments || counting.assignments.length === 0) {
                    return {
                        cloture: 0,
                        cloturePourcentage: 0,
                        enCours: 0,
                        enCoursPourcentage: 0,
                        nonEntame: 0,
                        nonEntamePourcentage: 0,
                        totalJobs: 0
                    }
                }

                // Utiliser directement les données des assignments
                const termineAssignment = counting.assignments.find((a: any) => a.status === 'TERMINE')
                const entameAssignment = counting.assignments.find((a: any) => a.status === 'ENTAME')
                const transfertAssignment = counting.assignments.find((a: any) => a.status === 'TRANSFERT')

                // Calculer le total des jobs dans ce comptage
                const totalJobs = (termineAssignment?.count || 0) +
                                (entameAssignment?.count || 0) +
                                (transfertAssignment?.count || 0)

                return {
                    cloture: termineAssignment?.count || 0,
                    cloturePourcentage: Math.round(termineAssignment?.percentage || 0),
                    enCours: entameAssignment?.count || 0,
                    enCoursPourcentage: Math.round(entameAssignment?.percentage || 0),
                    nonEntame: transfertAssignment?.count || 0,
                    nonEntamePourcentage: Math.round(transfertAssignment?.percentage || 0),
                    totalJobs
                }
            }

            // Calculer les métriques du 1er comptage à partir des assignments
            const premierMetriques = calculerMetriquesComptage(premierComptage)

            // Calculer les métriques du 2ème comptage à partir des assignments
            const deuxiemeMetriques = calculerMetriquesComptage(deuxiemeComptage)

            // Calculer les métriques du 3ème comptage à partir des assignments
            const troisiemeMetriques = calculerMetriquesComptage(troisiemeComptage)

            // Calculer le statut LED basé sur le statut de la zone
            let statusLed: 'success' | 'warning' | 'danger' | 'info' = 'info'
            if (zone.status === 'TERMINE' || zone.status === 'CLOTURE') {
                statusLed = 'success'
            } else if (zone.status === 'EN COURS' || zone.status === 'ENTAME') {
                statusLed = 'warning'
            } else if (zone.status === 'EN ATTENTE') {
                statusLed = 'info'
            } else {
                statusLed = 'danger'
            }

            return {
                zoneId: zone.zone_id,
                zoneName: zone.zone_name,
                zoneDescription: zone.zone_name, // Utiliser zone_name comme description
                nombreEquipes: zone.nombre_equipes || 0,
                totalJobs: zone.nombre_jobs || 0,
                totalEmplacements: zone.nombre_emplacements || 0,
                premierComptage: premierMetriques,
                deuxiemeComptage: deuxiemeMetriques,
                troisiemeComptage: {
                    jobs: troisiemeMetriques.totalJobs,
                    termine: troisiemeMetriques.cloture,
                    terminePourcentage: troisiemeMetriques.cloturePourcentage,
                    enCours: troisiemeMetriques.enCours,
                    enCoursPourcentage: troisiemeMetriques.enCoursPourcentage,
                    nonEntame: troisiemeMetriques.nonEntame,
                    nonEntamePourcentage: troisiemeMetriques.nonEntamePourcentage
                },
                statusLed
            }
        })

        // Calculer les totaux depuis la réponse globale
        const premierComptageGlobal = globalResponse.countings.find(c => c.counting_order === 1)
        const deuxiemeComptageGlobal = globalResponse.countings.find(c => c.counting_order === 2)
        const troisiemeComptageGlobal = globalResponse.countings.find(c => c.counting_order === 3)

        // Pour le 1er et 2ème comptage, utiliser jobs_termines si disponible
        const cloturePremier = premierComptageGlobal?.jobs_termines || 0
        const cloturePourcentagePremier = premierComptageGlobal?.jobs_termines_percent || 0
        const enCoursPremier = Math.max(0, globalResponse.total_jobs - cloturePremier)
        const enCoursPourcentagePremier = globalResponse.total_jobs > 0
            ? Math.round((enCoursPremier / globalResponse.total_jobs) * 100)
            : 0

        const clotureDeuxieme = deuxiemeComptageGlobal?.jobs_termines || 0
        const cloturePourcentageDeuxieme = deuxiemeComptageGlobal?.jobs_termines_percent || 0
        const enCoursDeuxieme = Math.max(0, globalResponse.total_jobs - clotureDeuxieme)
        const enCoursPourcentageDeuxieme = globalResponse.total_jobs > 0
            ? Math.round((enCoursDeuxieme / globalResponse.total_jobs) * 100)
            : 0

        const total: MonitoringTotalData = {
            nombreEquipes: globalResponse.total_equipes,
            totalJobs: globalResponse.total_jobs,
            premierComptage: {
                cloture: cloturePremier,
                cloturePourcentage: cloturePourcentagePremier,
                enCours: enCoursPremier,
                enCoursPourcentage: enCoursPourcentagePremier,
                nonEntame: 0,
                nonEntamePourcentage: 0
            },
            deuxiemeComptage: {
                cloture: clotureDeuxieme,
                cloturePourcentage: cloturePourcentageDeuxieme,
                enCours: enCoursDeuxieme,
                enCoursPourcentage: enCoursPourcentageDeuxieme,
                nonEntame: 0,
                nonEntamePourcentage: 0
            },
            troisiemeComptage: {
                jobs: troisiemeComptageGlobal ? globalResponse.total_jobs : 0,
                termine: troisiemeComptageGlobal?.jobs_termines || 0,
                terminePourcentage: troisiemeComptageGlobal?.jobs_termines_percent || 0,
                enCours: troisiemeComptageGlobal
                    ? Math.max(0, globalResponse.total_jobs - (troisiemeComptageGlobal.jobs_termines || 0))
                    : 0,
                enCoursPourcentage: troisiemeComptageGlobal && globalResponse.total_jobs > 0
                    ? Math.round(((globalResponse.total_jobs - (troisiemeComptageGlobal.jobs_termines || 0)) / globalResponse.total_jobs) * 100)
                    : 0,
                nonEntame: 0,
                nonEntamePourcentage: 0
            }
        }

        return {
            zones,
            total
        }
    }

    /**
     * Charge les données de monitoring depuis le backend
     */
    const chargerDonnees = async () => {
        const currentInventoryId = inventoryId.value
        const currentWarehouseId = warehouseId.value

        // Valider que les IDs sont valides (non null, non undefined, et > 0)
        if (!currentInventoryId || currentInventoryId <= 0) {
            console.warn('ID d\'inventaire invalide pour le monitoring', {
                inventoryId: currentInventoryId,
                routeParams: route.params,
                routeName: route.name
            })
            return
        }

        if (!currentWarehouseId || currentWarehouseId <= 0) {
            console.warn('ID d\'entrepôt invalide pour le monitoring', {
                warehouseId: currentWarehouseId,
                routeParams: route.params,
                routeName: route.name
            })
            return
        }

        try {
            // Charger les deux types de monitoring en parallèle
            const { byZone, global } = await monitoringStore.fetchAllMonitoring(
                currentInventoryId,
                currentWarehouseId
            )

            if (byZone && global && byZone.data && global.data) {
                // Charger les zones depuis l'API
                if (byZone.data.zones) {
                    zonesPredefinies.value = byZone.data.zones.map(zone => ({
                        id: zone.zone_id,
                        name: zone.zone_name,
                        description: zone.zone_reference || zone.zone_name
                    }))
                }

                // Mapper les données du backend vers le format attendu
                monitoringData.value = mapperDonneesBackend(byZone.data.zones, global.data)
            } else {
                console.warn('Données de monitoring incomplètes', { byZone, global })
            }
        } catch (error) {
            console.error('Erreur lors du chargement du monitoring', error)
            // En cas d'erreur, ne pas mettre à jour monitoringData pour garder les anciennes données
        }
    }

    /**
     * Démarre le rafraîchissement automatique
     */
    const demarrerAutoRefresh = () => {
        if (refreshInterval.value) {
            clearInterval(refreshInterval.value)
        }

        if (autoRefreshEnabled.value) {
            refreshInterval.value = setInterval(() => {
                chargerDonnees()
            }, refreshIntervalMs.value)
        }
    }

    /**
     * Arrête le rafraîchissement automatique
     */
    const arreterAutoRefresh = () => {
        if (refreshInterval.value) {
            clearInterval(refreshInterval.value)
            refreshInterval.value = null
        }
    }

    /**
     * Bascule le rafraîchissement automatique
     */
    const toggleAutoRefresh = () => {
        autoRefreshEnabled.value = !autoRefreshEnabled.value
        if (autoRefreshEnabled.value) {
            demarrerAutoRefresh()
        } else {
            arreterAutoRefresh()
        }
    }

    // Watch sur les IDs pour recharger les données quand ils changent
    watch([inventoryId, warehouseId], ([newInventoryId, newWarehouseId], [oldInventoryId, oldWarehouseId]) => {
        // Recharger seulement si les IDs ont changé et sont valides
        if (
            newInventoryId &&
            newWarehouseId &&
            (newInventoryId !== oldInventoryId || newWarehouseId !== oldWarehouseId)
        ) {
            chargerDonnees()
        }
    }, { immediate: false })

    // Lifecycle
    onMounted(async () => {
        // Utiliser nextTick pour s'assurer que la route est prête
        await nextTick()

        // Vérifier immédiatement si les IDs sont disponibles
        if (inventoryId.value && warehouseId.value) {
            chargerDonnees()
            demarrerAutoRefresh()
        } else {
            // Si les IDs ne sont pas disponibles, attendre un peu et réessayer
            // Cela peut arriver si la route n'est pas encore complètement chargée
            const checkIds = () => {
                const invId = inventoryId.value
                const whId = warehouseId.value

                // Vérifier que les IDs sont valides (non null, non undefined, et > 0)
                if (invId && invId > 0 && whId && whId > 0) {
                    chargerDonnees()
                    demarrerAutoRefresh()
                } else {
                    console.warn('IDs non disponibles ou invalides au montage', {
                        inventoryId: invId,
                        warehouseId: whId,
                        routeParams: route.params,
                        routeName: route.name,
                        isValidInventoryId: invId && invId > 0,
                        isValidWarehouseId: whId && whId > 0
                    })
                }
            }

            // Réessayer après un court délai
            setTimeout(checkIds, 100)
            // Réessayer une dernière fois après un délai plus long
            setTimeout(checkIds, 500)
        }
    })

    onUnmounted(() => {
        arreterAutoRefresh()
    })

    return {
        // État
        loading: readonly(loading),
        monitoringData: readonly(monitoringData),
        autoRefreshEnabled: readonly(autoRefreshEnabled),
        refreshIntervalMs: readonly(refreshIntervalMs),

        // IDs
        inventoryId: readonly(inventoryId),
        warehouseId: readonly(warehouseId),

        // Actions
        chargerDonnees,
        demarrerAutoRefresh,
        arreterAutoRefresh,
        toggleAutoRefresh
    }
}

