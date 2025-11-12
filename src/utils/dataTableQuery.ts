// Utilitaire pour convertir les filtres et le tri en query params Django
export function buildQueryParams(params: {
    sort?: Array<{ colId: string; sort: 'asc' | 'desc' }>,
    filter?: Record<string, any>, // Changé pour accepter les filtres déjà transformés
    page?: number,
    pageSize?: number,
    globalSearch?: string
}) {
    const queryParams: any = {};

    // Tri
    if (params.sort && params.sort.length > 0) {
        const sortParams = params.sort.map(sort => {
            const field = sort.colId;
            const direction = sort.sort === 'asc' ? field : `-${field}`;
            return direction;
        });
        queryParams.ordering = sortParams.join(',');
    }

    // Filtres - Utiliser directement les filtres transformés
    if (params.filter && Object.keys(params.filter).length > 0) {
        Object.entries(params.filter).forEach(([field, value]) => {
            // Si la valeur est un tableau (pour les filtres multiple), la joindre
            if (Array.isArray(value)) {
                queryParams[field] = value.join(',');
            } else {
                queryParams[field] = value;
            }
        });
    }

    // Recherche globale
    if (params.globalSearch) {
        queryParams.search = params.globalSearch;
    }

    // Pagination
    if (params.pageSize) {
        queryParams.page_size = params.pageSize;
    }
    if (params.page) {
        queryParams.page = params.page;
    }

    return queryParams;
}
