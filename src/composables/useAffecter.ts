/**
 * Composable useAffecter - Gestion des affectations de jobs
 *
 * Ce composable gère :
 * - L'affectation d'équipes aux jobs (1er et 2e comptage)
 * - L'affectation de ressources aux jobs
 * - Le transfert de jobs entre comptages
 * - L'édition inline des données dans le DataTable
 * - La pagination, le tri et le filtrage côté serveur avec format standard DataTable
 *
 * @module useAffecter
 */

// ===== IMPORTS VUE =====
import { ref, computed, onMounted, onUnmounted, watch, nextTick, shallowRef, reactive, markRaw, createApp, h } from 'vue'

// ===== IMPORTS ROUTER =====
import { useRoute, useRouter } from 'vue-router'

// ===== IMPORTS STORES =====
import { useJobStore } from '@/stores/job'
import { useResourceStore } from '@/stores/resource'
import { useWarehouseStore } from '@/stores/warehouse'
import { useInventoryStore } from '@/stores/inventory'
import { useSessionStore } from '@/stores/session'
import { storeToRefs } from 'pinia'

// ===== IMPORTS SERVICES =====
import { alertService } from '@/services/alertService'
import { logger } from '@/services/loggerService'
import { Validators } from '@/utils/validators'
import { JobService } from '@/services/jobService'

// ===== IMPORTS COMPOSANTS =====
import SelectField from '@/components/Form/SelectField.vue'

// ===== IMPORTS COMPOSABLES =====
import type { FieldConfig } from '@/interfaces/form'
import { Job } from '@/models/Job'
// Imports depuis le package @SMATCH-Digital-dev/vue-system-design (conforme à la documentation)
// Le package ré-exporte tout depuis l'index principal
import { useQueryModel, convertQueryModelToQueryParams, createQueryModelFromDataTableParams, mergeQueryModelWithCustomParams } from '@SMATCH-Digital-dev/vue-system-design'
import type { QueryModel, DataTableColumn, DataTableColumnAny, ActionConfig, ColumnDataType } from '@SMATCH-Digital-dev/vue-system-design'
import type { InventoryDetails } from '@/models/Inventory'
import type { ButtonGroupButton } from '@/components/Form/ButtonGroup.vue'
import type { Component } from 'vue'

// ===== CONSTANTES =====

// ===== IMPORTS ICÔNES =====
import IconEdit from '@/components/icon/icon-edit.vue'
import IconArrowForward from '@/components/icon/icon-arrow-forward.vue'
import IconCheck from '@/components/icon/icon-check.vue'
import IconCancel from '@/components/icon/icon-cancel.vue'
import IconCircleCheck from '@/components/icon/icon-circle-check.vue'
import IconEye from '@/components/icon/icon-eye.vue'
import IconListCheck from '@/components/icon/icon-list-check.vue'
import IconCalendar from '@/components/icon/icon-calendar.vue'
import IconBarChart from '@/components/icon/icon-bar-chart.vue'
import IconClock from '@/components/icon/icon-clock.vue'
import IconUsers from '@/components/icon/icon-users.vue'
import IconXCircle from '@/components/icon/icon-x-circle.vue'
import IconUpload from '@/components/icon/icon-upload.vue'
import IconTrash from '@/components/icon/icon-trash.vue'

// ===== IMPORTS COMPOSANTS =====
import Modal from '@/components/Modal.vue'

// ===== IMPORTS EXTERNES =====
import Swal from 'sweetalert2'


// ===== INITIALISATION DES STORES =====
const jobStore = useJobStore()
const resourceStore = useResourceStore()
const warehouseStore = useWarehouseStore()
const inventoryStore = useInventoryStore()
const sessionStore = useSessionStore()

// Utiliser storeToRefs pour accéder à paginationMetadata de manière réactive
const { paginationMetadata: jobPaginationMetadata } = storeToRefs(jobStore)

// Computed pour les métadonnées de pagination harmonisées avec usePlanning.ts
const jobPaginationMetadataComputed = computed(() => jobPaginationMetadata.value)

// ===== INTERFACES =====

/**
 * Représente un nœud de ligne dans le DataTable
 */
export interface RowNode {
    id: string
    job: string
    locations?: Array<{
        id?: number
        reference?: string
        location_reference?: string
        zone_name?: string
        sous_zone_name?: string
        zone?: { zone_name?: string }
        sous_zone?: { sous_zone_name?: string }
    }>
    team1: string
    team1Status?: string
    date1: string
    team2: string
    team2Status?: string
    date2: string
    resources: string
    resourcesList: string[]
    nbResources: number
    status: 'EN ATTENTE' | 'AFFECTE' | 'VALIDE' | 'TRANSFERT' | 'PRET' | 'ENTAME' | 'TERMINE' | 'CLOTURE'
    isChild?: boolean
    parentId?: string | null
    childType?: 'location' | 'resource'
    assignments?: Array<{
        counting_order: number
        status: string
        session?: { id: number; username: string }
        date_start?: string
    }>
}


/**
 * Action sur une ligne
 */
export interface RowAction {
    label: string
    onClick: (row: Record<string, unknown>) => void
}

// ===== FONCTIONS UTILITAIRES =====

/**
 * Extrait l'ID numérique d'un ID qui peut contenir le suffixe -idxX du DataTable
 * Le DataTable génère des IDs avec suffixe (ex: "132-idx0") pour garantir l'unicité
 * Cette fonction extrait la partie numérique avant le suffixe
 *
 * @param idWithSuffix - ID avec ou sans suffixe -idxX
 * @returns ID numérique sans suffixe
 */
const extractJobId = (idWithSuffix: string): string => {
    if (idWithSuffix.includes('-idx')) {
        return idWithSuffix.split('-idx')[0];
    }
    return idWithSuffix;
};

/**
 * Récupère l'ID de l'inventaire par sa référence
 *
 * @param reference - Référence de l'inventaire
 * @returns ID de l'inventaire ou null si non trouvé
 */
const fetchInventoryIdByReference = async (
    reference: string,
    options?: {
        onInventoryResolved?: (inventory: InventoryDetails | null) => void
    }
): Promise<number | null> => {
    try {
        // Utiliser fetchInventoryByReference qui récupère directement l'inventaire par référence
        const inventory = await inventoryStore.fetchInventoryByReference(reference)
        options?.onInventoryResolved?.(inventory ?? null)

        return inventory?.id || null
    } catch (error) {
        return null
    }
}

/**
 * Récupère l'ID de l'entrepôt par sa référence
 *
 * @param reference - Référence de l'entrepôt
 * @returns ID de l'entrepôt ou null si non trouvé
 */
const fetchWarehouseIdByReference = async (reference: string): Promise<number | null> => {
    try {
        // Utiliser directement l'API warehouse par référence
        const warehouseId = await warehouseStore.fetchWarehouseByReference(reference)

        if (warehouseId) {
            return warehouseId
        }

        return null
    } catch (error) {
        return null
    }
}

/**
 * Parse les dates depuis l'éditeur de cellule
 *
 * @param params - Paramètres de l'événement de changement de valeur
 * @returns Date formatée en ISO (YYYY-MM-DD) ou chaîne vide
 */
export const dateValueParser = (params: any) => {
    if (!params.newValue) return ''

    const newVal = params.newValue
    if (
        newVal !== null
        && typeof newVal === 'object'
        && Object.prototype.toString.call(newVal) === '[object Date]'
    ) {
        return (newVal as Date).toISOString().split('T')[0]
    }

    if (typeof params.newValue === 'string') {
        if (params.newValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return params.newValue
        }

        try {
            const date = new Date(params.newValue)
            return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0]
        } catch {
            return ''
        }
    }

    return ''
}

/**
 * Setter les valeurs de date dans les cellules
 *
 * @param params - Paramètres de l'événement de changement de valeur
 * @returns true si la valeur a été modifiée, false sinon
 */
export const dateValueSetter = (params: any) => {
    const rowData = params.data || (params.node && params.node.data) || params.value || {}
    if (!rowData || rowData.isChild) return false

    const parsedValue = dateValueParser(params)
    const field = params.colDef.field!
    const oldValue = rowData[field]

    if (parsedValue !== oldValue) {
        rowData[field] = parsedValue
        return true
    }

    return false
}

// ===== COMPOSABLE PRINCIPAL =====

/**
 * Composable pour la gestion des affectations
 *
 * @param options - Options optionnelles avec inventoryReference et warehouseReference
 * @returns Objet contenant toutes les propriétés et méthodes nécessaires
 */
export function useAffecter(options?: { inventoryReference?: string; warehouseReference?: string }) {
    const route = useRoute()
    const router = useRouter()

    // ===== RÉFÉRENCES =====

    /** Référence de l'inventaire (priorité aux options, sinon fallback sur la route) */
    const inventoryReference = options?.inventoryReference || (route.params.reference as string) || ''

    /** Référence de l'entrepôt (priorité aux options, sinon fallback sur la route) */
    const warehouseReference = options?.warehouseReference || (route.params.warehouse as string) || ''

    // ===== ÉTAT RÉACTIF =====

    /** ID de l'inventaire récupéré depuis la référence */
    const inventoryId = ref<number | null>(null)

    /** ID de l'entrepôt récupéré depuis la référence */
    const warehouseId = ref<number | null>(null)

    /** IDs des jobs sélectionnés dans le DataTable */
    const selectedJobs = ref<string[]>([])


    /**
     * Fonction helper pour obtenir les RowNode sélectionnés à partir des IDs
     * ⚠️ IMPORTANT : Les IDs sélectionnés peuvent contenir le suffixe -idxX du DataTable
     * Il faut extraire l'ID numérique avant la comparaison
     */
    const getSelectedRowNodes = (): RowNode[] => {
        const selectedIds = selectedJobs.value
        if (selectedIds.length === 0) return []

        // Nettoyer tous les IDs sélectionnés (enlever le suffixe -idxX)
        const cleanSelectedIds = selectedIds.map(extractJobId);

        // Filtrer les rows en comparant avec les IDs nettoyés
        return displayData.value.filter(row => {
            const rowId = row.id?.toString() || '';
            return cleanSelectedIds.includes(rowId) && !row.isChild;
        })
    }

    /** Modifications en attente de sauvegarde (Map<jobId, Map<field, value>>) */
    const pendingChanges = ref<Map<string, Map<string, any>>>(new Map())

    /** Indique s'il y a des modifications non sauvegardées */
    const hasUnsavedChanges = computed(() => pendingChanges.value.size > 0)

    /** État des modales */
    const showTeamModal = ref(false)
    const showResourceModal = ref(false)
    const showTransferModal = ref(false)
    const showManualModal = ref(false)
    const showJobAffectationModal = ref(false)
    /** Indique qu'une affectation est en cours de sauvegarde (pour feedback visuel dans le dialog) */
    const assignmentSavingInModal = ref(false)

    /** Type d'équipe en cours d'affectation */
    const currentTeamType = ref<'premier' | 'deuxieme'>('premier')

    /** Formulaires */
    const teamForm = ref<Record<string, unknown>>({ team: '', date: '' })
    const resourceForm = ref({ resources: [] })
    const transferForm = ref({ comptages: [] })
    const manualForm = ref({ comptages: [] })

    /** Titre de la modale d'équipe */
    const modalTitle = computed(() => `Affecter ${currentTeamType.value === 'premier' ? 'Premier' : 'Deuxième'} Comptage`)

    /** Job sélectionné pour la modal d'affectation */
    const selectedJobForModal = ref<any>(null)

    /** Options d'équipes pour la modal d'affectation (chargées dynamiquement) */
    const modalTeamOptions = ref<Array<{ value: string; label: string }>>([])

    /** Options d'équipes par comptage pour la modal */
    const modalTeamOptionsByCountingOrder = ref<Record<number, Array<{ value: string; label: string }>>>({})

    // ===== HANDLERS DATATABLE =====

    /** Cache du dernier QueryModel pour éviter les appels redondants */
    let lastExecutedQueryModel: QueryModel | null = null

    /** File d'attente des événements DataTable pendant l'initialisation */
    const pendingEventsQueue: Array<{ eventType: string; queryModel: QueryModel }> = []

    /**
     * Traite un événement DataTable directement (sans vérification d'initialisation)
     *
     * ⚡ SIMPLIFIÉ : Le DataTable gère déjà la validation et la fusion des customParams.
     * Ce handler appelle simplement le store avec le QueryModel fourni.
     */
    const processEventDirectly = async (eventType: string, queryModel: QueryModel) => {
        // ⚡ GARDE : Vérifier que queryModel est valide
        if (!queryModel || typeof queryModel !== 'object') {
            return
        }

        // S'assurer que le QueryModel a des valeurs par défaut valides
        const sanitizedQueryModel: QueryModel = {
            page: queryModel.page ?? 1,
            pageSize: queryModel.pageSize ?? 50,
            sort: queryModel.sort ?? [],
            filters: queryModel.filters ?? {},
            search: queryModel.search ?? '',
            customParams: queryModel.customParams ?? {}
        }

        // ⚡ CONFORME À LA DOC : Le DataTable du package fusionne automatiquement les customParams
        // dans le QueryModel émis via @query-model-changed (voir DOCUMENTATION_DATATABLE.md)
        // Utiliser directement le QueryModel fourni (customParams déjà fusionnés)
        const finalQueryModel = sanitizedQueryModel

        // Éviter les appels API inutiles en comparant avec le dernier appel réussi
        const queryModelStr = JSON.stringify(finalQueryModel)
        const lastQueryModelStr = lastExecutedQueryModel ? JSON.stringify(lastExecutedQueryModel) : null

            if (queryModelStr === lastQueryModelStr) {
            return
        }

        // Éviter les appels API inutiles pour les événements de filtre/recherche vides
        // MAIS permettre le premier chargement même avec un événement "vide"
        if (eventType === 'filter' || eventType === 'search') {
            const hasFilters = Object.keys(finalQueryModel.filters || {}).length > 0
            const hasSearch = !!finalQueryModel.search?.trim()
            const hasSorting = (finalQueryModel.sort || []).length > 0

            // Si c'est un événement filter/search complètement vide (pas de filtres, pas de recherche, pas de tri),
            // et que c'est la page 1, vérifier si c'est vraiment le premier chargement
            if (!hasFilters && !hasSearch && !hasSorting && finalQueryModel.page === 1) {
                // Permettre le premier chargement si aucune donnée n'a encore été chargée
                if (lastExecutedQueryModel) {
                    return
                }
                // Sinon, continuer pour permettre le premier chargement
            }
        }

        try {
            // Activer le loading pour tous les événements qui modifient les données
                jobsLoadingLocal.value = true

            // Mettre à jour le QueryModel local pour synchroniser avec la DataTable
            jobsQueryModelRef.value = { ...finalQueryModel }

            await jobStore.fetchJobsValidated(inventoryId.value!, warehouseId.value!, finalQueryModel)

            // Mettre à jour les données transformées pour s'assurer que la table se met à jour
            updateDisplayData()

            // Mettre à jour le cache après un appel réussi
            lastExecutedQueryModel = { ...finalQueryModel }

            // Forcer le re-rendu de la DataTable
                jobsKey.value++
                jobsLoadingLocal.value = false
        } catch (error) {
            console.error('[useAffecter] ❌ Error in jobStore.fetchJobsValidated:', {
                eventType,
                error: error,
                queryModel: finalQueryModel
            })
            await alertService.error({ text: 'Erreur lors du chargement des jobs' })
            // Désactiver le loading en cas d'erreur
            jobsLoadingLocal.value = false
        }
    }

    /**
     * Handler unifié pour toutes les opérations de la DataTable Jobs
     */
    const onJobsTableEvent = async (eventType: string, queryModel: QueryModel) => {
        // Si l'initialisation n'est pas terminée, mettre l'événement en file d'attente
        // Ces événements sont souvent déclenchés automatiquement par le DataTable au montage
        // quand il restaure son état sauvegardé
        if (!isInitialized.value) {
            pendingEventsQueue.push({ eventType, queryModel })
            return
        }

        // Traiter l'événement directement
        await processEventDirectly(eventType, queryModel)
    }


    /**
     * Paramètres personnalisés pour les jobs
     */
    const jobsCustomParams = computed(() => ({
        inventory_id: inventoryId.value,
        warehouse_id: warehouseId.value
    }))

    // ===== RÉFÉRENCES COMPOSANTS =====

    /** Référence au composant DataTable des jobs */
    const jobsTableRef = ref<any>(null)

    /** Clé pour forcer le re-render des tables (harmonisé avec usePlanning.ts) */
    const jobsKey = ref(0)

    /** Référence au dropdown d'actions */
    const dropdownRef = ref<HTMLElement | null>(null)

    /** État d'ouverture du dropdown */
    const showDropdown = ref(false)

    /** Statut de l'inventaire */
    const inventoryStatus = ref<string>('')

    /** État de chargement local */
    const jobsLoadingLocal = ref(false)

    /**
     * Initialise les IDs depuis les références
     */
    /**
     * Initialise les IDs d'inventaire et d'entrepôt depuis les références
     * ⚠️ IMPORTANT : Cette fonction doit être appelée AVANT de charger les jobs
     *
     * Ordre d'exécution :
     * 1. Charger l'ID de l'inventaire
     * 2. Charger l'ID de l'entrepôt
     * 3. Attendre que les deux soient résolus
     */
    const initializeIdsFromReferences = async () => {
        // Paralléliser les appels pour améliorer les performances
        const promises: Promise<any>[] = []

        if (inventoryReference) {
            promises.push(
                fetchInventoryIdByReference(inventoryReference, {
                    onInventoryResolved: (inventory) => {
                        if (inventory?.status) {
                            inventoryStatus.value = inventory.status
                        }
                    }
                }).then(id => {
                    if (id && id > 0) {
                        inventoryId.value = id
                    } else {
                        inventoryId.value = null
                        throw new Error(`ID d'inventaire invalide pour la référence: ${inventoryReference}`)
                    }
                }).catch(error => {
                    inventoryId.value = null
                    throw error
                })
            )
        } else {
            throw new Error('Référence d\'inventaire manquante')
        }

        if (warehouseReference) {
            promises.push(
                fetchWarehouseIdByReference(warehouseReference).then(id => {
                    if (id && id > 0) {
                        warehouseId.value = id
                    } else {
                        warehouseId.value = null
                        throw new Error(`ID d'entrepôt invalide pour la référence: ${warehouseReference}`)
                    }
                }).catch(error => {
                    warehouseId.value = null
                    throw error
                })
            )
        } else {
            throw new Error('Référence d\'entrepôt manquante')
        }

        // Attendre que les deux IDs soient résolus
        await Promise.all(promises)

        // Vérification finale que les IDs sont valides
        if (!inventoryId.value || !warehouseId.value || inventoryId.value <= 0 || warehouseId.value <= 0) {
            throw new Error(`Échec de l'initialisation des IDs - Inventaire: ${inventoryId.value}, Entrepôt: ${warehouseId.value}`)
        }
    }

    /**
     * Force la réinitialisation des IDs depuis les références
     */
    const refreshIdsFromReferences = async () => {
        inventoryId.value = null
        warehouseId.value = null
        await initializeIdsFromReferences()
    }

    /**
     * Récupère le statut de l'inventaire
     */
    const fetchInventoryStatus = async () => {
        try {
            const inventory = await inventoryStore.fetchInventoryByReference(inventoryReference)
            if (inventory?.status) {
                inventoryStatus.value = inventory.status
            }
        } catch (error) {
        }
    }

    /**
     * Initialise le composable DataTable
     * Retourne true si l'initialisation a réussi, false sinon
     */
    const initializeDataTable = async (): Promise<boolean> => {
        if (inventoryId.value && warehouseId.value) {
            await loadJobs()
            return true
        }

        return false
    }

    /**
     * Initialise les stores nécessaires
     */
    async function initializeStores() {
        try {
            // Paralléliser les appels pour améliorer les performances
            const promises: Promise<any>[] = []

            if (resourceStore.getResources.length === 0) {
                promises.push(resourceStore.fetchResources())
            }

            if (warehouseStore.warehouses.length === 0) {
                promises.push(warehouseStore.fetchWarehouses())
            }



            // Exécuter tous les appels en parallèle
            await Promise.all(promises)
        } catch (error) {
            alertService.error({
                text: 'Erreur lors du chargement des données. Veuillez rafraîchir la page.'
            })
        }
    }


    // ===== WATCHERS =====

    /**
     * Flag pour éviter les doubles chargements
     */
    const isInitialized = ref(false)
    const isInitializing = ref(false)
    const isJobOperationInProgress = ref(false)

    /** Timestamps pour throttling des handlers */
    let lastJobOperationTime = 0
    const HANDLER_THROTTLE_MS = 100 // Minimum 100ms entre les appels

    /** Flags pour éviter les boucles infinies lors de la réinitialisation des sélections */
    let isResettingSelections = false
    let isInitialMount = true


    /**
     * Watcher pour surveiller les changements de sélection
     * Réinitialise les DataTables quand les sélections passent de non-vides à vides
     */
    watch(
        () => [selectedJobs.value.length],
        ([jobsLength], [oldJobsLength]) => {
            // Ignorer le premier déclenchement au montage
            if (isInitialMount) {
                isInitialMount = false
                return
            }

            // Éviter les boucles infinies
            if (isResettingSelections) return

            // Si les sélections passent de non-vides à vides, réinitialiser aussi les DataTables
            if (jobsLength === 0 && oldJobsLength > 0) {
                isResettingSelections = true
                resetDataTableSelections()
                setTimeout(() => {
                    isResettingSelections = false
                }, 100)
            }
        },
        { immediate: false }
    )

    // Pas de watcher - updateDisplayData est appelé directement dans loadJobs

    /**
     * Watch pour réinitialiser le composable quand les IDs changent
     * Utilise { immediate: false } pour éviter le double chargement lors de l'initialisation
     */
    watch([inventoryId, warehouseId], async ([newInventoryId, newWarehouseId], [oldInventoryId, oldWarehouseId]) => {
        if (!newInventoryId || !newWarehouseId) {
            return
        }

        if (newInventoryId === oldInventoryId && newWarehouseId === oldWarehouseId) {
            return
        }

        if (isInitializing.value) {
            return
        }

        isInitializing.value = true
        try {
            await loadJobs()
        } finally {
            isInitializing.value = false
        }
    }, { immediate: false })

    // ===== HANDLERS DATATABLE =====



    /**
     * Mettre à jour la pagination des jobs depuis le store
     * Fonction conservée pour compatibilité mais utilise maintenant jobPaginationMetadata directement
     */
    const updateJobsPagination = () => {
        // Plus besoin de synchronisation manuelle - tout est géré par les computed properties
    }

     /**
     * Handler pour les changements de sélection des jobs
     *
     * @param selectedRows - Set des IDs de lignes sélectionnées
     */
     const onJobSelectionChanged = (selectedRows: Set<string>) => {
        selectedJobs.value = selectedRows ? Array.from(selectedRows) : []
    }

    // ===== COMPUTED PROPERTIES =====



    /**
     * Pagination calculée pour les jobs (optimisé avec shallowRef)
     * ⚠️ Utilise UNIQUEMENT les valeurs retournées par le backend via paginationMetadata du store
     * Le backend retourne { rows, page, pageSize, total, totalPages }
     * Conforme à PAGINATION_FRONTEND.md
     */
    const jobsPaginationComputed = shallowRef({
        current_page: 1,
        total_pages: 1,
        has_next: false,
        has_previous: false,
        page_size: 50,
        total: 0
    })

    // Watcher pour mettre à jour la pagination calculée
    watch([jobPaginationMetadata], () => {
        // Utiliser directement les valeurs du backend depuis paginationMetadata du store
        const storeMetadata = jobPaginationMetadata.value
        const currentPageValue = storeMetadata?.page ?? 1
        const pageSizeValue = storeMetadata?.pageSize ?? 50

        // Récupérer total depuis paginationMetadata (valeur du backend)
        const totalValue = storeMetadata?.total ?? 0
        let totalPagesValue = storeMetadata?.totalPages ?? 1

        // Recalculer si totalPages est invalide
        if (totalPagesValue === 0 || totalPagesValue === undefined || totalPagesValue === null) {
            if (totalValue > 0 && pageSizeValue > 0) {
                totalPagesValue = Math.max(1, Math.ceil(totalValue / pageSizeValue))
            } else {
                totalPagesValue = 1
            }
        }

        jobsPaginationComputed.value = {
            current_page: currentPageValue,
            total_pages: totalPagesValue,
            has_next: totalPagesValue > 0 ? currentPageValue < totalPagesValue : false,
            has_previous: currentPageValue > 1,
            page_size: pageSizeValue,
            total: totalValue
        }
    }, { immediate: true })

    // Watchers optimisés pour les paginations

    /**
     * Récupère les options d'équipes pour un counting_order spécifique
     * Utilise le service SessionService et le store session pour la gestion centralisée
     */
    const getTeamOptionsForCountingOrder = async (countingOrder: number) => {
        try {
            // Utiliser fetchMobileUsersForCountingOrder pour récupérer les utilisateurs mobiles spécifiques au counting_order
            const users = await sessionStore.fetchMobileUsersForCountingOrder(countingOrder)

            return users.map((user: any) => ({
                value: user.id.toString(),
                label: user.username || user.name || `User ${user.id}`
            }))
        } catch (error) {
            logger.error(`Erreur lors de la récupération des utilisateurs pour le comptage ${countingOrder}:`, error)
            // Plus de fallback - retourner une liste vide en cas d'erreur
            return []
        }
    }

    /**
     * Options des équipes (sessions) pour les selects (fallback)
     */
    const teamOptions = computed(() => {
        const sessions = sessionStore.getAllSessions
        return sessions.map(session => ({
            value: session.id.toString(),
            label: session.username
        }))
    })



    /**
     * Options des ressources pour les filtres et selects
     */
    const resourceOptions = computed(() => {
        const resources = resourceStore.getResources

        // Ne pas appeler fetchResources dans un computed - utiliser un watcher ou onMounted à la place
        // Si les ressources sont vides, elles seront chargées par initializeStores()
        if (resources.length === 0) {
            return []
        }

        const options = resources.map(resource => ({
            value: resource.id?.toString() || resource.reference,
            label: resource.ressource_nom || resource.reference || `Ressource ${resource.reference}`
        }))
        return options
    })


    /**
     * Transforme les locations d'un job
     */
    const transformLocations = (jobId: string | number, emplacements: any[]): any[] => {
        // Transformer les locations
        const locations: any[] = []
        for (let i = 0, len = emplacements.length; i < len; i++) {
            const loc = emplacements[i]
            locations.push({
                id: loc.id,
                reference: loc.reference,
                location_reference: loc.reference,
                zone_name: loc.zone?.zone_name || loc.sous_zone?.zone_name || 'N/A',
                sous_zone_name: loc.sous_zone?.sous_zone_name || 'N/A',
                zone: loc.zone,
                sous_zone: loc.sous_zone
            })
        }

        return locations
    }

    /**
     * Transforme un job en RowNode
     * ⚠️ OPTIMISATION CRITIQUE : Les locations NE SONT PAS transformées ici !
     * Elles sont conservées brutes et transformées UNIQUEMENT lors de l'expansion de la nested table
     */
    const transformJobToRowNode = (parentRow: any): RowNode => {
        // Transformer le job
        const premierAssignment = (parentRow as any).assignments?.find((a: any) => a.counting_order === 1)
        const deuxiemeAssignment = (parentRow as any).assignments?.find((a: any) => a.counting_order === 2)

        const ressourcesList = ((parentRow as any).ressources || []).map((r: any) => r.reference)
        const ressourcesString = ressourcesList.length > 0 ? ressourcesList.join(', ') : ''

        const team1Name = premierAssignment?.session?.username || premierAssignment?.session?.id?.toString() || ''
        const team2Name = deuxiemeAssignment?.session?.username || deuxiemeAssignment?.session?.id?.toString() || ''

        // Déduire le statut des équipes basé sur les assignments ou le statut du job
        const team1Status = premierAssignment?.status || parentRow.status || ''
        const team2Status = deuxiemeAssignment?.status || parentRow.status || ''

        // ⚠️ OPTIMISATION : Garder les emplacements BRUTS (pas de transformation)
        // Ils seront transformés UNIQUEMENT quand la nested table sera expandée
        const locations = (parentRow as any).emplacements || (parentRow as any).locations || []

        const rowNode: RowNode = {
            id: String(parentRow.id),
            job: parentRow.reference || `Job ${parentRow.id}`,
            locations,  // ⚠️ Emplacements bruts, pas transformés
            team1: team1Name,
            team1Status,
            date1: premierAssignment?.date_start || '',
            team2: team2Name,
            team2Status,
            date2: deuxiemeAssignment?.date_start || '',
            resourcesList: ressourcesList,
            resources: ressourcesString,
            nbResources: ressourcesList.length,
            status: parentRow.status,
            isChild: false,
            parentId: null,
            assignments: (parentRow as any).assignments || []  // Ajouter les assignments complets
        }

        return rowNode
    }

    /**
     * Obtient les locations transformées pour un job (avec lazy loading)
     * Cette fonction est appelée UNIQUEMENT quand la nested table est expandée
     */
    const getTransformedLocations = (jobId: string | number, rawLocations: any[]): any[] => {
        return transformLocations(jobId, rawLocations)
    }

    /**
     * Transforme les jobs en lignes compatibles DataTable
     */
    const mapJobsToRows = (jobs: any[] | undefined | null): RowNode[] => {
        if (!jobs || jobs.length === 0) {
            return []
        }

        // Transformer tous les jobs
        const result: RowNode[] = []
        for (let i = 0; i < jobs.length; i++) {
            result[i] = transformJobToRowNode(jobs[i])
        }

        return result
    }

    // ===== DONNÉES JOBS (HARMONISÉ AVEC usePlanning.ts) =====

    /**
     * Données jobs brutes du store (pour compatibilité)
     */
    const jobsDataRaw = computed(() => jobStore.jobs || [])

    /**
     * Données jobs transformées (comme dans usePlanning.ts)
     */
    const jobs = computed(() => displayData.value)

    /**
     * Données transformées (optimisé avec shallowRef pour éviter les re-calculs excessifs)
     */
    const displayData = shallowRef<RowNode[]>([])

    /**
     * Met à jour les données transformées de manière optimisée
     * Pour les gros volumes (>100 éléments), utilise un traitement par chunks pour éviter de bloquer le thread
     */
    const updateDisplayData = () => {
        const jobs = jobsDataRaw.value
        if (!jobs || jobs.length === 0) {
            displayData.value = []
                return
        }

        // Transformer tous les jobs
        displayData.value = mapJobsToRows(jobs)
    }


    // Les données sont mises à jour manuellement après chaque appel fetchJobs
    // pour éviter les problèmes de réactivité avec les watchers

    // ===== COLONNES ADAPTÉES (HARMONISATION AVEC usePlanning.ts) =====

    /**
     * Colonnes jobs adaptées (alias pour compatibilité avec usePlanning.ts)
     */
    const adaptedStoreJobsColumns = computed(() => jobsColumns.value)

    /**
     * Vérifie si un job est éligible au transfert basé sur son statut
     * Puisque nous n'avons pas les assignments détaillés, on se base sur le statut du job
     *
     * @param jobId - ID du job (peut contenir le suffixe -idxX du DataTable)
     * @returns true si le job est éligible au transfert
     */
    const hasTransferableAssignment = (jobId: string): boolean => {
        // ⚠️ IMPORTANT : Extraire l'ID numérique si le jobId contient le suffixe -idxX
        const cleanJobId = extractJobId(jobId);

        // Récupérer les données du job depuis displayData (RowNode)
        const job = displayData.value.find(j => {
            const rowId = j.id?.toString() || '';
            return rowId === cleanJobId;
        });
        if (!job) return false

        // Les jobs avec statut TRANSFERT, PRET ou ENTAME sont éligibles
        return job.status === 'TRANSFERT' || job.status === 'PRET' || job.status === 'ENTAME'
    }

    /**
     * Jobs éligibles au transfert
     * - Jobs avec statut TRANSFERT ou PRET
     * - Jobs avec statut ENTAME (tous les jobs ENTAME sont acceptés, peu importe l'assignment)
     */
    const eligibleJobsForTransfer = computed(() => {
        const selectedNodes = getSelectedRowNodes()
        return selectedNodes.filter(job => {
            // Jobs avec statut TRANSFERT, PRET ou ENTAME sont toujours éligibles
            // Pour ENTAME, on accepte tous les jobs ENTAME sans vérifier l'assignment
            return job.status === 'TRANSFERT' || job.status === 'PRET' || job.status === 'ENTAME'
        })
    })

    /**
     * Jobs éligibles pour l'action manuelle
     * - Jobs avec statut PRET, TRANSFERT ou ENTAME
     */
    const eligibleJobsForManual = computed(() => {
        const selectedNodes = getSelectedRowNodes()
        return selectedNodes.filter(job => {
            return job.status === 'PRET' || job.status === 'TRANSFERT' || job.status === 'ENTAME'
        })
    })

    /**
     * Afficher le bouton de transfert si l'inventaire est en réalisation
     */
    const showTransferButton = computed(() => {

        return inventoryStatus.value === 'EN REALISATION'
    })

    /**
     * Afficher le bouton Manuel si l'inventaire est en réalisation
     */
    const showManualButton = computed(() => {
        return inventoryStatus.value === 'EN PREPARATION'
    })

    /**
     * Afficher le bouton prêt si l'inventaire est en préparation
     */
    const showReadyButton = computed(() => {
        return inventoryStatus.value === 'EN PREPARATION'
    })


    /**
     * Classe CSS commune pour les boutons d'action
     */
    const ACTION_BUTTON_CLASS =
        'bg-white text-primary border border-primary hover:bg-primary hover:text-white ' +
        'dark:bg-slate-900 dark:text-primary dark:border-primary dark:hover:bg-primary ' +
        'dark:hover:text-white transition-all duration-200'

    /**
     * Boutons de navigation pour le header
     * Permet de naviguer vers les différentes pages liées à l'inventaire
     */
    const navigationButtons = computed<ButtonGroupButton[]>(() => {
        const buttons: ButtonGroupButton[] = []

        // Bouton Détail de l'inventaire
        buttons.push({
            id: 'inventory-detail',
            label: 'Détail',
            icon: IconEye as Component,
            variant: 'default',
            class: ACTION_BUTTON_CLASS,
            visible: !!inventoryReference,
            onClick: () => { handleGoToInventoryDetail() }
        })

        // Bouton Résultats
        buttons.push({
            id: 'results',
            label: 'Résultats',
            icon: IconBarChart as Component,
            variant: 'default',
            class: ACTION_BUTTON_CLASS,
            visible: !!inventoryReference,
            onClick: () => { handleGoToResults() }
        })

        // Bouton Suivi des jobs
        buttons.push({
            id: 'job-tracking',
            label: 'Suivi des jobs',
            icon: IconClock as Component,
            variant: 'default',
            class: ACTION_BUTTON_CLASS,
            visible: !!inventoryReference,
            onClick: () => { handleGoToJobTracking() }
        })

        // Bouton Planning
        buttons.push({
            id: 'planning',
            label: 'Planning',
            icon: IconCalendar as Component,
            variant: 'default',
            class: ACTION_BUTTON_CLASS,
            visible: !!inventoryReference && !!warehouseReference,
            onClick: () => { handleGoToAffectation() }
        })

        return buttons.filter(b => b.visible !== false)
    })

    /**
     * Boutons d'action pour le ButtonGroup
     * ⚠️ Note: Le dropdown "Affecter" reste séparé car c'est un dropdown, pas un simple bouton
     *
     * CONDITIONS DE VISIBILITÉ :
     *
     * === EN PREPARATION ===
     * 1. Bouton "Affecter tous"
     *    - visible: inventoryStatus === 'EN PREPARATION'
     *    - Action: Affecte automatiquement tous les jobs depuis les location-jobs
     *
     * 2. Bouton "Pret"
     *    - visible: inventoryStatus === 'EN PREPARATION'
     *    - Action: Met les jobs sélectionnés en statut "Prêt"
     *
 * === EN REALISATION ===
     * 4. Bouton "Manuel"
     *    - visible: inventoryStatus === 'EN PREPARATION' (actuellement)
     *    - Action: Lance manuellement les jobs sélectionnés
     *
     * 5. Bouton "Transférer"
     *    - visible: inventoryStatus === 'EN REALISATION'
     *    - Action: Transfère les jobs sélectionnés entre comptages
     *
     * 6. Bouton "Transférer tous"
     *    - visible: inventoryStatus === 'EN REALISATION'
     *    - Action: Transfère tous les jobs éligibles entre comptages
     *
     * 7. Bouton "Sauvegarder"
     *    - visible: inventoryStatus === 'EN REALISATION'
     *    - disabled: Si hasUnsavedChanges === false (pas de modifications en attente)
     *    - Action: Sauvegarde toutes les modifications en attente
     *
 * 8. Bouton "Clôturer"
 *    - visible: inventoryStatus === 'EN REALISATION'
 *    - Action: Clôture l'inventaire
 *
 * DEBUG: Pour vérifier pourquoi les boutons ne s'affichent pas :
 * - inventoryStatus actuel: ${inventoryStatus.value}
 * - showManualButton: ${showManualButton.value}
 * - showTransferButton: ${showTransferButton.value}
 * - showReadyButton: ${showReadyButton.value}
     */
    const actionButtons = computed<ButtonGroupButton[]>(() => {
        const buttons: ButtonGroupButton[] = []
        const pendingChangesCount = Array.from(pendingChanges.value.values()).reduce((total, changes) => total + changes.size, 0)


        // Bouton Affecter tous
        // Condition: inventoryStatus === 'EN PREPARATION'
        buttons.push({
            id: 'affect-all',
            label: 'Affecter tous',
            icon: IconUsers as Component,
            variant: 'default',
            class: ACTION_BUTTON_CLASS,
            visible: showReadyButton.value, // inventoryStatus === 'EN PREPARATION'
            onClick: () => { void handleAffectAll() }
        })

        // Bouton Manuel
        // Condition: inventoryStatus === 'EN REALISATION'
        buttons.push({
            id: 'manual',
            label: 'Manuel',
            icon: IconEdit as Component,
            variant: 'default',
            class: ACTION_BUTTON_CLASS,
            visible: showManualButton.value, // inventoryStatus === 'EN REALISATION'
            onClick: () => { void handleManualClick() }
        })

        // Bouton Transférer
        // Condition: inventoryStatus === 'EN REALISATION'
        buttons.push({
            id: 'transfer',
            label: 'Transférer',
            icon: IconArrowForward as Component,
            variant: 'default',
            class: ACTION_BUTTON_CLASS,
            visible: showTransferButton.value, // inventoryStatus === 'EN REALISATION'
            onClick: () => { void handleTransferClick() }
        })

        // Bouton Transférer tous
        // Condition: inventoryStatus === 'EN REALISATION'
        buttons.push({
            id: 'transfer-all',
            label: 'Transférer tous',
            icon: IconArrowForward as Component,
            variant: 'default',
            class: ACTION_BUTTON_CLASS,
            visible: showTransferButton.value, // inventoryStatus === 'EN REALISATION'
            onClick: () => { void handleTransferAllBulk() }
        })


        // Bouton Valider tous
        // Condition: inventoryStatus === 'EN REALISATION'
        buttons.push({
            id: 'validate-all',
            label: 'Valider tous',
            icon: IconCheck as Component,
            variant: 'success',
            class: ACTION_BUTTON_CLASS,
            visible: showTransferButton.value, // inventoryStatus === 'EN REALISATION'
            onClick: () => { void handleValidateAllJobs() }
        })

        // Bouton Clôturer
        // Condition: inventoryStatus === 'EN REALISATION'
        buttons.push({
            id: 'close',
            label: 'Clôturer',
            icon: IconXCircle as Component,
            variant: 'default',
            class: ACTION_BUTTON_CLASS,
            visible: showTransferButton.value, // inventoryStatus === 'EN REALISATION'
            onClick: () => { void handleCloturerClick() }
        })

        // Bouton Pret
        // Condition: inventoryStatus === 'EN PREPARATION'
        buttons.push({
            id: 'ready',
            label: 'Pret',
            icon: IconCircleCheck as Component,
            variant: 'default',
            class: ACTION_BUTTON_CLASS,
            visible: showReadyButton.value, // inventoryStatus === 'EN PREPARATION'
            onClick: () => { void handleReadyClick() }
        })

        // Bouton Prêt tous
        // Condition: inventoryStatus === 'EN PREPARATION'
        buttons.push({
            id: 'ready-all',
            label: 'Prêt tous',
            icon: IconCircleCheck as Component,
            variant: 'default',
            class: ACTION_BUTTON_CLASS,
            visible: showReadyButton.value, // inventoryStatus === 'EN PREPARATION'
            onClick: () => { void handleReadyAll() }
        })


        const filteredButtons = buttons.filter(b => b.visible !== false)

        return filteredButtons
    })

    // ===== CONFIGURATION DES FORMULAIRES =====

    /**
     * Champs du formulaire d'affectation d'équipe
     */
    const teamFields = computed((): FieldConfig[] => [
        {
            key: 'team',
            label: 'Équipe',
            type: 'select',
            searchable: true,
            options: teamOptions.value,
            validators: [{ fn: v => !!v, msg: 'Équipe requise' }]
        },
        {
            key: 'date',
            label: 'Date',
            type: 'date',
            validators: [{ fn: v => !!v, msg: 'Date requise' }]
        }
    ])

    /**
     * Champs du formulaire d'affectation de ressources
     */
    const resourceFields = computed((): FieldConfig[] => [
        {
            key: 'resources',
            label: 'Ressources',
            type: 'select',
            options: resourceOptions.value,
            multiple: true,
            searchable: true,
            clearable: true,
            props: {
                placeholder: 'Sélectionnez une ou plusieurs ressources'
            },
            validators: [{
                fn: v => {
                    return Array.isArray(v) && v.length > 0
                },
                msg: 'Sélectionnez au moins une ressource'
            }]
        }
    ])

    /**
     * Champs du formulaire de transfert
     */
    const transferFields: FieldConfig[] = [
        {
            key: 'comptages',
            label: 'Sélectionner le(s) comptage(s) à transférer',
            type: 'button-group',
            options: [
                { value: 'premier', label: '1er Comptage' },
                { value: 'deuxieme', label: '2e Comptage' }
            ],
            multiple: true
        }
    ]

    /**
     * Champs du formulaire d'action manuelle
     */
    const manualFields: FieldConfig[] = [
        {
            key: 'comptages',
            label: 'Sélectionner le(s) comptage(s) à lancer manuellement',
            type: 'button-group',
            options: [
                { value: 'premier', label: '1er Comptage' },
                { value: 'deuxieme', label: '2e Comptage' }
            ],
            multiple: true
        }
    ]

    /**
     * CellRenderer pour la colonne Job avec badges de statut
     */
    const jobCellRenderer = ((paramsOrValue: any, column?: any, row?: any) => {
        let rowData: RowNode | null = null

        if (row && typeof row === 'object' && column) {
            rowData = row as RowNode
        } else if (paramsOrValue && typeof paramsOrValue === 'object') {
            if (paramsOrValue.data) {
                rowData = paramsOrValue.data as RowNode
            } else {
                rowData = paramsOrValue as RowNode
            }
        }

        if (!rowData) {
            return '-'
        }

        const reference = rowData.job || '-'
        const status = rowData.status || ''

        if (!status) {
            return `<span class="font-medium text-slate-900">${reference}</span>`
        }

        const badgeStyles = column?.badgeStyles as Array<{value: string, class: string}> | undefined
        const badgeDefaultClass = (column?.badgeDefaultClass as string) || 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset'

        const badgeStyle = badgeStyles?.find((s: any) => s.value === status)
        const badgeClass = badgeStyle?.class || badgeDefaultClass

        return `<span class="${badgeClass}">${reference}</span>`
    }) as any

    /**
     * CellRenderer pour la colonne Équipe 1er Comptage
     */
    const team1CellRenderer = ((paramsOrValue: any, column?: any, row?: any) => {
        let rowData: RowNode | null = null

        if (row && typeof row === 'object' && column) {
            rowData = row as RowNode
        } else if (paramsOrValue && typeof paramsOrValue === 'object') {
            if (paramsOrValue.data) {
                rowData = paramsOrValue.data as RowNode
            } else {
                rowData = paramsOrValue as RowNode
            }
        }

        if (!rowData) {
            return '-'
        }

        const teamName = rowData.team1 || ''

        if (!teamName) {
            return '-'
        }

        const badgeStyles = column?.badgeStyles as Array<{value: string, class: string}> | undefined
        const badgeDefaultClass = (column?.badgeDefaultClass as string) || 'inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800 ring-1 ring-blue-600/20 ring-inset'

        // Utiliser le statut réel de l'équipe pour déterminer le style du badge
        const teamStatus = rowData.team1Status || ''
        const badgeStyle = badgeStyles?.find((s: any) => s.value === teamStatus)
        const badgeClass = badgeStyle?.class || badgeDefaultClass

        return `<span class="${badgeClass}">${teamName}</span>`
    }) as any

    /**
     * CellRenderer pour la colonne Équipe 2e Comptage
     */
    const team2CellRenderer =((paramsOrValue: any, column?: any, row?: any) => {
        let rowData: RowNode | null = null

        if (row && typeof row === 'object' && column) {
            rowData = row as RowNode
        } else if (paramsOrValue && typeof paramsOrValue === 'object') {
            if (paramsOrValue.data) {
                rowData = paramsOrValue.data as RowNode
            } else {
                rowData = paramsOrValue as RowNode
            }
        }

        if (!rowData) {
            return '-'
        }

        const teamName = rowData.team2 || ''

        if (!teamName) {
            return '-'
        }

        const badgeStyles = column?.badgeStyles as Array<{value: string, class: string}> | undefined
        const badgeDefaultClass = (column?.badgeDefaultClass as string) || 'inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-800 ring-1 ring-green-600/20 ring-inset'

        // Utiliser le statut réel de l'équipe pour déterminer le style du badge
        const teamStatus = rowData.team2Status || ''
        const badgeStyle = badgeStyles?.find((s: any) => s.value === teamStatus)
        const badgeClass = badgeStyle?.class || badgeDefaultClass

        return `<span class="${badgeClass}">${teamName}</span>`
    }) as any

    /**
     * Détermine le nombre maximum de counting_order dans les données
     */
    const getMaxCountingOrder = (): number => {
        let maxOrder = 2 // Minimum 2 pour team1 et team2
        const allCountingOrders: number[] = []

        for (const job of jobsDataRaw.value) {
            const jobAssignments = (job as any).assignments
            if (jobAssignments && Array.isArray(jobAssignments)) {
                for (const assignment of jobAssignments) {
                    if (assignment.counting_order !== null && assignment.counting_order !== undefined) {
                        const order = Number(assignment.counting_order)
                        allCountingOrders.push(order)
                        if (order > maxOrder) {
                            maxOrder = order
                        }
                    }
                }
            }
        }

        // DEBUG temporaire
        console.log('🔍 getMaxCountingOrder:', {
            maxOrder,
            jobsCount: jobsDataRaw.value.length,
            allCountingOrders,
            uniqueOrders: [...new Set(allCountingOrders)],
            jobsDataRaw: jobsDataRaw.value.map(job => ({
                id: job.id,
                reference: job.reference,
                assignments: (job as any).assignments?.map((a: any) => ({
                    counting_order: a.counting_order,
                    status: a.status
                }))
            }))
        })

        return maxOrder
    }

    /**
     * Configuration des colonnes pour la DataTable des jobs
     */
    // Helper : récupère tous les counting_order uniques présents dans les données
    const getAvailableCountingOrders = (): number[] => {
        if (!jobsDataRaw.value.length) {
            return [1, 2] // Par défaut, afficher au moins 1er et 2ème comptage
        }

        const ordersSet = new Set<number>()
        jobsDataRaw.value.forEach(job => {
            const jobAssignments = (job as any).assignments
            if (jobAssignments && Array.isArray(jobAssignments)) {
                jobAssignments.forEach((assignment: any) => {
                    // Inclure tous les counting_order, même ceux avec status null (pour les colonnes futures)
                    if (assignment.counting_order !== null && assignment.counting_order !== undefined) {
                        ordersSet.add(Number(assignment.counting_order))
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

    // Helper : retourne le label pour un ordre de comptage (1er, 2ème, 3ème, Nème)
    const getCountingOrderLabel = (order: number): string => {
        if (order === 1) return '1er comptage'
        if (order === 2) return '2ème comptage'
        if (order === 3) return '3ème comptage'
        return `${order}ème comptage`
    }

    const jobsColumns = computed<DataTableColumnAny[]>(() => {
        const cols: DataTableColumnAny[] = []

        // Colonne principale : Job avec badge de statut (style useAffecter.ts)
        cols.push({
            headerName: 'Job',
            field: 'job',
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
            badgeStyles: [
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
                    value: 'ENTAME',
                    class: 'inline-flex items-center rounded-md bg-blue-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-blue-600/20 ring-inset'
                },
                {
                    value: 'TERMINE',
                    class: 'inline-flex items-center rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white ring-1 ring-green-700/20 ring-inset'
                },
                {
                    value: 'CLOTURE',
                    class: 'inline-flex items-center rounded-md bg-slate-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-slate-600/20 ring-inset'
                }
            ],
            badgeDefaultClass: 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset',
            allowWrap: true,
            cellRenderer: ((paramsOrValue: any, column?: any, row?: any) => {
                let rowData: RowNode | null = null

                if (row && typeof row === 'object' && column) {
                    rowData = row as RowNode
                } else if (paramsOrValue && typeof paramsOrValue === 'object') {
                    if (paramsOrValue.data) {
                        rowData = paramsOrValue.data as RowNode
                    } else {
                        rowData = paramsOrValue as RowNode
                    }
                }

                if (!rowData) {
                    return '-'
                }

                const reference = rowData.job || '-'
                const status = rowData.status || ''

                if (!status) {
                    return `<span class="font-medium text-slate-900">${reference}</span>`
                }

                const badgeStyle = column?.badgeStyles.find((s: any) => s.value === status)
                const badgeClass = badgeStyle?.class || column?.badgeDefaultClass || 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset'

                return `<span class="${badgeClass}">${reference}</span>`
            }) as any,
            filterConfig: {
                dataType: 'select' as const,
                operator: 'equals' as const,
                options: [
                    { label: 'EN ATTENTE', value: 'EN ATTENTE' },
                    { label: 'VALIDE', value: 'VALIDE' },
                    { label: 'AFFECTE', value: 'AFFECTE' },
                    { label: 'PRET', value: 'PRET' },
                    { label: 'TRANSFERT', value: 'TRANSFERT' },
                    { label: 'ENTAME', value: 'ENTAME' },
                    { label: 'TERMINE', value: 'TERMINE' },
                    { label: 'CLOTURE', value: 'CLOTURE' }
                ]
            }
        })

        // Colonne Emplacements
        cols.push({
            headerName: 'Emplacements',
            field: 'locations',
            sortable: false,
            dataType: 'text' as ColumnDataType,
            filterable: false,
            width: 200,
            editable: false,
            visible: true,
            draggable: true,
            autoSize: true,
            icon: 'icon-map-pin',
            description: 'Emplacements du job',
            nestedData: {
                key: 'locations',
                displayKey: 'location_reference',
                countSuffix: 'emplacements',
                expandable: true,
                showCount: true,
                title: 'Emplacements du job',
                columns: [
                    {
                        field: 'reference',
                        headerName: 'Référence',
                        sortable: true,
                        filterable: true,
                        width: 150
                    },
                    {
                        field: 'zone_name',
                        headerName: 'Zone',
                        sortable: true,
                        filterable: true,
                        width: 150
                    },
                    {
                        field: 'sous_zone_name',
                        headerName: 'Sous-zone',
                        sortable: true,
                        filterable: true,
                        width: 150
                    }
                ]
            }
        })

        // Colonnes dynamiques par comptage : Session + Statut (badge)
        // Utiliser les counting_order disponibles dans les données pour créer les colonnes dynamiquement
        const availableOrders = getAvailableCountingOrders()

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
                badgeStyles: [
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
                        value: 'ENTAME',
                        class: 'inline-flex items-center rounded-md bg-blue-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-blue-600/20 ring-inset'
                    },
                    {
                        value: 'TERMINE',
                        class: 'inline-flex items-center rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white ring-1 ring-green-700/20 ring-inset'
                    },
                    {
                        value: 'CLOTURE',
                        class: 'inline-flex items-center rounded-md bg-slate-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-slate-600/20 ring-inset'
                    }
                ],
                badgeDefaultClass: 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset',
                cellRenderer: ((paramsOrValue: any, column?: any, row?: any) => {
                    let rowData: RowNode | null = null

                    if (row && typeof row === 'object' && column) {
                        rowData = row as RowNode
                    } else if (paramsOrValue && typeof paramsOrValue === 'object') {
                        if (paramsOrValue.data) {
                            rowData = paramsOrValue.data as RowNode
                        } else {
                            rowData = paramsOrValue as RowNode
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

                    const badgeStyle = column?.badgeStyles.find((s: any) => s.value === status)
                    const badgeClass = badgeStyle?.class || column?.badgeDefaultClass || 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset'

                    return `<span class="${badgeClass}">${sessionLabel}</span>`
                }) as any,
                filterConfig: {
                    dataType: 'select' as const,
                    operator: 'equals' as const,
                    options: [
                        { label: 'EN ATTENTE', value: 'EN ATTENTE' },
                        { label: 'VALIDE', value: 'VALIDE' },
                        { label: 'AFFECTE', value: 'AFFECTE' },
                        { label: 'PRET', value: 'PRET' },
                        { label: 'TRANSFERT', value: 'TRANSFERT' },
                        { label: 'ENTAME', value: 'ENTAME' },
                        { label: 'TERMINE', value: 'TERMINE' },
                        { label: 'CLOTURE', value: 'CLOTURE' }
                    ]
                }
            })
        })

        return cols
    })

    // ===== QUERYMODEL POUR JOBS =====

    /**
     * QueryModel pour gérer les requêtes Jobs
     * Le DataTable utilise UNIQUEMENT QueryModel comme format standard
     */
    const {
        queryModel: jobsQueryModelRef,
        updatePagination: updateJobsQueryPagination,
        updateSort: updateJobsQuerySort,
        updateFilter: updateJobsQueryFilter,
        updateGlobalSearch: updateJobsQueryGlobalSearch
    } = useQueryModel({
        columns: jobsColumns.value as any
    })

    /**
     * Configuration des actions disponibles pour chaque job dans la DataTable
     */
    const jobsActions: ActionConfig<Job>[] = [
        {
            label: 'Valider',
            icon: markRaw(IconCheck),
            color: 'success',
            onClick: async (job: Job) => {
                try {
                    const result = await alertService.confirm({
                        title: 'Confirmer la validation',
                        text: `Voulez-vous vraiment valider le job "${job.reference}" ?`
                    })

                    if (result.isConfirmed) {
                        await jobStore.validateJob([job.id])
                        await alertService.success({ text: 'Job validé avec succès' })
                        resetAllSelections()
                        // Rafraîchir les données complètes (jobs + locations)
                        await refreshJobs()
                    }
                } catch (error) {
                    await alertService.error({ text: 'Erreur lors de la validation du job' })
                }
            },
            show: (job: Job) => job.status === 'EN ATTENTE'
        },
        {
            label: 'Supprimer',
            icon: markRaw(IconTrash),
            color: 'danger',
            onClick: async (job: Job) => {
                try {
                    const result = await alertService.confirm({
                        title: 'Confirmer la suppression',
                        text: `Voulez-vous vraiment supprimer le job "${job.reference}" ?`
                    })

                    if (result.isConfirmed) {
                        await jobStore.deleteJob([job.id])
                        await alertService.success({ text: 'Job supprimé avec succès' })
                        resetAllSelections()
                        await refreshJobs()
                    }
                } catch (error) {
                    await alertService.error({ text: 'Erreur lors de la suppression du job' })
                }
            },
            show: () => true
        }
    ]

    const resolvedJobsActions = computed(() => jobsActions)

    /**
     * Charger les jobs avec les paramètres donnés
     *
     * Le DataTable utilise UNIQUEMENT QueryModel comme format standard.
     * Tous les paramètres de requête sont au format QueryModel.
     *
     * @param params - Paramètres de requête au format QueryModel
     */
    const loadJobs = async (params?: QueryModel) => {
        if (!inventoryId.value || !warehouseId.value) {
            return
        }

        // Activer le loading
        jobsLoadingLocal.value = true

        try {
            // Si params est fourni, utiliser directement (déjà fusionné avec customParams par mergeQueryModelWithCustomParams)
            // Sinon, construire un QueryModel par défaut (le DataTable restaurera son état automatiquement)
            const finalParams: QueryModel = params || mergeQueryModelWithCustomParams(
                {
                    page: 1,
                    pageSize: 50
                },
                jobsCustomParams.value
            )


            await jobStore.fetchJobsValidated(inventoryId.value, warehouseId.value, finalParams)
            await nextTick()

            // Mettre à jour le cache après un appel réussi
            lastExecutedQueryModel = { ...finalParams }

            // Transformer les données
            updateDisplayData()

            // Forcer le re-rendu du DataTable (surtout pour le package qui peut ne pas réagir à rowDataProp)
            jobsKey.value++

            // Désactiver le loading
            jobsLoadingLocal.value = false
        } catch (error) {
            console.error('[useAffecter.loadJobs] ❌ Error during job load:', error)
            await alertService.error({ text: 'Erreur lors du chargement des jobs' })
            // Désactiver le loading même en cas d'erreur
            jobsLoadingLocal.value = false
        } finally {
            // Le loading est déjà désactivé dans try/catch
        }
    }

    /**
     * Rafraîchir les jobs
     *
     * @param params - Paramètres de requête optionnels au format QueryModel
     */
    const refreshJobs = async (params?: QueryModel) => {
        // Utiliser l'état courant du DataTable si aucun params fourni
        const queryToUse: QueryModel | undefined = params ?? (jobsQueryModelRef.value
            ? mergeQueryModelWithCustomParams({ ...jobsQueryModelRef.value }, jobsCustomParams.value)
            : lastExecutedQueryModel ?? undefined)

        await loadJobs(queryToUse)

        // Forcer le re-rendu du DataTable après le chargement des données
        jobsKey.value++
    }

    // ===== GESTION DES MODIFICATIONS =====

    /**
     * Ajoute une modification en attente
     *
     * @param jobId - ID du job
     * @param field - Champ modifié
     * @param value - Nouvelle valeur
     */
    function addPendingChange(jobId: string, field: string, value: any) {
        if (!pendingChanges.value.has(jobId)) {
            pendingChanges.value.set(jobId, new Map())
        }
        pendingChanges.value.get(jobId)!.set(field, value)
    }


    /**
     * Sauvegarde automatique d'une seule affectation d'équipe
     */
    async function saveSingleAssignment(inventoryId: number, assignmentData: {
        job_id: number;
        team: number;
        counting_order: number;
        complete: boolean;
    }) {
        try {
            // TEST : Afficher les valeurs dans la console au lieu d'exécuter l'action
            // Utiliser le nouveau service pour l'affectation automatique
            await jobStore.assignTeamToJobAuto(assignmentData);

            // Commenté pour le test
            // await jobStore.assignTeamToJobAuto(assignmentData);

            // Simulation de succès
            logger.debug('TEST - Affectation simulée:', assignmentData);
        } catch (error) {
            logger.error('Erreur lors de la sauvegarde automatique:', error);
            throw error;
        }
    }

    /**
     * Réinitialise toutes les modifications en attente
     * Cette fonction annule toutes les modifications non sauvegardées et restaure les valeurs originales
     */
    async function resetAllChanges() {
        if (pendingChanges.value.size === 0) {
            alertService.info({ text: 'Aucune modification à réinitialiser.' })
            return
        }

        const changesCount = Array.from(pendingChanges.value.values()).reduce((total, changes) => total + changes.size, 0)

        // Vider toutes les modifications en attente
        pendingChanges.value.clear()

        alertService.success({
            text: `${changesCount} modification(s) réinitialisée(s). Les valeurs originales ont été restaurées.`
        })

        // Rafraîchir les données pour restaurer les valeurs originales
        await refreshJobs()
    }

    // ===== HANDLERS DATATABLE EVENTS =====

    /**
     * Handler pour les changements de valeur de cellule
     *
     * @param event - Événement contenant data, field et newValue
     */
    function onCellValueChanged(event: any) {
        const { data, field, newValue } = event
        if (!data || data.isChild || !field) return

        let isValid = true
        let errorMessage = ''

        switch (field) {
            case 'team1':
            case 'team2':
                const validTeams = sessionStore.getAllSessions.map(session => session.username)
                if (newValue && !validTeams.includes(newValue)) {
                    isValid = false
                    errorMessage = 'Équipe invalide'
                }
                break

            case 'status':
                if (newValue && !['AFFECTE', 'VALIDE', 'PRET', 'TRANSFERT', 'ENTAME'].includes(newValue)) {
                    isValid = false
                    errorMessage = 'Statut invalide'
                }
                break

            case 'date1':
            case 'date2':
                if (newValue) {
                    const date = new Date(newValue)
                    if (isNaN(date.getTime())) {
                        isValid = false
                        errorMessage = 'Date invalide'
                    }
                }
                break

            case 'resources':
                if (newValue && Array.isArray(newValue)) {
                    const validResourceIds = resourceStore.getResources
                        .filter(resource => resource && resource.id !== undefined && resource.id !== null)
                        .map(r => r.id!.toString())
                    const validResourceReferences = resourceStore.getResources
                        .filter(resource => resource && resource.reference)
                        .map(r => r.reference)
                    const allValidValues = [...validResourceIds, ...validResourceReferences]
                    const invalidResources = newValue.filter(resource => !allValidValues.includes(resource))
                    if (invalidResources.length > 0) {
                        isValid = false
                        errorMessage = `Ressources invalides: ${invalidResources.join(', ')}`
                    }
                }
                break
        }

        if (!isValid) {
            alertService.error({
                title: 'Erreur de validation',
                text: errorMessage
            })
            return
        }

        addPendingChange(data.id, field, newValue)
    }


    /**
     * Handler pour le clic sur une ligne du DataTable
     * Ouvre la modal JobAffectationModal pour l'affectation et réaffectation
     */
    async function onRowClicked(jobId: string) {
        try {
            // ⚠️ IMPORTANT : Le DataTable génère des IDs avec suffixe -idxX (ex: "132-idx0")
            // Il faut extraire l'ID numérique avant la comparaison
            const cleanJobId = extractJobId(jobId);

            // Trouver le job correspondant à l'ID (comparer avec l'ID nettoyé)
            const selectedJob: any = jobs.value.find((job: any) => {
                const jobRowId = job.id?.toString() || job.reference || `job-${job.id}`;
                // Comparer avec l'ID nettoyé (sans suffixe -idxX)
                return jobRowId === cleanJobId;
            });

            if (!selectedJob) {
                logger.warn(`Job non trouvé pour l'ID: ${jobId} (ID nettoyé: ${cleanJobId})`);
                alertService.error({ text: 'Job introuvable' });
                return;
            }

            logger.debug('Clic sur ligne détecté pour job:', selectedJob.reference || selectedJob.id);

            // Charger les options d'équipes pour tous les counting_orders du job (exclure les null)
            const assignments = selectedJob.assignments || [];
            const countingOrders = assignments
                .map((a: any) => a.counting_order)
                .filter((order: number | null) => order !== null && order !== undefined);

            // Ajouter les counting_orders par défaut si aucun assignment
            if (countingOrders.length === 0) {
                countingOrders.push(1, 2);
            }

            // Charger les options pour chaque counting_order (options séparées par comptage)
            const optionsPromises = countingOrders.map((order: number) =>
                getTeamOptionsForCountingOrder(order).then(options => ({ countingOrder: order, options }))
            );
            const optionsResults = await Promise.all(optionsPromises);

            // Créer un objet avec les options par comptage (pas de fusion)
            const optionsByCountingOrder: Record<number, Array<{ value: string; label: string }>> = {};
            optionsResults.forEach(({ countingOrder, options }) => {
                optionsByCountingOrder[countingOrder] = options;
            });

            // Mettre à jour les options par comptage
            modalTeamOptionsByCountingOrder.value = { ...optionsByCountingOrder };


            // Ouvrir la modal JobAffectationModal APRÈS avoir chargé les options
            selectedJobForModal.value = selectedJob;
            showJobAffectationModal.value = true;

        } catch (error) {
            logger.error('Erreur lors du clic sur la ligne:', error);
            alertService.error({ text: 'Erreur lors de l\'affichage des options d\'affectation' });
        }
    }

    /**
     * Handler pour les changements d'équipe dans JobAffectationModal
     */
    const handleJobAffectationModalTeamChanged = async (countingOrder: number, teamId: string, assignmentType?: 'complet' | 'partiel') => {
        if (!selectedJobForModal.value) return

        assignmentSavingInModal.value = true
        try {
            // Déterminer si l'affectation est complète selon le choix de l'utilisateur
            // Par défaut : partiel (complete: false)
            const isComplete = assignmentType === 'complet'

            await saveSingleAssignment(inventoryId.value!, {
                job_id: selectedJobForModal.value.id,
                team: parseInt(teamId),
                counting_order: countingOrder,
                complete: isComplete
            })

            // Logique métier selon le type d'affectation
            if (isComplete) {
                // Affectation COMPLÈTE
                // - Le job peut être considéré comme entièrement affecté pour ce counting_order
                // - Possibilité de mettre à jour le statut du job ou de l'assignment
                logger.debug(`Affectation complète effectuée pour le job ${selectedJobForModal.value.id}, counting_order ${countingOrder}`)
            } else {
                // Affectation PARTIELLE
                // - Le job reste en cours d'affectation
                // - Permet d'autres modifications ou ajouts
                logger.debug(`Affectation partielle effectuée pour le job ${selectedJobForModal.value.id}, counting_order ${countingOrder}`)
            }

            // Mettre à jour les données du job dans la modal
            const assignmentIndex = selectedJobForModal.value.assignments?.findIndex((a: any) => a.counting_order === countingOrder)
            if (assignmentIndex !== undefined && assignmentIndex >= 0) {
                const session = sessionStore.getAllSessions.find(s => s.id.toString() === teamId)
                if (session) {
                    selectedJobForModal.value.assignments[assignmentIndex].session = session
                }
            }

            // Rafraîchir les données du DataTable (conserver page/filtres, forcer rechargement)
            await refreshJobs(lastExecutedQueryModel ?? undefined)

            // Mettre à jour le job dans la modal avec les données rechargées (feedback visuel)
            const jobIdStr = String(selectedJobForModal.value.id)
            const updatedRow = displayData.value.find((j: RowNode) => extractJobId(j.id) === jobIdStr)
            if (updatedRow) {
                selectedJobForModal.value = updatedRow
            }
        } catch (error) {
            logger.error('Erreur lors du changement d\'équipe:', error)
            alertService.error({ text: 'Erreur lors de l\'assignation de l\'équipe' })
        } finally {
            assignmentSavingInModal.value = false
        }
    }

    /**
     * Handler pour la fin de l'affectation dans JobAffectationModal
     */
    const handleJobAffectationModalFinish = async () => {
        showJobAffectationModal.value = false
        selectedJobForModal.value = null

        // Recharger le DataTable (même page/filtres) et forcer la mise à jour visuelle
        await refreshJobs(lastExecutedQueryModel ?? undefined)
        await nextTick()
        resetDataTableSelections()
    }

    /**
     * Réinitialise toutes les sélections (jobs)
     * Appelée après chaque action (validation, affectation, etc.)
     */
    const resetAllSelections = () => {
        selectedJobs.value = []
    }

    /**
     * Réinitialise les sélections dans les DataTables via les refs
     * Appelée après certaines actions pour synchroniser l'état visuel
     */
    const resetDataTableSelections = () => {
        nextTick(() => {
            if (jobsTableRef.value) {
                jobsTableRef.value.resetAllSelections()
            }
        })
    }

    // ===== GESTION DU DROPDOWN =====

    /**
     * Bascule l'état d'ouverture du dropdown
     */
    const toggleDropdown = () => {
        showDropdown.value = !showDropdown.value
    }

    /**
     * Focus sur le premier élément du dropdown
     */
    const focusFirstItem = () => {
        if (dropdownRef.value) {
            const firstItem = dropdownRef.value.querySelector('button')
            if (firstItem) {
                (firstItem as HTMLElement).focus()
            }
        }
    }

    /**
     * Ferme le dropdown
     */
    const closeDropdown = () => {
        showDropdown.value = false
    }

    /**
     * Focus sur l'élément suivant du dropdown
     */
    const focusNextItem = () => {
        if (dropdownRef.value) {
            const currentActive = dropdownRef.value.querySelector('.focus-visible')
            const nextButton = currentActive?.nextElementSibling?.querySelector('button')
            if (nextButton) {
                (nextButton as HTMLElement).focus()
            }
        }
    }

    /**
     * Focus sur l'élément précédent du dropdown
     */
    const focusPrevItem = () => {
        if (dropdownRef.value) {
            const currentActive = dropdownRef.value.querySelector('.focus-visible')
            const prevButton = currentActive?.previousElementSibling?.querySelector('button')
            if (prevButton) {
                (prevButton as HTMLElement).focus()
            }
        }
    }

    /**
     * Références des éléments du dropdown (pour la navigation au clavier)
     */
    const setDropdownItemRef = (el: HTMLElement, index: number) => {
        // Fonction pour les références du dropdown
    }

    /**
     * Items du dropdown d'actions
     */
    const dropdownItems = ref([
        { label: 'Affecter 1er Comptage', icon: 'premier', action: handleAffecterPremierComptageClick },
        { label: 'Affecter 2e Comptage', icon: 'deuxieme', action: handleAffecterDeuxiemeComptageClick },
        { label: 'Affecter Ressources', icon: 'ressources', action: handleActionRessourceClick },
    ])

    // ===== HANDLERS D'ACTIONS =====

    /**
     * Handler pour l'affectation du premier comptage
     */
    function handleAffecterPremierComptageClick() {
        const selectedRowNodes = getSelectedRowNodes()
        if (!selectedRowNodes.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' })
            return
        }

        // Filtrer les jobs éligibles (TRANSFERT, PRET, AFFECTE)
        const validStatuses = ['TRANSFERT', 'PRET', 'AFFECTE','VALIDE']
        const eligibleJobs = selectedRowNodes.filter(job => validStatuses.includes(job.status))
        const ineligibleJobs = selectedRowNodes.filter(job => !validStatuses.includes(job.status))

        if (eligibleJobs.length === 0) {
            alertService.warning({
                text: 'Aucun job éligible. Seuls les jobs en statut VALIDE, AFFECTE, PRET ou TRANSFERT peuvent recevoir une affectation d\'équipe.'
            })
            return
        }

        if (ineligibleJobs.length > 0) {
            alertService.info({
                text: `${eligibleJobs.length} job(s) éligible(s). ${ineligibleJobs.length} job(s) ne sont pas éligibles (statuts: ${ineligibleJobs.map(j => j.status).join(', ')})`
            })
        }

        // Utiliser uniquement les jobs éligibles
        selectedJobs.value = eligibleJobs.map(job => job.id)
        currentTeamType.value = 'premier'
        showTeamModal.value = true
        showDropdown.value = false
    }

    /**
     * Handler pour l'affectation du deuxième comptage
     */
    function handleAffecterDeuxiemeComptageClick() {
        const selectedRowNodes = getSelectedRowNodes()
        if (!selectedRowNodes.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' })
            return
        }

        // Filtrer les jobs éligibles (TRANSFERT, PRET, AFFECTE)
        const validStatuses = ['TRANSFERT', 'PRET', 'AFFECTE']
        const eligibleJobs = selectedRowNodes.filter(job => validStatuses.includes(job.status))
        const ineligibleJobs = selectedRowNodes.filter(job => !validStatuses.includes(job.status))

        if (eligibleJobs.length === 0) {
            alertService.warning({
                text: 'Aucun job éligible. Seuls les jobs en statut TRANSFERT, PRET ou AFFECTE peuvent recevoir une affectation d\'équipe.'
            })
            return
        }

        if (ineligibleJobs.length > 0) {
            alertService.info({
                text: `${eligibleJobs.length} job(s) éligible(s). ${ineligibleJobs.length} job(s) ne sont pas éligibles (statuts: ${ineligibleJobs.map(j => j.status).join(', ')})`
            })
        }

        // Utiliser uniquement les jobs éligibles
        selectedJobs.value = eligibleJobs.map(job => job.id)
        currentTeamType.value = 'deuxieme'
        showTeamModal.value = true
        showDropdown.value = false
    }

    /**
     * Handler pour l'affectation de ressources
     */
    function handleActionRessourceClick() {
        const selectedRowNodes = getSelectedRowNodes()
        if (!selectedRowNodes.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' })
            return
        }

        // Filtrer les jobs éligibles (TRANSFERT, PRET, AFFECTE)
        const validStatuses = ['TRANSFERT', 'PRET', 'AFFECTE']
        const eligibleJobs = selectedRowNodes.filter(job => validStatuses.includes(job.status))
        const ineligibleJobs = selectedRowNodes.filter(job => !validStatuses.includes(job.status))

        if (eligibleJobs.length === 0) {
            alertService.warning({
                text: 'Aucun job éligible. Seuls les jobs en statut TRANSFERT, PRET ou AFFECTE peuvent recevoir une affectation de ressources.'
            })
            return
        }

        if (ineligibleJobs.length > 0) {
            alertService.info({
                text: `${eligibleJobs.length} job(s) éligible(s). ${ineligibleJobs.length} job(s) ne sont pas éligibles (statuts: ${ineligibleJobs.map(j => j.status).join(', ')})`
            })
        }

        // Utiliser uniquement les jobs éligibles
        selectedJobs.value = eligibleJobs.map(job => job.id)
        showResourceModal.value = true
        showDropdown.value = false
    }

    /**
     * Handler pour la validation (désactivée pour l'instant)
     */
    async function handleValiderClick() {
        const selectedRowNodes = getSelectedRowNodes()
        if (!selectedRowNodes.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' })
            return
        }
        alertService.info({ text: 'La fonction de validation est désactivée pour l\'instant.' })

        // Réinitialiser la sélection après la validation
        await resetAllSelections()

        await refreshJobs()
    }

    /**
     * Handler pour mettre les jobs en statut "Prêt"
     */
    async function handleReadyClick() {
        const selectedRowNodes = getSelectedRowNodes()
        if (!selectedRowNodes.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' })
            return
        }

        // Vérifier que tous les jobs sélectionnés ont le statut "AFFECTE" ou "VALIDE"
        const jobsWithInvalidStatus = selectedRowNodes.filter(row => row.status !== 'AFFECTE' && row.status !== 'VALIDE')

        if (jobsWithInvalidStatus.length > 0) {
            const jobIds = jobsWithInvalidStatus.map(row => row.job || row.id.toString()).join(', ')
            alertService.warning({
                text: `Seuls les jobs avec le statut "AFFECTE" peuvent être mis en statut "Prêt". Les jobs suivants ne sont pas affectés : ${jobIds}`
            })
            return
        }

        try {
            const jobIds: number[] = selectedRowNodes.map(r => parseInt(r.id))


            await jobStore.jobReady(jobIds)
            alertService.success({ text: `${jobIds.length} job(s) mis en statut 'Prêt' avec succès !` })

            // Réinitialiser la sélection après la mise en statut "Prêt"
            await resetAllSelections()

            await refreshJobs()
        } catch (error) {
            // Extraire et afficher le message d'erreur backend
            const errorMessage = Validators.extractBackendError(error, 'Erreur lors de la mise en statut "Prêt" des jobs')
            alertService.error({ text: errorMessage })
        }
    }

    /**
     * Handler pour mettre tous les jobs éligibles en statut "Prêt"
     */
    async function handleReadyAll() {
        try {
            const result = await alertService.confirm({
                title: 'Mettre tous les jobs en "Prêt"',
                text: `Voulez-vous mettre tous les jobs en statut "Prêt" ?`
            })

            if (result.isConfirmed) {
                // Vérifier que les IDs requis sont disponibles
                if (!inventoryId.value || !warehouseId.value) {
                    alertService.error({
                        text: 'IDs d\'inventaire ou d\'entrepôt non disponibles'
                    })
            return
        }


                const response = await jobStore.setReady(inventoryId.value, warehouseId.value)
                alertService.success({ text: response.message })

                // Réinitialiser la sélection après l'action
                resetAllSelections()

                await refreshJobs(lastExecutedQueryModel ?? undefined)
            }
        } catch (error) {
            // Extraire et afficher le message d'erreur backend
            const errorMessage = Validators.extractBackendError(error, 'Erreur lors de la mise en statut "Prêt" de tous les jobs')
            alertService.error({ text: errorMessage })
        }
    }

    /**
     * Handler pour transférer tous les jobs éligibles (sans modal)
     */
    async function handleTransferAllBulk() {
        try {
            const result = await alertService.confirm({
                title: 'Transférer tous les jobs',
                text: `Voulez-vous transférer tous les jobs éligibles ?`
            })

            if (result.isConfirmed) {
                // Vérifier que les IDs requis sont disponibles
                if (!inventoryId.value || !warehouseId.value) {
                    alertService.error({
                        text: 'IDs d\'inventaire ou d\'entrepôt non disponibles'
                    })
                    return
                }

                const response = await jobStore.transferAll(inventoryId.value, warehouseId.value)
                alertService.success({ text: response.message })

                // Réinitialiser la sélection après l'action
                resetAllSelections()

                await refreshJobs(lastExecutedQueryModel ?? undefined)
            }
        } catch (error) {
            // Extraire et afficher le message d'erreur backend
            const errorMessage = Validators.extractBackendError(error, 'Erreur lors du transfert de tous les jobs')
            alertService.error({ text: errorMessage })
        }
    }


    /**
     * Handler pour clôturer l'inventaire
     */
    async function handleCloturerClick() {
        if (!inventoryId.value) {
            alertService.warning({ text: 'ID d\'inventaire manquant.' })
            return
        }

        try {
            await inventoryStore.closeInventory(inventoryId.value)
            alertService.success({ text: 'Inventaire clôturé avec succès !' })

            // Rafraîchir les données pour mettre à jour le statut
            await refreshJobs()

            // Rafraîchir le statut de l'inventaire
            if (inventoryId.value) {
                const detail = await inventoryStore.fetchInventoryDetail(inventoryId.value)
                if (detail) {
                    inventoryStatus.value = detail.status || ''
                }
            }
        } catch (error) {
            // Extraire et afficher le message d'erreur backend
            const errorMessage = Validators.extractBackendError(error, 'Erreur lors de la clôture de l\'inventaire')
            alertService.error({ text: errorMessage })
        }
    }

    /**
     * Handler pour le transfert de jobs
     */
    const handleTransferClick = () => {
        const selectedRowNodes = getSelectedRowNodes()
        if (!selectedRowNodes.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' })
            return
        }

        // Filtrer les jobs éligibles pour le transfert
        // - Jobs avec statut TRANSFERT ou PRET
        // - Jobs avec statut ENTAME (tous les jobs ENTAME sont acceptés, peu importe l'assignment)
        const eligibleJobs = selectedRowNodes.filter(job => {
            // Jobs avec statut TRANSFERT, PRET ou ENTAME sont toujours éligibles
            // Pour ENTAME, on accepte tous les jobs ENTAME sans vérifier l'assignment
            if (job.status === 'TRANSFERT' || job.status === 'PRET' || job.status === 'ENTAME') {
                return true
            }

            return false
        })

        const ineligibleJobs = selectedRowNodes.filter(job => !eligibleJobs.includes(job))

        if (eligibleJobs.length === 0) {
            alertService.warning({
                text: 'Aucun job éligible pour le transfert. Seuls les jobs en statut TRANSFERT, PRET ou ENTAME peuvent être transférés.'
            })
            return
        }

        if (ineligibleJobs.length > 0) {
            alertService.info({
                text: `${eligibleJobs.length} job(s) éligible(s). ${ineligibleJobs.length} job(s) ne sont pas éligibles (statuts: ${ineligibleJobs.map(j => j.status).join(', ')})`
            })
        }

        // Utiliser uniquement les jobs éligibles
        selectedJobs.value = eligibleJobs.map(job => job.id)
        showTransferModal.value = true
    }

    /**
     * Handler pour l'action manuelle de jobs
     */
    const handleManualClick = () => {
        const selectedRowNodes = getSelectedRowNodes()
        if (!selectedRowNodes.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' })
            return
        }

        // Filtrer les jobs éligibles pour l'action manuelle
        // - Uniquement les jobs avec statut PRET ou TRANSFERT
        const eligibleJobs = eligibleJobsForManual.value
        const ineligibleJobs = selectedRowNodes.filter(job => !eligibleJobs.includes(job))

        if (eligibleJobs.length === 0) {
            alertService.error({
                text: 'Aucun job éligible pour l\'action manuelle. Seuls les jobs en statut PRET, TRANSFERT ou ENTAME peuvent être lancés manuellement.'
            })
            return
        }

        if (ineligibleJobs.length > 0) {
            alertService.warning({
                text: `${eligibleJobs.length} job(s) éligible(s). ${ineligibleJobs.length} job(s) ne sont pas éligibles (statuts: ${ineligibleJobs.map(j => j.status).join(', ')})`
            })
        }

        // Utiliser uniquement les jobs éligibles
        selectedJobs.value = eligibleJobs.map(job => job.id)
        showManualModal.value = true
    }

    /**
     * Handler pour transférer tous les jobs éligibles (tous les jobs de la page actuelle)
     */
    const handleTransferAll = () => {
        // Utiliser tous les jobs de la page actuelle au lieu de seulement les sélectionnés
        const displayDataArray = displayData.value

        // Construire la liste des jobs non-child de manière optimisée
        const allJobs: RowNode[] = []
        for (const row of displayDataArray) {
            if (row && !row.isChild) {
                allJobs.push(row)
            }
        }

        // Filtrer les jobs éligibles pour le transfert
        const eligibleJobs = allJobs.filter(job => {
            return job.status === 'TRANSFERT' || job.status === 'PRET' || job.status === 'ENTAME'
        })

        const ineligibleJobs = allJobs.filter(job => !eligibleJobs.includes(job))

        if (eligibleJobs.length === 0) {
            alertService.warning({
                text: 'Aucun job éligible pour le transfert. Seuls les jobs en statut TRANSFERT, PRET ou ENTAME peuvent être transférés.'
            })
            return
        }

        if (ineligibleJobs.length > 0) {
            alertService.info({
                text: `${eligibleJobs.length} job(s) éligible(s) sur ${allJobs.length} job(s). ${ineligibleJobs.length} job(s) ne sont pas éligibles (statuts: ${ineligibleJobs.map(j => j.status).join(', ')})`
            })
        }

        // Utiliser tous les jobs éligibles
        selectedJobs.value = eligibleJobs.map(job => job.id)
        showTransferModal.value = true
    }

    /**
     * Handler pour affecter automatiquement tous les jobs depuis les location-jobs
     * Utilise l'endpoint d'auto-affectation automatique
     */
    const handleValidateAllJobs = async () => {
        // Vérifier que les IDs requis sont disponibles
        if (!inventoryId.value || !warehouseId.value) {
            await alertService.warning({ text: 'Inventaire ou entrepôt non disponible' })
            return
        }

        try {
            // Confirmation avant validation
            const confirmation = await Swal.fire({
                title: 'Valider tous les jobs',
                html: `
                    <div style="text-align: left; padding: 1rem 0;">
                        <p style="color: #6b7280; font-size: 0.95rem; margin-bottom: 1rem;">
                            Voulez-vous vraiment valider tous les jobs de cet inventaire ?
                        </p>
                        <div style="background: #f9fafb; border-radius: 0.5rem; padding: 1rem; margin-top: 1rem;">
                            <div style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem;">Inventaire :</div>
                            <div style="font-size: 1.125rem; font-weight: 600; color: #1f2937;">${inventoryReference}</div>
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Valider tous',
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

            // Afficher un loader
            const loadingSwal = Swal.fire({
                title: 'Validation en cours...',
                html: 'Veuillez patienter pendant la validation de tous les jobs',
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => {
                    Swal.showLoading()
                }
            })

            // Appeler l'API de validation de tous les jobs
            await jobStore.validateAllJobs(inventoryId.value, warehouseId.value)

            // Fermer le loader et afficher le succès
            await Swal.close()
            await alertService.success({ text: 'Tous les jobs ont été validés avec succès' })

            // Rafraîchir les données du DataTable (avec le même query pour garder page/filtres)
            resetAllSelections()
            await refreshJobs(lastExecutedQueryModel ?? undefined)

        } catch (error: any) {
            await Swal.close()

            // Extraire le message d'erreur du backend
            const errorMessage = error?.response?.data?.message ||
                                error?.message ||
                                'Erreur lors de la validation de tous les jobs'

            await alertService.error({ text: errorMessage })
        }
    }

    const handleAffectAll = async () => {
        // Vérifier que l'inventaire ID est disponible
        if (!inventoryId.value) {
            alertService.error({
                text: 'ID de l\'inventaire non disponible'
            })
            return
        }

        // Demander confirmation
        const confirmResult = await alertService.confirm({
            title: 'Affectation automatique',
            text: 'Voulez-vous affecter automatiquement tous les jobs depuis les location-jobs ? Cette opération va créer/mettre à jour les affectations d\'équipes basées sur les données importées.'
        })

        if (!confirmResult.isConfirmed) {
            return
        }

        try {
            // Appeler l'API d'auto-affectation via le store (le store gère loading)
            const response = await jobStore.autoAssignJobsFromLocationJobs(inventoryId.value)

            if (response.success) {
                // Afficher le message de succès
                await alertService.success({
                    text: response.message
                })

                // Rafraîchir les données du DataTable (avec le même query pour garder page/filtres)
                await refreshJobs(lastExecutedQueryModel ?? undefined)
            } else {
                // Afficher les erreurs de validation
                if (response.errors && response.errors.length > 0) {
                    await alertService.error({
                        title: 'Erreurs de validation',
                        text: response.message + '\n\n' + response.errors.join('\n')
                    })
                } else {
                    await alertService.error({
                        text: response.message || 'Erreur lors de l\'affectation automatique'
                    })
                }
            }
        } catch (error: any) {
            // Gérer les erreurs de validation depuis le backend
            if (error.response?.data) {
                const errorData = error.response.data

                if (errorData.errors && Array.isArray(errorData.errors)) {
                    await alertService.error({
                        title: errorData.message || 'Erreurs de validation',
                        text: errorData.errors.join('\n')
                    })
                } else if (errorData.message) {
                    await alertService.error({
                        text: errorData.message
                    })
                } else {
                    await alertService.error({
                        text: 'Erreur lors de l\'affectation automatique des jobs'
                    })
                }
            } else {
                await alertService.error({
                    text: error.message || 'Erreur lors de l\'affectation automatique des jobs'
                })
            }
        }
    }

    /**
     * Handler pour la soumission du formulaire de transfert
     *
     * @param data - Données du formulaire (comptages: string[])
     */
    const handleTransferSubmit = async (data: Record<string, unknown>) => {
        const { comptages } = data as { comptages: string[] }

        // Déterminer les ordres de comptage à transférer
        const countingOrder: number[] = []
        if (comptages && Array.isArray(comptages)) {
            if (comptages.includes('premier')) countingOrder.push(1)
            if (comptages.includes('deuxieme')) countingOrder.push(2)
        }

        if (countingOrder.length === 0) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un comptage à transférer.' })
            return
        }

        // Utiliser uniquement les jobs éligibles (déjà filtrés par handleTransferClick)
        const eligibleJobIds = selectedJobs.value.map(id => parseInt(id))

        try {
            // Invalider le cache pour tous les jobs modifiés

            await jobStore.jobTransfer(eligibleJobIds, countingOrder)

            alertService.success({
                text: `${eligibleJobIds.length} job(s) transféré(s) avec succès pour ${countingOrder.length === 2 ? 'les deux comptages' : countingOrder[0] === 1 ? 'le 1er comptage' : 'le 2e comptage'}`
            })

            showTransferModal.value = false
            transferForm.value = { comptages: [] }

            // Réinitialiser la sélection après le transfert
            await resetAllSelections()

            await refreshJobs()
        } catch (error) {
            alertService.error({
                text: 'Erreur lors du transfert des jobs'
            })
        }
    }

    /**
     * Handler pour la soumission du formulaire d'action manuelle
     *
     * @param data - Données du formulaire (premierComptage, deuxiemeComptage)
     */
    const handleManualSubmit = async (data: Record<string, unknown>) => {
        const { premierComptage, deuxiemeComptage } = data as { premierComptage: boolean; deuxiemeComptage: boolean }

        // Déterminer les ordres de comptage à transférer
        const countingOrder: number[] = []
        if (premierComptage) countingOrder.push(1)
        if (deuxiemeComptage) countingOrder.push(2)

        if (countingOrder.length === 0) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un comptage à lancer.' })
            return
        }

        // Utiliser uniquement les jobs éligibles (PRET ou TRANSFERT)
        const eligibleJobIds = selectedJobs.value.map(id => parseInt(id))

        try {
            // Invalider le cache pour tous les jobs modifiés

            await jobStore.jobTransfer(eligibleJobIds, countingOrder)

            alertService.success({
                text: `${eligibleJobIds.length} job(s) lancé(s) manuellement avec succès pour ${countingOrder.length === 2 ? 'les deux comptages' : countingOrder[0] === 1 ? 'le 1er comptage' : 'le 2e comptage'}`
            })

            showManualModal.value = false
            manualForm.value = { comptages: [] }

            // Réinitialiser la sélection après l'action manuelle
            await resetAllSelections()

            await refreshJobs()
        } catch (error) {
            alertService.error({
                text: 'Erreur lors de l\'action manuelle des jobs'
            })
        }
    }

    /**
     * Handler pour la soumission du formulaire d'affectation de ressources
     *
     * @param data - Données du formulaire (resources)
     */
    async function handleResourceSubmit(data: Record<string, unknown>) {
        const { resources } = data as { resources: string[] }

        const jobIds = selectedJobs.value

        try {
            // Les ressources peuvent être des IDs ou des références
            const resourceIds: number[] = []
            for (const resourceValue of resources) {
                // Essayer d'abord de convertir en ID numérique
                const numericId = parseInt(resourceValue)
                if (!isNaN(numericId)) {
                    resourceIds.push(numericId)
                } else {
                    // Si ce n'est pas un ID numérique, chercher la ressource par référence
                    const resource = resourceStore.getResources.find(r => r.reference === resourceValue)
                    if (resource && resource.id) {
                        resourceIds.push(resource.id)
                    }
                }
            }

            if (resourceIds.length === 0) {
                alertService.error({
                    text: 'Aucune ressource valide sélectionnée'
                })
                return
            }


            await jobStore.assignResourcesToJobs(inventoryId.value!, {
                job_ids: jobIds.map(id => parseInt(id)),
                resource_assignments: resourceIds
            })

            alertService.success({
                text: `${resourceIds.length} ressource(s) affectée(s) à ${jobIds.length} job(s)`
            })

            showResourceModal.value = false
            resourceForm.value = { resources: [] }

            // Réinitialiser la sélection après l'affectation de ressources
            await resetAllSelections()

            await refreshJobs()
        } catch (error) {
            alertService.error({
                text: 'Erreur lors de l\'affectation des ressources'
            })
        }
    }

    /**
     * Handler pour l'assignation d'une équipe à un job spécifique (utilisé par la modal)
     */
    async function handleTeamAssignment(jobId: number, countingOrder: number, teamId: string) {
        try {
            await saveSingleAssignment(inventoryId.value!, {
                job_id: jobId,
                team: parseInt(teamId),
                counting_order: countingOrder,
                complete: false // Par défaut : partiel
            })


            logger.debug(`Équipe ${teamId} assignée au job ${jobId} pour le comptage ${countingOrder}`)
        } catch (error) {
            logger.error('Erreur lors de l\'assignation d\'équipe:', error)
            throw error
        }
    }

    /**
     * Handler pour la soumission du formulaire d'affectation d'équipe
     *
     * @param data - Données du formulaire (team, date)
     */
    async function handleTeamSubmit(data: Record<string, unknown>) {
        const { team, date } = data as { team: string; date: string }
        const jobIds = selectedJobs.value

        try {

            await jobStore.assignTeamsToJobs(inventoryId.value!, {
                job_ids: jobIds.map(id => parseInt(id)),
                counting_order: currentTeamType.value === 'premier' ? 1 : 2,
                session_id: parseInt(team), // Maintenant team contient l'ID de session
                date_start: date
            })

            // Trouver le username pour l'affichage
            const session = sessionStore.getAllSessions.find(s => s.id.toString() === team)
            const teamName = session ? session.username : team

            alertService.success({
                text: `Équipe ${teamName} affectée au ${currentTeamType.value} comptage pour ${jobIds.length} job(s)`
            })

            showTeamModal.value = false
            teamForm.value = { team: '', date: '' }

            // Réinitialiser la sélection après l'affectation d'équipe
            await resetAllSelections()

            await refreshJobs()
        } catch (error) {
            alertService.error({
                text: 'Erreur lors de l\'affectation de l\'équipe'
            })
        }
    }

    // ===== NAVIGATION =====

    /**
     * Navigation vers la page de détail de l'inventaire
     */
    const handleGoToInventoryDetail = () => {
        router.push({
            name: 'inventory-detail',
            params: { reference: inventoryReference }
        })
    }

    /**
     * Navigation vers la page de planning
     */
    const handleGoToAffectation = () => {
        router.push({
            name: 'inventory-planning',
            params: {
                reference: inventoryReference,
                warehouse: warehouseReference
            }
        })
    }

    /**
     * Navigation vers la page de résultats
     */
    const handleGoToResults = () => {
        router.push({
            name: 'inventory-results',
            params: { reference: inventoryReference }
        })
    }

    /**
     * Navigation vers la page de suivi des jobs
     */
    const handleGoToJobTracking = () => {
        router.push({
            name: 'inventory-job-tracking',
            params: { reference: inventoryReference }
        })
    }

    /**
     * Navigation vers la page de suivi de l'importation du planning
     */
    const handleGoToImportTracking = () => {
        router.push({
            name: 'inventory-import-tracking',
            params: { reference: inventoryReference }
        })
    }

    // ===== LIFECYCLE =====

    /**
     * Initialisation au montage du composant
     */
    onMounted(async () => {
        try {
            // Charger les stores en tâche de fond
            void initializeStores()

            isInitializing.value = true
            try {
                // 1. D'abord, initialiser les IDs depuis les références (inventaire et entrepôt)
                await initializeIdsFromReferences()

                // 2. Vérifier que les IDs sont valides avant de charger les jobs
                if (!inventoryId.value || !warehouseId.value || inventoryId.value <= 0 || warehouseId.value <= 0) {
                    console.error('[useAffecter.onMounted] ❌ Invalid IDs:', { inventoryId: inventoryId.value, warehouseId: warehouseId.value })
                    await alertService.error({
                        text: `IDs invalides après initialisation - Inventaire: ${inventoryId.value}, Entrepôt: ${warehouseId.value}`
                    })
                    return
                }

                // 3. Charger les jobs - soit directement, soit via les événements en file d'attente
                if (pendingEventsQueue.length > 0) {
                    // Si des événements sont en file d'attente (DataTable a restauré son état),
                    // traiter le premier événement pour charger avec les bonnes données
                    const firstEvent = pendingEventsQueue[0]
                    await processEventDirectly(firstEvent.eventType, firstEvent.queryModel)
                    pendingEventsQueue.shift() // Retirer le premier événement traité
                } else {
                    // Aucun événement en file d'attente, chargement normal
                    await loadJobs()
                }

                // 4. Synchroniser les états après l'initialisation (avec nextTick pour éviter les boucles réactives)
                await nextTick()
                updateDisplayData()
                updateJobsPagination()

                // 5. Marquer l'initialisation comme terminée
                isInitialized.value = true

                // 6. Traiter les événements restants en file d'attente (s'il y en a)
                if (pendingEventsQueue.length > 0) {
                    for (const queuedEvent of pendingEventsQueue) {
                        await processEventDirectly(queuedEvent.eventType, queuedEvent.queryModel)
                    }
                    pendingEventsQueue.length = 0 // Vider la file d'attente
                }

                // Rafraîchir le statut sans bloquer l'affichage
                fetchInventoryStatus().catch(() => {
                    // Erreur non bloquante
                })
            } finally {
                isInitializing.value = false
            }
        } catch (error) {
            await alertService.error({
                text: 'Erreur lors du chargement des données. Veuillez rafraîchir la page.'
            })
        }
    })

    /**
     * Nettoyage au démontage du composant
     */
    onUnmounted(() => {
        // Nettoyage si nécessaire
    })

    // ===== EXPORT HANDLERS =====

    /**
     * Handler pour l'export CSV
     */
    const handleExportCsv = async () => {
        try {
            if (!inventoryId.value || !warehouseId.value) {
                await alertService.error({ text: 'ID d\'inventaire ou d\'entrepôt non disponible' })
                return
            }

            // Créer un QueryModel basique pour l'export
            const currentQueryModel: QueryModel = {
                page: 1,
                pageSize: 50,
                filters: {},
                customParams: jobsCustomParams.value
            }
            // Convertir au format FORMAT_ACTUEL.md pour l'export
            const exportParams = convertQueryModelToQueryParams(currentQueryModel)
            exportParams.set('export', 'csv')

            // Appeler le service d'export (GET avec responseType: 'blob')
            const response = await JobService.exportValidated(inventoryId.value, warehouseId.value, exportParams)

            // response.data est déjà un Blob quand responseType: 'blob' est utilisé
            const blob = response.data as Blob

            // Récupérer le type MIME depuis les headers ou utiliser un type par défaut
            const contentType = response.headers['content-type'] || 'text/csv'

            // Télécharger le fichier
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `jobs_valides_${new Date().toISOString().split('T')[0]}.csv`)
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
     * Handler pour l'export Excel
     */
    const handleExportExcel = async () => {
        try {
            if (!inventoryId.value || !warehouseId.value) {
                await alertService.error({ text: 'ID d\'inventaire ou d\'entrepôt non disponible' })
                return
            }

            // Créer un QueryModel basique pour l'export
            const currentQueryModel: QueryModel = {
                page: 1,
                pageSize: 50,
                filters: {},
                customParams: jobsCustomParams.value
            }
            // Convertir au format FORMAT_ACTUEL.md pour l'export
            const exportParams = convertQueryModelToQueryParams(currentQueryModel)
            exportParams.set('export', 'excel')

            // Appeler le service d'export (GET avec responseType: 'blob')
            const response = await JobService.exportValidated(inventoryId.value, warehouseId.value, exportParams)

            // response.data est déjà un Blob quand responseType: 'blob' est utilisé
            const blob = response.data as Blob

            // Récupérer le type MIME depuis les headers ou utiliser un type par défaut
            const contentType = response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

            // Télécharger le fichier
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `jobs_valides_${new Date().toISOString().split('T')[0]}.xlsx`)
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
        // Données harmonisées avec usePlanning.ts
        jobs,
        selectedJobs,
        selectedJobsCount: computed(() => selectedJobs.value.length),
        hasSelectedJobs: computed(() => selectedJobs.value.length > 0),
        pendingChanges,
        hasUnsavedChanges,

        // Références harmonisées avec usePlanning.ts
        jobsTableRef,
        jobsKey,
        dropdownRef,

        // État des modales
        showDropdown,
        showTeamModal,
        showResourceModal,
        showTransferModal,
        showManualModal,
        showJobAffectationModal,
        selectedJobForModal,
        assignmentSavingInModal,
        modalTeamOptions,
        modalTeamOptionsByCountingOrder,
        modalTitle,

        // Formulaires
        teamForm,
        teamFields,
        resourceForm,
        resourceFields,
        transferForm,
        transferFields,
        manualForm,
        manualFields,

        // Dropdown
        dropdownItems,
        resetAllChanges,
        resetAllSelections,
        resetDataTableSelections,
        onCellValueChanged,
        onJobSelectionChanged,
        onRowClicked,
        toggleDropdown,
        focusFirstItem,
        closeDropdown,
        focusNextItem,
        focusPrevItem,
        setDropdownItemRef,

        // Handlers d'actions
        handleValiderClick,
        handleResourceSubmit,
        handleTeamAssignment,
        handleTeamSubmit,
        handleTransferSubmit,
        handleManualSubmit,
        handleReadyClick,
        handleReadyAll,
        handleGoToInventoryDetail,
        handleGoToAffectation,
        handleGoToResults,
        handleGoToJobTracking,
        handleGoToImportTracking,
        handleTransferClick,
        handleManualClick,
        handleTransferAll,
        handleTransferAllBulk,
        handleAffectAll,
        handleValidateAllJobs,

        // Handlers JobAffectationModal
        handleJobAffectationModalTeamChanged,
        handleJobAffectationModalFinish,

        // Pagination et métadonnées harmonisées avec usePlanning.ts
        jobPaginationMetadata: jobPaginationMetadataComputed,

        // États de chargement
        jobsLoading: computed(() => jobsLoadingLocal.value),

        // QueryModel pour synchronisation DataTable
        jobsQueryModel: jobsQueryModelRef,

        // Paramètres personnalisés DataTable
        jobsCustomParams,

        // Handlers DataTable harmonisés avec usePlanning.ts
        onJobsTableEvent,

        // Gestion des IDs
        initializeIdsFromReferences,
        refreshIdsFromReferences,
        inventoryId: computed(() => inventoryId.value),
        warehouseId: computed(() => warehouseId.value),
        inventoryReference,
        warehouseReference,

        // Computed
        eligibleJobsForTransfer,
        eligibleJobsForManual,
        resourceOptions,
        showTransferButton,
        showManualButton,
        showReadyButton,
        actionButtons,
        navigationButtons,
        jobsColumns,
        adaptedStoreJobsColumns,
        jobsActions: resolvedJobsActions,

        // Utilitaires
        dateValueParser,
        dateValueSetter,
        getTransformedLocations,

        // Export handlers
        handleExportCsv,
        handleExportExcel,

        // Méthodes de chargement
        loadJobs,
        refreshJobs
    }
}
