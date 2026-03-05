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
    JobReadyResponse
} from '@/models/Job';
import type { DataTableResponse } from '@/utils/dataTableUtils';
import type { QueryModel } from '@SMATCH-Digital-dev/vue-system-design';
import { convertQueryModelToQueryParams } from '@SMATCH-Digital-dev/vue-system-design';
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
    // Métadonnées de pagination depuis la dernière réponse (pour fetchJobsDiscrepancies)
    const jobsPaginationMetadata = ref<{
        page?: number;
        totalPages?: number;
        pageSize?: number;
        total?: number;
    } | null>(null);
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
            const requestParams = params ? convertQueryModelToQueryParams(params) : new URLSearchParams();
            console.log('[jobStore.fetchJobs] 🔄 Converted query params:', Object.fromEntries(requestParams.entries()))

            const requestBody = {
                inventory_id: inventoryId,
                warehouse_id: warehouseId,
                ...Object.fromEntries(requestParams.entries()) // Convertir URLSearchParams en objet
            } as any; // Type any pour permettre l'accès aux propriétés dynamiques

            console.log('[jobStore.fetchJobs] 📤 Final request body:', requestBody)

            const responseData = await JobService.getAll(inventoryId, warehouseId, requestBody);

            // Utiliser la pageSize demandée si elle existe, sinon celle de la réponse
            const requestedPageSize = requestBody.pageSize || requestBody.page_size
            const responsePageSize = responseData.pageSize

            // Convertir pageSize en number pour éviter les erreurs de type
            const pageSizeNumber = Number(requestedPageSize) || Number(responsePageSize) || 20;

            // ⚠️ Définir paginationMetadata AVANT jobs pour que les vues reçoivent le total serveur (ex: 75) avant rowDataProp
            const totalFromApi = responseData.total ?? responseData.recordsFiltered ?? responseData.recordsTotal ?? 0;
            paginationMetadata.value = {
                page: responseData.page ?? 1,
                totalPages: responseData.totalPages ?? 1,
                pageSize: pageSizeNumber,
                total: Number(totalFromApi)
            };

            // Stocker les données brutes (après les métadonnées pour cohérence réactivité)
            jobs.value = responseData.data || [];

            console.log('[jobStore.fetchJobs] 📊 Final pagination metadata:', {
                requestedPageSize,
                responsePageSize,
                finalPageSize: paginationMetadata.value.pageSize,
                page: paginationMetadata.value.page,
                total: paginationMetadata.value.total
            })

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
            const requestParams = params ? convertQueryModelToQueryParams(params) : new URLSearchParams();
            console.log('[jobStore.fetchJobsValidated] 🔄 Converted query params:', Object.fromEntries(requestParams.entries()))

            const requestBody = {
                inventory_id: inventoryId,
                warehouse_id: warehouseId,
                ...Object.fromEntries(requestParams.entries()) // Convertir URLSearchParams en objet
            } as any; // Type any pour permettre l'accès aux propriétés dynamiques

            console.log('[jobStore.fetchJobsValidated] 📤 Final request body:', requestBody)

            const responseData = await JobService.getAllValidated(inventoryId, warehouseId, requestBody);

            // Utiliser la pageSize demandée si elle existe, sinon celle de la réponse
            const requestedPageSize = requestBody.pageSize || requestBody.page_size
            const responsePageSize = responseData.pageSize

            console.log('[jobStore] fetchJobsValidated - API response:', {
                requestedPageSize,
                responsePageSize,
                actualDataLength: responseData.data?.length || 0,
                total: responseData.total,
                page: responseData.page
            });

            // Convertir pageSize en number pour éviter les erreurs de type
            const pageSizeNumber = Number(requestedPageSize) || Number(responsePageSize) || 20;

            // ⚠️ Définir paginationMetadata AVANT jobs pour que les vues reçoivent le total serveur (ex: 75) avant rowDataProp
            const totalFromApi = responseData.total ?? responseData.recordsFiltered ?? responseData.recordsTotal ?? 0;
            paginationMetadata.value = {
                page: responseData.page ?? 1,
                totalPages: responseData.totalPages ?? 1,
                pageSize: pageSizeNumber,
                total: Number(totalFromApi)
            };

            // Stocker les données brutes (après les métadonnées pour cohérence réactivité)
            jobsValidated.value = responseData.data || [];
            jobs.value = (responseData.data || []) as any;

            console.log('[jobStore.fetchJobsValidated] 📊 Final pagination metadata:', {
                page: paginationMetadata.value.page,
                pageSize: paginationMetadata.value.pageSize,
                totalPages: paginationMetadata.value.totalPages,
                total: paginationMetadata.value.total
            });

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

    const validateAllJobs = async (inventoryId: number, warehouseId: number): Promise<UpdateJobStatusResponse> => {
        loading.value = true;
        error.value = null;
        try {
            return await JobService.validateAllJobs(inventoryId, warehouseId);
        } catch (err: any) {
            await handleError(err, 'Erreur lors de la validation de tous les jobs');
            throw err;
        } finally {
            loading.value = false;
        }
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

    /**
     * Assigner une équipe à un job spécifique pour un counting_order
     */
    const assignTeamToJob = async (inventoryId: number, data: {
        job_id: number;
        counting_order: number;
        session_id: number;
        date_start: string;
    }): Promise<any> => {
        loading.value = true;
        error.value = null;
        try {
            // Utiliser la méthode existante avec un seul job_id
            const request: JobAssignmentsTeamRequest = {
                job_ids: [data.job_id],
                counting_order: data.counting_order,
                session_id: data.session_id,
                date_start: data.date_start
            };

            const response = await JobService.jobAssignmentsTeam(inventoryId, request);
            return response;
        } catch (err: any) {
            await handleError(err, 'Erreur lors de l\'assignation de l\'équipe au job');
            throw err;
        } finally {
            loading.value = false;
        }
    };

    /**
     * Assigner automatiquement une équipe à un job (sauvegarde automatique)
     */
    const assignTeamToJobAuto = async (data: {
        job_id: number;
        team: number;
        counting_order: number;
        complete: boolean;
    }): Promise<any> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await JobService.assignTeamToJobAuto(data);
            return response;
        } catch (err: any) {
            await handleError(err, 'Erreur lors de l\'assignation automatique de l\'équipe');
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

            // Stocker les métadonnées de pagination brutes du backend (sans calcul)
            // Format: { success: true, data: [...], rowCount: 2, totalCount: 2, page: 1, pageSize: 20 }
            jobsPaginationMetadata.value = {
                page: response.page ?? 1,
                totalPages: response.totalPages ?? response.total_pages ?? 1,
                pageSize: response.pageSize ?? response.page_size ?? 20,
                total: response.total ?? response.totalCount ?? response.recordsFiltered ?? response.recordsTotal ?? 0
            };

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
        jobsPaginationMetadata,

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
        validateAllJobs,
        completeJob,
        setJobWaiting,
        fetchJobsByWarehouse,
        fetchJobsByInventory,
        fetchJobsByStatus,
        assignTeamsToJobs,
        assignTeamToJob,
        assignTeamToJobAuto,
        assignResourcesToJobs,
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
