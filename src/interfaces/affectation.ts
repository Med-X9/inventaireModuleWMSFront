export interface Team {
  id: string;
  name: string;
  session: string;
}

export interface Job {
  id: string;
  locations: string[];
}

export interface JobDisplayData {
  id: string;
  job: string;
  locations: string[];
  team1: string;
  date1: string;
  team2: string;
  date2: string;
  resourcesList: string[];
  resources: string;
  nbResources: number;
  status: 'planifier' | 'affecter' | 'valider' | 'transfere';
}

export interface AffectationState {
  teamJobs1: Map<string, string[]>;
  teamJobs2: Map<string, string[]>;
  dates1: Record<string, string>;
  dates2: Record<string, string>;
  resources: Record<string, string[]>;
  validatedJobs: Set<string>;
  jobStatuses: Record<string, 'planifier' | 'affecter' | 'valider' | 'transfere'>;
}

export interface AffectationData {
  teams: Team[];
  jobs: Job[];
  teamJobs1: Map<string, string[]>;
  teamJobs2: Map<string, string[]>;
  dates1: Record<string, string>;
  dates2: Record<string, string>;
  resources: Record<string, string[]>;
  validatedJobs: Set<string>;
  jobStatuses: Record<string, 'planifier' | 'affecter' | 'valider' | 'transfere'>;
}

export interface AffectationOptions {
  premierComptage: boolean;
  deuxiemeComptage: boolean;
}

export interface ResourceOption {
  label: string;
  value: string;
}

export interface TeamOption {
  label: string;
  value: string;
}

// Types pour les formulaires d'affectation
export interface TeamFormData {
  team: string;
  date: string;
}

export interface ResourceFormData {
  resources: string[];
}

export interface TransferFormData {
  premierComptage: boolean;
  deuxiemeComptage: boolean;
}

// Types pour les événements d'affectation
export interface AffectationEvent {
  type: 'team1' | 'team2' | 'resources' | 'validate' | 'transfer';
  jobIds: string[];
  data?: any;
}

// Interface pour les statistiques d'affectation
export interface AffectationStats {
  totalJobs: number;
  planifierJobs: number;
  affecterJobs: number;
  validerJobs: number;
  transfereJobs: number;
  teamsWithJobs1: number;
  teamsWithJobs2: number;
  jobsWithResources: number;
}