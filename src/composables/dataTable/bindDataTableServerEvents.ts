import type { QueryModel } from '@SMATCH-Digital-dev/vue-system-design'

export type DataTableServerEventHandler = (
    eventType: string,
    queryModel: QueryModel
) => void | Promise<void>

const SERVER_SIDE_DATATABLE_EVENTS = [
    'query-model-changed',
    'global-search-changed',
    'pagination-changed',
    'sort-changed',
    'filter-changed',
    'page-size-changed',
] as const

/**
 * Bindings Vue pour le DataTable server-side (@SMATCH-Digital-dev/vue-system-design).
 * Pagination, tri, filtres, recherche et pageSize n'émettent pas tous `query-model-changed`.
 */
export function bindDataTableServerEvents(handler: DataTableServerEventHandler) {
    return Object.fromEntries(
        SERVER_SIDE_DATATABLE_EVENTS.map((event) => [
            event,
            (queryModel: QueryModel) => handler(event, queryModel),
        ]),
    )
}
