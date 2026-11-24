/**
 * Modèle d'affichage du monitoring par zone, calculé directement depuis la réponse API.
 *
 * - S'adapte au nombre de zones (1 à N) et au nombre de comptages réellement présents
 *   (1 pour un tournant, 2 ou 3 pour un général) — aucune valeur codée en dur.
 * - Règle métier : un job transféré au PDA mais pas encore entamé est « non lancé ».
 *   non lancé = jobs − (terminé + entamé)  (en attente, affectés, prêts et transférés).
 */
import type { LocationProgressFields, ZoneMonitoringResponse } from '@/models/Monitoring'

/** Sous-ensemble de la réponse global-monitoring utilisé pour les totaux */
export interface GlobalTotalsInput {
    total_jobs?: number
    total_equipes?: number
    countings?: Array<{ counting_order: number; jobs_termines?: number } & LocationProgressFields>
}

export type ZoneState = 'termine' | 'en_cours' | 'non_demarre'

/** Avancement des emplacements d'un comptage (par article ou en vrac) */
export interface LocationProgress {
    /** Mode du comptage : « par article » ou « en vrac » */
    countMode: string
    total: number
    termines: number
    enAttente: number
    pctTermines: number
    pctEnAttente: number
}

export interface CountingProgress {
    order: number
    /** Emplacements terminés / en attente (absent si l'API ne les fournit pas) */
    emplacements?: LocationProgress
    total: number
    termine: number
    entame: number
    /** Dont transférés au PDA (inclus dans nonLance) */
    transfert: number
    /** Non lancés : ni entamés ni terminés (transférés compris) */
    nonLance: number
    /** % de jobs terminés (0–100, entier) */
    pctTermine: number
}

export interface ZoneJobTeam {
    assignmentId: number
    name: string
    members: string[]
    order: number | null
    status: string
}

export interface ZoneJob {
    id: number
    reference: string
    status: string
    emplacements: number
    teams: ZoneJobTeam[]
}

export interface ZoneProgress {
    id: number
    reference: string
    name: string
    jobs: number
    emplacements: number
    equipes: number
    /** Jobs de la zone avec leurs équipes */
    jobsDetail: ZoneJob[]
    countings: CountingProgress[]
    /** Comptage « courant » : le plus avancé ayant une activité, sinon le 1er */
    current: CountingProgress | null
    state: ZoneState
}

export interface MonitoringViewModel {
    countingOrders: number[]
    zones: ZoneProgress[]
    totals: {
        jobs: number
        emplacements: number
        equipes: number
        countings: CountingProgress[]
    }
}

const pct = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0)

const countOf = (counting: ZoneMonitoringResponse['countings'][number] | undefined, status: string) =>
    Number(counting?.assignments?.find((a) => a.status === status)?.count ?? 0)

export function buildCountingProgress(order: number, total: number, termine: number, entame: number, transfert: number): CountingProgress {
    const t = Math.max(0, termine)
    const e = Math.max(0, entame)
    const tr = Math.max(0, transfert)
    const safeTotal = Math.max(total, t + e + tr)
    return {
        order,
        total: safeTotal,
        termine: t,
        entame: e,
        transfert: tr,
        nonLance: Math.max(0, safeTotal - t - e),
        pctTermine: pct(t, safeTotal),
    }
}

/** Construit l'avancement des emplacements depuis les champs de l'API (undefined si absents) */
export function buildLocationProgress(src?: LocationProgressFields | null): LocationProgress | undefined {
    if (!src || src.total_emplacements === undefined || src.total_emplacements === null) return undefined
    const total = Number(src.total_emplacements)
    const termines = Number(src.emplacements_termines ?? 0)
    const enAttente = Number(src.emplacements_en_attente ?? Math.max(0, total - termines))
    return {
        countMode: src.count_mode ?? '',
        total,
        termines,
        enAttente,
        pctTermines: Number(src.emplacements_termines_percent ?? pct(termines, total)),
        pctEnAttente: Number(src.emplacements_en_attente_percent ?? pct(enAttente, total)),
    }
}

function sumLocationProgress(list: Array<LocationProgress | undefined>): LocationProgress | undefined {
    const items = list.filter((x): x is LocationProgress => !!x)
    if (!items.length) return undefined
    const total = items.reduce((s, x) => s + x.total, 0)
    const termines = items.reduce((s, x) => s + x.termines, 0)
    const enAttente = items.reduce((s, x) => s + x.enAttente, 0)
    return {
        countMode: items[0].countMode,
        total,
        termines,
        enAttente,
        pctTermines: Math.round((total > 0 ? (termines / total) * 100 : 0) * 100) / 100,
        pctEnAttente: Math.round((total > 0 ? (enAttente / total) * 100 : 0) * 100) / 100,
    }
}

function zoneState(countings: CountingProgress[]): ZoneState {
    if (countings.length === 0) return 'non_demarre'
    if (countings.every((c) => c.total > 0 && c.termine >= c.total)) return 'termine'
    if (countings.some((c) => c.termine + c.entame > 0)) return 'en_cours'
    return 'non_demarre'
}

function currentCounting(countings: CountingProgress[]): CountingProgress | null {
    const active = countings.filter((c) => c.termine + c.entame > 0)
    return active.length ? active[active.length - 1] : countings[0] ?? null
}

/**
 * @param globalRaw réponse global-monitoring : un job qui touche plusieurs zones est compté dans
 *   chacune côté « par zone » ; les totaux viennent donc de la réponse globale (job compté une fois).
 */
export function buildMonitoringViewModel(
    zonesRaw: ZoneMonitoringResponse[] | null | undefined,
    globalRaw?: GlobalTotalsInput | null
): MonitoringViewModel {
    const zonesIn = Array.isArray(zonesRaw) ? zonesRaw : []
    const countingOrders = Array.from(
        new Set(zonesIn.flatMap((z) => (z.countings ?? []).map((c) => Number(c.counting_order))))
    ).filter((o) => Number.isFinite(o) && o > 0).sort((a, b) => a - b)

    const zones: ZoneProgress[] = zonesIn.map((z) => {
        const jobs = Number(z.nombre_jobs ?? 0)
        const countings = countingOrders.map((order) => {
            const c = z.countings?.find((x) => Number(x.counting_order) === order)
            const progress = buildCountingProgress(order, jobs, countOf(c, 'TERMINE'), countOf(c, 'ENTAME'), countOf(c, 'TRANSFERT'))
            progress.emplacements = buildLocationProgress(c)
            return progress
        })
        const jobsDetail: ZoneJob[] = (z.jobs ?? []).map((j) => ({
            id: Number(j.job_id),
            reference: j.job_reference,
            status: j.status,
            emplacements: Number(j.nombre_emplacements ?? 0),
            teams: (j.equipes ?? []).map((t) => ({
                assignmentId: Number(t.assignment_id),
                name: t.team_name,
                members: t.members ?? [],
                order: t.counting_order ?? null,
                status: t.status,
            })),
        }))
        const distinctTeams = new Set(jobsDetail.flatMap((j) => j.teams.map((t) => t.name))).size
        return {
            id: Number(z.zone_id),
            reference: z.zone_reference ?? '',
            name: z.zone_name || z.zone_reference || `Zone ${z.zone_id}`,
            jobs,
            emplacements: Number(z.nombre_emplacements ?? 0),
            equipes: distinctTeams || Number(z.nombre_equipes ?? 0),
            jobsDetail,
            countings,
            current: currentCounting(countings),
            state: zoneState(countings),
        }
    })

    const sum = (f: (z: ZoneProgress) => number) => zones.reduce((s, z) => s + f(z), 0)
    const globalJobs = Number(globalRaw?.total_jobs ?? 0)
    const useGlobal = globalJobs > 0
    const totalsCountings = countingOrders.map((order, i) => {
        if (useGlobal) {
            // Seuls les jobs terminés sont fournis sans double comptage par l'API globale
            const g = globalRaw?.countings?.find((c) => Number(c.counting_order) === order)
            const progress = buildCountingProgress(order, globalJobs, Number(g?.jobs_termines ?? 0), 0, 0)
            // Emplacements : l'API globale compte chaque emplacement une seule fois
            progress.emplacements = buildLocationProgress(g) ?? sumLocationProgress(zones.map((zone) => zone.countings[i].emplacements))
            return progress
        }
        const fallback = buildCountingProgress(
            order,
            sum((z) => z.countings[i].total),
            sum((z) => z.countings[i].termine),
            sum((z) => z.countings[i].entame),
            sum((z) => z.countings[i].transfert)
        )
        fallback.emplacements = sumLocationProgress(zones.map((zone) => zone.countings[i].emplacements))
        return fallback
    })

    return {
        countingOrders,
        zones,
        totals: {
            jobs: useGlobal ? globalJobs : sum((z) => z.jobs),
            emplacements: sum((z) => z.emplacements),
            equipes: Number(globalRaw?.total_equipes ?? 0) || sum((z) => z.equipes),
            countings: totalsCountings,
        },
    }
}

export type ZoneSort = 'nom' | 'avancement_asc' | 'avancement_desc' | 'jobs_desc'

/** Tri naturel des noms : « Zone 2 » avant « Zone 10 » */
const collator = new Intl.Collator('fr', { numeric: true, sensitivity: 'base' })

export function filterAndSortZones(
    zones: ZoneProgress[],
    opts: { search?: string; state?: ZoneState | 'toutes'; sort?: ZoneSort }
): ZoneProgress[] {
    const q = (opts.search ?? '').trim().toLowerCase()
    const out = zones.filter((z) => {
        if (opts.state && opts.state !== 'toutes' && z.state !== opts.state) return false
        if (q && !`${z.name} ${z.reference}`.toLowerCase().includes(q)) return false
        return true
    })
    const prog = (z: ZoneProgress) => z.current?.pctTermine ?? 0
    switch (opts.sort ?? 'nom') {
        case 'avancement_asc':
            return out.sort((a, b) => prog(a) - prog(b) || collator.compare(a.name, b.name))
        case 'avancement_desc':
            return out.sort((a, b) => prog(b) - prog(a) || collator.compare(a.name, b.name))
        case 'jobs_desc':
            return out.sort((a, b) => b.jobs - a.jobs || collator.compare(a.name, b.name))
        default:
            return out.sort((a, b) => collator.compare(a.name, b.name))
    }
}

export const countingLabel = (order: number) => (order === 1 ? '1er comptage' : `${order}e comptage`)
