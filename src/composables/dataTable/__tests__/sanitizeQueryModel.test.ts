import { describe, it, expect } from 'vitest'
import { sanitizeQueryModel, isSameQueryModel } from '../sanitizeQueryModel'
import { DEFAULT_PAGE_SIZE } from '../constants'

describe('sanitizeQueryModel', () => {
    it('applique les valeurs par défaut', () => {
        const result = sanitizeQueryModel({} as any)
        expect(result).toEqual({
            page: 1,
            pageSize: DEFAULT_PAGE_SIZE,
            sort: [],
            filters: {},
            search: '',
            customParams: {},
        })
    })

    it('préserve les valeurs fournies', () => {
        const input = {
            page: 2,
            pageSize: 25,
            sort: [{ field: 'reference', direction: 'asc' }],
            filters: { status: 'VALIDE' },
            search: 'JOB-001',
            customParams: { inventory_id: 1 },
        }
        const result = sanitizeQueryModel(input as any)
        expect(result.page).toBe(2)
        expect(result.pageSize).toBe(25)
        expect(result.search).toBe('JOB-001')
        expect(result.customParams).toEqual({ inventory_id: 1 })
    })
})

describe('isSameQueryModel', () => {
    it('retourne true pour des modèles identiques', () => {
        const qm = { page: 1, pageSize: 50, sort: [], filters: {}, search: '', customParams: {} }
        expect(isSameQueryModel(qm as any, { ...qm } as any)).toBe(true)
    })

    it('retourne false si null ou différent', () => {
        const qm = { page: 1, pageSize: 50, sort: [], filters: {}, search: '', customParams: {} }
        expect(isSameQueryModel(null, qm as any)).toBe(false)
        expect(isSameQueryModel(qm as any, { ...qm, page: 2 } as any)).toBe(false)
    })
})
