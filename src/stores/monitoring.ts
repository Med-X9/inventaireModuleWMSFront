/**
 * Store Pinia pour le monitoring d'inventaire
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { MonitoringService } from '@/services/MonitoringService'
import type {
    MonitoringByZoneResponse,
    GlobalMonitoringResponse,
    MonitoringStats,
    ZoneMonitoringData,
    MonitoringTotalData
} from '@/models/Monitoring'
import { alertService } from '@/services/alertService'
import { logger } from '@/services/loggerService'

export const useMonitoringStore = defineStore('monitoring', () => {
    // ===== ÉTAT =====
    const monitoringByZone = ref<MonitoringByZoneResponse | null>(null)
    const globalMonitoring = ref<GlobalMonitoringResponse | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)

    // ===== GETTERS =====
    const getMonitoringByZone = computed(() => monitoringByZone.value)
    const getGlobalMonitoring = computed(() => globalMonitoring.value)
    const isLoading = computed(() => loading.value)
    const getError = computed(() => error.value)

    // ===== ACTIONS =====

    /**
     * Récupérer le monitoring par zone
     *
     * @param inventoryId - ID de l'inventaire
     * @param warehouseId - ID de l'entrepôt
     */
    const fetchMonitoringByZone = async (
        inventoryId: number,
        warehouseId: number
    ): Promise<MonitoringByZoneResponse | null> => {
        loading.value = true
        error.value = null

        try {
            const response = await MonitoringService.getMonitoringByZone(inventoryId, warehouseId)
            monitoringByZone.value = response.data
            return response.data
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || 
                               err?.message || 
                               'Erreur lors de la récupération du monitoring par zone'
            error.value = errorMessage
            logger.error('Erreur fetchMonitoringByZone', err)
            await alertService.error({ text: errorMessage })
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Récupérer le monitoring global
     *
     * @param inventoryId - ID de l'inventaire
     * @param warehouseId - ID de l'entrepôt
     */
    const fetchGlobalMonitoring = async (
        inventoryId: number,
        warehouseId: number
    ): Promise<GlobalMonitoringResponse | null> => {
        loading.value = true
        error.value = null

        try {
            const response = await MonitoringService.getGlobalMonitoring(inventoryId, warehouseId)
            globalMonitoring.value = response.data
            return response.data
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || 
                               err?.message || 
                               'Erreur lors de la récupération du monitoring global'
            error.value = errorMessage
            logger.error('Erreur fetchGlobalMonitoring', err)
            await alertService.error({ text: errorMessage })
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Récupérer les deux types de monitoring en parallèle
     *
     * @param inventoryId - ID de l'inventaire
     * @param warehouseId - ID de l'entrepôt
     */
    const fetchAllMonitoring = async (
        inventoryId: number,
        warehouseId: number
    ): Promise<{
        byZone: MonitoringByZoneResponse | null
        global: GlobalMonitoringResponse | null
    }> => {
        loading.value = true
        error.value = null

        try {
            const [byZoneResponse, globalResponse] = await Promise.all([
                MonitoringService.getMonitoringByZone(inventoryId, warehouseId),
                MonitoringService.getGlobalMonitoring(inventoryId, warehouseId)
            ])

            monitoringByZone.value = byZoneResponse.data
            globalMonitoring.value = globalResponse.data

            return {
                byZone: byZoneResponse.data,
                global: globalResponse.data
            }
        } catch (err: any) {
            const errorMessage = err?.response?.data?.message || 
                               err?.message || 
                               'Erreur lors de la récupération du monitoring'
            error.value = errorMessage
            logger.error('Erreur fetchAllMonitoring', err)
            await alertService.error({ text: errorMessage })
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Réinitialiser le store
     */
    const resetStore = () => {
        monitoringByZone.value = null
        globalMonitoring.value = null
        loading.value = false
        error.value = null
    }

    /**
     * Effacer l'erreur
     */
    const clearError = () => {
        error.value = null
    }

    return {
        // État
        monitoringByZone,
        globalMonitoring,
        loading,
        error,

        // Getters
        getMonitoringByZone,
        getGlobalMonitoring,
        isLoading,
        getError,

        // Actions
        fetchMonitoringByZone,
        fetchGlobalMonitoring,
        fetchAllMonitoring,
        resetStore,
        clearError
    }
})

