/**
 * Types pour les DataTables côté serveur
 */

export interface PersistenceConfig {
  /** Colonnes visibles (clés) */
  visibleColumns?: string[]
  /** Largeurs des colonnes */
  columnWidths?: Record<string, number>
  /** Tri actif */
  sort?: Array<{
    colId: string
    sort: 'asc' | 'desc'
  }>
  /** Filtres actifs */
  filters?: Record<string, any>
  /** Recherche globale */
  search?: string
  /** Taille de page */
  pageSize?: number
  /** Page actuelle */
  currentPage?: number
  /** Colonnes épinglées */
  pinnedColumns?: {
    left?: string[]
    right?: string[]
  }
  /** Ordre des colonnes */
  columnOrder?: string[]
  /** État des groupes/agrégations */
  groupingState?: any
  /** État du pivot */
  pivotState?: any
}
