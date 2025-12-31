/**
 * Convertisseur QueryModel
 *
 * Utilitaires pour convertir les QueryModel vers différents formats
 * (query params, REST API, etc.)
 */

import type { QueryModel } from '../types/QueryModel'

/**
 * Convertit un QueryModel vers des paramètres de requête URL
 */
export function convertQueryModelToQueryParams(queryModel: QueryModel): URLSearchParams {
  console.log('[convertQueryModelToQueryParams] 🔄 Converting QueryModel:', {
    page: queryModel.page,
    pageSize: queryModel.pageSize,
    pagination: queryModel.pagination,
    sort: queryModel.sort,
    filters: queryModel.filters,
    search: queryModel.search,
    customParams: queryModel.customParams
  })

  const params = new URLSearchParams()

  // Pagination - Support des deux formats pour compatibilité
  if (queryModel.page) {
    params.set('page', queryModel.page.toString())
    console.log('[convertQueryModelToQueryParams] ✅ Setting page:', queryModel.page)
  } else if (queryModel.pagination?.page) {
    params.set('page', queryModel.pagination.page.toString())
    console.log('[convertQueryModelToQueryParams] ✅ Setting page (legacy):', queryModel.pagination.page)
  } else {
    console.warn('[convertQueryModelToQueryParams] ⚠️ No page value found')
  }

  if (queryModel.pageSize) {
    params.set('pageSize', queryModel.pageSize.toString())
    console.log('[convertQueryModelToQueryParams] ✅ Setting pageSize:', queryModel.pageSize)
  } else if (queryModel.pagination?.pageSize) {
    params.set('pageSize', queryModel.pagination.pageSize.toString())
    console.log('[convertQueryModelToQueryParams] ✅ Setting pageSize (legacy):', queryModel.pagination.pageSize)
  } else {
    console.warn('[convertQueryModelToQueryParams] ⚠️ No pageSize value found')
  }

  // Tri - Format JSON string selon FORMAT_ACTUEL.md
  if (queryModel.sort && queryModel.sort.length > 0) {
    console.log('[convertQueryModelToQueryParams] 🔄 Processing sort:', queryModel.sort)
    // Convertir en format JSON string : [{"colId":"field","sort":"asc"}]
    const sortJson = JSON.stringify(queryModel.sort.map(sort => ({
      colId: sort.colId,
      sort: sort.sort
    })))
    params.set('sort', sortJson)
    console.log('[convertQueryModelToQueryParams] ✅ Sort JSON:', sortJson)
  } else {
    console.log('[convertQueryModelToQueryParams] ℹ️ No sort parameters')
  }

  // Filtres - Format JSON string selon FORMAT_ACTUEL.md
  if (queryModel.filters && Object.keys(queryModel.filters).length > 0) {
    console.log('[convertQueryModelToQueryParams] 🔄 Processing filters:', queryModel.filters)
    // Convertir en format JSON string : {"field":"value"} ou {"field":{"type":"text","operator":"contains","value":"search"}}
    const filtersJson = JSON.stringify(queryModel.filters)
    params.set('filters', filtersJson)
    console.log('[convertQueryModelToQueryParams] ✅ Filters JSON:', filtersJson)
  } else {
    console.log('[convertQueryModelToQueryParams] ℹ️ No filter parameters')
  }

  // Recherche globale
  if (queryModel.search) {
    params.set('search', queryModel.search)
    console.log('[convertQueryModelToQueryParams] ✅ Setting search:', queryModel.search)
  } else {
    console.log('[convertQueryModelToQueryParams] ℹ️ No search parameter')
  }

  // Paramètres personnalisés
  if (queryModel.customParams) {
    console.log('[convertQueryModelToQueryParams] 🔄 Processing custom params:', queryModel.customParams)
    Object.entries(queryModel.customParams).forEach(([key, value]) => {
      params.set(key, String(value))
      console.log(`[convertQueryModelToQueryParams] ✅ Custom param: ${key}=${value}`)
    })
  } else {
    console.log('[convertQueryModelToQueryParams] ℹ️ No custom parameters')
  }

  // Log final des paramètres générés
  const finalParams = Object.fromEntries(params.entries())
  console.log('[convertQueryModelToQueryParams] 📤 Final query params:', finalParams)

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