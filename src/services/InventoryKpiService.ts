/**
 * Service KPI magasin (inventaire + entrepôt)
 * GET /web/api/inventory/{id}/warehouses/{wh_id}/kpis/
 */

import type { AxiosResponse } from 'axios'
import axiosInstance from '@/utils/axiosConfig'
import type { InventoryKpiApiResponse } from '@/models/InventoryKpi'
import API from '@/api'
import { logger } from '@/services/loggerService'

export { parseInventoryKpiResponse } from '@/utils/inventoryKpiResponseParser'

export class InventoryKpiService {
    static async getWarehouseKpis(
        inventoryId: number,
        warehouseId: number,
    ): Promise<AxiosResponse<InventoryKpiApiResponse>> {
        try {
            const url = `${API.endpoints.inventory?.base}${inventoryId}/warehouses/${warehouseId}/kpis/`
            return await axiosInstance.get<InventoryKpiApiResponse>(url)
        } catch (error) {
            logger.error('Erreur lors de la récupération des KPI magasin', error)
            throw error
        }
    }
}
