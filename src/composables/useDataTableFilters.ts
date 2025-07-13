import { ref, computed } from 'vue'

export interface SortModel {
    colId: string
    sort: 'asc' | 'desc'
}

export interface FilterModel {
    filter: string
    type?: string
    dateFrom?: string
    dateTo?: string
    filterTo?: string
}

export interface DataTableParams {
    sort?: SortModel[]
    filter?: Record<string, FilterModel>
    page?: number
    pageSize?: number
    globalSearch?: string
}

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

export function useDataTableFilters() {
    // État local pour le tri et filtrage
    const currentSortModel = ref<SortModel[]>([])
    const currentFilterModel = ref<Record<string, FilterModel>>({})
    const currentGlobalSearch = ref<string>('')
    const loading = ref(false)

    // Fonction générique pour convertir les filtres du nouveau format vers l'ancien
    const convertFilterModel = (filterModel: Record<string, any>): Record<string, FilterModel> => {
        const convertedFilterModel: Record<string, FilterModel> = {}

        Object.entries(filterModel).forEach(([key, value]) => {
            if (value) {
                if (typeof value === 'object' && value.value !== undefined) {
                    // Nouveau format : { field, operator, dataType, value }
                    convertedFilterModel[key] = {
                        filter: String(value.value),
                        type: value.operator || 'equals'
                    }
                } else if (typeof value === 'object' && value.filter !== undefined) {
                    // Ancien format : { filter: string }
                    convertedFilterModel[key] = { filter: String(value.filter) }
                } else if (typeof value === 'string' && value !== '') {
                    // Format simple string
                    convertedFilterModel[key] = { filter: value }
                }
            }
        })

        return convertedFilterModel
    }

    // Fonction générique pour convertir le tri
    const convertSortModel = (sortModel: Array<{ field: string; direction: 'asc' | 'desc' }>): SortModel[] => {
        return sortModel.map(sort => ({
            colId: sort.field,
            sort: sort.direction
        }))
    }

    // Fonction générique pour construire les paramètres de requête
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
                    // Gestion des opérateurs spéciaux
                    if (filter.type) {
                        let op: string | null = ''
                        switch (filter.type) {
                            case 'equals':
                            case 'exact':
                                op = ''
                                break
                            case 'greaterThan':
                                op = '__gt'
                                break
                            case 'greaterThanOrEqual':
                                op = '__gte'
                                break
                            case 'lessThan':
                                op = '__lt'
                                break
                            case 'lessThanOrEqual':
                                op = '__lte'
                                break
                            case 'contains':
                                op = '__icontains'
                                break
                            case 'startswith':
                                op = '__istartswith'
                                break
                            case 'endswith':
                                op = '__iendswith'
                                break
                            case 'inRange':
                                // Pour les dates et nombres avec plage
                                if (filter.dateFrom !== undefined && filter.dateFrom !== null && filter.dateFrom !== '') {
                                    queryParams[`${field}__gte`] = filter.dateFrom
                                }
                                if (filter.dateTo !== undefined && filter.dateTo !== null && filter.dateTo !== '') {
                                    queryParams[`${field}__lte`] = filter.dateTo
                                }
                                if (filter.filter !== undefined && filter.filter !== null && filter.filter !== '') {
                                    queryParams[`${field}__gte`] = filter.filter
                                }
                                if (filter.filterTo !== undefined && filter.filterTo !== null && filter.filterTo !== '') {
                                    queryParams[`${field}__lte`] = filter.filterTo
                                }
                                op = null // On ne traite pas la suite
                                break
                            default:
                                op = ''
                        }

                        const value = filter.filter ?? filter.dateFrom
                        if (op !== null && value !== undefined && value !== null && value !== '') {
                            queryParams[`${field}${op}`] = value
                        }
                    } else {
                        // Filtres texte classiques
                        queryParams[field] = filter.filter
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

    // Handlers génériques
    const handleSortChanged = async (
        sortModel: Array<{ field: string; direction: 'asc' | 'desc' }>,
        fetchFunction: (params: DataTableParams) => Promise<void>
    ) => {
        console.log('📊 Tri changé:', sortModel)
        const convertedSortModel = convertSortModel(sortModel)
        currentSortModel.value = convertedSortModel

        await fetchFunction({
            page: 1, // Retour à la première page lors d'un nouveau tri
            sort: convertedSortModel,
            filter: currentFilterModel.value,
            globalSearch: currentGlobalSearch.value
        })
    }

    const handleFilterChanged = async (
        filterModel: Record<string, any>,
        fetchFunction: (params: DataTableParams) => Promise<void>
    ) => {
        console.log('🔍 Filtre changé:', filterModel)
        const convertedFilterModel = convertFilterModel(filterModel)
        currentFilterModel.value = convertedFilterModel

        await fetchFunction({
            page: 1, // Retour à la première page lors d'un nouveau filtre
            sort: currentSortModel.value,
            filter: convertedFilterModel,
            globalSearch: currentGlobalSearch.value
        })
    }

    const handleGlobalSearchChanged = async (
        searchTerm: string,
        fetchFunction: (params: DataTableParams) => Promise<void>
    ) => {
        console.log('🔍 Recherche globale changée:', searchTerm)
        currentGlobalSearch.value = searchTerm

        await fetchFunction({
            page: 1, // Retour à la première page lors d'une nouvelle recherche
            sort: currentSortModel.value,
            filter: currentFilterModel.value,
            globalSearch: searchTerm
        })
    }

    const handlePaginationChanged = async (
        { page, pageSize }: { page: number; pageSize: number },
        fetchFunction: (params: DataTableParams) => Promise<void>
    ) => {
        console.log('🔄 Pagination changée:', { page, pageSize })

        await fetchFunction({
            page,
            pageSize,
            sort: currentSortModel.value,
            filter: currentFilterModel.value,
            globalSearch: currentGlobalSearch.value
        })
    }

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

    return {
        // État
        currentSortModel: computed(() => currentSortModel.value),
        currentFilterModel: computed(() => currentFilterModel.value),
        currentGlobalSearch: computed(() => currentGlobalSearch.value),
        loading: computed(() => loading.value),

        // Fonctions utilitaires
        convertFilterModel,
        convertSortModel,
        buildQueryParams,

        // Handlers génériques
        handleSortChanged,
        handleFilterChanged,
        handleGlobalSearchChanged,
        handlePaginationChanged,
        clearFilters,

        // Setters pour l'état
        setLoading: (value: boolean) => { loading.value = value },
        setCurrentSortModel: (value: SortModel[]) => { currentSortModel.value = value },
        setCurrentFilterModel: (value: Record<string, FilterModel>) => { currentFilterModel.value = value },
        setCurrentGlobalSearch: (value: string) => { currentGlobalSearch.value = value }
    }
}
