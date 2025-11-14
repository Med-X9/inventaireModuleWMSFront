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
import { ref, computed } from 'vue'

// ===== IMPORTS ROUTER =====
import { useRouter } from 'vue-router'

// ===== IMPORTS SERVICES =====
import { logger } from '@/services/loggerService'

// ===== IMPORTS STORES =====
import { useInventoryStore } from '@/stores/inventory'
import { useAppStore } from '@/stores'

// ===== IMPORTS COMPOSABLES =====
import { useGenericDataTable } from './useInventoryDataTable'

// ===== IMPORTS UTILS =====
import { type StandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter'

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

    // ===== DATATABLE GÉNÉRIQUE =====

    /**
     * Initialisation du composable générique DataTable pour les magasins
     * Utilise useGenericDataTable pour gérer la pagination, le tri et le filtrage
     */
    const {
        data: planningData,
        loading,
        handlePaginationChanged: _handlePaginationChanged,
        handleSortChanged: _handleSortChanged,
        handleFilterChanged: _handleFilterChanged,
        handleSearchChanged: _handleSearchChanged,
        refresh
    } = useGenericDataTable<Store>({
        store: inventoryStore,
        fetchAction: 'fetchPlanningManagement',
        defaultPageSize: 25,
        additionalParams: computed(() => inventoryId.value ? { id: inventoryId.value } : {})
    })

    // ===== COMPUTED PROPERTIES =====

    /**
     * Convertit les données du planning en Stores
     */
    const stores = computed(() => {
        const data = planningData.value || []
        return data.map((item: any): Store => ({
            id: item.warehouse_id || item.id,
            store_name: item.warehouse_name || item.store_name,
            teams_count: item.teams_count || 0,
            jobs_count: item.jobs_count || 0,
            reference: item.warehouse_reference || item.reference
        }))
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

    /**
     * Charge les magasins pour un inventaire
     *
     * @param inventoryId - ID de l'inventaire
     */
    async function fetchStores(inventoryId: number): Promise<void> {
        if (inventoryId) {
            await refresh()
        }
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
     * Accepte le format standard DataTable ou l'ancien format
     *
     * @param params - Paramètres de pagination (standard ou ancien format)
     */
    const handlePaginationChanged = async (params: { page: number; pageSize: number } | StandardDataTableParams) => {
        // Si c'est déjà le format standard (venant du DataTable), utiliser directement
        if ('draw' in params && 'start' in params && 'length' in params) {
            const standardParams = params as StandardDataTableParams
            const page = Math.floor((standardParams.start || 0) / (standardParams.length || 25)) + 1
            await _handlePaginationChanged({ page, pageSize: standardParams.length || 25 })
            return
        }

        // Sinon, convertir l'ancien format
        const paginationParams = params as { page: number; pageSize: number }
        await _handlePaginationChanged(paginationParams)
    }

    /**
     * Handler pour le changement de tri
     * Accepte le format standard DataTable ou l'ancien format
     *
     * @param sortModel - Modèle de tri (standard ou ancien format)
     */
    const handleSortChanged = async (sortModel: Array<{ colId: string; sort: 'asc' | 'desc' }> | StandardDataTableParams) => {
        // Si c'est déjà le format standard (venant du DataTable), extraire les informations
        if ('draw' in sortModel && 'start' in sortModel && 'length' in sortModel) {
            const standardParams = sortModel as StandardDataTableParams
            const page = Math.floor((standardParams.start || 0) / (standardParams.length || 25)) + 1
            await _handlePaginationChanged({ page, pageSize: standardParams.length || 25 })

            // Extraire le tri depuis les paramètres standard
            const extractedSort: Array<{ colId: string; sort: 'asc' | 'desc' }> = []
            let sortIndex = 0
            while (standardParams[`order[${sortIndex}][column]`] !== undefined) {
                const columnIndex = standardParams[`order[${sortIndex}][column]`]
                const direction = standardParams[`order[${sortIndex}][dir]`] as 'asc' | 'desc'
                const fieldKey = `columns[${columnIndex}][data]`
                const fieldName = standardParams[fieldKey]
                if (fieldName) {
                    extractedSort.push({
                        colId: fieldName,
                        sort: direction
                    })
                }
                sortIndex++
            }
            // Convertir le format colId/sort vers field/direction
            const convertedSort = extractedSort.map(s => ({
                field: s.colId,
                direction: s.sort
            }))
            await _handleSortChanged(convertedSort)
            return
        }

        // Sinon, convertir l'ancien format
        const sortModelArray = sortModel as Array<{ colId: string; sort: 'asc' | 'desc' }>
        const convertedSortArray = sortModelArray.map(s => ({
            field: s.colId,
            direction: s.sort
        }))
        await _handleSortChanged(convertedSortArray)
    }

    /**
     * Handler pour le changement de filtres
     * Accepte le format standard DataTable ou l'ancien format
     *
     * @param filterModel - Modèle de filtres (standard ou ancien format)
     */
    const handleFilterChanged = async (filterModel: Record<string, { filter: string }> | StandardDataTableParams) => {
        // Si c'est déjà le format standard (venant du DataTable), extraire les informations
        if ('draw' in filterModel && 'start' in filterModel && 'length' in filterModel) {
            const standardParams = filterModel as StandardDataTableParams
            const page = Math.floor((standardParams.start || 0) / (standardParams.length || 25)) + 1
            await _handlePaginationChanged({ page, pageSize: standardParams.length || 25 })

            // Extraire les filtres depuis les paramètres standard
            const extractedFilters: Record<string, { filter: string }> = {}
            Object.keys(standardParams).forEach(key => {
                if (key.startsWith('columns[') && key.includes('][search][value]')) {
                    const match = key.match(/columns\[(\d+)\]\[search\]\[value\]/)
                    if (match && standardParams[key]) {
                        const columnIndex = parseInt(match[1])
                        const fieldKey = `columns[${columnIndex}][data]`
                        const fieldName = standardParams[fieldKey]
                        if (fieldName) {
                            extractedFilters[fieldName] = {
                                filter: standardParams[key]
                            }
                        }
                    }
                }
            })
            await _handleFilterChanged(extractedFilters)
            return
        }

        // Sinon, utiliser directement l'ancien format
        const filterModelObj = filterModel as Record<string, { filter: string }>
        await _handleFilterChanged(filterModelObj)
    }

    /**
     * Handler pour le changement de recherche globale
     * Accepte le format standard DataTable ou une chaîne
     *
     * @param searchTerm - Terme de recherche (standard ou string)
     */
    const handleGlobalSearchChanged = async (searchTerm: string | StandardDataTableParams) => {
        await _handleSearchChanged(searchTerm)
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

        // Colonnes et actions
        actions,
        adaptedColumns,
        adaptedActions,
        adaptedGridActions,
        adaptedHandleItemClick,
        adaptedHandleActionsClick,

        // Méthodes
        fetchStores,
        selectStore,
        setInventoryStatus,
        setInventoryReference,
        fetchInventoryIdByReference,
        goToInventoryDetail,
        goToAffectation,

        // Handlers DataTable
        handlePaginationChanged,
        handleSortChanged,
        handleFilterChanged,
        handleGlobalSearchChanged
    }
}
