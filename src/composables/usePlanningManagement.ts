/**
 * Composable pour la gestion du planning des magasins
 *
 * Fournit :
 * - Configuration des colonnes DataTable pour les magasins
 * - Actions disponibles sur les magasins
 * - Gestion des modales et de la navigation
 * - Handlers pour les opérations DataTable côté serveur
 *
 * @module usePlanningManagement
 */

// ===== IMPORTS =====

import { ref, computed, onMounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { alertService } from '@/services/alertService'
import { InventoryService } from '@/services/InventoryService'
import { useInventoryStore } from '@/stores/inventory'
import { useAppStore } from '@/stores'
import { useWarehouseStore } from '@/stores/warehouse'
import { useQueryModel } from '@/components/DataTable/composables/useQueryModel'
import { convertQueryModelToQueryParams } from '@/components/DataTable/utils/queryModelConverter'
import type { QueryModel } from '@/components/DataTable/types/QueryModel'
import type { Store, PlanningAction, ViewModeType } from '@/interfaces/planningManagement'

// ===== IMPORTS ICÔNES =====
import IconUser from '@/components/icon/icon-user.vue'
import IconCalendar from '@/components/icon/icon-calendar.vue'
import IconBarChart from '@/components/icon/icon-bar-chart.vue'

// ===== CONSTANTES =====

/**
 * Largeurs de colonnes optimisées pour le planning
 */
const PLANNING_COLUMN_WIDTHS = {
    store_name: 200,
    teams_count: 100,
    jobs_count: 100,
    reference: 150
} as const

/**
 * Modes d'affichage disponibles
 */
const VIEW_MODE_OPTIONS = [
    { value: 'table' as const, label: 'Tableau', icon: 'IconListCheck' },
    { value: 'grid' as const, label: 'Grille', icon: 'IconLayoutGrid' }
]

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

// ===== COMPOSABLE =====

/**
 * Composable pour la gestion du planning des magasins
 *
 * @param inventoryReference - Référence de l'inventaire
 * @returns Configuration et handlers pour la gestion du planning
 */
export function usePlanningManagement(inventoryRef?: string) {
    // ===== ROUTER & STORES =====
    const router = useRouter()
    const appStore = useAppStore()
    const inventoryStore = useInventoryStore()
    const warehouseStore = useWarehouseStore()
    const { planningManagementData } = storeToRefs(inventoryStore)

    // ===== ÉTATS RÉACTIFS =====

    // États de l'inventaire
    const inventoryStatus = ref<string>('EN REALISATION')
    const inventoryReference = ref<string>(inventoryRef || '')
    const inventoryId = ref<number | null>(null)
    const inventoryLoading = ref(false)
    const inventoryError = ref<string | null>(null)

    // États de l'interface
    const selectedStore = ref<Store | null>(null)
    const isInitialized = ref(false)
    const dataTableError = ref<string | null>(null)
    const isLoadingData = ref(false) // Protection contre les appels répétés

    // Mode d'affichage depuis Pinia
    const viewMode = computed<ViewModeType>({
        get: () => appStore.viewMode,
        set: (mode: ViewModeType) => appStore.setViewMode(mode)
    })

    // ===== ÉTATS LOCAUX POUR LA PAGINATION =====

    /**
     * État de chargement des données
     */
    const loading = ref(false)

    /**
     * État de pagination actuel
     */
    const currentPage = ref(1)
    const pageSize = ref(20)

    // ===== QUERYMODEL =====

    /**
     * Mode de sortie pour les paramètres de requête
     */
    const queryOutputMode = ref<'queryModel' | 'dataTable' | 'restApi' | 'queryParams'>('queryParams')

    // ===== COMPUTED PROPERTIES =====

    /**
     * Cache des IDs de warehouse pour optimisation
     */
    const warehouseIdMap = ref<Map<string, number>>(new Map())

    /**
     * Pagination calculée pour le planning management
     */
    const pagination = computed(() => {
        const totalCount = inventoryStore.totalItems || 0
        const pageSizeValue = pageSize.value
        const currentPageValue = currentPage.value

        return {
            current_page: currentPageValue,
            total_pages: Math.max(1, Math.ceil(totalCount / pageSizeValue)),
            has_next: currentPageValue < Math.ceil(totalCount / pageSizeValue),
            has_previous: currentPageValue > 1,
            page_size: pageSizeValue,
            total: totalCount
        }
    })

    /**
     * Données des magasins depuis le store (avec storeToRefs pour la réactivité)
     */
    const stores = computed(() => {
        const storeData = planningManagementData.value || []
        const data = Array.isArray(storeData) ? storeData : []

        return data.map((item: any): Store => {
            const warehouseId = item.warehouse_id ?? item.id ?? 0
            const reference = item.warehouse_reference || item.reference || ''

            // Utiliser l'ID mappé s'il existe
            const finalId = warehouseIdMap.value.get(reference) || warehouseId

            return {
                id: finalId,
                store_name: item.warehouse_name || item.store_name || 'N/A',
                teams_count: item.teams_count || 0,
                jobs_count: item.jobs_count || 0,
                reference: reference
            }
        })
    })

    // ===== CONFIGURATION DES COLONNES =====

    /**
     * Colonnes pour le DataTable du planning
     */
    const adaptedColumns = computed(() => [
        {
            field: 'store_name',
            headerName: 'Nom du magasin',
            sortable: true,
            dataType: 'text' as const,
            width: PLANNING_COLUMN_WIDTHS.store_name,
            editable: false,
            visible: true,
            icon: 'icon-store'
        },
        {
            field: 'teams_count',
            headerName: 'Équipes',
            sortable: true,
            dataType: 'number' as const,
            width: PLANNING_COLUMN_WIDTHS.teams_count,
            editable: false,
            visible: true,
            align: 'center' as const,
            icon: 'icon-users'
        },
        {
            field: 'jobs_count',
            headerName: 'Jobs',
            sortable: true,
            dataType: 'number' as const,
            width: PLANNING_COLUMN_WIDTHS.jobs_count,
            editable: false,
            visible: true,
            align: 'center' as const,
            icon: 'icon-briefcase'
        },
        {
            field: 'reference',
            headerName: 'Référence',
            sortable: true,
            dataType: 'text' as const,
            width: PLANNING_COLUMN_WIDTHS.reference,
            editable: false,
            visible: true,
            icon: 'icon-hash'
        }
    ])

    // ===== QUERYMODEL =====

    /**
     * QueryModel pour gérer les requêtes
     */
    const {
        queryModel: queryModelRef,
        updatePagination: updateQueryPagination,
        updateSort: updateQuerySort,
        updateFilter: updateQueryFilter,
        updateGlobalSearch: updateQueryGlobalSearch
    } = useQueryModel({
        columns: adaptedColumns.value
    })

    /**
     * Convertit le QueryModel selon le mode configuré
     */
    const convertQueryModelToOutput = (queryModelData: QueryModel) => {
        return convertQueryModelToQueryParams(queryModelData)
    }

    // ===== ACTIONS SUR LES MAGASINS =====

    /**
     * Actions disponibles dans le planning pour chaque magasin
     */
    const actions = computed<PlanningAction[]>(() => [
        {
            label: 'Planifier',
            icon: IconCalendar,
            handler: (store: Store) => {
                router.push({
                    name: 'inventory-planning',
                    params: {
                        reference: inventoryReference.value || '',
                        warehouse: store.reference || ''
                    }
                })
            }
        },
        {
            label: inventoryStatus.value === 'EN REALISATION' ? 'Transférer' : 'Affecter',
            icon: IconUser,
            handler: (store: Store) => {
                router.push({
                    name: 'inventory-affecter',
                    params: {
                        reference: inventoryReference.value || '',
                        warehouse: store.reference || ''
                    }
                })
            }
        },
        // Monitoring seulement si l'inventaire est disponible
        ...(inventoryId.value ? [{
            label: 'Monitoring',
            icon: IconBarChart,
            handler: (store: Store) => {
                if (store.id && store.id > 0) {
                    goToMonitoring(inventoryId.value!, store.id)
                }
            }
        }] : [])
    ])

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

    // ===== CHARGEMENT DES DONNÉES =====

    /**
     * Récupère l'ID de l'inventaire par sa référence
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
            inventoryError.value = 'Erreur lors de la récupération de l\'inventaire'
        } finally {
            inventoryLoading.value = false
        }
    }

    /**
     * Charger les données du planning management
     */
    const loadPlanningData = async (queryModel?: QueryModel) => {
        if (!inventoryId.value) return

        // Éviter les appels simultanés
        if (isLoadingData.value) return

        loading.value = true
        try {
            // Créer un QueryModel par défaut si non fourni
            const finalQueryModel: QueryModel = queryModel || {
                page: 1,
                pageSize: 20,
                sort: [],
                filters: {},
                search: '',
                customParams: {}
            }

            await inventoryStore.fetchPlanningManagement(inventoryId.value, finalQueryModel)

            // Mettre à jour l'état local de pagination si on reçoit un QueryModel
            if (queryModel) {
                currentPage.value = queryModel.page || 1
                pageSize.value = queryModel.pageSize || 20
            }

            await nextTick()
        } catch (error) {
            await alertService.error({ text: 'Erreur lors du chargement des données du planning' })
        } finally {
            loading.value = false
        }
    }

    /**
     * Chargement initial des données de planning
     */
    const loadStores = async () => {
        // Éviter les appels simultanés
        if (isLoadingData.value) {
            console.log('[loadStores] EXIT - already loading data')
            return
        }

        try {
            dataTableError.value = null // Reset error state
            await loadPlanningData()
        } catch (error) {
            dataTableError.value = 'Erreur lors du chargement des données de planning'
            loading.value = false // S'assurer que loading est remis à false
            await alertService.error({ text: dataTableError.value })
        }
    }

    /**
     * Réessayer le chargement des données après une erreur
     */
    const retryLoadStores = async () => {
        await loadStores()
    }

    /**
     * Réinitialiser la DataTable du planning
     */
    const resetPlanningDataTable = async () => {
        currentPage.value = 1
        pageSize.value = 20
        await loadPlanningData()
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
     * Handler commun pour les opérations DataTable
     */
    const handlePlanningOperation = async (queryModel: QueryModel) => {
        // Éviter les appels répétés si une erreur est déjà présente
        if (dataTableError.value) {
            console.warn('[usePlanningManagement] Skipping DataTable operation due to existing error:', dataTableError.value)
            return
        }

        // Éviter les appels répétés si un chargement est déjà en cours
        if (isLoadingData.value) {
            console.warn('[usePlanningManagement] Skipping DataTable operation - already loading')
            return
        }

        try {
            dataTableError.value = null // Reset error state
            isLoadingData.value = true
            await loadPlanningData(queryModel)
        } catch (error) {
            console.error('[usePlanningManagement] DataTable operation failed:', error)
            dataTableError.value = 'Erreur lors du chargement des données du planning'
            alertService.error({ text: dataTableError.value })
            // Ne pas relancer - laisser l'utilisateur gérer l'erreur
        } finally {
            isLoadingData.value = false
        }
    }

    // Handlers spécialisés
    const handlePaginationChanged = (queryModel: QueryModel) => handlePlanningOperation(queryModel)
    const handleSortChanged = (queryModel: QueryModel) => handlePlanningOperation(queryModel)
    const handleFilterChanged = (queryModel: QueryModel) => handlePlanningOperation(queryModel)
    const handleGlobalSearchChanged = (queryModel: QueryModel) => handlePlanningOperation(queryModel)


    // ===== HANDLERS GRIDVIEW =====

    /**
     * Handler pour le clic sur un item dans GridView
     */
    const adaptedHandleItemClick = (item: any): void => {
        // Gestion via les actions
    }

    /**
     * Handler pour le clic sur les actions dans GridView
     */
    const adaptedHandleActionsClick = (item: any, e: MouseEvent): void => {
        // Gestion via les actions
    }

    // ===== NAVIGATION =====

    /**
     * Navigation vers la page de détail de l'inventaire
     */
    const goToInventoryDetail = (reference: string): void => {
        router.push({ name: 'inventory-detail', params: { reference } })
    }

    /**
     * Navigation vers la page d'affectation
     */
    const goToAffectation = (reference: string): void => {
        router.push({ name: 'inventory-affecter', params: { reference } })
    }

    /**
     * Navigation vers la page de suivi des jobs
     */
    const goToJobTracking = (reference: string): void => {
        router.push({ name: 'inventory-job-tracking', params: { reference } })
    }

    /**
     * Navigation vers la page de monitoring
     */
    const goToMonitoring = (inventoryId: number, warehouseId: number): void => {
        router.push({
            name: 'inventory-monitoring',
            params: { inventoryId: String(inventoryId), warehouseId: String(warehouseId) }
        })
    }

    // ===== RETURN =====

    // ===== INITIALISATION =====

    /**
     * Initialiser le composable
     */
    const initialize = async () => {
        if (isInitialized.value) return

        try {
            if (!inventoryId.value && inventoryReference.value) {
                await fetchInventoryIdByReference(inventoryReference.value)

            }

            if (inventoryId.value) {
                await loadPlanningData()
                loading.value = false
            }

            isInitialized.value = true
        } catch (error) {
            // S'assurer que loading est remis à false en cas d'erreur
            loading.value = false
            dataTableError.value = 'Erreur lors de l\'initialisation du planning management'
            await alertService.error({ text: dataTableError.value })
        }
    }

    // ===== EXPORT =====

    /**
     * Export des données en CSV
     */
    const handleExportCsv = async () => {
        try {
            if (!inventoryId.value) {
                await alertService.error({ text: 'ID d\'inventaire non disponible' })
                return
            }

            const currentQueryModel = queryModelRef.value
            const exportParams = convertQueryModelToQueryParams(currentQueryModel)
            exportParams.export = 'csv'

            const response = await InventoryService.exportAll(exportParams)
            const blob = response.data as Blob

            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `planning_management_${new Date().toISOString().split('T')[0]}.csv`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            alertService.success({ text: 'Export CSV réussi' })
        } catch (error: any) {
            alertService.error({ text: error?.message || 'Erreur lors de l\'export CSV' })
        }
    }

    /**
     * Export des données en Excel
     */
    const handleExportExcel = async () => {
        try {
            if (!inventoryId.value) {
                await alertService.error({ text: 'ID d\'inventaire non disponible' })
                return
            }

            const currentQueryModel = queryModelRef.value
            const exportParams = convertQueryModelToQueryParams(currentQueryModel)
            exportParams.export = 'excel'

            const response = await InventoryService.exportAll(exportParams)
            const blob = response.data as Blob

            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `planning_management_${new Date().toISOString().split('T')[0]}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            alertService.success({ text: 'Export Excel réussi' })
        } catch (error: any) {
            alertService.error({ text: error?.message || 'Erreur lors de l\'export Excel' })
        }
    }

    // ===== RETURN =====

    return {
        // ===== DONNÉES =====
        stores,
        loadStores,

        // ===== ÉTATS =====
        selectedStore,
        loading,
        isLoadingData,
        dataTableError,
        inventoryStatus,
        inventoryReference,
        inventoryId,
        inventoryLoading,
        inventoryError,
        isInitialized,

        // ===== CONFIGURATION DATATABLE =====
        adaptedColumns,
        actions,
        adaptedActions,
        adaptedGridActions,

        // ===== NAVIGATION =====
        goToInventoryDetail,
        goToAffectation,
        goToJobTracking,
        goToMonitoring,

        // ===== MÉTHODES =====
        selectStore,
        setInventoryStatus,
        setInventoryReference,
        fetchInventoryIdByReference,
        initialize,
        loadPlanningData,
        retryLoadStores,
        resetPlanningDataTable,

        // ===== HANDLERS DATATABLE =====
        handlePaginationChanged,
        handleSortChanged,
        handleFilterChanged,
        handleGlobalSearchChanged,

        // ===== HANDLERS GRIDVIEW =====
        adaptedHandleItemClick,
        adaptedHandleActionsClick,

        // ===== PAGINATION =====
        currentPage,
        pageSize,
        pagination,
        planningTotalItems: computed(() => inventoryStore.totalItems || 0),
        totalPages: computed(() => pagination.value.total_pages || 1),
        totalItems: computed(() => pagination.value.total || 0),

        // ===== QUERYMODEL =====
        queryModel: computed(() => queryModelRef.value),
        queryOutputMode: computed(() => queryOutputMode.value),
        convertQueryModelToOutput,

        // ===== EXPORT =====
        handleExportCsv,
        handleExportExcel
    }
}
