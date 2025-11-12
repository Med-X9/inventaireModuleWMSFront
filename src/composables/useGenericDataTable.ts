import { computed, ref } from 'vue'
import { useDataTableFilters, type DataTableParams } from '@/composables/useDataTableFilters'
import { logger } from '@/services/loggerService'

/**
 * Interface pour les réponses paginées
 * Définit la structure des données retournées par l'API
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
 * Ce composable fournit une abstraction complète pour la gestion des tables de données :
 * - Pagination automatique côté serveur
 * - Gestion des filtres et tri
 * - État de chargement réactif
 * - Handlers pour tous les événements de table
 *
 * Architecture :
 * 1. useDataTableFilters : Gère les filtres, tri et recherche
 * 2. État local : Données, pagination, chargement
 * 3. Handlers : Convertisseurs et gestionnaires d'événements
 * 4. Computed : Propriétés réactives pour l'interface
 *
 * @param fetchFunction - Fonction qui fait l'appel API avec les paramètres
 * @param options - Options de configuration (taille de page initiale, page initiale)
 * @returns Objet avec tous les handlers et l'état réactif
 */
export function useGenericDataTable<T>(
    fetchFunction: (params: DataTableParams) => Promise<PaginatedResponse<T> | T[]>,
    options?: {
        initialPageSize?: number
        initialPage?: number
    }
) {
    /**
     * Initialisation du composable de filtres
     * Gère tout l'état des filtres, tri et recherche
     */
    const dataTableFilters = useDataTableFilters()

    // ===== ÉTAT LOCAL =====

    /**
     * Données de la table
     * Tableau réactif contenant les éléments affichés
     */
    const data = ref<T[]>([])

    /**
     * Nombre total d'éléments (pour la pagination)
     */
    const totalItems = ref(0)

    /**
     * Nombre total de pages
     */
    const totalPages = ref(1)

    /**
     * Page courante
     */
    const currentPage = ref(options?.initialPage || 1)

    /**
     * Taille de page courante
     */
    const pageSize = ref(options?.initialPageSize || 10)

    // ===== FONCTIONS DE GESTION =====

    /**
     * Fonction de fetch avec gestion d'état
     * Appelle la fonction de fetch fournie et met à jour l'état local
     * Gère les deux formats de réponse possibles :
     * - Tableau simple : pour les données non paginées
     * - Objet paginé : pour les données avec pagination côté serveur
     *
     * @param params - Paramètres de la requête (pagination, tri, filtres)
     */
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
            logger.error('Erreur lors du chargement des données', error)
        } finally {
            dataTableFilters.setLoading(false)
        }
    }

    // ===== HANDLERS GÉNÉRIQUES =====

    /**
     * Handler pour le changement de pagination
     * Appelé quand l'utilisateur change de page ou de taille de page
     *
     * @param params - Nouveaux paramètres de pagination
     */
    const handlePaginationChanged = async ({ page, pageSize: newPageSize }: { page: number, pageSize: number }) => {
        await dataTableFilters.handlePaginationChanged(
            { page, pageSize: newPageSize },
            fetchDataWithParams
        )
    }

    /**
     * Handler pour le changement de tri
     * Appelé quand l'utilisateur clique sur un en-tête de colonne
     *
     * @param sortModel - Nouveau modèle de tri
     */
    const handleSortChanged = async (sortModel: Array<{ field: string; direction: 'asc' | 'desc' }>) => {
        await dataTableFilters.handleSortChanged(sortModel, fetchDataWithParams)
    }

    /**
     * Handler pour le changement de filtre
     * Appelé quand l'utilisateur modifie un filtre de colonne
     *
     * @param filterModel - Nouveau modèle de filtre
     */
    const handleFilterChanged = async (filterModel: Record<string, any>) => {
        await dataTableFilters.handleFilterChanged(filterModel, fetchDataWithParams)
    }

    /**
     * Handler pour la recherche globale
     * Appelé quand l'utilisateur utilise la barre de recherche globale
     *
     * @param searchTerm - Terme de recherche
     */
    const handleGlobalSearchChanged = async (searchTerm: string) => {
        await dataTableFilters.handleGlobalSearchChanged(searchTerm, fetchDataWithParams)
    }

    /**
     * Handler pour effacer tous les filtres
     * Remet à zéro tous les filtres et la recherche globale
     */
    const clearFilters = async () => {
        await dataTableFilters.clearFilters(fetchDataWithParams)
    }

    // ===== COMPUTED PROPERTIES =====

    /**
     * État de chargement réactif
     */
    const loading = computed(() => dataTableFilters.loading.value)

    /**
     * Modèle de tri actuel
     */
    const currentSortModel = computed(() => dataTableFilters.currentSortModel.value)

    /**
     * Modèle de filtre actuel
     */
    const currentFilterModel = computed(() => dataTableFilters.currentFilterModel.value)

    /**
     * Recherche globale actuelle
     */
    const currentGlobalSearch = computed(() => dataTableFilters.currentGlobalSearch.value)

    // ===== INTERFACE PUBLIQUE =====

    /**
     * Retourne l'interface complète du composable
     * Expose toutes les propriétés et méthodes nécessaires
     * pour l'utilisation dans les composants Vue
     */
    return {
        // ===== ÉTAT RÉACTIF =====

        /**
         * Données de la table (computed pour la réactivité)
         */
        data: computed(() => data.value),

        /**
         * État de chargement
         */
        loading,

        /**
         * Nombre total d'éléments
         */
        totalItems: computed(() => totalItems.value),

        /**
         * Nombre total de pages
         */
        totalPages: computed(() => totalPages.value),

        /**
         * Page courante
         */
        currentPage: computed(() => currentPage.value),

        /**
         * Taille de page courante
         */
        pageSize: computed(() => pageSize.value),

        /**
         * Modèle de tri actuel
         */
        currentSortModel,

        /**
         * Modèle de filtre actuel
         */
        currentFilterModel,

        /**
         * Recherche globale actuelle
         */
        currentGlobalSearch,

        // ===== HANDLERS D'ÉVÉNEMENTS =====

        /**
         * Handler pour changement de pagination
         */
        handlePaginationChanged,

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
         * Handler pour effacer les filtres
         */
        clearFilters,

        // ===== MÉTHODES UTILITAIRES =====

        /**
         * Fonction de refresh
         * Recharge les données avec les paramètres actuels
         */
        refresh: () => fetchDataWithParams({
            page: currentPage.value,
            pageSize: pageSize.value,
            sort: currentSortModel.value,
            filter: currentFilterModel.value,
            globalSearch: currentGlobalSearch.value
        })
    }
}

// ===== EXEMPLE D'UTILISATION =====
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
