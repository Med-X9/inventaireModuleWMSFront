/**
 * Composable useJobTracking - Gestion du suivi des jobs
 *
 * Ce composable gère :
 * - Le chargement des jobs validés pour un inventaire et un magasin
 * - La transformation des données de jobs en lignes de suivi
 * - La gestion des filtres (magasin, comptage)
 * - La résolution des options de comptage depuis l'inventaire ou les jobs
 * - Le chargement des magasins depuis l'inventaire ou par account_id
 *
 * @module useJobTracking
 */

// ===== IMPORTS VUE =====
import { ref, computed, watch, markRaw, onMounted, nextTick } from 'vue'

// ===== IMPORTS PINIA =====
import { storeToRefs } from 'pinia'

// ===== IMPORTS COMPOSABLES =====
import { useQueryModel } from '@SMATCH-Digital-dev/vue-system-design'

// ===== IMPORTS STORES =====
import { useInventoryStore } from '@/stores/inventory'
import { useWarehouseStore } from '@/stores/warehouse'
import { useJobStore } from '@/stores/job'
import { useSessionStore } from '@/stores/session'

// ===== IMPORTS SERVICES =====
import { alertService } from '@/services/alertService'
import { logger } from '@/services/loggerService'

// ===== IMPORTS EXTERNES =====
import Swal from 'sweetalert2'

// ===== IMPORTS TYPES =====
import type { StoreOption } from '@/interfaces/inventoryResults'
import type { JobResult, JobAssignment, JobEmplacement } from '@/models/Job'
import type { DataTableColumn, ColumnDataType, ActionConfig } from '@SMATCH-Digital-dev/vue-system-design'
import type { QueryModel } from '@SMATCH-Digital-dev/vue-system-design'
import { createQueryModelFromDataTableParams, convertQueryModelToQueryParams, mergeQueryModelWithCustomParams } from '@SMATCH-Digital-dev/vue-system-design'

// ===== IMPORTS ICÔNES =====
import IconPrinter from '@/components/icon/icon-printer.vue'

// ===== INTERFACES =====

/**
 * Configuration pour initialiser le composable
 */
export interface UseJobTrackingConfig {
    /** Référence de l'inventaire */
    inventoryReference?: string
    /** ID du magasin initial (warehouse_id sous forme de string) */
    initialStoreId?: string
    /** Référence du magasin initial (warehouse.reference ou warehouse_name depuis l'URL) */
    initialWarehouseReference?: string
    /** Ordre du comptage initial */
    initialCountingOrder?: number
}

/**
 * Ligne de suivi dans le DataTable
 *
 * On centralise maintenant les informations par job et par comptage
 * - La référence du job et son statut sont fusionnés dans une seule colonne
 * - Chaque comptage (1er, 2ème, 3ème, 4ème, N) est représenté par une colonne dynamique
 *   qui affiche à la fois la session et le statut, et éventuellement le taux d'écart
 */
export interface JobTrackingRow {
    /** ID unique de la ligne */
    id: string
    /** ID du job (extrait depuis id) */
    jobId: number
    /** Référence du job */
    jobReference: string
    /** Statut global du job */
    jobStatus: string | null
    /** Assignments (tous les comptages pour ce job) */
    assignments: AssignmentWithDates[]
    /**
     * Nombre total d'écarts (toutes sessions confondues, si fourni par l'API discrepancies)
     */
    discrepancyCount: number | null
    /**
     * Taux d'écarts global (toutes sessions confondues, si fourni par l'API discrepancies)
     */
    discrepancyRate: number | null
    /**
     * ID de l'assignment par défaut pour l'impression (priorité : 1er comptage puis 2ème, sinon null)
     */
    assignmentId: number | null
    /**
     * Données d'écarts par comptage (discrepancy_count_3er, discrepancy_count_4er, etc.)
     */
    countingDiscrepancies: Record<string, number | null>
}

/**
 * Assignment avec dates (format flexible)
 */
type AssignmentWithDates = JobAssignment & {
    date_transfer?: string | null
    dateTransfert?: string | null
    date_lancement?: string | null
    date_launch?: string | null
    date_end?: string | null
    date_fin?: string | null
}

// ===== UTILITAIRES =====

/**
 * Formate une date/heure au format français
 *
 * @param value - Date à formater (string, null ou undefined)
 * @returns Date formatée ou null
 */
const formatDateTime = (value: string | null | undefined): string | null => {
    if (!value) {
        return null
    }

    try {
        return new Date(value).toLocaleString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    } catch (error) {
        logger.warn('Format de date invalide', { value, error })
        return value
    }
}

/**
 * Mappe un emplacement vers son label
 *
 * @param emplacement - Emplacement à mapper
 * @param index - Index de l'emplacement
 * @returns Label de l'emplacement
 */
const mapEmplacementLabel = (emplacement: JobEmplacement, index: number): string => {
    return emplacement?.location_reference
        || emplacement?.reference
        || `Emplacement ${index + 1}`
}

// ===== COMPOSABLE PRINCIPAL =====

/**
 * Composable pour la gestion du suivi des jobs
 *
 * @param config - Configuration d'initialisation
 * @returns Objet contenant l'état, les méthodes et les données pour le suivi des jobs
 */
export function useJobTracking(config?: UseJobTrackingConfig) {
    // ===== STORES =====
    const inventoryStore = useInventoryStore()
    const warehouseStore = useWarehouseStore()
    const jobStore = useJobStore()
    const sessionStore = useSessionStore()

    // ===== STORE REFS =====
    const { loading: inventoryLoading } = storeToRefs(inventoryStore)
    const { warehouses } = storeToRefs(warehouseStore)
    const { jobsValidated, loading: jobsLoading, jobsPaginationMetadata } = storeToRefs(jobStore)

    // ===== ÉTAT RÉACTIF =====

    /** Référence de l'inventaire */
    const inventoryReference = ref(config?.inventoryReference ?? '')

    /** ID de l'inventaire */
    const inventoryId = ref<number | null>(null)

    /** Objet inventaire complet */
    const inventory = ref<any | null>(null)

    /** ID du compte */
    const accountId = ref<number | null>(null)

    /** Indicateur d'initialisation */
    const isInitialized = ref(false)

    /** Options de magasins */
    const storeOptions = ref<StoreOption[]>([])

    /** Magasin sélectionné (warehouse_id au format string) */
    const selectedStore = ref<string | null>(config?.initialStoreId ?? null)

    /** Référence du magasin initial (ex. depuis l'URL ?warehouse=REF) */
    const initialWarehouseReference = ref<string | null>(config?.initialWarehouseReference ?? null)

    // Paramètres personnalisés pour les appels API
    const trackingCustomParams = computed(() => ({
        inventory_id: inventoryId.value,
        warehouse_id: selectedStore.value ? Number(selectedStore.value) : null
    }))

    // ===== ÉTAT POUR LA VUE =====
    const trackingLoadingLocal = ref(false)

    // ===== QUERYMODEL POUR TRACKING =====

    /**
     * QueryModel pour gérer les requêtes Tracking
     * Harmonisé avec useInventoryResults.ts - utilise maintenant useQueryModel
     */
    const {
        queryModel: trackingQueryModelRef,
        updatePagination,
        updateSort,
        updateFilter,
        updateGlobalSearch
    } = useQueryModel({
        columns: [] as any // Les colonnes sont dynamiques, on passe un tableau vide pour commencer
    })

    // Cache des derniers appels pour éviter les appels répétés
    let lastExecutedQueryModel: QueryModel | null = null

    // File d'attente pour les événements DataTable qui arrivent avant l'initialisation
    const pendingEventsQueue: Array<{ eventType: string; queryModel: QueryModel }> = []

    /** État de chargement des magasins */
    const isFetchingStores = ref(false)

    /** Clé pour forcer le re-render des tables (harmonisé avec useAffecter.ts et useInventoryResults.ts) */
    const trackingKey = ref(0)

    /** Référence au composant DataTable du tracking */
    const trackingTableRef = ref<any>(null)

    // ===== PAGINATION CALCULÉE =====

    /**
     * Pagination calculée pour les jobs de suivi
     *
     * Utilise UNIQUEMENT les valeurs retournées par le backend via jobsPaginationMetadata du store.
     * Le backend retourne { page, pageSize, total, totalPages } selon PAGINATION_FRONTEND.md.
     *
     * Le DataTable utilise ces valeurs pour afficher la pagination correctement.
     *
     * @computed {Object} trackingPaginationComputed - Objet de pagination avec les valeurs du backend
     * @computed {number} current_page - Page actuelle (1-indexed)
     * @computed {number} total_pages - Nombre total de pages
     * @computed {boolean} has_next - True s'il y a une page suivante
     * @computed {boolean} has_previous - True s'il y a une page précédente
     * @computed {number} page_size - Taille de la page
     * @computed {number} total - Nombre total d'éléments
     */
    const trackingPaginationComputed = computed(() => {
        const storeMetadata = jobsPaginationMetadata.value

        // Utiliser directement les valeurs du backend depuis jobsPaginationMetadata
        const currentPageValue = storeMetadata?.page ?? 1
        const pageSizeValue = storeMetadata?.pageSize ?? 50
        const totalValue = storeMetadata?.total ?? 0
        let totalPagesValue = storeMetadata?.totalPages ?? 0

        // Calculer totalPages seulement si le backend ne le fournit pas
        if (totalPagesValue === 0 && totalValue > 0 && pageSizeValue > 0) {
            totalPagesValue = Math.max(1, Math.ceil(totalValue / pageSizeValue))
        } else if (totalPagesValue === 0 && totalValue === 0) {
            // Si total est 0, totalPages doit être au minimum 1 pour éviter "Page 1 sur 0"
            totalPagesValue = 1
        }

        return {
            current_page: currentPageValue,
            total_pages: totalPagesValue,
            has_next: totalPagesValue > 0 ? currentPageValue < totalPagesValue : false,
            has_previous: currentPageValue > 1,
            page_size: pageSizeValue,
            total: totalValue
        }
    })

    /** Lignes de suivi */
    const trackingRows = ref<JobTrackingRow[]>([])

    /** IDs des lignes sélectionnées */
    const selectedRows = ref<string[]>([])

    // Watcher pour forcer le re-render des colonnes quand les données arrivent
    watch(trackingRows, (newRows) => {
        if (newRows && newRows.length > 0) {
            // Incrémenter trackingKey pour forcer le re-render des colonnes dynamiques
            trackingKey.value++
        }
    }, { immediate: false })

    /**
     * Traite un événement DataTable directement (sans vérification d'initialisation)
     * Utilisé pour traiter les événements mis en file d'attente
     */
    const processEventDirectly = async (eventType: string, queryModel: QueryModel) => {
        // S'assurer que le QueryModel a des valeurs par défaut valides
        const sanitizedQueryModel: QueryModel = {
            page: queryModel.page ?? 1,
            pageSize: queryModel.pageSize ?? 50,
            sort: queryModel.sort ?? [],
            filters: queryModel.filters ?? {},
            search: queryModel.search ?? '',
            customParams: queryModel.customParams ?? {}
        }

        // Toujours fusionner avec les customParams requis
        const finalQueryModel = mergeQueryModelWithCustomParams(sanitizedQueryModel, trackingCustomParams.value)

        // Éviter les appels API inutiles en comparant avec le dernier appel réussi
        const queryModelStr = JSON.stringify(finalQueryModel)
        const lastQueryModelStr = lastExecutedQueryModel ? JSON.stringify(lastExecutedQueryModel) : null

        if (queryModelStr === lastQueryModelStr) {
            return
        }

        // Éviter les appels API inutiles pour les événements de filtre/recherche vides
        if (eventType === 'query-model-changed' || eventType === 'filter' || eventType === 'search') {
            const hasFilters = Object.keys(finalQueryModel.filters || {}).length > 0
            const hasSearch = !!finalQueryModel.search?.trim()
            const hasSorting = (finalQueryModel.sort || []).length > 0

            // Si c'est un événement filter/search complètement vide (pas de filtres, pas de recherche, pas de tri),
            // et que c'est la page 1, éviter l'appel API inutile
            if (!hasFilters && !hasSearch && !hasSorting && finalQueryModel.page === 1) {
                return
            }
        }

        try {
            // Activer le loading pour les événements DataTable
            if (eventType === 'pagination' || eventType === 'page-size-changed' || eventType === 'filter' || eventType === 'search' || eventType === 'sort') {
                trackingLoadingLocal.value = true
            }

            await fetchTrackingData(finalQueryModel)

            // Mettre à jour le cache après un appel réussi
            lastExecutedQueryModel = { ...finalQueryModel }

            // Forcer le re-rendu de la DataTable pour tous les événements qui modifient les données
            if (eventType === 'pagination' || eventType === 'page-size-changed' || eventType === 'filter' || eventType === 'search' || eventType === 'sort') {
                trackingKey.value++
                trackingLoadingLocal.value = false
            }
        } catch (error) {
            console.error('[useJobTracking] ❌ Error in fetchTrackingData:', {
                eventType,
                error: error,
                queryModel: finalQueryModel
            })
            await alertService.error({ text: 'Erreur lors du chargement des données de suivi' })
            // Désactiver le loading en cas d'erreur
            if (eventType === 'pagination' || eventType === 'page-size-changed' || eventType === 'filter' || eventType === 'search' || eventType === 'sort') {
                trackingLoadingLocal.value = false
            }
        }
    }

    /**
     * Handler unifié pour toutes les opérations de la DataTable Tracking
     */
    const onTrackingTableEvent = async (eventType: string, queryModel: QueryModel) => {
        console.log('[useJobTracking.onTrackingTableEvent] Event received:', eventType, 'initialized:', isInitialized.value, 'queue length:', pendingEventsQueue.length)

        // Vérifier que les IDs requis sont disponibles avant de lancer l'API
        if (!inventoryId.value || !selectedStore.value) {
            console.warn('[useJobTracking] Tracking API not called: missing inventoryId or selectedStore')
            return
        }

        // Si l'initialisation n'est pas terminée, mettre l'événement en file d'attente
        // Ces événements sont souvent déclenchés automatiquement par le DataTable au montage
        // quand il restaure son état sauvegardé
        if (!isInitialized.value) {
            console.log('[useJobTracking.onTrackingTableEvent] Queueing event:', eventType)
            pendingEventsQueue.push({ eventType, queryModel })
            return
        }

        // Traiter l'événement directement
        console.log('[useJobTracking.onTrackingTableEvent] Processing event directly:', eventType)
        await processEventDirectly(eventType, queryModel)
    }

    // ===== COMPUTED PROPERTIES =====

    /** État de chargement global */
    const isLoading = computed(() => inventoryLoading.value || jobsLoading.value || isFetchingStores.value)

    /**
     * Styles de badges pour les statuts (cohérent avec useAffecter.ts)
     */
    const badgeStyles = [
        {
            value: 'EN ATTENTE',
            class: 'inline-flex items-center rounded-md bg-amber-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-amber-600/20 ring-inset'
        },
        {
            value: 'VALIDE',
            class: 'inline-flex items-center rounded-md bg-slate-700 px-2 py-1 text-xs font-medium text-white ring-1 ring-slate-600/20 ring-inset'
        },
        {
            value: 'AFFECTE',
            class: 'inline-flex items-center rounded-md bg-orange-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-orange-600/20 ring-inset'
        },
        {
            value: 'PRET',
            class: 'inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-800 ring-1 ring-purple-600/20 ring-inset'
        },
        {
            value: 'TRANSFERT',
            class: 'inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-800 ring-1 ring-orange-600/20 ring-inset'
        },
        {
            value: 'ENTAME',
            class: 'inline-flex items-center rounded-md bg-blue-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-blue-600/20 ring-inset'
        },
        {
            value: 'TERMINE',
            class: 'inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-800 ring-1 ring-green-600/20 ring-inset'
        },
        {
            value: 'CLOTURE',
            class: 'inline-flex items-center rounded-md bg-slate-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-slate-600/20 ring-inset'
        }
    ]
    const badgeDefaultClass = 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset'

    /** Options de filtre pour les statuts (cohérent avec useAffecter.ts) */
    const statusFilterOptions = [
        { label: 'EN ATTENTE', value: 'EN ATTENTE' },
        { label: 'VALIDE', value: 'VALIDE' },
        { label: 'AFFECTE', value: 'AFFECTE' },
        { label: 'PRET', value: 'PRET' },
        { label: 'TRANSFERT', value: 'TRANSFERT' },
        { label: 'ENTAME', value: 'ENTAME' },
        { label: 'TERMINE', value: 'TERMINE' },
        { label: 'CLOTURE', value: 'CLOTURE' }
    ]

    /** Helper : retourne la classe de badge à partir d'un statut */
    const getStatusBadgeClass = (status: string | null | undefined, column?: any): string => {
        if (!status) {
            return badgeDefaultClass
        }
        const styles = column?.badgeStyles as typeof badgeStyles | undefined
        const defaultClass = (column?.badgeDefaultClass as string | undefined) || badgeDefaultClass
        const badgeStyle = (styles || badgeStyles).find(s => s.value === status)
        return badgeStyle?.class || defaultClass
    }

    /** Helper : retourne le label pour un ordre de comptage (1er, 2ème, 3ème, Nème) */
    const getCountingOrderLabel = (order: number): string => {
        if (order === 1) return '1er comptage'
        if (order === 2) return '2ème comptage'
        if (order === 3) return '3ème comptage'
        return `${order}ème comptage`
    }

    /** Helper : récupère les comptages qui ont des données d'écarts (>= 3) */
    const getCountingOrdersWithDiscrepancies = (): number[] => {
        if (!trackingRows.value.length) {
            return []
        }

        const ordersWithDiscrepancies = new Set<number>()
        trackingRows.value.forEach(row => {
            if (row.countingDiscrepancies) {
                Object.keys(row.countingDiscrepancies).forEach(key => {
                    const order = parseInt(key)
                    if (!isNaN(order) && order >= 3) {
                        ordersWithDiscrepancies.add(order)
                    }
                })
            }
        })

        return Array.from(ordersWithDiscrepancies).sort((a, b) => a - b)
    }

    /** Helper : récupère le max des counting_order présents dans les lignes */
    const getMaxCountingOrder = (): number => {
        if (!trackingRows.value.length) {
            return 0
        }

        let maxOrder = 0
        trackingRows.value.forEach(row => {
            if (row.assignments && Array.isArray(row.assignments)) {
                row.assignments.forEach(ass => {
                    // Ne compter que les assignments qui ont un counting_order valide
                    // Ignorer les assignments avec status null (non créés)
                    if (ass.counting_order && ass.counting_order > maxOrder && ass.status !== null) {
                        maxOrder = ass.counting_order
                    }
                })
            }
        })

        // Toujours afficher au moins les 2 premiers comptages (1er et 2ème)
        return Math.max(maxOrder, 2)
    }

    /** Helper : récupère tous les counting_order uniques présents dans les données */
    const getAvailableCountingOrders = (): number[] => {
        if (!trackingRows.value.length) {
            return [1, 2] // Par défaut, afficher au moins 1er et 2ème comptage
        }

        const ordersSet = new Set<number>()
        trackingRows.value.forEach(row => {
            // Ajouter les counting_order des assignments
            if (row.assignments && Array.isArray(row.assignments)) {
                row.assignments.forEach(ass => {
                    // Inclure tous les counting_order, même ceux avec status null (pour les colonnes futures)
                    if (ass.counting_order) {
                        ordersSet.add(ass.counting_order)
                    }
                })
            }

            // Ajouter les counting_order des données d'écarts (discrepancy_count_Xer)
            if (row.countingDiscrepancies) {
                Object.keys(row.countingDiscrepancies).forEach(key => {
                    const order = parseInt(key)
                    if (!isNaN(order)) {
                        ordersSet.add(order)
                    }
                })
            }
        })

        const orders = Array.from(ordersSet).sort((a, b) => a - b)
        // Toujours inclure au moins 1 et 2
        if (!orders.includes(1)) orders.unshift(1)
        if (!orders.includes(2)) {
            const index = orders.findIndex(o => o > 2)
            if (index === -1) orders.push(2)
            else orders.splice(index, 0, 2)
        }

        return orders
    }

    /** Colonnes du DataTable - définies comme computed pour la réactivité (comme useInventoryResults) */
    const columns = computed<DataTableColumn[]>(() => {
        // Forcer la dépendance à trackingKey pour que les colonnes soient recalculées à chaque refresh
        const _forceUpdate = trackingKey.value;

        const cols: DataTableColumn[] = []

        // Log pour déboguer la création des colonnes
        logger.debug('columns computed - création des colonnes', {
            trackingKey: trackingKey.value,
            trackingRowsLength: trackingRows.value.length,
            availableOrders: getAvailableCountingOrders()
        })

        // Colonne cachée pour l'ID d'assignment (impression)
        cols.push({
                headerName: 'ID Assignment',
                field: 'assignmentId',
                sortable: false,
                filterable: false,
            dataType: 'number',
                width: 0,
                visible: false,
                hide: true,
                editable: false,
                draggable: false,
                autoSize: false,
                description: 'ID de l\'assignment pour l\'impression (caché)'
        })

        // Colonne principale : Job avec badge de statut (style useAffecter.ts)
        cols.push({
            headerName: 'Job',
            field: 'jobReference',
            sortable: true,
            filterable: true,
            dataType: 'text' as ColumnDataType,
            width: 180,
            minWidth: 150,
            visible: true,
            editable: false,
            draggable: true,
            autoSize: true,
            align: 'center' as const,
            description: 'Référence du job avec badge de statut',
            badgeStyles,
            badgeDefaultClass,
            allowWrap: true,
            cellRenderer: ((paramsOrValue: any, column?: any, row?: any) => {
                let rowData: JobTrackingRow | null = null

                if (row && typeof row === 'object' && column) {
                    rowData = row as JobTrackingRow
                } else if (paramsOrValue && typeof paramsOrValue === 'object') {
                    if (paramsOrValue.data) {
                        rowData = paramsOrValue.data as JobTrackingRow
                    } else {
                        rowData = paramsOrValue as JobTrackingRow
                    }
                }

                if (!rowData) {
                    return '-'
                }

                const reference = rowData?.jobReference || '-'
                const status = rowData?.jobStatus || ''

                if (!status) {
                    return `<span class="font-medium text-slate-900">${reference}</span>`
                }

                const badgeStyle = badgeStyles.find((s: any) => s.value === status)
                const badgeClass = badgeStyle?.class || badgeDefaultClass

                return `<span class="${badgeClass}">${reference}</span>`
            }) as any,
            filterConfig: {
                dataType: 'select' as const,
                operator: 'equals' as const,
                options: statusFilterOptions
            }
        })

        // Colonnes dynamiques par comptage : Session + Statut (badge), Taux d'écart, Nombre d'écarts
        // Utiliser les counting_order disponibles dans les données pour créer les colonnes dynamiquement
        const availableOrders = getAvailableCountingOrders()
        const ordersWithDiscrepancies = getCountingOrdersWithDiscrepancies()

        availableOrders.forEach(order => {
            // Colonne 1 : Session avec badge de statut du comptage (fusionné)
            cols.push({
                headerName: `${getCountingOrderLabel(order)} - Session`,
                field: `counting_${order}_session`,
                sortable: true,
                filterable: true,
                dataType: 'text' as ColumnDataType,
                width: 180,
                minWidth: 160,
                align: 'center' as const,
                allowWrap: true,
                description: `Session et statut du ${getCountingOrderLabel(order)}`,
                badgeStyles,
                badgeDefaultClass,
                cellRenderer: ((paramsOrValue: any, column?: any, row?: any) => {
                    let rowData: JobTrackingRow | null = null

                    if (row && typeof row === 'object' && column) {
                        rowData = row as JobTrackingRow
                    } else if (paramsOrValue && typeof paramsOrValue === 'object') {
                        if (paramsOrValue.data) {
                            rowData = paramsOrValue.data as JobTrackingRow
                        } else {
                            rowData = paramsOrValue as JobTrackingRow
                        }
                    }

                    if (!rowData) {
                        return '-'
                    }

                    const assignments = rowData?.assignments || []
                    const assignment = assignments.find((a: any) => a.counting_order === order)

                    if (!assignment || !assignment.status || assignment.status === null) {
                        return '-'
                    }

                    const sessionLabel =
                        (assignment as any).username ||
                        assignment.session?.username ||
                        (assignment as any).session_full_name ||
                        'Session inconnue'
                    const status = assignment.status || ''

                    const badgeStyle = badgeStyles.find((s: any) => s.value === status)
                    const badgeClass = badgeStyle?.class || badgeDefaultClass

                    return `<span class="${badgeClass}">${sessionLabel}</span>`
                }) as any,
                filterConfig: {
                    dataType: 'select' as const,
                    operator: 'equals' as const,
                    options: statusFilterOptions
                }
            })

            // Ajouter les colonnes d'écarts seulement si ce comptage a des données d'écarts
            if (ordersWithDiscrepancies.includes(order)) {
                // Colonne 2 : Taux d'écart du comptage (seulement pour comptages qui ont des données d'écarts)
                cols.push({
                    headerName: `${getCountingOrderLabel(order)} - Taux écart`,
                    field: `counting_${order}_rate`,
                    sortable: true,
                    filterable: false,
                    dataType: 'number' as ColumnDataType,
                    width: 130,
                    minWidth: 110,
                    align: 'center' as const,
                    description: `Taux d'écart du ${getCountingOrderLabel(order)} (en %)`,
                    cellRenderer: ((paramsOrValue: any, column?: any, row?: any) => {
                        let rowData: JobTrackingRow | null = null

                        if (row && typeof row === 'object') {
                            rowData = row as JobTrackingRow
                        } else if (paramsOrValue && typeof paramsOrValue === 'object') {
                            if (paramsOrValue.data) {
                                rowData = paramsOrValue.data as JobTrackingRow
                            } else {
                                rowData = paramsOrValue as JobTrackingRow
                            }
                        }

                        if (!rowData) {
                            return '-'
                        }

                        // Récupérer le taux d'écart global (car les données spécifiques par comptage ne sont pas disponibles)
                        const rate = rowData.discrepancyRate
                        if (rate === null || rate === undefined) {
                            return '-'
                        }

                        const numRate = Number(rate)
                        const colorClass = numRate === 0
                            ? 'text-green-600 font-semibold'
                            : numRate < 10
                            ? 'text-yellow-600 font-semibold'
                            : 'text-red-600 font-semibold'

                        return `<span class="${colorClass}">${numRate.toFixed(2)}%</span>`
                    }) as any
                })

                // Colonne 3 : Nombre d'écarts du comptage (seulement pour comptages qui ont des données d'écarts)
                cols.push({
                    headerName: `${getCountingOrderLabel(order)} - Nb écarts`,
                    field: `counting_${order}_count`,
                    sortable: true,
                    filterable: false,
                    dataType: 'number' as ColumnDataType,
                    width: 120,
                    minWidth: 100,
                    align: 'center' as const,
                    description: `Nombre d'écarts du ${getCountingOrderLabel(order)}`,
                    cellRenderer: ((paramsOrValue: any, column?: any, row?: any) => {
                        let rowData: JobTrackingRow | null = null

                        if (row && typeof row === 'object') {
                            rowData = row as JobTrackingRow
                        } else if (paramsOrValue && typeof paramsOrValue === 'object') {
                            if (paramsOrValue.data) {
                                rowData = paramsOrValue.data as JobTrackingRow
                            } else {
                                rowData = paramsOrValue as JobTrackingRow
                            }
                        }

                        if (!rowData) {
                            return '-'
                        }

                        // Récupérer le nombre d'écarts depuis countingDiscrepancies
                        const count = rowData.countingDiscrepancies?.[order.toString()] ?? null

                        if (count === null || count === undefined) {
                            return '-'
                        }

                        const numCount = Number(count)
                        const colorClass = numCount === 0
                            ? 'text-green-600 font-semibold'
                            : numCount < 10
                            ? 'text-yellow-600 font-semibold'
                            : 'text-red-600 font-semibold'

                        return `<span class="${colorClass}">${numCount}</span>`
                    }) as any
                })
            }
        })

        // Colonne : Taux d'écart global (tous comptages)
        cols.push({
            headerName: 'Taux écart global',
            field: 'discrepancyRate',
            sortable: true,
            filterable: false,
            dataType: 'number' as ColumnDataType,
            width: 150,
            minWidth: 130,
            align: 'center' as const,
            visible: true,
            editable: false,
            description: 'Taux d\'écart global tous comptages confondus (en %)',
            valueFormatter: (params: any) => {
                const rate = params.value
                if (rate === null || rate === undefined) return '-'
                return `${Number(rate).toFixed(2)}%`
            },
            cellRenderer: ((paramsOrValue: any, column?: any, row?: any) => {
                let rowData: JobTrackingRow | null = null

                if (row && typeof row === 'object') {
                    rowData = row as JobTrackingRow
                } else if (paramsOrValue && typeof paramsOrValue === 'object') {
                    if (paramsOrValue.data) {
                        rowData = paramsOrValue.data as JobTrackingRow
                    } else {
                        rowData = paramsOrValue as JobTrackingRow
                    }
                }

                if (!rowData) {
                    return '-'
                }

                const rate = rowData.discrepancyRate
                if (rate === null || rate === undefined) return '-'
                const numRate = Number(rate)
                const colorClass =
                    numRate === 0
                        ? 'text-green-600 font-semibold'
                        : numRate < 10
                        ? 'text-yellow-600 font-semibold'
                        : 'text-red-600 font-semibold'
                return `<span class="${colorClass}">${numRate.toFixed(2)}%</span>`
            }) as any
        })

        // Colonne : Nombre d'écarts global (tous comptages)
        cols.push({
            headerName: 'Nb écarts global',
            field: 'discrepancyCount',
            sortable: true,
            filterable: false,
            dataType: 'number' as ColumnDataType,
            width: 140,
            minWidth: 120,
            align: 'center' as const,
            visible: true,
            editable: false,
            description: 'Nombre d\'écarts global tous comptages confondus',
            cellRenderer: ((paramsOrValue: any, column?: any, row?: any) => {
                let rowData: JobTrackingRow | null = null

                if (row && typeof row === 'object') {
                    rowData = row as JobTrackingRow
                } else if (paramsOrValue && typeof paramsOrValue === 'object') {
                    if (paramsOrValue.data) {
                        rowData = paramsOrValue.data as JobTrackingRow
                    } else {
                        rowData = paramsOrValue as JobTrackingRow
                    }
                }

                if (!rowData) {
                    return '-'
                }

                const count = rowData.discrepancyCount
                if (count === null || count === undefined) return '-'
                const numCount = Number(count)
                const colorClass =
                    numCount === 0
                        ? 'text-green-600 font-semibold'
                        : numCount < 10
                        ? 'text-yellow-600 font-semibold'
                        : 'text-red-600 font-semibold'
                return `<span class="${colorClass}">${numCount}</span>`
            }) as any
        })

        return cols
    })

    /** Indique si des lignes existent */
    const hasRows = computed(() => trackingRows.value.length > 0)

    /** Nombre de lignes sélectionnées */
    const selectedRowsCount = computed(() => selectedRows.value.length)

    /** Indicateur de sélection */
    const hasSelectedRows = computed(() => selectedRows.value.length > 0)

    // ===== MÉTHODES DE RÉSOLUTION =====

    /**
     * Synchronise les options de magasins et sélectionne le premier si aucun n'est sélectionné
     *
     * @param newOptions - Nouvelles options de magasins
     */
    const synchronizeStoreOptions = (newOptions: StoreOption[]) => {
        storeOptions.value = newOptions
        if (!selectedStore.value && newOptions.length > 0) {
            selectedStore.value = newOptions[0].value
        }
    }

    // ===== TRANSFORMATION DES DONNÉES =====

    /**
     * Transforme les jobs en lignes de suivi pour le DataTable
     * Une ligne par job avec les statuts des comptages
     *
     * @param jobs - Liste des jobs à transformer
     * @returns Lignes de suivi formatées
     */
    const transformJobsToRows = (jobs: JobResult[]): JobTrackingRow[] => {
        const rows: JobTrackingRow[] = []

        jobs.forEach(job => {
            // Trouver les assignments de 1er et 2ème comptage
            const assignments = job.assignments || []
            const firstCounting = assignments.find((a: any) => a.counting_order === 1) || null
            const secondCounting = assignments.find((a: any) => a.counting_order === 2) || null

            // Déterminer l'assignment_id à utiliser pour l'impression
            // Priorité : 1er comptage, sinon 2e comptage, sinon null
            // Les assignments depuis l'API peuvent avoir un id même si le type ne le définit pas
            let assignmentId: number | null = null
            const firstCountingId = (firstCounting as any)?.id || (firstCounting as any)?.assignment_id
            const secondCountingId = (secondCounting as any)?.id || (secondCounting as any)?.assignment_id

            if (firstCountingId) {
                assignmentId = typeof firstCountingId === 'number' ? firstCountingId : parseInt(String(firstCountingId))
            } else if (secondCountingId) {
                assignmentId = typeof secondCountingId === 'number' ? secondCountingId : parseInt(String(secondCountingId))
            }

            rows.push({
                id: `${job.id}`,
                jobId: typeof job.id === 'number' ? job.id : parseInt(String(job.id)) || 0,
                jobReference: job.reference || `Job ${job.id}`,
                jobStatus: job.status || null,
                assignments: assignments as AssignmentWithDates[],
                discrepancyCount: null,
                discrepancyRate: null,
                assignmentId,
                countingDiscrepancies: {}
            })
        })

        return rows
    }

    /**
     * Transforme les jobs discrepancies en lignes de suivi pour le DataTable
     * Une ligne par job avec les statuts des comptages
     *
     * @param jobs - Liste des jobs depuis l'endpoint discrepancies
     * @returns Lignes de suivi formatées
     */
    const transformDiscrepanciesToRows = (jobs: any[]): JobTrackingRow[] => {
        const rows: JobTrackingRow[] = []

        jobs.forEach(job => {
            const assignments = job.assignments || []

            // Filtrer les assignments valides (ceux qui ont un status non null)
            // Les assignments avec status null sont des placeholders pour les comptages futurs
            const validAssignments = assignments.filter((a: any) => a.status !== null && a.status !== undefined)

            // Trouver les assignments de 1er et 2ème comptage pour l'impression
            const firstCounting = validAssignments.find((a: any) => a.counting_order === 1) || null
            const secondCounting = validAssignments.find((a: any) => a.counting_order === 2) || null

            // Récupérer les informations d'écarts du job
            const discrepancyCount = job.discrepancy_count ?? null
            const discrepancyRate = job.discrepancy_rate ?? null

            // Récupérer les données d'écarts par comptage (discrepancy_count_3er, discrepancy_count_4er, etc.)
            const countingDiscrepancies: Record<string, number | null> = {}
            Object.keys(job).forEach(key => {
                if (key.startsWith('discrepancy_count_') && key !== 'discrepancy_count') {
                    // Extraire le numéro du comptage (ex: "3er" -> 3, "4er" -> 4)
                    const match = key.match(/discrepancy_count_(\d+)er/)
                    if (match) {
                        const countingOrder = parseInt(match[1])
                        countingDiscrepancies[countingOrder.toString()] = job[key] ?? null
                    }
                }
            })

            // Déterminer l'assignment_id à utiliser pour l'impression
            // Priorité : 1er comptage, sinon 2e comptage, sinon null
            // Les assignments peuvent avoir counting_reference comme identifiant
            let assignmentId: number | null = null
            const firstCountingId = (firstCounting as any)?.id ||
                                   (firstCounting as any)?.assignment_id ||
                                   (firstCounting as any)?.counting_reference
            const secondCountingId = (secondCounting as any)?.id ||
                                    (secondCounting as any)?.assignment_id ||
                                    (secondCounting as any)?.counting_reference

            if (firstCountingId) {
                // Essayer de convertir en nombre, sinon garder comme string
                const parsed = typeof firstCountingId === 'number' ? firstCountingId : parseInt(String(firstCountingId))
                if (!Number.isNaN(parsed)) {
                    assignmentId = parsed
                }
            } else if (secondCountingId) {
                const parsed = typeof secondCountingId === 'number' ? secondCountingId : parseInt(String(secondCountingId))
                if (!Number.isNaN(parsed)) {
                    assignmentId = parsed
                }
            }

            // Créer une ligne par job avec tous les assignments (y compris ceux avec status null pour les colonnes futures)
            const row: JobTrackingRow = {
                id: `job-${job.job_id}`,
                jobId: job.job_id,
                jobReference: job.job_reference || `job-${job.job_id}`,
                jobStatus: job.job_status || null,
                assignments: assignments as AssignmentWithDates[], // Garder tous les assignments pour les colonnes dynamiques
                discrepancyCount,
                discrepancyRate,
                assignmentId,
                countingDiscrepancies
            }

            logger.debug('Ligne créée pour job', {
                jobId: job.job_id,
                jobReference: row.jobReference,
                assignmentsCount: row.assignments.length,
                countingDiscrepancies: row.countingDiscrepancies,
                assignments: row.assignments.map((a: any) => ({
                    counting_order: a.counting_order,
                    status: a.status,
                    username: a.username
                }))
            })

            rows.push(row)
        })

        logger.debug('Lignes transformées', {
            rowsCount: rows.length,
            firstRow: rows[0],
            firstRowAssignmentsCount: rows[0]?.assignments?.length
        })

        return rows
    }

    // ===== MÉTHODES DE CHARGEMENT =====

    /**
     * Charge les magasins depuis l'inventaire ou par account_id
     */
    const fetchStores = async () => {
        if (!inventoryId.value || !inventory.value) {
            return
        }

        try {
            isFetchingStores.value = true

            // Utiliser les magasins depuis l'inventaire
            const inventoryWarehouses = inventory.value.warehouses || []

            if (inventoryWarehouses.length > 0) {
                // Convertir les warehouses de l'inventaire en StoreOption
                const storeList: StoreOption[] = inventoryWarehouses.map((wh: any) => ({
                    label: wh.warehouse_name || wh.reference || `Entrepôt ${wh.id || wh.warehouse_id}`,
                    value: String(wh.id || wh.warehouse_id)
                }))
                synchronizeStoreOptions(storeList)
                logger.debug('Magasins chargés depuis l\'inventaire', storeList)
            } else {
                // Fallback : charger les magasins filtrés par account_id
                if (accountId.value) {
                    await warehouseStore.fetchWarehouses(accountId.value)
                    const fallbackStores: StoreOption[] = warehouses.value.map(warehouse => ({
                        label: warehouse.warehouse_name || warehouse.reference || `Entrepôt ${warehouse.id}`,
                        value: String(warehouse.id)
                    }))
                    synchronizeStoreOptions(fallbackStores)
                    logger.debug('Magasins chargés par account_id (fallback)', fallbackStores)
                } else {
                    logger.warn('Aucun magasin disponible dans l\'inventaire et aucun account_id')
                }
            }
        } catch (error) {
            logger.error('Erreur lors du chargement des magasins pour le suivi des jobs', error)
            // Ne pas bloquer avec une erreur, utiliser le fallback
            if (accountId.value) {
                try {
                    await warehouseStore.fetchWarehouses(accountId.value)
                    const fallbackStores: StoreOption[] = warehouses.value.map(warehouse => ({
                        label: warehouse.warehouse_name || warehouse.reference || `Entrepôt ${warehouse.id}`,
                        value: String(warehouse.id)
                    }))
                    synchronizeStoreOptions(fallbackStores)
                } catch (fallbackError) {
                    logger.error('Erreur lors du fallback des magasins', fallbackError)
                }
            }
        } finally {
            isFetchingStores.value = false
        }
    }

    /**
     * Convertit les paramètres au format QueryModel vers les paramètres API
     *
     * @param queryModel - Modèle de requête au format QueryModel
     * @returns Paramètres pour l'API
     */
    const convertTrackingParams = (queryModel: QueryModel) => {
        // Convertir le QueryModel en paramètres de requête
        const params = convertQueryModelToQueryParams(queryModel)

        // Adapter les noms de champs si nécessaire (mapping entre les champs du DataTable et ceux de l'API)
        const apiParams: Record<string, any> = {
            page: parseInt(params.get('page') || '1'),
            page_size: parseInt(params.get('pageSize') || '1000')
        }

        // Ajouter le tri si présent
        if (queryModel.sort && queryModel.sort.length > 0) {
            // Convertir le format de tri pour l'API
            apiParams.ordering = queryModel.sort.map((s: any) => {
                const field = s.colId
                const direction = s.sort === 'desc' ? '-' : ''
                return `${direction}${field}`
            }).join(',')
        }

        // Ajouter les filtres si présents
        if (queryModel.filters && Object.keys(queryModel.filters).length > 0) {
            Object.entries(queryModel.filters).forEach(([field, filterModel]: [string, any]) => {
                if (filterModel && filterModel.value !== undefined && filterModel.value !== null && filterModel.value !== '') {
                    // Adapter selon le format attendu par l'API
                    // Pour les filtres de type 'equals', utiliser directement le champ
                    if (filterModel.operator === 'equals' || !filterModel.operator) {
                        apiParams[field] = filterModel.value
                    } else {
                        // Pour d'autres opérateurs, adapter selon les besoins de l'API
                        apiParams[`${field}__${filterModel.operator}`] = filterModel.value
                    }
                }
            })
        }

        // Ajouter la recherche globale si présente
        if (queryModel.search && queryModel.search.trim() !== '') {
            apiParams.search = queryModel.search.trim()
        }

        return apiParams
    }

    /**
     * Charge les données de suivi des jobs depuis l'endpoint discrepancies
     * Prérequis : inventory et selectedStore doivent être définis
     *
     * @param queryModel - Modèle de requête avec tri, filtres et recherche
     */
    const fetchTrackingData = async (queryModel: QueryModel) => {
        if (!inventoryId.value || !selectedStore.value) {
            logger.debug('fetchTrackingData: conditions non remplies', {
                inventoryId: inventoryId.value,
                selectedStore: selectedStore.value
            })
            trackingRows.value = []
            return
        }

        try {
            logger.debug('fetchTrackingData: début du chargement', {
                inventoryId: inventoryId.value,
                warehouseId: selectedStore.value,
                queryModel
            })
            const warehouseId = Number(selectedStore.value)

            // Convertir le QueryModel en paramètres API
            const apiParams = convertTrackingParams(queryModel)

            // Charger les jobs depuis le nouvel endpoint discrepancies via le store
            const response = await jobStore.fetchJobsDiscrepancies(inventoryId.value, warehouseId, apiParams)

            // Le backend renvoie un objet avec success, data, rowCount, totalCount, page, pageSize
            // Format: { success: true, data: [...], rowCount: 2, totalCount: 2, page: 1, pageSize: 50 }
            let jobs: any[] = []
            if (response?.success && response?.data && Array.isArray(response.data)) {
                // Format standard avec success et data
                jobs = response.data
            } else if (Array.isArray(response)) {
                // Si la réponse est directement un tableau
                jobs = response
            } else if (response?.rows && Array.isArray(response.rows)) {
                // Si la réponse a une propriété "rows"
                jobs = response.rows
            } else if (response?.results && Array.isArray(response.results)) {
                // Si la réponse a une propriété "results"
                jobs = response.results
            } else if (response?.data && Array.isArray(response.data)) {
                // Si la réponse a une propriété "data"
                jobs = response.data
            }

            logger.debug('Jobs chargés depuis discrepancies', {
                jobsCount: jobs.length,
                responseKeys: Object.keys(response || {}),
                responseSuccess: response?.success,
                firstJob: jobs[0],
                firstJobAssignments: jobs[0]?.assignments?.length
            })

            // Transformer les jobs en lignes pour le DataTable
            const transformedRows = transformDiscrepanciesToRows(jobs)
            logger.debug('Lignes transformées pour le DataTable', {
                rowsCount: transformedRows.length,
                firstRow: transformedRows[0],
                firstRowAssignments: transformedRows[0]?.assignments?.length,
                firstRowJobReference: transformedRows[0]?.jobReference
            })

            // Assigner les données transformées
            trackingRows.value = transformedRows

            // Log pour vérifier que les données sont bien assignées
            logger.debug('Données assignées à trackingRows', {
                trackingRowsLength: trackingRows.value.length,
                firstTrackingRow: trackingRows.value[0]
            })
        } catch (error) {
            logger.error('Erreur lors du chargement des données de suivi des jobs', error)
            trackingRows.value = []
            // Ne pas afficher d'erreur bloquante si c'est un chargement en arrière-plan
            if (isInitialized.value) {
                await alertService.error({ text: 'Impossible de charger les données de suivi des jobs' })
            }
        }
    }

    /**
     * Charge l'inventaire par sa référence
     *
     * @param reference - Référence de l'inventaire
     */
    const fetchInventory = async (reference: string) => {
        if (!reference) {
            throw new Error('Référence d\'inventaire non fournie')
        }

        const fetchedInventory = await inventoryStore.fetchInventoryByReference(reference)
        inventory.value = fetchedInventory
        inventoryId.value = fetchedInventory?.id || null
        accountId.value = fetchedInventory?.account_id || null

        if (!inventoryId.value) {
            throw new Error('Inventaire introuvable ou sans identifiant')
        }
    }

    // ===== MÉTHODES D'INITIALISATION =====

    /**
     * Initialise le composable avec une référence d'inventaire
     * Ordre d'exécution optimisé avec parallélisation :
     * 1. Chargement de l'inventaire
     * 2. Chargement des magasins (instantané si dans l'inventaire, sinon via account_id en parallèle)
     * 3. Chargement immédiat des jobs dès qu'un magasin est disponible
     *
     * @param reference - Référence de l'inventaire (optionnel)
     */
    const initialize = async (reference?: string) => {
        try {
            isInitialized.value = false

            if (reference) {
                inventoryReference.value = reference
            }

            if (!inventoryReference.value) {
                throw new Error('Aucune référence d\'inventaire fournie pour le suivi des jobs')
            }

            // 1. Charger l'inventaire
            await fetchInventory(inventoryReference.value)

            // 2. Charger les magasins (instantané si dans l'inventaire, sinon via account_id)
            // Si l'inventaire contient déjà les warehouses, fetchStores sera instantané
            await fetchStores()

            // 3. Charger les jobs immédiatement si un magasin est disponible
            // Sélectionner automatiquement le magasin provenant de l'URL si présent,
            // sinon fallback sur le premier magasin disponible
            if (!selectedStore.value && storeOptions.value.length > 0) {
                // Si une référence de warehouse est fournie (via URL), la faire correspondre
                if (initialWarehouseReference.value) {
                    const targetRef = initialWarehouseReference.value
                    // Chercher par référence ou nom
                    const matchingStore = storeOptions.value.find(opt => {
                        const warehouse = warehouses.value.find(w => String(w.id) === opt.value)
                        return warehouse && (
                            warehouse.reference === targetRef ||
                            warehouse.warehouse_name === targetRef ||
                            opt.label === targetRef
                        )
                    })

                    if (matchingStore) {
                        selectedStore.value = matchingStore.value
                    }
                }

                // Fallback : si toujours rien de sélectionné, prendre le premier
                if (!selectedStore.value) {
                    selectedStore.value = storeOptions.value[0].value
                }
            }

            // Charger les données immédiatement (non-bloquant)
            if (selectedStore.value && inventoryId.value) {
                // Charger avec un QueryModel par défaut
                const defaultQueryModel: QueryModel = {
                    page: 1,
                    pageSize: 50,
                    sort: [],
                    filters: {},
                    search: '',
                    customParams: trackingCustomParams.value
                }
                fetchTrackingData(defaultQueryModel).catch((error) => {
                    logger.warn('Erreur lors du chargement initial des jobs', error)
                })
            }

            // Attendre que le DataTable ait fini de s'initialiser et de restaurer son état
            await nextTick()
            // Ajouter un petit délai supplémentaire pour être sûr que tous les événements sont capturés
            await new Promise(resolve => setTimeout(resolve, 50))
            console.log('[useJobTracking.initialize] After nextTick + delay, queue length:', pendingEventsQueue.length)

            isInitialized.value = true

            // Traiter les événements DataTable mis en file d'attente
            // ⚠️ Logique harmonisée avec useAffecter.ts et useInventoryResults.ts
            console.log('[useJobTracking.initialize] Processing pending events, queue length:', pendingEventsQueue.length)

            if (pendingEventsQueue.length > 0) {
                // Si des événements sont en file d'attente (DataTable a restauré son état),
                // traiter le premier événement pour charger avec les bonnes données
                const firstEvent = pendingEventsQueue[0]
                console.log('[useJobTracking.initialize] Processing first queued event:', firstEvent.eventType, firstEvent.queryModel)
                await processEventDirectly(firstEvent.eventType, firstEvent.queryModel)
                pendingEventsQueue.shift() // Retirer le premier événement traité
            }

            // Traiter les événements restants en file d'attente (s'il y en a)
            if (pendingEventsQueue.length > 0) {
                console.log('[useJobTracking.initialize] Processing remaining queued events:', pendingEventsQueue.length)
                for (const queuedEvent of pendingEventsQueue) {
                    await processEventDirectly(queuedEvent.eventType, queuedEvent.queryModel)
                }
                pendingEventsQueue.length = 0 // Vider la file d'attente
            }

            // Si aucun événement en file d'attente, vérifier si le DataTable a un état sauvegardé
            if (pendingEventsQueue.length === 0) {
                console.log('[useJobTracking.initialize] No queued events, checking for saved DataTable state')

                // Essayer de récupérer l'état sauvegardé du DataTable depuis localStorage
                const savedState = localStorage.getItem('job_tracking_table')
                if (savedState) {
                    try {
                        const parsedState = JSON.parse(savedState)
                        console.log('[useJobTracking.initialize] Found saved DataTable state:', parsedState)

                        // Créer un QueryModel depuis l'état sauvegardé
                        const savedQueryModel: QueryModel = {
                            page: parsedState.page || 1,
                            pageSize: parsedState.pageSize || 50,
                            sort: parsedState.sort || [],
                            filters: parsedState.filters || {},
                            search: parsedState.search || ''
                        }

                        console.log('[useJobTracking.initialize] Loading data with saved state:', savedQueryModel)
                        await fetchTrackingData(savedQueryModel)
                        return
                    } catch (error) {
                        console.warn('[useJobTracking.initialize] Error parsing saved state:', error)
                    }
                }

                // Aucun état sauvegardé, chargement par défaut
                console.log('[useJobTracking.initialize] No saved state, loading default data')
                await fetchTrackingData({
                    page: 1,
                    pageSize: 50,
                    sort: [],
                    filters: {},
                    search: '',
                    customParams: trackingCustomParams.value
                })
            }
        } catch (error) {
            logger.error('Erreur lors de l\'initialisation du suivi des jobs', error)
            await alertService.error({ text: 'Impossible d\'initialiser le suivi des jobs' })
            throw error
        }
    }

    /**
     * Traite les événements DataTable mis en file d'attente pendant l'initialisation
     */
    const processPendingEvents = async () => {
        if (pendingEventsQueue.length === 0) return

        const events = [...pendingEventsQueue]
        pendingEventsQueue.length = 0 // Vider la file

        for (const event of events) {
            await processEventDirectly(event.eventType, event.queryModel)
        }
    }

    /**
     * Réinitialise le composable avec une nouvelle référence
     *
     * @param reference - Nouvelle référence de l'inventaire
     */
    const reinitialize = async (reference: string) => {
        inventoryReference.value = reference
        inventoryId.value = null
        inventory.value = null
        accountId.value = null
        trackingRows.value = []
        storeOptions.value = []
        selectedStore.value = config?.initialStoreId ?? null

        // Réinitialiser le cache des requêtes
        lastExecutedQueryModel = null
        pendingEventsQueue.length = 0 // Vider la file d'attente

        await initialize(reference)
    }

    // ===== WATCHERS =====

    /**
     * Watcher sur les sélections (magasin)
     * Recharge les données quand le magasin change
     */
    watch(selectedStore, async () => {
        if (!isInitialized.value) {
            return
        }

        // Si le magasin change, recharger les jobs depuis l'API
        if (selectedStore.value && inventoryId.value) {
            // Charger immédiatement avec un QueryModel par défaut (non-bloquant pour meilleure UX)
            const defaultQueryModel: QueryModel = {
                page: 1,
                pageSize: 50,
                sort: [],
                filters: {},
                search: '',
                customParams: trackingCustomParams.value
            }
            fetchTrackingData(defaultQueryModel).catch((error) => {
                logger.warn('Erreur lors du rechargement des jobs', error)
            })
        } else {
            // Si pas de magasin sélectionné, vider les lignes
            trackingRows.value = []
        }
    })

    // ===== MÉTHODES D'IMPRESSION =====

    /**
     * Affiche une popup pour sélectionner une session, puis les jobs, et génère les PDFs
     */
    const printJobs = async () => {
        try {
            // Charger les sessions si nécessaire
            // if (sessionStore.getAllSessions.length === 0) {
            //     await sessionStore.fetchSessions()
            // }

            const sessions = sessionStore.getAllSessions

            if (sessions.length === 0) {
                await alertService.error({ text: 'Aucune session disponible' })
                return
            }

            // Créer les options pour le select de sessions
            const sessionOptions: Record<string, string> = {}
            sessions.forEach(session => {
                sessionOptions[session.id.toString()] = session.username
            })

            // Première popup : Sélection de la session
            const sessionSelection = await Swal.fire({
                title: 'Sélectionner une session',
                html: `
                    <div style="text-align: center; padding: 1rem 0;">
                        <p style="color: #6b7280; font-size: 0.95rem; margin-bottom: 1.5rem;">
                            Choisissez la session pour afficher les jobs
                        </p>
                    </div>
                `,
                input: 'select',
                inputOptions: sessionOptions,
                inputPlaceholder: 'Sélectionnez une session...',
                showCancelButton: true,
                confirmButtonText: 'Suivant',
                cancelButtonText: 'Annuler',
                confirmButtonColor: '#FECD1C',
                cancelButtonColor: '#B4B6BA',
                inputValidator: (value) => {
                    if (!value) {
                        return 'Veuillez sélectionner une session'
                    }
                    return null
                },
                customClass: {
                    popup: 'sweet-alerts',
                    confirmButton: 'btn btn-primary',
                    cancelButton: 'btn btn-secondary'
                },
                width: '500px',
                padding: '2rem'
            })

            if (!sessionSelection.isConfirmed || !sessionSelection.value) {
                return
            }

            const selectedSessionId = Number(sessionSelection.value)
            const selectedSession = sessions.find(s => s.id === selectedSessionId)

            if (!selectedSession) {
                await alertService.error({ text: 'Session sélectionnée introuvable' })
                return
            }

            // Charger les jobs de la session via le store
            const assignmentsResponse = await jobStore.getSessionAssignments(selectedSessionId)

            if (!assignmentsResponse.success || !assignmentsResponse.data.jobs || assignmentsResponse.data.jobs.length === 0) {
                await alertService.warning({ text: 'Aucun job disponible pour cette session' })
                return
            }

            const jobs = assignmentsResponse.data.jobs

            // Deuxième popup : Sélection des jobs (multi-sélection)
            const jobsSelection = await Swal.fire({
                title: 'Sélectionner les jobs',
                html: `
                    <div style="text-align: left; padding: 1rem 0;">
                        <p style="color: #6b7280; font-size: 0.95rem; margin-bottom: 1rem;">
                            Sélectionnez un ou plusieurs jobs à imprimer
                        </p>
                        <div id="jobs-checkboxes" style="max-height: 300px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem;">
                            ${jobs.map(job => `
                                <label style="display: flex; align-items: center; padding: 0.75rem; margin-bottom: 0.5rem; cursor: pointer; border-radius: 0.375rem; transition: background-color 0.2s;"
                                       onmouseover="this.style.backgroundColor='#f3f4f6'"
                                       onmouseout="this.style.backgroundColor='transparent'">
                                    <input type="checkbox" value="${job.id}" class="job-checkbox" style="margin-right: 0.75rem; width: 1.25rem; height: 1.25rem; cursor: pointer;">
                                    <span style="font-size: 0.95rem; color: #1f2937;">${job.reference}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Imprimer',
                cancelButtonText: 'Annuler',
                confirmButtonColor: '#FECD1C',
                cancelButtonColor: '#B4B6BA',
                customClass: {
                    popup: 'sweet-alerts',
                    confirmButton: 'btn btn-primary',
                    cancelButton: 'btn btn-secondary'
                },
                width: '600px',
                padding: '2rem',
                preConfirm: () => {
                    const checkboxes = document.querySelectorAll<HTMLInputElement>('.job-checkbox:checked')
                    const selectedJobIds = Array.from(checkboxes).map(cb => Number(cb.value))

                    if (selectedJobIds.length === 0) {
                        Swal.showValidationMessage('Veuillez sélectionner au moins un job')
                        return false
                    }

                    return selectedJobIds
                }
            })

            if (!jobsSelection.isConfirmed || !jobsSelection.value) {
                return
            }

            const selectedJobIds = jobsSelection.value as number[]

            // Pour chaque job sélectionné, générer les PDFs
            await Swal.fire({
                title: 'Génération en cours...',
                html: 'Veuillez patienter pendant la génération des PDFs',
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => {
                    Swal.showLoading()
                }
            })

            const pdfPromises: Promise<{ jobId: number; blob: Blob; filename: string }>[] = []
            for (const jobId of selectedJobIds) {
                try {
                    // Note: L'API nécessite job_id et assignment_id
                    // Pour l'instant, on génère avec assignment_id = 1 (à adapter selon les besoins)
                    const blob = await jobStore.generateJobPDF(jobId, 1)
                    const job = jobs.find(j => j.id === jobId)
                    const filename = `job_${jobId}_${job?.reference || 'unknown'}.pdf`
                    pdfPromises.push(Promise.resolve({ jobId, blob, filename }))
                } catch (error) {
                    logger.error(`Erreur lors de la génération du PDF pour le job ${jobId}`, error)
                }
            }

            const pdfResults = await Promise.allSettled(pdfPromises)

            // Télécharger tous les PDFs générés
            let successCount = 0
            let errorCount = 0

            pdfResults.forEach((result) => {
                if (result.status === 'fulfilled') {
                    const { blob, filename } = result.value
                    const url = window.URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = filename
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    window.URL.revokeObjectURL(url)
                    successCount++
                } else {
                    errorCount++
                }
            })

            await Swal.fire({
                title: successCount > 0 ? 'Succès !' : 'Erreur',
                html: `
                    <div style="text-align: center; padding: 1rem 0;">
                        <p style="color: #6b7280; font-size: 0.95rem;">
                            ${successCount > 0 ? `${successCount} PDF(s) généré(s) et téléchargé(s) avec succès.` : ''}
                            ${errorCount > 0 ? `<br>${errorCount} erreur(s) lors de la génération.` : ''}
                        </p>
                    </div>
                `,
                icon: successCount > 0 ? 'success' : 'error',
                confirmButtonColor: '#FECD1C',
                customClass: {
                    popup: 'sweet-alerts',
                    confirmButton: 'btn btn-primary'
                }
            })
        } catch (error: any) {
            logger.error('Erreur lors de l\'impression des jobs', error)
            await alertService.error({
                text: error?.response?.data?.message || error?.message || 'Erreur lors de l\'impression des jobs'
            })
        }
    }

    // ===== HANDLERS DE SÉLECTION =====

    /**
     * Handler pour les changements de sélection dans le DataTable
     *
     * @param selectedRowsSet - Set des IDs de lignes sélectionnées
     */
    const onSelectionChanged = (selectedRowsSet: Set<string>) => {
        selectedRows.value = selectedRowsSet ? Array.from(selectedRowsSet) : []
    }

    /**
     * Réinitialiser toutes les sélections
     */
    const resetSelection = () => {
        selectedRows.value = []
    }

    // ===== HANDLERS DATATABLE =====

    // ===== ACTIONS DATATABLE =====

    /**
     * Action pour imprimer un job
     * Utilise job_id (jobId) et assignment_id de la ligne
     * Endpoint: POST /jobs/<int:job_id>/assignments/<int:assignment_id>/pdf/
     */
    const handlePrintJob = async (row: JobTrackingRow) => {
        try {
            const jobId = row.jobId
            const assignmentId = row.assignmentId

            if (!jobId || jobId === 0) {
                await alertService.error({ text: 'ID du job manquant' })
                return
            }

            if (!assignmentId) {
                await alertService.error({ text: 'ID de l\'assignment manquant pour ce job' })
                return
            }

            // Afficher un loader
            await Swal.fire({
                title: 'Génération en cours...',
                html: 'Veuillez patienter pendant la génération du PDF',
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => {
                    Swal.showLoading()
                }
            })

            // Générer le PDF via l'endpoint: POST /jobs/<int:job_id>/assignments/<int:assignment_id>/pdf/
            // Utiliser le store au lieu du service direct
            const blob = await jobStore.generateJobPDF(jobId, assignmentId)

            // Télécharger le PDF
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `job_${jobId}_${row.jobReference || 'unknown'}.pdf`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            await Swal.fire({
                title: 'Succès !',
                html: 'PDF généré et téléchargé avec succès',
                icon: 'success',
                confirmButtonColor: '#FECD1C',
                customClass: {
                    popup: 'sweet-alerts',
                    confirmButton: 'btn btn-primary'
                }
            })
        } catch (error: any) {
            logger.error('Erreur lors de la génération du PDF', error)
            await alertService.error({
                text: error?.response?.data?.message || error?.message || 'Erreur lors de la génération du PDF'
            })
        }
    }

    /**
     * Actions pour le DataTable
     */
    const actions = computed<ActionConfig<JobTrackingRow>[]>(() => [
        {
            label: 'Imprimer',
            icon: markRaw(IconPrinter),
            color: 'primary',
            onClick: handlePrintJob,
            show: (row: JobTrackingRow) => !!row.jobId && row.jobId > 0 && !!row.assignmentId,
            tooltip: 'Générer et télécharger le PDF du job'
        }
    ])

    // ===== RETURN =====

    return {
        // État
        inventoryReference: computed(() => inventoryReference.value),
        inventoryId: computed(() => inventoryId.value),
        isInitialized,
        loading: computed(() => isLoading.value || trackingLoadingLocal.value),

        // Sélections
        storeOptions,
        selectedStore,
        selectedRows,
        selectedRowsCount,
        hasSelectedRows,

        // Données tableau
        rows: trackingRows, // Retourner directement le ref - Vue le déballera automatiquement dans le template
        columns,
        actions,
        hasRows,

        // DataTable harmonisé avec Affecter et InventoryResults
        queryModel: trackingQueryModelRef,

        // Pagination (harmonisé avec useInventoryResults.ts)
        pagination: trackingPaginationComputed,
        trackingTotalItems: computed(() => jobsPaginationMetadata.value?.total ?? 0),

        // Actions
        initialize,
        reinitialize,
        refresh: fetchTrackingData,
        printJobs,
        onSelectionChanged,
        resetSelection,

        // Handlers DataTable harmonisés avec useInventoryResults.ts
        onTrackingTableEvent,

        // Paramètres personnalisés pour la DataTable (inventory_id, warehouse_id)
        trackingCustomParams,

        // Clés pour forcer le re-render (harmonisé avec useAffecter.ts et useInventoryResults.ts)
        trackingKey,
        trackingTableRef,

        // Loading local pour les événements DataTable
        trackingLoadingLocal: computed(() => trackingLoadingLocal.value)
    }
}
