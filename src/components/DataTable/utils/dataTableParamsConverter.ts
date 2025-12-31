/**
 * Convertisseur de paramètres DataTable
 *
 * Fournit des utilitaires pour convertir entre différents formats de paramètres
 * utilisés par les composants DataTable.
 */

export interface StandardDataTableParams {
  page?: number
  pageSize?: number
  sort?: Array<{
    field: string
    direction: 'asc' | 'desc'
  }>
  filters?: Record<string, any>
  search?: string
  customParams?: Record<string, any>
  start?: number
  length?: number
  draw?: number
}

/**
 * Convertit les paramètres DataTable standard vers un format utilisable
 */
export function convertToStandardDataTableParams(params: any): StandardDataTableParams {
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
 * Convertit les paramètres vers un objet QueryModel
 */
export function convertToQueryModel(params: StandardDataTableParams) {
  return {
    page: params.page || 1,
    pageSize: params.pageSize || 20,
    sort: params.sort || [],
    filters: params.filters || {},
    search: params.search || '',
    customParams: params.customParams || {}
  }
}
