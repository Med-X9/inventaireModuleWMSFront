/**
 * Utilitaires pour le tri (DRY - Don't Repeat Yourself)
 * 
 * Centralise toute la logique de tri réutilisable pour le DataTable.
 * Gère le tri multi-colonnes avec priorités.
 * 
 * @module sortUtils
 */

/**
 * Règle de tri pour une colonne
 */
export interface SortRule {
    /** Nom du champ à trier */
    field: string
    /** Direction du tri */
    direction: 'asc' | 'desc'
    /** Priorité du tri (pour tri multi-colonnes, plus petit = plus prioritaire) */
    priority?: number
}

/**
 * Compare deux valeurs pour le tri
 * 
 * Gère automatiquement :
 * - Les valeurs null/undefined (toujours en fin)
 * - Les nombres (comparaison numérique)
 * - Les chaînes (comparaison alphabétique insensible à la casse)
 * 
 * @param a - Première valeur
 * @param b - Deuxième valeur
 * @param direction - Direction du tri ('asc' ou 'desc')
 * @returns Nombre négatif si a < b, positif si a > b, 0 si égal
 * 
 * @internal
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
 * 
 * Les règles sont appliquées par ordre de priorité (priorité plus petite = plus prioritaire).
 * Si deux éléments sont égaux selon une règle, la règle suivante est utilisée.
 * 
 * @param data - Tableau de données à trier
 * @param sortRules - Règles de tri à appliquer
 * @returns Nouveau tableau trié (ne modifie pas l'original)
 * 
 * @example
 * ```typescript
 * const data = [
 *   { name: 'John', age: 30 },
 *   { name: 'Jane', age: 25 },
 *   { name: 'John', age: 25 }
 * ]
 * 
 * sortData(data, [
 *   { field: 'name', direction: 'asc', priority: 1 },
 *   { field: 'age', direction: 'desc', priority: 2 }
 * ])
 * // Résultat : [{ name: 'Jane', age: 25 }, { name: 'John', age: 30 }, { name: 'John', age: 25 }]
 * ```
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
 * 
 * Les priorités sont assignées automatiquement selon l'ordre dans le tableau.
 * 
 * @param sortModel - Modèle de tri simple (tableau de { field, direction })
 * @returns Règles de tri avec priorités
 * 
 * @example
 * ```typescript
 * createSortRules([
 *   { field: 'name', direction: 'asc' },
 *   { field: 'age', direction: 'desc' }
 * ])
 * // Résultat : [
 * //   { field: 'name', direction: 'asc', priority: 1 },
 * //   { field: 'age', direction: 'desc', priority: 2 }
 * // ]
 * ```
 */
export function createSortRules(sortModel: Array<{ field: string; direction: 'asc' | 'desc' }>): SortRule[] {
    return sortModel.map((sort, index) => ({
        field: sort.field,
        direction: sort.direction,
        priority: index + 1
    }))
}

