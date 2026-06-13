import { describe, it, expect, vi } from 'vitest'
import { createDataTableOperationHandler } from '../createDataTableOperationHandler'
import type { QueryModel } from '@SMATCH-Digital-dev/vue-system-design'

const baseQm = (): QueryModel => ({
    page: 1,
    pageSize: 50,
    sort: [],
    filters: {},
    search: '',
    customParams: {},
})

describe('createDataTableOperationHandler', () => {
    it('ignore un queryModel invalide', async () => {
        const fetch = vi.fn()
        const handler = createDataTableOperationHandler({
            fetch,
            getLastQueryModel: () => null,
            setLastQueryModel: vi.fn(),
        })
        await handler(null as any)
        expect(fetch).not.toHaveBeenCalled()
    })

    it('appelle fetch et met à jour le cache', async () => {
        const fetch = vi.fn().mockResolvedValue(undefined)
        const setLast = vi.fn()
        let last: QueryModel | null = null

        const handler = createDataTableOperationHandler({
            fetch,
            getLastQueryModel: () => last,
            setLastQueryModel: (qm) => {
                last = qm
                setLast(qm)
            },
        })

        const qm = baseQm()
        await handler(qm)

        expect(fetch).toHaveBeenCalledTimes(1)
        expect(setLast).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }))
    })

    it('déduplique les QueryModel identiques', async () => {
        const fetch = vi.fn().mockResolvedValue(undefined)
        let last: QueryModel | null = null

        const handler = createDataTableOperationHandler({
            fetch,
            getLastQueryModel: () => last,
            setLastQueryModel: (qm) => {
                last = qm
            },
        })

        const qm = baseQm()
        await handler(qm)
        await handler({ ...qm })

        expect(fetch).toHaveBeenCalledTimes(1)
    })

    it('respecte canFetch', async () => {
        const fetch = vi.fn()
        const handler = createDataTableOperationHandler({
            fetch,
            getLastQueryModel: () => null,
            setLastQueryModel: vi.fn(),
            canFetch: () => false,
        })
        await handler(baseQm())
        expect(fetch).not.toHaveBeenCalled()
    })

    it('gère onLoading et onError', async () => {
        const onLoading = vi.fn()
        const onError = vi.fn()
        const fetch = vi.fn().mockRejectedValue(new Error('fail'))

        const handler = createDataTableOperationHandler({
            fetch,
            getLastQueryModel: () => null,
            setLastQueryModel: vi.fn(),
            onLoading,
            onError,
        })

        await handler(baseQm())
        expect(onLoading).toHaveBeenCalledWith(true)
        expect(onLoading).toHaveBeenCalledWith(false)
        expect(onError).toHaveBeenCalled()
    })
})
