import { computed, ref } from 'vue'
import { useDataTableFilters, type DataTableParams } from '@/composables/useDataTableFilters'

/**
 * Interface pour les réponses paginées
 */
interface PaginatedResponse<T> {
    data: T[]
    totalItems?: number
    count?: number
    totalPages?: number
}

/**
 * Composable générique pour gérer les data tables avec filtrage et tri côté serveur
 *
 * @param fetchFunction - Fonction qui fait l'appel API avec les paramètres
 * @param options - Options de configuration
 * @returns Objet avec tous les handlers et l'état
 */
export function useGenericDataTable<T>(
    fetchFunction: (params: DataTableParams) => Promise<PaginatedResponse<T> | T[]>,
    options?: {
        initialPageSize?: number
        initialPage?: number
    }
) {
    const dataTableFilters = useDataTableFilters()

    // État local pour les données
    const data = ref<T[]>([])
    const totalItems = ref(0)
    const totalPages = ref(1)
    const currentPage = ref(options?.initialPage || 1)
    const pageSize = ref(options?.initialPageSize || 10)

    // Fonction de fetch avec gestion d'état
    const fetchDataWithParams = async (params: DataTableParams) => {
        try {
            dataTableFilters.setLoading(true)
            const result = await fetchFunction(params)

            // Vérifier si c'est une réponse paginée ou un tableau simple
            if (Array.isArray(result)) {
                // Cas d'un tableau simple
                data.value = result
                totalItems.value = result.length
                totalPages.value = Math.ceil(result.length / pageSize.value)
            } else {
                // Cas d'une réponse paginée
                data.value = result.data || []
                totalItems.value = result.totalItems || result.count || 0
                totalPages.value = result.totalPages || Math.ceil(totalItems.value / pageSize.value)
            }

            currentPage.value = params.page || 1
            pageSize.value = params.pageSize || pageSize.value

        } catch (error) {
            console.error('Erreur lors du chargement des données:', error)
        } finally {
            dataTableFilters.setLoading(false)
        }
    }

    // Handlers génériques
    const handlePaginationChanged = async ({ page, pageSize: newPageSize }: { page: number, pageSize: number }) => {
        await dataTableFilters.handlePaginationChanged(
            { page, pageSize: newPageSize },
            fetchDataWithParams
        )
    }

    const handleSortChanged = async (sortModel: Array<{ field: string; direction: 'asc' | 'desc' }>) => {
        await dataTableFilters.handleSortChanged(sortModel, fetchDataWithParams)
    }

    const handleFilterChanged = async (filterModel: Record<string, any>) => {
        await dataTableFilters.handleFilterChanged(filterModel, fetchDataWithParams)
    }

    const handleGlobalSearchChanged = async (searchTerm: string) => {
        await dataTableFilters.handleGlobalSearchChanged(searchTerm, fetchDataWithParams)
    }

    const clearFilters = async () => {
        await dataTableFilters.clearFilters(fetchDataWithParams)
    }

    // Computed pour l'état
    const loading = computed(() => dataTableFilters.loading.value)
    const currentSortModel = computed(() => dataTableFilters.currentSortModel.value)
    const currentFilterModel = computed(() => dataTableFilters.currentFilterModel.value)
    const currentGlobalSearch = computed(() => dataTableFilters.currentGlobalSearch.value)

    return {
        // État
        data: computed(() => data.value),
        loading,
        totalItems: computed(() => totalItems.value),
        totalPages: computed(() => totalPages.value),
        currentPage: computed(() => currentPage.value),
        pageSize: computed(() => pageSize.value),
        currentSortModel,
        currentFilterModel,
        currentGlobalSearch,

        // Handlers
        handlePaginationChanged,
        handleSortChanged,
        handleFilterChanged,
        handleGlobalSearchChanged,
        clearFilters,

        // Fonction de refresh
        refresh: () => fetchDataWithParams({
            page: currentPage.value,
            pageSize: pageSize.value,
            sort: currentSortModel.value,
            filter: currentFilterModel.value,
            globalSearch: currentGlobalSearch.value
        })
    }
}

// Exemple d'utilisation :
/*
// Dans un composable spécifique
export function useMyDataTable() {
    const fetchMyData = async (params: DataTableParams) => {
        const response = await api.getMyData(params)
        return response.data
    }

    const dataTable = useGenericDataTable(fetchMyData, {
        initialPageSize: 20,
        initialPage: 1
    })

    return {
        ...dataTable,
        // Ajouter des méthodes spécifiques si nécessaire
    }
}
*/
