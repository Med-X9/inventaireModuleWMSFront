/**
 * Convertisseur QueryModel
 *
 * Utilitaires pour convertir les QueryModel vers différents formats
 * (query params, REST API, etc.)
 */

import type { QueryModel } from '../types/QueryModel'

/**
 * Convertit un QueryModel vers des paramètres de requête URL
 * Version optimisée sans logs
 */
export function convertQueryModelToQueryParams(queryModel: QueryModel): URLSearchParams {
  const params = new URLSearchParams()

  // Pagination - Support des deux formats pour compatibilité
  if (queryModel.page) {
    params.set('page', queryModel.page.toString())
  } else if (queryModel.pagination?.page) {
    params.set('page', queryModel.pagination.page.toString())
  }

  if (queryModel.pageSize) {
    params.set('pageSize', queryModel.pageSize.toString())
  } else if (queryModel.pagination?.pageSize) {
    params.set('pageSize', queryModel.pagination.pageSize.toString())
  }

  // Tri - Format JSON string selon FORMAT_ACTUEL.md
  if (queryModel.sort && queryModel.sort.length > 0) {
    // Convertir en format JSON string : [{"colId":"field","sort":"asc"}]
    const sortJson = JSON.stringify(queryModel.sort.map(sort => ({
      colId: sort.colId,
      sort: sort.sort
    })))
    params.set('sort', sortJson)
  }

  // Filtres - Format JSON string selon FORMAT_ACTUEL.md
  if (queryModel.filters && Object.keys(queryModel.filters).length > 0) {
    // Convertir en format JSON string : {"field":"value"} ou {"field":{"type":"text","operator":"contains","value":"search"}}
    const filtersJson = JSON.stringify(queryModel.filters)
    params.set('filters', filtersJson)
  }

  // Recherche globale
  if (queryModel.search) {
    params.set('search', queryModel.search)
  }

  // Paramètres personnalisés
  if (queryModel.customParams) {
    Object.entries(queryModel.customParams).forEach(([key, value]) => {
      params.set(key, String(value))
    })
  }

  return params
}

/**
 * Convertit un QueryModel vers un format REST API
 */
export function convertQueryModelToRestApi(queryModel: QueryModel): Record<string, any> {
  return {
    page: queryModel.pagination?.page || 1,
    page_size: queryModel.pagination?.pageSize || 20,
    ordering: queryModel.sort?.map(sort => sort.colId ? `${sort.sort === 'desc' ? '-' : ''}${sort.colId}` : null).filter(Boolean) || [],
    search: queryModel.search || '',
    ...queryModel.customParams
  }
}

/**
 * Crée un QueryModel à partir des paramètres DataTable
 */
export function createQueryModelFromDataTableParams(params: any): QueryModel {
  return {
      page: params.page || 1,
    pageSize: params.pageSize || 20,
    sort: params.sort || [],
    filters: params.filters || {},
    search: params.search || '',
    customParams: params.customParams || {}
  }
}

/**
 * Fusionne un QueryModel avec des paramètres personnalisés
 */
export function mergeQueryModelWithCustomParams(queryModel: QueryModel, customParams: Record<string, any>): QueryModel {
  return {
    ...queryModel,
    customParams: {
      ...queryModel.customParams,
      ...customParams
    }
  }
}