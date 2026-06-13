import { describe, it, expect, vi, beforeEach } from 'vitest'
import { normalizeDataTableResponse } from '../dataTableResponseNormalizer'

vi.mock('@/services/loggerService', () => ({
    logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

describe('normalizeDataTableResponse', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('normalise le format rows unifié', () => {
        const result = normalizeDataTableResponse({
            rows: [{ id: 1 }],
            page: 2,
            pageSize: 10,
            total: 28,
            totalPages: 3,
        })
        expect(result).toEqual({
            rows: [{ id: 1 }],
            page: 2,
            pageSize: 10,
            total: 28,
            totalPages: 3,
        })
    })

    it('priorise total_count sur total', () => {
        const result = normalizeDataTableResponse({
            rows: [],
            page: 1,
            pageSize: 50,
            total: 50,
            total_count: 120,
            totalPages: 3,
        })
        expect(result.total).toBe(120)
    })

    it('convertit le format data[]', () => {
        const result = normalizeDataTableResponse({
            data: [{ id: 1 }, { id: 2 }],
            page: 1,
            pageSize: 20,
            recordsTotal: 2,
        })
        expect(result.rows).toHaveLength(2)
        expect(result.total).toBe(2)
    })

    it('convertit le format results[]', () => {
        const result = normalizeDataTableResponse({
            results: [{ id: 1 }],
            count: 1,
            page: 1,
            pageSize: 20,
        })
        expect(result.rows).toHaveLength(1)
        expect(result.total).toBe(1)
    })

    it('retourne un format vide pour payload invalide', () => {
        const result = normalizeDataTableResponse(null)
        expect(result.rows).toEqual([])
        expect(result.total).toBe(0)
    })

    it('déplie une enveloppe data.rows', () => {
        const result = normalizeDataTableResponse({
            success: true,
            data: {
                rows: [{ id: 99 }],
                page: 1,
                pageSize: 10,
                total: 1,
                totalPages: 1,
            },
        })
        expect(result.rows).toEqual([{ id: 99 }])
    })
})
