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
