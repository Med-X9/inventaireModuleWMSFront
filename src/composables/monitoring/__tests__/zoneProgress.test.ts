import { describe, it, expect } from 'vitest'
import { buildMonitoringViewModel, filterAndSortZones } from '@/composables/monitoring/zoneProgress'

const zone = (id: number, name: string, jobs: number, countings: Array<[number, number, number, number]>) => ({
    zone_id: id, zone_reference: `Z-${id}`, zone_name: name, status: '', nombre_equipes: 0,
    nombre_jobs: jobs, nombre_emplacements: jobs * 10,
    countings: countings.map(([order, t, e, tr]) => ({
        counting_id: order, counting_reference: '', counting_order: order,
        assignments: [
            { status: 'TERMINE', count: t, percentage: 0 },
            { status: 'ENTAME', count: e, percentage: 0 },
            { status: 'TRANSFERT', count: tr, percentage: 0 },
        ],
    })),
})

describe('buildMonitoringViewModel', () => {
    it("n'affiche que les comptages présents (tournant = 1 comptage)", () => {
        const vm = buildMonitoringViewModel([zone(1, 'Zone A', 2, [[1, 1, 1, 0]])] as any)
        expect(vm.countingOrders).toEqual([1])
        expect(vm.zones[0].countings).toHaveLength(1)
    })

    it('calcule les jobs non lancés et les états de zone', () => {
        const vm = buildMonitoringViewModel([
            zone(1, 'Zone A', 4, [[1, 1, 1, 0]]),   // 1 terminé, 1 entamé, 2 non lancés
            zone(2, 'Zone B', 3, [[1, 0, 0, 0]]),   // rien de démarré
            zone(3, 'Zone C', 2, [[1, 2, 0, 0]]),   // tout terminé
        ] as any)
        const [a, b, c] = vm.zones
        expect(a.countings[0]).toMatchObject({ termine: 1, entame: 1, nonLance: 2, pctTermine: 25 })
        expect(a.state).toBe('en_cours')
        expect(b.state).toBe('non_demarre')
        expect(c.state).toBe('termine')
        expect(vm.totals.jobs).toBe(9)
        expect(vm.totals.countings[0]).toMatchObject({ total: 9, termine: 3, pctTermine: 33 })
    })

    it("gère un nombre quelconque de zones et l'union des comptages", () => {
        const zones = Array.from({ length: 25 }, (_, i) => zone(i + 1, `Zone ${i + 1}`, 5, i % 2 ? [[1, 1, 0, 0], [2, 0, 1, 0]] : [[1, 0, 0, 0]]))
        const vm = buildMonitoringViewModel(zones as any)
        expect(vm.zones).toHaveLength(25)
        expect(vm.countingOrders).toEqual([1, 2])
        expect(vm.zones[0].countings.map((c) => c.order)).toEqual([1, 2]) // comptage absent → ligne à 0
    })

    it("prend les totaux dans la réponse globale (un job sur 2 zones n'est compté qu'une fois)", () => {
        const zones = [zone(1, 'Zone A', 2, [[1, 1, 1, 0]]), zone(2, 'Zone B', 2, [[1, 0, 1, 0]])]
        const vm = buildMonitoringViewModel(zones as any, { total_jobs: 3, total_equipes: 3, countings: [{ counting_order: 1, jobs_termines: 1 }] })
        expect(vm.totals.jobs).toBe(3)
        expect(vm.totals.equipes).toBe(3)
        expect(vm.totals.countings[0]).toMatchObject({ total: 3, termine: 1, pctTermine: 33 })
    })

    it('compte les jobs transférés au PDA comme non lancés', () => {
        const vm = buildMonitoringViewModel([zone(1, 'Zone A', 5, [[1, 1, 0, 3]])] as any)
        expect(vm.zones[0].countings[0]).toMatchObject({ termine: 1, entame: 0, transfert: 3, nonLance: 4 })
        // seulement transférés → zone non démarrée
        const vm2 = buildMonitoringViewModel([zone(2, 'Zone B', 3, [[1, 0, 0, 3]])] as any)
        expect(vm2.zones[0].state).toBe('non_demarre')
    })

    it('tolère une réponse vide', () => {
        expect(buildMonitoringViewModel(undefined).zones).toEqual([])
    })
})

describe('filterAndSortZones', () => {
    const vm = buildMonitoringViewModel([
        zone(1, 'Zone 10', 4, [[1, 4, 0, 0]]),
        zone(2, 'Zone 2', 4, [[1, 1, 0, 0]]),
        zone(3, 'Mezzanine', 8, [[1, 0, 0, 0]]),
    ] as any)

    it('trie les noms naturellement', () => {
        expect(filterAndSortZones(vm.zones, { sort: 'nom' }).map((z) => z.name)).toEqual(['Mezzanine', 'Zone 2', 'Zone 10'])
    })
    it("trie par avancement (zones en retard d'abord)", () => {
        expect(filterAndSortZones(vm.zones, { sort: 'avancement_asc' }).map((z) => z.name)).toEqual(['Mezzanine', 'Zone 2', 'Zone 10'])
    })
    it('filtre par recherche et par état', () => {
        expect(filterAndSortZones(vm.zones, { search: 'mezz' })).toHaveLength(1)
        expect(filterAndSortZones(vm.zones, { state: 'termine' }).map((z) => z.name)).toEqual(['Zone 10'])
    })
})
