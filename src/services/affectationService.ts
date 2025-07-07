import type {
  AffectationData,
  Job,
  Team,
  AffectationRequest,
  ResourceAffectationRequest,
  ValidationRequest,
  TransferRequest
} from '@/interfaces/affectation'

// Données par défaut (non persistées)
const getDefaultAffectationData = (): AffectationData => ({
  teamJobs1: new Map(),
  teamJobs2: new Map(),
  dates1: {},
  dates2: {},
  jobResources: new Map(),
  jobStatuses: {}
})

// Données en mémoire uniquement
let currentAffectationData: AffectationData = getDefaultAffectationData()

// Équipes disponibles
const teams: Team[] = [
  { id: '1', name: 'Équipe Alpha' },
  { id: '2', name: 'Équipe Beta' },
  { id: '3', name: 'Équipe Gamma' },
  { id: '4', name: 'Équipe Delta' }
]

// Jobs disponibles
const jobs: Job[] = [
  { id: '1', name: 'Zone A', locations: ['A1', 'A2', 'A3', 'A4', 'A5'] },
  { id: '2', name: 'Zone B', locations: ['B1', 'B2', 'B3', 'B4'] },
  { id: '3', name: 'Zone C', locations: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'] },
  { id: '4', name: 'Zone D', locations: ['D1', 'D2', 'D3'] },
  { id: '5', name: 'Zone E', locations: ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7'] }
]

export const affectationService = {
  // Charger les données (maintenant depuis la mémoire uniquement)
  loadAffectationData(): AffectationData {
    return { ...currentAffectationData }
  },

  // Sauvegarder les données (maintenant en mémoire uniquement)
  saveAffectationData(data: AffectationData): void {
    currentAffectationData = { ...data }
  },

  // Réinitialiser toutes les données
  resetAffectationData(): void {
    currentAffectationData = getDefaultAffectationData()
  },

  // Obtenir les équipes
  getTeams(): Team[] {
    return teams
  },

  // Obtenir les jobs
  getJobs(): Job[] {
    return jobs
  },

  // Initialiser les statuts des jobs
  initializeJobStatuses(inventoryStatus: string, data: AffectationData): void {
    jobs.forEach(job => {
      if (!data.jobStatuses[job.id]) {
        data.jobStatuses[job.id] = inventoryStatus
      }
    })
    this.saveAffectationData(data)
  },

  // Affecter au premier comptage
  async affecterAuPremierComptage(request: AffectationRequest, data: AffectationData): Promise<void> {
    const { team, jobIds, date } = request
    
    // Trouver l'équipe
    const teamObj = teams.find(t => t.name === team)
    if (!teamObj) {
      throw new Error('Équipe non trouvée')
    }

    // Affecter les jobs à l'équipe
    const currentJobs = data.teamJobs1.get(teamObj.id) || []
    const newJobs = [...new Set([...currentJobs, ...jobIds])]
    data.teamJobs1.set(teamObj.id, newJobs)

    // Définir les dates
    jobIds.forEach(jobId => {
      data.dates1[jobId] = date
      // Mettre à jour le statut
      data.jobStatuses[jobId] = 'affecter'
    })

    this.saveAffectationData(data)
  },

  // Affecter au deuxième comptage
  async affecterAuDeuxiemeComptage(request: AffectationRequest, data: AffectationData): Promise<void> {
    const { team, jobIds, date } = request
    
    const teamObj = teams.find(t => t.name === team)
    if (!teamObj) {
      throw new Error('Équipe non trouvée')
    }

    const currentJobs = data.teamJobs2.get(teamObj.id) || []
    const newJobs = [...new Set([...currentJobs, ...jobIds])]
    data.teamJobs2.set(teamObj.id, newJobs)

    jobIds.forEach(jobId => {
      data.dates2[jobId] = date
      data.jobStatuses[jobId] = 'affecter'
    })

    this.saveAffectationData(data)
  },

  // Affecter des ressources
  async affecterRessources(request: ResourceAffectationRequest, data: AffectationData): Promise<void> {
    const { jobIds, resources } = request

    jobIds.forEach(jobId => {
      const currentResources = data.jobResources.get(jobId) || []
      const newResources = [...new Set([...currentResources, ...resources])]
      data.jobResources.set(jobId, newResources)
    })

    this.saveAffectationData(data)
  },

  // Valider des jobs
  async validerJobs(request: ValidationRequest, data: AffectationData): Promise<void> {
    const { jobIds } = request

    jobIds.forEach(jobId => {
      data.jobStatuses[jobId] = 'valider'
    })

    this.saveAffectationData(data)
  },

  // Transférer des jobs
  async transfererJobs(request: TransferRequest, data: AffectationData): Promise<void> {
    const { jobIds, options } = request

    jobIds.forEach(jobId => {
      if (options.premierComptage) {
        // Supprimer du premier comptage
        data.teamJobs1.forEach((jobs, teamId) => {
          const filtered = jobs.filter(id => id !== jobId)
          data.teamJobs1.set(teamId, filtered)
        })
        delete data.dates1[jobId]
      }

      if (options.deuxiemeComptage) {
        // Supprimer du deuxième comptage
        data.teamJobs2.forEach((jobs, teamId) => {
          const filtered = jobs.filter(id => id !== jobId)
          data.teamJobs2.set(teamId, filtered)
        })
        delete data.dates2[jobId]
      }

      data.jobStatuses[jobId] = 'transfere'
    })

    this.saveAffectationData(data)
  },

  // Mettre à jour un champ de job
  updateJobField(jobId: string, field: string, value: any, data: AffectationData): void {
    if (field === 'team1') {
      // Supprimer de l'ancienne équipe
      data.teamJobs1.forEach((jobs, teamId) => {
        const filtered = jobs.filter(id => id !== jobId)
        data.teamJobs1.set(teamId, filtered)
      })

      // Ajouter à la nouvelle équipe
      if (value) {
        const teamObj = teams.find(t => t.name === value)
        if (teamObj) {
          const currentJobs = data.teamJobs1.get(teamObj.id) || []
          data.teamJobs1.set(teamObj.id, [...currentJobs, jobId])
        }
      }
    } else if (field === 'team2') {
      data.teamJobs2.forEach((jobs, teamId) => {
        const filtered = jobs.filter(id => id !== jobId)
        data.teamJobs2.set(teamId, filtered)
      })

      if (value) {
        const teamObj = teams.find(t => t.name === value)
        if (teamObj) {
          const currentJobs = data.teamJobs2.get(teamObj.id) || []
          data.teamJobs2.set(teamObj.id, [...currentJobs, jobId])
        }
      }
    } else if (field === 'date1') {
      if (value) {
        data.dates1[jobId] = value
      } else {
        delete data.dates1[jobId]
      }
    } else if (field === 'date2') {
      if (value) {
        data.dates2[jobId] = value
      } else {
        delete data.dates2[jobId]
      }
    }

    this.saveAffectationData(data)
  },

  // Ajouter une ressource à un job
  async addResourceToJob(jobId: string, resource: string, data: AffectationData): Promise<void> {
    const currentResources = data.jobResources.get(jobId) || []
    if (!currentResources.includes(resource)) {
      data.jobResources.set(jobId, [...currentResources, resource])
      this.saveAffectationData(data)
    }
  },

  // Supprimer une ressource d'un job
  async removeResourceFromJob(jobId: string, resource: string, data: AffectationData): Promise<void> {
    const currentResources = data.jobResources.get(jobId) || []
    const filtered = currentResources.filter(r => r !== resource)
    data.jobResources.set(jobId, filtered)
    this.saveAffectationData(data)
  },

  // Vérifier si un job a une ressource
  hasResource(jobId: string, resource: string, data: AffectationData): boolean {
    const resources = data.jobResources.get(jobId) || []
    return resources.includes(resource)
  },

  // Obtenir le nombre de ressources d'un job
  getResourceCount(jobId: string, data: AffectationData): number {
    const resources = data.jobResources.get(jobId) || []
    return resources.length
  },

  // Obtenir l'affichage des ressources d'un job
  getResourcesDisplay(jobId: string, data: AffectationData): string {
    const resources = data.jobResources.get(jobId) || []
    const count = resources.length
    return count > 0 ? `${count} ressource${count > 1 ? 's' : ''}` : 'Aucune ressource'
  },

  // Obtenir la liste des ressources d'un job
  getResourcesList(jobId: string, data: AffectationData): string[] {
    return data.jobResources.get(jobId) || []
  }
}