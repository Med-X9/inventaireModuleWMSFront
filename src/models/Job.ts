import type { Session } from '@/models/Session';

export interface Job {
    id: number;
    reference: string;
    status: JobStatus;
    en_attente_date: string | null; // ISO date string
    valide_date: string | null; // ISO date string
    termine_date: string | null; // ISO date string
    warehouse: number; // Warehouse ID
    inventory: number; // Inventory ID
    created_at?: string;
    updated_at?: string;
    locations: JobLocation[];
}

export type JobStatus = 'EN ATTENTE' | 'VALIDE' | 'TERMINE';

export interface CreateJobRequest {
    emplacements: number[];
}

export interface UpdateJobRequest extends Partial<CreateJobRequest> {
    job_id: number,
    job_reference: string,
    added_emplacements_count: number
}

export interface JobResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Job[];
}

// Modèles de réponse pour les opérations spécifiques
export interface CreateJobResponse {
    success: boolean;
    message: string;
    data: {
        job: Job;
        created_emplacements_count: number;
        job_reference: string;
    };
}

export interface AddLocationToJobResponse {
    success: boolean;
    message: string;
    data: {
        job: Job;
        added_emplacements_count: number;
        job_reference: string;
        total_emplacements_count: number;
    };
}

export interface DeleteLocationFromJobResponse {
    success: boolean;
    message: string;
    data: {
        job_id: number;
        job_reference: string;
        deleted_emplacements_count: number;
        remaining_emplacements_count: number;
    };
}

export interface UpdateJobStatusResponse {
    success: boolean;
    message: string;
    data: {
        job: Job;
        previous_status: JobStatus;
        new_status: JobStatus;
        updated_at: string;
    };
}

export interface DeleteJobResponse {
    success: boolean;
    message: string;
    data: {
        deleted_job_id: number;
        deleted_job_reference: string;
        freed_emplacements_count: number;
    };
}

export interface JobReadyResponse {
    success: boolean;
    message: string;

}

export interface JobErrorResponse {
    success: false;
    message: string;
    error_code?: string;
    details?: {
        field?: string;
        value?: any;
        constraint?: string;
    }[];
}

// Type union pour toutes les réponses possibles
export type JobOperationResponse =
    | CreateJobResponse
    | AddLocationToJobResponse
    | DeleteLocationFromJobResponse
    | UpdateJobStatusResponse
    | DeleteJobResponse
    | JobErrorResponse;

// Pour les formulaires et l'affichage
export interface JobTable extends Job {
    warehouse_name?: string;
    inventory_reference?: string;
    status_display?: string;
}

// Ajout de l'interface pour un emplacement d'un job
export interface JobLocation {
    id: number;
    location_id: number;
    reference: string;
    location_reference: string;
    sous_zone: {
        id: number;
        sous_zone_name: string;
        zone_name: string;
    };
    zone: {
        id: number;
        warehouse: number;
        warehouse_name: string;
        zone_name: string;
        zone_status: string;
        created_at: string;
        updated_at: string;
    };
    status: string;
}

// Interface pour les assignments
export interface JobAssignment {
    counting_order: number;
    status: string;
    date_start: string | null;
    session: Session | null;
}

// Interface pour les emplacements dans la réponse
export interface JobEmplacement {
    id: number;
    location_id?: number;
    reference: string;
    location_reference?: string;
    sous_zone: {
        id: number;
        sous_zone_name: string;
        zone_name: string;
    };
    zone: {
        id: number;
        warehouse: number;
        warehouse_name: string;
        zone_name: string;
        zone_status: string;
        created_at: string;
        updated_at: string;
    };
}

// Interface pour un job dans la réponse
export interface JobResult {
    id: number;
    reference: string;
    status: string;
    emplacements: JobEmplacement[];
    assignments: JobAssignment[];
    ressources: any[];
    valide_date?: string | null;
    en_attente_date?: string | null;
    termine_date?: string | null;
    date_transfer?: string | null;
}

// Interface pour la réponse paginée
export interface JobPaginatedResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: JobResult[];
}

// Interface pour la réponse DataTable des jobs
export interface JobDataTableResponse {
    draw: number;
    recordsTotal: number;
    recordsFiltered: number;
    data: JobTable[];
}

// Interface pour la réponse DataTable des jobs validés
export interface JobValidatedDataTableResponse {
    draw: number;
    recordsTotal: number;
    recordsFiltered: number;
    data: JobResult[];
}


export interface JobAssignmentsTeamRequest {
    job_ids: number[];
    counting_order: number;
    session_id: number;
    date_start: string;
}

export interface JobAssignmentsResourceRequest {
    job_ids: number[];
    resource_assignments: number[];
}

export interface JobManualAssignmentsRequest {
    job_id: number;
    team1: number | null;
    date1: string | null;
    team2: number | null;
    date2: string | null;
    resources?: number[] | null;
}

// Interface pour le transfert de jobs
export interface JobTransferRequest {
    job_ids: number[];
    counting_orders: number[]; // [1] pour 1er, [2] pour 2e, [1, 2] pour les deux
}

export interface JobTransferResponse {
    success: boolean;
    message: string;
    data: {
        transferred_job_ids: number[];
        counting_orders: number[];
    };
}


