export interface Team {
    id: string;
    name: string;
  }
  
  export interface Job {
    id: string;
    locations: string[];
  }
  
  export interface PlanningState {
    selectedDate: string;
    teams: Team[];
    jobs: Job[];
    isSubmitting: boolean;
  }
  
  export interface Location {
    id: string;
    name: string;
  }