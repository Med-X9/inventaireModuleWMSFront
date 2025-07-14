import axiosInstance from '@/utils/axiosConfig';
import type {
    Job,
    CreateJobRequest,
    UpdateJobRequest,
    JobResponse,
    JobTable,
    CreateJobResponse,
    AddLocationToJobResponse,
    DeleteLocationFromJobResponse,
    UpdateJobStatusResponse,
    DeleteJobResponse,
    JobPaginatedResponse,
    JobAssignmentsTeamRequest,
    JobAssignmentsResourceRequest,
    JobManualAssignmentsRequest,
    JobReadyResponse
} from '@/models/Job';
import API from '@/api';

export class JobService {
    private static baseUrlInventory = API.endpoints.inventory?.base;
    private static baseUrlJob = API.endpoints.job?.base;
    private static baseUrlWarehouse = API.endpoints.warehouse?.base;

    // Récupérer tous les jobs avec pagination, tri et filtres
    static async getAll(inventoryId: number, warehouseId: number, params?: { page?: number; page_size?: number; ordering?: string; [key: string]: any; }): Promise<JobResponse> {
        const response = await axiosInstance.get<JobResponse>(`${this.baseUrlInventory}${inventoryId}/warehouse/${warehouseId}/jobs/`, { params });
        return response.data;
    }

    static async getAllValidated(inventoryId: number, warehouseId: number, params?: { page?: number; page_size?: number; ordering?: string; [key: string]: any; }): Promise<JobPaginatedResponse> {
        const response = await axiosInstance.get<JobPaginatedResponse>(`${this.baseUrlJob}valid/warehouse/${warehouseId}/inventory/${inventoryId}/`, { params });
        return response.data;
    }

    // Récupérer un job par ID
    static async getById(id: number | string): Promise<Job> {
        const response = await axiosInstance.get<Job>(`${this.baseUrlInventory}${id}/`);
        return response.data;
    }

    // Créer un nouveau job
    static async create(inventoryId: number, warehouseId: number, data: CreateJobRequest): Promise<CreateJobResponse> {
        const response = await axiosInstance.post<CreateJobResponse>(`${this.baseUrlInventory}planning/${inventoryId}/warehouse/${warehouseId}/jobs/create/`, data);
        return response.data;
    }

    // Ajouter des emplacements à un job
    static async addLocationToJob(jobId: number, emplacement_ids: number[]): Promise<AddLocationToJobResponse> {
        const response = await axiosInstance.post<AddLocationToJobResponse>(`${this.baseUrlJob}${jobId}/add-emplacements/`, {
            emplacement_ids
        });
        return response.data;
    }

    // Supprimer des emplacements d'un job
    static async deleteLocationFromJob(jobId: number, emplacement_id: number): Promise<DeleteLocationFromJobResponse> {
        const response = await axiosInstance.delete<DeleteLocationFromJobResponse>(`${this.baseUrlJob}${jobId}/remove-emplacements/`, {
            data: { emplacement_id }
        });
        return response.data;
    }

    // Supprimer un job
    static async delete(job_ids: number[]): Promise<DeleteJobResponse> {
        const response = await axiosInstance.delete<DeleteJobResponse>(`${this.baseUrlJob}delete/`, { data: { job_ids } });
        return response.data;
    }

    static async jobReady(job_ids: number[]): Promise<JobReadyResponse> {
        const response = await axiosInstance.post<JobReadyResponse>(`${this.baseUrlJob}ready/`, { job_ids:  job_ids  });
        return response.data;
    }

    static async jobReset(job_ids: number[]): Promise<JobReadyResponse> {
        const response = await axiosInstance.post<JobReadyResponse>(`${this.baseUrlJob}reset-assignments/`, { job_ids:  job_ids  });
        return response.data;
    }

    // Changer le statut d'un job
    static async updateStatus(id: number | string, status: string): Promise<UpdateJobStatusResponse> {
        const response = await axiosInstance.patch<UpdateJobStatusResponse>(`${this.baseUrlInventory}${id}/`, {
            status,
            ...(status === 'EN ATTENTE' && { en_attente_date: new Date().toISOString() }),
            ...(status === 'VALIDE' && { valide_date: new Date().toISOString() }),
            ...(status === 'TERMINE' && { termine_date: new Date().toISOString() }),
        });
        return response.data;
    }

    // Récupérer les jobs par entrepôt
    static async getByWarehouse(warehouseId: number, params?: {
        page?: number;
        page_size?: number;
        ordering?: string;
    }): Promise<JobResponse> {
        const response = await axiosInstance.get<JobResponse>(`${this.baseUrlInventory}`, {
            params: { warehouse: warehouseId, ...params }
        });
        return response.data;
    }

    // Récupérer les jobs par inventaire
    static async getByInventory(inventoryId: number, params?: {
        page?: number;
        page_size?: number;
        ordering?: string;
    }): Promise<JobResponse> {
        const response = await axiosInstance.get<JobResponse>(`${this.baseUrlInventory}`, {
            params: { inventory: inventoryId, ...params }
        });
        return response.data;
    }

    // Récupérer les jobs par statut
    static async getByStatus(status: string, params?: {
        page?: number;
        page_size?: number;
        ordering?: string;
    }): Promise<JobResponse> {
        const response = await axiosInstance.get<JobResponse>(`${this.baseUrlInventory}`, {
            params: { status, ...params }
        });
        return response.data;
    }

    // Valider un job
    static async validateJob(job_ids: number[]): Promise<UpdateJobStatusResponse> {
        const response = await axiosInstance.post<UpdateJobStatusResponse>(`${this.baseUrlJob}validate/`, { job_ids });
        return response.data;
    }



    static async jobAssignmentsTeam(inventoryId:number,data:JobAssignmentsTeamRequest):Promise<JobAssignmentsTeamRequest>{
        const response = await axiosInstance.post<JobAssignmentsTeamRequest>(`${this.baseUrlInventory}${inventoryId}/assign-jobs/`,data);
        return response.data;
    }

    static async jobAssignmentsResource(data:JobAssignmentsResourceRequest):Promise<JobAssignmentsResourceRequest>{
        const response = await axiosInstance.post<JobAssignmentsResourceRequest>(`${this.baseUrlInventory}assign-resources/`,data);
        return response.data;
    }

    static async jobManualAssignments(data:JobManualAssignmentsRequest[]):Promise<JobManualAssignmentsRequest>{
        const response = await axiosInstance.post<JobManualAssignmentsRequest>(`${this.baseUrlInventory}assign-jobs-manual/`,data);
        return response.data;
    }

    // Terminer un job
    static async completeJob(id: number | string): Promise<UpdateJobStatusResponse> {
        return this.updateStatus(id, 'TERMINE');
    }

    // Mettre en attente un job
    static async setJobWaiting(id: number | string): Promise<UpdateJobStatusResponse> {
        return this.updateStatus(id, 'EN ATTENTE');
    }
}

export const jobService = new JobService();
