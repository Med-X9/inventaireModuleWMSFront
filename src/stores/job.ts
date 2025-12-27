import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { JobService } from '@/services/jobService';
import type {
    Job,
    CreateJobRequest,
    UpdateJobRequest,
    JobTable,
    JobStatus,
    CreateJobResponse,
    AddLocationToJobResponse,
    DeleteLocationFromJobResponse,
    UpdateJobStatusResponse,
    DeleteJobResponse,
    JobPaginatedResponse,
    JobResult,
    JobAssignmentsTeamRequest,
    JobAssignmentsResourceRequest,
    JobManualAssignmentsRequest,
    JobReadyResponse
} from '@/models/Job';
import type { DataTableResponse } from '@/utils/dataTableUtils';
import type { QueryModel } from '@/components/DataTable/types/QueryModel';
import { convertQueryModelToQueryParams } from '@/components/DataTable/utils/queryModelConverter';
import API from '@/api';

export const useJobStore = defineStore('job', () => {
    // State
    const jobs = ref<JobTable[]>([]);
    const jobsValidated = ref<JobResult[]>([]);
    const currentJob = ref<Job | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const totalCount = ref(0);
    const currentPage = ref(1);
    const pageSize = ref(50);
    // Métadonnées de pagination depuis la dernière réponse
    const paginationMetadata = ref<{
        page?: number;
        totalPages?: number;
        pageSize?: number;
        total?: number;
    } | null>(null);

    // Getters
    const getCurrentJob = computed(() => currentJob.value);
    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);
    const getTotalCount = computed(() => totalCount.value);
    const getCurrentPage = computed(() => currentPage.value);
    const getPageSize = computed(() => pageSize.value);

    // ===== FONCTIONS UTILITAIRES =====

    /**
     * Gère les erreurs de manière uniforme avec extraction du message d'erreur backend
     */
    const handleError = async (err: unknown, defaultMessage: string): Promise<never> => {
        let errorMessage = defaultMessage;

        if (err && typeof err === 'object' && 'response' in err) {
            const response = (err as any).response;
            if (response?.data) {
                const backendData = response.data;
                if (backendData.message) {
                    errorMessage = backendData.message;
                } else if (backendData.detail) {
                    errorMessage = backendData.detail;
                } else if (backendData.error) {
                    errorMessage = backendData.error;
                } else if (typeof backendData === 'string') {
                    errorMessage = backendData;
                }
            }
        } else if (err instanceof Error) {
            errorMessage = err.message;
        }

        error.value = errorMessage;
        throw err;
    };

    // ===== ACTIONS =====
    // ⚠️ DÉPRÉCIÉ : Utiliser fetchJobs() à la place - cette méthode est conservée pour compatibilité
    const fetchJobsDataTable = async (inventoryId: number, warehouseId: number, params?: QueryModel) => {
        return await fetchJobs(inventoryId, warehouseId, params);
    };

    /**
     * Récupère la liste des jobs avec pagination, tri et filtres
     * Le store stocke uniquement les données et métadonnées brutes du backend
     * Le DataTable/useBackendDataTable gère la pagination
     */
    const fetchJobs = async (
        inventoryId: number,
        warehouseId: number,
        params?: QueryModel
    ): Promise<DataTableResponse<JobTable>> => {
        loading.value = true;
        error.value = null;
        try {
            // Convertir QueryModel en paramètres de requête
            const requestParams = params ? convertQueryModelToQueryParams(params) : {};

            const requestBody = {
                inventory_id: inventoryId,
                warehouse_id: warehouseId,
                ...requestParams
            } as any; // Type any pour permettre l'accès aux propriétés dynamiques

            const responseData = await JobService.getAll(inventoryId, warehouseId, requestBody);


            // Stocker les données brutes
            jobs.value = responseData.data || [];

            // Stocker les métadonnées de pagination brutes du backend (sans calcul)
            paginationMetadata.value = {
                page: responseData.page ?? 1,
                totalPages: responseData.totalPages ?? 1,
                pageSize: responseData.pageSize ?? 20,
                total: responseData.total ?? responseData.recordsFiltered ?? responseData.recordsTotal ?? 0
            };

            // Mettre à jour totalCount pour compatibilité
            totalCount.value = paginationMetadata.value.total ?? 0;

            // Retourner le format DataTable minimal (le DataTable gère la pagination)
            return {
                draw: responseData.draw || 1,
                data: jobs.value,
                recordsTotal: responseData.recordsTotal ?? paginationMetadata.value.total,
                recordsFiltered: responseData.recordsFiltered ?? paginationMetadata.value.total
            } as any;
        } catch (err: any) {
            await handleError(err, 'Erreur lors de la récupération des jobs');
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Récupère la liste des jobs validés avec pagination, tri et filtres
     * Le store stocke uniquement les données et métadonnées brutes du backend
     * Le DataTable/useBackendDataTable gère la pagination
     */
    const fetchJobsValidated = async (
        inventoryId: number,
        warehouseId: number,
        params?: QueryModel
    ): Promise<DataTableResponse<JobResult>> => {
        loading.value = true;
        error.value = null;
        try {
            // Validation des IDs
            if (!inventoryId || !warehouseId || inventoryId <= 0 || warehouseId <= 0) {
                throw new Error(`IDs invalides pour fetchJobsValidated: inventoryId=${inventoryId}, warehouseId=${warehouseId}`);
            }

            // Convertir QueryModel en paramètres de requête
            const requestParams = params ? convertQueryModelToQueryParams(params) : {};

            const requestBody = {
                inventory_id: inventoryId,
                warehouse_id: warehouseId,
                ...requestParams
            } as any; // Type any pour permettre l'accès aux propriétés dynamiques

            const responseData = await JobService.getAllValidated(inventoryId, warehouseId, requestBody);

            console.log('[jobStore] fetchJobsValidated - API response:', {
                requestedPageSize: requestBody.pageSize || requestBody.page_size,
                actualDataLength: responseData.data?.length || 0,
                total: responseData.total,
                page: responseData.page,
                pageSize: responseData.pageSize
            });

            // Stocker les données brutes
            jobsValidated.value = responseData.data || [];

            // Synchroniser avec la propriété principale du store pour useBackendDataTable
            jobs.value = (responseData.data || []) as any;

            // Stocker les métadonnées de pagination brutes du backend (sans calcul)
            paginationMetadata.value = {
                page: responseData.page ?? 1,
                totalPages: responseData.totalPages ?? 1,
                pageSize: responseData.pageSize ?? 20,
                total: responseData.total ?? responseData.recordsFiltered ?? responseData.recordsTotal ?? 0
            };

            // Mettre à jour totalCount pour compatibilité
            totalCount.value = paginationMetadata.value.total ?? 0;

            // Retourner le format DataTable minimal (le DataTable gère la pagination)
            return {
                draw: responseData.draw || 1,
                data: jobsValidated.value,
                recordsTotal: responseData.recordsTotal ?? paginationMetadata.value.total,
                recordsFiltered: responseData.recordsFiltered ?? paginationMetadata.value.total
            } as any;
        } catch (err: any) {
            await handleError(err, 'Erreur lors de la récupération des jobs validés');
            throw err;
        } finally {
            loading.value = false;
        }
    };
    const fetchJobById = async (id: number | string) => {
        loading.value = true;
        error.value = null;
        try {
            const response = await JobService.getById(id);
            currentJob.value = response;
            return response;
        } catch (err: any) {
            await handleError(err, 'Erreur lors de la récupération du job');
        } finally {
            loading.value = false;
        }
    };

    const createJob = async (inventoryId: number, warehouseId: number, data: CreateJobRequest): Promise<CreateJobResponse> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await JobService.create(inventoryId, warehouseId, data);
            return response;
        } catch (err: any) {
            await handleError(err, 'Erreur lors de la création du job');
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const addLocationToJob = async ( jobId: number , emplacement_ids: number[]): Promise<AddLocationToJobResponse> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await JobService.addLocationToJob( jobId, emplacement_ids);
            return response;
        } catch (err: any) {
            await handleError(err, 'Erreur lors de l\'ajout d\'emplacements au job');
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const deleteLocationFromJob = async (jobId: number, emplacements: number): Promise<DeleteLocationFromJobResponse> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await JobService.deleteLocationFromJob(jobId, emplacements);
            return response;
        } catch (err: any) {
            await handleError(err, 'Erreur lors de la suppression d\'emplacements du job');
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const deleteJob = async (id: number[]): Promise<DeleteJobResponse> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await JobService.delete(id);

            // Vérifier si la réponse indique un échec
            if (response.success === false) {
                // Créer un objet d'erreur qui sera intercepté par le catch
                const errorData = {
                    response: {
                        data: response
                    }
                };
                throw errorData;
            }

            // Rafraîchir la liste des jobs
            return response;
        } catch (err: any) {
            await handleError(err, 'Erreur lors de la suppression du job');
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const updateJobStatus = async (id: number | string, status: JobStatus): Promise<UpdateJobStatusResponse> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await JobService.updateStatus(id, status);
            if (currentJob.value?.id === Number(id)) {
                currentJob.value = response.data.job;
            }
            return response;
        } catch (err: any) {
            await handleError(err, 'Erreur lors de la mise à jour du statut');
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const validateJob = async (id: number[]): Promise<UpdateJobStatusResponse> => {
        return await JobService.validateJob(id);
    };

    const completeJob = async (id: number | string): Promise<UpdateJobStatusResponse> => {
        return updateJobStatus(id, 'TERMINE');
    };

    const setJobWaiting = async (id: number | string): Promise<UpdateJobStatusResponse> => {
        return updateJobStatus(id, 'EN ATTENTE');
    };

    const fetchJobsByWarehouse = async (warehouseId: number, params?: {
        page?: number;
        page_size?: number;
        ordering?: string;
    }) => {
        loading.value = true;
        error.value = null;
        try {
            const response = await JobService.getByWarehouse(warehouseId, params);
            jobs.value = response.results;
            totalCount.value = response.count;
            return response;
        } catch (err: any) {
            await handleError(err, 'Erreur lors de la récupération des jobs par entrepôt');
        } finally {
            loading.value = false;
        }
    };

    const fetchJobsByInventory = async (inventoryId: number, params?: {
        page?: number;
        page_size?: number;
        ordering?: string;
    }) => {
        loading.value = true;
        error.value = null;
        try {
            const response = await JobService.getByInventory(inventoryId, params);
            jobs.value = response.results;
            totalCount.value = response.count;
            return response;
        } catch (err: any) {
            await handleError(err, 'Erreur lors de la récupération des jobs par inventaire');
        } finally {
            loading.value = false;
        }
    };

    const fetchJobsByStatus = async (status: JobStatus, params?: {
        page?: number;
        page_size?: number;
        ordering?: string;
    }) => {
        loading.value = true;
        error.value = null;
        try {
            const response = await JobService.getByStatus(status, params);
            jobs.value = response.results;
            totalCount.value = response.count;
            return response;
        } catch (err: any) {
            await handleError(err, 'Erreur lors de la récupération des jobs par statut');
        } finally {
            loading.value = false;
        }
    };

    // Assigner des équipes aux jobs
    const assignTeamsToJobs = async (inventoryId: number, data: JobAssignmentsTeamRequest): Promise<JobAssignmentsTeamRequest> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await JobService.jobAssignmentsTeam(inventoryId, data);
            return response;
        } catch (err: any) {
            await handleError(err, 'Erreur lors de l\'assignation des équipes aux jobs');
            throw err;
        } finally {
            loading.value = false;
        }
    };

    // Assigner des ressources aux jobs
    const assignResourcesToJobs = async (inventoryId: number, data: JobAssignmentsResourceRequest): Promise<JobAssignmentsResourceRequest> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await JobService.jobAssignmentsResource(data);
            return response;
        } catch (err: any) {
            await handleError(err, 'Erreur lors de l\'assignation des ressources aux jobs');
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const assignJobsManual = async (data: JobManualAssignmentsRequest[]): Promise<JobManualAssignmentsRequest> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await JobService.jobManualAssignments(data);
            return response;
        } catch (err: any) {
            await handleError(err, 'Erreur lors de l\'assignation des jobs manuellement');
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const jobReady = async (job_ids: number[]): Promise<JobReadyResponse> => {
        return await JobService.jobReady(job_ids);
    };

    const setReady = async (inventoryId: number, warehouseId: number): Promise<JobReadyResponse> => {
        return await JobService.setReady(inventoryId, warehouseId);
    };

    const transferAll = async (inventoryId: number, warehouseId: number): Promise<JobReadyResponse> => {
        return await JobService.transferAll(inventoryId, warehouseId);
    };

    const jobReset = async (job_ids: number[]): Promise<JobReadyResponse> => {
        return await JobService.jobReset(job_ids);
    };

    const jobTransfer = async (job_ids: number[], counting_order: number[]): Promise<any> => {
        return await JobService.jobTransfer({ job_ids, counting_order });
    };

    /**
     * Lancer un comptage pour un job, un emplacement et une session
     */
    const launchCounting = async (data: {
        job_id: number;
        location_id: number;
        session_id: number;
    }): Promise<any> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await JobService.launchCounting(data);

            // Vérifier si la réponse indique un échec (success: false)
            if (response && response.success === false) {
                const errorMessage = response.message || 'Erreur lors du lancement du comptage';
                error.value = errorMessage;
                // Créer un objet d'erreur qui sera intercepté par le catch
                const errorData: any = {
                    response: {
                        data: {
                            message: errorMessage,
                            success: false
                        }
                    }
                };
                // Attacher le message directement à l'erreur pour faciliter l'accès
                errorData.userMessage = errorMessage;
                throw errorData;
            }

            return response;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message ||
                                err.userMessage ||
                                err.message ||
                                'Erreur lors du lancement du comptage';
            error.value = errorMessage;
            err.userMessage = errorMessage;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Lancer plusieurs comptages pour plusieurs jobs avec une session
     */
    const launchMultipleCountings = async (data: {
        jobs: number[];
        session_id: number;
    }): Promise<any> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await JobService.launchMultipleCountings(data);

            // Vérifier si la réponse indique un échec (success: false)
            if (response && response.success === false) {
                const errorMessage = response.message || 'Erreur lors du lancement des comptages';
                error.value = errorMessage;
                const errorData: any = {
                    response: {
                        data: {
                            message: errorMessage,
                            success: false
                        }
                    }
                };
                errorData.userMessage = errorMessage;
                throw errorData;
            }

            return response;
        } catch (err: any) {
            const errorMessage = err.response?.data?.message ||
                                err.userMessage ||
                                err.message ||
                                'Erreur lors du lancement des comptages';
            error.value = errorMessage;
            err.userMessage = errorMessage;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Récupérer les jobs avec discrepancies
     * GET /web/api/inventory/<inventory_id>/warehouse/<warehouse_id>/jobs/discrepancies/
     */
    const fetchJobsDiscrepancies = async (
        inventoryId: number,
        warehouseId: number,
        params?: { page?: number; page_size?: number; [key: string]: any; }
    ): Promise<any> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await JobService.getJobsDiscrepancies(inventoryId, warehouseId, params);
            return response;
        } catch (err: any) {
            await handleError(err, 'Erreur lors de la récupération des jobs avec discrepancies');
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Récupérer les assignments d'une session
     * GET /web/api/inventory/session/<int:session_id>/assignments/
     */
    const getSessionAssignments = async (sessionId: number): Promise<{
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
    }> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await JobService.getSessionAssignments(sessionId);
            return response;
        } catch (err: any) {
            await handleError(err, 'Erreur lors de la récupération des assignments de la session');
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Générer un PDF pour un job/assignment
     * POST /jobs/<int:job_id>/assignments/<int:assignment_id>/pdf/
     */
    const generateJobPDF = async (
        jobId: number,
        assignmentId: number,
        equipeId?: number
    ): Promise<Blob> => {
        loading.value = true;
        error.value = null;
        try {
            const blob = await JobService.generateJobPDF(jobId, assignmentId, equipeId);
            return blob;
        } catch (err: any) {
            await handleError(err, 'Erreur lors de la génération du PDF');
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const clearError = () => {
        error.value = null;
    };

    const clearCurrentJob = () => {
        currentJob.value = null;
    };

    const resetState = () => {
        jobs.value = [];
        currentJob.value = null;
        loading.value = false;
        error.value = null;
        totalCount.value = 0;
        currentPage.value = 1;
        pageSize.value = 50;
    };

    /**
     * Affectation automatique des jobs depuis les location-jobs
     * @param inventoryId - ID de l'inventaire
     * @returns Promise avec la réponse d'affectation automatique
     */
    const autoAssignJobsFromLocationJobs = async (inventoryId: number): Promise<{
        success: boolean;
        message: string;
        errors?: string[];
    }> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await JobService.autoAssignJobsFromLocationJobs(inventoryId);
            return response.data;
        } catch (err: any) {
            await handleError(err, 'Erreur lors de l\'affectation automatique des jobs');
            throw err;
        } finally {
            loading.value = false;
        }
    };

    return {
        // State
        jobs,
        jobsValidated,
        currentJob,
        loading,
        error,
        totalCount,
        currentPage,
        pageSize,
        paginationMetadata,

        // Getters
        getCurrentJob,
        isLoading,
        getError,
        getTotalCount,
        getCurrentPage,
        getPageSize,

        // Actions
        fetchJobs,
        fetchJobsDataTable,
        fetchJobsValidated,
        fetchJobById,
        createJob,
        addLocationToJob,
        deleteLocationFromJob,
        deleteJob,
        updateJobStatus,
        validateJob,
        completeJob,
        setJobWaiting,
        fetchJobsByWarehouse,
        fetchJobsByInventory,
        fetchJobsByStatus,
        assignTeamsToJobs,
        assignResourcesToJobs,
        assignJobsManual,
        clearError,
        clearCurrentJob,
        resetState,
        jobReady,
        setReady,
        transferAll,
        jobReset,
        jobTransfer,
        launchCounting,
        launchMultipleCountings,
        fetchJobsDiscrepancies,
        getSessionAssignments,
        generateJobPDF,
        autoAssignJobsFromLocationJobs,
    };
});
