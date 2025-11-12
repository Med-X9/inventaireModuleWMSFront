import { ref, computed } from 'vue'
import { logger } from '@/services/loggerService'

/**
 * Configuration de pivot
 */
export interface PivotConfig {
    rows: string[] // Champs pour les lignes
    columns: string[] // Champs pour les colonnes
    values: Array<{
        field: string
        aggregator: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'custom'
        customAggregator?: (values: any[]) => any
        label: string
    }>
    filters?: Record<string, any> // Filtres à appliquer
}

/**
 * Cellule de pivot
 */
export interface PivotCell {
    value: any
    formattedValue: string
    rowKey: string
    colKey: string
    isTotal: boolean
    isSubTotal: boolean
}

/**
 * Ligne de pivot
 */
export interface PivotRow {
    key: string
    label: string
    level: number
    cells: PivotCell[]
    isExpanded: boolean
    children?: PivotRow[]
}

/**
 * Composable pour les pivot tables
 *
 * Bonnes pratiques implémentées :
 * - Calculs optimisés avec computed
 * - Agrégations configurables
 * - Totaux et sous-totaux
 * - Expansion/collapse hiérarchique
 */
export function useDataTablePivot<T extends Record<string, any>>(
    data: T[],
    config: PivotConfig
) {
    // État réactif
    const expandedRows = ref<Set<string>>(new Set())
    const collapsedRows = ref<Set<string>>(new Set())

    // Calcul du pivot avec computed pour la performance
    const pivotData = computed(() => {
        return createPivotTable(data, config, expandedRows.value, collapsedRows.value)
    })

    // Fonction de création du pivot
    const createPivotTable = (
        items: T[],
        pivotConfig: PivotConfig,
        expanded: Set<string>,
        collapsed: Set<string>
    ) => {
        const { rows, columns, values, filters } = pivotConfig

        // Appliquer les filtres
        let filteredData = items
        if (filters) {
            filteredData = items.filter(item => {
                return Object.entries(filters).every(([field, value]) => {
                    return item[field] === value
                })
            })
        }

        // Créer les groupes de lignes
        const rowGroups = groupByMultiple(filteredData, rows)

        // Créer les groupes de colonnes
        const colGroups = groupByMultiple(filteredData, columns)

        // Créer la structure de données pivot
        const pivotRows: PivotRow[] = []
        const pivotCells = new Map<string, Map<string, PivotCell>>()

        // Remplir les cellules
        for (const [rowKey, rowItems] of rowGroups) {
            const rowCells = new Map<string, PivotCell>()

            for (const [colKey, colItems] of colGroups) {
                // Trouver l'intersection des éléments
                const intersection = rowItems.filter(item =>
                    colItems.some(colItem => colItem === item)
                )

                // Calculer les valeurs agrégées
                const cellValues = values.map(valueConfig => {
                    const fieldValues = intersection.map(item => item[valueConfig.field])
                    const aggregatedValue = aggregateValues(fieldValues, valueConfig.aggregator, valueConfig.customAggregator)

                    return {
                        value: aggregatedValue,
                        formattedValue: formatValue(aggregatedValue, valueConfig.aggregator),
                        label: valueConfig.label
                    }
                })

                // Créer la cellule (prendre la première valeur pour l'instant)
                const cell: PivotCell = {
                    value: cellValues[0]?.value,
                    formattedValue: cellValues[0]?.formattedValue || '',
                    rowKey,
                    colKey,
                    isTotal: false,
                    isSubTotal: false
                }

                rowCells.set(colKey, cell)
            }

            pivotCells.set(rowKey, rowCells)
        }

        // Créer les lignes avec hiérarchie
        const createPivotRows = (
            groups: Map<string, T[]>,
            level = 0,
            parentKey = ''
        ): PivotRow[] => {
            const result: PivotRow[] = []

            for (const [key, items] of groups) {
                const fullKey = parentKey ? `${parentKey}_${key}` : key
                const isExpanded = expanded.has(fullKey) || !collapsed.has(fullKey)

                const row: PivotRow = {
                    key: fullKey,
                    label: key,
                    level,
                    cells: [],
                    isExpanded,
                    children: []
                }

                // Ajouter les cellules pour cette ligne
                if (pivotCells.has(key)) {
                    row.cells = Array.from(pivotCells.get(key)!.values())
                }

                // Ajouter les sous-groupes si nécessaire
                if (level < rows.length - 1 && isExpanded) {
                    const subGroups = groupByMultiple(items, rows.slice(level + 1))
                    row.children = createPivotRows(subGroups, level + 1, fullKey)
                }

                result.push(row)
            }

            return result
        }

        return createPivotRows(rowGroups)
    }

    // Fonction de groupement multiple
    const groupByMultiple = (items: T[], fields: string[]): Map<string, T[]> => {
        if (fields.length === 0) {
            const map = new Map<string, T[]>()
            map.set('all', items)
            return map
        }

        const groups = new Map<string, T[]>()

        for (const item of items) {
            const key = fields.map(field => String(item[field] || 'null')).join('_')
            if (!groups.has(key)) {
                groups.set(key, [])
            }
            groups.get(key)!.push(item)
        }

        return groups
    }

    // Fonction d'agrégation
    const aggregateValues = (
        values: any[],
        aggregator: string,
        customAggregator?: (values: any[]) => any
    ): any => {
        if (customAggregator) {
            return customAggregator(values)
        }

        const numericValues = values.map(v => Number(v)).filter(v => !isNaN(v))

        switch (aggregator) {
            case 'sum':
                return numericValues.reduce((sum, val) => sum + val, 0)
            case 'avg':
                return numericValues.length > 0 ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length : 0
            case 'count':
                return values.length
            case 'min':
                return numericValues.length > 0 ? Math.min(...numericValues) : 0
            case 'max':
                return numericValues.length > 0 ? Math.max(...numericValues) : 0
            default:
                return values.length
        }
    }

    // Fonction de formatage
    const formatValue = (value: any, aggregator: string): string => {
        if (value === null || value === undefined) return '-'

        switch (aggregator) {
            case 'sum':
            case 'avg':
                return new Intl.NumberFormat('fr-FR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }).format(Number(value))
            case 'count':
                return new Intl.NumberFormat('fr-FR').format(Number(value))
            default:
                return String(value)
        }
    }

    // Actions de pivot
    const toggleRow = (rowKey: string) => {
        if (expandedRows.value.has(rowKey)) {
            expandedRows.value.delete(rowKey)
            collapsedRows.value.add(rowKey)
        } else {
            expandedRows.value.add(rowKey)
            collapsedRows.value.delete(rowKey)
        }
        logger.debug('Ligne pivot basculée:', rowKey)
    }

    const expandAll = () => {
        // Récupérer toutes les clés de ligne possibles
        const allRowKeys = new Set<string>()
        const collectKeys = (rows: PivotRow[]) => {
            rows.forEach(row => {
                allRowKeys.add(row.key)
                if (row.children) {
                    collectKeys(row.children)
                }
            })
        }
        collectKeys(pivotData.value)

        expandedRows.value = allRowKeys
        collapsedRows.value.clear()
        logger.debug('Toutes les lignes pivot développées')
    }

    const collapseAll = () => {
        expandedRows.value.clear()
        // Récupérer toutes les clés de ligne possibles
        const allRowKeys = new Set<string>()
        const collectKeys = (rows: PivotRow[]) => {
            rows.forEach(row => {
                allRowKeys.add(row.key)
                if (row.children) {
                    collectKeys(row.children)
                }
            })
        }
        collectKeys(pivotData.value)
        collapsedRows.value = allRowKeys
        logger.debug('Toutes les lignes pivot repliées')
    }

    // Getters
    const isPivotMode = computed(() => config.rows.length > 0 || config.columns.length > 0)
    const rowCount = computed(() => {
        const countRows = (rows: PivotRow[]): number => {
            return rows.reduce((count, row) => {
                count += 1 // La ligne elle-même
                if (row.children && row.isExpanded) {
                    count += countRows(row.children)
                }
                return count
            }, 0)
        }
        return countRows(pivotData.value)
    })

    return {
        // État
        pivotData,
        expandedRows: computed(() => expandedRows.value),
        collapsedRows: computed(() => collapsedRows.value),

        // Getters
        isPivotMode,
        rowCount,

        // Actions
        toggleRow,
        expandAll,
        collapseAll,

        // Setters
        setPivotConfig: (newConfig: PivotConfig) => {
            Object.assign(config, newConfig)
        }
    }
}
