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
     * Calcule la largeur optimale d'une colonne de manière intelligente
     *
     * Prend en compte :
     * - La longueur du headerName
     * - Le type de données et son contenu typique
     * - Les badges, cellRenderer personnalisés
     * - Les icônes et contrôles (tri, filtre)
     * - Les contraintes minWidth/maxWidth
     *
     * @param column - Configuration de la colonne
     * @param sampleData - Données d'échantillon pour analyser le contenu réel (optionnel)
     * @returns Largeur optimale en pixels
     */
    calculateOptimalColumnWidth(column: DataTableColumn, sampleData?: Record<string, unknown>[]): number {
        const headerText = column.headerName || column.field || ''

        // 1. Calculer la largeur du header
        // ~8-9px par caractère pour les polices standards, + padding
        const headerCharWidth = 9
        const headerPadding = 24 // padding left + right
        const headerWidth = headerText.length * headerCharWidth + headerPadding

        // 2. Largeur des contrôles (tri, filtre, icône)
        let controlsWidth = 0
        if (column.sortable !== false) controlsWidth += 24 // Bouton tri
        if (column.filterable !== false) controlsWidth += 24 // Bouton filtre
        if (column.icon) controlsWidth += 20 // Icône
        // Minimum pour les contrôles même si pas de tri/filtre
        if (controlsWidth === 0) controlsWidth = 16

        // 3. Largeur minimale selon le type de données
        let minWidth = 120
        switch (column.dataType) {
            case 'boolean':
                minWidth = 90 // Checkbox ou icône
                break
            case 'date':
                minWidth = 130 // Format date complet
                break
            case 'datetime':
                minWidth = 180 // Format datetime complet
                break
            case 'number':
                minWidth = 110 // Nombres avec séparateurs
                break
            case 'text':
                minWidth = 120 // Texte standard
                break
            case 'email':
                minWidth = 200 // Emails peuvent être longs
                break
            case 'url':
                minWidth = 200 // URLs peuvent être longues
                break
            default:
                minWidth = 120
        }

        // 4. Analyser le contenu réel si des données sont fournies
        let contentWidth = 0
        if (sampleData && sampleData.length > 0 && column.field) {
            // Échantillonner jusqu'à 20 lignes pour performance
            const sampleSize = Math.min(sampleData.length, 20)
            const sample = sampleData.slice(0, sampleSize)

            // Calculer la largeur moyenne du contenu
            const contentWidths: number[] = []

            sample.forEach(row => {
                const value = row[column.field]
                if (value !== null && value !== undefined) {
                    let valueStr = String(value)

                    // Si la colonne a un cellRenderer, estimer la largeur du badge/HTML
                    if (column.cellRenderer || column.badgeStyles) {
                        // Les badges ajoutent ~40-60px de padding
                        valueStr = valueStr + ' [BADGE]'
                    }

                    // Calculer la largeur approximative
                    const charWidth = column.dataType === 'number' ? 8 : 9
                    const valueWidth = valueStr.length * charWidth + 16 // padding
                    contentWidths.push(valueWidth)
                }
            })

            if (contentWidths.length > 0) {
                // Utiliser la moyenne + 20% de marge pour les valeurs exceptionnelles
                const avgContentWidth = contentWidths.reduce((a, b) => a + b, 0) / contentWidths.length
                const maxContentWidth = Math.max(...contentWidths)
                // Prendre la moyenne pondérée (70% moyenne, 30% max) pour éviter les colonnes trop larges
                contentWidth = avgContentWidth * 0.7 + maxContentWidth * 0.3
            }
        }

        // 5. Ajustements spéciaux
        // Colonnes avec badges nécessitent plus d'espace
        if (column.badgeStyles || column.cellRenderer) {
            minWidth = Math.max(minWidth, 140) // Minimum pour badges
            if (contentWidth > 0) {
                contentWidth += 40 // Espace supplémentaire pour badges
            }
        }

        // Colonnes avec flex ne doivent pas avoir de width fixe trop grande
        if (column.flex) {
            minWidth = Math.min(minWidth, 200) // Limiter pour les colonnes flex
        }

        // 6. Calculer la largeur optimale
        // Prendre le maximum entre : header + contrôles, contenu réel, largeur minimale
        let optimalWidth = Math.max(
            headerWidth + controlsWidth,
            contentWidth,
            minWidth
        )

        // 7. Appliquer les contraintes minWidth/maxWidth
        if (column.minWidth) {
            optimalWidth = Math.max(optimalWidth, column.minWidth)
        }
        if (column.maxWidth) {
            optimalWidth = Math.min(optimalWidth, column.maxWidth)
        }

        // 8. Limite globale raisonnable (éviter les colonnes trop larges)
        const maxReasonableWidth = column.maxWidth || 600
        optimalWidth = Math.min(optimalWidth, maxReasonableWidth)

        // 9. Arrondir à un multiple de 5 pour un rendu plus propre
        optimalWidth = Math.ceil(optimalWidth / 5) * 5

        logger.debug(`Calcul de largeur optimale pour "${column.field}": ${optimalWidth}px`, {
            headerWidth,
            controlsWidth,
            contentWidth,
            minWidth,
            dataType: column.dataType,
            hasBadge: !!column.badgeStyles,
            hasCellRenderer: !!column.cellRenderer
        })

        return optimalWidth
    }

    /**
     * Valide la configuration d'une colonne
     * Single Responsibility: Seulement la validation
     *
     * Détecte les problèmes courants :
     * - Champs obligatoires manquants
     * - Conflits entre width et flex
     * - Largeurs invalides
     * - Types de données incohérents
     */
    validateColumnConfig(column: DataTableColumn): { isValid: boolean; errors: string[]; warnings: string[] } {
        const errors: string[] = []
        const warnings: string[] = []

        // Erreurs critiques
        if (!column.field) {
            errors.push('Le champ "field" est obligatoire')
        }

        // Warnings (non bloquants)
        if (!column.headerName) {
            warnings.push(`Colonne "${column.field}" : "headerName" manquant, utilisation de "field" comme fallback`)
        }

        // Validation des largeurs
        if (column.width !== undefined) {
            if (column.width < 50) {
                errors.push(`Largeur trop petite (${column.width}px) : minimum 50px`)
            }
            if (column.width > 2000) {
                errors.push(`Largeur trop grande (${column.width}px) : maximum 2000px`)
            }
        }

        if (column.minWidth !== undefined) {
            if (column.minWidth < 50) {
                errors.push(`minWidth trop petit (${column.minWidth}px) : minimum 50px`)
            }
            if (column.width && column.minWidth > column.width) {
                errors.push(`minWidth (${column.minWidth}px) ne peut pas être supérieur à width (${column.width}px)`)
            }
        }

        if (column.maxWidth !== undefined) {
            if (column.maxWidth < 50) {
                errors.push(`maxWidth trop petit (${column.maxWidth}px) : minimum 50px`)
            }
            if (column.width && column.maxWidth < column.width) {
                errors.push(`maxWidth (${column.maxWidth}px) ne peut pas être inférieur à width (${column.width}px)`)
            }
            if (column.minWidth && column.maxWidth < column.minWidth) {
                errors.push(`maxWidth (${column.maxWidth}px) ne peut pas être inférieur à minWidth (${column.minWidth}px)`)
            }
        }

        // Conflit width/flex
        if (column.width && column.flex) {
            warnings.push(`Colonne "${column.field}" : width et flex sont définis simultanément. flex sera prioritaire.`)
        }

        // Validation du type de données
        if (column.dataType && !['text', 'number', 'date', 'datetime', 'boolean', 'select', 'email', 'url', 'phone', 'currency', 'percentage', 'file', 'image', 'color', 'json', 'array', 'object', 'textarea'].includes(column.dataType)) {
            warnings.push(`Type de données "${column.dataType}" non reconnu pour la colonne "${column.field}"`)
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
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

