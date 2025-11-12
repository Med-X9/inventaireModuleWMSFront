/**
 * Service centralisé pour la logique DataTable
 * Respecte les principes SOLID en séparant les responsabilités
 */
import type { DataTableColumn, DataTableProps, FilterConfig } from '@/types/dataTable'
import type { FilterOperator } from '@/types/ColumnDefinition'
import { logger } from './loggerService'

export class DataTableService {
    private static instance: DataTableService

    private constructor() {}

    static getInstance(): DataTableService {
        if (!DataTableService.instance) {
            DataTableService.instance = new DataTableService()
        }
        return DataTableService.instance
    }

    /**
     * Calcule la largeur optimale d'une colonne
     * Single Responsibility: Seulement la logique de calcul de largeur
     */
    calculateOptimalColumnWidth(column: DataTableColumn): number {
        const headerText = column.headerName || column.field || ''
        const headerWidth = headerText.length * 10 // ~10px par caractère
        const controlsWidth = 80

        // Largeur minimale selon le type de données
        let minWidth = 120
        if (column.dataType === 'boolean') minWidth = 80
        else if (column.dataType === 'date' || column.dataType === 'datetime') minWidth = 120
        else if (column.dataType === 'number') minWidth = 100

        const maxWidth = 500
        const optimalWidth = Math.max(minWidth, Math.min(maxWidth, headerWidth + controlsWidth))

        logger.debug(`Calcul de largeur optimale pour "${column.field}": ${optimalWidth}px`)
        return optimalWidth
    }

    /**
     * Valide la configuration d'une colonne
     * Single Responsibility: Seulement la validation
     */
    validateColumnConfig(column: DataTableColumn): { isValid: boolean; errors: string[] } {
        const errors: string[] = []

        if (!column.field) {
            errors.push('Le champ "field" est obligatoire')
        }

        if (!column.headerName) {
            errors.push('Le champ "headerName" est obligatoire')
        }

        if (column.width && (column.width < 50 || column.width > 1000)) {
            errors.push('La largeur doit être entre 50 et 1000 pixels')
        }

        return {
            isValid: errors.length === 0,
            errors
        }
    }

    /**
     * Transforme les filtres frontend en filtres backend
     * Single Responsibility: Seulement la transformation de filtres
     */
    transformFiltersForBackend(filters: Record<string, FilterConfig>): Record<string, any> {
        const backendFilters: Record<string, any> = {}

        Object.entries(filters).forEach(([field, filter]) => {
            if (!filter || !filter.operator) return

            switch (filter.operator) {
                case 'equals':
                    backendFilters[`${field}_exact`] = filter.value
                    break
                case 'contains':
                    backendFilters[`${field}_icontains`] = filter.value
                    break
                case 'starts_with':
                    backendFilters[`${field}_istartswith`] = filter.value
                    break
                case 'ends_with':
                    backendFilters[`${field}_iendswith`] = filter.value
                    break
                case 'greater_than':
                    backendFilters[`${field}_gt`] = filter.value
                    break
                case 'less_than':
                    backendFilters[`${field}_lt`] = filter.value
                    break
                case 'greater_equal':
                    backendFilters[`${field}_gte`] = filter.value
                    break
                case 'less_equal':
                    backendFilters[`${field}_lte`] = filter.value
                    break
                case 'between':
                    if (filter.value && filter.value2) {
                        backendFilters[`${field}_range`] = `${filter.value},${filter.value2}`
                    }
                    break
                case 'not_equals':
                    backendFilters[`${field}_exact`] = filter.value
                    backendFilters[`${field}_exclude`] = true
                    break
                case 'is_null':
                    backendFilters[`${field}_isnull`] = true
                    break
                case 'is_not_null':
                    backendFilters[`${field}_isnull`] = false
                    break
                default:
                    // Fallback vers exact match
                    backendFilters[`${field}_exact`] = filter.value
                    break
            }
        })

        logger.debug('Filtres transformés pour backend:', backendFilters)
        return backendFilters
    }

    /**
     * Formate les paramètres de requête pour l'API
     * Single Responsibility: Seulement le formatage des paramètres
     */
    formatApiParams(params: {
        page?: number
        pageSize?: number
        sort?: Array<{ field: string; direction: 'asc' | 'desc' }>
        filter?: Record<string, any>
        globalSearch?: string
    }): Record<string, any> {
        const apiParams: Record<string, any> = {
            page: params.page || 1,
            page_size: params.pageSize || 10
        }

        // Ajouter le tri
        if (params.sort && params.sort.length > 0) {
            const sortFields = params.sort.map(sort =>
                sort.direction === 'desc' ? `-${sort.field}` : sort.field
            )
            apiParams.ordering = sortFields.join(',')
        }

        // Ajouter les filtres
        if (params.filter) {
            const backendFilters = this.transformFiltersForBackend(params.filter)
            Object.assign(apiParams, backendFilters)
        }

        // Ajouter la recherche globale
        if (params.globalSearch) {
            apiParams.search = params.globalSearch
        }

        return apiParams
    }

    /**
     * Génère les options d'opérateurs selon le type de données
     * Single Responsibility: Seulement la génération d'options
     */
    getOperatorsForDataType(dataType: string): Array<{ value: string; label: string }> {
        const operatorsMap: Record<string, Array<{ value: string; label: string }>> = {
            text: [
                { value: 'equals', label: 'Égal à' },
                { value: 'contains', label: 'Contient' },
                { value: 'starts_with', label: 'Commence par' },
                { value: 'ends_with', label: 'Termine par' },
                { value: 'is_null', label: 'Est null' },
                { value: 'is_not_null', label: 'N\'est pas null' }
            ],
            number: [
                { value: 'equals', label: 'Égal à' },
                { value: 'greater_than', label: 'Supérieur à' },
                { value: 'less_than', label: 'Inférieur à' },
                { value: 'between', label: 'Entre' },
                { value: 'is_null', label: 'Est null' },
                { value: 'is_not_null', label: 'N\'est pas null' }
            ],
            date: [
                { value: 'equals', label: 'Égal à' },
                { value: 'greater_than', label: 'Après' },
                { value: 'less_than', label: 'Avant' },
                { value: 'between', label: 'Entre' },
                { value: 'is_null', label: 'Est null' },
                { value: 'is_not_null', label: 'N\'est pas null' }
            ],
            boolean: [
                { value: 'equals', label: 'Égal à' },
                { value: 'is_null', label: 'Est null' },
                { value: 'is_not_null', label: 'N\'est pas null' }
            ]
        }

        return operatorsMap[dataType] || operatorsMap.text
    }

    /**
     * Valide les paramètres de pagination
     * Single Responsibility: Seulement la validation de pagination
     */
    validatePaginationParams(page: number, pageSize: number): { isValid: boolean; errors: string[] } {
        const errors: string[] = []

        if (page < 1) {
            errors.push('Le numéro de page doit être supérieur à 0')
        }

        if (pageSize < 1 || pageSize > 1000) {
            errors.push('La taille de page doit être entre 1 et 1000')
        }

        return {
            isValid: errors.length === 0,
            errors
        }
    }
}

// Instance singleton
export const dataTableService = DataTableService.getInstance()

