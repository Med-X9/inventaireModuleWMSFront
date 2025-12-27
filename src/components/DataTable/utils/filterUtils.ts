/**
 * Utilitaires pour le filtrage (DRY - Don't Repeat Yourself)
 * 
 * Centralise toute la logique de filtrage réutilisable pour le DataTable.
 * Gère la validation, l'application de filtres et la recherche globale.
 * 
 * @module filterUtils
 */

import type { FilterOperator } from '../types/dataTable'

/**
 * Valeur de filtre avec opérateur et valeurs
 */
export interface FilterValue {
    /** Opérateur de filtre */
    operator: FilterOperator
    /** Valeur unique (pour la plupart des opérateurs) */
    value?: any
    /** Valeur secondaire (pour l'opérateur 'between') */
    value2?: any
    /** Liste de valeurs (pour les opérateurs 'in', 'not_in') */
    values?: any[]
}

/**
 * Valide qu'un filtre a des valeurs valides
 * 
 * @param filter - Filtre à valider
 * @returns true si le filtre est valide, false sinon
 * 
 * @example
 * ```typescript
 * isValidFilter({ operator: 'equals', value: 'test' }) // true
 * isValidFilter({ operator: 'equals', value: '' }) // false
 * isValidFilter({ operator: 'in', values: [1, 2, 3] }) // true
 * ```
 */
export function isValidFilter(filter: FilterValue | null | undefined): boolean {
    if (!filter) return false
    
    // Filtre avec valeur unique
    if (filter.value !== undefined && filter.value !== null && filter.value !== '') {
        return true
    }
    
    // Filtre avec valeurs multiples
    if (filter.values && Array.isArray(filter.values) && filter.values.length > 0) {
        return true
    }
    
    // Filtre avec range (between)
    if (filter.value2 !== undefined && filter.value !== undefined) {
        return true
    }
    
    // Opérateurs null/vide
    if (filter.operator === 'is_null' || filter.operator === 'is_not_null' || 
        filter.operator === 'is_empty' || filter.operator === 'is_not_empty') {
        return true
    }
    
    return false
}

/**
 * Applique un filtre à une valeur unique
 * 
 * @param value - Valeur à filtrer
 * @param filter - Filtre à appliquer
 * @returns true si la valeur correspond au filtre, false sinon
 * 
 * @example
 * ```typescript
 * applyFilter('hello world', { operator: 'contains', value: 'hello' }) // true
 * applyFilter(10, { operator: 'greater_than', value: 5 }) // true
 * applyFilter('test', { operator: 'in', values: ['test', 'other'] }) // true
 * ```
 */
export function applyFilter(value: any, filter: FilterValue): boolean {
    if (!isValidFilter(filter)) return true
    
    const filterValue = filter.value
    const operator = filter.operator || 'contains'
    
    switch (operator) {
        case 'equals':
            return value === filterValue
        case 'not_equals':
            return value !== filterValue
        case 'contains':
            return String(value).toLowerCase().includes(String(filterValue).toLowerCase())
        case 'not_contains':
            return !String(value).toLowerCase().includes(String(filterValue).toLowerCase())
        case 'starts_with':
            return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase())
        case 'ends_with':
            return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase())
        case 'greater_than':
            return Number(value) > Number(filterValue)
        case 'less_than':
            return Number(value) < Number(filterValue)
        case 'greater_equal':
            return Number(value) >= Number(filterValue)
        case 'less_equal':
            return Number(value) <= Number(filterValue)
        case 'between':
            return Number(value) >= Number(filterValue) && Number(value) <= Number(filter.value2)
        case 'in':
            return filter.values?.includes(value) ?? false
        case 'not_in':
            return !filter.values?.includes(value) ?? true
        case 'is_null':
            return value === null || value === undefined
        case 'is_not_null':
            return value !== null && value !== undefined
        case 'is_empty':
            return value === '' || value === null || value === undefined
        case 'is_not_empty':
            return value !== '' && value !== null && value !== undefined
        default:
            return true
    }
}

/**
 * Applique plusieurs filtres à une ligne de données
 * 
 * Tous les filtres doivent correspondre pour que la ligne soit incluse (opérateur AND).
 * 
 * @param row - Ligne de données à filtrer
 * @param filters - Objet contenant les filtres par champ
 * @returns true si tous les filtres correspondent, false sinon
 * 
 * @example
 * ```typescript
 * applyFilters(
 *   { name: 'John', age: 30 },
 *   { name: { operator: 'contains', value: 'Jo' }, age: { operator: 'greater_than', value: 25 } }
 * ) // true
 * ```
 */
export function applyFilters(row: Record<string, any>, filters: Record<string, FilterValue>): boolean {
    return Object.entries(filters).every(([field, filter]) => {
        if (!isValidFilter(filter)) return true
        return applyFilter(row[field], filter)
    })
}

/**
 * Applique une recherche globale à une ligne de données
 * 
 * Recherche le terme dans toutes les valeurs de la ligne (insensible à la casse).
 * 
 * @param row - Ligne de données à rechercher
 * @param searchTerm - Terme de recherche
 * @returns true si le terme est trouvé dans au moins une valeur, false sinon
 * 
 * @example
 * ```typescript
 * applyGlobalSearch({ name: 'John', email: 'john@example.com' }, 'john') // true
 * applyGlobalSearch({ name: 'Jane', email: 'jane@example.com' }, 'john') // false
 * ```
 */
export function applyGlobalSearch(row: Record<string, any>, searchTerm: string): boolean {
    if (!searchTerm) return true
    
    const search = searchTerm.toLowerCase()
    return Object.values(row).some(value => 
        String(value).toLowerCase().includes(search)
    )
}

