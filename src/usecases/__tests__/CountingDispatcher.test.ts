import { describe, it, expect } from 'vitest'
import { CountingDispatcher } from '../CountingDispatcher'
import { CountingValidationError } from '../CountingByArticle'
import type { Count } from '@/models/Count'

function baseCount(overrides: Partial<Count> = {}): Count {
    return {
        id: 1,
        reference: 'C1',
        order: 1,
        count_mode: 'par article',
        unit_scanned: false,
        entry_quantity: false,
        is_variant: false,
        n_lot: false,
        n_serie: false,
        dlc: false,
        show_product: false,
        stock_situation: false,
        quantity_show: false,
        inventory: 1,
        created_at: '',
        updated_at: '',
        ...overrides,
    }
}

describe('CountingDispatcher', () => {
    describe('par article', () => {
        it('valide un comptage correct', () => {
            expect(() =>
                CountingDispatcher.validateCount(baseCount({ count_mode: 'par article' }))
            ).not.toThrow()
        })

        it('rejette unit_scanned true', () => {
            expect(() =>
                CountingDispatcher.validateCount(
                    baseCount({ count_mode: 'par article', unit_scanned: true })
                )
            ).toThrow(CountingValidationError)
        })

        it('rejette n_serie et n_lot simultanés', () => {
            expect(() =>
                CountingDispatcher.validateCount(
                    baseCount({ count_mode: 'par article', n_serie: true, n_lot: true })
                )
            ).toThrow(CountingValidationError)
        })
    })

    describe('en vrac', () => {
        it('valide avec unit_scanned true', () => {
            expect(() =>
                CountingDispatcher.validateCount(
                    baseCount({ count_mode: 'en vrac', unit_scanned: true })
                )
            ).not.toThrow()
        })

        it('rejette unit_scanned et entry_quantity simultanés', () => {
            expect(() =>
                CountingDispatcher.validateCount(
                    baseCount({
                        count_mode: 'en vrac',
                        unit_scanned: true,
                        entry_quantity: true,
                    })
                )
            ).toThrow(CountingValidationError)
        })
    })

    describe('image de stock', () => {
        it('exige stock_situation true', () => {
            expect(() =>
                CountingDispatcher.validateCount(
                    baseCount({ count_mode: 'image de stock', stock_situation: true })
                )
            ).not.toThrow()
        })

        it('rejette stock_situation false', () => {
            expect(() =>
                CountingDispatcher.validateCount(
                    baseCount({ count_mode: 'image de stock', stock_situation: false })
                )
            ).toThrow(CountingValidationError)
        })
    })

    it('rejette un mode inconnu', () => {
        expect(() =>
            CountingDispatcher.validateCount(baseCount({ count_mode: 'inconnu' }))
        ).toThrow(/Mode de comptage inconnu/)
    })
})
