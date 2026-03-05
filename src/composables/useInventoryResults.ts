/**
 * Composable useInventoryResults — Gestion des résultats d'inventaire
 *
 * Centralise toute la logique de la page « Résultats d'inventaire » : chargement des données,
 * configuration du DataTable (colonnes dynamiques, actions, pagination côté serveur),
 * validation/modification des résultats, lancement de comptages et export.
 *
 * ## Responsabilités
 * - Affichage des résultats par magasin avec pagination, tri et filtrage (API)
 * - Colonnes dynamiques selon les comptages (1er, 2e, …) et écarts
 * - Actions par ligne : modifier résultat, valider écart
 * - Actions globales : lancer comptage, résoudre tous, exporter (consolidé / résultats)
 *
 * ## Dépendances
 * - Stores : results, inventory, warehouse, session, job
 * - Constantes : {@link module:useInventoryResults.constants}
 * - Helpers : {@link module:helpers/useInventoryResults.helpers}
 *
 * @module useInventoryResults
 */

// ===== IMPORTS VUE =====
import { ref, computed, markRaw, watch, createApp, h, getCurrentInstance, nextTick, onMounted } from 'vue'

// ===== IMPORTS PINIA =====
import { storeToRefs } from 'pinia'

// ===== IMPORTS SERVICES =====
import { dataTableService } from '@/services/dataTableService'
import { alertService } from '@/services/alertService'
import { EcartComptageService, type ResolveEcartRequest } from '@/services/EcartComptageService'
import { JobService } from '@/services/jobService'
import { logger } from '@/services/loggerService'
import { InventoryResultsService } from '@/services/inventoryResultsService'

// ===== IMPORTS STORES =====
import { useResultsStore } from '@/stores/results'
import { useInventoryStore } from '@/stores/inventory'
import { useWarehouseStore } from '@/stores/warehouse'
import { useSessionStore } from '@/stores/session'
import { useJobStore } from '@/stores/job'

// ===== IMPORTS TYPES =====
import type { QueryModel, DataTableColumn, ActionConfig, ColumnDataType } from '@SMATCH-Digital-dev/vue-system-design'
import type { InventoryResult, StoreOption } from '@/interfaces/inventoryResults'
import type { Warehouse } from '@/models/Warehouse'
import type { JobResult } from '@/models/Job'
import type { ButtonGroupButton } from '@/components/Form/ButtonGroup.vue'
// ===== IMPORTS UTILS =====
import { normalizeInventoryResults, type NormalizedInventoryResult } from '@/utils/inventoryResultNormalizer'
import {
    INITIALIZATION_DELAY_MS,
    STORES_FETCH_TIMEOUT_MS,
    DEFAULT_PAGE,
    DEFAULT_PAGE_SIZE,
    DEFAULT_MAX_PENDING_EVENTS,
    DEFAULT_KEEP_PENDING_EVENTS,
    ERROR_MESSAGES
} from './useInventoryResults.constants'

// ===== IMPORTS HELPERS =====
import {
    getAvailableCountingOrders,
    getCountingOrderLabel,
    getCountingFieldName,
    getCountingStatusFieldName,
    extractEcartComptageId,
    downloadBlob,
    generateExportFilename
} from './helpers/useInventoryResults.helpers'

// ===== IMPORTS EXTERNES =====
import Swal from 'sweetalert2'

// ===== IMPORTS ICÔNES =====
import IconCheck from '@/components/icon/icon-check.vue'
import IconPencil from '@/components/icon/icon-edit.vue'
import IconLaunch from '@/components/icon/icon-launch.vue'
import IconX from '@/components/icon/icon-x.vue'
import IconCircleCheck from '@/components/icon/icon-circle-check.vue'
import IconXCircle from '@/components/icon/icon-x-circle.vue'
import IconPlay from '@/components/icon/icon-play.vue'
import IconDownload from '@/components/icon/icon-download.vue'
import IconListCheck from '@/components/icon/icon-list-check.vue'

// ===== IMPORTS COMPOSANTS =====
import Modal from '@/components/Modal.vue'
import SelectField from '@/components/Form/SelectField.vue'
import type { SelectOption } from '@/interfaces/form'

// ===== IMPORTS PLUGINS =====
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import i18n from '@/i18n'

/**
 * Configuration d'initialisation du composable useInventoryResults
 *
 * @interface UseInventoryResultsConfig
 * @property {string} [inventoryReference] - Référence de l'inventaire (chargement des données)
 * @property {number} [initialInventoryId] - ID inventaire initial (optionnel si référence fournie)
 * @property {string} [initialWarehouseReference] - Référence du magasin (ex. depuis URL ?warehouse=)
 * @property {import('vue-router').RouteLocationNormalizedLoaded} [route] - Instance route (navigation)
 * @property {import('vue-router').Router} [router] - Instance router (navigation)
 */
export interface UseInventoryResultsConfig {
    inventoryReference?: string
    initialInventoryId?: number
    initialWarehouseReference?: string
    route?: any
    router?: any
}

/**
 * Composable pour la gestion des résultats d'inventaire.
 *
 * Gère l'affichage, la pagination, le tri, le filtrage et les actions sur les résultats.
 * Utilise le DataTable du package avec customDataTableParams (inventory_id, store_id) et
 * un handler unique @query-model-changed → processEventDirectly → store.fetchResultsAuto.
 *
 * @param {UseInventoryResultsConfig} [config] - Configuration (référence inventaire, route, router, etc.)
 * @returns {Object} État, données, colonnes, actions, pagination et méthodes exposées à la vue
 *
 * @example
 * const { results, columns, actions, pagination, initialize, onResultsTableEvent } =
 *   useInventoryResults({ inventoryReference: 'INV-001', initialWarehouseReference: 'WH-01', route, router })
 */
export function useInventoryResults(config?: UseInventoryResultsConfig) {
    // Récupérer les instances de route et router depuis la config ou les importer
    const routeInstance = config?.route
    const routerInstance = config?.router

    const resultsStore = useResultsStore()
    const inventoryStore = useInventoryStore()
    const warehouseStore = useWarehouseStore()
    const sessionStore = useSessionStore()
    const jobStore = useJobStore()

    const {
        selectedStore,
        stores: storeOptionsFromStore,
        paginationMetadata: resultsPaginationMetadata
    } = storeToRefs(resultsStore)

    const { warehouses, loading: warehousesLoading } = storeToRefs(warehouseStore)

    // ===== ÉTAT LOCAL =====
    const inventoryReference = ref(config?.inventoryReference || '')
    const inventoryId = ref<number | null>(config?.initialInventoryId || null)
    const accountId = ref<number | null>(null)
    const isInitialized = ref(false)

    // Paramètres personnalisés pour les appels API
    const resultsCustomParams = computed(() => ({
        inventory_id: inventoryId.value,
        store_id: selectedStore.value
    }))

    // ===== ÉTAT POUR LA VUE =====
    const exportLoading = ref(false)
    const exportResultsLoading = ref(false)
    const showExportResultsModal = ref(false)
    const exportResultsModalMessage = ref('Préparation de l\'export...')
    const resultsLoadingLocal = ref(false)

    /** Clé pour forcer le re-render des tables */
    const resultsKey = ref(0)

    /**
     * Référence au composant DataTable des résultats.
     * Usage : lecture seule ou méthodes d'export. Ne pas appeler changePage, setFilterState, updateGlobalSearchTerm
     * (le DataTable pilote son état via @query-model-changed).
     */
    const resultsTableRef = ref<any>(null)

    // ===== QUERYMODEL POUR RESULTS =====
    /** QueryModel courant (synchronisé avec le DataTable via @query-model-changed). */
    const resultsQueryModelRef = ref<QueryModel>({
        page: DEFAULT_PAGE,
        pageSize: DEFAULT_PAGE_SIZE,
        sort: undefined,
        filters: undefined,
        search: undefined,
        customParams: {}
    })

    /** Objet inventaire complet (pour accéder rapidement aux warehouses) */
    const inventory = ref<any | null>(null)

    // Mode de sortie pour les requêtes
    // ⚠️ Le DataTable utilise maintenant uniquement QueryModel selon FRONTEND_QUERYMODEL_GUIDE.md
    // Plus besoin de queryOutputMode

    // États pour les magasins
    const storeOptions = ref<StoreOption[]>([])
    const usesWarehouseFallback = ref(false)

    // ===== HANDLERS DATATABLE =====
    /**
     * Le DataTable émet query-model-changed ; customDataTableParams (inventory_id, store_id) sont
     * fusionnés dans processEventDirectly avant l'appel au store. File d'attente si non initialisé.
     */
    const lastExecutedQueryModel = ref<QueryModel | null>(null)
    const pendingEventsQueue = ref<Array<{ eventType: string; queryModel: QueryModel }>>([])

    /**
     * Traite un événement DataTable : fusionne customParams, évite doublons, appelle le store.
     * @param eventType - Type d'événement (logging)
     * @param queryModel - QueryModel ; customParams sont fusionnés avant l'appel
     */
    const processEventDirectly = async (eventType: string, queryModel: QueryModel) => {
        if (!queryModel || typeof queryModel !== 'object') return

        // IDs requis pour l'appel API
        if (!inventoryId.value || !selectedStore.value) return

        // Fusionner customParams (inventory_id, store_id) ; le DataTable peut ne pas les inclure
        const mergedQueryModel: QueryModel = {
            ...queryModel,
            customParams: {
                ...(queryModel.customParams || {}),
                ...resultsCustomParams.value
            }
        }

        // Éviter les appels API doublons
        const queryModelStr = JSON.stringify(mergedQueryModel)
        const lastQueryModelStr = lastExecutedQueryModel.value ? JSON.stringify(lastExecutedQueryModel.value) : null

        if (queryModelStr === lastQueryModelStr) {
            return
        }

        try {
            resultsLoadingLocal.value = true

            // Mettre à jour le QueryModel local pour synchroniser avec la DataTable
            resultsQueryModelRef.value = { ...mergedQueryModel }

            await resultsStore.fetchResultsAuto(mergedQueryModel)

            lastExecutedQueryModel.value = { ...mergedQueryModel }

            // Invalider les caches de normalisation/colonnes
            normalizedResultsCache.value = null
            columnsCache.value = null
            resultsLoadingLocal.value = false
        } catch (error) {
            await alertService.error({ text: ERROR_MESSAGES.LOAD_RESULTS })
            resultsLoadingLocal.value = false
        }
    }

    /**
     * Handler unifié DataTable : met en file d'attente si non initialisé, sinon processEventDirectly.
     * @param eventType - Type d'événement (compatibilité)
     * @param queryModel - QueryModel émis par le DataTable
     */
    const onResultsTableEvent = async (eventType: string, queryModel: QueryModel) => {
        if (!queryModel || typeof queryModel !== 'object') return

        if (pendingEventsQueue.value.length > DEFAULT_MAX_PENDING_EVENTS) {
            pendingEventsQueue.value.splice(0, pendingEventsQueue.value.length - DEFAULT_KEEP_PENDING_EVENTS)
        }

        if (!isInitialized.value) {
            pendingEventsQueue.value.push({ eventType, queryModel })
            return
        }

        try {
            await processEventDirectly(eventType, queryModel)
        } catch {
            // Erreur déjà gérée dans processEventDirectly
        }
    }

    const mapWarehouseToOption = (warehouse: Warehouse): StoreOption => ({
        label: warehouse.warehouse_name || warehouse.reference || `Entrepôt ${warehouse.id}`,
        value: String(warehouse.id)
    })

    const syncStoreOptions = (inventoryStores?: StoreOption[] | null) => {
        if (inventoryStores && inventoryStores.length > 0) {
            storeOptions.value = inventoryStores
            usesWarehouseFallback.value = false
            return
        }

        storeOptions.value = warehouses.value.map(mapWarehouseToOption)
        usesWarehouseFallback.value = true
    }

    watch(storeOptionsFromStore, newOptions => {
        if (newOptions.length > 0) {
            syncStoreOptions(newOptions)
        }
    })

    watch(warehouses, newWarehouses => {
        if (usesWarehouseFallback.value) {
            storeOptions.value = newWarehouses.map(mapWarehouseToOption)
        }
    })


    syncStoreOptions(storeOptionsFromStore.value)

    // ===== DONNÉES DU STORE =====
    /** Données et état gérés par le store ; normalisation des résultats bruts dans le composable. */
    const { results: rawResults, loading: resultsLoading } = storeToRefs(resultsStore)

    /**
     * Résultats normalisés pour le DataTable (mémoïsés via normalizedResultsCache).
     */

    // Cache pour la normalisation (évite de re-normaliser si les données n'ont pas changé)
    const normalizedResultsCache = ref<{
        data: NormalizedInventoryResult[]
        rawResultsHash: string
        inventoryId: number | null
        storeId: string | null
    } | null>(null)

    // Fonction helper pour créer un hash rapide des données brutes
    const createRawResultsHash = (data: Record<string, unknown>[]): string => {
        if (!data || data.length === 0) return 'empty'
        // Utiliser seulement les IDs et quelques champs clés pour le hash (plus rapide que JSON.stringify complet)
        const sampleSize = Math.min(data.length, 10) // Échantillonner pour performance
        const sample = data.slice(0, sampleSize)
        const ids = sample.map((item, idx) => item.id || item.jobId || item.job_id || idx).join(',')
        const keys = sample.length > 0 ? Object.keys(sample[0] || {}).slice(0, 20).join(',') : ''
        return `${data.length}-${ids}-${keys}`
    }

    const results = computed<NormalizedInventoryResult[]>(() => {
        const rawLen = rawResults.value?.length ?? 0
        const hasIds = !!(inventoryId.value && selectedStore.value)

        if (!rawResults.value || rawLen === 0) {
            normalizedResultsCache.value = null
            return []
        }

        if (!hasIds) {
            normalizedResultsCache.value = null
            return []
        }

        // Utiliser le cache si les données n'ont pas changé
        const rawResultsHash = createRawResultsHash(rawResults.value as Record<string, unknown>[])

        if (normalizedResultsCache.value &&
            normalizedResultsCache.value.rawResultsHash === rawResultsHash &&
            normalizedResultsCache.value.inventoryId === inventoryId.value &&
            normalizedResultsCache.value.storeId === selectedStore.value) {
            return normalizedResultsCache.value.data
        }

        // Normaliser seulement si nécessaire
        // À ce stade, hasIds est vrai donc inventoryId/selectedStore ne sont plus null
        const safeInventoryId = inventoryId.value as number
        const safeStoreId = selectedStore.value as string | number

        const normalized = normalizeInventoryResults(
            rawResults.value as Record<string, unknown>[],
            safeInventoryId,
            safeStoreId
        )

        // Mettre en cache
        normalizedResultsCache.value = {
            data: normalized,
            rawResultsHash,
            inventoryId: inventoryId.value,
            storeId: selectedStore.value
        }

        return normalized
    })

    // ⚡ OPTIMISATION : Supprimé le watcher qui forçait le re-render à chaque changement
    // Ce watcher était très coûteux et causait des re-renders inutiles du DataTable entier
    // Le DataTable détecte automatiquement les changements de données via la réactivité Vue

    /**
     * État de chargement global des résultats
     *
     * @computed {boolean} loading - True si les résultats sont en cours de chargement
     */
    const loading = computed(() => resultsLoading.value || resultsLoadingLocal.value)

    // ===== COMPUTED =====

    /**
     * Vérifie si des résultats sont disponibles
     */
    const hasResults = computed(() => results.value.length > 0)

    /**
     * Clé pour forcer le re-mount du DataTable package quand les données arrivent (pattern InventoryManagement).
     * Change quand selectedStore ou le nombre de lignes change, pour que le tableau affiche correctement.
     */
    const resultsTableKey = computed(() => `results-${selectedStore.value}-${results.value.length}`)

    /**
     * Pagination calculée pour les résultats
     *
     * Utilise UNIQUEMENT les valeurs retournées par le backend via paginationMetadata du store.
     * Le backend retourne { page, pageSize, total, totalPages } selon PAGINATION_FRONTEND.md.
     *
     * Le DataTable utilise ces valeurs pour afficher la pagination correctement.
     *
     * @computed {Object} resultsPaginationComputed - Objet de pagination avec les valeurs du backend
     * @computed {number} current_page - Page actuelle (1-indexed)
     * @computed {number} total_pages - Nombre total de pages
     * @computed {boolean} has_next - True s'il y a une page suivante
     * @computed {boolean} has_previous - True s'il y a une page précédente
     * @computed {number} page_size - Taille de la page
     * @computed {number} total - Nombre total d'éléments
     */
    const resultsPaginationComputed = computed(() => {
        const storeMetadata = resultsPaginationMetadata.value

        // Utiliser directement les valeurs du backend depuis paginationMetadata
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

    // ===== COLONNES DYNAMIQUES =====

    /**
     * Interface étendue pour les résultats avec labels de comptage et d'écart
     *
     * @interface ResultWithLabels
     * @extends {InventoryResult}
     */
    interface ResultWithLabels extends InventoryResult {
        __countingLabels?: Record<string, string>;
        __differenceLabels?: Record<string, string>;
    }

    // Helpers de colonnes importés depuis useInventoryResults.helpers.ts
    // getAvailableCountingOrders, getCountingOrderLabel, getCountingFieldName, getCountingStatusFieldName



    /**
     * Colonnes du DataTable construites dynamiquement selon les champs présents dans les données
     *
     * ⚡ OPTIMISÉ : Mémoization pour éviter les recalculs inutiles
     *
     * Les colonnes sont détectées automatiquement :
     * - Colonnes fixes : JOB, Emplacement, Article, Résolu, Résultat final
     * - Colonnes de comptage : 1er comptage, 2ème comptage, etc. (détectées dynamiquement)
     * - Colonnes d'écart : Écart 1-2, Écart 3, etc. (détectées dynamiquement)
     *
     * L'ordre d'affichage est : JOB, Emplacement, Article, Comptages/Écarts intercalés, Résolu, Résultat final
     *
     * @computed {DataTableColumn[]} columns - Colonnes configurées pour le DataTable
     */

    // Cache pour les colonnes (évite de recalculer si les résultats n'ont pas changé)
    const columnsCache = ref<{
        columns: DataTableColumn[]
        resultsLength: number
        resultsHash: string
    } | null>(null)

    const columns = computed<DataTableColumn[]>(() => {
        // ⚡ OPTIMISATION : Utiliser le cache si les résultats n'ont pas changé
        const currentResults = results.value
        const resultsHash = currentResults.length > 0
            ? `${currentResults.length}-${currentResults[0]?.id || ''}-${currentResults[currentResults.length - 1]?.id || ''}`
            : 'empty'

        if (columnsCache.value &&
            columnsCache.value.resultsLength === currentResults.length &&
            columnsCache.value.resultsHash === resultsHash) {
            return columnsCache.value.columns
        }

        // ⚡ STYLE DATATABLES.JS : Pas de calcul de largeur, autoSize gère automatiquement

        // Définir les colonnes statiques selon le schéma des données
        // Style DataTables.js : colonnes auto-ajustées sans largeur fixe
        const cols: DataTableColumn[] = [
            // 1. JOB
            {
                headerName: 'JOB',
                field: 'job_reference',
                sortable: true,
                dataType: 'text' as ColumnDataType,
                filterable: true,
                minWidth: 120,
                editable: false,
                visible: true,
                draggable: true,
                autoSize: true,
                icon: 'icon-box',
                description: 'Référence du job avec statut',
                priority: 10,
                align: 'center',
                badgeStyles: [
                    {
                        value: 'EN ATTENTE',
                        class: 'inline-flex items-center rounded-md bg-slate-200 px-2 py-1 text-xs font-medium text-slate-900 ring-1 ring-slate-300/20 ring-inset'
                    },
                    {
                        value: 'VALIDE',
                        class: 'inline-flex items-center rounded-md bg-slate-700 px-2 py-1 text-xs font-medium text-white ring-1 ring-slate-600/20 ring-inset'
                    },
                    {
                        value: 'AFFECTE',
                        class: 'inline-flex items-center rounded-md bg-teal-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-teal-600/20 ring-inset'
                    },
                    {
                        value: 'PRET',
                        class: 'inline-flex items-center rounded-md bg-purple-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-purple-600/20 ring-inset'
                    },
                    {
                        value: 'TRANSFERT',
                        class: 'inline-flex items-center rounded-md bg-amber-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-amber-600/20 ring-inset'
                    },
                    {
                        value: 'TERMINE',
                        class: 'inline-flex items-center rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white ring-1 ring-green-700/20 ring-inset'
                    },
                    {
                        value: 'ENTAME',
                        class: 'inline-flex items-center rounded-md bg-blue-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-blue-600/20 ring-inset'
                    }
                ],
                badgeDefaultClass: 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset',
                cellRenderer: ((value: any, column?: any, row?: any) => {
                    const jobReference = value;
                    if (jobReference === undefined || jobReference === null || jobReference === '') { return '-'; }

                    const statusValue = row?.['job_status'] || '';

                    const badgeStyles = column?.badgeStyles as Array<{ value: string, class: string }> | undefined;
                    const badgeDefaultClass = column?.badgeDefaultClass || 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset';

                    const badgeStyle = badgeStyles?.find((s: any) => s.value === statusValue.trim());
                    const badgeClass = badgeStyle?.class || badgeDefaultClass;

                    return `<span class="${badgeClass}">${jobReference}</span>`;
                }) as any
            },
            // 2. Emplacement
            {
                headerName: 'Emplacement',
                field: 'emplacement',
                sortable: true,
                dataType: 'text' as ColumnDataType,
                filterable: true,
                minWidth: 150,
                editable: false,
                visible: true,
                draggable: true,
                autoSize: true,
                description: 'Emplacement de l\'article',
                priority: 9,
                align: 'center'
            },
            // 3. Article
            {
                headerName: 'Article',
                field: 'article',
                sortable: true,
                dataType: 'text' as ColumnDataType,
                filterable: true,
                minWidth: 150,
                editable: false,
                visible: true,
                draggable: true,
                autoSize: true,
                icon: 'icon-box',
                description: 'Référence de l\'article',
                priority: 8,
                align: 'center'
            },
            // 4. Code interne produit
            {
                headerName: 'Code interne',
                field: 'product_internal_code',
                sortable: true,
                dataType: 'text' as ColumnDataType,
                filterable: true,
                minWidth: 120,
                editable: false,
                visible: true,
                draggable: true,
                autoSize: true,
                icon: 'icon-hash',
                description: 'Code interne du produit',
                priority: 7,
                align: 'center',
                valueFormatter: (params: any) => {
                    if (!params || params.value === undefined || params.value === null) return '-'
                    return String(params.value)
                }
            },
            // 5. Description produit — une seule ligne, ellipse si > 300 caractères, centré
            {
                headerName: 'Description',
                field: 'product_description',
                sortable: true,
                dataType: 'text' as ColumnDataType,
                filterable: true,
                minWidth: 300,
                maxWidth: 350,
                editable: false,
                visible: true,
                draggable: true,
                autoSize: true,
                icon: 'icon-file-text',
                description: 'Description du produit (survol pour texte complet)',
                priority: 6,
                flex: 3,
                align: 'center',
                tooltip: 'Description complète du produit',
                valueFormatter: (params: any) => {
                    if (!params || params.value === undefined || params.value === null) return '-'
                    return String(params.value)
                },
                cellRenderer: ((value: any, column?: any, row?: any) => {
                    const description = row?.product_description ?? value ?? ''
                    if (!description || description === '-') return '<span class="text-center">-</span>'
                    const escaped = String(description).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                    return `<span title="${escaped}" class="block text-center" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${escaped}</span>`
                }) as any
            },
            // 6. Famille produit
            {
                headerName: 'Famille',
                field: 'product_family',
                sortable: true,
                dataType: 'text' as ColumnDataType,
                filterable: true,
                minWidth: 150,
                editable: false,
                visible: true,
                draggable: true,
                autoSize: true,
                icon: 'icon-folder',
                description: 'Famille du produit',
                priority: 5,
                align: 'center',
                valueFormatter: (params: any) => {
                    if (!params || params.value === undefined || params.value === null) return '-'
                    return String(params.value)
                }
            }
        ]

        // 4-5. Colonnes dynamiques de comptage et écarts intercalés
        const availableOrders = getAvailableCountingOrders(results.value)
        const badgeStylesCommon = [
            {
                value: 'EN ATTENTE',
                class: 'inline-flex items-center rounded-md bg-slate-200 px-2 py-1 text-xs font-medium text-slate-900 ring-1 ring-slate-300/20 ring-inset'
            },
            {
                value: 'VALIDE',
                class: 'inline-flex items-center rounded-md bg-slate-700 px-2 py-1 text-xs font-medium text-white ring-1 ring-slate-600/20 ring-inset'
            },
            {
                value: 'AFFECTE',
                class: 'inline-flex items-center rounded-md bg-teal-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-teal-600/20 ring-inset'
            },
            {
                value: 'PRET',
                class: 'inline-flex items-center rounded-md bg-purple-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-purple-600/20 ring-inset'
            },
            {
                value: 'TRANSFERT',
                class: 'inline-flex items-center rounded-md bg-amber-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-amber-600/20 ring-inset'
            },
            {
                value: 'TERMINE',
                class: 'inline-flex items-center rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white ring-1 ring-green-700/20 ring-inset'
            },
            {
                value: 'ENTAME',
                class: 'inline-flex items-center rounded-md bg-blue-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-blue-600/20 ring-inset'
            }
        ]
        const badgeDefaultClassCommon = 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset'

        // Générer les colonnes de comptage et écarts intercalés
        availableOrders.forEach((order, index) => {
            // Colonne de comptage
            const fieldName = getCountingFieldName(order)
            const statusFieldName = getCountingStatusFieldName(order)
            const priority = 10 - order // Priorité décroissante avec l'ordre

            cols.push({
                headerName: getCountingOrderLabel(order),
                field: fieldName,
                sortable: true,
                dataType: 'number' as ColumnDataType,
                filterable: true,
                minWidth: 120,
                editable: false,
                visible: true,
                draggable: true,
                autoSize: true,
                icon: 'icon-calculator',
                description: `Valeur du ${getCountingOrderLabel(order)}`,
                priority: priority,
                align: 'center',
                badgeStyles: badgeStylesCommon,
                badgeDefaultClass: badgeDefaultClassCommon,
                cellRenderer: ((value: any, column?: any, row?: any) => {
                    const currentFieldName = column?.field || fieldName
                    // Essayer d'abord le champ spécifique, puis les variantes
                    let comptageValue = row ? row[currentFieldName] : value
                    if (comptageValue === undefined || comptageValue === null || comptageValue === '') {
                        // Fallback: essayer contage_X si fieldName était "2e comptage"
                        if (currentFieldName === '2e comptage') {
                            comptageValue = row ? row['contage_2'] : undefined
                        }
                    }

                    if (comptageValue === undefined || comptageValue === null || comptageValue === '') {
                        return '-'
                    }

                    // Récupérer le statut
                    const statusValue = row ? (row[statusFieldName] || '') : ''

                    const badgeStyles = column?.badgeStyles as Array<{ value: string, class: string }> | undefined
                    const badgeDefaultClass = column?.badgeDefaultClass || badgeDefaultClassCommon

                    const badgeStyle = badgeStyles?.find((s: any) => s.value === statusValue.trim())
                    const badgeClass = badgeStyle?.class || badgeDefaultClass

                    return `<span class="${badgeClass}">${comptageValue}</span>`
                }) as any
            })

            // Colonne d'écart après chaque comptage (sauf le dernier)
            if (index < availableOrders.length - 1) {
                const nextOrder = availableOrders[index + 1]
                const ecartFieldName = `ecart_${order}_${nextOrder}`
                const ecartPriority = priority - 0.5 // Priorité entre les deux comptages

                cols.push({
                    headerName: `Écart ${order}-${nextOrder}`,
                    field: ecartFieldName,
                    sortable: true,
                    dataType: 'number' as ColumnDataType,
                    filterable: true,
                    minWidth: 100,
                    editable: false,
                    visible: true,
                    draggable: true,
                    autoSize: true,
                    icon: 'icon-trending-up',
                    align: 'center',
                    cellRenderer: ((value: any, column?: any, row?: any) => {
                        // Supporter (params) ou (value, column, row) selon le DataTable
                        const params = value && typeof value === 'object' && ('value' in value || 'data' in value)
                            ? value
                            : null
                        const currentFieldName = (params?.column?.field ?? column?.field) ?? ecartFieldName
                        const rowData = params?.data ?? row
                        const ecartValue = params?.value ?? (rowData != null ? rowData[currentFieldName] : value)
                        if (ecartValue === undefined || ecartValue === null || ecartValue === '') {
                            return '-'
                        }

                        const numValue = Number(ecartValue)
                        if (Number.isNaN(numValue)) {
                            return '-'
                        }
                        const color = numValue === 0 ? 'text-green-600' : 'text-red-600'
                        return `<span class="${color} font-semibold">${numValue}</span>`
                    }) as any
                })
            }
        })

        // 6. Résolu
        cols.push({
            headerName: 'Résolu',
            field: 'resolved',
            sortable: true,
            dataType: 'boolean' as ColumnDataType,
            filterable: true,
            // Pas de width fixe - autoSize gère automatiquement comme DataTables.js
            minWidth: 100,
            editable: false,
            visible: true,
            draggable: true,
            autoSize: true,
            align: 'center',
            description: 'Statut de résolution de l\'écart',
            priority: 1, // Priorité très basse
            cellRenderer: (value: any) => {
                const isResolved = value === true || value === 'true' || value === 1 || value === '1'
                if (isResolved) {
                    return `<div class="flex items-center justify-center">
                        <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                        </svg>
                    </div>`
                } else {
                    return `<div class="flex items-center justify-center">
                        <svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                        </svg>
                    </div>`
                }
            }
        })

        // 7. Résultat final
        cols.push({
            headerName: 'Résultat final',
            field: 'resultats',
            sortable: true,
            dataType: 'number' as ColumnDataType,
            filterable: true,
            minWidth: 120,
            editable: true,
            visible: true,
            draggable: true,
            autoSize: true,
            icon: 'icon-check-circle',
            description: 'Résultat final validé',
            priority: 7,
            align: 'center'
        })

        // Validation des colonnes (seulement si nécessaire, pas bloquant)
        cols.forEach(column => {
            try {
                const validation = dataTableService.validateColumnConfig(column as any)
                if (!validation.isValid) {
                    // Configuration de colonne invalide - log silencieux en production
                }
            } catch (error) {
                // Erreur de validation - ignorer pour ne pas bloquer le rendu
            }
        })

        // Mettre en cache
        columnsCache.value = {
            columns: cols,
            resultsLength: currentResults.length,
            resultsHash
        }

        return cols;
    });

    // ===== NOTE SUR QUERYMODEL =====
    // Le DataTable émet query-model-changed ; customParams (inventory_id, store_id) sont fusionnés
    // ici avant l'appel à resultsStore.fetchResultsAuto. Pas de gestion manuelle du QueryModel.

    // ===== ACTIONS =====

    /**
     * Actions disponibles pour chaque ligne de résultat
     *
     * Chaque action est affichée comme un bouton dans la colonne d'actions du DataTable.
     *
     * Actions disponibles :
     * - **Modifier** : Modifier le résultat final avec justification optionnelle
     * - **Valider** : Valider l'écart de comptage avec justification optionnelle
     *
     * @constant {ActionConfig<InventoryResult>[]} actions - Configuration des actions
     */
    const actions: ActionConfig<InventoryResult>[] = [
        {
            label: 'Modifier',
            icon: markRaw(IconPencil),
            color: 'primary',
            onClick: async (result: InventoryResult) => {
                try {
                    // Extraire l'ID de l'écart de comptage depuis le résultat, le job ou les assignments
                    const ecartComptageId = extractEcartComptageId(result)

                    if (!ecartComptageId) {
                        await alertService.error({ text: 'ID de l\'écart de comptage (ecart_comptage_id) manquant dans les données. Vérifiez que le job ou les assignments contiennent un ecart_comptage_id.' })
                        return
                    }

                    // Première popup : Saisie de la nouvelle valeur
                    const swalResult = await Swal.fire({
                        title: 'Modifier le résultat final',
                        html: `
                            <div style="text-align: left; padding: 1rem 0;">
                                <p style="color: #6b7280; font-size: 0.95rem; margin-bottom: 1rem;">
                                    Entrez la nouvelle valeur du résultat final
                                </p>
                            </div>
                        `,
                        input: 'number',
                        inputPlaceholder: String(result.resultats ?? ''),
                        inputValue: result.resultats ?? '',
                        inputAttributes: {
                            min: '0',
                            step: '1'
                        },
                        showCancelButton: true,
                        confirmButtonText: 'Suivant',
                        cancelButtonText: 'Annuler',
                        confirmButtonColor: '#FECD1C',
                        cancelButtonColor: '#FECD1C',
                        inputValidator: (value) => {
                            if (!value || value === '') {
                                return 'Veuillez entrer une valeur'
                            }
                            const numValue = Number(value)
                            if (Number.isNaN(numValue) || numValue < 0) {
                                return 'Veuillez entrer un nombre valide (≥ 0)'
                            }
                            return null
                        },
                        customClass: {
                            popup: 'sweet-alerts',
                            confirmButton: 'btn btn-primary',
                            cancelButton: 'btn-cancel-primary'
                        }
                    })

                    if (!swalResult.isConfirmed || swalResult.value === undefined || swalResult.value === null) {
                        return
                    }

                    const newValue = Number(swalResult.value)

                    // Deuxième popup : Justification (optionnelle)
                    const justificationResult = await Swal.fire({
                        title: 'Justification (optionnelle)',
                        html: `
                            <div style="text-align: left; padding: 1rem 0;">
                                <p style="color: #6b7280; font-size: 0.95rem; margin-bottom: 1rem;">
                                    Vous pouvez ajouter une justification pour cette modification
                                </p>
                            </div>
                        `,
                        input: 'textarea',
                        inputPlaceholder: 'Ex: Ajustement manuel après contrôle...',
                        inputAttributes: {
                            rows: '4'
                        },
                        showCancelButton: true,
                        confirmButtonText: 'Confirmer',
                        cancelButtonText: 'Annuler',
                        confirmButtonColor: '#FECD1C',
                        cancelButtonColor: '#FECD1C',
                        customClass: {
                            popup: 'sweet-alerts',
                            confirmButton: 'btn btn-primary',
                            cancelButton: 'btn-cancel-primary'
                        }
                    })

                    if (!justificationResult.isConfirmed) {
                        return
                    }

                    // Appeler l'API de mise à jour du résultat final
                    // Construire le payload : inclure justification seulement si elle est renseignée
                    const updatePayload: { final_result: number; justification?: string } = {
                        final_result: newValue
                    }
                    if (justificationResult.value && typeof justificationResult.value === 'string' && justificationResult.value.trim()) {
                        updatePayload.justification = justificationResult.value.trim()
                    }
                    await EcartComptageService.updateFinalResult(Number(ecartComptageId), updatePayload)

                    await alertService.success({ text: 'Résultat final modifié avec succès' })
                    await refreshResults()
                } catch (error: any) {
                    // Extraire le message d'erreur du backend
                    const errorMessage = error?.response?.data?.message ||
                        error?.message ||
                        'Erreur lors de la modification du résultat final'

                    await alertService.error({ text: errorMessage })
                }
            },
            show: () => true
        },
        {
            label: 'Valider',
            icon: markRaw(IconCheck),
            color: 'success',
            onClick: async (result: InventoryResult) => {
                try {
                    // Extraire l'ID de l'écart de comptage depuis le résultat, le job ou les assignments
                    const ecartComptageId = extractEcartComptageId(result)

                    if (!ecartComptageId) {
                        await alertService.error({ text: 'ID de l\'écart de comptage (ecart_comptage_id) manquant dans les données. Vérifiez que le job ou les assignments contiennent un ecart_comptage_id.' })
                        return
                    }

                    // Vérifier que le résultat final est renseigné
                    if (!result.resultats && result.resultats !== 0) {
                        await alertService.warning({
                            text: 'Le résultat final doit être renseigné avant de pouvoir valider l\'écart'
                        })
                        return
                    }

                    const confirmation = await Swal.fire({
                        title: 'Valider l\'écart',
                        html: `
                            <div style="text-align: left; padding: 1rem 0;">
                                <p style="color: #6b7280; font-size: 0.95rem; margin-bottom: 1rem;">
                                    Voulez-vous vraiment valider cet écart de comptage ?
                                </p>
                                <div style="background: #f9fafb; border-radius: 0.5rem; padding: 1rem; margin-top: 1rem;">
                                    <div style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem;">Résultat final :</div>
                                    <div style="font-size: 1.125rem; font-weight: 600; color: #1f2937;">${result.resultats ?? 'Non défini'}</div>
                                </div>
                            </div>
                        `,
                        input: 'textarea',
                        inputPlaceholder: 'Justification (optionnelle)...',
                        inputAttributes: {
                            rows: '4'
                        },
                        showCancelButton: true,
                        confirmButtonText: 'Valider',
                        cancelButtonText: 'Annuler',
                        confirmButtonColor: '#10B981',
                        cancelButtonColor: '#FECD1C',
                        customClass: {
                            popup: 'sweet-alerts',
                            confirmButton: 'btn btn-success',
                            cancelButton: 'btn-cancel-primary'
                        }
                    })

                    if (!confirmation.isConfirmed) {
                        return
                    }

                    // Appeler l'API de résolution de l'écart (qui correspond à la validation)
                    // Construire le payload : inclure justification seulement si elle est renseignée
                    const resolvePayload: ResolveEcartRequest = {}
                    if (confirmation.value && typeof confirmation.value === 'string' && confirmation.value.trim()) {
                        resolvePayload.justification = confirmation.value.trim()
                    }
                    await EcartComptageService.resolveEcart(Number(ecartComptageId), resolvePayload)

                    await alertService.success({ text: 'Écart validé avec succès' })
                    await refreshResults()
                } catch (error: any) {
                    // Extraire le message d'erreur du backend
                    const errorMessage = error?.response?.data?.message ||
                        error?.message ||
                        'Erreur lors de la validation de l\'écart'

                    await alertService.error({ text: errorMessage })
                }
            },
            show: () => true
        },
    ]

    // ===== MÉTHODES DE CHARGEMENT =====

    /**
     * Récupère les magasins disponibles pour l'inventaire
     *
     * Utilise une stratégie d'optimisation multi-niveaux pour charger les magasins le plus rapidement possible :
     *
     * 1. **PRIORITÉ ABSOLUE** : Utilise les warehouses depuis l'inventaire déjà chargé (instantané)
     * 2. **PRIORITÉ 1** : Charge via account_id si disponible (rapide, ~100-200ms)
     * 3. **PRIORITÉ 2** : Charge via API inventaire avec timeout court (500ms max)
     * 4. **FALLBACK** : Utilise les magasins déjà dans le store
     *
     * Un cache est utilisé pour éviter les appels répétés.
     *
     * @async
     * @returns {Promise<void>} Promise qui se résout une fois les magasins chargés
     *
     * @example
     * ```typescript
     * await fetchStores()
     * // Les magasins sont maintenant disponibles dans storeOptions
     * ```
     */
    const storesLoadingState = ref(false)
    const storesCache = ref<StoreOption[] | null>(null)

    const fetchStores = async () => {
        if (!inventoryId.value) {
            return
        }

        // Éviter les appels multiples simultanés
        if (storesLoadingState.value) {
            return
        }

        // Utiliser le cache si disponible et valide (évite les appels répétés)
        if (storesCache.value && storesCache.value.length > 0) {
            syncStoreOptions(storesCache.value)
            return
        }

        storesLoadingState.value = true

        try {
            // OPTIMISATION 0 : PRIORITÉ ABSOLUE - Utiliser les warehouses depuis l'inventaire (instantané)
            // Si l'inventaire est déjà chargé et contient des warehouses, les utiliser directement
            // C'est la méthode la plus rapide car les données sont déjà en mémoire
            if (inventory.value && inventory.value.warehouses && Array.isArray(inventory.value.warehouses) && inventory.value.warehouses.length > 0) {
                const inventoryWarehouses = inventory.value.warehouses
                const storeList: StoreOption[] = inventoryWarehouses.map((wh: any) => ({
                    label: wh.warehouse_name || wh.reference || `Entrepôt ${wh.id || wh.warehouse_id}`,
                    value: String(wh.id || wh.warehouse_id)
                }))
                syncStoreOptions(storeList)
                storesCache.value = storeList
                storesLoadingState.value = false
                return
            }

            // OPTIMISATION 1 : Priorité à account_id (beaucoup plus rapide que fetchStores)
            // Cet endpoint est optimisé et retourne rapidement (~100-200ms)
            if (accountId.value) {
                try {
                    // OPTIMISATION : Ne pas attendre si les warehouses sont déjà dans le store
                    if (warehouses.value.length > 0) {
                        syncStoreOptions(null) // Utiliser les warehouses du store
                        storesCache.value = storeOptions.value
                        storesLoadingState.value = false
                        return
                    }

                    await warehouseStore.fetchWarehouses(accountId.value)
                    syncStoreOptions(null) // Utiliser les warehouses du store

                    // Si on a des magasins, les mettre en cache et retourner immédiatement
                    if (storeOptions.value.length > 0) {
                        storesCache.value = storeOptions.value
                        storesLoadingState.value = false
                        return
                    }
                } catch (error) {
                    // En cas d'erreur, continuer avec le fallback
                }
            }

            // OPTIMISATION 2 : Fallback via inventaire avec timeout très court (500ms au lieu de 1s)
            // Seulement si account_id n'est pas disponible ou a échoué
            // Cet endpoint peut être lent, d'où le timeout très court
            try {
                const inventoryStores = await Promise.race([
                    resultsStore.fetchStores(inventoryId.value),
                    new Promise<StoreOption[] | null>((_, reject) =>
                        setTimeout(() => reject(new Error(`Timeout après ${STORES_FETCH_TIMEOUT_MS}ms`)), STORES_FETCH_TIMEOUT_MS)
                    )
                ]) as StoreOption[]

                if (inventoryStores && inventoryStores.length > 0) {
                    syncStoreOptions(inventoryStores)
                    storesCache.value = inventoryStores
                    storesLoadingState.value = false
                    return
                }
            } catch (error) {
                // Timeout ou erreur - ignorer silencieusement (pas bloquant)
            }

            // OPTIMISATION 3 : Dernier recours - utiliser les magasins déjà dans le store
            // Si disponibles (peuvent avoir été chargés précédemment)
            if (storeOptionsFromStore.value.length > 0) {
                syncStoreOptions(storeOptionsFromStore.value)
                storesCache.value = storeOptionsFromStore.value
            }
        } catch (error) {
            // Ne pas afficher d'erreur bloquante, utiliser ce qu'on a
        } finally {
            storesLoadingState.value = false
        }
    }

    /**
     * Charge les résultats avec des paramètres spécifiques
     *
     * @param params - Paramètres de requête optionnels au format QueryModel
     */
    const loadResults = async (params?: QueryModel) => {
        if (!inventoryId.value || !selectedStore.value) {
            return
        }

        // Activer le loading
        resultsLoadingLocal.value = true

        try {
            // Si params est fourni, utiliser directement (customParams déjà fusionnés par le DataTable)
            // Sinon, construire un QueryModel par défaut avec customParams
            const finalParams: QueryModel = params || {
                page: 1,
                pageSize: 50,
                customParams: resultsCustomParams.value
            }

            await resultsStore.fetchResultsAuto(finalParams)
            await nextTick()

            // Mettre à jour le cache après un appel réussi
            lastExecutedQueryModel.value = { ...finalParams }

            // Désactiver le loading
            resultsLoadingLocal.value = false
        } catch (error) {
            await alertService.error({ text: 'Erreur lors du chargement des résultats' })
            // Désactiver le loading même en cas d'erreur
            resultsLoadingLocal.value = false
        }
    }

    /**
     * Rafraîchir les résultats
     *
     * @param params - Paramètres de requête optionnels au format QueryModel
     */
    const refreshResults = async (params?: QueryModel) => {
        await loadResults(params)
    }

    /**
     * Recharge les résultats actuels
     *
     * ⚠️ NOTE: Avec enableAutoManagement, le rechargement est géré automatiquement par le DataTable.
     * Cette fonction est conservée pour compatibilité avec les actions qui l'appellent,
     * mais utilise maintenant loadResults pour une cohérence avec useAffecter.ts.
     *
     * @deprecated Utiliser refreshResults pour une meilleure cohérence
     * @returns Promise vide (pour compatibilité)
     */
    const reloadResults = async () => {
        await refreshResults()
    }

    /**
     * Récupère l'inventaire par sa référence
     *
     * Charge l'inventaire depuis le store et stocke l'inventaire complet pour accès rapide aux warehouses.
     * Si l'inventaire contient déjà des warehouses, ils sont utilisés directement (optimisation).
     *
     * @async
     * @param {string} reference - Référence de l'inventaire
     * @returns {Promise<any>} Promise qui se résout avec l'inventaire chargé
     * @throws {Error} Si l'inventaire est introuvable
     *
     * @example
     * ```typescript
     * const inventory = await fetchInventoryByReference('INV-2024-001')
     * // inventory.id et inventory.warehouses sont maintenant disponibles
     * ```
     */
    const fetchInventoryByReference = async (reference: string) => {
        try {
            const fetchedInventory = await inventoryStore.fetchInventoryByReference(reference)
            if (fetchedInventory) {
                // Stocker l'inventaire complet pour accéder rapidement aux warehouses
                inventory.value = fetchedInventory
                inventoryId.value = fetchedInventory.id
                const newAccountId = fetchedInventory.account_id || null
                accountId.value = newAccountId

                // OPTIMISATION : Si l'inventaire contient déjà des warehouses, les utiliser directement
                // Sinon, précharger les magasins si account_id disponible
                if (fetchedInventory.warehouses && Array.isArray(fetchedInventory.warehouses) && fetchedInventory.warehouses.length > 0) {
                    // Les warehouses sont déjà dans l'inventaire, fetchStores les utilisera instantanément
                    fetchStores().catch(() => {
                        // Ignorer les erreurs, elles sont gérées dans fetchStores
                    })
                } else if (newAccountId) {
                    // Pas de warehouses dans l'inventaire, charger via account_id
                    fetchStores().catch(() => {
                        // Ignorer les erreurs, elles sont gérées dans fetchStores
                    })
                }
            }
            inventoryReference.value = reference
            return fetchedInventory
        } catch (error) {
            await alertService.error({ text: `Inventaire "${reference}" introuvable` })
            throw error
        }
    }

    // ===== MÉTHODES D'ACTION =====

    /**
     * Sélectionne un magasin pour afficher ses résultats
     *
     * Met à jour le magasin sélectionné dans le store. Le DataTable avec enableAutoManagement
     * détecte automatiquement le changement via customDataTableParams et recharge les données.
     *
     * @async
     * @param {string | null} storeId - ID du magasin à sélectionner
     * @returns {Promise<void>} Promise qui se résout une fois le magasin sélectionné
     *
     * @example
     * ```typescript
     * await handleStoreSelect('123')
     * // Les résultats du magasin 123 sont maintenant chargés automatiquement
     * ```
     */
    const handleStoreSelect = async (storeId: string | null) => {
        if (!storeId || !inventoryId.value) return

        try {
            // Mettre à jour le magasin sélectionné dans le store
            // Le DataTable détectera le changement via customDataTableParams et rechargera automatiquement
            resultsStore.setSelectedStore(storeId)

            // ⚡ OPTIMISATION : Invalider tous les caches lors du changement de magasin
            storesCache.value = null
            normalizedResultsCache.value = null
            columnsCache.value = null
            lastExecutedQueryModel.value = null
        } catch (error) {
            await alertService.error({ text: 'Erreur lors de la sélection du magasin' })
        }
    }

    /**
     * Valide plusieurs résultats en masse
     *
     * Valide chaque résultat sélectionné un par un. Continue même si une validation échoue.
     * Affiche un message de succès avec le nombre de résultats validés.
     *
     * @async
     * @param {InventoryResult[]} selectedResults - Liste des résultats à valider
     * @returns {Promise<void>} Promise qui se résout une fois la validation terminée
     *
     * @example
     * ```typescript
     * await handleBulkValidate([result1, result2, result3])
     * // Les 3 résultats sont maintenant validés
     * ```
     */
    const handleBulkValidate = async (selectedResults: InventoryResult[]) => {
        if (selectedResults.length === 0) {
            await alertService.warning({ text: 'Veuillez sélectionner au moins un résultat à valider' })
            return
        }

        try {
            const confirmation = await alertService.confirm({
                title: 'Confirmer la validation en masse',
                text: `Voulez-vous vraiment valider ${selectedResults.length} résultat(s) ?`
            })

            if (confirmation.isConfirmed) {
                // Convertir les IDs en nombres et valider chaque résultat
                // Note: validateResults accepte un seul ID, donc on valide un par un
                const ids = selectedResults.map(r => {
                    const id = r.id
                    return typeof id === 'number' ? id : Number(id)
                }).filter(id => !Number.isNaN(id))

                if (ids.length === 0) {
                    await alertService.error({ text: 'Aucun ID valide trouvé pour la validation' })
                    return
                }

                // Valider chaque résultat (la fonction accepte un seul ID)
                for (const id of ids) {
                    try {
                        await resultsStore.validateResults(id)
                    } catch (error) {
                        // Continuer avec les autres même si une validation échoue
                    }
                }

                await alertService.success({ text: `${ids.length} résultat(s) validé(s) avec succès` })
                await reloadResults()
            }
        } catch (error) {
            await alertService.error({ text: 'Erreur lors de la validation en masse' })
        }
    }

    // ===== INITIALISATION =====

    /**
     * Traite les événements DataTable mis en file d'attente pendant l'initialisation
     */
    const processPendingEvents = async () => {
        if (pendingEventsQueue.value.length === 0) return

        const events = [...pendingEventsQueue.value]
        pendingEventsQueue.value.length = 0 // Vider la file

        for (const event of events) {
            await processEventDirectly(event.eventType, event.queryModel)
        }
    }

    /**
     * Initialise le composable avec une référence d'inventaire
     *
     * Charge l'inventaire, les magasins disponibles et sélectionne automatiquement le premier magasin.
     * Le DataTable avec enableAutoManagement chargera automatiquement les résultats du magasin sélectionné.
     *
     * @async
     * @param {string} [reference] - Référence de l'inventaire (optionnel, utilise celle du config si non fourni)
     * @returns {Promise<void>} Promise qui se résout une fois l'initialisation terminée
     * @throws {Error} Si l'inventaire est introuvable ou si l'ID d'inventaire ne peut pas être résolu
     *
     * @example
     * ```typescript
     * await initialize('INV-2024-001')
     * // Le composable est maintenant initialisé et les données sont chargées
     * ```
     */
    const initialize = async (reference?: string) => {
        try {
            // Utiliser la référence fournie ou celle stockée
            const ref = reference || inventoryReference.value

            if (!ref) {
                return
            }

            // Mettre à jour la référence si fournie
            if (reference) {
                inventoryReference.value = reference
            }

            // Récupérer l'inventaire (précharge aussi les magasins si account_id disponible)
            await fetchInventoryByReference(ref)

            if (!inventoryId.value) {
                throw new Error('Impossible de résoudre l\'ID d\'inventaire')
            }

            // ⚡ Référence magasin dans l'URL : appeler l'API magasin par référence pour récupérer l'ID, puis déclencher l'API résultats
            if (config?.initialWarehouseReference) {
                const warehouseId = await warehouseStore.fetchWarehouseByReference(config.initialWarehouseReference)
                if (warehouseId != null) {
                    resultsStore.setSelectedStore(String(warehouseId))
                }
            }

            // OPTIMISATION : Charger les magasins (instantané si dans l'inventaire, sinon via account_id)
            // fetchStores vérifie d'abord inventory.value.warehouses (instantané)
            await fetchStores()

            // ⚡ Sélectionner le magasin : déjà fait si référence URL, sinon premier disponible
            if (storeOptions.value.length > 0 && !selectedStore.value) {
                const defaultStoreId = storeOptions.value[0].value
                resultsStore.setSelectedStore(defaultStoreId)
            }

            // Attendre que le DataTable ait fini de s'initialiser et de restaurer son état
            await nextTick()
            // Ajouter un délai pour être sûr que tous les événements sont capturés
            // Le DataTable peut émettre query-model-changed après son onMounted
            await new Promise(resolve => setTimeout(resolve, INITIALIZATION_DELAY_MS))

            // ⚡ IMPORTANT : Marquer comme initialisé APRÈS avoir attendu que le DataTable émette ses événements
            // Cela permet de capturer les événements de restauration dans la file d'attente
            isInitialized.value = true

            // Traiter les événements DataTable mis en file d'attente
            // ⚠️ Logique harmonisée avec useAffecter.ts
            // Le DataTable émet automatiquement query-model-changed au montage avec l'état restauré
            // Ces événements sont capturés dans pendingEventsQueue car isInitialized était false
            if (pendingEventsQueue.value.length > 0) {
                // Traiter le premier événement (celui de la restauration du DataTable)
                const firstEvent = pendingEventsQueue.value[0]
                await processEventDirectly(firstEvent.eventType, firstEvent.queryModel)
                pendingEventsQueue.value.shift() // Retirer le premier événement traité

                // Traiter les événements restants en file d'attente (s'il y en a)
                if (pendingEventsQueue.value.length > 0) {
                    for (const queuedEvent of pendingEventsQueue.value) {
                        await processEventDirectly(queuedEvent.eventType, queuedEvent.queryModel)
                    }
                    pendingEventsQueue.value.length = 0 // Vider la file d'attente
                }
            } else {
                // ⚡ CAS RARE : Aucun événement en file d'attente
                // Cela peut arriver si :
                // 1. Le DataTable n'a pas encore été monté (timing)
                // 2. Le DataTable n'a pas d'état sauvegardé et n'émet pas d'événement par défaut
                //
                // Dans ce cas, charger avec les valeurs par défaut
                // Si le DataTable émet un événement plus tard, il sera traité normalement
                // (mais cela ne devrait pas arriver car le DataTable émet toujours query-model-changed au montage)
                const defaultQueryModel: QueryModel = {
                    page: DEFAULT_PAGE,
                    pageSize: DEFAULT_PAGE_SIZE,
                    sort: undefined,
                    filters: {},
                    search: undefined,
                    customParams: resultsCustomParams.value
                }
                await loadResults(defaultQueryModel)
            }
        } catch (error) {
            await alertService.error({ text: ERROR_MESSAGES.INITIALIZATION })
        }
    }

    /**
     * Réinitialise le composable avec une nouvelle référence d'inventaire
     *
     * Réinitialise tous les états (magasin sélectionné, options de magasins, cache des requêtes)
     * et recharge les données avec la nouvelle référence.
     *
     * @async
     * @param {string} reference - Nouvelle référence de l'inventaire
     * @returns {Promise<void>} Promise qui se résout une fois la réinitialisation terminée
     *
     * @example
     * ```typescript
     * await reinitialize('INV-2024-002')
     * // Le composable est maintenant réinitialisé avec le nouvel inventaire
     * ```
     */
    const reinitialize = async (reference: string) => {
        if (!reference) return

        try {
            isInitialized.value = false
            resultsStore.setSelectedStore(null)
            storeOptions.value = []
            usesWarehouseFallback.value = false

            // ⚡ OPTIMISATION : Réinitialiser tous les caches lors de la réinitialisation
            lastExecutedQueryModel.value = null
            pendingEventsQueue.value.length = 0 // Vider la file d'attente
            normalizedResultsCache.value = null
            columnsCache.value = null
            storesCache.value = null

            inventoryReference.value = reference
            await initialize()
        } catch (error) {
            throw error
        }
    }

    // ===== FONCTIONS POUR LANCER COMPTAGE =====

    /**
     * Récupère les jobs avec écarts non résolus regroupés par ordre de comptage depuis l'API
     *
     * Utilise l'endpoint GET /web/api/inventory/{inventory_id}/warehouse/{warehouse_id}/jobs/discrepancies-by-counting/
     * pour récupérer les jobs nécessitant un comptage suivant (3ème, 4ème, etc.)
     *
     * @async
     * @returns {Promise<Map<number, JobResult[]>>} Map où la clé est le numéro de comptage (3, 4, 5, etc.)
     *         et la valeur est la liste des jobs nécessitant ce comptage
     *
     * @example
     * ```typescript
     * const jobsParComptage = await analyserJobsPourComptageSuivant()
     * // jobsParComptage.get(3) contient les jobs nécessitant un 3ème comptage
     * ```
     */
    const analyserJobsPourComptageSuivant = async (): Promise<Map<number, JobResult[]>> => {
        if (!inventoryId.value || !selectedStore.value) {
            return new Map()
        }

        try {
            // Convertir selectedStore en number (warehouseId)
            const warehouseId = typeof selectedStore.value === 'string'
                ? parseInt(selectedStore.value)
                : selectedStore.value

            if (!warehouseId || isNaN(warehouseId)) {
                return new Map()
            }

            // Appeler l'API pour récupérer les jobs avec écarts regroupés par comptage
            const apiResponse = await JobService.getJobsDiscrepanciesByCounting(
                inventoryId.value,
                warehouseId
            )

            // Convertir la réponse de l'API en Map<number, JobResult[]>
            const jobsParComptage = new Map<number, JobResult[]>()

            // La réponse peut être soit un tableau (ancien format) soit un tableau avec un objet (nouveau format)
            if (!apiResponse || !Array.isArray(apiResponse) || apiResponse.length === 0) {
                return jobsParComptage
            }

            // Parcourir les éléments de la réponse
            for (const item of apiResponse) {
                if (!item || typeof item !== 'object') {
                    continue
                }

                // Nouveau format : objet avec next_counting_order
                if ('next_counting_order' in item && item.next_counting_order) {
                    const nextCountingOrder = item.next_counting_order
                    const jobs = item.jobs || []

                    if (!jobs || jobs.length === 0) {
                        continue
                    }

                    // Convertir chaque job de l'API en JobResult
                    const jobResults: JobResult[] = jobs.map(job => ({
                        id: job.job_id,
                        job_id: job.job_id,
                        reference: job.job_reference,
                        job_reference: job.job_reference,
                        status: '',
                        current_max_counting: job.current_max_counting,
                        has_unresolved_discrepancies: job.has_unresolved_discrepancies,
                        discrepancies_locations_count: job.discrepancies_locations_count,
                        assignments: [],
                        emplacements: [], // Les emplacements ne sont pas fournis par l'API
                        ressources: []
                    } as JobResult))

                    // Trier les jobs par référence
                    jobResults.sort((a, b) =>
                        (a.reference || '').localeCompare(b.reference || '')
                    )

                    jobsParComptage.set(nextCountingOrder, jobResults)
                }
                // Ancien format : objet avec counting_order
                else if ('counting_order' in item && item.counting_order) {
                    const countingOrder = item.counting_order
                    const jobs = item.jobs || []

                    if (!jobs || jobs.length === 0) {
                        continue
                    }

                    // Convertir chaque job de l'API en JobResult
                    const jobResults: JobResult[] = jobs.map(job => ({
                        id: job.job_id,
                        job_id: job.job_id,
                        reference: job.job_reference,
                        job_reference: job.job_reference,
                        status: '',
                        current_max_counting: job.current_max_counting,
                        has_unresolved_discrepancies: job.has_unresolved_discrepancies,
                        discrepancies_locations_count: job.discrepancies_locations_count,
                        assignments: [],
                        emplacements: [], // Les emplacements ne sont pas fournis par l'API
                        ressources: []
                    } as JobResult))

                    // Trier les jobs par référence
                    jobResults.sort((a, b) =>
                        (a.reference || '').localeCompare(b.reference || '')
                    )

                    jobsParComptage.set(countingOrder, jobResults)
                }
            }

            return jobsParComptage
        } catch (error: any) {

            // Gérer les erreurs spécifiques
            const errorMessage = error?.response?.data?.message || error?.message || ''

            if (errorMessage.includes('Inventaire ou entrepôt non trouvé') ||
                errorMessage.includes('non trouvé')) {
                await alertService.error({
                    text: 'Inventaire ou entrepôt non trouvé. Vérifiez que l\'inventaire et le magasin sont correctement sélectionnés.'
                })
            } else if (errorMessage) {
                await alertService.error({
                    text: `Erreur lors de la récupération des jobs : ${errorMessage}`
                })
            } else {
                await alertService.error({
                    text: 'Impossible de récupérer les jobs avec écarts pour le comptage suivant'
                })
            }

            return new Map()
        }
    }

    /**
     * Affiche la modal pour sélectionner et lancer un comptage suivant
     *
     * Affiche une modal fullscreen permettant de :
     * 1. Sélectionner les jobs nécessitant un comptage suivant (groupés par ordre de comptage)
     * 2. Sélectionner une session pour le comptage
     * 3. Lancer le comptage avec les jobs et session sélectionnés
     *
     * La sélection est mutuellement exclusive : un seul job par catégorie de comptage peut être sélectionné.
     *
     * @async
     * @returns {Promise<void>} Promise qui se résout une fois la modal fermée
     *
     * @example
     * ```typescript
     * await showLaunchCountingModal()
     * // La modal est maintenant affichée pour sélectionner les jobs
     * ```
     */
    const showLaunchCountingModal = async () => {
        try {
            logger.debug('showLaunchCountingModal: Démarrage de l\'analyse des jobs', {
                inventoryId: inventoryId.value,
                selectedStore: selectedStore.value
            })

            // ÉTAPE 1 : Analyser les jobs validés pour trouver ceux nécessitant un comptage 3, 4, 5, etc.
            const jobsParComptage = await analyserJobsPourComptageSuivant()

            logger.debug('showLaunchCountingModal: Résultat de l\'analyse', {
                jobsParComptageSize: jobsParComptage.size,
                jobsParComptageKeys: Array.from(jobsParComptage.keys())
            })

            if (jobsParComptage.size === 0) {
                await alertService.info({ text: 'Aucun job ne nécessite un comptage suivant' })
                return
            }

            // Créer la modal avec les jobs groupés par comptage
            const container = document.createElement('div')
            document.body.appendChild(container)

            // Capturer les stores et fonctions nécessaires en closure pour la modal
            const modalSessionStore = sessionStore
            const modalJobStore = jobStore

            const app = createApp({
                setup() {
                    const showModal = ref<boolean>(true)
                    const selectedJobs = ref<Map<number, number[]>>(new Map()) // Map<comptage, jobIds[]>
                    const disabledCategories = ref<Set<number>>(new Set())

                    const handleJobToggle = (comptage: number, jobId: number) => {
                        if (disabledCategories.value.has(comptage)) {
                            return // Catégorie désactivée
                        }

                        // Pour ce comptage, gérer la sélection multiple
                        const currentSelection = selectedJobs.value.get(comptage) || []
                        const isSelected = currentSelection.includes(jobId)

                        if (isSelected) {
                            // Désélectionner ce job
                            const newSelection = currentSelection.filter(id => id !== jobId)
                            if (newSelection.length === 0) {
                                selectedJobs.value.delete(comptage)
                            } else {
                                selectedJobs.value.set(comptage, newSelection)
                            }

                            // Si plus aucun job n'est sélectionné dans ce comptage, réactiver les autres catégories
                            if (!selectedJobs.value.has(comptage)) {
                                disabledCategories.value.clear()
                            }
                        } else {
                            // Sélectionner ce job
                            selectedJobs.value.set(comptage, [...currentSelection, jobId])

                            // Désactiver les autres catégories seulement si on a une sélection dans ce comptage
                            disabledCategories.value.clear()
                            jobsParComptage.forEach((_, catComptage) => {
                                if (catComptage !== comptage) {
                                    disabledCategories.value.add(catComptage)
                                }
                            })
                        }
                    }

                    const handleConfirm = async () => {
                        const totalSelectedJobs = Array.from(selectedJobs.value.values()).flat().length
                        if (totalSelectedJobs === 0) {
                            await alertService.warning({ text: 'Veuillez sélectionner au moins un job' })
                            return
                        }

                        // Fermer la modal de sélection du comptage
                        showModal.value = false
                        setTimeout(() => {
                            app.unmount()
                            container.remove()
                        }, 300)

                        // ÉTAPE 2 : Afficher la modal de sélection de session avec les jobs sélectionnés
                        try {
                            // Récupérer les sessions disponibles pour le comptage sélectionné
                            const selectedCountingOrder = Array.from(selectedJobs.value.keys())[0] // Le premier comptage sélectionné
                            const selectedJobsList = Array.from(selectedJobs.value.values()).flat() // Aplatir tous les jobs sélectionnés

                            // Créer la modal de sélection de session avec la liste des jobs
                            const sessionContainer = document.createElement('div')
                            document.body.appendChild(sessionContainer)

                            const sessionApp = createApp({
                                setup() {
                                    const sessionShowModal = ref<boolean>(true)
                                    const selectedSessionId = ref<number | null>(null)
                                    const sessionLoading = ref(false)

                                    const handleSessionConfirm = async () => {
                                        if (!selectedSessionId.value) {
                                            await alertService.warning({ text: 'Veuillez sélectionner une session' })
                                            return
                                        }

                                        sessionShowModal.value = false
                                        setTimeout(() => {
                                            sessionApp.unmount()
                                            sessionContainer.remove()
                                        }, 300)

                                        // Lancer le comptage avec les jobs sélectionnés et la session
                                        sessionLoading.value = true
                                        try {
                                            await modalJobStore.launchMultipleCountings({
                                                jobs: selectedJobsList,
                                                session_id: selectedSessionId.value
                                            })

                                            await alertService.success({ text: 'Comptage(s) lancé(s) avec succès' })
                                        } catch (error: any) {
                                            const errorMessage = error?.userMessage ||
                                                error?.response?.data?.message ||
                                                error?.message ||
                                                'Erreur lors du lancement du comptage'
                                            await alertService.error({ text: errorMessage })
                                        } finally {
                                            sessionLoading.value = false
                                        }
                                    }

                                    const handleSessionCancel = () => {
                                        sessionShowModal.value = false
                                        setTimeout(() => {
                                            sessionApp.unmount()
                                            sessionContainer.remove()
                                        }, 300)
                                    }

                                    // Charger les sessions
                                    const loadSessions = async () => {
                                        if (!selectedCountingOrder) {
                                            return
                                        }

                                        try {
                                            await modalSessionStore.fetchMobileUsersForCountingOrder(selectedCountingOrder)
                                        } catch (error) {
                                            logger.error('Erreur lors du chargement des sessions dans la modal', error)
                                            // Ne pas afficher d'alerte ici car ça peut casser le rendu de la modal
                                        }
                                    }

                                    onMounted(() => {
                                        loadSessions()
                                    })

                                    return () => h(Modal, {
                                        modelValue: sessionShowModal.value,
                                        'onUpdate:modelValue': (value: boolean) => {
                                            sessionShowModal.value = value
                                            if (!value) {
                                                handleSessionCancel()
                                            }
                                        },
                                        title: `Sélectionner une session - ${selectedCountingOrder}${selectedCountingOrder === 3 ? 'ème' : 'ème'} comptage`,
                                        size: 'lg'
                                    }, {
                                        default: () => [
                                            h('div', { class: 'space-y-4' }, [
                                                // Liste des jobs sélectionnés
                                                h('div', { class: 'mb-4' }, [
                                                    h('h4', { class: 'text-lg font-semibold mb-2' }, 'Jobs sélectionnés :'),
                                                    h('div', { class: 'max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2' },
                                                        selectedJobsList.map(jobId => {
                                                            const job = Array.from(jobsParComptage.values()).flat().find(j => (j.job_id || j.id) === jobId)
                                                            return h('div', {
                                                                key: jobId,
                                                                class: 'flex items-center justify-between py-1 px-2 bg-slate-50 rounded'
                                                            }, [
                                                                h('span', { class: 'text-sm font-medium' }, job?.job_reference || job?.reference || `Job ${jobId}`),
                                                                h('span', { class: 'text-xs text-slate-500' }, `${job?.discrepancies_locations_count || 0} empl.`),
                                                            ])
                                                        })
                                                    )
                                                ]),

                                                // Sélecteur de session
                                                h('div', [
                                                    h('label', { class: 'block text-sm font-medium text-slate-700 mb-2' }, 'Sélectionner une session :'),
                                                    h('select', {
                                                        value: selectedSessionId.value,
                                                        onChange: (e: any) => selectedSessionId.value = Number(e.target.value),
                                                        class: 'w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent',
                                                        disabled: sessionLoading.value
                                                    }, [
                                                        h('option', { value: '' }, '-- Choisir une session --'),
                                                        ...(modalSessionStore.getAllSessions || []).map(session =>
                                                            h('option', { key: session.id, value: session.id }, session.username || `Session ${session.id}`)
                                                        )
                                                    ])
                                                ]),

                                                h('div', {
                                                    class: 'flex justify-end space-x-3 pt-4 border-t'
                                                }, [
                                                    h('button', {
                                                        class: 'px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors',
                                                        onClick: handleSessionCancel,
                                                        disabled: sessionLoading.value
                                                    }, 'Annuler'),
                                                    h('button', {
                                                        class: `px-4 py-2 rounded transition-colors ${selectedSessionId.value && !sessionLoading.value
                                                                ? 'bg-primary text-white hover:bg-primary/90'
                                                                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                                            }`,
                                                        disabled: !selectedSessionId.value || sessionLoading.value,
                                                        onClick: handleSessionConfirm
                                                    }, sessionLoading.value ? 'Lancement...' : 'Lancer le comptage')
                                                ])
                                            ])
                                        ]
                                    })
                                }
                            })

                            const sessionPinia = createPinia()
                            sessionPinia.use(piniaPluginPersistedstate)
                            sessionApp.use(sessionPinia)
                            sessionApp.use(i18n)
                            sessionApp.mount(sessionContainer)

                            return // Ne pas continuer avec l'ancien flux

                        } catch (error: any) {
                            await alertService.error({ text: 'Erreur lors de la sélection de la session' })
                        }
                    }

                    const handleCancel = () => {
                        showModal.value = false
                        setTimeout(() => {
                            app.unmount()
                            container.remove()
                        }, 300)
                    }

                    return () => h(Modal, {
                        modelValue: showModal.value,
                        'onUpdate:modelValue': (value: boolean) => {
                            showModal.value = value
                            if (!value) {
                                handleCancel()
                            }
                        },
                        title: 'Sélectionner les jobs',
                        size: 'fullscreen'
                    }, {
                        default: () => [
                            h('div', { class: 'space-y-4' }, [
                                h('p', {
                                    class: 'text-sm text-slate-600 dark:text-slate-400 mb-4'
                                }, 'Sélectionnez les jobs à lancer. Vous ne pouvez sélectionner qu\'un job par catégorie de comptage.'),

                                // Afficher les jobs groupés par comptage
                                Array.from(jobsParComptage.entries())
                                    .sort(([a], [b]) => a - b)
                                    .map(([comptage, jobs]) => {
                                        const isDisabled = disabledCategories.value.has(comptage)
                                        const selectedJobId = selectedJobs.value.get(comptage)

                                        return h('div', {
                                            key: comptage,
                                            class: `border rounded-lg p-4 ${isDisabled ? 'opacity-50 bg-gray-50' : 'bg-white'}`
                                        }, [
                                            h('h3', {
                                                class: 'text-lg font-semibold mb-3 text-slate-800'
                                            }, `${comptage}${comptage === 3 ? 'ème' : 'ème'} comptage`),

                                            h('div', {
                                                class: 'flex flex-wrap gap-2 p-2 bg-slate-50 rounded-lg'
                                            }, jobs.map(job => {
                                                const jobId = job.job_id || job.id
                                                if (!jobId) return null

                                                const currentSelection = selectedJobs.value.get(comptage) || []
                                                const isSelected = currentSelection.includes(jobId)
                                                const discrepanciesCount = job.discrepancies_locations_count || 0

                                                return h('label', {
                                                    class: `flex items-center space-x-2 p-2 rounded cursor-pointer transition-colors border ${isSelected ? 'bg-primary/10 border-primary' :
                                                            isDisabled ? 'cursor-not-allowed border-gray-200 bg-gray-50' :
                                                                'hover:bg-slate-50 border-gray-200 bg-white'
                                                        }`,
                                                }, [
                                                    h('input', {
                                                        type: 'checkbox',
                                                        name: `comptage-${comptage}`,
                                                        value: jobId,
                                                        checked: isSelected,
                                                        disabled: isDisabled,
                                                        onChange: () => handleJobToggle(comptage, jobId)
                                                    }),
                                                    h('div', { class: 'text-sm' }, [
                                                        h('div', {
                                                            class: 'font-medium text-slate-900'
                                                        }, job.job_reference || job.reference || `Job ${jobId}`),
                                                        h('div', {
                                                            class: 'text-xs text-slate-500'
                                                        }, `${discrepanciesCount} écarts`)
                                                    ])
                                                ])
                                            }))
                                        ])
                                    }),

                                h('div', {
                                    class: 'flex justify-end space-x-3 pt-4 border-t'
                                }, [
                                    h('button', {
                                        class: 'px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors',
                                        onClick: handleCancel
                                    }, 'Annuler'),
                                    h('button', {
                                        class: `px-4 py-2 rounded transition-colors ${Array.from(selectedJobs.value.values()).flat().length > 0
                                                ? 'bg-primary text-white hover:bg-primary/90'
                                                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                            }`,
                                        disabled: Array.from(selectedJobs.value.values()).flat().length === 0,
                                        onClick: handleConfirm
                                    }, `Lancer ${Array.from(selectedJobs.value.values()).flat().length} job(s)`)
                                ])
                            ])
                        ]
                    })
                }
            })

            const pinia = createPinia()
            pinia.use(piniaPluginPersistedstate)
            app.use(pinia)
            app.use(i18n)

            app.mount(container)
        } catch (error: any) {
            await alertService.error({ text: 'Erreur lors de l\'affichage de la modal' })
        }
    }

    // ===== HANDLERS ET CONFIGURATIONS POUR LA VUE =====

    /**
     * Style commun pour les boutons d'action
     */
    const ACTION_BUTTON_CLASS =
        'bg-white text-primary border border-primary hover:bg-primary hover:text-white ' +
        'dark:bg-slate-900 dark:text-primary dark:border-primary dark:hover:bg-primary ' +
        'dark:hover:text-white'

    /**
     * Handler pour lancer le comptage suivant
     */
    const handleLaunchCounting = async () => {
        await showLaunchCountingModal()
    }

    /**
     * Handler pour la résolution en masse de tous les écarts
     *
     * ⚠️ IMPORTANT: Cette fonction NE MODIFIE PAS localement le statut 'resolved'
     * Elle appelle seulement l'API et recharge les données pour refléter l'état réel du serveur
     */
    const handleResolveAll = async () => {
        if (!inventoryId.value) {
            await alertService.warning({ text: 'Aucun inventaire sélectionné' })
            return
        }

        // Vérifier s'il y a des résultats non résolus
        const unresolvedResults = results.value.filter(result => !result.resolved)
        if (unresolvedResults.length === 0) {
            await alertService.info({ text: 'Tous les écarts sont déjà résolus' })
            return
        }

        // Confirmation
        const confirmation = await Swal.fire({
            title: 'Résoudre tous les écarts',
            html: `
                <div style="text-align: left; padding: 1rem 0;">
                    <p style="color: #6b7280; font-size: 0.95rem; margin-bottom: 1rem;">
                        Voulez-vous vraiment résoudre tous les écarts de comptage non résolus ?
                    </p>
                    <div style="background: #f9fafb; border-radius: 0.5rem; padding: 1rem; margin-top: 1rem;">
                        <div style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem;">Écarts à résoudre :</div>
                        <div style="font-size: 1.125rem; font-weight: 600; color: #1f2937;">${unresolvedResults.length}</div>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Résoudre tous',
            cancelButtonText: 'Annuler',
            confirmButtonColor: '#10B981',
            cancelButtonColor: '#FECD1C',
            customClass: {
                popup: 'sweet-alerts',
                confirmButton: 'btn btn-success',
                cancelButton: 'btn-cancel-primary'
            }
        })

        if (!confirmation.isConfirmed) {
            return
        }

        try {
            // Appeler l'API de résolution en masse
            // ⚠️ NE MODIFIE PAS le statut 'resolved' localement - laisse l'API décider
            const response = await resultsStore.bulkResolveEcarts(inventoryId.value)

            // Afficher le message de succès avec les détails
            const resolvedCount = response.data.data.resolved_count
            const totalCount = response.data.data.total_count

            await alertService.success({
                text: `${resolvedCount} écart(s) sur ${totalCount} résolu(s) avec succès`
            })

            // Recharger les résultats depuis le serveur pour refléter l'état réel
            // Le statut 'resolved' sera mis à jour selon ce que retourne l'API
            await reloadResults()
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message ||
                error?.message ||
                'Erreur lors de la résolution en masse des écarts'
            await alertService.error({ text: errorMessage })
        }
    }

    /**
     * Handler pour l'export des données de résultats
     */
    const handleExportResultsData = async () => {
        if (!inventoryId.value || !selectedStore.value) {
            alertService.warning({ text: 'ID d\'inventaire ou magasin non disponible' })
            return
        }

        try {
            exportResultsLoading.value = true
            showExportResultsModal.value = true
            exportResultsModalMessage.value = 'Préparation de l\'export...'

            // S'assurer que les warehouses sont chargés
            if (warehouses.value.length === 0 && !warehousesLoading.value) {
                exportResultsModalMessage.value = 'Chargement des magasins...'
                await warehouseStore.fetchWarehouses()
            }

            // Récupérer l'objet warehouse complet depuis l'ID stocké
            const warehouseId = parseInt(selectedStore.value)
            const warehouse = warehouses.value.find(w => w.id === warehouseId)

            if (!warehouse) {
                alertService.error({ text: 'Magasin non trouvé. Veuillez réessayer.' })
                return
            }

            logger.debug('Début de l\'export des données de résultats', {
                inventoryId: inventoryId.value,
                warehouseId: warehouse.id,
                warehouse: warehouse.reference
            })

            exportResultsModalMessage.value = 'Génération du fichier Excel...'

            // Appeler le service d'export
            const response = await InventoryResultsService.exportResultsData(
                inventoryId.value,
                warehouse.id
            )

            exportResultsModalMessage.value = 'Téléchargement du fichier...'

            // Créer le blob et le lien de téléchargement
            const blob = response.data as Blob
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url

            // Générer le nom du fichier avec timestamp
            const filename = generateExportFilename(
                'Resultats_Inventaire',
                `${inventoryReference.value || inventoryId.value}_${warehouse.reference || warehouse.id}`,
                'xlsx'
            )
            link.setAttribute('download', filename)

            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)

            alertService.success({ text: 'Export des données de résultats réussi' })

            logger.debug('Export des données de résultats réussi', { filename })

            // Fermer la modal après un court délai
            setTimeout(() => {
                showExportResultsModal.value = false
            }, 1000)

        } catch (error: any) {
            logger.error('Erreur lors de l\'export des données de résultats', error)
            const errorMessage = error?.response?.data?.message || error?.message || 'Erreur lors de l\'export des données de résultats'
            alertService.error({ text: errorMessage })
        } finally {
            exportResultsLoading.value = false
            // Fermer la modal en cas d'erreur
            if (showExportResultsModal.value) {
                showExportResultsModal.value = false
            }
        }
    }

    /**
     * Handler pour l'export des articles consolidés en Excel
     */
    const handleExportConsolidatedArticles = async () => {
        if (!inventoryId.value) {
            await alertService.warning({ text: 'Aucun inventaire sélectionné' })
            return
        }

        exportLoading.value = true

        try {
            // Afficher un loader
            const loadingSwal = Swal.fire({
                title: 'Export en cours...',
                text: 'Le fichier Excel est en cours de préparation. Veuillez patienter.',
                icon: 'info',
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading()
                }
            })

            // Appeler le service d'export
            const response = await InventoryResultsService.exportConsolidatedArticles(inventoryId.value)

            // Vérifier que la réponse contient un blob
            if (!response.data || !(response.data instanceof Blob)) {
                throw new Error('Aucune donnée reçue du backend')
            }

            // response.data est déjà un Blob quand responseType: 'blob' est utilisé
            const blob = response.data as Blob

            // Récupérer le type MIME depuis les headers ou utiliser un type par défaut
            const contentType = response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

            // Générer le nom du fichier
            const filename = generateExportFilename(
                'Articles_Consolides',
                String(inventoryReference.value || inventoryId.value),
                'xlsx'
            )

            // Télécharger le fichier
            downloadBlob(blob, filename)

            // Fermer le loader et afficher le succès
            await Swal.close()
            await alertService.success({
                text: 'Export Excel réussi'
            })

            logger.debug('Export des articles consolidés réussi', { filename })
        } catch (error: any) {
            logger.error('Erreur lors de l\'export des articles consolidés', error)

            // Extraire le message d'erreur
            const errorMessage = error?.response?.data?.message ||
                error?.message ||
                'Erreur lors de l\'export Excel'

            await Swal.close()
            await alertService.error({ text: errorMessage })
        } finally {
            exportLoading.value = false
        }
    }

    /**
     * Handler pour le changement de magasin
     */
    const onStoreChanged = async (value: string | number | string[] | number[] | null) => {
        if (!value) {
            return
        }

        const storeId = Array.isArray(value) ? value[0] : value
        await handleStoreSelect(String(storeId))
    }

    /**
     * Handler pour aller à la page de suivi des jobs
     * Utilise la référence de warehouse (si disponible) en plus de la référence d'inventaire
     */
    const handleGoToJobTracking = () => {
        if (!routerInstance || !inventoryReference.value) {
            return
        }

        // Par défaut : navigation uniquement par référence d'inventaire
        const baseNavigation: any = {
            name: 'inventory-job-tracking',
            params: { reference: inventoryReference.value }
        }

        // Si un magasin est sélectionné et que les warehouses sont chargés,
        // ajouter la référence du warehouse dans la query pour filtrer directement
        if (selectedStore.value && warehouses.value && warehouses.value.length > 0) {
            const warehouseId = parseInt(String(selectedStore.value))
            const warehouse = warehouses.value.find(w => w.id === warehouseId)

            if (warehouse) {
                const warehouseRef = warehouse.reference || warehouse.warehouse_name
                if (warehouseRef) {
                    baseNavigation.query = { warehouse: warehouseRef }
                }
            }
        }

        void routerInstance.push(baseNavigation)
    }

    /**
     * Configuration des boutons d'action
     */
    const actionButtons = computed<ButtonGroupButton[]>(() => {
        const buttons: ButtonGroupButton[] = []

        buttons.push({
            id: 'jobs',
            label: 'Suivi des jobs',
            icon: IconListCheck,
            variant: 'default',
            class: ACTION_BUTTON_CLASS,
            disabled: !inventoryReference.value,
            visible: !!inventoryReference.value,
            onClick: handleGoToJobTracking
        })

        buttons.push({
            id: 'launch-counting',
            label: 'Lancer comptage',
            icon: IconPlay,
            variant: 'default',
            class: ACTION_BUTTON_CLASS,
            disabled: !selectedStore.value,
            visible: !!selectedStore.value,
            onClick: () => { void handleLaunchCounting() }
        })

        buttons.push({
            id: 'resolve-all',
            label: 'Résoudre tous',
            icon: IconCheck,
            variant: 'success',
            class: ACTION_BUTTON_CLASS,
            disabled: !inventoryId.value || !selectedStore.value || loading.value,
            visible: !!inventoryId.value && !!selectedStore.value,
            onClick: () => { void handleResolveAll() }
        })

        buttons.push({
            id: 'export-consolidated',
            label: exportLoading.value ? 'Export...' : 'Exporter consolidé',
            icon: IconDownload,
            variant: 'default',
            class: ACTION_BUTTON_CLASS,
            disabled: !inventoryId.value || !selectedStore.value || exportLoading.value,
            visible: !!inventoryId.value && !!selectedStore.value,
            onClick: () => { void handleExportConsolidatedArticles() }
        })

        buttons.push({
            id: 'export-results',
            label: exportResultsLoading.value ? 'Export...' : 'Exporter résultats',
            icon: IconDownload,
            variant: 'default',
            class: ACTION_BUTTON_CLASS,
            disabled: !inventoryId.value || !selectedStore.value || exportResultsLoading.value,
            visible: !!inventoryId.value && !!selectedStore.value,
            onClick: () => { void handleExportResultsData() }
        })

        return buttons.filter(b => b.visible !== false)
    })

    // ===== RETURN =====

    /**
     * API exposée à la vue (InventoryResults.vue).
     * Regroupe : état (inventoryId, loading, …), données (results, stores, pagination), configuration
     * DataTable (columns, actions, resultsCustomParams), handlers (onResultsTableEvent, handleStoreSelect, …)
     * et refs (resultsTableRef, resultsTableKey). Voir le bloc return ci-dessous pour la liste complète.
     */
    return {
        // État
        inventoryId: computed(() => inventoryId.value),
        inventoryReference: computed(() => inventoryReference.value),
        isInitialized,
        loading,

        // Données
        results,
        stores: storeOptions,
        selectedStore,
        warehouses,
        warehousesLoading,
        usesWarehouseFallback,
        hasResults,

        // Store (exporté pour autoManagement si besoin)
        resultsStore,

        // Configuration DataTable
        columns,
        actions,
        pagination: resultsPaginationComputed,
        resultsTotalItems: computed(() => resultsPaginationMetadata.value?.total ?? 0),

        // Actions
        handleStoreSelect,
        handleBulkValidate,
        initialize,
        reinitialize,
        fetchStores,
        loadResults,
        refreshResults,
        reloadResults,

        // Handlers DataTable
        onResultsTableEvent,

        // Lancer comptage
        showLaunchCountingModal,
        analyserJobsPourComptageSuivant,

        // Alias pour compatibilité
        fetchInventoryByReference,
        initializeWithReference: initialize,
        reloadWithReference: reinitialize,

        // Pour la vue
        actionButtons,
        exportLoading,
        exportResultsLoading,
        showExportResultsModal,
        exportResultsModalMessage,
        handleLaunchCounting,
        handleResolveAll,
        handleExportConsolidatedArticles,
        onStoreChanged,
        handleGoToJobTracking,
        resultsLoadingLocal: computed(() => resultsLoadingLocal.value),
        resultsKey,
        resultsTableKey,
        resultsTableRef,
        resultsQueryModel: resultsQueryModelRef,
        resultsCustomParams
    }
}
