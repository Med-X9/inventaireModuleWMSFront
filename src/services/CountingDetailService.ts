import axiosInstance from '@/utils/axiosConfig'
import type { AxiosResponse } from 'axios'
import type {
    CountingDetailResponse,
    SyncData,
    SyncInventory,
    SyncJob,
    SyncAssignment,
    SyncCounting
} from '@/models/CountingDetail'
import { logger } from '@/services/loggerService'
import API from '@/api'

/**
 * Service pour la gestion des données de synchronisation (CountingDetail)
 */
export class CountingDetailService {
    /**
     * Récupérer les données de synchronisation pour un utilisateur
     * @param params - Paramètres optionnels (pagination, filtres, etc.)
     * @returns Promise avec la réponse contenant les données de synchronisation
     */
    static async getSyncData(
        params?: Record<string, any>
    ): Promise<AxiosResponse<CountingDetailResponse>> {
        try {
            logger.debug('Récupération des données de synchronisation', { params })

            const url = API.endpoints.countingDetail.base
            const response = await axiosInstance.get<CountingDetailResponse>(url, {
                params: params || {}
            })

            const syncData = response.data.data?.data
            logger.debug('Données de synchronisation récupérées avec succès', {
                syncId: response.data.data?.sync_id,
                inventoriesCount: syncData?.inventories?.length || 0,
                jobsCount: syncData?.jobs?.length || 0,
                assignmentsCount: syncData?.assignments?.length || 0,
                countingsCount: syncData?.countings?.length || 0
            })

            return response
        } catch (error) {
            logger.error('Erreur lors de la récupération des données de synchronisation', error)
            throw error
        }
    }

    /**
     * Récupérer uniquement les données de synchronisation (extrait directement SyncData)
     * @param params - Paramètres optionnels
     * @returns Promise avec les données de synchronisation
     */
    static async getSyncDataOnly(
        params?: Record<string, any>
    ): Promise<SyncData> {
        try {
            const response = await this.getSyncData(params)
            return response.data.data?.data || {
                inventories: [],
                jobs: [],
                assignments: [],
                countings: []
            }
        } catch (error) {
            logger.error('Erreur lors de la récupération des données de synchronisation', error)
            throw error
        }
    }

    /**
     * Récupérer les inventaires depuis les données de synchronisation
     * @param params - Paramètres optionnels
     * @returns Promise avec le tableau d'inventaires
     */
    static async getInventories(
        params?: Record<string, any>
    ): Promise<SyncInventory[]> {
        try {
            const syncData = await this.getSyncDataOnly(params)
            return syncData.inventories || []
        } catch (error) {
            logger.error('Erreur lors de la récupération des inventaires', error)
            throw error
        }
    }

    /**
     * Récupérer les jobs depuis les données de synchronisation
     * @param params - Paramètres optionnels
     * @returns Promise avec le tableau de jobs
     */
    static async getJobs(
        params?: Record<string, any>
    ): Promise<SyncJob[]> {
        try {
            const syncData = await this.getSyncDataOnly(params)
            return syncData.jobs || []
        } catch (error) {
            logger.error('Erreur lors de la récupération des jobs', error)
            throw error
        }
    }

    /**
     * Récupérer les assignments depuis les données de synchronisation
     * @param params - Paramètres optionnels
     * @returns Promise avec le tableau d'assignments
     */
    static async getAssignments(
        params?: Record<string, any>
    ): Promise<SyncAssignment[]> {
        try {
            const syncData = await this.getSyncDataOnly(params)
            return syncData.assignments || []
        } catch (error) {
            logger.error('Erreur lors de la récupération des assignments', error)
            throw error
        }
    }

    /**
     * Récupérer les countings depuis les données de synchronisation
     * @param params - Paramètres optionnels
     * @returns Promise avec le tableau de countings
     */
    static async getCountings(
        params?: Record<string, any>
    ): Promise<SyncCounting[]> {
        try {
            const syncData = await this.getSyncDataOnly(params)
            return syncData.countings || []
        } catch (error) {
            logger.error('Erreur lors de la récupération des countings', error)
            throw error
        }
    }
}

