import { ref, computed, watch } from 'vue'
import { logger } from '@/services/loggerService'

/**
 * Configuration de groupement
 */
export interface GroupingConfig {
    field: string
    label: string
    sortable?: boolean
    collapsible?: boolean
    aggregator?: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'custom'
    customAggregator?: (items: any[]) => any
}

/**
 * Groupe de données
 */
export interface DataGroup {
    key: string
    label: string
    items: any[]
    level: number
    isExpanded: boolean
    aggregatedValue?: any
    children?: DataGroup[]
}

/**
 * État du groupement
 */
export interface GroupingState {
    groups: DataGroup[]
    expandedGroups: Set<string>
    collapsedGroups: Set<string>
    groupingConfigs: GroupingConfig[]
}

/**
 * Composable pour le groupement de lignes
 *
 * Bonnes pratiques implémentées :
 * - Groupement hiérarchique
 * - Agrégations configurables
 * - État persistant des groupes
 * - Performance avec computed
 */
export function useDataTableGrouping<T extends Record<string, any>>(
    data: T[],
    groupingConfigs: GroupingConfig[] = []
) {
    // État réactif
    const expandedGroups = ref<Set<string>>(new Set())
    const collapsedGroups = ref<Set<string>>(new Set())
    const activeGroupings = ref<GroupingConfig[]>(groupingConfigs)

    // Calcul des groupes avec computed pour la performance
    const groupedData = computed(() => {
        if (activeGroupings.value.length === 0) {
            return data.map(item => ({ ...item, _isGroupRow: false }))
        }

        return createGroups(data, activeGroupings.value, expandedGroups.value, collapsedGroups.value)
    })

    // Fonction de création des groupes
    const createGroups = (
        items: T[],
        configs: GroupingConfig[],
        expanded: Set<string>,
        collapsed: Set<string>
    ): any[] => {
        if (configs.length === 0) return items

        const groups = groupBy(items, configs[0].field, configs[0])
        const result: any[] = []

        for (const [key, groupItems] of groups) {
            const groupKey = `${configs[0].field}_${key}`
            const isExpanded = expanded.has(groupKey) || !collapsed.has(groupKey)

            // Créer l'en-tête de groupe
            const groupHeader = createGroupHeader(key, groupItems, configs[0], 0, groupKey, isExpanded)
            result.push(groupHeader)

            if (isExpanded) {
                // Récursion pour les sous-groupes
                if (configs.length > 1) {
                    const subGroups = createGroups(groupItems, configs.slice(1), expanded, collapsed)
                    result.push(...subGroups)
                } else {
                    // Ajouter les éléments du groupe
                    result.push(...groupItems.map(item => ({ ...item, _isGroupRow: false })))
                }
            }
        }

        return result
    }

    // Fonction de groupement par champ
    const groupBy = (items: T[], field: string, config: GroupingConfig): Map<string, T[]> => {
        const groups = new Map<string, T[]>()

        for (const item of items) {
            const key = String(item[field] || 'null')
            if (!groups.has(key)) {
                groups.set(key, [])
            }
            groups.get(key)!.push(item)
        }

        return groups
    }

    // Création de l'en-tête de groupe
    const createGroupHeader = (
        key: string,
        items: T[],
        config: GroupingConfig,
        level: number,
        groupKey: string,
        isExpanded: boolean
    ) => {
        const aggregatedValue = calculateAggregation(items, config)

        return {
            _isGroupRow: true,
            _groupKey: groupKey,
            _groupLevel: level,
            _groupField: config.field,
            _groupLabel: config.label,
            _groupItems: items,
            _groupCount: items.length,
            _groupAggregatedValue: aggregatedValue,
            _isExpanded: isExpanded,
            [config.field]: key,
            label: `${config.label}: ${key} (${items.length})`
        }
    }

    // Calcul des agrégations
    const calculateAggregation = (items: T[], config: GroupingConfig): any => {
        if (config.customAggregator) {
            return config.customAggregator(items)
        }

        switch (config.aggregator) {
            case 'count':
                return items.length
            case 'sum':
                return items.reduce((sum, item) => sum + (Number(item[config.field]) || 0), 0)
            case 'avg':
                const sum = items.reduce((sum, item) => sum + (Number(item[config.field]) || 0), 0)
                return items.length > 0 ? sum / items.length : 0
            case 'min':
                return Math.min(...items.map(item => Number(item[config.field]) || 0))
            case 'max':
                return Math.max(...items.map(item => Number(item[config.field]) || 0))
            default:
                return items.length
        }
    }

    // Actions de groupement
    const addGrouping = (config: GroupingConfig) => {
        const existingIndex = activeGroupings.value.findIndex(g => g.field === config.field)
        if (existingIndex === -1) {
            activeGroupings.value.push(config)
            logger.debug('Groupement ajouté:', config)
        }
    }

    const removeGrouping = (field: string) => {
        const index = activeGroupings.value.findIndex(g => g.field === field)
        if (index !== -1) {
            activeGroupings.value.splice(index, 1)
            logger.debug('Groupement supprimé:', field)
        }
    }

    const clearGroupings = () => {
        activeGroupings.value = []
        expandedGroups.value.clear()
        collapsedGroups.value.clear()
        logger.debug('Tous les groupements supprimés')
    }

    // Actions d'expansion/collapse
    const toggleGroup = (groupKey: string) => {
        if (expandedGroups.value.has(groupKey)) {
            expandedGroups.value.delete(groupKey)
            collapsedGroups.value.add(groupKey)
        } else {
            expandedGroups.value.add(groupKey)
            collapsedGroups.value.delete(groupKey)
        }
        logger.debug('Groupe basculé:', groupKey)
    }

    const expandAll = () => {
        // Récupérer toutes les clés de groupe possibles
        const allGroupKeys = new Set<string>()
        activeGroupings.value.forEach(config => {
            const uniqueValues = [...new Set(data.map(item => String(item[config.field] || 'null')))]
            uniqueValues.forEach(value => {
                allGroupKeys.add(`${config.field}_${value}`)
            })
        })

        expandedGroups.value = allGroupKeys
        collapsedGroups.value.clear()
        logger.debug('Tous les groupes développés')
    }

    const collapseAll = () => {
        expandedGroups.value.clear()
        // Récupérer toutes les clés de groupe possibles
        const allGroupKeys = new Set<string>()
        activeGroupings.value.forEach(config => {
            const uniqueValues = [...new Set(data.map(item => String(item[config.field] || 'null')))]
            uniqueValues.forEach(value => {
                allGroupKeys.add(`${config.field}_${value}`)
            })
        })
        collapsedGroups.value = allGroupKeys
        logger.debug('Tous les groupes repliés')
    }

    // Getters
    const isGrouped = computed(() => activeGroupings.value.length > 0)
    const groupCount = computed(() => activeGroupings.value.length)
    const expandedCount = computed(() => expandedGroups.value.size)
    const collapsedCount = computed(() => collapsedGroups.value.size)

    return {
        // État
        groupedData,
        activeGroupings: computed(() => activeGroupings.value),
        expandedGroups: computed(() => expandedGroups.value),
        collapsedGroups: computed(() => collapsedGroups.value),

        // Getters
        isGrouped,
        groupCount,
        expandedCount,
        collapsedCount,

        // Actions
        addGrouping,
        removeGrouping,
        clearGroupings,
        toggleGroup,
        expandAll,
        collapseAll,

        // Setters
        setGroupingConfigs: (configs: GroupingConfig[]) => {
            activeGroupings.value = configs
        }
    }
}
