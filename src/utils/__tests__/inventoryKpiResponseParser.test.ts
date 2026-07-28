import { describe, it, expect } from 'vitest'
import {
    parseInventoryKpiResponse,
    assembleInventoryKpiData,
    extractScalar,
    extractJobsTermines,
    extractByDataKey,
} from '@/utils/inventoryKpiResponseParser'
import type { InventoryKpiEndpointDef } from '@/models/InventoryKpi'

describe('parseInventoryKpiResponse', () => {
    it('parse le payload catalogue standard (agrégé legacy)', () => {
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

describe('extractByDataKey / extractScalar (format backend réel)', () => {
    it('extrait un scalaire depuis data.nombre_jobs_total', () => {
        const apiBody = {
            success: true,
            meta: { kpi: 'nombre-jobs-total', warehouse_name: 'B3' },
            data: { nombre_jobs_total: 48 },
        }

        expect(extractByDataKey(apiBody, 'nombre_jobs_total')).toBe(48)
        expect(extractScalar(apiBody.data, 'KPI-A01', 'nombre_jobs_total')).toBe(48)
        expect(extractScalar({ nombre_jobs_total: 12 }, 'KPI-A01', 'nombre_jobs_total')).toBe(12)
    })

    it('extrait un taux jobs terminés sous data_key', () => {
        const jt = extractJobsTermines(
            {
                taux_jobs_termines_1er_comptage: {
                    counting_order: 1,
                    jobs_termines: 30,
                    jobs_eligibles: 45,
                    percent: 66.67,
                },
            },
            'KPI-B01',
            'taux_jobs_termines_1er_comptage'
        )
        expect(jt?.percent).toBe(66.67)
        expect(jt?.jobs_termines).toBe(30)
    })
})

describe('assembleInventoryKpiData', () => {
    const def = (
        catalogId: InventoryKpiEndpointDef['catalogId'],
        slug: string,
        dataKey: string,
        category: InventoryKpiEndpointDef['category']
    ): InventoryKpiEndpointDef => ({
        catalogId,
        slug,
        dataKey,
        category,
    })

    it('assemble les endpoints individuels au format backend', () => {
        const { data, successCount, failureCount, meta } = assembleInventoryKpiData([
            {
                def: def('KPI-A01', 'nombre-jobs-total', 'nombre_jobs_total', 'volume'),
                response: {
                    success: true,
                    meta: {
                        kpi: 'nombre-jobs-total',
                        warehouse_name: 'B3',
                        generated_at: '2026-07-24T10:00:00Z',
                    },
                    data: { nombre_jobs_total: 48 },
                },
            },
            {
                def: def(
                    'KPI-B01',
                    'taux-jobs-termines-1er-comptage',
                    'taux_jobs_termines_1er_comptage',
                    'jobs_termines'
                ),
                response: {
                    success: true,
                    data: {
                        taux_jobs_termines_1er_comptage: {
                            counting_order: 1,
                            jobs_termines: 30,
                            jobs_eligibles: 45,
                            percent: 66.67,
                        },
                    },
                },
            },
            {
                def: def('KPI-D04', 'nombre-ecarts-ouverts', 'nombre_ecarts_ouverts', 'discrepancies'),
                response: {
                    success: true,
                    data: { nombre_ecarts_ouverts: 3 },
                },
            },
            {
                def: def('KPI-T01', 'nombre-equipes', 'nombre_equipes', 'teams'),
                response: {
                    success: true,
                    data: { nombre_equipes: 5 },
                },
            },
            {
                def: def(
                    'KPI-C01',
                    'repartition-assignments-1er-comptage',
                    'repartition_assignments_1er_comptage',
                    'assignments'
                ),
                response: null,
                error: new Error('fail'),
            },
        ])

        expect(successCount).toBe(4)
        expect(failureCount).toBe(1)
        expect(meta?.warehouse_name).toBe('B3')
        expect(data.volume?.['KPI-A01']).toBe(48)
        expect(data.jobs_termines_by_counting?.['KPI-B01']?.percent).toBe(66.67)
        expect(data.discrepancies?.['KPI-D04']).toBe(3)
        expect(data.teams_summary?.['KPI-T01']).toBe(5)
    })

    it('fusionne les équipes issues de plusieurs endpoints T', () => {
        const { data } = assembleInventoryKpiData([
            {
                def: def(
                    'KPI-T02',
                    'taux-termine-1er-comptage-par-equipe',
                    'taux_termine_1er_comptage_par_equipe',
                    'teams'
                ),
                response: {
                    data: {
                        taux_termine_1er_comptage_par_equipe: {
                            teams: [
                                {
                                    team_key: 'session:3',
                                    username: 'equipe-2001',
                                    percent: 72,
                                    termines: 18,
                                    total: 25,
                                },
                            ],
                        },
                    },
                },
            },
            {
                def: def(
                    'KPI-T07',
                    'jobs-avec-ecart-par-equipe',
                    'jobs_avec_ecart_par_equipe',
                    'teams'
                ),
                response: {
                    data: {
                        jobs_avec_ecart_par_equipe: {
                            teams: [
                                {
                                    team_key: 'session:3',
                                    jobs_with_discrepancy_count: 3,
                                },
                            ],
                        },
                    },
                },
            },
        ])

        expect(data.teams).toHaveLength(1)
        expect(data.teams?.[0]?.team_key).toBe('session:3')
        expect(data.teams?.[0]?.['KPI-T02']?.percent).toBe(72)
        expect(data.teams?.[0]?.['KPI-T07']?.jobs_with_discrepancy_count).toBe(3)
    })
})
