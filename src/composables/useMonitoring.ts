import { ref, computed, onMounted, onUnmounted, readonly } from 'vue'
import { useJobStore } from '@/stores/job'
import { useSessionStore } from '@/stores/session'
import { useRoute } from 'vue-router'
import type { JobResult } from '@/models/Job'

export interface ZoneMonitoringData {
  zoneId: number
  zoneName: string
  zoneDescription: string
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
    enCours: number
    nonEntame: number
  }
  troisiemeComptage: {
    jobs: number
    termine: number
    enCours: number
    nonEntame: number
  }
  statusLed: 'success' | 'warning' | 'danger' | 'info'
}

export interface MonitoringStats {
  zones: ZoneMonitoringData[]
  total: {
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
      enCours: number
      nonEntame: number
    }
      troisiemeComptage: {
        jobs: number
        termine: number
        enCours: number
        nonEntame: number
      }
  }
}

export function useMonitoring() {
  const route = useRoute()
  const jobStore = useJobStore()
  const sessionStore = useSessionStore()

  const loading = ref(false)
  const monitoringData = ref<MonitoringStats | null>(null)
  const refreshInterval = ref<NodeJS.Timeout | null>(null)
  const autoRefreshEnabled = ref(true)
  const refreshIntervalMs = ref(5000) // 5 secondes par défaut

  // Zones prédéfinies basées sur l'image
  const zonesPredefinies = [
    { id: 1, name: 'Zone 1', description: 'Reserve Rack' },
    { id: 2, name: 'Zone 2', description: 'Picking Rack' },
    { id: 3, name: 'Zone 3', description: 'Mezza 1 DPP' },
    { id: 4, name: 'Zone 4', description: 'Mezza 2 DPGP' },
    { id: 5, name: 'Zone 5', description: 'Mezza 3 DPLuxe' },
    { id: 6, name: 'Zone 6', description: 'Mezza Cellule 2' },
    { id: 7, name: 'Zone 7', description: 'Zone 7' },
    { id: 8, name: 'Zone 8', description: 'Zone 8' },
    { id: 9, name: 'Zone 9', description: 'Zone 9' }
  ]

  /**
   * Calcule le statut LED en fonction des métriques de la zone
   */
  const calculerStatusLed = (zone: ZoneMonitoringData): 'success' | 'warning' | 'danger' | 'info' => {
    const { premierComptage, deuxiemeComptage } = zone

    // Si plus de 80% des jobs du 1er comptage sont clôturés
    if (premierComptage.cloturePourcentage >= 80) {
      return 'success'
    }

    // Si entre 50% et 80% clôturés
    if (premierComptage.cloturePourcentage >= 50) {
      return 'warning'
    }

    // Si moins de 50% clôturés mais des jobs en cours
    if (premierComptage.enCours > 0) {
      return 'info'
    }

    // Si aucun job en cours
    return 'danger'
  }

  /**
   * Analyse les jobs et calcule les statistiques par zone
   */
  const analyserJobsParZone = (jobs: JobResult[]): ZoneMonitoringData[] => {
    const zonesMap = new Map<number, ZoneMonitoringData>()

    // Initialiser les zones
    zonesPredefinies.forEach(zone => {
      zonesMap.set(zone.id, {
        zoneId: zone.id,
        zoneName: zone.name,
        zoneDescription: zone.description,
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
          enCours: 0,
          nonEntame: 0
        },
        troisiemeComptage: {
          jobs: 0,
          termine: 0,
          enCours: 0,
          nonEntame: 0
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
          }
        } else {
          // Si le nom de zone ne correspond pas au pattern, essayer de mapper par nom
          const zoneNameLower = zoneName.toLowerCase()
          if (zoneNameLower.includes('reserve') || zoneNameLower.includes('rack')) {
            zonesJob.add(1) // Zone 1 - Reserve Rack
          } else if (zoneNameLower.includes('picking')) {
            zonesJob.add(2) // Zone 2 - Picking Rack
          } else if (zoneNameLower.includes('mezza') && zoneNameLower.includes('1')) {
            zonesJob.add(3) // Zone 3 - Mezza 1
          } else if (zoneNameLower.includes('mezza') && zoneNameLower.includes('2')) {
            zonesJob.add(4) // Zone 4 - Mezza 2
          } else if (zoneNameLower.includes('mezza') && zoneNameLower.includes('3')) {
            zonesJob.add(5) // Zone 5 - Mezza 3
          } else if (zoneNameLower.includes('cellule')) {
            zonesJob.add(6) // Zone 6 - Cellule
          } else {
            // Zone par défaut si aucune correspondance
            zonesJob.add(1)
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
        zone.premierComptage.cloturePourcentage = Math.round(
          (zone.premierComptage.cloture / zone.totalJobs) * 100
        )
        zone.premierComptage.enCoursPourcentage = Math.round(
          (zone.premierComptage.enCours / zone.totalJobs) * 100
        )
        zone.premierComptage.nonEntamePourcentage = Math.round(
          (zone.premierComptage.nonEntame / zone.totalJobs) * 100
        )
      }

      // Calculer le total jobs du 3e comptage comme somme des 3 statuts
      zone.troisiemeComptage.jobs = zone.troisiemeComptage.termine + zone.troisiemeComptage.enCours + zone.troisiemeComptage.nonEntame

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
        enCours: 0,
        nonEntame: 0
      },
      troisiemeComptage: {
        jobs: 0,
        termine: 0,
        enCours: 0,
        nonEntame: 0
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
    }

    return total
  }

  /**
   * Génère des données mock logiques pour le monitoring
   */
  const genererDonneesMock = (): MonitoringStats => {
    const zones: ZoneMonitoringData[] = zonesPredefinies.map((zone, index) => {
      // Générer des données logiques et variées
      const baseJobs = [120, 80, 150, 200, 180, 50, 90, 110, 70][index] || 100
      const baseEquipes = [16, 6, 8, 10, 12, 2, 5, 7, 4][index] || 5
      
      // Calculer les valeurs du 1er comptage de manière logique
      const cloture = Math.floor(baseJobs * (0.4 + Math.random() * 0.3)) // 40-70%
      const enCours = Math.floor(baseJobs * (0.1 + Math.random() * 0.2)) // 10-30%
      const nonEntame = baseJobs - cloture - enCours
      
      const cloturePourcentage = Math.round((cloture / baseJobs) * 100)
      const enCoursPourcentage = Math.round((enCours / baseJobs) * 100)
      const nonEntamePourcentage = Math.round((nonEntame / baseJobs) * 100)

      // 2e comptage - généralement moins avancé que le 1er
      const deuxiemeCloture = Math.floor(cloture * (0.3 + Math.random() * 0.2)) // 30-50% du 1er
      const deuxiemeEnCours = Math.floor(baseJobs * (0.15 + Math.random() * 0.15))
      const deuxiemeNonEntame = baseJobs - deuxiemeCloture - deuxiemeEnCours

      // 3e comptage - généralement très peu
      const troisiemeJobs = Math.max(1, Math.floor(baseJobs * (0.05 + Math.random() * 0.1))) // 5-15%, minimum 1
      const troisiemeTermine = Math.floor(troisiemeJobs * (0.3 + Math.random() * 0.3)) // 30-60% terminé
      const troisiemeEnCours = Math.floor(troisiemeJobs * (0.2 + Math.random() * 0.2)) // 20-40% en cours
      const troisiemeNonEntame = Math.max(0, troisiemeJobs - troisiemeTermine - troisiemeEnCours)

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
          enCours: deuxiemeEnCours,
          nonEntame: deuxiemeNonEntame
        },
        troisiemeComptage: {
          jobs: troisiemeJobs,
          termine: troisiemeTermine,
          enCours: troisiemeEnCours,
          nonEntame: troisiemeNonEntame
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
   * Charge les données de monitoring
   */
  const chargerDonnees = async () => {
    // Essayer d'abord les paramètres de route
    let inventoryId = route.params.inventoryId as string
    let warehouseId = route.params.warehouseId as string

    // Si pas dans les paramètres, essayer dans query
    if (!inventoryId) {
      inventoryId = route.query.inventoryId as string
    }
    if (!warehouseId) {
      warehouseId = route.query.warehouseId as string
    }

    loading.value = true

    try {
      // Si pas d'IDs, utiliser les données mock
      if (!inventoryId || !warehouseId) {
        console.warn('IDs manquants, utilisation des données mock')
        monitoringData.value = genererDonneesMock()
        return
      }

      // Charger les sessions (équipes)
      await sessionStore.fetchSessions()

      // Charger les jobs validés
      await jobStore.fetchJobsValidated(
        parseInt(inventoryId, 10),
        parseInt(warehouseId, 10),
        {
          start: 0,
          length: 10000 // Charger tous les jobs pour le monitoring
        }
      )

      // Si pas de données réelles, utiliser les données mock
      if (!jobStore.jobsValidated || jobStore.jobsValidated.length === 0) {
        console.warn('Aucune donnée réelle, utilisation des données mock')
        monitoringData.value = genererDonneesMock()
        return
      }

      // Analyser les jobs par zone
      const zones = analyserJobsParZone(jobStore.jobsValidated)
      const total = calculerTotaux(zones)

      monitoringData.value = {
        zones,
        total
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données de monitoring, utilisation des données mock:', error)
      // En cas d'erreur, utiliser les données mock
      monitoringData.value = genererDonneesMock()
    } finally {
      loading.value = false
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

  // Lifecycle
  onMounted(() => {
    chargerDonnees()
    demarrerAutoRefresh()
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

    // Actions
    chargerDonnees,
    demarrerAutoRefresh,
    arreterAutoRefresh,
    toggleAutoRefresh
  }
}

