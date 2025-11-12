import { ref, computed } from 'vue'
import { logger } from '@/services/loggerService'

export interface SortConfig {
    field: string
    direction: 'asc' | 'desc'
    priority: number // Pour l'ordre des tris multiples
}

export interface SortState {
    activeSorts: SortConfig[]
    defaultSort?: SortConfig
}

/**
 * Composable pour la gestion du tri multi-colonnes
 * Supporte le tri simple et multiple avec priorité
 */
export function useSorting(defaultSort?: SortConfig) {
    const state = ref<SortState>({
        activeSorts: [],
        defaultSort
    })

    /**
     * Ajoute ou met à jour un tri
     */
    const setSort = (field: string, direction: 'asc' | 'desc' = 'asc') => {
        // Supprimer le tri existant pour ce champ
        state.value.activeSorts = state.value.activeSorts.filter(sort => sort.field !== field)

        // Ajouter le nouveau tri
        const newSort: SortConfig = {
            field,
            direction,
            priority: state.value.activeSorts.length
        }

        state.value.activeSorts.push(newSort)
        logger.debug('Tri ajouté/mis à jour', { field, direction })
    }

    /**
     * Supprime un tri
     */
    const removeSort = (field: string) => {
        state.value.activeSorts = state.value.activeSorts.filter(sort => sort.field !== field)
        // Réorganiser les priorités
        state.value.activeSorts.forEach((sort, index) => {
            sort.priority = index
        })
        logger.debug('Tri supprimé', { field })
    }

    /**
     * Supprime tous les tris
     */
    const clearAllSorts = () => {
        state.value.activeSorts = []
        logger.debug('Tous les tris supprimés')
    }

    /**
     * Inverse la direction d'un tri
     */
    const toggleSort = (field: string) => {
        const existingSort = state.value.activeSorts.find(sort => sort.field === field)
        if (existingSort) {
            existingSort.direction = existingSort.direction === 'asc' ? 'desc' : 'asc'
            logger.debug('Direction du tri inversée', { field, direction: existingSort.direction })
        } else {
            setSort(field, 'asc')
        }
    }

    /**
     * Change la priorité d'un tri
     */
    const changeSortPriority = (field: string, newPriority: number) => {
        const sortIndex = state.value.activeSorts.findIndex(sort => sort.field === field)
        if (sortIndex !== -1) {
            const sort = state.value.activeSorts[sortIndex]
            state.value.activeSorts.splice(sortIndex, 1)
            sort.priority = newPriority
            state.value.activeSorts.splice(newPriority, 0, sort)

            // Réorganiser les priorités
            state.value.activeSorts.forEach((s, index) => {
                s.priority = index
            })

            logger.debug('Priorité du tri changée', { field, newPriority })
        }
    }

    /**
     * Obtient le tri actif pour un champ
     */
    const getSort = (field: string): SortConfig | undefined => {
        return state.value.activeSorts.find(sort => sort.field === field)
    }

    /**
     * Obtient tous les tris actifs
     */
    const getActiveSorts = computed(() => {
        return [...state.value.activeSorts].sort((a, b) => a.priority - b.priority)
    })

    /**
     * Compte le nombre de tris actifs
     */
    const getSortCount = computed(() => {
        return state.value.activeSorts.length
    })

    /**
     * Vérifie s'il y a des tris actifs
     */
    const hasActiveSorts = computed(() => {
        return getSortCount.value > 0
    })

    /**
     * Vérifie si un champ est trié
     */
    const isFieldSorted = (field: string): boolean => {
        return state.value.activeSorts.some(sort => sort.field === field)
    }

    /**
     * Obtient la direction du tri pour un champ
     */
    const getSortDirection = (field: string): 'asc' | 'desc' | null => {
        const sort = getSort(field)
        return sort ? sort.direction : null
    }

    /**
     * Exporte les tris pour l'API
     */
    const exportSortsForAPI = (): string => {
        if (state.value.activeSorts.length === 0) {
            return ''
        }

        const sortStrings = state.value.activeSorts
            .sort((a, b) => a.priority - b.priority)
            .map(sort => {
                const prefix = sort.direction === 'desc' ? '-' : ''
                return `${prefix}${sort.field}`
            })

        return sortStrings.join(',')
    }

    /**
     * Importe les tris depuis l'API
     */
    const importSortsFromAPI = (sortString: string) => {
        state.value.activeSorts = []

        if (!sortString) return

        const sortFields = sortString.split(',')
        sortFields.forEach((field, index) => {
            const direction = field.startsWith('-') ? 'desc' : 'asc'
            const cleanField = field.startsWith('-') ? field.substring(1) : field

            state.value.activeSorts.push({
                field: cleanField,
                direction,
                priority: index
            })
        })

        logger.debug('Tris importés depuis API', sortString)
    }

    /**
     * Applique le tri par défaut
     */
    const applyDefaultSort = () => {
        if (state.value.defaultSort && state.value.activeSorts.length === 0) {
            setSort(state.value.defaultSort.field, state.value.defaultSort.direction)
        }
    }

    /**
     * Trie les données selon les tris actifs
     */
    const sortData = <T>(data: T[]): T[] => {
        if (state.value.activeSorts.length === 0) {
            return data
        }

        return [...data].sort((a, b) => {
            for (const sort of state.value.activeSorts.sort((a, b) => a.priority - b.priority)) {
                const aValue = (a as any)[sort.field]
                const bValue = (b as any)[sort.field]

                // Gestion des valeurs null/undefined
                if (aValue === null || aValue === undefined) return 1
                if (bValue === null || bValue === undefined) return -1

                let comparison = 0

                // Comparaison selon le type de données
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    comparison = aValue.localeCompare(bValue, 'fr', { numeric: true })
                } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                    comparison = aValue - bValue
                } else if (aValue instanceof Date && bValue instanceof Date) {
                    comparison = aValue.getTime() - bValue.getTime()
                } else {
                    comparison = String(aValue).localeCompare(String(bValue), 'fr', { numeric: true })
                }

                if (comparison !== 0) {
                    return sort.direction === 'desc' ? -comparison : comparison
                }
            }

            return 0
        })
    }

    return {
        // État
        state: computed(() => state.value),

        // Getters
        getActiveSorts,
        getSortCount,
        hasActiveSorts,

        // Méthodes
        setSort,
        removeSort,
        clearAllSorts,
        toggleSort,
        changeSortPriority,
        getSort,
        isFieldSorted,
        getSortDirection,
        exportSortsForAPI,
        importSortsFromAPI,
        applyDefaultSort,
        sortData
    }
}
