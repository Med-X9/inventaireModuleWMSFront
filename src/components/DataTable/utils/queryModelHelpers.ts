/**
 * Helpers pour manipuler QueryModel
 *
 * Fonctions utilitaires pour travailler avec QueryModel de manière cohérente
 */

import type { QueryModel, FilterOperator } from '../types/QueryModel'

/**
 * Crée un QueryModel vide avec les valeurs par défaut
 */
export function createEmptyQueryModel(): QueryModel {
  return {
    pagination: {
      page: 1,
      pageSize: 20
    },
    sort: [],
    filters: [],
    search: undefined,
    customParams: {}
  }
}

/**
 * Met à jour la pagination d'un QueryModel
 */
export function updatePagination(queryModel: QueryModel, page: number, pageSize: number): QueryModel {
  return {
    ...queryModel,
    pagination: {
      page,
      pageSize
    }
  }
}

/**
 * Ajoute/modifie un tri dans QueryModel
 */
export function updateSort(queryModel: QueryModel, field: string, direction: 'asc' | 'desc'): QueryModel {
  const existingSortIndex = queryModel.sort?.findIndex(sort => sort.colId === field) ?? -1

  if (existingSortIndex >= 0) {
    // Modifier le tri existant
    const newSort = [...(queryModel.sort || [])]
    newSort[existingSortIndex] = { colId: field, sort: direction }
    return {
      ...queryModel,
      sort: newSort
    }
  } else {
    // Ajouter un nouveau tri
    return {
      ...queryModel,
      sort: [...(queryModel.sort || []), { colId: field, sort: direction }]
    }
  }
}

/**
 * Supprime un tri d'un QueryModel
 */
export function removeSort(queryModel: QueryModel, field: string): QueryModel {
  return {
    ...queryModel,
    sort: (queryModel.sort || []).filter(sort => sort.colId !== field)
  }
}

/**
 * Ajoute/modifie un filtre dans QueryModel
 */
export function updateFilter(
  queryModel: QueryModel,
  field: string,
  operator: FilterOperator,
  value: any
): QueryModel {
  const existingFilterIndex = queryModel.filters?.findIndex(filter => filter.field === field) ?? -1

  if (existingFilterIndex >= 0) {
    // Modifier le filtre existant
    const newFilters = { ...(queryModel.filters || {}) }
    newFilters[existingFilterIndex] = { field, operator, value }
    return {
      ...queryModel,
      filters: newFilters
    }
  } else {
    // Ajouter un nouveau filtre
    return {
      ...queryModel,
      filters: { ...(queryModel.filters || {}), [field]: { field, operator, value } }
    }
  }
}

/**
 * Supprime un filtre d'un QueryModel
 */
export function removeFilter(queryModel: QueryModel, field: string): QueryModel {
  return {
    ...queryModel,
    filters: (queryModel.filters || []).filter(filter => filter.field !== field)
  }
}

/**
 * Met à jour la recherche globale
 */
export function updateSearch(queryModel: QueryModel, search: string | undefined): QueryModel {
  return {
    ...queryModel,
    search: search || undefined
  }
}

/**
 * Ajoute des paramètres personnalisés
 */
export function updateCustomParams(queryModel: QueryModel, customParams: Record<string, any>): QueryModel {
  return {
    ...queryModel,
    customParams: {
      ...queryModel.customParams,
      ...customParams
    }
  }
}

/**
 * Convertit QueryModel vers paramètres URL pour les requêtes GET
 */
export function queryModelToUrlParams(queryModel: QueryModel): URLSearchParams {
  const params = new URLSearchParams()

  // Pagination
  if (queryModel.pagination?.page) {
    params.set('page', queryModel.pagination.page.toString())
  }
  if (queryModel.pagination?.pageSize) {
    params.set('pageSize', queryModel.pagination.pageSize.toString())
  }

  // Tri
  if (queryModel.sort && queryModel.sort.length > 0) {
    (queryModel.sort || []).forEach((sort, index) => {
      params.set(`sort[${index}][field]`, sort.colId)
      params.set(`sort[${index}][direction]`, sort.sort)
    })
  }

  // Filtres
  if (queryModel.filters && queryModel.filters.length > 0) {
    (queryModel.filters || []).forEach((filter, index) => {
      params.set(`filters[${index}][field]`, filter.field)
      params.set(`filters[${index}][operator]`, filter.operator)
      params.set(`filters[${index}][value]`, JSON.stringify(filter.value))
    })
  }

  // Recherche
  if (queryModel.search) {
    params.set('search', queryModel.search)
  }

  // Paramètres personnalisés
  if (queryModel.customParams) {
    Object.entries(queryModel.customParams).forEach(([key, value]) => {
      params.set(key, JSON.stringify(value))
    })
  }

  return params
}

/**
 * Convertit les paramètres URL vers QueryModel
 */
export function urlParamsToQueryModel(params: URLSearchParams): QueryModel {
  const queryModel = createEmptyQueryModel()

  // Pagination
  const page = params.get('page')
  const pageSize = params.get('pageSize')
  if (page && queryModel.pagination) queryModel.pagination.page = parseInt(page, 10)
  if (pageSize && queryModel.pagination) queryModel.pagination.pageSize = parseInt(pageSize, 10)

  // Tri - TODO: Parser le format sort[index][field]
  // Pour l'instant, on laisse vide

  // Filtres - TODO: Parser le format filters[index][field]
  // Pour l'instant, on laisse vide

  // Recherche
  const search = params.get('search')
  if (search) queryModel.search = search

  return queryModel
}

/**
 * Vérifie si deux QueryModel sont identiques
 */
export function isQueryModelEqual(a: QueryModel, b: QueryModel): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * Crée une copie profonde d'un QueryModel
 */
export function cloneQueryModel(queryModel: QueryModel): QueryModel {
  return JSON.parse(JSON.stringify(queryModel))
}

/**
 * Valide un QueryModel
 */
export function validateQueryModel(queryModel: QueryModel): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validation pagination
  if (queryModel.pagination && queryModel.pagination.page < 1) {
    errors.push('Page doit être >= 1')
  }
  if (queryModel.pagination && queryModel.pagination.pageSize < 1) {
    errors.push('PageSize doit être >= 1')
  }

  // Validation tri
  if (queryModel.sort) {
    queryModel.sort.forEach((sort, index) => {
      if (!sort.colId) {
        errors.push(`Tri ${index}: field requis`)
      }
      if (!['asc', 'desc'].includes(sort.sort)) {
        errors.push(`Tri ${index}: direction doit être 'asc' ou 'desc'`)
      }
    })
  }

  // Validation filtres
  (queryModel.filters || []).forEach((filter, index) => {
    if (!filter.field) {
      errors.push(`Filtre ${index}: field requis`)
    }
    if (!filter.operator) {
      errors.push(`Filtre ${index}: operator requis`)
    }
  })

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Nettoie un QueryModel (supprime les valeurs vides)
 */
export function cleanQueryModel(queryModel: QueryModel): QueryModel {
  return {
    ...queryModel,
    sort: (queryModel.sort || []).filter(sort => sort.colId),
    filters: (queryModel.filters || []).filter(filter =>
      filter.field && filter.operator && filter.value !== undefined && filter.value !== null && filter.value !== ''
    ),
    search: queryModel.search || undefined,
    customParams: Object.fromEntries(
      Object.entries(queryModel.customParams || {}).filter(([_, value]) =>
        value !== undefined && value !== null && value !== ''
      )
    )
  }
}
