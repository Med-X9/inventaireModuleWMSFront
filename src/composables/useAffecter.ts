import { ref, computed } from 'vue'
import { affectationService } from '@/services/affectationService'
import type {
  AffectationData,
  JobAffectation,
  AffectationRequest,
  ResourceAffectationRequest,
  ValidationRequest,
  TransferRequest
} from '@/interfaces/affectation'
import type { SelectOption } from '@/interfaces/form'

export function useAffecter() {
  // État réactif (maintenant en mémoire uniquement)
  const affectationData = ref<AffectationData>(affectationService.loadAffectationData())
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Charger les données initiales
  const teams = affectationService.getTeams()
  const jobs = affectationService.getJobs()

  // Initialiser les statuts par défaut
  affectationService.initializeJobStatuses('planifier', affectationData.value)

  // Options pour les sélecteurs
  const teamOptions: SelectOption[] = teams.map(team => ({
    label: team.name,
    value: team.name
  }))

  const resourceOptions: SelectOption[] = [
    { label: 'Scanner Zebra MC9300', value: 'Scanner Zebra MC9300' },
    { label: 'Terminal Honeywell CT60', value: 'Terminal Honeywell CT60' },
    { label: 'Imprimante Mobile Zebra ZQ630', value: 'Imprimante Mobile Zebra ZQ630' },
    { label: 'Tablette Samsung Galaxy Tab A8', value: 'Tablette Samsung Galaxy Tab A8' },
    { label: 'Pistolet de Comptage Datalogic', value: 'Pistolet de Comptage Datalogic' },
    { label: 'Scanner Honeywell', value: 'Scanner Honeywell' },
    { label: 'Tablet iPad', value: 'Tablet iPad' },
    { label: 'Étiquettes', value: 'Étiquettes' },
    { label: 'Chariot', value: 'Chariot' }
  ]

  // Données calculées pour l'affichage
  const rows = computed((): JobAffectation[] =>
    jobs.map(job => {
      const id = job.id

      // Équipe & date premier comptage
      let team1 = ''
      affectationData.value.teamJobs1.forEach((list, teamId) => {
        if (list.includes(id)) {
          const team = teams.find(t => t.id === teamId)
          if (team) team1 = team.name
        }
      })
      const date1 = affectationData.value.dates1[id] || ''

      // Équipe & date deuxième comptage
      let team2 = ''
      affectationData.value.teamJobs2.forEach((list, teamId) => {
        if (list.includes(id)) {
          const team = teams.find(t => t.id === teamId)
          if (team) team2 = team.name
        }
      })
      const date2 = affectationData.value.dates2[id] || ''

      // Ressources
      const resourcesList = affectationService.getResourcesList(id, affectationData.value)
      const resourceCount = affectationService.getResourceCount(id, affectationData.value)
      const resourcesDisplay = affectationService.getResourcesDisplay(id, affectationData.value)
      const status = affectationData.value.jobStatuses[id] || 'planifier'

      return {
        id,
        job: `Inventaire Zone ${String.fromCharCode(64 + parseInt(id))}`, // A, B, C...
        locations: job.locations,
        team1,
        date1,
        team2,
        date2,
        resourcesList,
        resources: resourcesDisplay,
        resourceCount,
        status
      }
    })
  )

  // Actions d'affectation
  const affecterAuPremierComptage = async (team: string, jobIds: string[], date: string) => {
    try {
      isLoading.value = true
      error.value = null

      const request: AffectationRequest = { team, jobIds, date }
      await affectationService.affecterAuPremierComptage(request, affectationData.value)

      // Recharger les données depuis le service
      affectationData.value = affectationService.loadAffectationData()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de l\'affectation au premier comptage'
      console.error('Erreur affectation premier comptage:', err)
    } finally {
      isLoading.value = false
    }
  }

  const affecterAuDeuxiemeComptage = async (team: string, jobIds: string[], date: string) => {
    try {
      isLoading.value = true
      error.value = null

      const request: AffectationRequest = { team, jobIds, date }
      await affectationService.affecterAuDeuxiemeComptage(request, affectationData.value)

      affectationData.value = affectationService.loadAffectationData()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de l\'affectation au deuxième comptage'
      console.error('Erreur affectation deuxième comptage:', err)
    } finally {
      isLoading.value = false
    }
  }

  const affecterRessources = async (jobIds: string[], resources: string[]) => {
    try {
      isLoading.value = true
      error.value = null

      const request: ResourceAffectationRequest = { jobIds, resources }
      await affectationService.affecterRessources(request, affectationData.value)

      affectationData.value = affectationService.loadAffectationData()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de l\'affectation des ressources'
      console.error('Erreur affectation ressources:', err)
    } finally {
      isLoading.value = false
    }
  }

  const validerJobs = async (jobIds: string[]) => {
    try {
      isLoading.value = true
      error.value = null

      const request: ValidationRequest = { jobIds }
      await affectationService.validerJobs(request, affectationData.value)

      affectationData.value = affectationService.loadAffectationData()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de la validation des jobs'
      console.error('Erreur validation jobs:', err)
    } finally {
      isLoading.value = false
    }
  }

  const transfererJobs = async (jobIds: string[], options: { premierComptage: boolean; deuxiemeComptage: boolean }) => {
    try {
      isLoading.value = true
      error.value = null

      const request: TransferRequest = { jobIds, options }
      await affectationService.transfererJobs(request, affectationData.value)

      affectationData.value = affectationService.loadAffectationData()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors du transfert des jobs'
      console.error('Erreur transfert jobs:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Mise à jour inline
  const updateJobField = (jobId: string, field: string, value: any) => {
    affectationService.updateJobField(jobId, field, value, affectationData.value)
    // Recharger les données pour s'assurer de la cohérence
    affectationData.value = affectationService.loadAffectationData()
  }

  // Gestion des ressources individuelles
  const addResourceToJob = async (jobId: string, resource: string) => {
    try {
      await affectationService.addResourceToJob(jobId, resource, affectationData.value)
      affectationData.value = affectationService.loadAffectationData()
    } catch (err) {
      console.error('Erreur ajout ressource:', err)
      throw err
    }
  }

  const removeResourceFromJob = async (jobId: string, resource: string) => {
    try {
      await affectationService.removeResourceFromJob(jobId, resource, affectationData.value)
      affectationData.value = affectationService.loadAffectationData()
    } catch (err) {
      console.error('Erreur suppression ressource:', err)
      throw err
    }
  }

  // Fonctions utilitaires
  const hasResource = (jobId: string, resource: string): boolean => {
    return affectationService.hasResource(jobId, resource, affectationData.value)
  }

  const getResourceCount = (jobId: string): number => {
    return affectationService.getResourceCount(jobId, affectationData.value)
  }

  const getResourcesDisplay = (jobId: string): string => {
    return affectationService.getResourcesDisplay(jobId, affectationData.value)
  }

  const getResourcesList = (jobId: string): string[] => {
    return affectationService.getResourcesList(jobId, affectationData.value)
  }

  const initializeJobStatuses = (inventoryStatus: string) => {
    affectationService.initializeJobStatuses(inventoryStatus, affectationData.value)
  }

  // Fonction pour réinitialiser toutes les affectations
  const resetAllAffectations = () => {
    affectationService.resetAffectationData()
    affectationData.value = affectationService.loadAffectationData()
  }

  return {
    // État
    isLoading,
    error,
    rows,

    // Actions
    affecterAuPremierComptage,
    affecterAuDeuxiemeComptage,
    affecterRessources,
    validerJobs,
    transfererJobs,
    updateJobField,
    addResourceToJob,
    removeResourceFromJob,

    // Utilitaires
    hasResource,
    getResourceCount,
    getResourcesDisplay,
    getResourcesList,
    initializeJobStatuses,
    resetAllAffectations,

    // Options
    teamOptions,
    resourceOptions,

    // Données brutes (si nécessaire)
    affectationData
  }
}