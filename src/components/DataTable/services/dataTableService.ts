/**
 * Service de transformation DataTable pour la communication backend
 * 
 * Ce service transforme les paramètres frontend vers les formats attendus
 * par le backend Django DataTable et REST API.
 */

// Types pour les requêtes DataTable
export interface DataTableRequest {
  // Paramètres de base DataTable
  draw: number;                    // Numéro de dessin (timestamp recommandé)
  start: number;                   // Index de début (0-based)
  length: number;                  // Nombre d'éléments par page
  
  // Recherche globale
  'search[value]': string;         // Terme de recherche
  'search[regex]': boolean;        // Recherche regex (généralement false)
  
  // Tri (support multi-colonnes)
  'order[0][column]': number;      // Index de la colonne (0-based)
  'order[0][dir]': 'asc' | 'desc'; // Direction du tri
  'order[1][column]': number;      // Tri secondaire (optionnel)
  'order[1][dir]': 'asc' | 'desc';
  // ... jusqu'à order[N]
  
  // Colonnes individuelles
  'columns[0][data]': string;      // Nom du champ
  'columns[0][name]': string;      // Nom de la colonne
  'columns[0][searchable]': boolean;
  'columns[0][orderable]': boolean;
  'columns[0][search][value]': string;
  'columns[0][search][regex]': boolean;
  // ... pour chaque colonne
  
  // Filtres personnalisés
  [key: string]: any;              // Filtres métier personnalisés
}

// Types pour les requêtes REST API
export interface RestApiRequest {
  page: number;                    // Numéro de page (1-based)
  page_size: number;               // Taille de page
  search: string;                  // Recherche globale
  ordering: string;                // Tri (ex: 'name' ou '-name')
  
  // Filtres personnalisés
  [key: string]: any;
}

// Types pour les réponses
export interface DataTableResponse<T = any> {
  draw: number;                    // Même valeur que la requête
  recordsTotal: number;            // Nombre total d'enregistrements
  recordsFiltered: number;         // Nombre après filtrage
  data: T[];                       // Données sérialisées
  
  // Informations de pagination (optionnel)
  pagination?: {
    current_page: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
    page_size: number;
  };
  
  // Gestion d'erreurs
  error?: string;                  // Message d'erreur si applicable
}

export interface RestApiResponse<T = any> {
  count: number;                   // Nombre total d'enregistrements
  results: T[];                    // Données sérialisées
  
  // Navigation
  next: string | null;             // URL page suivante
  previous: string | null;         // URL page précédente
  
  // Informations de pagination (optionnel)
  pagination?: {
    current_page: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
    page_size: number;
  };
}

// Types pour les paramètres frontend
export interface FrontendParams {
  page: number;
  pageSize: number;
  search?: string;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  filters?: Record<string, any>;
  columns?: Array<{ field: string; searchable: boolean; orderable: boolean }>;
}

// Types pour les filtres backend
export interface BackendFilters {
  // Filtres de texte
  field_contains?: string;         // field__icontains
  field_startswith?: string;       // field__startswith
  field_endswith?: string;         // field__endswith
  field_exact?: string;            // field__exact
  field_iexact?: string;           // field__iexact
  field_regex?: string;            // field__regex
  field_iregex?: string;           // field__iregex
  
  // Filtres numériques
  field_gte?: number;              // field__gte
  field_lte?: number;              // field__lte
  field_gt?: number;               // field__gt
  field_lt?: number;               // field__lt
  field_range?: string;            // field__gte + field__lte (format: "min,max")
  
  // Filtres de date
  field_date?: string;             // field__date (YYYY-MM-DD)
  field_year?: number;             // field__year
  field_month?: number;            // field__month
  field_day?: number;              // field__day
  field_week?: number;             // field__week
  field_quarter?: number;          // field__quarter
  
  // Filtres de liste
  field_in?: string;               // field__in (valeurs séparées par virgules)
  field_not_in?: string;           // field__isnull=false + field__in
  
  // Filtres de nullité
  field_isnull?: boolean;          // field__isnull
  field_isempty?: boolean;         // field__isempty (pour les chaînes)
  
  // Filtres de plage de dates
  field_start?: string;            // field__gte (date de début)
  field_end?: string;              // field__lte (date de fin)
  
  // Filtres personnalisés
  [key: string]: any;
}

/**
 * Service de transformation DataTable
 */
export class DataTableService {
  /**
   * Transforme les paramètres frontend vers le format backend DataTable
   */
  static toDataTableParams(frontendParams: FrontendParams): DataTableRequest {
    const params: any = {
      draw: Date.now(),
      start: (frontendParams.page - 1) * frontendParams.pageSize,
      length: frontendParams.pageSize,
      'search[value]': frontendParams.search || '',
      'search[regex]': false
    };

    // Tri
    if (frontendParams.sort && frontendParams.sort.length > 0) {
      frontendParams.sort.forEach((sort, index) => {
        params[`order[${index}][column]`] = this.getColumnIndex(sort.field, frontendParams.columns);
        params[`order[${index}][dir]`] = sort.direction;
      });
    }

    // Colonnes
    if (frontendParams.columns) {
      frontendParams.columns.forEach((column, index) => {
        params[`columns[${index}][data]`] = column.field;
        params[`columns[${index}][name]`] = column.field;
        params[`columns[${index}][searchable]`] = column.searchable;
        params[`columns[${index}][orderable]`] = column.orderable;
        params[`columns[${index}][search][value]`] = '';
        params[`columns[${index}][search][regex]`] = false;
      });
    }

    // Filtres personnalisés
    if (frontendParams.filters) {
      Object.assign(params, this.transformFilters(frontendParams.filters));
    }

    return params;
  }

  /**
   * Transforme les paramètres frontend vers le format REST API
   */
  static toRestApiParams(frontendParams: FrontendParams): RestApiRequest {
    const params: any = {
      page: frontendParams.page,
      page_size: frontendParams.pageSize
    };

    if (frontendParams.search) {
      params.search = frontendParams.search;
    }

    if (frontendParams.sort && frontendParams.sort.length > 0) {
      params.ordering = frontendParams.sort
        .map(sort => sort.direction === 'desc' ? `-${sort.field}` : sort.field)
        .join(',');
    }

    if (frontendParams.filters) {
      Object.assign(params, this.transformFilters(frontendParams.filters));
    }

    return params;
  }

  /**
   * Transforme les filtres frontend vers le format backend
   */
  private static transformFilters(filters: Record<string, any>): Record<string, any> {
    const backendFilters: Record<string, any> = {};

    Object.keys(filters).forEach(field => {
      const filter = filters[field];
      
      if (!filter || filter.value === undefined || filter.value === null || filter.value === '') {
        return;
      }

            switch (filter.operator) {
                case 'contains':
          backendFilters[`${field}_contains`] = filter.value;
          break;
        case 'startswith':
          backendFilters[`${field}_startswith`] = filter.value;
          break;
        case 'endswith':
          backendFilters[`${field}_endswith`] = filter.value;
          break;
        case 'exact':
          backendFilters[`${field}_exact`] = filter.value;
          break;
        case 'iexact':
          backendFilters[`${field}_iexact`] = filter.value;
          break;
        case 'regex':
          backendFilters[`${field}_regex`] = filter.value;
          break;
        case 'iregex':
          backendFilters[`${field}_iregex`] = filter.value;
          break;
        case 'gte':
          backendFilters[`${field}_gte`] = filter.value;
          break;
        case 'lte':
          backendFilters[`${field}_lte`] = filter.value;
          break;
        case 'gt':
          backendFilters[`${field}_gt`] = filter.value;
          break;
        case 'lt':
          backendFilters[`${field}_lt`] = filter.value;
          break;
                case 'between':
          if (filter.value2 !== undefined) {
            backendFilters[`${field}_gte`] = filter.value;
            backendFilters[`${field}_lte`] = filter.value2;
          }
          break;
        case 'range':
          if (typeof filter.value === 'string' && filter.value.includes(',')) {
            backendFilters[`${field}_range`] = filter.value;
          }
          break;
        case 'in':
          if (Array.isArray(filter.values)) {
            backendFilters[`${field}_in`] = filter.values.join(',');
          }
          break;
        case 'not_in':
          if (Array.isArray(filter.values)) {
            backendFilters[`${field}_not_in`] = filter.values.join(',');
          }
          break;
        case 'isnull':
          backendFilters[`${field}_isnull`] = filter.value;
          break;
        case 'isempty':
          backendFilters[`${field}_isempty`] = filter.value;
          break;
        case 'date':
          backendFilters[`${field}_date`] = filter.value;
          break;
        case 'year':
          backendFilters[`${field}_year`] = filter.value;
          break;
        case 'month':
          backendFilters[`${field}_month`] = filter.value;
          break;
        case 'day':
          backendFilters[`${field}_day`] = filter.value;
          break;
        case 'week':
          backendFilters[`${field}_week`] = filter.value;
          break;
        case 'quarter':
          backendFilters[`${field}_quarter`] = filter.value;
          break;
        case 'date_range':
          if (filter.start) backendFilters[`${field}_start`] = filter.start;
          if (filter.end) backendFilters[`${field}_end`] = filter.end;
          break;
                default:
          // Filtre direct si pas d'opérateur spécifique
          backendFilters[field] = filter.value;
      }
    });

    return backendFilters;
  }

  /**
   * Obtient l'index de colonne pour le tri DataTable
   */
  private static getColumnIndex(field: string, columns?: Array<{ field: string }>): number {
    if (!columns) return 0;
    const index = columns.findIndex(col => col.field === field);
    return index >= 0 ? index : 0;
  }

  /**
   * Construit une URL avec les paramètres de requête
   */
  static buildUrl(endpoint: string, params: Record<string, any>): string {
    // Si l'endpoint est déjà une URL complète, l'utiliser directement
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      const url = new URL(endpoint);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          url.searchParams.append(key, String(params[key]));
        }
      });
      return url.toString();
    }
    
    // Sinon, construire l'URL relative
    const url = new URL(endpoint, window.location.origin);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        url.searchParams.append(key, String(params[key]));
      }
    });
    return url.toString();
  }

  /**
   * Valide la réponse du backend
   */
  static validateResponse(response: any): boolean {
    if (!response) return false;
    
    // Validation pour DataTable
    if (response.draw !== undefined) {
      return response.recordsTotal !== undefined && Array.isArray(response.data);
    }
    
    // Validation pour REST API
    if (response.count !== undefined) {
      return Array.isArray(response.results);
    }
    
    return false;
  }

  /**
   * Extrait les données de la réponse selon le format
   */
  static extractData<T>(response: any, isDataTableFormat: boolean): T[] {
    if (isDataTableFormat) {
      return response.data || [];
    } else {
      return response.results || [];
    }
  }

  /**
   * Extrait le nombre total d'éléments de la réponse
   */
  static extractTotalCount(response: any, isDataTableFormat: boolean): number {
    if (isDataTableFormat) {
      return response.recordsTotal || 0;
    } else {
      return response.count || 0;
    }
  }
}