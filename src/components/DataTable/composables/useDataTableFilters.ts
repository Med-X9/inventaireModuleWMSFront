import { ref, computed } from 'vue'

/**
 * Modèle de tri pour une colonne
 * Définit le champ et la direction du tri
 */
export interface SortModel {
    colId: string
    sort: 'asc' | 'desc'
}

/**
 * Modèle de filtre pour une colonne
 * Définit le type de filtre et ses valeurs
 */
export interface FilterModel {
    filter: string
    type?: string
    dateFrom?: string
    dateTo?: string
    filterTo?: string
}

/**
 * Paramètres complets pour une requête de DataTable
 * Inclut tous les paramètres nécessaires pour l'API
 */
export interface DataTableParams {
    sort?: SortModel[]
    filter?: Record<string, FilterModel>
    page?: number
    pageSize?: number
    globalSearch?: string
}

/**
 * État complet d'une DataTable
 * Utilisé pour la persistance et la restauration d'état
 */
export interface DataTableState {
    currentPage: number
    pageSize: number
    totalItems: number
    totalPages: number
    currentSortModel: SortModel[]
    currentFilterModel: Record<string, FilterModel>
    currentGlobalSearch: string
    loading: boolean
}

/**
 * Composable pour la gestion des filtres, tri et recherche de DataTable
 *
 * Ce composable centralise toute la logique de gestion des filtres :
 * - Conversion des formats de filtres
 * - Construction des paramètres de requête
 * - Handlers pour les événements de filtrage
 * - État réactif des filtres
 *
 * Fonctionnalités :
 * 1. Conversion automatique des formats de filtres
 * 2. Construction des paramètres d'API
 * 3. Gestion des opérateurs de filtrage
 * 4. Handlers pour tous les événements
 * 5. État réactif pour l'interface
 */
export function useDataTableFilters() {
    // ===== ÉTAT LOCAL =====

    /**
     * Modèle de tri actuel
     * Tableau des colonnes triées avec leur direction
     */
    const currentSortModel = ref<SortModel[]>([])

    /**
     * Modèle de filtre actuel
     * Objet avec les filtres par colonne
     */
    const currentFilterModel = ref<Record<string, FilterModel>>({})

    /**
     * Recherche globale actuelle
     * Terme de recherche appliqué à toutes les colonnes
     */
    const currentGlobalSearch = ref<string>('')

    /**
     * État de chargement
     * Indique si une requête est en cours
     */
    const loading = ref(false)

    // ===== FONCTIONS DE CONVERSION =====

    /**
     * Fonction générique pour convertir les filtres du nouveau format vers l'ancien
     *
     * Cette fonction gère la conversion entre différents formats de filtres :
     * - Format objet avec operator/value (nouveau)
     * - Format simple avec filter/type (ancien)
     *
     * Types de filtres supportés :
     * - equals : Égalité exacte
     * - contains : Contient le terme
     * - greaterThan/lessThan : Comparaisons numériques
     * - between : Entre deux valeurs (pour dates/nombres)
     * - inRange : Plage de valeurs
     *
     * @param filterModel - Modèle de filtre au nouveau format
     * @returns Modèle de filtre converti au format API
     */
    const convertFilterModel = (filterModel: Record<string, any>): Record<string, FilterModel> => {
        const convertedFilterModel: Record<string, FilterModel> = {}

        Object.entries(filterModel).forEach(([key, value]) => {
            if (value) {
                // Correction : opérateur 'between' (dates ou nombres)
                if (typeof value === 'object' && value.operator === 'between') {
                    if (value.value && value.value2) {
                        convertedFilterModel[key] = {
                            filter: String(value.value),
                            filterTo: String(value.value2),
                            type: 'inRange'
                        }
                    }
                } else if (typeof value === 'object' && value.value !== undefined) {
                    convertedFilterModel[key] = {
                        filter: String(value.value),
                        type: value.operator || 'equals'
                    }
                } else if (typeof value === 'object' && value.filter !== undefined) {
                    convertedFilterModel[key] = { filter: String(value.filter) }
                } else if (typeof value === 'string' && value !== '') {
                    convertedFilterModel[key] = { filter: value }
                } else if (typeof value === 'object' && value.operator) {
                    const filterValue = value.value || value.value2 || (value.values && value.values.join(','))
                    if (filterValue !== undefined && filterValue !== '') {
                        convertedFilterModel[key] = {
                            filter: String(filterValue),
                            type: value.operator
                        }
                    }
                }
            }
        })

        return convertedFilterModel
    }

    /**
     * Fonction générique pour convertir le tri
     *
     * Convertit le format de tri de l'interface vers le format API
     *
     * @param sortModel - Modèle de tri au format interface
     * @returns Modèle de tri au format API
     */
    const convertSortModel = (sortModel: Array<{ field: string; direction: 'asc' | 'desc' }>): SortModel[] => {
        return sortModel.map(sort => ({
            colId: sort.field,
            sort: sort.direction
        }))
    }

    /**
     * Fonction générique pour construire les paramètres de requête
     *
     * Cette fonction construit les paramètres d'API à partir des filtres, tri et pagination.
     * Elle gère tous les types d'opérateurs et formats d'API.
     *
     * Opérateurs supportés :
     * - equals/exact : Égalité exacte
     * - greaterThan/lessThan : Comparaisons numériques
     * - contains : Recherche partielle (insensible à la casse)
     * - startswith/endswith : Début/fin de chaîne
     * - inRange : Plage de valeurs (pour dates/nombres)
     *
     * @param params - Paramètres de la DataTable
     * @returns Paramètres formatés pour l'API
     */
    const buildQueryParams = (params: DataTableParams): any => {
        const queryParams: any = {}

        // Gestion du tri
        if (params.sort && params.sort.length > 0) {
            const sortParams = params.sort.map(sort => {
                const field = sort.colId
                const direction = sort.sort === 'asc' ? field : `-${field}`
                return direction
            })
            queryParams.ordering = sortParams.join(',')
        }

        // Gestion du filtrage
        if (params.filter && Object.keys(params.filter).length > 0) {
            Object.keys(params.filter).forEach(field => {
                const filter = params.filter![field]
                if (filter && filter.filter) {
                    // Gestion spéciale pour inRange (between) - utiliser le format range de Django
                    if (filter.type === 'inRange' && filter.filter && filter.filterTo) {
                        queryParams[`${field}_range`] = `${filter.filter},${filter.filterTo}`
                        return
                    }

                    // Gestion des opérateurs spéciaux selon la documentation Django
                    let op: string | null = ''
                    switch (filter.type) {
                        case 'equals':
                        case 'exact':
                            op = '_exact'
                            break
                        case 'greaterThan':
                            op = '_gt'
                            break
                        case 'greaterThanOrEqual':
                            op = '_gte'
                            break
                        case 'lessThan':
                            op = '_lt'
                            break
                        case 'lessThanOrEqual':
                            op = '_lte'
                            break
                        case 'contains':
                            op = '_icontains'
                            break
                        case 'startswith':
                            op = '_istartswith'
                            break
                        case 'endswith':
                            op = '_iendswith'
                            break
                        case 'notEquals':
                            op = '_exact'
                            // Pour not equals, on utilisera une logique différente
                            break
                        default:
                            op = '_exact'
                    }

                    const value = filter.filter ?? filter.dateFrom
                    if (op !== null && value !== undefined && value !== null && value !== '') {
                        if (filter.type === 'notEquals') {
                            // Pour not equals, on exclut la valeur
                            queryParams[`${field}${op}`] = value
                            queryParams[`${field}_exclude`] = true
                        } else {
                            queryParams[`${field}${op}`] = value
                        }
                    }
                }
            })
        }

        // Gestion de la recherche globale
        if (params.globalSearch) {
            queryParams.search = params.globalSearch
        }

        // Gestion de la pagination
        if (params.pageSize) {
            queryParams.page_size = params.pageSize
        }
        if (params.page) {
            queryParams.page = params.page
        }

        return queryParams
    }

    // ===== HANDLERS GÉNÉRIQUES =====

    /**
     * Handler pour le changement de tri
     *
     * Appelé quand l'utilisateur clique sur un en-tête de colonne.
     * Met à jour le modèle de tri et recharge les données.
     *
     * @param sortModel - Nouveau modèle de tri
     * @param fetchFunction - Fonction de chargement des données
     */
    const handleSortChanged = async (
        sortModel: Array<{ field: string; direction: 'asc' | 'desc' }>,
        fetchFunction: (params: DataTableParams) => Promise<void>
    ) => {
        const convertedSortModel = convertSortModel(sortModel)
        currentSortModel.value = convertedSortModel

        await fetchFunction({
            page: 1, // Retour à la première page lors d'un nouveau tri
            sort: convertedSortModel,
            filter: currentFilterModel.value,
            globalSearch: currentGlobalSearch.value
        })
    }

    /**
     * Handler pour le changement de filtre
     *
     * Appelé quand l'utilisateur modifie un filtre de colonne.
     * Met à jour le modèle de filtre et recharge les données.
     *
     * @param filterModel - Nouveau modèle de filtre
     * @param fetchFunction - Fonction de chargement des données
     */
    const handleFilterChanged = async (
        filterModel: Record<string, any>,
        fetchFunction: (params: DataTableParams) => Promise<void>
    ) => {
        const convertedFilterModel = convertFilterModel(filterModel)
        currentFilterModel.value = convertedFilterModel

        await fetchFunction({
            page: 1, // Retour à la première page lors d'un nouveau filtre
            sort: currentSortModel.value,
            filter: convertedFilterModel,
            globalSearch: currentGlobalSearch.value
        })
    }

    /**
     * Handler pour la recherche globale
     *
     * Appelé quand l'utilisateur utilise la barre de recherche globale.
     * Met à jour le terme de recherche et recharge les données.
     *
     * @param searchTerm - Terme de recherche
     * @param fetchFunction - Fonction de chargement des données
     */
    const handleGlobalSearchChanged = async (
        searchTerm: string,
        fetchFunction: (params: DataTableParams) => Promise<void>
    ) => {
        currentGlobalSearch.value = searchTerm

        await fetchFunction({
            page: 1, // Retour à la première page lors d'une nouvelle recherche
            sort: currentSortModel.value,
            filter: currentFilterModel.value,
            globalSearch: searchTerm
        })
    }

    /**
     * Handler pour le changement de pagination
     *
     * Appelé quand l'utilisateur change de page ou de taille de page.
     * Met à jour la pagination et recharge les données.
     *
     * @param pagination - Nouveaux paramètres de pagination
     * @param fetchFunction - Fonction de chargement des données
     */
    const handlePaginationChanged = async (
        { page, pageSize }: { page: number; pageSize: number },
        fetchFunction: (params: DataTableParams) => Promise<void>
    ) => {
        await fetchFunction({
            page,
            pageSize,
            sort: currentSortModel.value,
            filter: currentFilterModel.value,
            globalSearch: currentGlobalSearch.value
        })
    }

    /**
     * Handler pour effacer tous les filtres
     *
     * Remet à zéro tous les filtres et la recherche globale.
     * Recharge les données sans filtres.
     *
     * @param fetchFunction - Fonction de chargement des données
     */
    const clearFilters = async (fetchFunction: (params: DataTableParams) => Promise<void>) => {
        currentFilterModel.value = {}
        currentGlobalSearch.value = ''

        await fetchFunction({
            page: 1,
            sort: currentSortModel.value,
            filter: {},
            globalSearch: ''
        })
    }

    // ===== INTERFACE PUBLIQUE =====

    /**
     * Retourne l'interface complète du composable
     * Expose toutes les propriétés et méthodes nécessaires
     */
    return {
        // ===== ÉTAT RÉACTIF =====

        /**
         * Modèle de tri actuel (computed pour la réactivité)
         */
        currentSortModel: computed(() => currentSortModel.value),

        /**
         * Modèle de filtre actuel (computed pour la réactivité)
         */
        currentFilterModel: computed(() => currentFilterModel.value),

        /**
         * Recherche globale actuelle (computed pour la réactivité)
         */
        currentGlobalSearch: computed(() => currentGlobalSearch.value),

        /**
         * État de chargement (computed pour la réactivité)
         */
        loading: computed(() => loading.value),

        // ===== FONCTIONS UTILITAIRES =====

        /**
         * Convertisseur de modèle de filtre
         */
        convertFilterModel,

        /**
         * Convertisseur de modèle de tri
         */
        convertSortModel,

        /**
         * Constructeur de paramètres de requête
         */
        buildQueryParams,

        // ===== HANDLERS D'ÉVÉNEMENTS =====

        /**
         * Handler pour changement de tri
         */
        handleSortChanged,

        /**
         * Handler pour changement de filtre
         */
        handleFilterChanged,

        /**
         * Handler pour changement de recherche globale
         */
        handleGlobalSearchChanged,

        /**
         * Handler pour changement de pagination
         */
        handlePaginationChanged,

        /**
         * Handler pour effacer les filtres
         */
        clearFilters,

        // ===== SETTERS POUR L'ÉTAT =====

        /**
         * Setter pour l'état de chargement
         */
        setLoading: (value: boolean) => { loading.value = value },

        /**
         * Setter pour le modèle de tri
         */
        setCurrentSortModel: (value: SortModel[]) => { currentSortModel.value = value },

        /**
         * Setter pour le modèle de filtre
         */
        setCurrentFilterModel: (value: Record<string, FilterModel>) => { currentFilterModel.value = value },

        /**
         * Setter pour la recherche globale
         */
        setCurrentGlobalSearch: (value: string) => { currentGlobalSearch.value = value }
    }
}
