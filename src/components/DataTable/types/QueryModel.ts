/**
 * QueryModel - Modèle de requête unifié pour DataTable
 * 
 * Équivalent à sortModel et filterModel d'AG-Grid
 * Encapsule tous les paramètres de requête (tri, filtres, pagination, recherche)
 */

/**
 * Modèle de tri (équivalent sortModel AG-Grid)
 */
export interface SortModel {
    /** Nom du champ à trier */
    field: string
    /** Direction du tri */
    direction: 'asc' | 'desc'
    /** Priorité du tri (pour tri multi-colonnes) */
    priority?: number
}

/**
 * Opérateur de filtre
 */
export type FilterOperator =
    | 'equals'           // Égal à
    | 'not_equals'       // Différent de
    | 'contains'         // Contient
    | 'not_contains'     // Ne contient pas
    | 'starts_with'      // Commence par
    | 'ends_with'        // Termine par
    | 'greater_than'     // Supérieur à
    | 'less_than'        // Inférieur à
    | 'greater_equal'    // Supérieur ou égal
    | 'less_equal'       // Inférieur ou égal
    | 'between'          // Entre deux valeurs
    | 'in'               // Dans une liste
    | 'not_in'           // Pas dans une liste
    | 'is_null'          // Est null
    | 'is_not_null'      // N'est pas null
    | 'is_empty'         // Est vide
    | 'is_not_empty'     // N'est pas vide
    | 'regex'            // Expression régulière

/**
 * Modèle de filtre (équivalent filterModel AG-Grid)
 */
export interface FilterModel {
    /** Nom du champ à filtrer */
    field: string
    /** Type de données du champ */
    dataType: 'text' | 'number' | 'date' | 'datetime' | 'boolean' | 'select'
    /** Opérateur de filtre */
    operator: FilterOperator
    /** Valeur du filtre */
    value?: any
    /** Valeur secondaire (pour les filtres 'between') */
    value2?: any
    /** Liste de valeurs (pour les filtres 'in', 'not_in') */
    values?: any[]
    /** Expression régulière (pour les filtres 'regex') */
    regex?: string
}

/**
 * QueryModel - Modèle de requête complet
 * 
 * Encapsule tous les paramètres nécessaires pour une requête DataTable :
 * - Tri (sortModel)
 * - Filtres (filterModel)
 * - Pagination
 * - Recherche globale
 */
export interface QueryModel {
    /** Modèle de tri (multi-colonnes supporté) */
    sort?: SortModel[]
    
    /** Modèle de filtres (par champ) */
    filters?: Record<string, FilterModel>
    
    /** Pagination */
    pagination?: {
        /** Numéro de page (commence à 1) */
        page: number
        /** Taille de page */
        pageSize: number
    }
    
    /** Recherche globale */
    globalSearch?: string
    
    /** Paramètres personnalisés additionnels */
    customParams?: Record<string, any>
}

/**
 * Options pour la conversion de QueryModel
 */
export interface QueryModelConversionOptions {
    /** Mapping des noms de champs vers les index de colonnes */
    fieldToColumnIndex?: Record<string, number>
    
    /** Liste des colonnes dans l'ordre d'affichage */
    columns?: Array<{ field: string; [key: string]: any }>
    
    /** Numéro de draw (pour synchronisation) */
    draw?: number
}

/**
 * Résultat d'une requête avec QueryModel
 */
export interface QueryModelResponse<T = any> {
    /** Données retournées */
    data: T[]
    
    /** Nombre total d'éléments (avant filtrage) */
    recordsTotal: number
    
    /** Nombre d'éléments après filtrage */
    recordsFiltered: number
    
    /** Informations de pagination */
    pagination?: {
        currentPage: number
        pageSize: number
        totalPages: number
        hasNext: boolean
        hasPrevious: boolean
    }
}

