import type { RowNode } from './types'

type LooseRecord = Record<string, unknown>

export function resolveJobCreatedAt(job: LooseRecord): string | null {
    const candidates = [
        job.created_at,
        job.date_creation,
        job.date_created,
        job.createdAt,
        job.en_attente_date,
        job.valide_date,
        job.updated_at,
    ]

    for (const value of candidates) {
        if (value != null && String(value).trim() !== '') {
            return String(value)
        }
    }

    return null
}

export function getAssignmentSessionLabel(assignment: LooseRecord | null | undefined): string {
    if (!assignment) return ''

    const session = assignment.session as LooseRecord | undefined

    return String(
        session?.username ??
            assignment.username ??
            assignment.session_username ??
            assignment.session_full_name ??
            (assignment.session_id != null ? `Session ${assignment.session_id}` : ''),
    ).trim()
}

export function normalizeJobAssignments(job: LooseRecord): LooseRecord[] {
    const raw = job.assignments ?? job.comptages
    if (!Array.isArray(raw)) return []

    const normalized: LooseRecord[] = []

    for (const entry of raw) {
        if (!entry || typeof entry !== 'object') continue

        const assignment = entry as LooseRecord
        const countingOrder = Number(assignment.counting_order)
        if (!Number.isFinite(countingOrder) || countingOrder <= 0) continue

        const sessionLabel = getAssignmentSessionLabel(assignment)

        normalized.push({
            ...assignment,
            counting_order: countingOrder,
            username: sessionLabel || assignment.username,
            session:
                assignment.session ??
                (sessionLabel
                    ? { id: assignment.session_id, username: sessionLabel }
                    : null),
        })
    }

    return normalized
}

export function findAssignmentByOrder(
    assignments: LooseRecord[] | undefined,
    order: number,
): LooseRecord | undefined {
    return assignments?.find((assignment) => Number(assignment.counting_order) === order)
}

function formatDateCellValue(value: string | null | undefined): string {
    if (!value) return '-'

    try {
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return value

        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        })
    } catch {
        return value
    }
}

export function formatPlanningCreatedAtCell(
    paramsOrValue: unknown,
    _column?: unknown,
    row?: unknown,
): string {
    let rowData: LooseRecord | null = null

    if (row && typeof row === 'object') {
        rowData = row as LooseRecord
    } else if (paramsOrValue && typeof paramsOrValue === 'object') {
        const params = paramsOrValue as LooseRecord
        rowData = (params.data as LooseRecord | undefined) ?? params
    }

    if (!rowData) return '-'

    return formatDateCellValue(resolveJobCreatedAt(rowData))
}

export function formatAssignmentSessionCell(
    paramsOrValue: unknown,
    column: { badgeStyles?: Array<{ value: string; class: string }>; badgeDefaultClass?: string } | undefined,
    row: unknown,
    order: number,
    badgeDefaultClass: string,
    badgeStyles: Array<{ value: string; class: string }>,
): string {
    let rowData: RowNode | null = null

    if (row && typeof row === 'object') {
        rowData = row as RowNode
    } else if (paramsOrValue && typeof paramsOrValue === 'object') {
        const params = paramsOrValue as LooseRecord
        rowData = ((params.data as RowNode | undefined) ?? params) as RowNode
    }

    if (!rowData) return '-'

    const assignments = (rowData.assignments ?? []) as LooseRecord[]
    const assignment = findAssignmentByOrder(assignments, order)
    const fallbackTeam = order === 1 ? rowData.team1 : order === 2 ? rowData.team2 : ''
    const sessionLabel =
        getAssignmentSessionLabel(assignment) ||
        fallbackTeam ||
        String((rowData as unknown as LooseRecord)[`counting_${order}_session`] ?? '').trim()

    if (!sessionLabel) return '-'

    const status =
        String(assignment?.status ?? '') ||
        (order === 1 ? rowData.team1Status : order === 2 ? rowData.team2Status : '') ||
        rowData.status ||
        ''

    const styles = column?.badgeStyles ?? badgeStyles
    const defaultClass = column?.badgeDefaultClass ?? badgeDefaultClass
    const badgeStyle = status ? styles.find((style) => style.value === status) : undefined
    const badgeClass = badgeStyle?.class || defaultClass

    return `<span class="${badgeClass}">${sessionLabel}</span>`
}

export function transformLocations(_jobId: string | number, emplacements: any[]): any[] {
    const locations: any[] = []
    for (let i = 0, len = emplacements.length; i < len; i++) {
        const loc = emplacements[i]
        locations.push({
            id: loc.id,
            reference: loc.reference,
            location_reference: loc.reference,
            zone_name: loc.zone?.zone_name || loc.sous_zone?.zone_name || 'N/A',
            sous_zone_name: loc.sous_zone?.sous_zone_name || 'N/A',
            zone: loc.zone,
            sous_zone: loc.sous_zone,
        })
    }
    return locations
}

export function transformJobToRowNode(parentRow: any): RowNode {
    const job = parentRow as LooseRecord
    const assignments = normalizeJobAssignments(job)
    const premierAssignment = findAssignmentByOrder(assignments, 1)
    const deuxiemeAssignment = findAssignmentByOrder(assignments, 2)

    const ressourcesList = (parentRow.ressources || []).map((r: any) => r.reference)
    const ressourcesString = ressourcesList.length > 0 ? ressourcesList.join(', ') : ''

    const team1Name = getAssignmentSessionLabel(premierAssignment)
    const team2Name = getAssignmentSessionLabel(deuxiemeAssignment)

    const team1Status = String(premierAssignment?.status ?? parentRow.status ?? '')
    const team2Status = String(deuxiemeAssignment?.status ?? parentRow.status ?? '')

    const locations = parentRow.emplacements || parentRow.locations || []
    const jobId = parentRow.id ?? parentRow.job_id

    const row: RowNode = {
        id: String(jobId),
        job: parentRow.reference || parentRow.job_reference || `Job ${jobId}`,
        locations,
        team1: team1Name,
        team1Status,
        date1: String(premierAssignment?.date_start ?? ''),
        team2: team2Name,
        team2Status,
        date2: String(deuxiemeAssignment?.date_start ?? ''),
        resourcesList: ressourcesList,
        resources: ressourcesString,
        nbResources: ressourcesList.length,
        status: parentRow.status,
        isChild: false,
        parentId: null,
        assignments: assignments as RowNode['assignments'],
    }

    for (const assignment of assignments) {
        const order = Number(assignment.counting_order)
        const label = getAssignmentSessionLabel(assignment)
        if (label) {
            ;(row as unknown as LooseRecord)[`counting_${order}_session`] = label
        }
    }

    return row
}

export function mapJobsToRows(jobs: any[] | undefined | null): RowNode[] {
    if (!jobs || jobs.length === 0) {
        return []
    }

    const result: RowNode[] = []
    for (let i = 0; i < jobs.length; i++) {
        result[i] = transformJobToRowNode(jobs[i])
    }
    return result
}

export function getTransformedLocations(jobId: string | number, rawLocations: any[]): any[] {
    return transformLocations(jobId, rawLocations)
}
