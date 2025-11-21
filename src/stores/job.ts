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
import {
    buildDataTableParams,
    processDataTableResponse,
    type DataTableParams,
    type DataTableResponse
} from '@/utils/dataTableUtils';
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

    // Getters
    const getCurrentJob = computed(() => currentJob.value);
    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);
    const getTotalCount = computed(() => totalCount.value);
    const getCurrentPage = computed(() => currentPage.value);
    const getPageSize = computed(() => pageSize.value);

    // Actions
    // Exemple d'utilisation des utilitaires DataTable pour fetchJobs
    const fetchJobsDataTable = async (inventoryId: number, warehouseId: number, params?: DataTableParams) => {
        loading.value = true;
        error.value = null;
        try {
            // Construire les paramètres DataTable avec les utilitaires
            const queryParams = buildDataTableParams({
                page: params?.page || currentPage.value,
                pageSize: params?.pageSize || pageSize.value,
                globalSearch: params?.globalSearch,
                sort: params?.sort,
                filter: params?.filter
            });

            // Ajouter les paramètres spécifiques au job
            queryParams.append('inventory_id', inventoryId.toString());
            queryParams.append('warehouse_id', warehouseId.toString());

            // Appeler l'API avec les paramètres DataTable
            const response = await JobService.getAll(inventoryId, warehouseId, {
                page: params?.page || currentPage.value,
                pageSize: params?.pageSize || pageSize.value,
                search: params?.globalSearch,
                sort: params?.sort,
                filter: params?.filter
            });
            const jobData = response.results || [];
            jobs.value = jobData;
            totalCount.value = response.count || jobData.length;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Erreur lors de la récupération des jobs';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const fetchJobs = async (inventoryId: number, warehouseId: number, params?: DataTableParams): Promise<DataTableResponse<JobTable>> => {
        loading.value = true;
        error.value = null;
        try {
            // Construire les paramètres DataTable au format Django
            const queryParams = buildDataTableParams({
                page: params?.page || currentPage.value,
                pageSize: params?.pageSize || pageSize.value,
                globalSearch: params?.globalSearch,
                sort: params?.sort,
                filter: params?.filter
            });

            // Construire l'URL avec les paramètres DataTable
            const baseUrl = `${API.endpoints.inventory?.base}${inventoryId}/warehouse/${warehouseId}/jobs/`;
            const url = `${baseUrl}?${queryParams.toString()}`;

            // Appeler l'API avec les paramètres DataTable
            const responseData = await JobService.getAllByUrl(url);

            const jobData = responseData.data || [];
            jobs.value = jobData;
            totalCount.value = responseData.recordsFiltered || jobData.length;

            // Retourner le format attendu par useGenericDataTable
            return {
                draw: responseData.draw || 1,
                data: jobData,
                recordsTotal: responseData.recordsTotal || 0,
                recordsFiltered: responseData.recordsFiltered || jobData.length
            };
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Erreur lors de la récupération des jobs';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const fetchJobsValidated = async (inventoryId: number, warehouseId: number, params?: DataTableParams) => {
        loading.value = true;
        error.value = null;
        try {
            // Construire les paramètres DataTable au format Django
            const queryParams = buildDataTableParams({
                page: params?.page || currentPage.value,
                pageSize: params?.pageSize || pageSize.value,
                globalSearch: params?.globalSearch,
                sort: params?.sort,
                filter: params?.filter
            });

            // Construire l'URL avec les paramètres DataTable
            const baseUrl = `${API.endpoints.job?.base}valid/warehouse/${warehouseId}/inventory/${inventoryId}/`;
            const url = `${baseUrl}?${queryParams.toString()}`;

            // Appeler l'API avec les paramètres DataTable
            const responseData = await JobService.getAllValidatedByUrl(url);

            const jobData = responseData.data || [];
            jobsValidated.value = jobData;

            // Utiliser recordsFiltered pour la pagination
            totalCount.value = responseData.recordsFiltered || jobData.length;

            // Retourner le format attendu par useGenericDataTable
            return {
                draw: responseData.draw || 1,
                data: jobData,
                recordsTotal: responseData.recordsTotal || 0,
                recordsFiltered: responseData.recordsFiltered || jobData.length
            };
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Erreur lors de la récupération des jobs';
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
            error.value = err.response?.data?.message || 'Erreur lors de la récupération du job';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const createJob = async (inventoryId: number, warehouseId: number, data: CreateJobRequest): Promise<CreateJobResponse> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await JobService.create(inventoryId, warehouseId, data);
            // Rafraîchir la liste des jobs
            return response;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Erreur lors de la création du job';
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
            // Récupérer le message d'erreur du backend
            let errorMessage = 'Erreur lors de l\'ajout d\'emplacements au job';

            if (err.response?.data) {
                const backendData = err.response.data;
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

            error.value = errorMessage;
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
            // Récupérer le message d'erreur du backend
            let errorMessage = 'Erreur lors de la suppression d\'emplacements du job';

            if (err.response?.data) {
                const backendData = err.response.data;
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

            error.value = errorMessage;
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
            error.value = err.response?.data?.message || 'Erreur lors de la suppression du job';
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
            // Mettre à jour le job courant si c'est celui-ci
            if (currentJob.value?.id === Number(id)) {
                currentJob.value = response.data.job;
            }
            // Rafraîchir la liste des jobs
            return response;
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Erreur lors de la mise à jour du statut';
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
            error.value = err.response?.data?.message || 'Erreur lors de la récupération des jobs par entrepôt';
            throw err;
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
            error.value = err.response?.data?.message || 'Erreur lors de la récupération des jobs par inventaire';
            throw err;
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
            error.value = err.response?.data?.message || 'Erreur lors de la récupération des jobs par statut';
            throw err;
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
            // Récupérer le message d'erreur du backend
            let errorMessage = 'Erreur lors de l\'assignation des équipes aux jobs';

            if (err.response?.data) {
                const backendData = err.response.data;
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

            error.value = errorMessage;
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
            // Récupérer le message d'erreur du backend
            let errorMessage = 'Erreur lors de l\'assignation des ressources aux jobs';

            if (err.response?.data) {
                const backendData = err.response.data;
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

            error.value = errorMessage;
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
            error.value = err.response?.data?.message || 'Erreur lors de l\'assignation des jobs manuellement';
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const jobReady = async (job_ids: number[]): Promise<JobReadyResponse> => {
        return await JobService.jobReady(job_ids);
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
            // Extraire le message d'erreur du backend
            const errorMessage = err.response?.data?.message || 
                                err.userMessage ||
                                err.message || 
                                'Erreur lors du lancement du comptage';
            error.value = errorMessage;
            // Attacher le message à l'erreur pour qu'il soit accessible dans le composable
            err.userMessage = errorMessage;
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
        jobReset,
        jobTransfer,
        launchCounting,
    };
});
