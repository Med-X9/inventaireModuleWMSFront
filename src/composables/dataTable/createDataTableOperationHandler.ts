import type { QueryModel } from '@SMATCH-Digital-dev/vue-system-design'
import { isSameQueryModel, sanitizeQueryModel } from './sanitizeQueryModel'

export interface DataTableOperationHandlerOptions {
    fetch: (queryModel: QueryModel) => Promise<void>
    getLastQueryModel: () => QueryModel | null
    setLastQueryModel: (queryModel: QueryModel) => void
    onLoading?: (loading: boolean) => void
    canFetch?: () => boolean
    onError?: (error: unknown) => void | Promise<void>
    sanitize?: (queryModel: QueryModel) => QueryModel
}

/**
 * Factory pour le handler server-side unifié (pattern useInventoryManagement).
 * Déduplique les QueryModel identiques et gère le cycle loading optionnel.
 */
export function createDataTableOperationHandler(options: DataTableOperationHandlerOptions) {
    const sanitize = options.sanitize ?? sanitizeQueryModel

    return async (queryModel: QueryModel): Promise<void> => {
        if (!queryModel || typeof queryModel !== 'object') {
            return
        }

        if (options.canFetch && !options.canFetch()) {
            return
        }

        const finalQueryModel = sanitize(queryModel)

        if (isSameQueryModel(options.getLastQueryModel(), finalQueryModel)) {
            return
        }

        options.onLoading?.(true)
        try {
            await options.fetch(finalQueryModel)
            options.setLastQueryModel({ ...finalQueryModel })
        } catch (error) {
            if (options.onError) {
                await options.onError(error)
            } else {
                throw error
            }
        } finally {
            options.onLoading?.(false)
        }
    }
}
