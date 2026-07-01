import type { QueryModel } from '@SMATCH-Digital-dev/vue-system-design'
import { DEFAULT_PAGE_SIZE } from './constants'

function normalizeSort(sort: QueryModel['sort']): Array<{ colId: string; sort: 'asc' | 'desc' }> {
    if (!Array.isArray(sort)) return []
    return sort.map((entry) => {
        const direction = (entry as { sort?: string; direction?: string }).sort
            ?? (entry as { direction?: string }).direction
            ?? 'asc'
        const normalizedDirection = direction === 'desc' ? 'desc' : 'asc'
        return {
            colId: (entry as { colId?: string; field?: string }).colId
                ?? (entry as { field?: string }).field
                ?? '',
            sort: normalizedDirection,
        }
    })
}

/**
 * Normalise un QueryModel émis par le DataTable avec des valeurs par défaut sûres.
 */
export function sanitizeQueryModel(queryModel: QueryModel): QueryModel {
    return {
        page: queryModel.page ?? 1,
        pageSize: queryModel.pageSize ?? DEFAULT_PAGE_SIZE,
        sort: normalizeSort(queryModel.sort),
        filters: queryModel.filters ?? {},
        search: (queryModel.search ?? '').trim(),
        customParams: queryModel.customParams ?? {},
    }
}

/**
 * Empreinte stable pour comparer deux QueryModel (déduplication des appels API).
 */
export function queryModelFingerprint(queryModel: QueryModel | null): string {
    if (!queryModel) return ''
    const sanitized = sanitizeQueryModel(queryModel)
    const sortKey = (sanitized.sort ?? [])
        .map((entry) => `${entry.colId}:${entry.sort}`)
        .sort()
        .join(',')
    return [
        String(sanitized.page),
        String(sanitized.pageSize),
        sortKey,
        JSON.stringify(sanitized.filters ?? {}),
        sanitized.search,
        JSON.stringify(sanitized.customParams ?? {}),
    ].join('|')
}

/**
 * Compare deux QueryModel (déduplication des appels API).
 */
export function isSameQueryModel(a: QueryModel | null, b: QueryModel | null): boolean {
    if (!a || !b) return false
    return queryModelFingerprint(a) === queryModelFingerprint(b)
}
