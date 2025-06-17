export interface Team {
  id: string;
  name: string;
  session: string;
}

export interface Job {
  id: string;
  reference?: string;
  locations: string[];
  isValidated?: boolean;
  createdAt?: string;
  validatedAt?: string;
}

export interface PlanningState {
  jobs: Job[];
  isSubmitting: boolean;
}

export interface Location {
  id: string;
  name: string;
}

export interface TeamJobs {
  teamId: string;
  jobIds: string[];
}