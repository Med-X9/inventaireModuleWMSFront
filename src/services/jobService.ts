import axiosInstance from '@/utils/axiosConfig';
import type { AxiosResponse } from 'axios';
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
    JobReadyResponse,
    JobDataTableResponse,
    JobValidatedDataTableResponse
} from '@/models/Job';
import API from '@/api';
import { normalizeDataTableResponse, convertUnifiedToStandardDataTable } from '@/utils/dataTableResponseNormalizer';
import type { UnifiedDataTableResponse } from '@/utils/dataTableResponseNormalizer';

export class JobService {
    private static baseUrlInventory = API.endpoints.inventory?.base
    private static baseUrlJob = API.endpoints.job?.base;
    private static baseUrlWarehouse = API.endpoints.warehouse?.base;

    // Récupérer tous les jobs avec pagination, tri et filtres (format DataTable)
    static async getAllByUrl(url: string): Promise<JobDataTableResponse & { page: number; totalPages: number; pageSize: number; total: number }> {
        const response = await axiosInstance.get<UnifiedDataTableResponse<JobTable>>(url);
        const unifiedResponse = normalizeDataTableResponse<JobTable>(response.data);
        const standardResponse = convertUnifiedToStandardDataTable(unifiedResponse);
        return {
            ...standardResponse,
            page: unifiedResponse.page,
            totalPages: unifiedResponse.totalPages,
            pageSize: unifiedResponse.pageSize,
            total: unifiedResponse.total
        } as JobDataTableResponse & { page: number; totalPages: number; pageSize: number; total: number };
    }

    // Récupérer tous les jobs avec pagination, tri et filtres (format FORMAT_ACTUEL.md)
    // Le service reçoit les paramètres déjà convertis au format FORMAT_ACTUEL.md par le store
    static async getAll(inventoryId: number, warehouseId: number, params?: Record<string, any>): Promise<JobDataTableResponse & { page: number; totalPages: number; pageSize: number; total: number }> {
        console.log('[JobService.getAll] 🌐 API Call - URL:', `${this.baseUrlInventory}${inventoryId}/warehouse/${warehouseId}/jobs/`)
        console.log('[JobService.getAll] 📋 Params sent to API:', params || {})

        const response = await axiosInstance.get<UnifiedDataTableResponse<JobTable>>(
            `${this.baseUrlInventory}${inventoryId}/warehouse/${warehouseId}/jobs/`,
            {
                params: params || {}
            }
        );

        console.log('[JobService.getAll] 📥 API Response status:', response.status)
        console.log('[JobService.getAll] 📊 Raw response data keys:', Object.keys(response.data))

        const unifiedResponse = normalizeDataTableResponse<JobTable>(response.data);
        console.log('[JobService.getAll] 🔄 Unified response:', {
            total: unifiedResponse.total,
            page: unifiedResponse.page,
            pageSize: unifiedResponse.pageSize,
            totalPages: unifiedResponse.totalPages,
            recordsCount: unifiedResponse.rows?.length || 0
        })
        const standardResponse = convertUnifiedToStandardDataTable(unifiedResponse);
        return {
            ...standardResponse,
            page: unifiedResponse.page,
            totalPages: unifiedResponse.totalPages,
            pageSize: unifiedResponse.pageSize,
            total: unifiedResponse.total
        } as JobDataTableResponse & { page: number; totalPages: number; pageSize: number; total: number };
    }

    static async getAllValidatedByUrl(url: string): Promise<JobValidatedDataTableResponse & { page: number; totalPages: number; pageSize: number; total: number }> {
        const response = await axiosInstance.get<UnifiedDataTableResponse<any>>(url);
        const unifiedResponse = normalizeDataTableResponse<any>(response.data);
        const standardResponse = convertUnifiedToStandardDataTable(unifiedResponse);
        return {
            ...standardResponse,
            page: unifiedResponse.page,
            totalPages: unifiedResponse.totalPages,
            pageSize: unifiedResponse.pageSize,
            total: unifiedResponse.total
        } as JobValidatedDataTableResponse & { page: number; totalPages: number; pageSize: number; total: number };
    }

    // Récupérer tous les jobs validés avec pagination, tri et filtres (format FORMAT_ACTUEL.md)
    // Le service reçoit les paramètres déjà convertis au format FORMAT_ACTUEL.md par le store
    static async getAllValidated(inventoryId: number, warehouseId: number, params?: Record<string, any>): Promise<JobValidatedDataTableResponse & { page: number; totalPages: number; pageSize: number; total: number }> {
        // ⚠️ Validation : vérifier que les IDs sont valides (non null, non undefined, > 0)
        if (!inventoryId || !warehouseId || inventoryId <= 0 || warehouseId <= 0) {
            throw new Error(`IDs invalides pour getAllValidated: inventoryId=${inventoryId}, warehouseId=${warehouseId}`);
        }

        console.log('[JobService.getAllValidated] 🌐 API Call - URL:', `${this.baseUrlJob}valid/warehouse/${warehouseId}/inventory/${inventoryId}/`)
        console.log('[JobService.getAllValidated] 📋 Params sent to API:', params || {})

        const response = await axiosInstance.get<UnifiedDataTableResponse<any>>(
            `${this.baseUrlJob}valid/warehouse/${warehouseId}/inventory/${inventoryId}/`,
            {
                params: params || {}
            }
        );

        console.log('[JobService.getAllValidated] 📥 API Response status:', response.status)
        console.log('[JobService.getAllValidated] 📊 Raw response data keys:', Object.keys(response.data))

        const unifiedResponse = normalizeDataTableResponse<any>(response.data);
        console.log('[JobService.getAllValidated] 🔄 Unified response:', {
            total: unifiedResponse.total,
            page: unifiedResponse.page,
            pageSize: unifiedResponse.pageSize,
            totalPages: unifiedResponse.totalPages,
            recordsCount: unifiedResponse.rows?.length || 0
        })
        const standardResponse = convertUnifiedToStandardDataTable(unifiedResponse);
        return {
            ...standardResponse,
            page: unifiedResponse.page,
            totalPages: unifiedResponse.totalPages,
            pageSize: unifiedResponse.pageSize,
            total: unifiedResponse.total
        } as JobValidatedDataTableResponse & { page: number; totalPages: number; pageSize: number; total: number };
    }

    // Récupérer les jobs avec discrepancies (nouvel endpoint)
    static async getJobsDiscrepancies(inventoryId: number, warehouseId: number, params?: { page?: number; page_size?: number; [key: string]: any; }): Promise<any> {
        const response = await axiosInstance.get(`${this.baseUrlInventory}${inventoryId}/warehouse/${warehouseId}/jobs/discrepancies/`, { params });
        return response.data;
    }

    /**
     * Récupérer les jobs avec écarts groupés par ordre de comptage
     * GET /web/api/inventory/<inventory_id>/warehouse/<warehouse_id>/jobs/discrepancies-by-counting/
     *
     * Réponse attendue:
     * {
     *   success: true,
     *   message: "...",
     *   data: [
     *     {
     *       counting_order: 3,
     *       jobs: [{ job_id, job_reference }, ...]
     *     },
     *     ...
     *   ]
     * }
     */
    static async getJobsDiscrepanciesByCounting(
        inventoryId: number,
        warehouseId: number
    ): Promise<any> {
        const response = await axiosInstance.get<{
            success: boolean
            message: string
            data: any
            errors?: string[]
        }>(
            `${this.baseUrlInventory}${inventoryId}/warehouse/${warehouseId}/jobs/discrepancies-by-counting/`
        );

        // Vérifier le format de réponse
        if (response.data.success && response.data.data) {
            // Nouveau format : objet unique avec next_counting_order
            if (response.data.data && typeof response.data.data === 'object' && !Array.isArray(response.data.data)) {
                return [response.data.data]
            }
            // Ancien format : tableau d'objets avec counting_order
            if (Array.isArray(response.data.data)) {
            return response.data.data
        }
        }

        // Si la réponse n'a pas le format attendu, vérifier directement response.data
        if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
            // Nouveau format directement dans response.data
            return [response.data]
        }

        // Si c'est un tableau, retourner tel quel
        if (Array.isArray(response.data)) {
            return response.data
        }

        // En cas d'erreur ou format inattendu, retourner un tableau vide
        return []
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

    static async setReady(inventoryId: number, warehouseId: number): Promise<JobReadyResponse> {
        const response = await axiosInstance.post<JobReadyResponse>(
            `${this.baseUrlInventory}${inventoryId}/warehouse/${warehouseId}/jobs/set-ready/`);
        return response.data;
    }

    static async transferAll(inventoryId: number, warehouseId: number): Promise<JobReadyResponse> {
        const response = await axiosInstance.post<JobReadyResponse>(
            `${this.baseUrlInventory}${inventoryId}/warehouse/${warehouseId}/jobs/transfer-all/`);
        return response.data;
    }

    static async jobReset(job_ids: number[]): Promise<JobReadyResponse> {
        const response = await axiosInstance.post<JobReadyResponse>(`${this.baseUrlJob}reset-assignments/`, { job_ids:  job_ids  });
        return response.data;
    }

    static async jobTransfer(data: { job_ids: number[]; counting_order: number[] }): Promise<any> {
        const response = await axiosInstance.post(`${this.baseUrlJob}transfer/`, data);
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

    /**
     * Valider tous les jobs pour un inventaire et un entrepôt
     * POST inventory/<int:inventory_id>/warehouse/<int:warehouse_id>/jobs/validate-all/
     */
    static async validateAllJobs(inventoryId: number, warehouseId: number): Promise<UpdateJobStatusResponse> {
        console.log('[JobService.validateAllJobs] 🌐 API Call - URL:', `${this.baseUrlInventory}${inventoryId}/warehouse/${warehouseId}/jobs/validate-all/`);

        const response = await axiosInstance.post<UpdateJobStatusResponse>(
            `${this.baseUrlInventory}${inventoryId}/warehouse/${warehouseId}/jobs/validate-all/`
        );

        console.log('[JobService.validateAllJobs] ✅ Response:', response.data);
        return response.data;
    }



    static async jobAssignmentsTeam(inventoryId:number,data:JobAssignmentsTeamRequest):Promise<JobAssignmentsTeamRequest>{
        const response = await axiosInstance.post<JobAssignmentsTeamRequest>(`${this.baseUrlInventory}${inventoryId}/assign-jobs/`,data);
        return response.data;
    }

    static async assignTeamToJobAuto(data: {
        job_id: number;
        team: number;
        counting_order: number;
        complete: boolean;
    }): Promise<any> {
        const response = await axiosInstance.post(`${this.baseUrlInventory}assign-jobs-manual/`, data);
        return response.data;
    }

    static async jobAssignmentsResource(data:JobAssignmentsResourceRequest):Promise<JobAssignmentsResourceRequest>{
        const response = await axiosInstance.post<JobAssignmentsResourceRequest>(`${this.baseUrlInventory}assign-resources/`,data);
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

    // Lancer un comptage (ancien format - un job à la fois)
    static async launchCounting(data: {
        job_id: number;
        location_id: number;
        session_id: number;
    }): Promise<any> {
        const response = await axiosInstance.post(
            `${this.baseUrlJob}launch-counting/`,
            data
        );
        return response.data;
    }

    // Lancer plusieurs comptages (nouveau format - plusieurs jobs)
    static async launchMultipleCountings(data: {
        jobs: number[];
        session_id: number;
    }): Promise<any> {
        const response = await axiosInstance.post(
            `${this.baseUrlJob}launch-counting/`,
            data
        );
        return response.data;
    }

    /**
     * Récupérer les jobs d'une session
     * GET /web/api/inventory/session/<int:session_id>/assignments/
     */
    static async getSessionAssignments(sessionId: number): Promise<{
        success: boolean;
        message: string;
        data: {
            session_id: number;
            session_username: string;
            jobs: Array<{
                id: number;
                reference: string;
                status: string;
                warehouse_reference: string;
                warehouse_name: string;
                inventory_reference: string;
                inventory_label: string;
            }>;
            total_jobs: number;
        };
    }> {
        const response = await axiosInstance.get(
            `${this.baseUrlInventory}session/${sessionId}/assignments/`
        );
        return response.data;
    }

    /**
     * Générer un PDF pour un job/assignment
     * POST /jobs/<int:job_id>/assignments/<int:assignment_id>/pdf/
     * @param jobId - ID du job
     * @param assignmentId - ID de l'assignment
     * @param equipeId - ID de l'équipe (optionnel)
     * @returns Blob du PDF
     */
    static async generateJobPDF(
        jobId: number,
        assignmentId: number,
        equipeId?: number
    ): Promise<Blob> {
        const response = await axiosInstance.post(
            `${this.baseUrlJob}${jobId}/assignments/${assignmentId}/pdf/`,
            equipeId ? { equipe_id: equipeId } : {},
            {
                responseType: 'blob'
            }
        );
        return response.data;
    }

    /**
     * Exporte les jobs validés en CSV ou Excel
     * @param inventoryId - ID de l'inventaire
     * @param warehouseId - ID de l'entrepôt
     * @param params - Paramètres au format FORMAT_ACTUEL.md avec export: 'csv' ou 'excel'
     * @returns Promise avec la réponse contenant le blob du fichier
     */
    static async exportValidated(
        inventoryId: number,
        warehouseId: number,
        params?: Record<string, any>
    ): Promise<AxiosResponse<Blob>> {
        try {
            const response = await axiosInstance.get(
                `${this.baseUrlJob}valid/warehouse/${warehouseId}/inventory/${inventoryId}/`,
                {
                    params: params || {},
                    responseType: 'blob'
                }
            );
            return response;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Affectation automatique des jobs depuis les location-jobs
     * @param inventoryId - ID de l'inventaire
     * @returns Promise avec la réponse d'affectation automatique
     */
    static async autoAssignJobsFromLocationJobs(inventoryId: number): Promise<AxiosResponse<{
        success: boolean;
        message: string;
        errors?: string[];
    }>> {
        try {
            const response = await axiosInstance.post(
                `${this.baseUrlInventory}${inventoryId}/auto-assign-jobs-from-location-jobs/`
            );
            return response;
        } catch (error) {
            throw error;
        }
    }
}

export const jobService = new JobService();

