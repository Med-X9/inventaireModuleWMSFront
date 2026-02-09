/**
 * Types pour les composables du DataTable
 *
 * Définit les interfaces pour remplacer les `any` dans les composables
 *
 * @module DataTableComposablesTypes
 */

import type { DataTableColumn, FilterOperator } from './dataTable'
import type { QueryModel } from './QueryModel'

/**
 * Instance du composable useDataTable
 */
export interface DataTableInstance {
    /** Terme de recherche globale */
    globalSearchTerm: string
    /** État des filtres */
    filterState: Record<string, unknown>
    /** Filtres avancés */
    advancedFilters: Record<string, unknown>
    /** Colonnes */
    columns: DataTableColumn[]
    /** Colonnes visibles */
    visibleColumns: string[]
    /** Largeurs des colonnes */
    columnWidths: Record<string, number>
    /** Sélection de lignes activée */
    rowSelection: boolean
    /** Lignes sélectionnées */
    selectedRows: Set<string>
    /** État de chargement pour l'export */
    exportLoading: boolean
    /** Données paginées */
    paginatedData: Record<string, unknown>[]
    /** Page actuelle effective */
    effectiveCurrentPage: number
    /** Nombre total de pages effectif */
    effectiveTotalPages: number
    /** Nombre total d'éléments effectif */
    effectiveTotalItems: number
    /** Taille de page effective */
    effectivePageSize: number
    /** Index de début */
    start: number
    /** Index de fin */
    end: number
    /** Actions disponibles */
    actions: unknown[]
    /** État de chargement */
    loading: boolean

    // Méthodes
    setFilterState: (filters: Record<string, unknown>) => void
    clearAllFilters: () => void
    handleVisibleColumnsChanged: (columns: string[]) => void
    reorderColumns: (newOrder: string[]) => void
    exportToCsv: () => void
    exportToSpreadsheet: () => void
    exportToPdf: () => void
    exportSelectedToCsv: () => void
    exportSelectedToSpreadsheet: () => void
    deselectAll: () => void
    setSelectedRows: (rows: Set<string>) => void
    updateGlobalSearchTerm: (term: string) => void
    goToPage: (page: number) => void
    changePageSize: (size: number) => void
    createRowNumberColumn: () => DataTableColumn
}

/**
 * Instance du composable useMultiSort
 */
export interface MultiSortInstance {
    /** Modèle de tri actuel */
    sortModel: Array<{ colId: string; sort: 'asc' | 'desc' }>
    /** Ajouter un tri */
    addSort: (field: string, direction: 'asc' | 'desc') => void
    /** Retirer un tri */
    removeSort: (field: string) => void
    /** Réinitialiser le tri */
    clearSort: () => void
    /** Toggle le tri */
    toggleSort: (field: string) => void
}

/**
 * Instance du composable useDataTableEditing
 */
export interface EditingInstance {
    /** État de l'édition */
    state: {
        editingCells: Map<string, { rowId: string | number; field: string; value: unknown }>
        focusedCell: string | null
    }
    /** Démarrer l'édition */
    startEditing: (rowId: string | number, field: string, initialValue?: unknown) => void
    /** Arrêter l'édition */
    stopEditing: (save: boolean, rowId?: string | number, field?: string) => void
    /** Mettre à jour la valeur en cours d'édition */
    updateEditingValue: (rowId: string | number, field: string, value: unknown) => void
    /** Obtenir la valeur d'une cellule */
    getCellValue: (rowId: string | number, field: string) => unknown
}

/**
 * Instance du composable useDataTableMasterDetail
 */
export interface MasterDetailInstance {
    /** États des détails */
    detailStates: Map<string | number, boolean>
    /** Toggle un détail */
    toggleDetail: (rowId: string | number) => void
    /** Développer tous les détails */
    expandAllDetails: () => void
    /** Replier tous les détails */
    collapseAllDetails: () => void
}

/**
 * Instance du composable useColumnPinning
 */
export interface ColumnPinningInstance {
    /** Colonnes épinglées */
    pinnedColumns: {
        left: string[]
        right: string[]
    }
    /** Obtenir la direction d'épinglage */
    getPinDirection: (field: string) => 'left' | 'right' | null
    /** Épingler une colonne */
    pinColumn: (field: string, direction: 'left' | 'right') => void
    /** Désépingler une colonne */
    unpinColumn: (field: string) => void
}

/**
 * Instance du composable useAutoDataTable (optionnel)
 */
export interface AutoDataTableInstance {
    /** Gérer le changement de pagination */
    handlePaginationChanged: (queryModel: QueryModel) => Promise<void>
    /** Gérer le changement de tri */
    handleSortChanged: (queryModel: QueryModel) => Promise<void>
    /** Gérer le changement de filtres */
    handleFilterChanged: (queryModel: QueryModel) => Promise<void>
    /** Gérer le changement de recherche */
    handleGlobalSearchChanged: (searchTerm: string) => Promise<void>
}

/**
 * Type pour les valeurs de filtres
 */
export type FilterValue = string | number | boolean | string[] | number[] | FilterConfig

/**
 * Configuration d'un filtre
 */
export interface FilterConfig {
    type?: string
    operator?: FilterOperator
    field?: string
    dataType?: string
    value?: unknown
    value2?: unknown
    values?: unknown[]
    filter?: unknown
    from?: unknown
    to?: unknown
}

/**
 * Type pour les données de ligne
 */
export type RowData = Record<string, unknown>

/**
 * Type pour un tableau de données de lignes
 */
export type RowDataArray = RowData[]

/**
 * Type pour les événements emit du DataTable
 */
export type DataTableEvent =
    | ['pagination-changed', QueryModel]
    | ['page-size-changed', QueryModel]
    | ['sort-changed', QueryModel]
    | ['filter-changed', QueryModel]
    | ['global-search-changed', QueryModel]
    | ['selection-changed', Set<string>]
    | ['column-visibility-changed', string[]]
    | ['column-order-changed', string[]]
    | ['column-width-changed', Record<string, number>]
    | ['row-clicked', RowData, number]
    | ['row-double-clicked', RowData, number]
    | ['cell-clicked', RowData, string, unknown]
    | ['cell-value-changed', { data: any; field: string; newValue: any; oldValue: any }]
    | ['edit-start', string | number, string]
    | ['edit-end', string | number, string, unknown]
    | ['query-model-changed', QueryModel]
    | ['export-started', string]
    | ['export-completed', string]
    | ['export-error', string, Error]

/**
 * Type pour la fonction emit
 */
export type EmitFunction = <E extends DataTableEvent>(
    event: E[0],
    ...args: E extends [string, ...infer Rest] ? Rest : never
) => void

/**
 * Type pour les filtres (amélioration de Record<string, any>)
 */
export type FilterState = Record<string, FilterValue | FilterConfig>

/**
 * Type pour les paramètres personnalisés
 */
export type CustomParams = Record<string, unknown>

/**
 * Type pour les données chargées (lazy loading)
 */
export interface LoadedData {
    data: RowDataArray
    total: number
    page: number
    pageSize: number
}

/**
 * Type pour le store Pinia (générique)
 */
export interface PiniaStore {
    [key: string]: unknown
    [key: number]: unknown
}

/**
 * Type pour les paramètres de tri
 */
export type SortModelItem = {
    colId: string
    sort: 'asc' | 'desc'
}

/**
 * Type pour les filtres backend
 */
export type BackendFilters = Record<string, FilterValue | FilterConfig>

/**
 * Configuration pour useDataTableEditing
 */
export interface UseDataTableEditingConfig {
    columns: import('./dataTable').DataTableColumn[]
    rowData: RowDataArray
    onSave?: (row: RowData, field: string, value: unknown) => Promise<void>
    onCancel?: (row: RowData, field: string) => void
}

/**
 * État d'édition d'une cellule
 */
export interface EditingCellState {
    rowId: string | number
    field: string
    value: unknown
    originalValue: unknown
}

/**
 * Configuration pour useDataTableFilters
 */
export interface UseDataTableFiltersConfig {
    props: import('./dataTable').DataTableProps
    dataTable: DataTableInstance
    queryModel: import('./QueryModel').QueryModel
    currentSortModel: { value: SortModelItem[] }
    emit: (queryModel: import('./QueryModel').QueryModel) => void
    autoDataTable?: AutoDataTableInstance
    debounceDelay?: number
}

