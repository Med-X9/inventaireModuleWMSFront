/**
 * Utilitaires pour le filtrage (DRY - Don't Repeat Yourself)
 * Centralise toute la logique de filtrage réutilisable
 */

import type { FilterOperator } from '../types/dataTable'

export interface FilterValue {
    operator: FilterOperator
    value?: any
    value2?: any
    values?: any[]
}

/**
 * Valide un filtre
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
 * Applique un filtre à une valeur
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
 */
export function applyFilters(row: Record<string, any>, filters: Record<string, FilterValue>): boolean {
    return Object.entries(filters).every(([field, filter]) => {
        if (!isValidFilter(filter)) return true
        return applyFilter(row[field], filter)
    })
}

/**
 * Applique une recherche globale à une ligne
 */
export function applyGlobalSearch(row: Record<string, any>, searchTerm: string): boolean {
    if (!searchTerm) return true
    
    const search = searchTerm.toLowerCase()
    return Object.values(row).some(value => 
        String(value).toLowerCase().includes(search)
    )
}

