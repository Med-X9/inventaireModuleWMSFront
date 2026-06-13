/**
 * Données mock — Dashboard KPI inventaire / magasin
 * Aligné sur INVENTORY_KPI_CATALOG.md (§7 exemple payload)
 *
 * Mettre USE_INVENTORY_KPI_MOCK à false pour réactiver les endpoints API.
 */

import type { InventoryKpiApiResponse } from '@/models/InventoryKpi'

/** true = mock local ; false = appels GET …/kpis/ et résolution inventaire/magasin */
export const USE_INVENTORY_KPI_MOCK = true

const MOCK_DELAY_MS = 350

export function inventoryKpiMockDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS))
}

/**
 * Payload mock complet (MVP + V2 : 3 comptages, tableau équipes)
 */
export function buildInventoryKpiMockResponse(
    inventoryId: number,
    warehouseId: number,
    warehouseName?: string
): InventoryKpiApiResponse {
    return {
        success: true,
        message: 'KPI magasin (données mock)',
        meta: {
            inventory_id: inventoryId,
            warehouse_id: warehouseId,
            warehouse_name: warehouseName ?? `Magasin-${warehouseId}`,
            generated_at: new Date().toISOString()
        },
        data: {
            volume: {
                'KPI-A01': 48,
                'KPI-A02': 45,
                'KPI-A03': 320
            },
            jobs_termines_by_counting: {
                'KPI-B01': {
                    counting_order: 1,
                    jobs_termines: 30,
                    jobs_eligibles: 45,
                    percent: 66.67
                },
                'KPI-B02': {
                    counting_order: 2,
                    jobs_termines: 10,
                    jobs_eligibles: 45,
                    percent: 22.22
                },
                'KPI-B03': {
                    counting_order: 3,
                    jobs_termines: 4,
                    jobs_eligibles: 45,
                    percent: 8.89
                }
            },
            assignments_by_counting: {
                'KPI-C01': {
                    counting_order: 1,
                    total_assignments: 45,
                    en_attente: { count: 5, percent: 11.1 },
                    en_cours: { count: 10, percent: 22.2 },
                    termine: { count: 30, percent: 66.7 }
                },
                'KPI-C02': {
                    counting_order: 2,
                    total_assignments: 45,
                    en_attente: { count: 20, percent: 44.4 },
                    en_cours: { count: 15, percent: 33.3 },
                    termine: { count: 10, percent: 22.2 }
                },
                'KPI-C03': {
                    counting_order: 3,
                    total_assignments: 12,
                    en_attente: { count: 6, percent: 50.0 },
                    en_cours: { count: 2, percent: 16.7 },
                    termine: { count: 4, percent: 33.3 }
                }
            },
            discrepancies: {
                'KPI-D01': 25,
                'KPI-D02': 12,
                'KPI-D03': 18,
                'KPI-D04': 8
            },
            teams_summary: {
                'KPI-T01': 5,
                'KPI-T06': {
                    count: 2,
                    team_keys: ['session:3', 'session:2']
                }
            },
            teams: [
                {
                    team_key: 'session:3',
                    username: 'equipe-2001',
                    'KPI-T02': { percent: 72.0, termines: 18, total: 25 },
                    'KPI-T03': { percent: 40.0, termines: 10, total: 25 },
                    'KPI-T04': {
                        counting_order: 1,
                        en_attente: { count: 2, percent: 8.0 },
                        en_cours: { count: 5, percent: 20.0 },
                        termine: { count: 18, percent: 72.0 }
                    },
                    'KPI-T05': {
                        counting_order: 2,
                        en_attente: { count: 8, percent: 32.0 },
                        en_cours: { count: 7, percent: 28.0 },
                        termine: { count: 10, percent: 40.0 }
                    },
                    'KPI-T06': { open_discrepancies_count: 4, is_multi_discrepancy: true },
                    'KPI-T07': { jobs_with_discrepancy_count: 3 }
                },
                {
                    team_key: 'session:2',
                    username: 'equipe-2002',
                    'KPI-T02': { percent: 58.0, termines: 14, total: 24 },
                    'KPI-T03': { percent: 25.0, termines: 6, total: 24 },
                    'KPI-T04': {
                        counting_order: 1,
                        en_attente: { count: 4, percent: 16.7 },
                        en_cours: { count: 6, percent: 25.0 },
                        termine: { count: 14, percent: 58.3 }
                    },
                    'KPI-T05': {
                        counting_order: 2,
                        en_attente: { count: 12, percent: 50.0 },
                        en_cours: { count: 6, percent: 25.0 },
                        termine: { count: 6, percent: 25.0 }
                    },
                    'KPI-T06': { open_discrepancies_count: 3, is_multi_discrepancy: true },
                    'KPI-T07': { jobs_with_discrepancy_count: 2 }
                },
                {
                    team_key: 'persons:12:15',
                    username: 'dupont-martin',
                    'KPI-T02': { percent: 85.0, termines: 17, total: 20 },
                    'KPI-T03': { percent: 55.0, termines: 11, total: 20 },
                    'KPI-T04': {
                        counting_order: 1,
                        en_attente: { count: 1, percent: 5.0 },
                        en_cours: { count: 2, percent: 10.0 },
                        termine: { count: 17, percent: 85.0 }
                    },
                    'KPI-T05': {
                        counting_order: 2,
                        en_attente: { count: 5, percent: 25.0 },
                        en_cours: { count: 4, percent: 20.0 },
                        termine: { count: 11, percent: 55.0 }
                    },
                    'KPI-T06': { open_discrepancies_count: 1, is_multi_discrepancy: false },
                    'KPI-T07': { jobs_with_discrepancy_count: 1 }
                },
                {
                    team_key: 'session:7',
                    username: 'equipe-2007',
                    'KPI-T02': { percent: 45.0, termines: 9, total: 20 },
                    'KPI-T03': { percent: 15.0, termines: 3, total: 20 },
                    'KPI-T04': {
                        counting_order: 1,
                        en_attente: { count: 6, percent: 30.0 },
                        en_cours: { count: 5, percent: 25.0 },
                        termine: { count: 9, percent: 45.0 }
                    },
                    'KPI-T05': {
                        counting_order: 2,
                        en_attente: { count: 14, percent: 70.0 },
                        en_cours: { count: 3, percent: 15.0 },
                        termine: { count: 3, percent: 15.0 }
                    },
                    'KPI-T06': { open_discrepancies_count: 0, is_multi_discrepancy: false },
                    'KPI-T07': { jobs_with_discrepancy_count: 0 }
                },
                {
                    team_key: 'session:9',
                    username: 'equipe-2009',
                    'KPI-T02': { percent: 62.0, termines: 8, total: 13 },
                    'KPI-T03': { percent: 30.8, termines: 4, total: 13 },
                    'KPI-T04': {
                        counting_order: 1,
                        en_attente: { count: 3, percent: 23.1 },
                        en_cours: { count: 2, percent: 15.4 },
                        termine: { count: 8, percent: 61.5 }
                    },
                    'KPI-T05': {
                        counting_order: 2,
                        en_attente: { count: 7, percent: 53.8 },
                        en_cours: { count: 2, percent: 15.4 },
                        termine: { count: 4, percent: 30.8 }
                    },
                    'KPI-T06': { open_discrepancies_count: 0, is_multi_discrepancy: false },
                    'KPI-T07': { jobs_with_discrepancy_count: 1 }
                }
            ]
        }
    }
}
