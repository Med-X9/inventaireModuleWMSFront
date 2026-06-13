import type { QueryModel } from '@SMATCH-Digital-dev/vue-system-design'

export interface QueuedTableEvent {
    eventType: string
    queryModel: QueryModel
}

/**
 * File d'attente pour les événements DataTable émis avant la fin de l'initialisation.
 */
export function createDataTableInitQueue() {
    const queue: QueuedTableEvent[] = []

    return {
        enqueue(event: QueuedTableEvent) {
            queue.push(event)
        },
        drain(): QueuedTableEvent[] {
            const events = [...queue]
            queue.length = 0
            return events
        },
        get length() {
            return queue.length
        },
        peek(): QueuedTableEvent | undefined {
            return queue[0]
        },
        shift(): QueuedTableEvent | undefined {
            return queue.shift()
        },
    }
}

/**
 * Handler wrapper : met en file si non initialisé, sinon délègue au handler d'opération.
 */
export function createQueuedTableEventHandler(options: {
    isInitialized: () => boolean
    queue: ReturnType<typeof createDataTableInitQueue>
    handleOperation: (queryModel: QueryModel) => Promise<void>
}) {
    return async (eventType: string, queryModel: QueryModel) => {
        if (!queryModel || typeof queryModel !== 'object') {
            return
        }

        if (!options.isInitialized()) {
            options.queue.enqueue({ eventType, queryModel })
            return
        }

        await options.handleOperation(queryModel)
    }
}
