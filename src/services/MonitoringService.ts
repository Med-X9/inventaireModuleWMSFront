/**
 * Service pour le monitoring d'inventaire
 */

import axiosInstance from '@/utils/axiosConfig'
import type { AxiosResponse } from 'axios'
import type {
    MonitoringByZoneResponse,
    GlobalMonitoringResponse
} from '@/models/Monitoring'
import API from '@/api'
import { logger } from '@/services/loggerService'

export class MonitoringService {
    /**
     * Récupérer le monitoring par zone pour un inventaire et un entrepôt
     *
     * @param inventoryId - ID de l'inventaire
     * @param warehouseId - ID de l'entrepôt
     * @returns Réponse avec les zones et leurs métriques
     */
    static async getMonitoringByZone(
        inventoryId: number,
        warehouseId: number
    ): Promise<AxiosResponse<MonitoringByZoneResponse>> {
        try {
            const url = `${API.endpoints.inventory?.base}${inventoryId}/warehouses/${warehouseId}/monitoring/`
            const response = await axiosInstance.get<MonitoringByZoneResponse>(url)
            return response
        } catch (error) {
            logger.error('Erreur lors de la récupération du monitoring par zone', error)
            throw error
        }
    }

    /**
     * Récupérer le monitoring global pour un inventaire et un entrepôt
     *
     * @param inventoryId - ID de l'inventaire
     * @param warehouseId - ID de l'entrepôt
     * @returns Réponse avec les totaux globaux
     */
    static async getGlobalMonitoring(
        inventoryId: number,
        warehouseId: number
    ): Promise<AxiosResponse<GlobalMonitoringResponse>> {
        try {
            const url = `${API.endpoints.inventory?.base}${inventoryId}/warehouses/${warehouseId}/global-monitoring/`
            const response = await axiosInstance.get<GlobalMonitoringResponse>(url)
            return response
        } catch (error) {
            logger.error('Erreur lors de la récupération du monitoring global', error)
            throw error
        }
    }
}

