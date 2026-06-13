/**
 * Service KPI magasin (inventaire + entrepôt)
 */

import type { AxiosResponse } from 'axios'
import axiosInstance from '@/utils/axiosConfig'
import type { InventoryKpiApiResponse } from '@/models/InventoryKpi'
import API from '@/api'
import { logger } from '@/services/loggerService'
import {
    buildInventoryKpiMockResponse,
    inventoryKpiMockDelay,
    USE_INVENTORY_KPI_MOCK
} from '@/mocks/inventoryKpiMock'

export class InventoryKpiService {
    /**
     * GET /web/api/inventory/{id}/warehouses/{wh_id}/kpis/
     */
    static async getWarehouseKpis(
        inventoryId: number,
        warehouseId: number
    ): Promise<AxiosResponse<InventoryKpiApiResponse>> {
        if (USE_INVENTORY_KPI_MOCK) {
            await inventoryKpiMockDelay()
            const data = buildInventoryKpiMockResponse(inventoryId, warehouseId)
            return {
                data,
                status: 200,
                statusText: 'OK',
                headers: {},
                config: {} as AxiosResponse<InventoryKpiApiResponse>['config']
            }
        }

        try {
            const url = `${API.endpoints.inventory?.base}${inventoryId}/warehouses/${warehouseId}/kpis/`
            return await axiosInstance.get<InventoryKpiApiResponse>(url)
        } catch (error) {
            logger.error('Erreur lors de la récupération des KPI magasin', error)
            throw error
        }
    }
}
