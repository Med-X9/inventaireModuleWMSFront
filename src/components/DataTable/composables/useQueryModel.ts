/**
 * Composable pour la gestion du QueryModel
 *
 * Centralise la logique QueryModel et fournit une interface unifiée
 * pour tous les événements du DataTable
 */

import { ref, computed, watch, type Ref } from 'vue'
import type { QueryModel, SortModel, FilterModel } from '../types/QueryModel'
import {
  createEmptyQueryModel,
  updatePagination,
  updateSort,
  removeSort,
  updateFilter,
  removeFilter,
  updateSearch,
  updateCustomParams,
  cleanQueryModel,
  cloneQueryModel
} from '../utils/queryModelHelpers'

export interface UseQueryModelConfig {
  /** Colonnes pour validation */
  columns?: any[]
  /** QueryModel initial */
  initialQueryModel?: Partial<QueryModel>
  /** Délai de debounce pour les updates */
  debounceDelay?: number
  /** Callback appelé quand QueryModel change */
  onChange?: (queryModel: QueryModel) => void
}

export interface QueryModelActions {
  /** Met à jour la pagination */
  updatePagination: (page: number, pageSize: number) => void
  /** Met à jour le tri */
  updateSort: (sortModel: SortModel[]) => void
  /** Met à jour les filtres */
  updateFilters: (filterModel: FilterModel[]) => void
  /** Met à jour la recherche */
  updateSearch: (search: string | undefined) => void
  /** Met à jour les paramètres personnalisés */
  updateCustomParams: (params: Record<string, any>) => void
  /** Reset complet du QueryModel */
  reset: () => void
  /** Applique un QueryModel partiel */
  applyPartial: (partial: Partial<QueryModel>) => void
}

export interface QueryModelComputed {
  /** QueryModel actuel (reactive) */
  queryModel: Ref<QueryModel>
  /** True si QueryModel a des filtres actifs */
  hasActiveFilters: Ref<boolean>
  /** True si recherche active */
  hasActiveSearch: Ref<boolean>
  /** True si tri actif */
  hasActiveSort: Ref<boolean>
  /** Nombre de filtres actifs */
  activeFiltersCount: Ref<number>
}

/**
 * Type de retour du composable useQueryModel
 */
export interface UseQueryModelReturn extends QueryModelComputed, QueryModelActions {}

/**
 * Composable principal pour QueryModel
 */
export function useQueryModel(config: UseQueryModelConfig = {}) {
  const {
    columns = [],
    initialQueryModel = {},
    debounceDelay = 300,
    onChange
  } = config

  // État principal
  const queryModel = ref<QueryModel>({
    ...createEmptyQueryModel(),
    ...initialQueryModel
  })

  // Timer pour debounce
  let debounceTimer: NodeJS.Timeout | null = null

  // Computed properties
  const hasActiveFilters = computed(() =>
    queryModel.value.filters?.length > 0
  )

  const hasActiveSearch = computed(() =>
    !!(queryModel.value.search && queryModel.value.search.trim())
  )

  const hasActiveSort = computed(() =>
    (queryModel.value.sort?.length || 0) > 0
  )

  const activeFiltersCount = computed(() =>
    queryModel.value.filters?.length || 0
  )

  // Actions
  const updatePaginationAction = (page: number, pageSize: number) => {
    const newQueryModel = updatePagination(queryModel.value, page, pageSize)
    applyQueryModelChange(newQueryModel)
  }

  const updateSortAction = (sortModel: SortModel[]) => {
    let newQueryModel: QueryModel = { ...queryModel.value, sort: [] }

    sortModel.forEach(sort => {
      if (sort.field && sort.direction) {
        newQueryModel = updateSort(newQueryModel, sort.field, sort.direction)
      }
    })

    applyQueryModelChange(newQueryModel)
  }

  const updateFiltersAction = (filterModel: FilterModel[]) => {
    let newQueryModel: QueryModel = { ...queryModel.value, filters: [] }

    filterModel.forEach(filter => {
      if (filter.field && filter.operator) {
        newQueryModel = updateFilter(newQueryModel, filter.field, filter.operator, filter.value)
      }
    })

    applyQueryModelChange(newQueryModel)
  }

  const updateSearchAction = (search: string | undefined) => {
    const newQueryModel = updateSearch(queryModel.value, search)
    applyQueryModelChange(newQueryModel)
  }

  const updateCustomParamsAction = (params: Record<string, any>) => {
    const newQueryModel = updateCustomParams(queryModel.value, params)
    applyQueryModelChange(newQueryModel)
  }

  const resetAction = () => {
    const newQueryModel = createEmptyQueryModel()
    applyQueryModelChange(newQueryModel)
  }

  const applyPartialAction = (partial: Partial<QueryModel>) => {
    const newQueryModel: QueryModel = {
      ...queryModel.value,
      ...partial,
      pagination: {
        page: partial.pagination?.page ?? queryModel.value.pagination?.page ?? 1,
        pageSize: partial.pagination?.pageSize ?? queryModel.value.pagination?.pageSize ?? 20
      },
      sort: partial.sort || queryModel.value.sort,
      filters: partial.filters || queryModel.value.filters,
      customParams: {
        ...queryModel.value.customParams,
        ...partial.customParams
      }
    }
    applyQueryModelChange(newQueryModel)
  }

  // Fonction helper pour appliquer les changements avec debounce
  const applyQueryModelChange = (newQueryModel: QueryModel) => {
    // Nettoyer le QueryModel
    const cleanedQueryModel = cleanQueryModel(newQueryModel)

    // Annuler le timer précédent
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    // Appliquer le changement avec debounce
    debounceTimer = setTimeout(() => {
      queryModel.value = cleanedQueryModel

      // Callback externe
      if (onChange) {
        onChange(cleanedQueryModel)
      }
    }, debounceDelay)
  }

  // Interface retournée
  const actions: QueryModelActions = {
    updatePagination: updatePaginationAction,
    updateSort: updateSortAction,
    updateFilters: updateFiltersAction,
    updateSearch: updateSearchAction,
    updateCustomParams: updateCustomParamsAction,
    reset: resetAction,
    applyPartial: applyPartialAction
  }

  const computedProps: QueryModelComputed = {
    queryModel,
    hasActiveFilters,
    hasActiveSearch,
    hasActiveSort,
    activeFiltersCount
  }

  return {
    // État
    ...computedProps,

    // Actions
    ...actions,

    // Pour compatibilité
    updatePagination: updatePaginationAction,
    updateSort: updateSortAction,
    updateFilter: updateFiltersAction,
    updateGlobalSearch: updateSearchAction,
    fromDataTableParams: applyPartialAction
  }
}