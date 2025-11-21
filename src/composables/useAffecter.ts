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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

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

// ===== IMPORTS COMPOSABLES =====
import { useJobValidatedDataTable } from '@/composables/useJobValidatedDataTable'

// ===== IMPORTS TYPES =====
import type { FieldConfig } from '@/interfaces/form'
import { JobManualAssignmentsRequest } from '@/models/Job'
import type { StandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter'

// ===== INITIALISATION DES STORES =====
const jobStore = useJobStore()
const resourceStore = useResourceStore()
const warehouseStore = useWarehouseStore()
const inventoryStore = useInventoryStore()
const sessionStore = useSessionStore()
const route = useRoute()

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
const fetchInventoryIdByReference = async (reference: string): Promise<number | null> => {
    try {
        logger.debug('Résolution de l\'ID de l\'inventaire par référence', { reference })

        // Utiliser fetchInventoryByReference qui récupère directement l'inventaire par référence
        const inventory = await inventoryStore.fetchInventoryByReference(reference)

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

    /** Type d'équipe en cours d'affectation */
    const currentTeamType = ref<'premier' | 'deuxieme'>('premier')

    /** Formulaires */
    const teamForm = ref<Record<string, unknown>>({ team: '', date: '' })
    const resourceForm = ref({ resources: [] })
    const transferForm = ref({ premierComptage: false, deuxiemeComptage: false })

    /** Titre de la modale d'équipe */
    const modalTitle = computed(() => `Affecter ${currentTeamType.value === 'premier' ? 'Premier' : 'Deuxième'} Comptage`)

    // ===== RÉFÉRENCES COMPOSANTS =====

    /** Référence au composant DataTable */
    const dataTableRef = ref<any>(null)

    /** Référence au dropdown d'actions */
    const dropdownRef = ref<HTMLElement | null>(null)

    /** État d'ouverture du dropdown */
    const showDropdown = ref(false)

    /** Référence au composable DataTable pour les jobs validés */
    const jobValidatedDataTableRef = ref<any>(null)

    /** Statut de l'inventaire */
    const inventoryStatus = ref<string>('')

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
                fetchInventoryIdByReference(inventoryReference).then(id => {
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
        try {
            const inventory = await inventoryStore.fetchInventoryByReference(inventoryReference)
            if (inventory) {
                inventoryStatus.value = inventory.status
            }
        } catch (error) {
            logger.error('Erreur lors de la récupération du statut de l\'inventaire', error)
        }
    }

    /**
     * Initialise le composable DataTable
     */
    const initializeDataTable = async () => {
        if (inventoryId.value && warehouseId.value && !jobValidatedDataTableRef.value) {
            logger.debug('Initialisation du DataTable pour les jobs validés', {
                inventoryId: inventoryId.value,
                warehouseId: warehouseId.value
            })
            jobValidatedDataTableRef.value = useJobValidatedDataTable(inventoryId.value, warehouseId.value)

            // Charger les données immédiatement après l'initialisation
            if (jobValidatedDataTableRef.value?.loadData) {
                logger.debug('Chargement des données du DataTable')
                await jobValidatedDataTableRef.value.loadData()
            }
        } else {
            logger.warn('Impossible d\'initialiser le DataTable, IDs manquants', {
                inventoryId: inventoryId.value,
                warehouseId: warehouseId.value,
                hasDataTable: !!jobValidatedDataTableRef.value
            })
        }
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
     * Watch pour réinitialiser le composable quand les IDs changent
     */
    watch([inventoryId, warehouseId], async ([newInventoryId, newWarehouseId]) => {
        if (newInventoryId && newWarehouseId && !jobValidatedDataTableRef.value) {
            logger.debug('Watch: Initialisation du DataTable suite au changement des IDs', {
                inventoryId: newInventoryId,
                warehouseId: newWarehouseId
            })
            jobValidatedDataTableRef.value = useJobValidatedDataTable(newInventoryId, newWarehouseId)

            // Charger les données immédiatement après l'initialisation
            if (jobValidatedDataTableRef.value?.loadData) {
                logger.debug('Watch: Chargement des données du DataTable')
                await jobValidatedDataTableRef.value.loadData()
            }
        }
    })

    // ===== HANDLERS DATATABLE =====

    /**
     * Handler pour les changements de pagination
     * Accepte soit le format standard DataTable (venant du composant), soit l'ancien format
     *
     * @param params - Paramètres de pagination (format standard ou ancien format)
     */
    const handlePaginationChanged = async (params: { page: number, pageSize: number } | StandardDataTableParams) => {
        if (!jobValidatedDataTableRef.value) return

        // Si c'est déjà le format standard (venant du DataTable), utiliser directement
        if ('draw' in params && 'start' in params && 'length' in params) {
            await jobValidatedDataTableRef.value.handlePaginationChanged(params as StandardDataTableParams)
            return
        }

        // Sinon, convertir l'ancien format
        const paginationParams = params as { page: number, pageSize: number }
        await jobValidatedDataTableRef.value.handlePaginationChanged({ page: paginationParams.page, pageSize: paginationParams.pageSize })
    }

    /**
     * Handler pour les changements de tri
     * Accepte soit le format standard DataTable (venant du composant), soit l'ancien format
     *
     * @param sortModel - Modèle de tri (format standard ou ancien format)
     */
    const handleSortChanged = async (sortModel: Array<{ field: string; direction: 'asc' | 'desc' }> | StandardDataTableParams) => {
        if (!jobValidatedDataTableRef.value) return

        // Si c'est déjà le format standard (venant du DataTable), utiliser directement
        if ('draw' in sortModel && 'start' in sortModel && 'length' in sortModel) {
            await jobValidatedDataTableRef.value.handleSortChanged(sortModel as StandardDataTableParams)
            return
        }

        // Sinon, convertir l'ancien format
        const sortModelArray = sortModel as Array<{ field: string; direction: 'asc' | 'desc' }>
        await jobValidatedDataTableRef.value.handleSortChanged(sortModelArray)
    }

    /**
     * Handler pour les changements de filtres
     * Accepte soit le format standard DataTable (venant du composant), soit l'ancien format
     *
     * @param filterModel - Modèle de filtres (format standard ou ancien format)
     */
    const handleFilterChanged = async (filterModel: Record<string, any> | StandardDataTableParams) => {
        if (!jobValidatedDataTableRef.value) return

        // Si c'est déjà le format standard (venant du DataTable), utiliser directement
        if ('draw' in filterModel && 'start' in filterModel && 'length' in filterModel) {
            await jobValidatedDataTableRef.value.handleFilterChanged(filterModel as StandardDataTableParams)
            return
        }

        // Sinon, convertir l'ancien format
        const filterModelObj = filterModel as Record<string, any>
        await jobValidatedDataTableRef.value.handleFilterChanged(filterModelObj)
    }

    /**
     * Handler pour les changements de recherche globale
     * Accepte soit le format standard DataTable (venant du composant), soit l'ancien format
     *
     * @param searchTerm - Terme de recherche (format standard ou string)
     */
    const handleGlobalSearchChanged = async (searchTerm: string | StandardDataTableParams) => {
        if (!jobValidatedDataTableRef.value) return

        // Si c'est déjà le format standard (venant du DataTable), utiliser directement
        if (typeof searchTerm === 'object' && 'draw' in searchTerm && 'start' in searchTerm && 'length' in searchTerm) {
            await jobValidatedDataTableRef.value.handleSearchChanged(searchTerm as StandardDataTableParams)
            return
        }

        // Sinon, utiliser directement la valeur string
        await jobValidatedDataTableRef.value.handleSearchChanged(searchTerm as string)
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

        if (resources.length === 0) {
            resourceStore.fetchResources()
            return []
        }

        const options = resources.map(resource => ({
            value: resource.id?.toString() || resource.reference,
            label: resource.ressource_nom || resource.reference || `Ressource ${resource.reference}`
        }))
        return options
    })

    /**
     * Données formatées pour l'affichage dans le DataTable
     */
    const displayData = computed(() => {
        // Utiliser les données du composable générique si disponible, sinon fallback sur le store
        const jobs = jobValidatedDataTableRef.value?.data.value || jobStore.jobsValidated
        const newData: RowNode[] = []

        jobs.forEach((parentRow) => {
            // Trouver les assignments pour premier et deuxième comptage
            const premierAssignment = parentRow.assignments?.find(a => a.counting_order === 1)
            const deuxiemeAssignment = parentRow.assignments?.find(a => a.counting_order === 2)

            // Formater les ressources
            const ressourcesList = (parentRow.ressources || []).map(r => r.reference)
            const ressourcesString = ressourcesList.length > 0 ? ressourcesList.join(', ') : ''

            // Formater les équipes - session est un objet avec username et id
            const team1Name = premierAssignment?.session?.username || premierAssignment?.session?.id?.toString() || ''
            const team2Name = deuxiemeAssignment?.session?.username || deuxiemeAssignment?.session?.id?.toString() || ''

            // Extraire les statuts des assignments
            const team1Status = premierAssignment?.status || ''
            const team2Status = deuxiemeAssignment?.status || ''

            // Formater les emplacements avec toutes leurs propriétés
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
                job: parentRow.reference || `Job ${parentRow.id}`, // Référence du job
                locations: locations, // Emplacements pour la nestedTable
                team1: team1Name,
                team1Status: team1Status,
                date1: premierAssignment?.date_start || '',
                team2: team2Name,
                team2Status: team2Status,
                date2: deuxiemeAssignment?.date_start || '',
                resourcesList: ressourcesList,
                resources: ressourcesString,
                nbResources: ressourcesList.length,
                status: (['AFFECTE', 'VALIDE', 'TRANSFERT', 'PRET', 'ENTAME'].includes(String(parentRow.status)) ? String(parentRow.status) : 'AFFECTE') as 'AFFECTE' | 'VALIDE' | 'TRANSFERT' | 'PRET' | 'ENTAME',
                isChild: false,
                parentId: null
            })
        })

        return newData
    })

    /**
     * Vérifie si un job a au moins un assignment avec le statut TRANSFERT ou PRET
     *
     * @param jobId - ID du job
     * @returns true si le job a au moins un assignment TRANSFERT ou PRET
     */
    const hasTransferableAssignment = (jobId: string): boolean => {
        // Récupérer les données originales du job
        const jobs = jobValidatedDataTableRef.value?.data.value || jobStore.jobsValidated
        const job = jobs.find((j: any) => String(j.id) === jobId)

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
     * Afficher le bouton de transfert si l'inventaire est en réalisation
     */
    const showTransferButton = computed(() => {
        return inventoryStatus.value === 'EN REALISATION'
    })

    /**
     * Afficher le bouton prêt si l'inventaire est en préparation
     */
    const showReadyButton = computed(() => {
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
            clearAllSelections()

            if (jobValidatedDataTableRef.value) {
                await jobValidatedDataTableRef.value.refresh()
            }
        } catch (error) {
            logger.error('Erreur lors de la sauvegarde', error)
            alertService.error({
                title: 'Erreur de sauvegarde',
                text: 'Certaines modifications n\'ont pas pu être sauvegardées. Veuillez réessayer.'
            })
        }
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
     */
    function clearAllSelections() {
        selectedRows.value = []
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
        clearAllSelections()

        if (jobValidatedDataTableRef.value) {
            await jobValidatedDataTableRef.value.refresh()
        }
    }

    /**
     * Handler pour mettre les jobs en statut "Prêt"
     */
    async function handleReadyClick() {
        if (!selectedRows.value.length) {
            alertService.warning({ text: 'Veuillez sélectionner au moins un job.' })
            return
        }
        const jobIds: number[] = selectedRows.value.map(r => parseInt(r.id))
        await jobStore.jobReady(jobIds)
        alertService.success({ text: `${jobIds.length} job(s) mis en statut 'Prêt' avec succès !` })

        // Réinitialiser la sélection après la mise en statut "Prêt"
        clearAllSelections()

        if (jobValidatedDataTableRef.value) {
            await jobValidatedDataTableRef.value.refresh()
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
        clearAllSelections()

        if (jobValidatedDataTableRef.value) {
            await jobValidatedDataTableRef.value.refresh()
        }
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
            clearAllSelections()

            if (jobValidatedDataTableRef.value) {
                await jobValidatedDataTableRef.value.refresh()
            }
        } catch (error) {
            logger.error('Erreur lors du transfert des jobs', error)
            alertService.error({
                text: 'Erreur lors du transfert des jobs'
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
            clearAllSelections()

            if (jobValidatedDataTableRef.value) {
                await jobValidatedDataTableRef.value.refresh()
            }
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
            clearAllSelections()

            if (jobValidatedDataTableRef.value) {
                await jobValidatedDataTableRef.value.refresh()
            }
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

            // Paralléliser l'initialisation des stores et des IDs pour améliorer les performances
            await Promise.all([
                initializeStores(),
                initializeIdsFromReferences()
            ])

            logger.debug('IDs résolus', {
                inventoryId: inventoryId.value,
                warehouseId: warehouseId.value
            })

            // Une fois les IDs obtenus, initialiser le DataTable et charger les données
            await initializeDataTable()

            // Charger le statut de l'inventaire en parallèle (non bloquant)
            fetchInventoryStatus().catch(error => {
                logger.warn('Erreur lors de la récupération du statut de l\'inventaire (non bloquant)', error)
            })
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
        modalTitle,

        // Formulaires
        teamForm,
        teamFields,
        resourceForm,
        resourceFields,
        transferForm,
        transferFields,

        // Dropdown
        dropdownItems,

        // Actions
        saveAllChanges,
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
        handleReadyClick,
        handleResetClick,
        handleGoToInventoryDetail,
        handleGoToAffectation,
        handleTransferClick,

        // Pagination et filtrage
        currentPage: computed(() => jobValidatedDataTableRef.value?.currentPage.value || 1),
        totalPages: computed(() => jobValidatedDataTableRef.value?.pagination.value.total_pages || 1),
        totalItems: computed(() => jobValidatedDataTableRef.value?.pagination.value.total || 0),
        loading: computed(() => jobValidatedDataTableRef.value?.loading.value || false),
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
        columns,
        sessionOptions,
        resourceOptions,
        showTransferButton,
        showReadyButton,

        // Utilitaires
        loadSessionsIfNeeded,
        dateValueParser,
        dateValueSetter
    }
}
