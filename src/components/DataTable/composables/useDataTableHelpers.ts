/**
 * Helpers et utilitaires pour DataTable
 * Fonctions réutilisables pour le mapping, la validation et la transformation des données
 */

/**
 * Mappe les champs frontend vers les champs backend Django
 * @param frontendField - Nom du champ côté frontend
 * @returns Nom du champ côté backend (avec __ pour les relations)
 */
export function mapFrontendFieldToBackend(frontendField: string): string {
    const fieldMap: Record<string, string> = {
        // Articles
        'article_code_article': 'article__code_article',
        'article_designation': 'article__designation',
        'article_prix_achat': 'article__prix_achat',
        'article_fournisseur': 'article__fournisseur',
        'article_categorie': 'article__categorie',
        'article_produit': 'article__produit',
        'article_date_achat': 'article__date_achat',
        'article_date_reception': 'article__date_reception',
        'article_qte': 'article__qte',
        'article_qte_recue': 'article__qte_recue',
        'article_N_facture': 'article__N_facture',
        'article_statut': 'article__statut',

        // Items
        'emplacement': 'emplacement',
        'affectation_personne_full_name': 'affectation_personne_full_name',
        'zone': 'zone',
        'departement': 'departement',
        'statut': 'statut',
        'date_affectation': 'date_affectation',
        'valeur_residuelle': 'valeur_residuelle',
        'tag': 'tag',
        'numero_serie': 'numero_serie',
        'archive': 'archive',
        'produit_categorie': 'produit_categorie',
        'commentaire': 'commentaire',

        // Produits
        'code': 'code',
        'designation': 'designation',
        'libelle': 'libelle',
        'prix_achat': 'prix_achat',
        'date_achat': 'date_achat',
        'date_reception': 'date_reception',
        'qte': 'qte',
        'qte_recue': 'qte_recue',
        'N_facture': 'N_facture',

        // Fournisseurs
        'nom': 'nom',
        'email': 'email',
        'telephone': 'telephone',
        'adresse': 'adresse',

        // Inventory
        'reference': 'reference',
        'nom_inventaire': 'nom',
        'date_creation': 'date_creation',
        'operateur': 'operateur',
        'etat': 'etat'
    };

    return fieldMap[frontendField] || frontendField;
}

/**
 * Mappe les opérateurs du DataTable vers les opérateurs Django ORM
 * @param dataTableOperator - Opérateur du DataTable
 * @returns Opérateur Django correspondant
 */
export function mapDataTableOperatorToBackend(dataTableOperator: string): string {
    const operatorMap: Record<string, string> = {
        // Opérateurs texte
        'equals': 'exact',
        'not_equals': 'ne',
        'contains': 'contains',
        'not_contains': 'not_contains',
        'starts_with': 'startswith',
        'ends_with': 'endswith',
        'is_empty': 'isnull',
        'is_not_empty': 'isnotnull',

        // Opérateurs numériques
        'greater_than': 'gt',
        'less_than': 'lt',
        'greater_equal': 'gte',
        'less_equal': 'lte',
        'between': 'between',

        // Opérateurs de liste
        'in': 'in',
        'not_in': 'not_in',

        // Opérateurs null
        'is_null': 'isnull',
        'is_not_null': 'isnotnull'
    };

    return operatorMap[dataTableOperator] || 'contains';
}

/**
 * Extrait l'opérateur et la valeur d'un filtre du DataTable
 * @param filter - Filtre du DataTable
 * @returns Objet contenant l'opérateur et la(les) valeur(s)
 */
export function extractFilterOperatorAndValue(filter: any): { operator: string; value: any; value2?: any } {
    if (!filter) {
        return { operator: 'contains', value: '' };
    }

    const operator = filter.operator || 'contains';
    let value = filter.value;

    // Gestion des filtres de type liste
    if (filter.values && Array.isArray(filter.values) && filter.values.length > 0) {
        value = filter.values;
    }

    // Gestion des filtres de type range (between)
    const value2 = filter.value2;

    return {
        operator,
        value,
        ...(value2 !== undefined && { value2 })
    };
}

/**
 * Valide et normalise une valeur de filtre
 * @param value - Valeur à valider
 * @param type - Type de données attendu
 * @returns Valeur normalisée ou null si invalide
 */
export function normalizeFilterValue(value: any, type: 'string' | 'number' | 'date' = 'string'): any {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    switch (type) {
        case 'number': {
            const numValue = parseFloat(value.toString());
            return isNaN(numValue) ? null : numValue;
        }
        case 'date': {
            const dateValue = new Date(value);
            return isNaN(dateValue.getTime()) ? null : value;
        }
        case 'string':
        default:
            return value.toString().trim();
    }
}

/**
 * Construit les paramètres URL au format DataTable
 * @param params - Paramètres de pagination, tri, recherche et filtres
 * @returns URLSearchParams configuré
 */
export function buildDataTableParams(params: {
    page: number;
    pageSize: number;
    search?: string;
    sortModel?: Array<{ field: string; direction: 'asc' | 'desc' }>;
    filters?: Record<string, any>;
}): URLSearchParams {
    const urlParams = new URLSearchParams();

    // Paramètres de base DataTable
    urlParams.append('draw', '1');
    urlParams.append('start', ((params.page - 1) * params.pageSize).toString());
    urlParams.append('length', params.pageSize.toString());
    urlParams.append('search[value]', params.search || '');
    urlParams.append('search[regex]', 'false');

    // Ajouter le tri si présent
    if (params.sortModel && params.sortModel.length > 0) {
        const sort = params.sortModel[0];
        urlParams.append('order[0][column]', '0');
        urlParams.append('order[0][dir]', sort.direction);
    }

    // Ajouter les filtres
    if (params.filters) {
        Object.keys(params.filters).forEach((key) => {
            const filter = params.filters![key];
            if (filter && filter.value !== undefined && filter.value !== '') {
                const operator = filter.operator || 'contains';
                const paramName = `${key}_${operator}`;

                if (filter.value2 !== undefined) {
                    // Filtre range (between)
                    urlParams.append(`${key}_gte`, filter.value.toString());
                    urlParams.append(`${key}_lte`, filter.value2.toString());
                } else if (Array.isArray(filter.value)) {
                    // Filtre liste (in, not_in)
                    filter.value.forEach((val: any) => {
                        urlParams.append(`${key}_${operator}`, val.toString());
                    });
                } else {
                    // Filtre standard
                    urlParams.append(paramName, filter.value.toString());
                }
            }
        });
    }

    return urlParams;
}

/**
 * Transforme les filtres du DataTable vers le format backend
 * @param newFilters - Filtres du DataTable
 * @returns Filtres transformés pour le backend
 */
export function transformDataTableFilters(newFilters: Record<string, any>): Record<string, any> {
    const transformedFilters: Record<string, any> = {};

    Object.keys(newFilters).forEach(field => {
        const filter = newFilters[field];

        if (filter && (filter.value !== undefined || filter.values !== undefined)) {
            const operator = filter.operator || 'contains';
            let value = filter.value;

            // Gestion des différents types de filtres
            if (filter.values && Array.isArray(filter.values) && filter.values.length > 0) {
                // Filtres de type liste
                value = filter.values;
            } else if (filter.value2 !== undefined) {
                // Filtres de type range (between)
                transformedFilters[field] = {
                    operator: 'between',
                    value: filter.value,
                    value2: filter.value2
                };
                return;
            } else if (value === undefined || value === null || value === '') {
                // Filtre vide, ne pas l'ajouter
                return;
            }

            // Mapper l'opérateur et le champ
            const backendOperator = mapDataTableOperatorToBackend(operator);
            const backendField = mapFrontendFieldToBackend(field);

            // Créer le filtre transformé
            transformedFilters[backendField] = {
                operator: backendOperator,
                value: value
            };
        }
    });

    return transformedFilters;
}

/**
 * Met à jour totalItems et totalPages à partir de la réponse backend
 * @param result - Résultat de l'action Vuex
 * @param totalItemsRef - Référence réactive pour totalItems
 * @param totalPagesRef - Référence réactive pour totalPages
 * @param pageSize - Taille de la page actuelle
 */
export function updatePaginationFromResult(
    result: any,
    totalItemsRef: { value: number },
    totalPagesRef: { value: number },
    pageSize: number
): void {
    if (result) {
        const filteredCount = result.recordsFiltered || result.totalRows || result.recordsTotal || 0;
        totalItemsRef.value = filteredCount;
        totalPagesRef.value = Math.ceil(filteredCount / pageSize);
    }
}

/**
 * Factory pour créer un handler de pagination standard
 * @param config - Configuration du handler
 */
export function createPaginationHandler(config: {
    store: any;
    moduleName: string;
    actionName: string;
    totalItems: { value: number };
    totalPages: { value: number };
    backendPagination: any;
    backendSearchQuery: any;
    backendSortModel: any;
    backendFilters: any;
    backendSetPage: (page: number) => void;
    backendSetPageSize: (size: number) => void;
}) {
    return async (params: { page: number; pageSize: number }) => {
        config.backendSetPage(params.page);
        config.backendSetPageSize(params.pageSize);

        const urlParams = buildDataTableParams({
            page: params.page,
            pageSize: params.pageSize,
            search: config.backendSearchQuery.value,
            sortModel: config.backendSortModel.value,
            filters: config.backendFilters.value
        });

        const url = `?${urlParams.toString()}`;
        const result = await config.store.dispatch(`${config.moduleName}/${config.actionName}`, url);

        updatePaginationFromResult(result, config.totalItems, config.totalPages, params.pageSize);
    };
}

/**
 * Factory pour créer un handler de tri standard
 */
export function createSortHandler(config: {
    store: any;
    moduleName: string;
    actionName: string;
    totalItems: { value: number };
    totalPages: { value: number };
    backendPagination: any;
    backendSearchQuery: any;
    backendFilters: any;
    backendSetSortModel: (model: any) => void;
}) {
    return async (sortModel: Array<{ field: string; direction: 'asc' | 'desc' }>) => {
        config.backendSetSortModel(sortModel);

        const urlParams = buildDataTableParams({
            page: config.backendPagination.value.current_page,
            pageSize: config.backendPagination.value.page_size,
            search: config.backendSearchQuery.value,
            sortModel: sortModel,
            filters: config.backendFilters.value
        });

        const url = `?${urlParams.toString()}`;
        const result = await config.store.dispatch(`${config.moduleName}/${config.actionName}`, url);

        updatePaginationFromResult(result, config.totalItems, config.totalPages, config.backendPagination.value.page_size);
    };
}

/**
 * Factory pour créer un handler de filtres standard
 */
export function createFilterHandler(config: {
    store: any;
    moduleName: string;
    actionName: string;
    totalItems: { value: number };
    totalPages: { value: number };
    backendPagination: any;
    backendSearchQuery: any;
    backendSortModel: any;
    backendSetFilters: (filters: any) => void;
    backendSetPage: (page: number) => void;
}) {
    return async (newFilters: Record<string, any>) => {
        const transformedFilters = transformDataTableFilters(newFilters);
        config.backendSetFilters(transformedFilters);
        config.backendSetPage(1); // Retour à la page 1

        const urlParams = buildDataTableParams({
            page: 1,
            pageSize: config.backendPagination.value.page_size,
            search: config.backendSearchQuery.value,
            sortModel: config.backendSortModel.value,
            filters: transformedFilters
        });

        const url = `?${urlParams.toString()}`;
        const result = await config.store.dispatch(`${config.moduleName}/${config.actionName}`, url);

        updatePaginationFromResult(result, config.totalItems, config.totalPages, config.backendPagination.value.page_size);
    };
}

/**
 * Factory pour créer un handler de réinitialisation des filtres
 */
export function createResetFiltersHandler(config: {
    store: any;
    moduleName: string;
    actionName: string;
    totalItems: { value: number };
    totalPages: { value: number };
    backendPagination: any;
    backendSearchQuery: any;
    backendSortModel: any;
    backendResetFilters: () => void;
    backendSetPage: (page: number) => void;
}) {
    return async () => {
        config.backendResetFilters();
        config.backendSetPage(1);

        // Recharger les données sans filtres
        const urlParams = buildDataTableParams({
            page: 1,
            pageSize: config.backendPagination.value.page_size,
            search: config.backendSearchQuery.value,
            sortModel: config.backendSortModel.value,
            filters: {} // Filtres vides
        });

        const url = `?${urlParams.toString()}`;
        const result = await config.store.dispatch(`${config.moduleName}/${config.actionName}`, url);

        updatePaginationFromResult(result, config.totalItems, config.totalPages, config.backendPagination.value.page_size);
    };
}

