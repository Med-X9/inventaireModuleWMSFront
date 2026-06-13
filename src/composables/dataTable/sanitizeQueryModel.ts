import type { QueryModel } from '@SMATCH-Digital-dev/vue-system-design'
import { DEFAULT_PAGE_SIZE } from './constants'

/**
 * Normalise un QueryModel émis par le DataTable avec des valeurs par défaut sûres.
 */
export function sanitizeQueryModel(queryModel: QueryModel): QueryModel {
    return {
        page: queryModel.page ?? 1,
        pageSize: queryModel.pageSize ?? DEFAULT_PAGE_SIZE,
        sort: queryModel.sort ?? [],
        filters: queryModel.filters ?? {},
        search: queryModel.search ?? '',
        customParams: queryModel.customParams ?? {},
    }
}

/**
 * Compare deux QueryModel via sérialisation JSON (déduplication des appels API).
 */
export function isSameQueryModel(a: QueryModel | null, b: QueryModel | null): boolean {
    if (!a || !b) return false
    return JSON.stringify(a) === JSON.stringify(b)
}
