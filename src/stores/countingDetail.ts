import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { CountingDetailService } from '@/services/CountingDetailService'
import type {
    CountingDetailResponse,
    SyncData,
    SyncInventory,
    SyncJob,
    SyncAssignment,
    SyncCounting
} from '@/models/CountingDetail'
import type { AxiosResponse } from 'axios'
import { logger } from '@/services/loggerService'

export const useCountingDetailStore = defineStore('countingDetail', () => {
    // ===== STATE =====
    const syncData = ref<SyncData>({
        inventories: [],
        jobs: [],
        assignments: [],
        countings: []
    })
    const syncId = ref<string | null>(null)
    const syncTimestamp = ref<string | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    // ===== GETTERS =====
    const getSyncData = computed(() => syncData.value)
    const getInventories = computed(() => syncData.value.inventories)
    const getJobs = computed(() => syncData.value.jobs)
    const getAssignments = computed(() => syncData.value.assignments)
    const getCountings = computed(() => syncData.value.countings)
    const getSyncId = computed(() => syncId.value)
    const getSyncTimestamp = computed(() => syncTimestamp.value)
    const isLoading = computed(() => loading.value)
    const getError = computed(() => error.value)

    // ===== FONCTIONS UTILITAIRES =====

    /**
     * Gère les erreurs de manière uniforme avec extraction du message d'erreur backend
     */
    const handleError = (err: unknown, defaultMessage: string): never => {
        let errorMessage = defaultMessage

        if (err && typeof err === 'object' && 'response' in err) {
            const response = (err as any).response
            if (response?.data) {
                const backendData = response.data
                if (backendData.message) {
                    errorMessage = backendData.message
                } else if (backendData.detail) {
                    errorMessage = backendData.detail
                } else if (backendData.error) {
                    errorMessage = backendData.error
                } else if (Array.isArray(backendData.errors)) {
                    const errorMessages = backendData.errors
                        .map((errItem: any) => {
                            if (typeof errItem === 'string') {
                                return errItem
                            }
                            if (errItem?.message) {
                                return errItem.message
                            }
                            if (errItem?.field && errItem?.message) {
                                return `${errItem.field}: ${errItem.message}`
                            }
                            return null
                        })
                        .filter((msg: string | null): msg is string => msg !== null)
                    if (errorMessages.length > 0) {
                        errorMessage = errorMessages.join(' | ')
                    }
                } else if (typeof backendData === 'string') {
                    errorMessage = backendData
                }
            }
        } else if (err instanceof Error) {
            errorMessage = err.message
        }

        error.value = errorMessage
        throw err
    }

    // ===== ACTIONS =====

    /**
     * Récupérer les données de synchronisation complètes
     * @param params - Paramètres optionnels (pagination, filtres, etc.)
     * @returns Promise avec la réponse complète
     */
    const fetchSyncData = async (
        params?: Record<string, any>
    ): Promise<CountingDetailResponse> => {
        loading.value = true
        error.value = null
        try {
            logger.debug('Store: Récupération des données de synchronisation', { params })

            const response = await CountingDetailService.getSyncData(params)
            const responseData = response.data.data

            if (responseData?.data) {
                syncData.value = responseData.data
                syncId.value = responseData.sync_id || null
                syncTimestamp.value = responseData.timestamp || null
            }

            logger.debug('Store: Données de synchronisation chargées', {
                syncId: syncId.value,
                inventoriesCount: syncData.value.inventories.length,
                jobsCount: syncData.value.jobs.length,
                assignmentsCount: syncData.value.assignments.length,
                countingsCount: syncData.value.countings.length
            })

            return response.data
        } catch (err: any) {
            await handleError(err, 'Erreur lors de la récupération des données de synchronisation')
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Récupérer uniquement les données de synchronisation (version simplifiée)
     * @param params - Paramètres optionnels
     * @returns Promise avec les données de synchronisation
     */
    const fetchSyncDataOnly = async (
        params?: Record<string, any>
    ): Promise<SyncData> => {
        loading.value = true
        error.value = null
        try {
            const data = await CountingDetailService.getSyncDataOnly(params)
            syncData.value = data
            return data
        } catch (err: any) {
            await handleError(err, 'Erreur lors de la récupération des données de synchronisation')
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Récupérer uniquement les inventaires
     * @param params - Paramètres optionnels
     * @returns Promise avec le tableau d'inventaires
     */
    const fetchInventories = async (
        params?: Record<string, any>
    ): Promise<SyncInventory[]> => {
        loading.value = true
        error.value = null
        try {
            const inventories = await CountingDetailService.getInventories(params)
            syncData.value.inventories = inventories
            return inventories
        } catch (err: any) {
            await handleError(err, 'Erreur lors de la récupération des inventaires')
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Récupérer uniquement les jobs
     * @param params - Paramètres optionnels
     * @returns Promise avec le tableau de jobs
     */
    const fetchJobs = async (
        params?: Record<string, any>
    ): Promise<SyncJob[]> => {
        loading.value = true
        error.value = null
        try {
            const jobs = await CountingDetailService.getJobs(params)
            syncData.value.jobs = jobs
            return jobs
        } catch (err: any) {
            await handleError(err, 'Erreur lors de la récupération des jobs')
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Récupérer uniquement les assignments
     * @param params - Paramètres optionnels
     * @returns Promise avec le tableau d'assignments
     */
    const fetchAssignments = async (
        params?: Record<string, any>
    ): Promise<SyncAssignment[]> => {
        loading.value = true
        error.value = null
        try {
            const assignments = await CountingDetailService.getAssignments(params)
            syncData.value.assignments = assignments
            return assignments
        } catch (err: any) {
            await handleError(err, 'Erreur lors de la récupération des assignments')
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Récupérer uniquement les countings
     * @param params - Paramètres optionnels
     * @returns Promise avec le tableau de countings
     */
    const fetchCountings = async (
        params?: Record<string, any>
    ): Promise<SyncCounting[]> => {
        loading.value = true
        error.value = null
        try {
            const countings = await CountingDetailService.getCountings(params)
            syncData.value.countings = countings
            return countings
        } catch (err: any) {
            await handleError(err, 'Erreur lors de la récupération des countings')
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Réinitialiser l'état du store
     */
    const resetState = () => {
        syncData.value = {
            inventories: [],
            jobs: [],
            assignments: [],
            countings: []
        }
        syncId.value = null
        syncTimestamp.value = null
        loading.value = false
        error.value = null
    }

    /**
     * Vider l'erreur
     */
    const clearError = () => {
        error.value = null
    }

    // ===== RETURN =====
    return {
        // State
        syncData,
        syncId,
        syncTimestamp,
        loading,
        error,

        // Getters
        getSyncData,
        getInventories,
        getJobs,
        getAssignments,
        getCountings,
        getSyncId,
        getSyncTimestamp,
        isLoading,
        getError,

        // Actions
        fetchSyncData,
        fetchSyncDataOnly,
        fetchInventories,
        fetchJobs,
        fetchAssignments,
        fetchCountings,
        resetState,
        clearError
    }
})

