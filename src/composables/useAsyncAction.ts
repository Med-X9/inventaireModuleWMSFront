import { ref, type Ref } from 'vue'

/**
 * Protection anti multi-clic pour les actions asynchrones.
 *
 * Tant qu'une exécution est en cours, les appels suivants sont ignorés
 * (ils retournent `undefined` sans relancer l'action). Le verrou est pris
 * AVANT la première instruction : une fenêtre de confirmation ne peut donc
 * pas s'ouvrir deux fois, et l'appel API ne peut pas partir en double.
 *
 * @example
 *   const handleAffectAll = singleFlight(async () => { ... })
 *   // bouton : { onClick: handleAffectAll, disabled: handleAffectAll.pending.value }
 */
export type SingleFlightFn<A extends unknown[], R> = ((...args: A) => Promise<R | undefined>) & {
    /** true pendant l'exécution — à lier au `disabled` / `loading` du bouton */
    pending: Ref<boolean>
}

export function singleFlight<A extends unknown[], R>(fn: (...args: A) => Promise<R> | R): SingleFlightFn<A, R> {
    const pending = ref(false)
    const wrapped = async (...args: A): Promise<R | undefined> => {
        if (pending.value) return undefined
        pending.value = true
        try {
            return await fn(...args)
        } finally {
            pending.value = false
        }
    }
    return Object.assign(wrapped, { pending })
}

/**
 * Variante par clé : un verrou par clé (ex. une ligne de tableau).
 * Deux lignes différentes peuvent être traitées en parallèle,
 * mais un double clic sur la même ligne est ignoré.
 */
export type KeyedSingleFlightFn<A extends unknown[], R, K> = ((...args: A) => Promise<R | undefined>) & {
    isPending: (key: K) => boolean
    pendingKeys: Ref<Set<K>>
}

export function singleFlightByKey<A extends unknown[], R, K>(
    keyOf: (...args: A) => K,
    fn: (...args: A) => Promise<R> | R
): KeyedSingleFlightFn<A, R, K> {
    const pendingKeys = ref(new Set<K>()) as Ref<Set<K>>
    const wrapped = async (...args: A): Promise<R | undefined> => {
        const key = keyOf(...args)
        if (pendingKeys.value.has(key)) return undefined
        pendingKeys.value = new Set(pendingKeys.value).add(key)
        try {
            return await fn(...args)
        } finally {
            const next = new Set(pendingKeys.value)
            next.delete(key)
            pendingKeys.value = next
        }
    }
    return Object.assign(wrapped, {
        isPending: (key: K) => pendingKeys.value.has(key),
        pendingKeys,
    })
}

/** Clé de ligne générique : id, puis reference, puis l'objet lui-même. */
export const rowKey = (row: unknown): unknown => {
    if (row && typeof row === 'object') {
        const r = row as Record<string, unknown>
        return r.id ?? r.reference ?? row
    }
    return row
}
