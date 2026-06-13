import { describe, it, expect } from 'vitest'
import {
    mapJobsToRows,
    transformLocations,
    transformJobToRowNode,
    resolveJobCreatedAt,
    getAssignmentSessionLabel,
    formatAssignmentSessionCell,
} from '../useAffecterData'

describe('useAffecterData', () => {
    it('mapJobsToRows retourne un tableau vide si pas de jobs', () => {
        expect(mapJobsToRows(null)).toEqual([])
        expect(mapJobsToRows([])).toEqual([])
    })

    it('transformJobToRowNode mappe les champs principaux', () => {
        const row = transformJobToRowNode({
            id: 42,
            reference: 'JOB-42',
            status: 'VALIDE',
            emplacements: [{ id: 1, reference: 'LOC-1' }],
            ressources: [{ reference: 'RES-1' }],
            assignments: [
                { counting_order: 1, status: 'AFFECTE', session: { id: 1, username: 'team1' }, date_start: '2026-01-01' },
            ],
        })

        expect(row.id).toBe('42')
        expect(row.job).toBe('JOB-42')
        expect(row.status).toBe('VALIDE')
        expect(row.team1).toBe('team1')
        expect(row.resourcesList).toEqual(['RES-1'])
        expect(row.locations).toHaveLength(1)
    })

    it('resolveJobCreatedAt accepte les alias API', () => {
        expect(resolveJobCreatedAt({ date_creation: '2026-02-01T08:00:00Z' })).toBe('2026-02-01T08:00:00Z')
        expect(resolveJobCreatedAt({ en_attente_date: '2026-01-01' })).toBe('2026-01-01')
    })

    it('transformJobToRowNode lit session_username et counting_order string', () => {
        const row = transformJobToRowNode({
            id: 7,
            reference: 'JOB-7',
            status: 'AFFECTE',
            assignments: [
                {
                    counting_order: '1',
                    status: 'AFFECTE',
                    session_username: 'equipe-alpha',
                },
            ],
        })

        expect(row.team1).toBe('equipe-alpha')
        expect((row as any).counting_1_session).toBe('equipe-alpha')
    })

    it('formatAssignmentSessionCell affiche la session sans exiger un statut', () => {
        const html = formatAssignmentSessionCell(
            null,
            undefined,
            {
                id: '1',
                job: 'JOB-1',
                team1: 'equipe-beta',
                team2: '',
                date1: '',
                date2: '',
                resources: '',
                resourcesList: [],
                nbResources: 0,
                status: 'VALIDE',
                assignments: [{ counting_order: 1, status: '', session_username: 'equipe-beta' }],
            },
            1,
            'badge-default',
            [],
        )

        expect(html).toContain('equipe-beta')
    })

    it('getAssignmentSessionLabel priorise session.username', () => {
        expect(
            getAssignmentSessionLabel({
                session: { username: 'user-a' },
                session_username: 'user-b',
            }),
        ).toBe('user-a')
    })

    it('transformLocations normalise zone et sous-zone', () => {
        const locs = transformLocations(1, [
            {
                id: 10,
                reference: 'A-01',
                zone: { zone_name: 'Z1' },
                sous_zone: { sous_zone_name: 'SZ1' },
            },
        ])
        expect(locs[0].zone_name).toBe('Z1')
        expect(locs[0].sous_zone_name).toBe('SZ1')
        expect(locs[0].location_reference).toBe('A-01')
    })
})
