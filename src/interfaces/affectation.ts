// Types pour les affectations
export interface Team {
  id: string
  name: string
}

export interface Job {
  id: string
  name: string
  locations: string[]
}

// Données d'affectation (maintenant en mémoire uniquement)
export interface AffectationData {
  teamJobs1: Map<string, string[]>  // teamId -> jobIds pour premier comptage
  teamJobs2: Map<string, string[]>  // teamId -> jobIds pour deuxième comptage
  dates1: Record<string, string>    // jobId -> date pour premier comptage
  dates2: Record<string, string>    // jobId -> date pour deuxième comptage
  jobResources: Map<string, string[]> // jobId -> resources
  jobStatuses: Record<string, string> // jobId -> status
}

// Interface pour l'affichage dans le tableau - CORRIGÉ avec index signature
export interface JobAffectation extends Record<string, unknown> {
  id: string
  job: string
  locations: string[]
  team1: string
  date1: string
  team2: string
  date2: string
  resourcesList: string[]
  resources: string
  resourceCount: number
  status: string
}

// Requêtes pour les actions
export interface AffectationRequest {
  team: string
  jobIds: string[]
  date: string
}

export interface ResourceAffectationRequest {
  jobIds: string[]
  resources: string[]
}

export interface ValidationRequest {
  jobIds: string[]
}

export interface TransferRequest {
  jobIds: string[]
  options: {
    premierComptage: boolean
    deuxiemeComptage: boolean
  }
}