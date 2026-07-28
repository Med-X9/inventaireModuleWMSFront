/**
 * Parse et assemble les réponses des endpoints KPI individuels
 * vers le modèle agrégé InventoryKpiData utilisé par le dashboard.
 *
 * Format backend réel :
 * { success, message, data: { <data_key>: <payload> }, meta: { kpi, label, warehouse_name, ... } }
 */

import type {
    AssignmentsByCounting,
    InventoryKpiData,
    InventoryKpiEndpointDef,
    InventoryKpiEndpointMeta,
    InventoryKpiSingleResponse,
    InventoryKpiTeam,
    JobsTerminesByCounting,
    MagasinsByStatus,
    StockGapsSummary,
    TeamsSummaryT06,
} from '@/models/InventoryKpi'

export interface KpiEndpointResult {
    def: InventoryKpiEndpointDef
    response: InventoryKpiSingleResponse | null
    error?: unknown
}

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    return value as Record<string, unknown>
}

/**
 * Extrait le payload métier sous la clé `dataKey` (ex. nombre_jobs_total).
 */
export function extractByDataKey(raw: unknown, dataKey?: string): unknown {
    let current: unknown = raw

    // Enveloppe HTTP { success, data, meta }
    const envelope = asRecord(current)
    if (envelope && 'data' in envelope && (envelope.success != null || envelope.meta != null)) {
        current = envelope.data
    }

    if (!dataKey) return current

    const record = asRecord(current)
    if (record && dataKey in record) {
        return record[dataKey]
    }

    return current
}

/** Extrait un entier depuis le payload scalaire backend */
export function extractScalar(data: unknown, catalogId?: string, dataKey?: string): number | undefined {
    const payload = extractByDataKey(data, dataKey)

    if (typeof payload === 'number' && Number.isFinite(payload)) {
        return payload
    }

    const record = asRecord(payload)
    if (!record) return undefined

    if (catalogId && typeof record[catalogId] === 'number') {
        return record[catalogId] as number
    }

    if (dataKey && typeof record[dataKey] === 'number') {
        return record[dataKey] as number
    }

    for (const key of ['value', 'count', 'total', 'nombre']) {
        if (typeof record[key] === 'number') {
            return record[key] as number
        }
    }

    for (const [key, val] of Object.entries(record)) {
        if (key.startsWith('KPI-') && typeof val === 'number') {
            return val
        }
    }

    // Objet avec une seule propriété numérique
    const numericEntries = Object.entries(record).filter(([, v]) => typeof v === 'number')
    if (numericEntries.length === 1) {
        return numericEntries[0]![1] as number
    }

    return undefined
}

function looksLikeJobsTermines(obj: Record<string, unknown>): boolean {
    return (
        typeof obj.percent === 'number'
        || typeof obj.jobs_termines === 'number'
        || typeof obj.jobs_eligibles === 'number'
    )
}

function looksLikeAssignments(obj: Record<string, unknown>): boolean {
    return (
        asRecord(obj.en_attente) != null
        || asRecord(obj.en_cours) != null
        || asRecord(obj.termine) != null
    )
}

export function extractJobsTermines(
    data: unknown,
    catalogId: string,
    dataKey?: string
): JobsTerminesByCounting | undefined {
    const payload = extractByDataKey(data, dataKey)
    const record = asRecord(payload)
    if (!record) return undefined

    const keyed = asRecord(record[catalogId])
    if (keyed && looksLikeJobsTermines(keyed)) {
        return keyed as unknown as JobsTerminesByCounting
    }

    if (looksLikeJobsTermines(record)) {
        return record as unknown as JobsTerminesByCounting
    }

    return undefined
}

export function extractAssignments(
    data: unknown,
    catalogId: string,
    dataKey?: string
): AssignmentsByCounting | undefined {
    const payload = extractByDataKey(data, dataKey)
    const record = asRecord(payload)
    if (!record) return undefined

    const keyed = asRecord(record[catalogId])
    if (keyed && looksLikeAssignments(keyed)) {
        return keyed as unknown as AssignmentsByCounting
    }

    if (looksLikeAssignments(record)) {
        return record as unknown as AssignmentsByCounting
    }

    return undefined
}

function extractTeamsList(data: unknown, dataKey?: string): InventoryKpiTeam[] {
    const payload = extractByDataKey(data, dataKey)

    if (Array.isArray(payload)) {
        return payload.filter(
            (item): item is InventoryKpiTeam =>
                !!item && typeof item === 'object' && typeof (item as InventoryKpiTeam).team_key === 'string'
        )
    }

    const record = asRecord(payload)
    if (!record) return []

    if (Array.isArray(record.teams)) {
        return extractTeamsList(record.teams)
    }

    if (typeof record.team_key === 'string') {
        return [record as unknown as InventoryKpiTeam]
    }

    return []
}

function extractT06Summary(data: unknown, dataKey?: string): TeamsSummaryT06 | number | undefined {
    const payload = extractByDataKey(data, dataKey)

    if (typeof payload === 'number') return payload

    const record = asRecord(payload)
    if (!record) return undefined

    if (typeof record.count === 'number') {
        return {
            count: record.count,
            team_keys: Array.isArray(record.team_keys)
                ? record.team_keys.filter((k): k is string => typeof k === 'string')
                : undefined,
        }
    }

    const teams = extractTeamsList(payload)
    if (teams.length > 0) {
        const multi = teams.filter(
            (t) =>
                t['KPI-T06']?.is_multi_discrepancy
                || (t as unknown as Record<string, unknown>).is_multi_discrepancy === true
        )
        return {
            count: multi.length,
            team_keys: multi.map((t) => t.team_key),
        }
    }

    return undefined
}

function extractMagasinsByStatus(data: unknown, dataKey?: string): MagasinsByStatus | undefined {
    const payload = extractByDataKey(data, dataKey)
    const record = asRecord(payload)
    if (!record) return undefined

    const byStatusRaw = asRecord(record.by_status)
    if (!byStatusRaw && typeof record.total_magasins !== 'number') {
        // parfois le payload est déjà { EN ATTENTE: {...}, ... }
        const looksLikeStatusMap = Object.keys(record).some((k) =>
            ['EN ATTENTE', 'LANCEE', 'TERMINEE', 'ANALYSER', 'CLOTURE'].includes(k)
        )
        if (looksLikeStatusMap) {
            const by_status: MagasinsByStatus['by_status'] = {}
            let total = 0
            for (const [status, rawBucket] of Object.entries(record)) {
                const bucket = asRecord(rawBucket)
                if (!bucket) continue
                const count = Number(bucket.count ?? 0)
                total += count
                by_status[status] = {
                    count,
                    percent: Number(bucket.percent ?? 0),
                }
            }
            return { total_magasins: total, by_status }
        }
        return undefined
    }

    const by_status: MagasinsByStatus['by_status'] = {}
    if (byStatusRaw) {
        for (const [status, rawBucket] of Object.entries(byStatusRaw)) {
            const bucket = asRecord(rawBucket)
            if (!bucket) continue
            by_status[status] = {
                count: Number(bucket.count ?? 0),
                percent: Number(bucket.percent ?? 0),
            }
        }
    }

    return {
        total_magasins: Number(record.total_magasins ?? Object.values(by_status).reduce((s, b) => s + b.count, 0)),
        by_status,
    }
}

function extractStockGapsSummary(data: unknown, dataKey?: string): StockGapsSummary | number | undefined {
    const payload = extractByDataKey(data, dataKey)
    if (typeof payload === 'number') return payload

    const record = asRecord(payload)
    if (!record) return undefined

    return {
        total: typeof record.total === 'number' ? record.total : undefined,
        with_gap: typeof record.with_gap === 'number' ? record.with_gap : undefined,
        without_gap: typeof record.without_gap === 'number' ? record.without_gap : undefined,
        count: typeof record.count === 'number' ? record.count : undefined,
        percent: typeof record.percent === 'number' ? record.percent : undefined,
        valides: typeof record.valides === 'number' ? record.valides : undefined,
        total_lignes: typeof record.total_lignes === 'number' ? record.total_lignes : undefined,
        ...record,
    } as StockGapsSummary
}

function mergeTeam(
    map: Map<string, InventoryKpiTeam>,
    partial: InventoryKpiTeam,
    catalogId: InventoryKpiEndpointDef['catalogId']
) {
    const existing = map.get(partial.team_key) ?? {
        team_key: partial.team_key,
        username: partial.username ?? null,
    }

    if (partial.username) {
        existing.username = partial.username
    }

    const raw = partial as unknown as Record<string, unknown>

    if (catalogId === 'KPI-T02') {
        existing['KPI-T02'] = partial['KPI-T02'] ?? {
            percent: Number(raw.percent ?? 0),
            termines: Number(raw.termines ?? 0),
            total: Number(raw.total ?? 0),
        }
    } else if (catalogId === 'KPI-T03') {
        existing['KPI-T03'] = partial['KPI-T03'] ?? {
            percent: Number(raw.percent ?? 0),
            termines: Number(raw.termines ?? 0),
            total: Number(raw.total ?? 0),
        }
    } else if (catalogId === 'KPI-T04') {
        existing['KPI-T04'] =
            partial['KPI-T04']
            ?? (looksLikeAssignments(raw) ? (raw as unknown as AssignmentsByCounting) : undefined)
    } else if (catalogId === 'KPI-T05') {
        existing['KPI-T05'] =
            partial['KPI-T05']
            ?? (looksLikeAssignments(raw) ? (raw as unknown as AssignmentsByCounting) : undefined)
    } else if (catalogId === 'KPI-T06') {
        existing['KPI-T06'] = partial['KPI-T06'] ?? {
            open_discrepancies_count: Number(raw.open_discrepancies_count ?? 0),
            is_multi_discrepancy: Boolean(raw.is_multi_discrepancy),
        }
    } else if (catalogId === 'KPI-T07') {
        existing['KPI-T07'] = partial['KPI-T07'] ?? {
            jobs_with_discrepancy_count: Number(raw.jobs_with_discrepancy_count ?? 0),
        }
    }

    map.set(partial.team_key, existing)
}

/**
 * Conserve le parseur historique (payload agrégé) pour compat / tests.
 */
export function parseInventoryKpiResponse(raw: unknown): {
    meta: InventoryKpiEndpointMeta | undefined
    data: InventoryKpiData | null
} {
    if (!raw || typeof raw !== 'object') {
        return { meta: undefined, data: null }
    }

    const body = raw as Record<string, unknown>

    if (body.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
        const nested = body.data as Record<string, unknown>
        const hasKpiShape =
            nested.volume != null
            || nested.jobs_termines_by_counting != null
            || nested.assignments_by_counting != null
            || nested.discrepancies != null
            || nested.teams != null

        if (!hasKpiShape && (nested.data != null || nested.meta != null)) {
            return parseInventoryKpiResponse(nested)
        }

        if (hasKpiShape) {
            return {
                meta: (body.meta as InventoryKpiEndpointMeta | undefined)
                    ?? (nested.meta as InventoryKpiEndpointMeta | undefined),
                data: nested as unknown as InventoryKpiData,
            }
        }
    }

    const data =
        (body.data as InventoryKpiData | undefined)
        ?? ((body as unknown as InventoryKpiData).volume != null
            || (body as unknown as InventoryKpiData).jobs_termines_by_counting != null
            ? (body as unknown as InventoryKpiData)
            : null)

    return {
        meta: body.meta as InventoryKpiEndpointMeta | undefined,
        data,
    }
}

/**
 * Assemble les résultats des endpoints individuels en InventoryKpiData.
 */
export function assembleInventoryKpiData(results: KpiEndpointResult[]): {
    data: InventoryKpiData
    meta: InventoryKpiEndpointMeta | undefined
    successCount: number
    failureCount: number
} {
    const data: InventoryKpiData = {
        volume: {},
        jobs_termines_by_counting: {},
        assignments_by_counting: {},
        discrepancies: {},
        teams_summary: {},
        teams: [],
        stores: {},
        stock_gaps: {},
    }

    const teamsMap = new Map<string, InventoryKpiTeam>()
    let meta: InventoryKpiEndpointMeta | undefined
    let successCount = 0
    let failureCount = 0

    for (const { def, response, error } of results) {
        if (error || !response) {
            failureCount += 1
            continue
        }

        successCount += 1
        if (response.meta) {
            meta = {
                ...meta,
                ...response.meta,
                // Backend utilise meta.kpi (slug) plutôt que meta.slug
                slug: response.meta.slug ?? (response.meta as { kpi?: string }).kpi,
                warehouse_name: response.meta.warehouse_name ?? meta?.warehouse_name,
            }
        }

        const payload = response.data ?? response

        switch (def.category) {
            case 'volume': {
                const value = extractScalar(payload, def.catalogId, def.dataKey)
                if (value !== undefined && data.volume) {
                    data.volume[def.catalogId as keyof NonNullable<InventoryKpiData['volume']>] = value
                }
                break
            }
            case 'jobs_termines': {
                const jt = extractJobsTermines(payload, def.catalogId, def.dataKey)
                if (jt && data.jobs_termines_by_counting) {
                    data.jobs_termines_by_counting[def.catalogId] = jt
                }
                break
            }
            case 'assignments': {
                const asg = extractAssignments(payload, def.catalogId, def.dataKey)
                if (asg && data.assignments_by_counting) {
                    data.assignments_by_counting[def.catalogId] = asg
                }
                break
            }
            case 'discrepancies': {
                const value = extractScalar(payload, def.catalogId, def.dataKey)
                if (value !== undefined && data.discrepancies) {
                    data.discrepancies[def.catalogId as keyof NonNullable<InventoryKpiData['discrepancies']>] =
                        value
                }
                break
            }
            case 'teams': {
                if (def.catalogId === 'KPI-T01') {
                    const value = extractScalar(payload, def.catalogId, def.dataKey)
                    if (value !== undefined && data.teams_summary) {
                        data.teams_summary['KPI-T01'] = value
                    }
                } else if (def.catalogId === 'KPI-T06') {
                    const summary = extractT06Summary(payload, def.dataKey)
                    if (summary !== undefined && data.teams_summary) {
                        data.teams_summary['KPI-T06'] = summary
                    }
                    for (const team of extractTeamsList(payload, def.dataKey)) {
                        mergeTeam(teamsMap, team, def.catalogId)
                    }
                } else {
                    for (const team of extractTeamsList(payload, def.dataKey)) {
                        mergeTeam(teamsMap, team, def.catalogId)
                    }
                }
                break
            }
            case 'stores': {
                if (def.catalogId === 'KPI-S01') {
                    const value = extractScalar(payload, def.catalogId, def.dataKey)
                    if (value !== undefined && data.stores) {
                        data.stores['KPI-S01'] = value
                    }
                } else if (def.catalogId === 'KPI-S02') {
                    const repartition = extractMagasinsByStatus(payload, def.dataKey)
                    if (repartition && data.stores) {
                        data.stores['KPI-S02'] = repartition
                    }
                }
                break
            }
            case 'stock_gaps': {
                const summary = extractStockGapsSummary(payload, def.dataKey)
                if (summary !== undefined && data.stock_gaps) {
                    if (def.catalogId === 'KPI-E01') data.stock_gaps['KPI-E01'] = summary
                    if (def.catalogId === 'KPI-E02') data.stock_gaps['KPI-E02'] = summary
                }
                break
            }
        }
    }

    data.teams = Array.from(teamsMap.values())

    return { data, meta, successCount, failureCount }
}
