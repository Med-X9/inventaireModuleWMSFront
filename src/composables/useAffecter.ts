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
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

// ===== IMPORTS ROUTER =====
import { useRoute, useRouter } from 'vue-router'

// ===== IMPORTS STORES =====
import { useJobStore } from '@/stores/job'
import { useResourceStore } from '@/stores/resource'
import { useWarehouseStore } from '@/stores/warehouse'
import { useInventoryStore } from '@/stores/inventory'
import { useSessionStore } from '@/stores/session'

// ===== IMPORTS SERVICES =====
import { alertService } from '@/services/alertService'
import { logger } from '@/services/loggerService'
import { Validators } from '@/utils/validators'

// ===== IMPORTS COMPOSABLES =====
// ===== IMPORTS TYPES =====
import type { FieldConfig } from '@/interfaces/form'
import { JobManualAssignmentsRequest } from '@/models/Job'
import {
    convertToStandardDataTableParams,
    type StandardDataTableParams
} from '@/components/DataTable/utils/dataTableParamsConverter'
import { useQueryModel } from '@/components/DataTable/composables/useQueryModel'
import { convertQueryModelToQueryParams, convertQueryModelToRestApi, createQueryModelFromDataTableParams } from '@/components/DataTable/utils/queryModelConverter'
import type { QueryModel } from '@/components/DataTable/types/QueryModel'
import {
    extractFiltersFromStandardParams,
    extractPageFromStandardParams,
    extractPageSizeFromStandardParams,
    extractSortFromStandardParams,
    isStandardDataTableParams
} from '@/composables/utils/dataTableHelpers'
import type { InventoryDetails } from '@/models/Inventory'

// ===== INITIALISATION DES STORES =====
const jobStore = useJobStore()
const resourceStore = useResourceStore()
const warehouseStore = useWarehouseStore()
const inventoryStore = useInventoryStore()
const sessionStore = useSessionStore()

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
    status: 'AFFECTE' | 'VALIDE' | 'TRANSFERT' | 'PRET' | 'ENTAME'
    isChild?: boolean
    parentId?: string | null
    childType?: 'location' | 'resource'
}

/**
 * Configuration d'une colonne DataTable
 */
export interface DataTableColumn {
    field: string
    headerName: string
    sortable?: boolean
    filterable?: boolean
    width?: number
    flex?: number
    editable?: boolean
    dataType?: string
    cellRenderer?: (params: any) => string
    filterConfig?: any
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
        logger.debug('Résolution de l\'ID de l\'inventaire par référence', { reference })

        // Utiliser fetchInventoryByReference qui récupère directement l'inventaire par référence
        const inventory = await inventoryStore.fetchInventoryByReference(reference)
        options?.onInventoryResolved?.(inventory ?? null)

        if (inventory && inventory.id) {
            logger.debug('ID de l\'inventaire résolu avec succès', {
                reference,
                inventoryId: inventory.id
            })
            return inventory.id
        } else {
            logger.warn('Inventaire trouvé mais sans ID', { reference, inventory })
            return null
        }
    } catch (error) {
        logger.error('Erreur lors de la récupération de l\'ID de l\'inventaire', { reference, error })
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
    if (!params.data || params.data.isChild) return false

    const parsedValue = dateValueParser(params)
    const field = params.colDef.field!
    const oldValue = params.data[field]

    if (parsedValue !== oldValue) {
        params.data[field] = parsedValue
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
export function useAffecter(options?: { inventoryReference?: string, warehouseReference?: string }) {
    const route = useRoute()
    const router = useRouter()

    // ===== RÉFÉRENCES =====

    /** Référence de l'inventaire (priorité aux options, sinon fallback sur la route) */
    const inventoryReference = options?.inventoryReference ?? (route.params.reference as string)

    /** Référence de l'entrepôt (priorité aux options, sinon fallback sur la route) */
    const warehouseReference = options?.warehouseReference ?? (route.params.warehouse as string)

    // ===== ÉTAT RÉACTIF =====

    /** ID de l'inventaire récupéré depuis la référence */
    const inventoryId = ref<number | null>(null)

    /** ID de l'entrepôt récupéré depuis la référence */
    const warehouseId = ref<number | null>(null)

    /** Lignes sélectionnées dans le DataTable */
    const selectedRows = ref<RowNode[]>([])

    /** Modifications en attente de sauvegarde (Map<jobId, Map<field, value>>) */
    const pendingChanges = ref<Map<string, Map<string, any>>>(new Map())

    /** Indique s'il y a des modifications non sauvegardées */
    const hasUnsavedChanges = computed(() => pendingChanges.value.size > 0)

    /** État des modales */
    const showTeamModal = ref(false)
    const showResourceModal = ref(false)
    const showTransferModal = ref(false)
    const showManualModal = ref(false)

    /** Type d'équipe en cours d'affectation */
    const currentTeamType = ref<'premier' | 'deuxieme'>('premier')

    /** Formulaires */
    const teamForm = ref<Record<string, unknown>>({ team: '', date: '' })
    const resourceForm = ref({ resources: [] })
    const transferForm = ref({ premierComptage: false, deuxiemeComptage: false })
    const manualForm = ref({ premierComptage: false, deuxiemeComptage: false })

    /** Titre de la modale d'équipe */
    const modalTitle = computed(() => `Affecter ${currentTeamType.value === 'premier' ? 'Premier' : 'Deuxième'} Comptage`)

    /** États DataTable des jobs validés */
    const jobsCurrentPage = ref(1)
    const jobsPageSize = ref(20)
    const jobsSearchQuery = ref('')
    const jobsSortModel = ref<Array<{ field: string; direction: 'asc' | 'desc' }>>([])
    const jobsFilters = ref<Record<string, { filter: any; operator?: string }>>({})
    const lastJobsParams = ref<StandardDataTableParams | null>(null)

    // ===== QUERYMODEL =====
    
    /**
     * Mode de sortie pour les paramètres de requête (défaut: 'queryParams')
     */
    const queryOutputMode = ref<'queryModel' | 'dataTable' | 'restApi' | 'queryParams'>('queryParams')

    /**
     * Colonnes pour QueryModel
     */
    const columnsRef = computed(() => columns.value)

    /**
     * QueryModel pour gérer les requêtes avec mode de sortie configurable
     */
    const {
        queryModel: queryModelRef,
        toStandardParams,
        updatePagination: updateQueryPagination,
        updateSort: updateQuerySort,
        updateFilter: updateQueryFilter,
        updateGlobalSearch: updateQueryGlobalSearch,
        fromDataTableParams: fromDataTableParamsQueryModel
    } = useQueryModel({
        columns: columnsRef,
        enabled: true
    })

    /**
     * Convertit le QueryModel selon le mode configuré
     */
    const convertQueryModelToOutput = (queryModelData: QueryModel) => {
        switch (queryOutputMode.value) {
            case 'queryModel':
                return queryModelData
            case 'restApi':
                return convertQueryModelToRestApi(queryModelData)
            case 'queryParams':
                return convertQueryModelToQueryParams(queryModelData)
            case 'dataTable':
            default:
                return toStandardParams.value
        }
    }

    // ===== RÉFÉRENCES COMPOSANTS =====

    /** Référence au composant DataTable */
    const dataTableRef = ref<any>(null)

    /** Référence au dropdown d'actions */
    const dropdownRef = ref<HTMLElement | null>(null)

    /** État d'ouverture du dropdown */
    const showDropdown = ref(false)

    /** Statut de l'inventaire */
    const inventoryStatus = ref<string>('')

    /** Cache local de l'inventaire pour éviter les doubles appels */
    const inventoryDetailsCache = ref<InventoryDetails | null>(null)

    // ===== MÉTHODES D'INITIALISATION =====

    /**
     * Initialise les IDs depuis les références
     */
    const initializeIdsFromReferences = async () => {
        logger.debug('Initialisation des IDs depuis les références', {
            inventoryReference,
            warehouseReference
        })

        // Paralléliser les appels pour améliorer les performances
        const promises: Promise<any>[] = []

        if (inventoryReference) {
            promises.push(
                fetchInventoryIdByReference(inventoryReference, {
                    onInventoryResolved: (inventory) => {
                        inventoryDetailsCache.value = inventory
                        if (inventory?.status) {
                            inventoryStatus.value = inventory.status
                        }
                    }
                }).then(id => {
                    inventoryId.value = id
                    logger.debug('inventoryId défini', { inventoryId: id })
                }).catch(error => {
                    logger.error('Erreur lors de la résolution de l\'ID de l\'inventaire', error)
                    inventoryId.value = null
                })
            )
        } else {
            logger.warn('inventoryReference manquant')
        }

        if (warehouseReference) {
            promises.push(
                fetchWarehouseIdByReference(warehouseReference).then(id => {
                    warehouseId.value = id
                    logger.debug('warehouseId défini', { warehouseId: id })
                }).catch(error => {
                    logger.error('Erreur lors de la résolution de l\'ID de l\'entrepôt', error)
                    warehouseId.value = null
                })
            )
        } else {
            logger.warn('warehouseReference manquant')
        }

        await Promise.all(promises)

        logger.debug('IDs initialisés', {
            inventoryId: inventoryId.value,
            warehouseId: warehouseId.value
        })
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
        if (inventoryDetailsCache.value?.status) {
            inventoryStatus.value = inventoryDetailsCache.value.status
            return
        }
        try {
            const inventory = await inventoryStore.fetchInventoryByReference(inventoryReference)
            if (inventory) {
                inventoryDetailsCache.value = inventory
                inventoryStatus.value = inventory.status
            }
        } catch (error) {
            logger.error('Erreur lors de la récupération du statut de l\'inventaire', error)
        }
    }

    /**
     * Initialise le composable DataTable
     * Retourne true si l'initialisation a réussi, false sinon
     */
    const initializeDataTable = async (): Promise<boolean> => {
        if (inventoryId.value && warehouseId.value) {
            logger.debug('Initialisation du DataTable pour les jobs validés', {
                inventoryId: inventoryId.value,
                warehouseId: warehouseId.value
            })
            await loadValidatedJobs()
            return true
        }

        logger.warn('Impossible d\'initialiser le DataTable, IDs manquants', {
            inventoryId: inventoryId.value,
            warehouseId: warehouseId.value
        })
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

            if (sessionStore.getAllSessions.length === 0) {
                promises.push(sessionStore.fetchSessions())
            }

            // Exécuter tous les appels en parallèle
            await Promise.all(promises)
        } catch (error) {
            logger.error('Erreur lors de l\'initialisation des stores', error)
            alertService.error({
                text: 'Erreur lors du chargement des données. Veuillez rafraîchir la page.'
            })
        }
    }

    /**
     * Charge les sessions si nécessaire
     */
    async function loadSessionsIfNeeded() {
        if (sessionStore.getAllSessions.length === 0) {
            try {
                await sessionStore.fetchSessions()
            } catch (error) {
                logger.error('Erreur lors du chargement des sessions', error)
                alertService.error({
                    text: 'Erreur lors du chargement des sessions'
                })
            }
        }
    }

    // ===== WATCHERS =====

    /**
     * Flag pour éviter les doubles chargements
     */
    const isInitializing = ref(false)

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
            logger.debug('Watch: Initialisation déjà en cours, ignore le déclenchement')
            return
        }

        isInitializing.value = true
        try {
            logger.debug('Watch: Rechargement du DataTable suite au changement des IDs', {
                inventoryId: newInventoryId,
                warehouseId: newWarehouseId
            })
            await loadValidatedJobs()
        } finally {
            isInitializing.value = false
        }
    }, { immediate: false })

    // ===== HANDLERS DATATABLE =====

    /**
     * Handler pour les changements de pagination
     * Accepte QueryModel, StandardDataTableParams, RestApi, queryParams ou l'ancien format
     *
     * @param params - Paramètres de pagination (format configuré ou ancien format)
     */
    const handlePaginationChanged = async (params: StandardDataTableParams | { page: number, pageSize: number } | QueryModel | Record<string, any>) => {
        const standardParams = isStandardDataTableParams(params)
            ? params
            : buildJobsStandardParams({
                page: (params as { page: number }).page,
                pageSize: (params as { page: number, pageSize: number }).pageSize
            })

        syncJobsStateFromStandardParams(standardParams)
        await loadValidatedJobs(standardParams)
    }

    /**
     * Handler pour les changements de tri
     * Accepte QueryModel, StandardDataTableParams, RestApi, queryParams ou l'ancien format
     *
     * @param sortModel - Modèle de tri (format configuré ou ancien format)
     */
    const handleSortChanged = async (sortModel: Array<{ field: string; direction: 'asc' | 'desc' }> | StandardDataTableParams | QueryModel | Record<string, any>) => {
        if (!isStandardDataTableParams(sortModel)) {
            jobsSortModel.value = sortModel as Array<{ field: string; direction: 'asc' | 'desc' }>
        }

        const standardParams = isStandardDataTableParams(sortModel)
            ? sortModel
            : buildJobsStandardParams({
                sort: jobsSortModel.value
            })

        syncJobsStateFromStandardParams(standardParams)
        await loadValidatedJobs(standardParams)
    }

    /**
     * Handler pour les changements de filtres
     * Accepte QueryModel, StandardDataTableParams, RestApi, queryParams ou l'ancien format
     *
     * @param filterModel - Modèle de filtres (format configuré ou ancien format)
     */
    const handleFilterChanged = async (filterModel: Record<string, any> | StandardDataTableParams | QueryModel | Record<string, any>) => {
        if (!isStandardDataTableParams(filterModel)) {
            jobsFilters.value = filterModel as Record<string, { filter: any; operator?: string }>
        }

        const standardParams = isStandardDataTableParams(filterModel)
            ? filterModel
            : buildJobsStandardParams({ filters: jobsFilters.value })

        syncJobsStateFromStandardParams(standardParams)
        await loadValidatedJobs(standardParams)
    }

    /**
     * Handler pour les changements de recherche globale
     * Accepte soit le format standard DataTable (venant du composant), soit l'ancien format
     *
     * @param searchTerm - Terme de recherche (format standard ou string)
     */
    const handleGlobalSearchChanged = async (searchTerm: string | StandardDataTableParams) => {
        const standardParams = typeof searchTerm === 'object' && isStandardDataTableParams(searchTerm)
            ? searchTerm
            : buildJobsStandardParams({
                page: 1,
                search: typeof searchTerm === 'string' ? searchTerm : ''
            })

        syncJobsStateFromStandardParams(standardParams)
        await loadValidatedJobs(standardParams)
    }

    // ===== COMPUTED PROPERTIES =====

    /**
     * Options des équipes (sessions) pour les selects
     */
    const teamOptions = computed(() => {
        const sessions = sessionStore.getAllSessions
        return sessions.map(session => ({
            value: session.id.toString(),
            label: session.username
        }))
    })

    /**
     * Options des sessions pour les filtres et selects
     */
    const sessionOptions = computed(() => {
        const sessions = sessionStore.getAllSessions

        if (sessions.length === 0) {
            loadSessionsIfNeeded()
            return []
        }

        const options = sessions.map(session => ({
            value: session.username,
            label: session.username
        }))
        return options
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
     * Transforme les jobs en lignes compatibles DataTable
     */
    const mapJobsToRows = (jobs: any[] | undefined | null): RowNode[] => {
        if (!jobs || jobs.length === 0) {
            return []
        }

        const newData: RowNode[] = []

        jobs.forEach((parentRow) => {
            const premierAssignment = parentRow.assignments?.find((a: any) => a.counting_order === 1)
            const deuxiemeAssignment = parentRow.assignments?.find((a: any) => a.counting_order === 2)

            const ressourcesList = (parentRow.ressources || []).map((r: any) => r.reference)
            const ressourcesString = ressourcesList.length > 0 ? ressourcesList.join(', ') : ''

            const team1Name = premierAssignment?.session?.username || premierAssignment?.session?.id?.toString() || ''
            const team2Name = deuxiemeAssignment?.session?.username || deuxiemeAssignment?.session?.id?.toString() || ''

            const team1Status = premierAssignment?.status || ''
            const team2Status = deuxiemeAssignment?.status || ''

            const locations = (parentRow.emplacements || []).map((loc: any) => ({
                id: loc.id,
                reference: loc.reference,
                location_reference: loc.reference,
                zone_name: loc.zone?.zone_name || loc.sous_zone?.zone_name || 'N/A',
                sous_zone_name: loc.sous_zone?.sous_zone_name || 'N/A',
                zone: loc.zone,
                sous_zone: loc.sous_zone
            }))

            newData.push({
                id: String(parentRow.id),
                job: parentRow.reference || `Job ${parentRow.id}`,
                locations,
                team1: team1Name,
                team1Status,
                date1: premierAssignment?.date_start || '',
                team2: team2Name,
                team2Status,
                date2: deuxiemeAssignment?.date_start || '',
                resourcesList: ressourcesList,
                resources: ressourcesString,
                nbResources: ressourcesList.length,
                status: (['AFFECTE', 'VALIDE', 'TRANSFERT', 'PRET', 'ENTAME'].includes(String(parentRow.status))
                    ? String(parentRow.status)
                    : 'AFFECTE') as RowNode['status'],
                isChild: false,
                parentId: null
            })
        })

        return newData
    }

    const jobsData = computed(() => jobStore.jobsValidated)
    const displayData = computed(() => mapJobsToRows(jobsData.value))

    /**
     * Vérifie si un job a au moins un assignment avec le statut TRANSFERT ou PRET
     *
     * @param jobId - ID du job
     * @returns true si le job a au moins un assignment TRANSFERT ou PRET
     */
    const hasTransferableAssignment = (jobId: string): boolean => {
        // Récupérer les données originales du job
        const job = jobsData.value.find((j: any) => String(j.id) === jobId)

        if (!job || !job.assignments || !Array.isArray(job.assignments)) {
            return false
        }

        // Vérifier si au moins un assignment a le statut TRANSFERT ou PRET
        return job.assignments.some((assignment: any) => {
            const assignmentStatus = assignment.status || ''
            return assignmentStatus === 'TRANSFERT' || assignmentStatus === 'PRET'
        })
    }

    /**
     * Jobs éligibles au transfert
     * - Jobs avec statut TRANSFERT ou PRET
     * - Jobs avec statut ENTAME qui ont au moins un assignment TRANSFERT ou PRET
     */
    const eligibleJobsForTransfer = computed(() => {
        return selectedRows.value.filter(job => {
            // Jobs avec statut TRANSFERT ou PRET sont toujours éligibles
            if (job.status === 'TRANSFERT' || job.status === 'PRET') {
                return true
            }

            // Jobs ENTAME sont éligibles s'ils ont au moins un assignment TRANSFERT ou PRET
            if (job.status === 'ENTAME') {
                return hasTransferableAssignment(job.id)
            }

            return false
        })
    })

    /**
     * Jobs éligibles pour l'action manuelle
     * - Jobs avec statut PRET, TRANSFERT ou ENTAME
     */
    const eligibleJobsForManual = computed(() => {
        return selectedRows.value.filter(job => {
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
        return inventoryStatus.value === 'EN REALISATION'
    })

    /**
     * Afficher le bouton prêt si l'inventaire est en préparation
     */
    const showReadyButton = computed(() => {
        return inventoryStatus.value === 'EN PREPARATION'
    })

    /**
     * Afficher le bouton Annuler si l'inventaire est en préparation
     */
    const showResetButton = computed(() => {
        return inventoryStatus.value === 'EN PREPARATION'
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
            key: 'premierComptage',
            label: 'Premier Comptage',
            type: 'checkbox'
        },
        {
            key: 'deuxiemeComptage',
            label: 'Deuxième Comptage',
            type: 'checkbox'
        }
    ]

    /**
     * Colonnes du DataTable
     */
    const columns = computed(() => {
        const cols: any[] = [
            {
                field: 'job',
                headerName: 'Job',
                sortable: true,
                filterable: true,
                width: 80,
                flex: 1,
                editable: false,
                dataType: 'text' as const
            },
            {
                field: 'locations',
                headerName: 'Emplacements',
                sortable: false,
                filterable: false,
                width: 150,
                flex: 1,
                editable: false,
                dataType: 'text' as const,
                nestedData: {
                    key: 'locations',
                    displayKey: 'location_reference',
                    countSuffix: 'emplacements',
                    expandable: true,
                    showCount: true,
                    title: 'Emplacements du job',
                    columns: [
                        {
                            field: 'location_reference',
                            headerName: 'Référence',
                            sortable: true,
                            filterable: true,
                            width: 150,
                            dataType: 'text' as const
                        },
                        {
                            field: 'zone_name',
                            headerName: 'Zone',
                            sortable: true,
                            filterable: true,
                            width: 150,
                            dataType: 'text' as const
                        },
                        {
                            field: 'sous_zone_name',
                            headerName: 'Sous-zone',
                            sortable: true,
                            filterable: true,
                            width: 150,
                            dataType: 'text' as const
                        }
                    ]
                }
            },
            {
                field: 'status',
                headerName: 'Statut',
                sortable: true,
                filterable: true,
                width: 40,
                flex: 1,
                editable: false,
                dataType: 'select' as const,
                editValueFormatter: (value: any) => {
                    if (!value || value === '') {
                        return 'Sélectionner un statut...'
                    }
                    return value
                },
                filterConfig: {
                    dataType: 'select' as const,
                    operator: 'equals' as const,
                    options: [
                        { value: 'AFFECTE', label: 'AFFECTE' },
                        { value: 'VALIDE', label: 'VALIDE' },
                        { value: 'TRANSFERT', label: 'TRANSFERT' },
                        { value: 'PRET', label: 'PRET' },
                        { value: 'ENTAME', label: 'ENTAME' }
                    ]
                },
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
                    }
                ],
                badgeDefaultClass: 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset'
            },
            {
                field: 'team1',
                headerName: 'Équipe 1er Comptage',
                sortable: true,
                filterable: true,
                width: 80,
                flex: 1,
                editable: true,
                dataType: 'select' as const,
                editValueFormatter: (value: any) => {
                    if (!value || value === '') {
                        return 'Sélectionner une équipe...'
                    }
                    return value
                },
                filterConfig: {
                    dataType: 'select' as const,
                    operator: 'equals' as const,
                    options: sessionOptions.value
                },
                badgeStyles: [
                    {
                        value: 'ENTAME',
                        class: 'inline-flex items-center rounded-md bg-blue-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-blue-600/20 ring-inset',
                        icon: '<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
                    },
                    {
                        value: 'TRANSFERT',
                        class: 'inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-800 ring-1 ring-orange-600/20 ring-inset',
                        icon: '<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>'
                    },
                    {
                        value: 'VALIDE',
                        class: 'inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-800 ring-1 ring-green-600/20 ring-inset',
                        icon: '<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>'
                    },
                    {
                        value: 'PRET',
                        class: 'inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-800 ring-1 ring-purple-600/20 ring-inset',
                        icon: '<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>'
                    },
                    {
                        value: 'AFFECTE',
                        class: 'inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800 ring-1 ring-slate-600/20 ring-inset',
                        icon: '<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>'
                    }
                ],
                badgeDefaultClass: 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset',
                cellRenderer: (value: any, column: any, row: any) => {
                    const teamName = value || ''
                    const status = row?.team1Status || ''

                    if (!teamName) return '-'

                    // Trouver le style de badge pour ce statut
                    const badgeStyle = column.badgeStyles?.find((s: any) => s.value === status)
                    const defaultClass = column.badgeDefaultClass || 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset'
                    const badgeClass = badgeStyle?.class || defaultClass
                    const icon = badgeStyle?.icon || ''

                    return `<span class="${badgeClass}">
                        ${icon}${teamName}
                    </span>`
                }
            },
            {
                field: 'date1',
                headerName: 'Date 1er Comptage',
                sortable: true,
                filterable: true,
                width: 80,
                flex: 1,
                editable: true,
                dataType: 'date' as const,
                editValueFormatter: (value: any) => {
                    if (!value || value === '') {
                        return 'Choisir une date...'
                    }
                    try {
                        const date = new Date(value)
                        if (isNaN(date.getTime())) return ''
                        return date.toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                        })
                    } catch {
                        return value
                    }
                }
            },
            {
                field: 'team2',
                headerName: 'Équipe 2e Comptage',
                sortable: true,
                filterable: true,
                width: 80,
                flex: 1,
                editable: true,
                dataType: 'select' as const,
                editValueFormatter: (value: any) => {
                    if (!value || value === '') {
                        return 'Sélectionner une équipe...'
                    }
                    return value
                },
                filterConfig: {
                    dataType: 'select' as const,
                    operator: 'equals' as const,
                    options: sessionOptions.value
                },
                badgeStyles: [
                    {
                        value: 'ENTAME',
                        class: 'inline-flex items-center rounded-md bg-blue-500 px-2 py-1 text-xs font-medium text-white ring-1 ring-blue-600/20 ring-inset',
                        icon: '<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
                    },
                    {
                        value: 'TRANSFERT',
                        class: 'inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-800 ring-1 ring-orange-600/20 ring-inset',
                        icon: '<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>'
                    },
                    {
                        value: 'VALIDE',
                        class: 'inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-800 ring-1 ring-green-600/20 ring-inset',
                        icon: '<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>'
                    },
                    {
                        value: 'PRET',
                        class: 'inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-800 ring-1 ring-purple-600/20 ring-inset',
                        icon: '<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>'
                    },
                    {
                        value: 'AFFECTE',
                        class: 'inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800 ring-1 ring-slate-600/20 ring-inset',
                        icon: '<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>'
                    },
                    {
                        value: 'TERMINE',
                        class: 'inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800 ring-1 ring-slate-600/20 ring-inset',
                        icon: '<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>'
                    }
                ],
                badgeDefaultClass: 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset',
                cellRenderer: (value: any, column: any, row: any) => {
                    const teamName = value || ''
                    const status = row?.team2Status || ''
                    if (!teamName) return '-'
                    // Trouver le style de badge pour ce statut
                    const badgeStyle = column.badgeStyles?.find((s: any) => s.value === status)
                    const defaultClass = column.badgeDefaultClass || 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset'
                    const badgeClass = badgeStyle?.class || defaultClass
                    const icon = badgeStyle?.icon || ''

                    return `<span class="${badgeClass}">
                        ${icon}${teamName}
                    </span>`
                }
            },
            {
                field: 'date2',
                headerName: 'Date 2e Comptage',
                sortable: true,
                filterable: true,
                width: 100,
                flex: 1,
                editable: true,
                dataType: 'date' as const,
                editValueFormatter: (value: any) => {
                    if (!value || value === '') {
                        return 'Choisir une date...'
                    }
                    try {
                        const date = new Date(value)
                        if (isNaN(date.getTime())) return ''
                        return date.toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                        })
                    } catch {
                        return value
                    }
                }
            },
            {
                field: 'resources',
                headerName: 'Ressources',
                sortable: true,
                filterable: true,
                width: 100,
                flex: 1,
                editable: true,
                dataType: 'select' as const,
                multiple: true,
                editValueFormatter: (value: any) => {
                    if (!value || (Array.isArray(value) && value.length === 0)) {
                        return 'Sélectionner des ressources...'
                    }
                    if (Array.isArray(value)) {
                        return value.join(', ')
                    }
                    return value
                },
                filterConfig: {
                    dataType: 'select' as const,
                    operator: 'equals' as const,
                    options: resourceOptions.value
                }
            }
        ]

        return cols
    })

    const jobsLoading = computed(() => jobStore.loading)

    const syncJobsStateFromStandardParams = (standardParams: StandardDataTableParams) => {
        const pageSize = extractPageSizeFromStandardParams(standardParams, jobsPageSize.value)
        const page = extractPageFromStandardParams(standardParams, pageSize)
        const filters = extractFiltersFromStandardParams(standardParams, columns.value)
        const sortModel = extractSortFromStandardParams(standardParams, columns.value)

        jobsPageSize.value = pageSize
        jobsCurrentPage.value = page
        jobsFilters.value = filters

        if (sortModel.length > 0) {
            jobsSortModel.value = sortModel
        }

        if (standardParams['search[value]'] !== undefined) {
            jobsSearchQuery.value = standardParams['search[value]'] || ''
        }
    }

    const buildJobsStandardParams = (options?: {
        page?: number
        pageSize?: number
        filters?: Record<string, { filter: any; operator?: string }>
        sort?: Array<{ field: string; direction: 'asc' | 'desc' }>
        search?: string
    }): StandardDataTableParams => {
        return convertToStandardDataTableParams(
            {
                page: options?.page ?? jobsCurrentPage.value,
                pageSize: options?.pageSize ?? jobsPageSize.value,
                filters: options?.filters ?? jobsFilters.value,
                sort: (options?.sort ?? jobsSortModel.value).map(sort => ({
                    colId: sort.field,
                    sort: sort.direction
                })),
                globalSearch: options?.search ?? (jobsSearchQuery.value || undefined)
            },
            {
                columns: columns.value,
                draw: 1,
                customParams: {
                    inventory_id: inventoryId.value,
                    warehouse_id: warehouseId.value
                }
            }
        )
    }

    /**
     * Pagination calculée pour les jobs validés
     * Utilise le totalCount du store pour calculer les informations de pagination
     */
    const jobsPaginationComputed = computed(() => {
        const totalCount = jobStore.totalCount || 0
        const pageSizeValue = jobsPageSize.value || 20
        const currentPageValue = jobsCurrentPage.value || 1

        return {
            current_page: currentPageValue,
            total_pages: Math.max(1, Math.ceil(totalCount / pageSizeValue)),
            has_next: currentPageValue < Math.ceil(totalCount / pageSizeValue),
            has_previous: currentPageValue > 1,
            page_size: pageSizeValue,
            total: totalCount
        }
    })

    async function loadValidatedJobs(params?: StandardDataTableParams) {
        if (!inventoryId.value || !warehouseId.value) {
            logger.warn('Impossible de charger les jobs validés, IDs manquants')
            return
        }

        const finalParams = params ?? buildJobsStandardParams()
        lastJobsParams.value = finalParams
        syncJobsStateFromStandardParams(finalParams)

        try {
            // Utiliser les paramètres fournis ou construire à partir des valeurs actuelles
            let standardParams: StandardDataTableParams
            if (params && 'start' in params && 'length' in params) {
                // C'est déjà StandardDataTableParams
                standardParams = params
            } else {
                // Construire depuis les valeurs actuelles
                standardParams = buildJobsStandardParams()
            }

            // S'assurer que length et start sont bien définis
            if (!standardParams.length) {
                standardParams.length = jobsPageSize.value || 20
            }
            if (standardParams.start === undefined) {
                standardParams.start = ((jobsCurrentPage.value || 1) - 1) * (jobsPageSize.value || 20)
            }

            logger.debug('Chargement des jobs validés avec paramètres DataTable:', {
                inventoryId: inventoryId.value,
                warehouseId: warehouseId.value,
                pageSize: jobsPageSize.value,
                params: standardParams
            })

            await jobStore.fetchJobsValidated(inventoryId.value, warehouseId.value, standardParams)
            await nextTick()

            logger.debug('Jobs validés mis à jour dans le store', {
                count: jobStore.jobsValidated.length,
                totalCount: jobStore.totalCount,
                sample: jobStore.jobsValidated.slice(0, 2).map(j => ({ id: j.id, reference: j.reference }))
            })
        } catch (error) {
            logger.error('Erreur lors du chargement des jobs validés', error)
            throw error
        }
    }

    const refreshJobsData = async () => {
        await loadValidatedJobs(lastJobsParams.value ?? buildJobsStandardParams())
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
     * Sauvegarde toutes les modifications en attente
     */
    async function saveAllChanges() {
        if (pendingChanges.value.size === 0) {
            alertService.info({ text: 'Aucune modification à sauvegarder.' })
            return
        }

        try {
            alertService.info({ text: 'Sauvegarde en cours...' })

            // Préparer les données pour assignJobsManual
            const manualAssignments: JobManualAssignmentsRequest[] = []

            for (const [jobId, changes] of pendingChanges.value.entries()) {
                const jobData: JobManualAssignmentsRequest = {
                    job_id: parseInt(jobId),
                    team1: null,
                    date1: null,
                    team2: null,
                    date2: null,
                    resources: null
                }

                // Traiter chaque changement
                for (const [field, value] of changes.entries()) {
                    switch (field) {
                        case 'team1':
                            // Trouver l'ID de session par username
                            const team1Session = sessionStore.getAllSessions.find(s => s.username === value)
                            jobData.team1 = team1Session ? team1Session.id : null
                            break
                        case 'team2':
                            // Trouver l'ID de session par username
                            const team2Session = sessionStore.getAllSessions.find(s => s.username === value)
                            jobData.team2 = team2Session ? team2Session.id : null
                            break
                        case 'date1':
                            jobData.date1 = value
                            break
                        case 'date2':
                            jobData.date2 = value
                            break
                        case 'resources':
                            // Les ressources peuvent être des IDs ou des références
                            if (Array.isArray(value)) {
                                const resourceIds: number[] = []
                                for (const resourceValue of value) {
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
                                jobData.resources = resourceIds
                            }
                            break
                    }
                }

                manualAssignments.push(jobData)
            }

            // Envoyer les modifications via assignJobsManual
            await jobStore.assignJobsManual(manualAssignments)

            pendingChanges.value.clear()

            alertService.success({
                text: `${manualAssignments.length} modification(s) sauvegardée(s) avec succès !`
            })

            // Réinitialiser la sélection après la sauvegarde
            await clearAllSelections()

            await refreshJobsData()
        } catch (error) {
            logger.error('Erreur lors de la sauvegarde', error)
            alertService.error({
                title: 'Erreur de sauvegarde',
                text: 'Certaines modifications n\'ont pas pu être sauvegardées. Veuillez réessayer.'
            })
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
        await refreshJobsData()
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
     * Handler pour les changements de sélection
     *
     * @param selectedRowsSet - Set des IDs des lignes sélectionnées
     */
    function onSelectionChanged(selectedRowsSet: Set<string>) {
        const selectedRowNodes = displayData.value.filter(row =>
            selectedRowsSet.has(row.id) && !row.isChild
        )
        selectedRows.value = selectedRowNodes
    }

    /**
     * Handler pour le clic sur une ligne
     *
     * @param event - Événement de clic
     */
    function onRowClicked(event: any) {
        // Logique de clic sur ligne (à implémenter si nécessaire)
    }

    /**
     * Réinitialise toutes les sélections
     * Cette fonction met à jour à la fois l'état local et la sélection dans le DataTable
     */
    async function clearAllSelections() {
        // Réinitialiser d'abord l'état local
        selectedRows.value = []

        // Réinitialiser la sélection dans le DataTable via la ref
        // Cela va automatiquement émettre l'événement selection-changed qui mettra à jour selectedRows
        if (dataTableRef.value && typeof dataTableRef.value.clearAllSelections === 'function') {
            dataTableRef.value.clearAllSelections()
            // Attendre que la mise à jour se propage
            await nextTick()
        }
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
        if (!selectedRows.value.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' })
            return
        }

        // Filtrer les jobs éligibles (TRANSFERT, PRET, AFFECTE)
        const validStatuses = ['TRANSFERT', 'PRET', 'AFFECTE','VALIDE']
        const eligibleJobs = selectedRows.value.filter(job => validStatuses.includes(job.status))
        const ineligibleJobs = selectedRows.value.filter(job => !validStatuses.includes(job.status))

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
        selectedRows.value = eligibleJobs
        currentTeamType.value = 'premier'
        showTeamModal.value = true
        showDropdown.value = false
    }

    /**
     * Handler pour l'affectation du deuxième comptage
     */
    function handleAffecterDeuxiemeComptageClick() {
        if (!selectedRows.value.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' })
            return
        }

        // Filtrer les jobs éligibles (TRANSFERT, PRET, AFFECTE)
        const validStatuses = ['TRANSFERT', 'PRET', 'AFFECTE']
        const eligibleJobs = selectedRows.value.filter(job => validStatuses.includes(job.status))
        const ineligibleJobs = selectedRows.value.filter(job => !validStatuses.includes(job.status))

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
        selectedRows.value = eligibleJobs
        currentTeamType.value = 'deuxieme'
        showTeamModal.value = true
        showDropdown.value = false
    }

    /**
     * Handler pour l'affectation de ressources
     */
    function handleActionRessourceClick() {
        if (!selectedRows.value.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' })
            return
        }

        // Filtrer les jobs éligibles (TRANSFERT, PRET, AFFECTE)
        const validStatuses = ['TRANSFERT', 'PRET', 'AFFECTE']
        const eligibleJobs = selectedRows.value.filter(job => validStatuses.includes(job.status))
        const ineligibleJobs = selectedRows.value.filter(job => !validStatuses.includes(job.status))

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
        selectedRows.value = eligibleJobs
        showResourceModal.value = true
        showDropdown.value = false
    }

    /**
     * Handler pour la validation (désactivée pour l'instant)
     */
    async function handleValiderClick() {
        if (!selectedRows.value.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' })
            return
        }
        alertService.info({ text: 'La fonction de validation est désactivée pour l\'instant.' })

        // Réinitialiser la sélection après la validation
        await clearAllSelections()

        await refreshJobsData()
    }

    /**
     * Handler pour mettre les jobs en statut "Prêt"
     */
    async function handleReadyClick() {
        if (!selectedRows.value.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' })
            return
        }

        // Vérifier que tous les jobs sélectionnés ont le statut "AFFECTE"
        const jobsWithInvalidStatus = selectedRows.value.filter(row => row.status !== 'AFFECTE')

        if (jobsWithInvalidStatus.length > 0) {
            const jobIds = jobsWithInvalidStatus.map(row => row.job || row.id).join(', ')
            alertService.warning({
                text: `Seuls les jobs avec le statut "AFFECTE" peuvent être mis en statut "Prêt". Les jobs suivants ne sont pas affectés : ${jobIds}`
            })
            return
        }

        try {
            const jobIds: number[] = selectedRows.value.map(r => parseInt(r.id))
            await jobStore.jobReady(jobIds)
            alertService.success({ text: `${jobIds.length} job(s) mis en statut 'Prêt' avec succès !` })

            // Réinitialiser la sélection après la mise en statut "Prêt"
            await clearAllSelections()

            await refreshJobsData()
        } catch (error) {
            // Extraire et afficher le message d'erreur backend
            const errorMessage = Validators.extractBackendError(error, 'Erreur lors de la mise en statut "Prêt" des jobs')
            alertService.error({ text: errorMessage })
            logger.error('Erreur lors de la mise en statut "Prêt" des jobs', error)
        }
    }

    /**
     * Handler pour réinitialiser les jobs
     */
    async function handleResetClick() {
        if (!selectedRows.value.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' })
            return
        }
        const jobIds: number[] = selectedRows.value.map(r => parseInt(r.id))
        await jobStore.jobReset(jobIds)
        alertService.success({ text: `${jobIds.length} job(s) réinitialisés avec succès !` })

        // Réinitialiser la sélection après la réinitialisation des jobs
        await clearAllSelections()

        await refreshJobsData()
    }

    /**
     * Handler pour le transfert de jobs
     */
    const handleTransferClick = () => {
        if (!selectedRows.value.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' })
            return
        }

        // Filtrer les jobs éligibles pour le transfert
        // - Jobs avec statut TRANSFERT ou PRET
        // - Jobs avec statut ENTAME qui ont au moins un assignment TRANSFERT ou PRET
        const eligibleJobs = selectedRows.value.filter(job => {
            // Jobs avec statut TRANSFERT ou PRET sont toujours éligibles
            if (job.status === 'TRANSFERT' || job.status === 'PRET') {
                return true
            }

            // Jobs ENTAME sont éligibles s'ils ont au moins un assignment TRANSFERT ou PRET
            if (job.status === 'ENTAME') {
                return hasTransferableAssignment(job.id)
            }

            return false
        })

        const ineligibleJobs = selectedRows.value.filter(job => !eligibleJobs.includes(job))

        if (eligibleJobs.length === 0) {
            alertService.warning({
                text: 'Aucun job éligible pour le transfert. Seuls les jobs en statut TRANSFERT ou PRET, ou les jobs ENTAME avec au moins un assignment TRANSFERT ou PRET peuvent être transférés.'
            })
            return
        }

        if (ineligibleJobs.length > 0) {
            alertService.info({
                text: `${eligibleJobs.length} job(s) éligible(s). ${ineligibleJobs.length} job(s) ne sont pas éligibles (statuts: ${ineligibleJobs.map(j => j.status).join(', ')})`
            })
        }

        // Utiliser uniquement les jobs éligibles
        selectedRows.value = eligibleJobs
        showTransferModal.value = true
    }

    /**
     * Handler pour l'action manuelle de jobs
     */
    const handleManualClick = () => {
        if (!selectedRows.value.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' })
            return
        }

        // Filtrer les jobs éligibles pour l'action manuelle
        // - Uniquement les jobs avec statut PRET ou TRANSFERT
        const eligibleJobs = eligibleJobsForManual.value
        const ineligibleJobs = selectedRows.value.filter(job => !eligibleJobs.includes(job))

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
        selectedRows.value = eligibleJobs
        showManualModal.value = true
    }

    /**
     * Handler pour la soumission du formulaire de transfert
     *
     * @param data - Données du formulaire (premierComptage, deuxiemeComptage)
     */
    const handleTransferSubmit = async (data: Record<string, unknown>) => {
        const { premierComptage, deuxiemeComptage } = data as { premierComptage: boolean; deuxiemeComptage: boolean }

        // Déterminer les ordres de comptage à transférer
        const countingOrder: number[] = []
        if (premierComptage) countingOrder.push(1)
        if (deuxiemeComptage) countingOrder.push(2)

        if (countingOrder.length === 0) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un comptage à transférer.' })
            return
        }

        // Utiliser uniquement les jobs éligibles
        // - Jobs avec statut TRANSFERT ou PRET
        // - Jobs avec statut ENTAME qui ont au moins un assignment TRANSFERT ou PRET
        const eligibleJobIds = selectedRows.value
            .filter(job => {
                // Jobs avec statut TRANSFERT ou PRET sont toujours éligibles
                if (job.status === 'TRANSFERT' || job.status === 'PRET') {
                    return true
                }

                // Jobs ENTAME sont éligibles s'ils ont au moins un assignment TRANSFERT ou PRET
                if (job.status === 'ENTAME') {
                    return hasTransferableAssignment(job.id)
                }

                return false
            })
            .map(r => parseInt(r.id))

        try {
            await jobStore.jobTransfer(eligibleJobIds, countingOrder)

            alertService.success({
                text: `${eligibleJobIds.length} job(s) transféré(s) avec succès pour ${countingOrder.length === 2 ? 'les deux comptages' : countingOrder[0] === 1 ? 'le 1er comptage' : 'le 2e comptage'}`
            })

            showTransferModal.value = false
            transferForm.value = { premierComptage: false, deuxiemeComptage: false }

            // Réinitialiser la sélection après le transfert
            await clearAllSelections()

            await refreshJobsData()
        } catch (error) {
            logger.error('Erreur lors du transfert des jobs', error)
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
        const eligibleJobIds = eligibleJobsForManual.value.map(r => parseInt(r.id))

        try {
            await jobStore.jobTransfer(eligibleJobIds, countingOrder)

            alertService.success({
                text: `${eligibleJobIds.length} job(s) lancé(s) manuellement avec succès pour ${countingOrder.length === 2 ? 'les deux comptages' : countingOrder[0] === 1 ? 'le 1er comptage' : 'le 2e comptage'}`
            })

            showManualModal.value = false
            manualForm.value = { premierComptage: false, deuxiemeComptage: false }

            // Réinitialiser la sélection après l'action manuelle
            await clearAllSelections()

            await refreshJobsData()
        } catch (error) {
            logger.error('Erreur lors de l\'action manuelle des jobs', error)
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

        const jobIds = selectedRows.value.map(r => r.id)

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
            await clearAllSelections()

            await refreshJobsData()
        } catch (error) {
            logger.error('Erreur lors de l\'affectation des ressources', error)
            alertService.error({
                text: 'Erreur lors de l\'affectation des ressources'
            })
        }
    }

    /**
     * Handler pour la soumission du formulaire d'affectation d'équipe
     *
     * @param data - Données du formulaire (team, date)
     */
    async function handleTeamSubmit(data: Record<string, unknown>) {
        const { team, date } = data as { team: string; date: string }
        const jobIds = selectedRows.value.map(r => r.id)

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
            await clearAllSelections()

            await refreshJobsData()
        } catch (error) {
            logger.error('Erreur lors de l\'affectation de l\'équipe', error)
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

    // ===== LIFECYCLE =====

    /**
     * Initialisation au montage du composant
     */
    onMounted(async () => {
        try {
            logger.debug('Initialisation de useAffecter', {
                inventoryReference,
                warehouseReference
            })

            // Charger les stores en tâche de fond
            void initializeStores()

            isInitializing.value = true
            try {
                await initializeIdsFromReferences()

                logger.debug('IDs résolus', {
                    inventoryId: inventoryId.value,
                    warehouseId: warehouseId.value
                })

                await initializeDataTable()

                // Rafraîchir le statut sans bloquer l'affichage
                fetchInventoryStatus().catch(error => {
                    logger.warn('Erreur lors de la récupération du statut de l\'inventaire (non bloquant)', error)
                })
            } finally {
                isInitializing.value = false
            }
        } catch (error) {
            logger.error('Erreur lors de l\'initialisation', error)
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

    // ===== RETURN =====

    return {
        // Données
        displayData,
        selectedRows,
        pendingChanges,
        hasUnsavedChanges,

        // Références
        dataTableRef,
        dropdownRef,

        // État des modales
        showDropdown,
        showTeamModal,
        showResourceModal,
        showTransferModal,
        showManualModal,
        modalTitle,

        // Formulaires
        teamForm,
        teamFields,
        resourceForm,
        resourceFields,
        transferForm,
        transferFields,
        manualForm,

        // Dropdown
        dropdownItems,

        // Actions
        saveAllChanges,
        resetAllChanges,
        clearAllSelections,
        onCellValueChanged,
        onSelectionChanged,
        onRowClicked,

        // Gestion du dropdown
        toggleDropdown,
        focusFirstItem,
        closeDropdown,
        focusNextItem,
        focusPrevItem,
        setDropdownItemRef,

        // Handlers d'actions
        handleValiderClick,
        handleResourceSubmit,
        handleTeamSubmit,
        handleTransferSubmit,
        handleManualSubmit,
        handleReadyClick,
        handleResetClick,
        handleGoToInventoryDetail,
        handleGoToAffectation,
        handleTransferClick,
        handleManualClick,

        // Pagination et filtrage
        currentPage: computed(() => jobsCurrentPage.value),
        pageSize: computed(() => jobsPageSize.value),

        // QueryModel
        queryModel: computed(() => queryModelRef.value),
        queryOutputMode: computed(() => queryOutputMode.value),
        convertQueryModelToOutput,
        totalPages: computed(() => jobsPaginationComputed.value.total_pages),
        totalItems: computed(() => jobsPaginationComputed.value.total),
        jobsPagination: jobsPaginationComputed,
        jobsTotalItems: computed(() => jobStore.totalCount || 0),
        loading: jobsLoading,
        handlePaginationChanged,
        handleSortChanged,
        handleFilterChanged,
        handleGlobalSearchChanged,

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
        columns,
        sessionOptions,
        resourceOptions,
        showTransferButton,
        showManualButton,
        showReadyButton,
        showResetButton,

        // Utilitaires
        loadSessionsIfNeeded,
        dateValueParser,
        dateValueSetter
    }
}
