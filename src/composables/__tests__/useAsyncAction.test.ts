import { describe, it, expect, vi } from 'vitest'
import { singleFlight, singleFlightByKey, rowKey } from '@/composables/useAsyncAction'

const deferred = () => {
    let resolve!: (v?: unknown) => void
    const promise = new Promise((r) => { resolve = r })
    return { promise, resolve }
}

describe('singleFlight', () => {
    it("ignore les clics pendant l'exécution puis se réarme", async () => {
        const d = deferred()
        const fn = vi.fn(() => d.promise.then(() => 'ok'))
        const action = singleFlight(fn)

        const first = action()
        const second = action()
        const third = action()
        expect(fn).toHaveBeenCalledTimes(1)
        expect(action.pending.value).toBe(true)

        d.resolve()
        expect(await first).toBe('ok')
        expect(await second).toBeUndefined()
        expect(await third).toBeUndefined()
        expect(action.pending.value).toBe(false)

        await action()
        expect(fn).toHaveBeenCalledTimes(2)
    })

    it("libère le verrou même si l'action échoue", async () => {
        const action = singleFlight(async () => { throw new Error('boom') })
        await expect(action()).rejects.toThrow('boom')
        expect(action.pending.value).toBe(false)
    })

    it('transmet les arguments', async () => {
        const fn = vi.fn(async (a: number, b: string) => `${a}-${b}`)
        const action = singleFlight(fn)
        expect(await action(1, 'x')).toBe('1-x')
        expect(fn).toHaveBeenCalledWith(1, 'x')
    })
})

describe('singleFlightByKey', () => {
    it('verrouille par ligne, pas globalement', async () => {
        const d = deferred()
        const fn = vi.fn((_row: { id: number }) => d.promise)
        const action = singleFlightByKey(rowKey, fn)

        void action({ id: 1 })
        void action({ id: 1 }) // double clic même ligne → ignoré
        void action({ id: 2 }) // autre ligne → autorisé
        expect(fn).toHaveBeenCalledTimes(2)
        expect(action.isPending(1)).toBe(true)
        expect(action.isPending(2)).toBe(true)

        d.resolve()
        await d.promise
        await Promise.resolve()
        await Promise.resolve()
        expect(action.isPending(1)).toBe(false)
    })
})
