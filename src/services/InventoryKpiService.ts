/**
 * Service KPI magasin (inventaire + entrepôt)
 *
 * Endpoints individuels :
 * GET /web/api/inventory/{inventory_id}/warehouses/{warehouse_id}/kpis/{slug}/
 */

import axiosInstance from '@/utils/axiosConfig'
import API from '@/api'
import { logger } from '@/services/loggerService'
import { INVENTORY_KPI_ENDPOINTS, INVENTORY_LEVEL_KPI_ENDPOINTS } from '@/constants/inventoryKpiEndpoints'
import {
    assembleInventoryKpiData,
    type KpiEndpointResult,
} from '@/utils/inventoryKpiResponseParser'
import type {
    InventoryKpiApiResponse,
    InventoryKpiSingleResponse,
} from '@/models/InventoryKpi'

export {
    parseInventoryKpiResponse,
    assembleInventoryKpiData,
} from '@/utils/inventoryKpiResponseParser'

export class InventoryKpiService {
    /**
     * Récupère un KPI magasin individuel par slug
     */
    static async getKpiBySlug(
        inventoryId: number,
        warehouseId: number,
        slug: string,
    ): Promise<InventoryKpiSingleResponse> {
        const url = `${API.endpoints.inventory.base}${inventoryId}/warehouses/${warehouseId}/kpis/${slug}/`
        const response = await axiosInstance.get<InventoryKpiSingleResponse>(url)
        return response.data
    }

    /**
     * Récupère un KPI inventaire (tous magasins) par slug
     * GET /web/api/inventory/{inventory_id}/kpis/{slug}/
     */
    static async getInventoryKpiBySlug(
        inventoryId: number,
        slug: string,
    ): Promise<InventoryKpiSingleResponse> {
        const url = `${API.endpoints.inventory.base}${inventoryId}/kpis/${slug}/`
        const response = await axiosInstance.get<InventoryKpiSingleResponse>(url)
        return response.data
    }

    /**
     * Récupère tous les KPI magasin (appels parallèles) et assemble le payload dashboard.
     */
    static async getWarehouseKpis(
        inventoryId: number,
        warehouseId: number,
    ): Promise<{ data: InventoryKpiApiResponse }> {
        try {
            const settled = await Promise.allSettled(
                INVENTORY_KPI_ENDPOINTS.map(async (def) => {
                    const response = await this.getKpiBySlug(inventoryId, warehouseId, def.slug)
                    return { def, response } satisfies KpiEndpointResult
                })
            )

            const results: KpiEndpointResult[] = settled.map((result, index) => {
                const def = INVENTORY_KPI_ENDPOINTS[index]!
                if (result.status === 'fulfilled') {
                    return result.value
                }
                logger.warn(`KPI ${def.slug} indisponible`, result.reason)
                return { def, response: null, error: result.reason }
            })

            const { data, meta, successCount, failureCount } = assembleInventoryKpiData(results)

            if (successCount === 0) {
                const firstError = results.find((r) => r.error)?.error
                throw firstError instanceof Error
                    ? firstError
                    : new Error('Aucun KPI magasin n\'a pu être récupéré')
            }

            if (failureCount > 0) {
                logger.warn(
                    `${failureCount}/${INVENTORY_KPI_ENDPOINTS.length} KPI(s) en échec pour inventaire ${inventoryId} / magasin ${warehouseId}`
                )
            }

            return {
                data: {
                    success: true,
                    message: 'KPI magasin récupérés',
                    meta: {
                        inventory_id: inventoryId,
                        warehouse_id: warehouseId,
                        warehouse_name: meta?.warehouse_name,
                        scope: 'warehouse',
                        generated_at: meta?.generated_at,
                    },
                    data,
                },
            }
        } catch (error) {
            logger.error('Erreur lors de la récupération des KPI magasin', error)
            throw error
        }
    }

    /**
     * Récupère tous les KPI inventaire (agrégation tous magasins) + S/E.
     */
    static async getInventoryKpis(
        inventoryId: number,
    ): Promise<{ data: InventoryKpiApiResponse }> {
        try {
            const settled = await Promise.allSettled(
                INVENTORY_LEVEL_KPI_ENDPOINTS.map(async (def) => {
                    const response = await this.getInventoryKpiBySlug(inventoryId, def.slug)
                    return { def, response } satisfies KpiEndpointResult
                })
            )

            const results: KpiEndpointResult[] = settled.map((result, index) => {
                const def = INVENTORY_LEVEL_KPI_ENDPOINTS[index]!
                if (result.status === 'fulfilled') {
                    return result.value
                }
                logger.warn(`KPI inventaire ${def.slug} indisponible`, result.reason)
                return { def, response: null, error: result.reason }
            })

            const { data, meta, successCount, failureCount } = assembleInventoryKpiData(results)

            if (successCount === 0) {
                const firstError = results.find((r) => r.error)?.error
                throw firstError instanceof Error
                    ? firstError
                    : new Error('Aucun KPI inventaire n\'a pu être récupéré')
            }

            if (failureCount > 0) {
                logger.warn(
                    `${failureCount}/${INVENTORY_LEVEL_KPI_ENDPOINTS.length} KPI(s) inventaire en échec pour ${inventoryId}`
                )
            }

            return {
                data: {
                    success: true,
                    message: 'KPI inventaire récupérés',
                    meta: {
                        inventory_id: inventoryId,
                        warehouse_id: null,
                        scope: 'inventory',
                        aggregation: meta?.aggregation ?? 'all_warehouses',
                        generated_at: meta?.generated_at,
                    },
                    data,
                },
            }
        } catch (error) {
            logger.error('Erreur lors de la récupération des KPI inventaire', error)
            throw error
        }
    }
}
