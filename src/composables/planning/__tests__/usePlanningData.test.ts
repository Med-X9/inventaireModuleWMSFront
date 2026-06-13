import { describe, it, expect } from 'vitest'
import {
    mapPlanningJobs,
    mapPlanningLocations,
    normalizePlanningJob,
    normalizePlanningLocation,
} from '../usePlanningData'

describe('usePlanningData', () => {
    it('préfère emplacements si locations est vide', () => {
        const row = normalizePlanningJob({
            id: 1,
            reference: 'JOB-1',
            status: 'EN ATTENTE',
            en_attente_date: '2026-01-15T10:00:00Z',
            valide_date: null,
            termine_date: null,
            warehouse: 1,
            inventory: 1,
            locations: [],
            emplacements: [{ id: 99, reference: 'LOC-99' }],
        })
        expect(row.locations).toHaveLength(1)
        expect(row.locations[0].location_reference).toBe('LOC-99')
    })

    it('normalise emplacements vers locations avec zone à plat', () => {
        const row = normalizePlanningJob({
            id: 1,
            reference: 'JOB-1',
            status: 'EN ATTENTE',
            en_attente_date: '2026-01-15T10:00:00Z',
            valide_date: null,
            termine_date: null,
            warehouse: 1,
            inventory: 1,
            locations: [],
            emplacements: [
                {
                    id: 10,
                    reference: 'LOC-A',
                    zone: { zone_name: 'Z1' },
                    sous_zone: { sous_zone_name: 'SZ1' },
                },
            ],
        })

        expect(row.locations).toHaveLength(1)
        expect(row.locations[0].location_reference).toBe('LOC-A')
        expect(row.locations[0].zone_name).toBe('Z1')
        expect(row.locations[0].sous_zone_name).toBe('SZ1')
        expect(row.created_at).toBe('2026-01-15T10:00:00Z')
    })

    it('mapPlanningLocations aplatit zone et sous-zone', () => {
        const rows = mapPlanningLocations([
            {
                id: 5,
                reference: 'REF-5',
                location_reference: 'REF-5',
                description: '',
                zone: { zone_name: 'Zone A' },
                sous_zone: { sous_zone_name: 'Sous A' },
                warehouse: { id: 1, reference: 'WH', warehouse_name: 'WH', warehouse_type: '', status: '' },
            } as any,
        ])

        expect(rows[0].zone_name).toBe('Zone A')
        expect(rows[0].sous_zone_name).toBe('Sous A')
        expect(rows[0].location_reference).toBe('REF-5')
    })

    it('utilise reference si location_reference est vide', () => {
        const rows = mapPlanningLocations([
            {
                id: 6,
                reference: 'REF-6',
                location_reference: '',
                description: '',
                zone: { zone_name: 'Z' },
                sous_zone: { sous_zone_name: 'SZ' },
                warehouse: { id: 1, reference: 'WH', warehouse_name: 'WH', warehouse_type: '', status: '' },
            } as any,
        ])
        expect(rows[0].location_reference).toBe('REF-6')
    })

    it('mapPlanningJobs retourne un tableau vide si pas de données', () => {
        expect(mapPlanningJobs(null)).toEqual([])
        expect(mapPlanningJobs([])).toEqual([])
    })

    it('utilise date_creation si created_at est absent', () => {
        const row = normalizePlanningJob({
            id: 2,
            reference: 'JOB-2',
            status: 'EN ATTENTE',
            date_creation: '2026-03-10T12:00:00Z',
            valide_date: null,
            termine_date: null,
            warehouse: 1,
            inventory: 1,
            locations: [],
        } as any)

        expect(row.created_at).toBe('2026-03-10T12:00:00Z')
    })
})
