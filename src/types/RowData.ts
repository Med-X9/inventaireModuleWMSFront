/**
 * Types pour la structure des données de ligne du DataTable
 */

export interface BaseRowData {
    /** ID unique de la ligne */
    id?: string | number
    /** Indique si c'est une ligne enfant */
    isChild?: boolean
    /** ID de la ligne parent */
    parentId?: string | number | null
    /** Type d'enfant */
    childType?: string
    /** Données originales */
    originalItem?: any
    /** Niveau d'imbrication */
    level?: number
    /** Indique si la ligne est sélectionnée */
    selected?: boolean
    /** Indique si la ligne est en cours d'édition */
    editing?: boolean
    /** Indique si la ligne est en cours de chargement */
    loading?: boolean
    /** Indique si la ligne a des erreurs */
    hasErrors?: boolean
    /** Messages d'erreur */
    errors?: Record<string, string>
    /** Données temporaires pour l'édition */
    tempData?: Record<string, any>
    /** Métadonnées de la ligne */
    metadata?: Record<string, any>
}

export interface GroupRowData extends BaseRowData {
    /** Type de ligne de groupe */
    type: 'group'
    /** Clé du groupe */
    groupKey: string
    /** Nom du groupe */
    groupName: string
    /** Valeur du groupe */
    groupValue: any
    /** Nombre d'éléments dans le groupe */
    groupCount: number
    /** Indique si le groupe est développé */
    expanded: boolean
    /** Sous-groupes */
    subgroups?: GroupRowData[]
    /** Agrégations du groupe */
    aggregations?: Record<string, any>
}

export interface DetailRowData extends BaseRowData {
    /** Type de ligne de détail */
    type: 'detail'
    /** ID de la ligne maître */
    masterId: string | number
    /** Données de détail */
    detailData: any[]
    /** Configuration du détail */
    detailConfig?: {
        columns?: string[]
        height?: number
        loading?: boolean
    }
}

export interface SummaryRowData extends BaseRowData {
    /** Type de ligne de résumé */
    type: 'summary'
    /** Type de résumé */
    summaryType: 'subtotal' | 'total' | 'average' | 'count'
    /** Colonnes concernées par le résumé */
    summaryColumns: string[]
    /** Valeurs du résumé */
    summaryValues: Record<string, any>
}

export interface PivotRowData extends BaseRowData {
    /** Type de ligne de pivot */
    type: 'pivot'
    /** Clés de ligne du pivot */
    rowKeys: string[]
    /** Clés de colonne du pivot */
    colKeys: string[]
    /** Valeurs du pivot */
    pivotValues: Record<string, any>
    /** Niveau d'imbrication du pivot */
    pivotLevel: number
    /** Indique si c'est un total */
    isTotal: boolean
}

export interface VirtualRowData extends BaseRowData {
    /** Type de ligne virtuelle */
    type: 'virtual'
    /** Index virtuel */
    virtualIndex: number
    /** Hauteur de la ligne */
    height: number
    /** Indique si la ligne est visible */
    visible: boolean
}

export interface EditableRowData extends BaseRowData {
    /** Type de ligne éditable */
    type: 'editable'
    /** Champs en cours d'édition */
    editingFields: string[]
    /** Valeurs originales */
    originalValues: Record<string, any>
    /** Valeurs temporaires */
    tempValues: Record<string, any>
    /** Validation des champs */
    fieldValidation: Record<string, string | null>
    /** Indique si la ligne a des changements */
    hasChanges: boolean
    /** Timestamp de la dernière modification */
    lastModified?: number
}

export interface SelectableRowData extends BaseRowData {
    /** Type de ligne sélectionnable */
    type: 'selectable'
    /** Indique si la ligne est sélectionnable */
    selectable: boolean
    /** Indique si la ligne est sélectionnée */
    selected: boolean
    /** Clé de sélection */
    selectionKey: string
    /** Données de sélection */
    selectionData?: any
}

export interface ExpandableRowData extends BaseRowData {
    /** Type de ligne extensible */
    type: 'expandable'
    /** Indique si la ligne est développée */
    expanded: boolean
    /** Données enfants */
    children?: RowData[]
    /** Nombre d'enfants */
    childCount: number
    /** Configuration de l'expansion */
    expandConfig?: {
        lazy?: boolean
        height?: number
        loading?: boolean
    }
}

export interface ActionRowData extends BaseRowData {
    /** Type de ligne avec actions */
    type: 'action'
    /** Actions disponibles */
    actions: Array<{
        id: string
        label: string
        icon?: string
        color?: string
        disabled?: boolean
        visible?: boolean
        onClick: (row: RowData) => void
    }>
    /** Actions contextuelles */
    contextActions?: Array<{
        id: string
        label: string
        icon?: string
        separator?: boolean
        onClick: (row: RowData) => void
    }>
}

export interface SortableRowData extends BaseRowData {
    /** Type de ligne triable */
    type: 'sortable'
    /** Valeurs de tri */
    sortValues: Record<string, any>
    /** Priorité de tri */
    sortPriority: number
    /** Direction de tri */
    sortDirection: 'asc' | 'desc'
}

export interface FilterableRowData extends BaseRowData {
    /** Type de ligne filtrable */
    type: 'filterable'
    /** Valeurs de filtre */
    filterValues: Record<string, any>
    /** Indique si la ligne correspond aux filtres */
    matchesFilters: boolean
    /** Filtres actifs */
    activeFilters: string[]
}

export interface ResponsiveRowData extends BaseRowData {
    /** Type de ligne responsive */
    type: 'responsive'
    /** Colonnes visibles sur mobile */
    mobileColumns: string[]
    /** Colonnes visibles sur tablette */
    tabletColumns: string[]
    /** Colonnes visibles sur desktop */
    desktopColumns: string[]
    /** Données adaptées au format */
    responsiveData: Record<string, any>
}

export interface AnimatedRowData extends BaseRowData {
    /** Type de ligne animée */
    type: 'animated'
    /** État d'animation */
    animationState: 'entering' | 'entered' | 'exiting' | 'exited'
    /** Durée d'animation */
    animationDuration: number
    /** Délai d'animation */
    animationDelay: number
    /** Classe d'animation */
    animationClass: string
}

export interface DraggableRowData extends BaseRowData {
    /** Type de ligne déplaçable */
    type: 'draggable'
    /** Indique si la ligne est en cours de déplacement */
    dragging: boolean
    /** Position de la ligne */
    position: number
    /** Groupe de la ligne */
    group?: string
    /** Contraintes de déplacement */
    dragConstraints?: {
        minPosition?: number
        maxPosition?: number
        allowedGroups?: string[]
    }
}

export interface ResizableRowData extends BaseRowData {
    /** Type de ligne redimensionnable */
    type: 'resizable'
    /** Hauteur de la ligne */
    height: number
    /** Hauteur minimale */
    minHeight: number
    /** Hauteur maximale */
    maxHeight: number
    /** Indique si la ligne est en cours de redimensionnement */
    resizing: boolean
}

export interface VirtualScrollingRowData extends BaseRowData {
    /** Type de ligne avec virtual scrolling */
    type: 'virtual'
    /** Index virtuel */
    virtualIndex: number
    /** Position Y virtuelle */
    virtualY: number
    /** Hauteur virtuelle */
    virtualHeight: number
    /** Indique si la ligne est visible */
    visible: boolean
    /** Données mises en cache */
    cached: boolean
}

export interface LazyLoadingRowData extends BaseRowData {
    /** Type de ligne avec lazy loading */
    type: 'lazy'
    /** Indique si les données sont chargées */
    loaded: boolean
    /** Indique si les données sont en cours de chargement */
    loading: boolean
    /** Erreur de chargement */
    error?: string
    /** Données partielles */
    partialData?: Record<string, any>
    /** Callback de chargement */
    loadCallback?: () => Promise<void>
}

export interface CachedRowData extends BaseRowData {
    /** Type de ligne mise en cache */
    type: 'cached'
    /** Timestamp de mise en cache */
    cachedAt: number
    /** Durée de vie du cache */
    cacheTTL: number
    /** Indique si le cache est expiré */
    cacheExpired: boolean
    /** Données mises en cache */
    cachedData: Record<string, any>
}

export interface OptimizedRowData extends BaseRowData {
    /** Type de ligne optimisée */
    type: 'optimized'
    /** Données optimisées */
    optimizedData: Record<string, any>
    /** Métriques de performance */
    performanceMetrics: {
        renderTime: number
        memoryUsage: number
        cacheHit: boolean
    }
    /** Indicateurs d'optimisation */
    optimizationFlags: {
        compressed: boolean
        preRendered: boolean
        cached: boolean
        virtualized: boolean
    }
}

// Type union pour toutes les lignes
export type RowData =
    | BaseRowData
    | GroupRowData
    | DetailRowData
    | SummaryRowData
    | PivotRowData
    | VirtualRowData
    | EditableRowData
    | SelectableRowData
    | ExpandableRowData
    | ActionRowData
    | SortableRowData
    | FilterableRowData
    | ResponsiveRowData
    | AnimatedRowData
    | DraggableRowData
    | ResizableRowData
    | VirtualScrollingRowData
    | LazyLoadingRowData
    | CachedRowData
    | OptimizedRowData

// Type pour les données de ligne génériques
export type GenericRowData = Record<string, any> & BaseRowData

// Type pour les données de ligne avec ID obligatoire
export interface RowDataWithId extends BaseRowData {
    id: string | number
}

// Type pour les données de ligne avec métadonnées
export interface RowDataWithMetadata extends BaseRowData {
    metadata: Record<string, any>
}

// Type pour les données de ligne avec validation
export interface RowDataWithValidation extends BaseRowData {
    validation: Record<string, string | null>
    isValid: boolean
}

// Type pour les données de ligne avec audit
export interface RowDataWithAudit extends BaseRowData {
    audit: {
        createdAt: Date
        createdBy: string
        updatedAt?: Date
        updatedBy?: string
        version: number
    }
}

// Type pour les données de ligne avec permissions
export interface RowDataWithPermissions extends BaseRowData {
    permissions: {
        canView: boolean
        canEdit: boolean
        canDelete: boolean
        canExport: boolean
        roles: string[]
    }
}
