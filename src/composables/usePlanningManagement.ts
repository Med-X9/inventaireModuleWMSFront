/**
 * Composable usePlanningManagement - Gestion du planning des magasins
 *
 * Ce composable gère :
 * - Le chargement et l'affichage des magasins associés à un inventaire
 * - La pagination, le tri et le filtrage côté serveur pour les magasins
 * - La conversion automatique des paramètres vers le format standard DataTable
 * - La navigation vers les pages de planning et d'affectation
 *
 * @module usePlanningManagement
 */

// ===== IMPORTS VUE =====
import { ref, computed, onMounted, nextTick } from 'vue'

// ===== IMPORTS ROUTER =====
import { useRouter } from 'vue-router'

// ===== IMPORTS SERVICES =====
import { logger } from '@/services/loggerService'
import { alertService } from '@/services/alertService'

// ===== IMPORTS STORES =====
import { useInventoryStore } from '@/stores/inventory'
import { useAppStore } from '@/stores'

// ===== IMPORTS COMPOSABLES =====
import { useBackendDataTable } from '@/components/DataTable/composables/useBackendDataTable'

// ===== IMPORTS UTILS =====
import { type StandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter'
import type { LocationDataTableParams } from '@/services/LocationService'

// ===== IMPORTS TYPES =====
import type { Store, PlanningAction, ViewModeType } from '@/interfaces/planningManagement'

// ===== IMPORTS COMPOSANTS =====
import IconUser from '@/components/icon/icon-user.vue'
import IconCalendar from '@/components/icon/icon-calendar.vue'

// ===== INTERFACES =====

/**
 * Action adaptée pour DataTable
 */
interface AdaptedAction {
    label: string
    icon: any
    onClick: (row: Record<string, unknown>) => void
    color: 'primary' | 'secondary' | 'danger'
}

/**
 * Action adaptée pour GridView
 */
interface AdaptedGridAction {
    label: string
    icon: any
    handler: (item: any) => void
    variant?: 'primary' | 'secondary'
}

// ===== COMPOSABLE PRINCIPAL =====

/**
 * Composable pour la gestion du planning des magasins
 *
 * @returns Objet contenant l'état, les méthodes et les handlers pour le planning management
 */
export function usePlanningManagement() {
    // ===== ROUTER & STORES =====
    const router = useRouter()
    const appStore = useAppStore()
    const inventoryStore = useInventoryStore()

    // ===== ÉTAT RÉACTIF =====

    /** Statut de l'inventaire */
    const inventoryStatus = ref<string>('EN REALISATION')

    /** Référence de l'inventaire */
    const inventoryReference = ref<string>('')

    /** ID de l'inventaire */
    const inventoryId = ref<number | null>(null)

    /** État de chargement de l'inventaire */
    const inventoryLoading = ref(false)

    /** Erreur lors du chargement de l'inventaire */
    const inventoryError = ref<string | null>(null)

    /** Magasin sélectionné */
    const selectedStore = ref<Store | null>(null)

    /** Mode d'affichage (table ou grid) depuis Pinia */
    const viewMode = computed<ViewModeType>({
        get: () => appStore.viewMode,
        set: (mode: ViewModeType) => appStore.setViewMode(mode)
    })

    /** Indicateur d'initialisation */
    const isInitialized = ref(false)

    // ===== INITIALISATION DES DATATABLES =====

    /**
     * DataTable pour le planning management
     * Utilise useBackendDataTable pour l'intégration avec le store Pinia
     */
    const {
        data: planningData,
        loading,
        currentPage,
        pageSize,
        searchQuery,
        sortModel,
        filters,
        setPage,
        setPageSize,
        setSearch,
        setSortModel,
        setFilters,
        resetFilters,
        refresh: _refreshPlanningDataTable,
        pagination
    } = useBackendDataTable<Store>('', {
        piniaStore: inventoryStore,
        storeId: 'inventory',
        autoLoad: false,
        pageSize: 25
    })

    // ===== COMPUTED PROPERTIES =====

    /**
     * Convertit les données du planning en Stores
     * Récupère les données depuis le store Pinia (comme mappedLocations dans usePlanning.ts)
     */
    const stores = computed(() => {
        // Récupérer les données directement depuis le store Pinia
        // Même pattern que mappedLocations dans usePlanning.ts qui utilise locationStore.locations
        const storeData = inventoryStore.planningManagementData || []
        const data = Array.isArray(storeData) ? storeData : []

        return data.map((item: any): Store => {
            // L'API retourne: warehouse_reference, warehouse_name, jobs_count, teams_count
            // Mapping vers le format Store attendu
            return {
                id: item.warehouse_id || item.id || 0,
                store_name: item.warehouse_name || item.store_name || 'N/A',
                teams_count: item.teams_count || 0,
                jobs_count: item.jobs_count || 0,
                reference: item.warehouse_reference || item.reference || ''
            }
        })
    })

    /**
     * Colonnes pour le DataTable
     */
    const adaptedColumns = computed(() => [
        {
            field: 'store_name',
            headerName: 'Nom du magasin',
            sortable: true,
            width: 200,
            editable: false
        },
        {
            field: 'teams_count',
            headerName: 'Équipes',
            sortable: true,
            width: 100,
            editable: false
        },
        {
            field: 'jobs_count',
            headerName: 'Jobs',
            sortable: true,
            width: 100,
            editable: false
        },
        {
            field: 'reference',
            headerName: 'Référence',
            sortable: true,
            width: 150,
            editable: false
        }
    ])

    /**
     * Actions pour le planning
     */
    const actions = computed<PlanningAction[]>(() => {
        const baseActions: PlanningAction[] = []

        baseActions.push({
            label: 'Planifier',
            icon: IconCalendar,
            handler: (store: Store) => {
                router.push({
                    name: 'inventory-planning',
                    params: {
                        reference: inventoryReference.value || '',
                        warehouse: (store.reference as string) || ''
                    }
                })
            }
        })

        baseActions.push({
            label: inventoryStatus.value === 'EN REALISATION' ? 'Transférer' : 'Affecter',
            icon: IconUser,
            handler: (store: Store) => {
                router.push({
                    name: 'inventory-affecter',
                    params: {
                        reference: inventoryReference.value || '',
                        warehouse: (store.reference as string) || ''
                    }
                })
            }
        })

        return baseActions
    })

    /**
     * Actions adaptées pour DataTable
     */
    const adaptedActions = computed<AdaptedAction[]>(() =>
        actions.value.map(action => ({
            label: action.label,
            icon: action.icon,
            onClick: (row: Record<string, unknown>) => action.handler(row as unknown as Store),
            color: 'primary' as const
        }))
    )

    /**
     * Actions adaptées pour GridView
     */
    const adaptedGridActions = computed<AdaptedGridAction[]>(() =>
        actions.value.map(action => ({
            label: action.label,
            icon: action.icon,
            handler: (item: any) => action.handler(item),
            variant: 'primary' as const
        }))
    )

    // ===== MÉTHODES D'INITIALISATION =====

    /**
     * Récupère l'ID de l'inventaire par sa référence
     *
     * @param reference - Référence de l'inventaire
     */
    const fetchInventoryIdByReference = async (reference: string): Promise<void> => {
        inventoryLoading.value = true
        inventoryError.value = null

        try {
            const inventory = await inventoryStore.fetchInventoryByReference(reference)
            if (inventory) {
                inventoryId.value = inventory.id
            } else {
                inventoryError.value = `Aucun inventaire trouvé avec la référence: ${reference}`
            }
        } catch (error) {
            logger.error('Erreur lors de la récupération de l\'inventaire', error)
            inventoryError.value = 'Erreur lors de la récupération de l\'inventaire'
        } finally {
            inventoryLoading.value = false
        }
    }

    // ===== MÉTHODES DE CHARGEMENT DES DONNÉES =====

    /**
     * Charger les données du planning management pour l'inventaire actuel
     *
     * @param params - Paramètres DataTable standard (pagination, tri, filtres)
     */
    const loadPlanningData = async (params?: LocationDataTableParams) => {
        if (!inventoryId.value) {
            logger.warn('Impossible de charger les données du planning, ID inventaire manquant')
            return
        }

        try {
            // Utiliser les paramètres fournis ou construire à partir des valeurs actuelles
            const finalParams: LocationDataTableParams = params || {
                draw: currentPage.value || 1,
                start: ((currentPage.value || 1) - 1) * pageSize.value,
                length: pageSize.value
            }

            // S'assurer que length est bien défini
            if (!finalParams.length) {
                finalParams.length = pageSize.value
            }

            logger.debug('Chargement des données du planning management avec paramètres DataTable:', {
                inventoryId: inventoryId.value,
                pageSize: pageSize.value,
                params: finalParams
            })

            // Appeler directement l'action du store avec l'ID de l'inventaire
            await inventoryStore.fetchPlanningManagement(inventoryId.value, finalParams)
            await nextTick()

            logger.debug('Données du planning management mises à jour dans le store', {
                count: (inventoryStore as any).planningManagementData?.length || 0
            })
        } catch (error) {
            logger.error('Erreur lors du chargement des données du planning', error)
            await alertService.error({ text: 'Erreur lors du chargement des données du planning' })
        }
    }

    /**
     * Rafraîchir les données du planning
     *
     * @param params - Paramètres DataTable optionnels
     */
    const refreshPlanningData = async (params?: LocationDataTableParams) => {
        await loadPlanningData(params)
    }

    /**
     * Réinitialiser la DataTable du planning (tri, filtres, recherche)
     */
    const resetPlanningDataTable = async () => {
        setSortModel([])
        resetFilters()
        setSearch('')
        await refreshPlanningData()
    }


    // ===== MÉTHODES DE GESTION =====

    /**
     * Sélectionne un magasin
     *
     * @param store - Magasin à sélectionner
     */
    function selectStore(store: Store): void {
        selectedStore.value = store
    }

    /**
     * Met à jour le statut de l'inventaire
     *
     * @param status - Nouveau statut
     */
    function setInventoryStatus(status: string): void {
        inventoryStatus.value = status
    }

    /**
     * Définit la référence de l'inventaire
     *
     * @param reference - Référence de l'inventaire
     */
    function setInventoryReference(reference: string): void {
        inventoryReference.value = reference
    }

    // ===== HANDLERS DATATABLE =====

    /**
     * Handler pour le changement de pagination
     * Accepte soit le format standard DataTable (venant du composant), soit l'ancien format
     *
     * @param params - Paramètres de pagination (format standard ou ancien format)
     */
    const handlePaginationChanged = async (params: { page: number; pageSize: number } | StandardDataTableParams) => {
        try {
            // Si c'est déjà le format standard (venant du DataTable), utiliser directement
            if ('draw' in params && 'start' in params && 'length' in params) {
                const standardParams = params as StandardDataTableParams
                const page = Math.floor((standardParams.start || 0) / (standardParams.length || 25)) + 1
                setPageSize(standardParams.length || 25)
                setPage(page)
                await loadPlanningData(standardParams as LocationDataTableParams)
                return
            }

            // Sinon, convertir l'ancien format
            const paginationParams = params as { page: number; pageSize: number }
            setPageSize(paginationParams.pageSize)
            setPage(paginationParams.page)
            await loadPlanningData()
        } catch (error) {
            logger.error('Erreur dans handlePaginationChanged', error)
            await alertService.error({ text: 'Erreur lors du changement de pagination' })
        }
    }

    /**
     * Handler pour les changements de tri
     * Accepte soit le format standard DataTable (venant du composant), soit l'ancien format
     *
     * @param sortModel - Modèle de tri (format standard ou ancien format)
     */
    const handleSortChanged = async (sortModel: Array<{ field: string; direction: 'asc' | 'desc' }> | StandardDataTableParams) => {
        try {
            // Si c'est déjà le format standard (venant du DataTable), utiliser directement
            if ('draw' in sortModel && 'start' in sortModel && 'length' in sortModel) {
                await loadPlanningData(sortModel as LocationDataTableParams)
                return
            }

            // Sinon, convertir l'ancien format
            const sortModelArray = sortModel as Array<{ field: string; direction: 'asc' | 'desc' }>
            setSortModel(sortModelArray)
            await loadPlanningData()
        } catch (error) {
            logger.error('Erreur dans handleSortChanged', error)
            await alertService.error({ text: 'Erreur lors du changement de tri' })
        }
    }

    /**
     * Handler pour les changements de filtres
     * Accepte soit le format standard DataTable (venant du composant), soit l'ancien format
     *
     * @param filterModel - Modèle de filtres (format standard ou ancien format)
     */
    const handleFilterChanged = async (filterModel: Record<string, any> | StandardDataTableParams) => {
        try {
            // Si c'est déjà le format standard (venant du DataTable), utiliser directement
            if ('draw' in filterModel && 'start' in filterModel && 'length' in filterModel) {
                await loadPlanningData(filterModel as LocationDataTableParams)
                return
            }

            // Sinon, utiliser directement l'ancien format
            const filterModelObj = filterModel as Record<string, any>
            setFilters(filterModelObj)
            await loadPlanningData()
        } catch (error) {
            logger.error('Erreur dans handleFilterChanged', error)
            await alertService.error({ text: 'Erreur lors du changement de filtre' })
        }
    }

    /**
     * Handler pour les changements de recherche globale
     * Accepte soit le format standard DataTable (venant du composant), soit l'ancien format
     *
     * @param searchTerm - Terme de recherche (format standard ou string)
     */
    const handleGlobalSearchChanged = async (searchTerm: string | StandardDataTableParams) => {
        try {
            // Si c'est déjà le format standard (venant du DataTable), utiliser directement
            if (typeof searchTerm === 'object' && 'draw' in searchTerm && 'start' in searchTerm && 'length' in searchTerm) {
                await loadPlanningData(searchTerm as LocationDataTableParams)
                return
            }

            // Sinon, utiliser directement la valeur string
            setSearch(searchTerm as string)
            await loadPlanningData()
        } catch (error) {
            logger.error('Erreur dans handleGlobalSearchChanged', error)
            await alertService.error({ text: 'Erreur lors de la recherche' })
        }
    }

    // ===== HANDLERS GRIDVIEW =====

    /**
     * Handler pour le clic sur un item dans GridView
     *
     * @param item - Item cliqué
     */
    const adaptedHandleItemClick = (item: any): void => {
        // Cette fonction est conservée pour la compatibilité avec GridView
        // La gestion réelle des clics est maintenant dans les actions
    }

    /**
     * Handler pour le clic sur les actions dans GridView
     *
     * @param item - Item concerné
     * @param e - Événement de clic
     */
    const adaptedHandleActionsClick = (item: any, e: MouseEvent): void => {
        // Cette fonction est conservée pour la compatibilité avec GridView
        // La gestion réelle des actions est maintenant dans les actions
    }

    // ===== NAVIGATION =====

    /**
     * Navigue vers la page de détail de l'inventaire
     *
     * @param reference - Référence de l'inventaire
     */
    const goToInventoryDetail = (reference: string): void => {
        router.push({ name: 'inventory-detail', params: { reference } })
    }

    /**
     * Navigue vers la page d'affectation
     *
     * @param reference - Référence de l'inventaire
     */
    const goToAffectation = (reference: string): void => {
        router.push({
            name: 'inventory-affecter',
            params: { reference }
        })
    }

    // ===== RETURN =====

    // ===== INITIALISATION =====

    /**
     * Initialiser le composable
     * Résout l'ID de l'inventaire et charge les données initiales
     */
    const initialize = async () => {
        if (isInitialized.value) {
            logger.debug('Planning management déjà initialisé')
            return
        }

        try {
            logger.debug('Initialisation du planning management', { inventoryReference: inventoryReference.value })

            // Si l'inventoryId n'est pas encore résolu, le résoudre
            if (!inventoryId.value && inventoryReference.value) {
                logger.debug('Résolution de l\'ID de l\'inventaire', { reference: inventoryReference.value })
                await fetchInventoryIdByReference(inventoryReference.value)
                logger.debug('ID de l\'inventaire résolu', { inventoryId: inventoryId.value })
            }

            // Charger les données initiales si l'ID est disponible
            if (inventoryId.value) {
                logger.debug('Chargement des données du planning management', { inventoryId: inventoryId.value })
                await loadPlanningData()
            } else {
                logger.warn('Impossible de charger les données, inventoryId manquant', {
                    inventoryReference: inventoryReference.value,
                    inventoryId: inventoryId.value
                })
            }

            isInitialized.value = true
            logger.debug('Initialisation du planning management terminée avec succès', {
                inventoryId: inventoryId.value,
                storesCount: stores.value.length
            })
        } catch (error) {
            logger.error('Erreur lors de l\'initialisation du planning management', error)
            await alertService.error({ text: 'Erreur lors de l\'initialisation du planning management' })
        }
    }

    // ===== RETURN =====

    return {
        // État
        stores,
        selectedStore,
        loading,
        inventoryStatus,
        inventoryReference,
        inventoryId,
        inventoryLoading,
        inventoryError,
        isInitialized,

        // Colonnes et actions
        actions,
        adaptedColumns,
        adaptedActions,
        adaptedGridActions,
        adaptedHandleItemClick,
        adaptedHandleActionsClick,

        // Méthodes
        selectStore,
        setInventoryStatus,
        setInventoryReference,
        fetchInventoryIdByReference,
        goToInventoryDetail,
        goToAffectation,
        initialize,
        loadPlanningData,
        refreshPlanningData,
        resetPlanningDataTable,

        // Handlers DataTable
        handlePaginationChanged,
        handleSortChanged,
        handleFilterChanged,
        handleGlobalSearchChanged,

        // Pagination et données depuis useBackendDataTable
        currentPage,
        pageSize,
        pagination,
        totalPages: computed(() => pagination.value.total_pages || 1),
        totalItems: computed(() => pagination.value.total || 0)
    }
}
