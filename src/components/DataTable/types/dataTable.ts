/**
 * Types centralisés pour DataTable et useDataTable
 *
 * Ce fichier contient tous les types TypeScript utilisés par :
 * - DataTableNew.vue (composant)
 * - useDataTable.ts (composable)
 * - Interfaces et types partagés
 */

import type { Ref, ComputedRef } from 'vue'

// Export du QueryModel pour utilisation dans DataTable
export type { QueryModel, SortModel, FilterModel, QueryModelResponse } from './QueryModel'

// ===== TYPES DE COLONNES =====

/**
 * Types de données des colonnes
 */
export type ColumnDataType =
    | 'text'           // Texte simple
    | 'number'         // Nombre
    | 'date'           // Date
    | 'datetime'       // Date et heure
    | 'boolean'        // Booléen
    | 'select'         // Sélection
    | 'email'          // Email
    | 'url'            // URL
    | 'phone'          // Téléphone
    | 'currency'       // Devise
    | 'percentage'     // Pourcentage
    | 'file'           // Fichier
    | 'image'          // Image
    | 'color'          // Couleur
    | 'json'           // JSON
    | 'array'          // Tableau
    | 'object'         // Objet
    | 'textarea'       // Texte long (textarea)

/**
 * Types d'opérateurs de filtrage disponibles
 */
export type FilterOperator =
    | 'equals'         // Égal à
    | 'not_equals'     // Différent de
    | 'contains'       // Contient
    | 'not_contains'   // Ne contient pas
    | 'starts_with'    // Commence par
    | 'ends_with'      // Termine par
    | 'greater_than'   // Supérieur à
    | 'less_than'      // Inférieur à
    | 'greater_equal'  // Supérieur ou égal
    | 'less_equal'     // Inférieur ou égal
    | 'between'        // Entre deux valeurs
    | 'in'             // Dans une liste
    | 'not_in'         // Pas dans une liste
    | 'is_null'        // Est null
    | 'is_not_null'    // N'est pas null
    | 'is_empty'       // Est vide
    | 'is_not_empty'   // N'est pas vide
    | 'regex'          // Expression régulière
    | 'custom'         // Filtre personnalisé

/**
 * Configuration d'un filtre
 */
export interface FilterConfig {
    /** Type de données de la colonne */
    dataType: ColumnDataType
    /** Opérateur de filtre */
    operator: FilterOperator
    /** Valeur du filtre */
    value?: any
    /** Valeur secondaire (pour les filtres 'between') */
    value2?: any
    /** Liste de valeurs (pour les filtres 'in', 'not_in') */
    values?: any[]
    /** Options pour les filtres de type 'select' */
    options?: Array<{ label: string; value: any; disabled?: boolean }>
    /** Expression régulière (pour les filtres 'regex') */
    regex?: string
    /** Fonction de filtrage personnalisée (pour les filtres 'custom') */
    customFilter?: (value: any, filterValue: any) => boolean
    /** Placeholder pour l'input de filtre */
    placeholder?: string
    /** Validation du filtre */
    validation?: {
        min?: number
        max?: number
        pattern?: string
        required?: boolean
    }
    /** Champ de la colonne (pour les groupes de filtres) */
    field?: string
}

/**
 * Type de logique pour combiner les filtres dans un groupe
 */
export type FilterLogic = 'AND' | 'OR'

/**
 * Groupe de filtres avec logique de combinaison
 */
export interface FilterGroup {
    /** ID unique du groupe */
    id: string
    /** Logique de combinaison (AND ou OR) */
    logic: FilterLogic
    /** Filtres individuels dans ce groupe */
    filters: Array<FilterConfig & { id: string }>
    /** Sous-groupes (pour imbrication) */
    groups?: FilterGroup[]
}

/**
 * Configuration complète des filtres avec groupes
 */
export interface AdvancedFilterConfig {
    /** Logique principale pour combiner les groupes */
    rootLogic: FilterLogic
    /** Groupes de filtres */
    groups: FilterGroup[]
    /** Filtres individuels au niveau racine */
    filters?: Array<FilterConfig & { id: string }>
}

/**
 * Configuration d'une colonne de la table
 */
export interface DataTableColumn<T = Record<string, unknown>> {
    /** Champ de données */
    field: string
    /** Nom d'affichage de l'en-tête */
    headerName?: string
    /** Description de la colonne (pour tooltip) */
    description?: string
    /** Type de données de la colonne */
    dataType?: ColumnDataType
    /** Largeur de la colonne */
    width?: number
    /** Largeur minimale */
    minWidth?: number
    /** Largeur maximale */
    maxWidth?: number
    /** Colonne redimensionnable */
    resizable?: boolean
    /** Colonne triable */
    sortable?: boolean
    /** Colonne filtrable */
    filterable?: boolean
    /** Configuration du filtre */
    filterConfig?: FilterConfig
    /** Colonne éditable */
    editable?: boolean
    /** Colonne visible par défaut */
    visible?: boolean
    /** Colonne masquée par défaut (priorité sur visible) */
    hide?: boolean
    /** Colonne déplaçable */
    draggable?: boolean
    /** Auto-sizing de la colonne */
    autoSize?: boolean
    /** Largeur flexible */
    flex?: number
    /** Position de la colonne (pour le drag & drop) */
    position?: number
    /** Permettre le retour à la ligne dans cette colonne (évite scroll horizontal) */
    allowWrap?: boolean
    /** Priorité d'affichage (colonnes avec priorité élevée restent visibles) - Plus élevé = plus important */
    priority?: number
    /** Largeur minimale relative (en pourcentage de l'espace disponible) */
    minWidthPercent?: number
    /** Breakpoints responsive : colonne visible à partir de cette largeur (ex: 'sm', 'md', 'lg', 'xl') */
    responsive?: {
        /** Masquer la colonne en dessous de ce breakpoint */
        hideBelow?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
        /** Afficher la colonne uniquement au-dessus de ce breakpoint */
        showAbove?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
    }
    /** Configuration des détails */
    detailConfig?: DetailConfig
    /** Formateur personnalisé */
    valueFormatter?: (params: any) => string
    /** Formateur personnalisé pour l'édition (affiche une valeur différente pendant l'édition) */
    editValueFormatter?: (value: any, row: T) => string
    /** Cell renderer personnalisé */
    cellRenderer?: string | ((params: any) => string)
    /** Style de cellule */
    cellStyle?: (params: any) => any
    /** Classes CSS de cellule */
    cellClass?: string | ((params: any) => string)
    /** Règles de classes CSS */
    cellClassRules?: Record<string, string | ((params: any) => boolean)>
    /** Icône de la colonne */
    icon?: string
    /** Couleur de la colonne */
    color?: string
    /** Tooltip de la colonne */
    tooltip?: string
    /** Alignement du contenu */
    align?: 'left' | 'center' | 'right'
    /** Format d'affichage */
    format?: string
    /** Unités (pour les nombres) */
    unit?: string
    /** Précision décimale (pour les nombres) */
    precision?: number
    /** Séparateur de milliers */
    thousandSeparator?: boolean
    /** Devise (pour les montants) */
    currency?: string
    /** Format de date */
    dateFormat?: string
    /** Options de formatage de date */
    dateOptions?: Intl.DateTimeFormatOptions
    /** Timezone pour les dates */
    timezone?: string
    /** Validation des données */
    validation?: {
        required?: boolean
        min?: number
        max?: number
        pattern?: string
        custom?: (value: any) => boolean | string
    }
    /** Configuration d'agrégation pour le footer (sum, avg, min, max, count) */
    aggregation?: {
        type: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'custom'
        label?: string
        formatter?: (value: any) => string
        customAggregator?: (values: any[]) => any
    }
    /** Configuration de colonne calculée */
    calculated?: {
        type: 'formula' | 'sum' | 'difference' | 'product' | 'ratio' | 'custom'
        formula?: string
        sourceFields?: string[]
        customFunction?: (row: any, sourceValues: Record<string, any>) => any
    }
    /** Actions spécifiques à la colonne */
    columnActions?: Array<{
        label: string
        icon?: string
        onClick: (value: any, row: T) => void
        show?: (value: any, row: T) => boolean
    }>
    /** Sélection multiple (pour les colonnes de type select) */
    multiple?: boolean
    /** Styles de badges pour les statuts */
    badgeStyles?: Array<{
        value: string
        class: string
        icon?: string
    }>
    /** Classe par défaut pour les badges */
    badgeDefaultClass?: string
    /** Configuration des données imbriquées */
    nestedData?: {
        key: string
        displayKey?: string
        countSuffix?: string
        expandable?: boolean
        iconCollapsed?: string
        iconExpanded?: string
        showCount?: boolean
        title?: string
        columns?: Array<{
            field: string
            headerName: string
            sortable?: boolean
            filterable?: boolean
            width?: number
        }>
    }
}

/**
 * Ligne avec détails et expansion
 */
export interface RowWithDetails extends Record<string, unknown> {
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
}

// ===== TYPES DE CONFIGURATION =====

/**
 * Configuration des props du composant DataTableNew
 */
export interface DataTableProps<T = Record<string, unknown>> {
    /** Colonnes de la table */
    columns: DataTableColumn<T>[]
    /** Actions disponibles */
    actions: ActionConfig<T>[]
    /** Données de la table */
    rowDataProp: any[]
    /** URL pour charger les données */
    dataUrl?: string
    /** Active le filtrage */
    enableFiltering?: boolean
    /** Active la pagination */
    pagination?: boolean
    /** Clé de stockage */
    storageKey?: string
    /** Affiche le sélecteur de colonnes */
    showColumnSelector?: boolean
    /** Nom de l'en-tête des actions */
    actionsHeaderName?: string
    /** Active la sélection multiple */
    rowSelection?: boolean
    /** Titre pour les exports */
    exportTitle?: string
    /** Active l'édition inline */
    inlineEditing?: boolean
    /** Nombre max de lignes pour la hauteur dynamique */
    maxRowsForDynamicHeight?: number
    /** Affiche les détails */
    showDetails?: boolean
    /**
     * @deprecated Utiliser l'événement @pagination-changed qui émet un QueryModel
     * Callback de pagination (déprécié)
     */
    onPaginationChanged?: (params: { page: number, pageSize: number }) => void
    /** Active la recherche globale */
    enableGlobalSearch?: boolean
    /** Page courante */
    currentPageProp?: number
    /** Nombre total de pages */
    totalPagesProp?: number
    /** Nombre total d'éléments */
    totalItemsProp?: number
    /** Taille de page par défaut */
    pageSizeProp?: number
    /** Active la pagination côté serveur */
    serverSidePagination?: boolean
    /** Map d'icônes pour les actions */
    iconMap?: Record<string, any>
    /** État de chargement pour afficher le skeleton */
    loading?: boolean
    /** État forbidden (permissions insuffisantes) */
    forbidden?: boolean

    /** Active le click sur les lignes (désactivé par défaut) */
    enableRowClick?: boolean

    /** Configuration de l'empty state personnalisé */
    emptyStateConfig?: {
        title?: string
        description?: string
        icon?: any
        actions?: Array<{ label: string; onClick: () => void; primary?: boolean; icon?: any }>
    }

    /** Configuration de l'état forbidden (permissions) */
    forbiddenStateConfig?: {
        title?: string
        description?: string
        icon?: any
        actions?: Array<{ label: string; onClick: () => void; primary?: boolean; icon?: any }>
    }

    /** ⚠️ DÉPRÉCIÉ : Le DataTable utilise maintenant uniquement QueryModel selon FRONTEND_QUERYMODEL_GUIDE.md */
    /** @deprecated Utiliser uniquement QueryModel - ce paramètre est ignoré */
    queryOutputMode?: 'queryModel'

    // === FONCTIONNALITÉS AVANCÉES ===

    /** Active le virtual scrolling */
    enableVirtualScrolling?: boolean
    /** Configuration du virtual scrolling */
    virtualScrollingConfig?: {
        itemHeight: number
        containerHeight: number
        overscan?: number
        threshold?: number
    }

    /** Active le groupement de lignes */
    enableGrouping?: boolean
    /** Configuration du groupement */
    groupingConfig?: {
        fields: string[]
        expandable?: boolean
        aggregators?: Record<string, 'count' | 'sum' | 'avg' | 'min' | 'max'>
    }

    /** Active l'édition avancée */
    enableAdvancedEditing?: boolean
    /** Configuration de l'édition */
    editingConfig?: {
        fields: string[]
        validation?: Record<string, any>
        saveMode?: 'immediate' | 'batch'
    }

    /** Active les pivot tables */
    enablePivot?: boolean
    /** Configuration des pivot tables */
    pivotConfig?: {
        rows: string[]
        columns: string[]
        values: Array<{
            field: string
            aggregator: 'sum' | 'avg' | 'count' | 'min' | 'max'
            label: string
        }>
    }

    /** Active le master/detail */
    enableMasterDetail?: boolean
    /** Configuration du master/detail */
    masterDetailConfig?: {
        detailComponent?: any
        detailDataProvider?: (masterRow: any) => Promise<any[]>
        detailHeight?: number
        lazyLoading?: boolean
        cacheDetails?: boolean
    }

    /** Active le tri côté serveur */
    serverSideSorting?: boolean
    /** Active le filtrage côté serveur */
    serverSideFiltering?: boolean
    /** Délai de debounce pour les filtres */
    debounceFilter?: number
    /** Paramètres personnalisés à ajouter aux paramètres DataTable standard */
    customDataTableParams?: Record<string, any>

    // === FONCTIONNALITÉS AVANCÉES ===

    /** Active le tri multi-colonnes */
    enableMultiSort?: boolean
    /** Configuration du tri multi-colonnes */
    multiSortConfig?: {
        maxSortColumns?: number
    }

    /** Active l'épinglage de colonnes */
    enableColumnPinning?: boolean
    /** Configuration de l'épinglage */
    columnPinningConfig?: {
        defaultPinnedColumns?: Array<{ field: string; pinned: 'left' | 'right' | null }>
    }

    /** Active le redimensionnement de colonnes */
    enableColumnResize?: boolean
    /** Configuration du redimensionnement */
    columnResizeConfig?: {
        defaultWidths?: Record<string, number>
        minWidth?: number
        maxWidth?: number
    }

    /** Nombre de colonnes visibles par défaut (min: 4, max: total des colonnes, défaut: 6) */
    defaultVisibleColumnsCount?: number

    /** Active le scroll infini */
    enableInfiniteScroll?: boolean
    /** Configuration du scroll infini */
    infiniteScrollConfig?: {
        batchSize?: number
        threshold?: number
        loadMore?: (startIndex: number, endIndex: number) => Promise<any[]>
    }

    /** Active les filtres Set (valeurs uniques) */
    enableSetFilters?: boolean
    /** Configuration des filtres Set */
    setFiltersConfig?: {
        extractUniqueValues?: (field: string, data: any[]) => any[]
        formatValue?: (value: any) => string
    }

    /** Désactiver le scroll horizontal (colonnes s'adaptent automatiquement) */
    disableHorizontalScroll?: boolean
    /** Mode compact pour réduire les largeurs de colonnes */
    compactMode?: boolean

    // === GESTION AUTOMATIQUE ===

    /** Active la gestion automatique complète (sélection, filtres, tri, recherche, pagination) */
    enableAutoManagement?: boolean
    /** Configuration de la gestion automatique */
    autoManagementConfig?: {
        /** Endpoint API pour charger les données */
        endpoint?: string
        /** Store Pinia pour charger les données */
        piniaStore?: any
        /** Action du store */
        storeAction?: string
        /** Taille de page par défaut */
        defaultPageSize?: number
        /** Activer la sélection multiple */
        enableRowSelection?: boolean
        /** Activer le tri multi-colonnes */
        enableMultiSort?: boolean
        /** Activer les filtres Set */
        enableSetFilters?: boolean
    }
}

/**
 * Configuration d'une action pour une ligne
 */
export interface ActionConfig<T = Record<string, unknown>> {
    /** Label de l'action (peut être une fonction ou une chaîne) */
    label: string | ((row: T) => string)
    /** Icône de l'action (optionnel) - peut être un composant Vue ou une chaîne */
    icon?: any
    /** Couleur de l'action (optionnel) */
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
    /** Fonction appelée lors du clic */
    onClick: (row: T) => void
    /** Condition d'affichage (optionnel) */
    show?: (row: T) => boolean
    /** Action désactivée (optionnel) */
    disabled?: (row: T) => boolean
    /** Tooltip de l'action (optionnel) */
    tooltip?: string
    /** Classes CSS personnalisées */
    class?: string
}

/**
 * Configuration d'une colonne de détail
 */
export interface DetailConfig {
    /** Clé pour accéder aux données de détail */
    key: string
    /** Champ pour l'affichage du label */
    labelField?: string
    /** Colonnes pour afficher les détails */
    columns?: Array<{
        /** Clé de la valeur */
        valueKey?: string
        /** Formateur personnalisé */
        formatter?: (value: any, item: any) => string
    }>
    /** Suffixe pour le compteur (ex: "items") */
    countSuffix?: string
    /** Icône pour l'état fermé */
    iconCollapsed?: string
    /** Icône pour l'état ouvert */
    iconExpanded?: string
}

// ===== TYPES D'ÉVÉNEMENTS =====

/**
 * Événements émis par le composant DataTableNew
 */
export interface DataTableEmits {
    /** Émis quand la pagination change */
    'pagination-changed': [PaginationChangeEvent]
    /** Émis quand la sélection change */
    'selection-changed': [string[]]
    /** Émis quand une ligne est cliquée */
    'row-clicked': [any]
    /** Émis quand une valeur de cellule change */
    'cell-value-changed': [CellValueChangedEvent]
    /** Émis quand le tri change */
    'sort-changed': [Array<{ field: string; direction: 'asc' | 'desc' }>]
    /** Émis quand le filtre change */
    'filter-changed': [Record<string, any>]
    /** Émis quand une ligne est étendue */
    'row-expanded': [any]
    /** Émis quand l'état de la table change */
    'table-state-changed': [TableState]
    /** Émis pour retenter une action */
    'retry': []
}

// Types utilitaires pour usage Vue (évite les erreurs de typage générique)
export type DataTableColumnAny = DataTableColumn<Record<string, unknown>>;
export type ActionConfigAny = ActionConfig<Record<string, unknown>>;

// Types pour les émissions d'événements
export interface PaginationChangeEvent {
    page: number
    pageSize: number
}

export interface CellValueChangedEvent {
    data: any
    field: string
    oldValue: any
    newValue: any
}

/**
 * État de la table pour la persistance
 */
export interface TableState {
    columnState: any[]
    filterState: Record<string, any>
    sortState: any[]
    paginationState: Record<string, any>
    selectionState: any[]
    expandedState: any[]
}

/**
 * Configuration des thèmes
 */
export interface ThemeConfig {
    light: string
    dark: string
    compact: string
}

/**
 * Paramètres de pagination
 */
export interface PaginationParams {
    page: number
    pageSize: number
    sort?: any
    filter?: any
}

/**
 * Paramètres d'analytics
 */
export interface AnalyticsEvent {
    action: string
    data: any
    timestamp: number
}
