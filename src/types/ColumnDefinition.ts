/**
 * Types pour la définition des colonnes du DataTable
 */

export type ColumnDataType =
    | 'text'
    | 'number'
    | 'date'
    | 'datetime'
    | 'boolean'
    | 'select'
    | 'email'
    | 'url'
    | 'phone'
    | 'currency'
    | 'percentage'
    | 'file'
    | 'image'
    | 'color'
    | 'json'
    | 'array'
    | 'object'
    | 'textarea'

export type FilterOperator =
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'not_contains'
    | 'starts_with'
    | 'ends_with'
    | 'greater_than'
    | 'less_than'
    | 'greater_equal'
    | 'less_equal'
    | 'between'
    | 'in'
    | 'not_in'
    | 'is_null'
    | 'is_not_null'
    | 'is_empty'
    | 'is_not_empty'
    | 'regex'
    | 'custom'

export interface FilterConfig {
    dataType: ColumnDataType
    operator: FilterOperator
    value?: any
    value2?: any
    values?: any[]
    options?: Array<{ label: string; value: any; disabled?: boolean }>
    regex?: string
    customFilter?: (value: any, filterValue: any) => boolean
    placeholder?: string
    validation?: {
        min?: number
        max?: number
        pattern?: string
        required?: boolean
    }
}

export interface ColumnDefinition<T = Record<string, unknown>> {
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
    /** Formateur personnalisé */
    valueFormatter?: (params: any) => string
    /** Formateur personnalisé pour l'édition */
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
        title?: string
        columns?: ColumnDefinition[]
    }
}

export interface ColumnGroup {
    /** ID du groupe */
    id: string
    /** Nom du groupe */
    name: string
    /** Colonnes du groupe */
    columns: string[]
    /** Ordre d'affichage */
    order?: number
    /** Groupe collapsible */
    collapsible?: boolean
    /** Groupe par défaut développé */
    expanded?: boolean
}

export interface ColumnState {
    /** Colonnes visibles */
    visibleColumns: string[]
    /** Ordre des colonnes */
    columnOrder: string[]
    /** Largeurs des colonnes */
    columnWidths: Record<string, number>
    /** Groupes de colonnes */
    columnGroups: ColumnGroup[]
}

export type ColumnDefinitionAny = ColumnDefinition<Record<string, unknown>>
