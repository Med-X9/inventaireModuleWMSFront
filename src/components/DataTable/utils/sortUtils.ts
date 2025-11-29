/**
 * Utilitaires pour le tri (DRY - Don't Repeat Yourself)
 * Centralise toute la logique de tri réutilisable
 */

export interface SortRule {
    field: string
    direction: 'asc' | 'desc'
    priority?: number
}

/**
 * Compare deux valeurs pour le tri
 */
function compareValues(a: any, b: any, direction: 'asc' | 'desc'): number {
    // Gestion des valeurs null/undefined
    if (a === null || a === undefined) return direction === 'asc' ? 1 : -1
    if (b === null || b === undefined) return direction === 'asc' ? -1 : 1
    
    // Conversion en nombres si possible
    const numA = Number(a)
    const numB = Number(b)
    const isNumeric = !isNaN(numA) && !isNaN(numB) && isFinite(numA) && isFinite(numB)
    
    if (isNumeric) {
        const diff = numA - numB
        return direction === 'asc' ? diff : -diff
    }
    
    // Comparaison de chaînes
    const strA = String(a).toLowerCase()
    const strB = String(b).toLowerCase()
    const diff = strA.localeCompare(strB)
    
    return direction === 'asc' ? diff : -diff
}

/**
 * Trie un tableau selon plusieurs règles de tri
 */
export function sortData<T extends Record<string, any>>(data: T[], sortRules: SortRule[]): T[] {
    if (!sortRules || sortRules.length === 0) return [...data]
    
    // Trier par priorité puis par champ
    const sortedRules = [...sortRules].sort((a, b) => {
        const priorityA = a.priority ?? 999
        const priorityB = b.priority ?? 999
        return priorityA - priorityB
    })
    
    return [...data].sort((a, b) => {
        for (const rule of sortedRules) {
            const diff = compareValues(a[rule.field], b[rule.field], rule.direction)
            if (diff !== 0) return diff
        }
        return 0
    })
}

/**
 * Convertit un modèle de tri simple en règles de tri
 */
export function createSortRules(sortModel: Array<{ field: string; direction: 'asc' | 'desc' }>): SortRule[] {
    return sortModel.map((sort, index) => ({
        field: sort.field,
        direction: sort.direction,
        priority: index + 1
    }))
}

