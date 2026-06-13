import { describe, it, expect } from 'vitest'
import { parseInventoryKpiResponse } from '@/utils/inventoryKpiResponseParser'

describe('parseInventoryKpiResponse', () => {
    it('parse le payload catalogue standard', () => {
        const { meta, data } = parseInventoryKpiResponse({
            success: true,
            meta: { inventory_id: 1, warehouse_id: 2, warehouse_name: 'B3' },
            data: {
                volume: { 'KPI-A01': 48 },
                jobs_termines_by_counting: {
                    'KPI-B01': { counting_order: 1, jobs_termines: 30, jobs_eligibles: 45, percent: 66.67 },
                },
            },
        })

        expect(meta?.warehouse_name).toBe('B3')
        expect(data?.volume?.['KPI-A01']).toBe(48)
        expect(data?.jobs_termines_by_counting?.['KPI-B01']?.percent).toBe(66.67)
    })

    it('déplie une enveloppe data imbriquée', () => {
        const { data } = parseInventoryKpiResponse({
            data: {
                success: true,
                meta: { inventory_id: 5, warehouse_id: 6 },
                data: {
                    discrepancies: { 'KPI-D04': 3 },
                },
            },
        })

        expect(data?.discrepancies?.['KPI-D04']).toBe(3)
    })
})
