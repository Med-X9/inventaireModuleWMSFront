import type { InventoryKpiApiResponse, InventoryKpiData } from '@/models/InventoryKpi'

function unwrapKpiPayload(raw: unknown): InventoryKpiApiResponse {
    if (!raw || typeof raw !== 'object') {
        return {}
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
            return unwrapKpiPayload(nested)
        }
    }

    return body as InventoryKpiApiResponse
}

export function parseInventoryKpiResponse(raw: unknown): {
    meta: InventoryKpiApiResponse['meta']
    data: InventoryKpiData | null
} {
    const body = unwrapKpiPayload(raw)

    const data =
        body.data ??
        ((body as unknown as InventoryKpiData).volume != null
            || (body as unknown as InventoryKpiData).jobs_termines_by_counting != null
            ? (body as unknown as InventoryKpiData)
            : null)

    return {
        meta: body.meta,
        data,
    }
}
