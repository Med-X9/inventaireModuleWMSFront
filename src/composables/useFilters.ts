import { ref, computed, watch } from 'vue'
import { logger } from '@/services/loggerService'

export interface FilterConfig {
    field: string
    operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in' | 'is_null' | 'is_not_null'
    value?: any
    value2?: any // Pour les filtres 'between'
    values?: any[] // Pour les filtres 'in' et 'not_in'
    dataType: 'text' | 'number' | 'date' | 'boolean' | 'select'
}

export interface FilterState {
    activeFilters: Map<string, FilterConfig>
    globalSearch: string
    debounceTimer: NodeJS.Timeout | null
}

/**
 * Composable pour la gestion des filtres multi-critères
 * Supporte les filtres par colonne et la recherche globale
 */
export function useFilters() {
    const state = ref<FilterState>({
        activeFilters: new Map(),
        globalSearch: '',
        debounceTimer: null
    })

    /**
     * Ajoute ou met à jour un filtre
     */
    const setFilter = (field: string, config: FilterConfig) => {
        state.value.activeFilters.set(field, config)
        logger.debug('Filtre ajouté/mis à jour', { field, config })
    }

    /**
     * Supprime un filtre
     */
    const removeFilter = (field: string) => {
        state.value.activeFilters.delete(field)
        logger.debug('Filtre supprimé', { field })
    }

    /**
     * Supprime tous les filtres
     */
    const clearAllFilters = () => {
        state.value.activeFilters.clear()
        state.value.globalSearch = ''
        logger.debug('Tous les filtres supprimés')
    }

    /**
     * Met à jour la recherche globale
     */
    const setGlobalSearch = (searchTerm: string) => {
        state.value.globalSearch = searchTerm
        logger.debug('Recherche globale mise à jour', { searchTerm })
    }

    /**
     * Applique les filtres avec debounce
     */
    const applyFilters = (callback: (filters: Map<string, FilterConfig>, globalSearch: string) => void, delay: number = 300) => {
        if (state.value.debounceTimer) {
            clearTimeout(state.value.debounceTimer)
        }

        state.value.debounceTimer = setTimeout(() => {
            callback(state.value.activeFilters, state.value.globalSearch)
        }, delay)
    }

    /**
     * Vérifie si un champ a un filtre actif
     */
    const hasFilter = (field: string): boolean => {
        return state.value.activeFilters.has(field)
    }

    /**
     * Obtient le filtre actif pour un champ
     */
    const getFilter = (field: string): FilterConfig | undefined => {
        return state.value.activeFilters.get(field)
    }

    /**
     * Obtient tous les filtres actifs
     */
    const getActiveFilters = computed(() => {
        return state.value.activeFilters
    })

    /**
     * Obtient la recherche globale
     */
    const getGlobalSearch = computed(() => {
        return state.value.globalSearch
    })

    /**
     * Compte le nombre de filtres actifs
     */
    const getFilterCount = computed(() => {
        return state.value.activeFilters.size + (state.value.globalSearch ? 1 : 0)
    })

    /**
     * Vérifie s'il y a des filtres actifs
     */
    const hasActiveFilters = computed(() => {
        return getFilterCount.value > 0
    })

    /**
     * Exporte les filtres pour l'API
     */
    const exportFiltersForAPI = () => {
        const apiFilters: Record<string, any> = {}

        // Traiter les filtres par colonne
        state.value.activeFilters.forEach((config, field) => {
            switch (config.operator) {
                case 'equals':
                    apiFilters[`${field}_exact`] = config.value
                    break
                case 'contains':
                    apiFilters[`${field}_icontains`] = config.value
                    break
                case 'starts_with':
                    apiFilters[`${field}_istartswith`] = config.value
                    break
                case 'ends_with':
                    apiFilters[`${field}_iendswith`] = config.value
                    break
                case 'greater_than':
                    apiFilters[`${field}_gt`] = config.value
                    break
                case 'less_than':
                    apiFilters[`${field}_lt`] = config.value
                    break
                case 'between':
                    if (config.value && config.value2) {
                        apiFilters[`${field}_range`] = `${config.value},${config.value2}`
                    }
                    break
                case 'in':
                    if (config.values && config.values.length > 0) {
                        apiFilters[`${field}_in`] = config.values.join(',')
                    }
                    break
                case 'not_in':
                    if (config.values && config.values.length > 0) {
                        apiFilters[`${field}_not_in`] = config.values.join(',')
                    }
                    break
                case 'is_null':
                    apiFilters[`${field}_isnull`] = true
                    break
                case 'is_not_null':
                    apiFilters[`${field}_isnull`] = false
                    break
            }
        })

        // Ajouter la recherche globale
        if (state.value.globalSearch) {
            apiFilters.search = state.value.globalSearch
        }

        return apiFilters
    }

    /**
     * Importe les filtres depuis l'API
     */
    const importFiltersFromAPI = (apiFilters: Record<string, any>) => {
        state.value.activeFilters.clear()

        Object.entries(apiFilters).forEach(([key, value]) => {
            if (key === 'search') {
                state.value.globalSearch = value
                return
            }

            // Parser les filtres API
            const field = key.replace(/_exact$|_icontains$|_istartswith$|_iendswith$|_gt$|_lt$|_range$|_in$|_not_in$|_isnull$/, '')
            const operator = key.replace(field + '_', '')

            let config: FilterConfig = {
                field,
                operator: 'equals',
                dataType: 'text'
            }

            switch (operator) {
                case 'exact':
                    config.operator = 'equals'
                    config.value = value
                    break
                case 'icontains':
                    config.operator = 'contains'
                    config.value = value
                    break
                case 'istartswith':
                    config.operator = 'starts_with'
                    config.value = value
                    break
                case 'iendswith':
                    config.operator = 'ends_with'
                    config.value = value
                    break
                case 'gt':
                    config.operator = 'greater_than'
                    config.value = value
                    config.dataType = 'number'
                    break
                case 'lt':
                    config.operator = 'less_than'
                    config.value = value
                    config.dataType = 'number'
                    break
                case 'range':
                    config.operator = 'between'
                    const [value1, value2] = value.split(',')
                    config.value = value1
                    config.value2 = value2
                    config.dataType = 'number'
                    break
                case 'in':
                    config.operator = 'in'
                    config.values = value.split(',')
                    break
                case 'not_in':
                    config.operator = 'not_in'
                    config.values = value.split(',')
                    break
                case 'isnull':
                    config.operator = value ? 'is_null' : 'is_not_null'
                    break
            }

            state.value.activeFilters.set(field, config)
        })

        logger.debug('Filtres importés depuis API', apiFilters)
    }

    return {
        // État
        state: computed(() => state.value),

        // Getters
        getActiveFilters,
        getGlobalSearch,
        getFilterCount,
        hasActiveFilters,

        // Méthodes
        setFilter,
        removeFilter,
        clearAllFilters,
        setGlobalSearch,
        applyFilters,
        hasFilter,
        getFilter,
        exportFiltersForAPI,
        importFiltersFromAPI
    }
}
