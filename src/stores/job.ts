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
    DeleteJobResponse
} from '@/models/Job';

export const useJobStore = defineStore('job', () => {
    // State
    const jobs = ref<JobTable[]>([]);
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
    const fetchJobs = async (warehouseId: number, params?: {
        sort?: Array<{ colId: string; sort: 'asc' | 'desc' }>;
        filter?: Record<string, { filter: string; type?: string; dateFrom?: string; dateTo?: string; filterTo?: string }>;
        page?: number;
        pageSize?: number;
        inventoryId?: number;
    }) => {
        loading.value = true;
        error.value = null;
        try {
            // Construire les paramètres de requête pour Django
            const queryParams: any = {};

            if (params?.sort && params.sort.length > 0) {
                // Convertir le modèle de tri AG Grid en format Django REST Framework
                const sortParams = params.sort.map(sort => {
                    const field = sort.colId;
                    const direction = sort.sort === 'asc' ? field : `-${field}`;
                    return direction;
                });
                queryParams.ordering = sortParams.join(',');
            }

            if (params?.filter) {
                Object.keys(params.filter).forEach(field => {
                    const filter = params.filter![field];
                    if (filter) {
                        // Pour les filtres de type number/date
                        if (filter.type) {
                            let op: string | null = '';
                            switch (filter.type) {
                                case 'equals':
                                case 'exact':
                                    op = '';
                                    break;
                                case 'greaterThan':
                                    op = '__gt';
                                    break;
                                case 'greaterThanOrEqual':
                                    op = '__gte';
                                    break;
                                case 'lessThan':
                                    op = '__lt';
                                    break;
                                case 'lessThanOrEqual':
                                    op = '__lte';
                                    break;
                                case 'inRange':
                                    // Pour les dates
                                    if (filter.dateFrom !== undefined && filter.dateFrom !== null && filter.dateFrom !== '') {
                                        queryParams[`${field}__gte`] = filter.dateFrom;
                                    }
                                    if (filter.dateTo !== undefined && filter.dateTo !== null && filter.dateTo !== '') {
                                        queryParams[`${field}__lte`] = filter.dateTo;
                                    }
                                    // Pour les nombres
                                    if (filter.filter !== undefined && filter.filter !== null && filter.filter !== '') {
                                        queryParams[`${field}__gte`] = filter.filter;
                                    }
                                    if (filter.filterTo !== undefined && filter.filterTo !== null && filter.filterTo !== '') {
                                        queryParams[`${field}__lte`] = filter.filterTo;
                                    }
                                    op = null; // On ne traite pas la suite
                                    break;
                                default:
                                    op = '';
                            }

                            const value = filter.filter ?? filter.dateFrom;
                            if (op !== null && value !== undefined && value !== null && value !== '') {
                                queryParams[`${field}${op}`] = value;
                            }
                        } else if (filter.filter) {
                            // Filtres texte classiques
                            queryParams[field] = filter.filter;
                        }
                    }
                });
            }

            if (params?.page) {
                queryParams.page = params.page;
                currentPage.value = params.page;
            }

            if (params?.pageSize) {
                queryParams.page_size = params.pageSize;
                pageSize.value = params.pageSize;
            }

            // Utiliser l'inventoryId par défaut si non fourni
            const response = await JobService.getAll(warehouseId, queryParams);

            // Extraire les données du champ 'results' de la réponse paginée
            const jobData = response.results || response;
            totalCount.value = response.count || jobData.length;

            jobs.value = jobData;
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

    const deleteJob = async (id: number | string): Promise<DeleteJobResponse> => {
        loading.value = true;
        error.value = null;
        try {
            const response = await JobService.delete(id);
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

    const validateJob = async (id: number | string): Promise<UpdateJobStatusResponse> => {
        return updateJobStatus(id, 'VALIDE');
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
        clearError,
        clearCurrentJob,
        resetState,
    };
});
