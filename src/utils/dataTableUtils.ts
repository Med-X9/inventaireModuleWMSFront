/**
 * Utilitaires DataTable réutilisables
 * Évite la duplication de code pour la gestion des paramètres DataTable
 */

// Interface pour les paramètres d'entrée DataTable
export interface DataTableParams {
    page?: number;
    pageSize?: number;
    globalSearch?: string;
    sort?: Array<{
        colId: string;
        sort: 'asc' | 'desc';
    }>;
    filter?: Record<string, {
        value: any;
        operator?: string;
    }>;
    filters?: Record<string, {
        value: any;
        operator?: string;
    }>; // Support des deux formats
}

// Interface pour la réponse DataTable standard
export interface DataTableResponse<T> {
    draw: number;
    recordsTotal: number;
    recordsFiltered: number;
    data: T[];
}

/**
 * Construit les paramètres DataTable standard à partir des paramètres d'entrée
 * @param params - Paramètres d'entrée
 * @param draw - Numéro de dessin (par défaut: 1)
 * @returns URLSearchParams prêts pour l'API
 */
export function buildDataTableParams(
    params: DataTableParams,
    draw: number = 1
): URLSearchParams {
    const queryParams = new URLSearchParams();

    // Paramètres de base DataTable
    queryParams.append('draw', draw.toString());
    queryParams.append('start', (((params.page || 1) - 1) * (params.pageSize || 20)).toString());
    queryParams.append('length', (params.pageSize || 20).toString());
    queryParams.append('search[value]', params.globalSearch || '');
    queryParams.append('search[regex]', 'false');

    // Ajouter le tri au format DataTable
    if (params.sort && params.sort.length > 0) {
        const sort = params.sort[0];
        queryParams.append('order[0][column]', '0');
        queryParams.append('order[0][dir]', sort.sort);
    }

    // Ajouter les filtres au format DataTable
    if (params.filter) {
        Object.keys(params.filter).forEach((key) => {
            const filter = params.filter![key];
            if (filter && filter.value !== undefined && filter.value !== '') {
                const operator = filter.operator || 'contains';
                const paramName = `${key}_${operator}`;
                queryParams.append(paramName, filter.value.toString());
            }
        });
    }

    return queryParams;
}

/**
 * Traite la réponse DataTable et met à jour la pagination
 * @param response - Réponse de l'API au format DataTable
 * @param currentPage - Page actuelle (ref)
 * @param totalPages - Nombre total de pages (ref)
 * @param totalItems - Nombre total d'éléments (ref)
 * @param pageSize - Taille de page
 * @returns Données formatées pour useBackendDataTable
 */
export function processDataTableResponse<T>(
    response: DataTableResponse<T>,
    currentPage: { value: number },
    totalPages: { value: number },
    totalItems: { value: number },
    pageSize: number
): DataTableResponse<T> {
    const recordsTotal = response.recordsTotal || 0;
    const recordsFiltered = response.recordsFiltered || 0;
    const data = response.data || [];

    // Mettre à jour la pagination avec recordsFiltered
    totalItems.value = recordsFiltered;
    totalPages.value = Math.max(1, Math.ceil(recordsFiltered / pageSize));

    // Vérifier les limites de page
    if (currentPage.value > totalPages.value) {
        currentPage.value = totalPages.value;
    }
    if (currentPage.value < 1) {
        currentPage.value = 1;
    }

    // Retourner les données au format DataTable
    return {
        draw: response.draw,
        recordsTotal: recordsFiltered,     // Utiliser recordsFiltered partout
        recordsFiltered: recordsFiltered,  // Nombre d'éléments après filtrage
        data: data
    };
}

/**
 * Construit les paramètres de tri pour DataTable
 * @param sortModel - Modèle de tri
 * @returns Paramètres de tri formatés
 */
export function buildSortParams(sortModel: Array<{
    colId: string;
    sort: 'asc' | 'desc';
}>): Record<string, string> {
    const sortParams: Record<string, string> = {};

    if (sortModel && sortModel.length > 0) {
        const sort = sortModel[0];
        sortParams['order[0][column]'] = '0';
        sortParams['order[0][dir]'] = sort.sort;
    }

    return sortParams;
}

/**
 * Construit les paramètres de filtres pour DataTable
 * @param filterModel - Modèle de filtres
 * @returns Paramètres de filtres formatés
 */
export function buildFilterParams(filterModel: Record<string, {
    value: any;
    operator?: string;
}>): Record<string, string> {
    const filterParams: Record<string, string> = {};

    if (filterModel) {
        Object.keys(filterModel).forEach((key) => {
            const filter = filterModel[key];
            if (filter && filter.value !== undefined && filter.value !== '') {
                const operator = filter.operator || 'contains';
                const paramName = `${key}_${operator}`;
                filterParams[paramName] = filter.value.toString();
            }
        });
    }

    return filterParams;
}

/**
 * Valide une réponse DataTable
 * @param response - Réponse à valider
 * @returns true si la réponse est valide
 */
export function validateDataTableResponse(response: any): response is DataTableResponse<any> {
    return (
        response &&
        typeof response === 'object' &&
        typeof response.draw === 'number' &&
        typeof response.recordsTotal === 'number' &&
        typeof response.recordsFiltered === 'number' &&
        Array.isArray(response.data)
    );
}

/**
 * Crée une réponse DataTable vide
 * @param draw - Numéro de dessin
 * @returns Réponse DataTable vide
 */
export function createEmptyDataTableResponse<T>(draw: number = 1): DataTableResponse<T> {
    return {
        draw,
        recordsTotal: 0,
        recordsFiltered: 0,
        data: []
    };
}

/**
 * Calcule les métriques de pagination
 * @param recordsFiltered - Nombre d'éléments filtrés
 * @param pageSize - Taille de page
 * @param currentPage - Page actuelle
 * @returns Métriques de pagination
 */
export function calculatePaginationMetrics(
    recordsFiltered: number,
    pageSize: number,
    currentPage: number
) {
    const totalPages = Math.max(1, Math.ceil(recordsFiltered / pageSize));
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, recordsFiltered);

    return {
        totalPages,
        startIndex,
        endIndex,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
        totalItems: recordsFiltered
    };
}
