/**
 * QueryModel - Modèle de requête unifié pour DataTable
 * 
 * Modèle de requête standardisé pour tri et filtrage
 * Encapsule tous les paramètres de requête (tri, filtres, pagination, recherche)
 */

/**
 * Modèle de tri multi-colonnes
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
 * Modèle de filtre par colonne
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
 * QueryModel - Modèle de requête unifié pour DataTable
 * 
 * Format standard utilisé par le DataTable pour tous les événements
 * (pagination, tri, filtres, recherche).
 * 
 * Le QueryModel est converti vers query params GET pour les appels API.
 * 
 * Format :
 * - page, pageSize directement (pas pagination.page/pageSize)
 * - search (pas globalSearch, mais globalSearch accepté pour compatibilité)
 * - sort avec colId et sort : [{ colId: "field", sort: "asc" }]
 * - filters avec format unifié : { field: { operator, value, values, ... } }
 * 
 * @example
 * ```typescript
 * const queryModel: QueryModel = {
 *   page: 2,
 *   pageSize: 20,
 *   search: "terme de recherche",
 *   sort: [{ colId: "name", sort: "asc" }],
 *   filters: {
 *     status: { operator: "equals", value: "active" },
 *     date: { operator: "between", value: "2024-01-01", value2: "2024-12-31" }
 *   },
 *   customParams: { accountId: 123 }
 * }
 * ```
 */
export interface QueryModel {
    /** Numéro de page (commence à 1, conforme PAGINATION_FRONTEND.md) */
    page?: number
    
    /** Nombre d'éléments par page (conforme PAGINATION_FRONTEND.md) */
    pageSize?: number
    
    /** 
     * Modèle de tri (multi-colonnes supporté)
     * Format: [{ colId: "field", sort: "asc" | "desc" }]
     */
    sort?: Array<{ colId: string; sort: 'asc' | 'desc' }>
    
    /** 
     * Modèle de filtres par champ
     * Format unifié : { field: { operator, value, values, dataType, ... } }
     */
    filters?: Record<string, any>
    
    /** Terme de recherche globale (conforme PAGINATION_FRONTEND.md) */
    search?: string
    
    /** Paramètres personnalisés additionnels (passés directement dans la requête API) */
    customParams?: Record<string, any>
    
    /** 
     * @deprecated Utiliser page/pageSize directement
     * Format de pagination déprécié (supporté pour compatibilité)
     */
    pagination?: {
        page: number
        pageSize: number
    }
    
    /** 
     * @deprecated Utiliser search
     * Alias de search (supporté pour compatibilité)
     */
    globalSearch?: string
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

