/**
 * Composable pour la gestion du planning d'inventaire
 *
 * Ce composable gère :
 * - Les jobs d'inventaire (création, validation, suppression)
 * - Les locations disponibles (affichage, sélection, filtrage)
 * - La pagination et le tri côté serveur pour les deux DataTables
 * - Utilise UNIQUEMENT QueryModel comme format de communication avec le DataTable
 *
 * Format de communication :
 * - Tous les handlers reçoivent et émettent des QueryModel
 * - Le QueryModel est converti vers query params GET pour les appels API
 * - Conforme à PAGINATION_FRONTEND.md
 *
 * @module usePlanning
 */

// ===== IMPORTS VUE =====
import { ref, computed, markRaw, onMounted, nextTick, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import type { Router } from 'vue-router'

// ===== IMPORTS COMPOSABLES =====

// ===== IMPORTS SERVICES =====
import { alertService } from '@/services/alertService'
import { LocationService } from '@/services/LocationService'

// ===== IMPORTS PINIA =====

// ===== IMPORTS STORES =====
import { useJobStore } from '@/stores/job'
import { useLocationStore } from '@/stores/location'
import { useInventoryStore } from '@/stores/inventory'
import { useWarehouseStore } from '@/stores/warehouse'

// ===== IMPORTS UTILS =====
import { useQueryModel } from '@/components/DataTable/composables/useQueryModel'
import { convertQueryModelToQueryParams, mergeQueryModelWithCustomParams } from '@/components/DataTable/utils/queryModelConverter'
import type { QueryModel } from '@/components/DataTable/types/QueryModel'

// ===== IMPORTS TYPES =====
import type { DataTableColumn, ColumnDataType, ActionConfig } from '@/types/dataTable'
import type { Job, JobTable } from '@/models/Job'
import type { Location } from '@/models/Location'
import type { ButtonGroupButton } from '@/components/Form/ButtonGroup.vue'

// ===== IMPORTS COMPOSANTS =====
import IconCheck from '@/components/icon/icon-check.vue'
import IconTrash from '@/components/icon/icon-trash.vue'
import IconXCircle from '@/components/icon/icon-x-circle.vue'
import IconEye from '@/components/icon/icon-eye.vue'
import IconUser from '@/components/icon/icon-user.vue'
import IconArrowLeft from '@/components/icon/icon-arrow-left.vue'
import IconPlus from '@/components/icon/icon-plus.vue'

// ===== INTERFACES =====

/**
 * Options pour initialiser le composable de planning
 */
interface PlanningOptions {
    /** Référence de l'inventaire */
    inventoryReference?: string
    /** Référence de l'entrepôt */
    warehouseReference?: string
}

// ===== COMPOSABLE =====

/**
 * Composable pour la gestion du planning d'inventaire
 *
 * @param options - Options d'initialisation (références d'inventaire et d'entrepôt)
 * @returns Objet contenant l'état, les méthodes et les handlers pour le planning
 */
export function usePlanning(options?: PlanningOptions) {
    // ===== ROUTER & STORES =====
    const route = useRoute()
    const router = useRouter()
    const jobStore = useJobStore()
    const locationStore = useLocationStore()
    const inventoryStore = useInventoryStore()
    const warehouseStore = useWarehouseStore()

// Utiliser storeToRefs pour accéder aux données de manière réactive
const { jobs } = storeToRefs(jobStore)
const { locations } = storeToRefs(locationStore)

// Accès aux métadonnées de pagination des stores
const jobPaginationMetadata = computed(() => jobStore.paginationMetadata)
const locationPaginationMetadata = computed(() => locationStore.paginationMetadata)

    // ===== ÉTAT LOCAL =====

    /** Référence de l'inventaire (depuis les options ou la route) */
    const inventoryReference = options?.inventoryReference ?? (route.params.reference as string)

    /** Référence de l'entrepôt (depuis les options ou la route) */
    const warehouseReference = options?.warehouseReference ?? (route.params.warehouse as string)

    /** ID de l'inventaire (résolu depuis la référence) */
    const inventoryId = ref<number | null>(null)

    /** ID de l'entrepôt (résolu depuis la référence) */
    const warehouseId = ref<number | null>(null)

    /** ID du compte (récupéré depuis l'inventaire) */
    const accountId = ref<number | null>(null)

    /** Indicateur d'initialisation */
    const isInitialized = ref(false)

    /** Indicateur d'initialisation en cours pour éviter les appels multiples */
    const isInitializing = ref(false)


    /** États de chargement locaux pour afficher le skeleton immédiatement */
    const jobsLoadingLocal = ref(false)
    const locationsLoadingLocal = ref(false)

    // File d'attente pour les événements DataTable qui arrivent avant l'initialisation
    const jobsPendingEventsQueue: Array<{ eventType: string; queryModel: QueryModel }> = []
    const locationsPendingEventsQueue: Array<{ eventType: string; queryModel: QueryModel }> = []

    // ===== SÉLECTIONS =====

    /** IDs des locations disponibles sélectionnées */
    const selectedAvailableLocations = ref<string[]>([])

    /** IDs des jobs sélectionnés */
    const selectedJobs = ref<string[]>([])

    // ===== ÉTATS LOCAUX =====

    /** États de chargement */
    const jobsLoading = computed(() => jobsLoadingLocal.value)
    const locationsLoading = computed(() => locationsLoadingLocal.value)
    const loading = ref(false)

    /** États d'erreur */
    const jobsError = ref<string | null>(null)
    const locationsError = ref<string | null>(null)

    /** État de chargement de l'interface */
    const isDataLoaded = ref(false)

    // ===== ÉTATS POUR LES TOOLTIPS =====

    /** États des tooltips */
    const showStatusLegend = ref(false)
    const statusLegendTooltip = ref<HTMLElement | null>(null)
    const tooltipElement = ref<HTMLElement | null>(null)
    const tooltipStyle = ref<Record<string, string>>({})
    let tooltipTimeoutId: number | null = null

    // ===== ÉTATS POUR LES MODALS =====

    /** États des modals */
    const showAddToJobModal = ref(false)
    const selectedJobForModal = ref<string | number | null>(null)

    /**
     * Afficher le tooltip des statuts
     */
    const showStatusTooltip = async () => {
        if (tooltipTimeoutId) clearTimeout(tooltipTimeoutId)
        tooltipTimeoutId = window.setTimeout(async () => {
            showStatusLegend.value = true
            await nextTick()
            positionStatusTooltip()
        }, 300)
    }

    /**
     * Masquer le tooltip des statuts
     */
    const hideStatusTooltip = () => {
        if (tooltipTimeoutId) {
            clearTimeout(tooltipTimeoutId)
            tooltipTimeoutId = null
        }
        showStatusLegend.value = false
    }

    /**
     * Positionner le tooltip des statuts
     */
    const positionStatusTooltip = () => {
        if (!statusLegendTooltip.value || !tooltipElement.value) return

        const containerRect = statusLegendTooltip.value.getBoundingClientRect()
        const tooltipRect = tooltipElement.value.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        // Positionner le tooltip en bas à droite du bouton
        let top = containerRect.bottom + 8
        let left = containerRect.right - tooltipRect.width

        // Ajuster si le tooltip dépasse de l'écran
        if (left < 8) left = 8
        if (left + tooltipRect.width > viewportWidth - 8) {
            left = viewportWidth - tooltipRect.width - 8
        }
        if (top + tooltipRect.height > viewportHeight - 8) {
            top = containerRect.top - tooltipRect.height - 8
        }

        tooltipStyle.value = {
            top: `${top}px`,
            left: `${left}px`
        }
    }

    // ===== BOUTONS D'ACTIONS =====

    /**
     * Boutons de navigation (Header)
     */
    const navigationButtons = computed<ButtonGroupButton[]>(() => [
        {
            id: 'detail',
            label: 'Détail',
            icon: markRaw(IconEye),
            onClick: () => { handleGoToInventoryDetail() },
            class: 'text-primary bg-white dark:bg-gray-800 border-2 border-primary hover:bg-primary hover:text-white disabled:hover:bg-white disabled:hover:text-primary'
        },
        {
            id: 'affecter',
            label: 'Affecter',
            icon: markRaw(IconUser),
            onClick: () => { handleGoToAffectation() },
            class: 'text-primary bg-white dark:bg-gray-800 border-2 border-l-0 border-primary hover:bg-primary hover:text-white disabled:hover:bg-white disabled:hover:text-primary'
        }
    ])

    /**
     * Boutons d'actions pour les jobs créés
     */
    const jobsActionButtons = computed<ButtonGroupButton[]>(() => [
        {
            id: 'validate-all',
            label: 'Valider tous',
            icon: markRaw(IconCheck),
            variant: 'success',
            onClick: async () => { await validateAllJobs() },
            class: 'text-white bg-green-600 border-2 border-green-600 hover:bg-green-700 hover:text-white'
        },
        {
            id: 'validate',
            label: `Valider (${selectedJobsCount.value})`,
            icon: markRaw(IconCheck),
            onClick: async () => { await bulkValidateJobs() },
            disabled: selectedJobsCount.value === 0,
            class: 'text-primary bg-white dark:bg-gray-800 border-2 border-primary hover:bg-primary hover:text-white disabled:hover:bg-white disabled:hover:text-primary'
        },
        {
            id: 'return',
            label: `Retourner (${selectedJobsCount.value})`,
            icon: markRaw(IconArrowLeft),
            onClick: async () => { await bulkResetJobs() },
            disabled: selectedJobsCount.value === 0,
            class: 'text-primary bg-white dark:bg-gray-800 border-2 border-l-0 border-primary hover:bg-primary hover:text-white disabled:hover:bg-white disabled:hover:text-primary'
        }
    ])

    /**
     * Boutons d'actions pour les emplacements disponibles
     */
    const locationsActionButtons = computed<ButtonGroupButton[]>(() => [
        {
            id: 'create-job',
            label: `Créer Job (${selectedAvailableLocations.value.length})`,
            icon: markRaw(IconPlus),
            onClick: async () => { await createJobFromSelectedLocations() },
            disabled: selectedAvailableLocations.value.length === 0,
            class: 'text-primary bg-white dark:bg-gray-800 border-2 border-primary hover:bg-primary hover:text-white disabled:hover:bg-white disabled:hover:text-primary'
        },
        {
            id: 'add-to-job',
            label: `Ajouter (${selectedAvailableLocations.value.length})`,
            icon: markRaw(IconPlus),
            onClick: () => { openAddToJobModal() },
            disabled: selectedAvailableLocations.value.length === 0,
            visible: hasAvailableJobs.value,
            class: 'text-primary bg-white dark:bg-gray-800 border-2 border-l-0 border-primary hover:bg-primary hover:text-white disabled:hover:bg-white disabled:hover:text-primary'
        },
        {
            id: 'deactivate',
            label: `Désactiver (${selectedAvailableLocations.value.length})`,
            icon: markRaw(IconXCircle),
            onClick: async () => { await bulkDeactivateLocations() },
            disabled: selectedAvailableLocations.value.length === 0,
            class: 'text-red-600 bg-white dark:bg-gray-800 border-2 border-red-600 hover:bg-red-600 hover:text-white disabled:hover:bg-white disabled:hover:text-red-600'
        }
    ])

    // ===== COLONNES DES DATATABLES =====

    /**
     * Configuration des colonnes pour la DataTable des jobs
     */
    const jobsColumns = computed<DataTableColumn[]>(() => [
        {
            headerName: 'Référence',
            field: 'reference',
            sortable: true,
            dataType: 'text' as ColumnDataType,
            filterable: true,
            width: 200,
            editable: false,
            visible: true,
            draggable: true,
            autoSize: true,
            icon: 'icon-file-text',
            description: 'Référence du job'
        },
        {
            headerName: 'Statut',
            field: 'status',
            sortable: true,
            dataType: 'select' as ColumnDataType,
            filterable: true,
            width: 150,
            editable: false,
            visible: true,
            draggable: true,
            autoSize: true,
            icon: 'icon-status',
            description: 'Statut du job',
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
            badgeDefaultClass: 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset'
        },
        {
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
                    },
                ]
            }
        },
        {
            headerName: 'Date création',
            field: 'created_at',
            sortable: true,
            dataType: 'date' as ColumnDataType,
            filterable: true,
            width: 150,
            editable: false,
            visible: true,
            draggable: true,
            autoSize: true,
            icon: 'icon-calendar',
            description: 'Date de création du job',
            dateFormat: 'fr-FR',
            dateOptions: {
                year: 'numeric' as const,
                month: '2-digit' as const,
                day: '2-digit' as const
            }
        }
    ])

    /**
     * Configuration des colonnes pour la DataTable des locations disponibles
     */
    const locationsColumns = computed<DataTableColumn[]>(() => [
        {
            headerName: 'ID',
            field: 'id',
            sortable: true,
            dataType: 'number' as ColumnDataType,
            filterable: true,
            width: 80,
            editable: false,
            visible: false,
            draggable: true,
            autoSize: true,
            description: 'Identifiant unique'
        },
        {
            headerName: 'Référence',
            field: 'reference',
            sortable: true,
            dataType: 'text' as ColumnDataType,
            filterable: true,
            width: 150,
            editable: false,
            visible: true,
            draggable: true,
            autoSize: true,
            icon: 'icon-file-text',
            description: 'Référence de la location'
        },
        {
            headerName: 'Réf. Location',
            field: 'location_reference',
            sortable: true,
            dataType: 'text' as ColumnDataType,
            filterable: true,
            width: 150,
            editable: false,
            visible: true,
            draggable: true,
            autoSize: true,
            icon: 'icon-map-pin',
            description: 'Référence de localisation'
        },
        {
            headerName: 'Zone',
            field: 'zone_name',
            sortable: true,
            dataType: 'text' as ColumnDataType,
            filterable: true,
            width: 150,
            editable: false,
            visible: true,
            draggable: true,
            autoSize: true,
            icon: 'icon-layers',
            description: 'Zone'
        },
        {
            headerName: 'Sous-zone',
            field: 'sous_zone_name',
            sortable: true,
            dataType: 'text' as ColumnDataType,
            filterable: true,
            width: 150,
            editable: false,
            visible: true,
            draggable: true,
            autoSize: true,
            icon: 'icon-layers',
            description: 'Sous-zone'
        }
    ])

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

    // Fonction helper pour convertir QueryModel en query params
    const jobsToQueryParams = computed(() => {
        return (queryModel: QueryModel) => convertQueryModelToQueryParams(queryModel)
    })

    // ===== QUERYMODEL POUR LOCATIONS =====

    /**
     * QueryModel pour gérer les requêtes Locations
     * Le DataTable utilise UNIQUEMENT QueryModel comme format standard
     */
    const {
        queryModel: locationsQueryModelRef,
        updatePagination: updateLocationsQueryPagination,
        updateSort: updateLocationsQuerySort,
        updateFilter: updateLocationsQueryFilter,
        updateGlobalSearch: updateLocationsQueryGlobalSearch
    } = useQueryModel({
        columns: locationsColumns.value as any
    })

    // Fonction helper pour convertir QueryModel en query params
    const locationsToQueryParams = computed(() => {
        return (queryModel: QueryModel) => convertQueryModelToQueryParams(queryModel)
    })

    // ===== COMPUTED PROPERTIES =====

    // ===== CONFIGURATIONS DATATABLE =====

    // Configuration DataTable pour les jobs - Mode server-side par défaut
    // Suivant le pattern de useInventoryManagement.ts

    // Configuration DataTable pour les locations - Mode server-side par défaut
    // Suivant le pattern de useInventoryManagement.ts

    /**
     * Pagination automatique intelligente pour les jobs
     */
    const jobsPaginationConfig = computed(() => {
        const dataLength = jobs.value?.length || 0

        return {
            shouldEnablePagination: dataLength >= 50,
            shouldEnableVirtualScrolling: dataLength >= 100,
            optimalPageSize: dataLength >= 1000 ? 100 : dataLength >= 500 ? 50 : 25,
            dataLength
        }
    })

    /**
     * Pagination automatique intelligente pour les locations
     */
    const locationsPaginationConfig = computed(() => {
        const dataLength = locations.value?.length || 0

        return {
            shouldEnablePagination: dataLength >= 50,
            shouldEnableVirtualScrolling: dataLength >= 100,
            optimalPageSize: dataLength >= 1000 ? 100 : dataLength >= 500 ? 50 : 25,
            dataLength
        }
    })

    // === GESTION DES ERREURS ET ÉTATS AVANCÉS ===

    /**
     * Indicateur de sélection de locations
     */
    const hasSelectedLocations = computed(() => selectedAvailableLocations.value.length > 0)

    /**
     * Indicateur de sélection de jobs
     */
    const hasSelectedJobs = computed(() => selectedJobs.value.length > 0)


    // ===== ACTIONS DES DATATABLES =====

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
                        // Invalider le cache pour ce job car son statut a changé
                        resetAllSelections()
                        // Rafraîchir les données complètes (jobs + locations)
                        await refreshData()
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
                        // Invalider le cache pour ce job
                        resetAllSelections()
                        await refreshData()
                    }
                } catch (error) {
                    await alertService.error({ text: 'Erreur lors de la suppression du job' })
                }
            },
            show: () => true
        }
    ]

    /**
     * Configuration des actions disponibles pour chaque location dans la DataTable
     */
    const locationsActions: ActionConfig<Location>[] = [
        {
            label: 'Désactiver',
            icon: markRaw(IconXCircle),
            color: 'danger',
            onClick: async (location: Location) => {
                try {
                    const result = await alertService.confirm({
                        title: 'Confirmer la désactivation',
                        text: `Voulez-vous vraiment désactiver la location "${location.reference}" ?`
                    })

                    if (result.isConfirmed) {
                        await bulkDeactivateLocations([location.id])
                        await alertService.success({ text: 'Location désactivée avec succès' })
                        resetAllSelections()
                        // Rafraîchir les données complètes (jobs + locations)
                        await refreshData()
                    }
                } catch (error) {
                    await alertService.error({ text: 'Erreur lors de la désactivation de la location' })
                }
            },
            show: () => true
        }
    ]

    // Colonnes définies plus haut dans le fichier


    // ===== MÉTHODES DE RÉSOLUTION DES IDS =====

    /**
     * Résoudre les IDs d'inventaire, compte et entrepôt à partir des références
     * Cette méthode est appelée lors de l'initialisation pour obtenir les IDs nécessaires
     * aux appels API
     */
    const resolveContextIds = async () => {
        try {
            // Résoudre l'inventaire et récupérer l'account_id
            if (inventoryReference) {
                const inventory = await inventoryStore.fetchInventoryByReference(inventoryReference)
                inventoryId.value = inventory?.id ?? null
                accountId.value = inventory?.account_id ?? null
            }

            // Résoudre l'entrepôt
            if (warehouseReference) {
                warehouseId.value = await warehouseStore.fetchWarehouseByReference(warehouseReference)
            }

            // Validation des IDs requis
            if (!inventoryId.value || !warehouseId.value) {
                throw new Error(`IDs de contexte manquants - inventaire: ${inventoryId.value}, entrepôt: ${warehouseId.value}`)
            }
        } catch (error) {
            throw error
        }
    }

    // ===== MÉTHODES DE CHARGEMENT DES DONNÉES =====

    /**
     * Recharger toutes les données (jobs et locations)
     */
    const refreshData = async () => {
        await Promise.all([
            refreshJobs(),
            refreshLocations()
        ])
    }

    // ===== MÉTHODES D'ACTION =====

    /**
     * Créer un nouveau job avec les locations sélectionnées
     *
     * @returns true si le job a été créé avec succès, false sinon
     */
    const createJobFromSelectedLocations = async (): Promise<boolean> => {
        if (!hasSelectedLocations.value) {
            await alertService.warning({ text: 'Veuillez sélectionner au moins une location' })
            return false
        }

        if (!inventoryId.value || !warehouseId.value) {
            await alertService.error({ text: 'IDs de contexte manquants' })
            return false
        }

        try {
            const result = await alertService.confirm({
                title: 'Créer un job',
                text: `Créer un job avec ${selectedAvailableLocations.value.length} emplacement(s) ?`
            })

            if (result.isConfirmed) {
                const locationIds = selectedAvailableLocations.value.map(id => parseInt(id))
                await jobStore.createJob(inventoryId.value, warehouseId.value, { emplacements: locationIds } as any)

                await alertService.success({ text: 'Job créé avec succès' })
                resetAllSelections()
                // Rafraîchir complètement (nouveau job créé, pas besoin d'invalider le cache)
                await refreshData()
                return true
            }
            return false
        } catch (error) {
            await alertService.error({ text: 'Erreur lors de la création du job' })
            return false
        }
    }

    /**
     * Valider les jobs sélectionnés en masse
     */
    const bulkValidateJobs = async () => {
        if (!hasSelectedJobs.value) {
            await alertService.warning({ text: 'Veuillez sélectionner au moins un job' })
            return
        }

        try {
            const result = await alertService.confirm({
                title: 'Valider les jobs',
                text: `Valider ${selectedJobs.value.length} job(s) ?`
            })

            if (result.isConfirmed) {
                const jobIds = selectedJobs.value.map(id => parseInt(id))
                await jobStore.validateJob(jobIds)

                // Invalider le cache pour tous les jobs validés

                await alertService.success({ text: `${jobIds.length} job(s) validé(s) avec succès` })
                resetAllSelections()
                await refreshData()
            }
        } catch (error) {
            await alertService.error({ text: 'Erreur lors de la validation des jobs' })
        }
    }

    /**
     * Valider tous les jobs de l'inventaire
     */
    const validateAllJobs = async () => {
        // Vérifier que les IDs requis sont disponibles
        if (!inventoryId.value || !warehouseId.value) {
            await alertService.warning({ text: 'Inventaire ou entrepôt non disponible' })
            return
        }

        try {
            // Confirmation avant validation
            const result = await alertService.confirm({
                title: 'Valider tous les jobs',
                text: `Voulez-vous vraiment valider tous les jobs de cet inventaire ?`
            })

            if (!result.isConfirmed) {
                return
            }

            // Appeler l'API de validation de tous les jobs
            await jobStore.validateAllJobs(inventoryId.value, warehouseId.value)

            // Afficher le succès
            await alertService.success({ text: 'Tous les jobs ont été validés avec succès' })

            // Rafraîchir les données
            resetAllSelections()
            await refreshData()

        } catch (error: any) {
            // Extraire le message d'erreur du backend
            const errorMessage = error?.response?.data?.message ||
                                error?.message ||
                                'Erreur lors de la validation de tous les jobs'

            await alertService.error({ text: errorMessage })
        }
    }

    /**
     * Remettre à zéro les jobs sélectionnés en masse (retour à l'état initial)
     */
    const bulkResetJobs = async () => {
        if (!hasSelectedJobs.value) {
            await alertService.warning({ text: 'Veuillez sélectionner au moins un job' })
            return
        }

        try {
            const result = await alertService.confirm({
                title: 'Remettre à zéro les jobs',
                text: `Remettre à zéro ${selectedJobs.value.length} job(s) ? Cette action les ramènera à leur état initial.`
            })

            if (result.isConfirmed) {
                const jobIds = selectedJobs.value.map(id => parseInt(id))
                await jobStore.jobReset(jobIds)

                // Invalider le cache pour tous les jobs remis à zéro

                await alertService.success({ text: `${jobIds.length} job(s) remis à zéro avec succès` })
                resetAllSelections()
                await refreshData()
            }
        } catch (error) {
            await alertService.error({ text: 'Erreur lors de la remise à zéro des jobs' })
        }
    }

    /**
     * Supprimer les jobs sélectionnés en masse
     */
    const bulkDeleteJobs = async () => {
        if (!hasSelectedJobs.value) {
            await alertService.warning({ text: 'Veuillez sélectionner au moins un job' })
            return
        }

        try {
            const result = await alertService.confirm({
                title: 'Supprimer les jobs',
                text: `Supprimer ${selectedJobs.value.length} job(s) ?`
            })

            if (result.isConfirmed) {
                const jobIds = selectedJobs.value.map(id => parseInt(id))
                await jobStore.deleteJob(jobIds)

                // Invalider le cache pour tous les jobs supprimés

                await alertService.success({ text: `${jobIds.length} job(s) supprimé(s) avec succès` })
                resetAllSelections()
                await refreshData()
            }
        } catch (error) {
            await alertService.error({ text: 'Erreur lors de la suppression des jobs' })
        }
    }

    /**
     * Désactiver les locations sélectionnées en masse
     */
    const bulkDeactivateLocations = async (locationIds?: number[]) => {
        const idsToDeactivate = locationIds || selectedAvailableLocations.value.map(id => parseInt(id))

        if (idsToDeactivate.length === 0) {
            await alertService.warning({ text: 'Veuillez sélectionner au moins une location' })
            return
        }

        try {
            // Appeler la désactivation via le store des locations
            await locationStore.bulkUpdateStatus(idsToDeactivate)

            if (!locationIds) {
                // Si c'est appelé depuis la sélection, réinitialiser
                resetAllSelections()
            }

            // Rafraîchir les données complètes (jobs + locations)
            await refreshData()
        } catch (error) {
            await alertService.error({ text: 'Erreur lors de la désactivation des locations' })
        }
    }

    // ===== HANDLERS DATATABLE =====

    /**
     * Handlers DataTable - Désactivés car mode client-side
     * La DataTable gère elle-même la pagination/tri/filtrage côté client
     */
    // ===== HANDLERS DATATABLE =====

    // Cache des derniers appels pour éviter les appels répétés
    let lastJobsQueryModel: QueryModel | null = null
    let lastLocationsQueryModel: QueryModel | null = null


    /**
     * Traite un événement DataTable Jobs directement (sans vérification d'initialisation)
     */
    const processJobsEventDirectly = async (eventType: string, queryModel: QueryModel) => {
        // S'assurer que le QueryModel a des valeurs par défaut valides
        const sanitizedQueryModel: QueryModel = {
            page: queryModel.page ?? 1,
            pageSize: queryModel.pageSize ?? 20,
            sort: queryModel.sort ?? [],
            filters: queryModel.filters ?? {},
            search: queryModel.search ?? '',
            customParams: queryModel.customParams ?? {}
        }

        // Toujours fusionner avec les customParams requis
        const finalQueryModel = mergeQueryModelWithCustomParams(sanitizedQueryModel, jobsCustomParams.value)

        // Éviter les appels API inutiles en comparant avec le dernier appel réussi
        const queryModelStr = JSON.stringify(finalQueryModel)
        const lastQueryModelStr = lastJobsQueryModel ? JSON.stringify(lastJobsQueryModel) : null

        if (queryModelStr === lastQueryModelStr) {
            return
        }

        // Éviter les appels API inutiles pour les événements de filtre/recherche vides
        if (eventType === 'filter' || eventType === 'search') {
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
                jobsLoadingLocal.value = true
            }

            // Mettre à jour le QueryModel local pour synchroniser avec la DataTable
            jobsQueryModelRef.value = { ...finalQueryModel }

            await jobStore.fetchJobs(inventoryId.value!, warehouseId.value!, finalQueryModel)

            // Mettre à jour le cache après un appel réussi
            lastJobsQueryModel = { ...finalQueryModel }

            // Forcer le re-rendu de la DataTable pour tous les événements qui modifient les données
            if (eventType === 'pagination' || eventType === 'page-size-changed' || eventType === 'filter' || eventType === 'search' || eventType === 'sort') {
                jobsKey.value++
                jobsLoadingLocal.value = false
            }
        } catch (error) {
            console.error('[usePlanning] ❌ Error in jobStore.fetchJobs:', {
                eventType,
                error: error,
                queryModel: finalQueryModel
            })
            await alertService.error({ text: 'Erreur lors du chargement des jobs' })
            // Désactiver le loading en cas d'erreur
            if (eventType === 'pagination' || eventType === 'page-size-changed' || eventType === 'filter' || eventType === 'search' || eventType === 'sort') {
                jobsLoadingLocal.value = false
            }
        }
    }

    /**
     * Traite un événement DataTable Locations directement (sans vérification d'initialisation)
     */
    const processLocationsEventDirectly = async (eventType: string, queryModel: QueryModel) => {
        // S'assurer que le QueryModel a des valeurs par défaut valides
        const sanitizedQueryModel: QueryModel = {
            page: queryModel.page ?? 1,
            pageSize: queryModel.pageSize ?? 20,
            sort: queryModel.sort ?? [],
            filters: queryModel.filters ?? {},
            search: queryModel.search ?? '',
            customParams: queryModel.customParams ?? {}
        }

        // Toujours fusionner avec les customParams requis
        const finalQueryModel = mergeQueryModelWithCustomParams(sanitizedQueryModel, locationsCustomParams.value)

        // Éviter les appels API inutiles en comparant avec le dernier appel réussi
        const queryModelStr = JSON.stringify(finalQueryModel)
        const lastQueryModelStr = lastLocationsQueryModel ? JSON.stringify(lastLocationsQueryModel) : null

        if (queryModelStr === lastQueryModelStr) {
            return
        }

        // Éviter les appels API inutiles pour les événements de filtre/recherche vides
        if (eventType === 'filter' || eventType === 'search') {
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
                locationsLoadingLocal.value = true
            }

            // Mettre à jour le QueryModel local pour synchroniser avec la DataTable
            locationsQueryModelRef.value = { ...finalQueryModel }

            await locationStore.fetchUnassignedLocations(
                accountId.value!,
                inventoryId.value!,
                warehouseId.value!,
                finalQueryModel
            )

            // Mettre à jour le cache après un appel réussi
            lastLocationsQueryModel = { ...finalQueryModel }

            // Forcer le re-rendu de la DataTable pour tous les événements qui modifient les données
            if (eventType === 'pagination' || eventType === 'page-size-changed' || eventType === 'filter' || eventType === 'search' || eventType === 'sort') {
                availableLocationsKey.value++
                locationsLoadingLocal.value = false
            }
        } catch (error) {
            console.error('[usePlanning] ❌ Error in locationStore.fetchUnassignedLocations:', {
                eventType,
                error: error,
                queryModel: finalQueryModel
            })
            await alertService.error({ text: 'Erreur lors du chargement des locations' })
            // Désactiver le loading en cas d'erreur
            if (eventType === 'pagination' || eventType === 'page-size-changed' || eventType === 'filter' || eventType === 'search' || eventType === 'sort') {
                locationsLoadingLocal.value = false
            }
        }
    }

    /**
     * Handler unifié pour toutes les opérations de la DataTable Jobs
     */
    const onJobsTableEvent = async (eventType: string, queryModel: QueryModel) => {
        // Si l'initialisation n'est pas terminée, mettre l'événement en file d'attente
        if (!isInitialized.value) {
            jobsPendingEventsQueue.push({ eventType, queryModel })
            return
        }

        // Vérifier que les IDs requis sont disponibles avant de lancer l'API
        if (!inventoryId.value || !warehouseId.value) {
            console.warn('[usePlanning] Jobs API not called: missing inventoryId or warehouseId after initialization')
            return
        }

        // Traiter l'événement directement
        await processJobsEventDirectly(eventType, queryModel)
    }

    /**
     * Handler unifié pour toutes les opérations de la DataTable Locations
     * Utilise la ref pour identifier l'instance et éviter les conflits
     * Évite les appels API répétés avec le même QueryModel
     */
    const onLocationsTableEvent = async (eventType: string, queryModel: QueryModel) => {
        // Si l'initialisation n'est pas terminée, mettre l'événement en file d'attente
        if (!isInitialized.value) {
            locationsPendingEventsQueue.push({ eventType, queryModel })
            return
        }

        // Vérifier que les IDs requis sont disponibles avant de lancer l'API
        if (!accountId.value || !inventoryId.value || !warehouseId.value) {
            console.warn('[usePlanning] Locations API not called: missing accountId, inventoryId or warehouseId after initialization')
            return
        }

        // Traiter l'événement directement
        await processLocationsEventDirectly(eventType, queryModel)
    }

    /**
     * Handler pour les changements de sélection des locations disponibles
     *
     * @param selectedRows - Set des IDs de lignes sélectionnées
     */
    const onAvailableSelectionChanged = (selectedRows: Set<string>) => {
        selectedAvailableLocations.value = selectedRows ? Array.from(selectedRows) : []
    }

    /**
     * Handler pour les changements de sélection des jobs
     *
     * @param selectedRows - Set des IDs de lignes sélectionnées
     */
    const onJobSelectionChanged = (selectedRows: Set<string>) => {
        selectedJobs.value = selectedRows ? Array.from(selectedRows) : []
    }

    // ===== RÉFÉRENCES DATATABLE =====

    /** Références aux composants DataTable pour accéder à leurs méthodes */
    const availableLocationsTableRef = ref<any>(null)
    const jobsTableRef = ref<any>(null)

    /** Clés pour forcer le re-render des tables */
    const availableLocationsKey = ref(0)
    const jobsKey = ref(0)

    // ===== COMPUTED PROPERTIES =====

    /**
     * Nombre de jobs sélectionnés
     */
    const selectedJobsCount = computed(() => selectedJobs.value.length)

    /**
     * Paramètres personnalisés pour la DataTable des jobs
     * Inclut les IDs nécessaires pour les appels API
     */
    const jobsCustomParams = computed(() => ({
        inventory_id: inventoryId.value,
        warehouse_id: warehouseId.value
    }))

    /**
     * Paramètres personnalisés pour la DataTable des locations
     * Inclut les IDs nécessaires pour les appels API
     */
    const locationsCustomParams = computed(() => ({
        account_id: accountId.value,
        inventory_id: inventoryId.value,
        warehouse_id: warehouseId.value
    }))

    // ===== INITIALISATION =====

    /**
     * Traite les événements DataTable mis en file d'attente pendant l'initialisation
     */
    const processPendingEvents = async () => {
        // Traiter les événements jobs en file d'attente
        if (jobsPendingEventsQueue.length > 0) {
            const jobsEvents = [...jobsPendingEventsQueue]
            jobsPendingEventsQueue.length = 0

            for (const event of jobsEvents) {
                await processJobsEventDirectly(event.eventType, event.queryModel)
            }
        }

        // Traiter les événements locations en file d'attente
        if (locationsPendingEventsQueue.length > 0) {
            const locationsEvents = [...locationsPendingEventsQueue]
            locationsPendingEventsQueue.length = 0

            for (const event of locationsEvents) {
                await processLocationsEventDirectly(event.eventType, event.queryModel)
            }
        }
    }

    /**
     * Charge les jobs avec des paramètres spécifiques
     */
    const loadJobs = async (params?: QueryModel) => {
        if (!inventoryId.value || !warehouseId.value) {
            return
        }

        jobsLoadingLocal.value = true

        try {
            const finalParams: QueryModel = params || mergeQueryModelWithCustomParams(
                {
                    page: 1,
                    pageSize: 20
                },
                jobsCustomParams.value
            )

            await jobStore.fetchJobs(inventoryId.value, warehouseId.value, finalParams)
            await nextTick()

            lastJobsQueryModel = { ...finalParams }
            jobsLoadingLocal.value = false
        } catch (error) {
            console.error('[usePlanning.loadJobs] ❌ Error during job load:', error)
            await alertService.error({ text: 'Erreur lors du chargement des jobs' })
            jobsLoadingLocal.value = false
        }
    }

    /**
     * Charge les locations avec des paramètres spécifiques
     */
    const loadLocations = async (params?: QueryModel) => {
        if (!accountId.value || !inventoryId.value || !warehouseId.value) {
            return
        }

        locationsLoadingLocal.value = true

        try {
            const finalParams: QueryModel = params || mergeQueryModelWithCustomParams(
                {
                    page: 1,
                    pageSize: 20
                },
                locationsCustomParams.value
            )

            await locationStore.fetchUnassignedLocations(
                accountId.value,
                inventoryId.value,
                warehouseId.value,
                finalParams
            )
            await nextTick()

            lastLocationsQueryModel = { ...finalParams }
            locationsLoadingLocal.value = false
        } catch (error) {
            console.error('[usePlanning.loadLocations] ❌ Error during locations load:', error)
            await alertService.error({ text: 'Erreur lors du chargement des locations' })
            locationsLoadingLocal.value = false
        }
    }

    /**
     * Rafraîchir les jobs
     */
    const refreshJobs = async (params?: QueryModel) => {
        await loadJobs(params)
    }

    /**
     * Rafraîchir les locations
     */
    const refreshLocations = async (params?: QueryModel) => {
        await loadLocations(params)
    }

    /**
     * Initialiser le composable
     * Résout les IDs de contexte uniquement, sans charger les données
     *
     * Les données seront chargées par le DataTable lors de la restauration des paramètres sauvegardés
     * ou avec des paramètres par défaut si aucun paramètre n'est sauvegardé.
     *
     * Cela permet au DataTable de restaurer les filtres, tri, recherche et taille de page sauvegardés
     * et de charger les données avec ces paramètres au lieu de les écraser avec des valeurs par défaut.
     */
    const initialize = async () => {
        if (isInitialized.value || isInitializing.value) return

        isInitializing.value = true
        try {
            // Vérifier les références
            if (!inventoryReference || !warehouseReference) {
                throw new Error('Références d\'inventaire ou d\'entrepôt manquantes')
            }

            // Résoudre les IDs
            await resolveContextIds()

            // Vérifier que tous les IDs sont résolus
            if (!inventoryId.value || !warehouseId.value) {
                throw new Error(`IDs de contexte manquants après résolution - inventaire: ${inventoryId.value}, entrepôt: ${warehouseId.value}`)
            }

            // NE PAS charger les données ici - elles seront chargées depuis la vue
            // pour éviter les appels multiples et les conflits avec les DataTables

            isInitialized.value = true

            // Traiter les événements DataTable mis en file d'attente
            await processPendingEvents()
        } catch (error) {
            await alertService.error({ text: 'Erreur lors de l\'initialisation du planning' })
        } finally {
            isInitializing.value = false
        }
    }

    // ===== FONCTIONS UTILITAIRES =====

    /**
     * Formater le type d'un fichier
     */
    const getFileType = (fileName: string): string => {
        const extension = fileName.split('.').pop()?.toUpperCase()
        return extension ? `Fichier ${extension}` : 'Fichier inconnu'
    }

    /**
     * Formater une date en français
     */
    const formatDate = (date: string | Date): string => {
        if (!date) return ''
        const d = new Date(date)
        return d.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    // ===== ÉTAT EXPANSION JOBS =====

    /** IDs des jobs expandés */
    const expandedJobIds = ref<Set<string>>(new Set<string>())

    // ===== COMPUTED POUR COMPATIBILITÉ =====

    /**
     * État du planning pour compatibilité avec Planning.vue
     */
    const planningState = computed(() => ({
        selectedAvailable: selectedAvailableLocations.value,
        selectedJobs: selectedJobs.value,
        selectedJobToAddLocation: '',
        expandedJobIds: expandedJobIds.value,
        isSubmitting: false
    }))


    /**
     * Indicateur de disponibilité de jobs
     */
    const hasAvailableJobs = computed(() => jobs.value.length > 0)

    /**
     * Options pour le sélecteur de jobs
     */
    const jobSelectOptions = computed(() =>
        jobs.value.map(job => ({
            value: job.id.toString(),
            label: job.reference || `Job ${job.id}`
        }))
    )

    // Colonnes adaptées pour compatibilité
    const adaptedStoreJobsColumns = jobsColumns
    const adaptedAvailableLocationColumns = locationsColumns

    // ===== GESTION DES MODALS =====

    /**
     * Ouvrir la modal d'ajout d'emplacements à un job
     */
    const openAddToJobModal = () => {
        if (planningState.value.selectedAvailable.length === 0) {
            return
        }
        selectedJobForModal.value = null
        showAddToJobModal.value = true
    }

    /**
     * Fermer la modal d'ajout d'emplacements à un job
     */
    const closeAddToJobModal = () => {
        showAddToJobModal.value = false
        selectedJobForModal.value = null
    }

    /**
     * Confirmer l'ajout des emplacements au job sélectionné
     */
    const confirmAddToJob = async () => {
        if (!selectedJobForModal.value) {
            return
        }
        await onSelectJobForLocation(selectedJobForModal.value)
        closeAddToJobModal()
    }

    // ===== MÉTHODES POUR COMPATIBILITÉ =====

    /**
     * Mettre à jour la sélection
     *
     * @param type - Type de sélection ('available' ou 'jobs')
     * @param selection - Tableau d'IDs sélectionnés
     */
    const updateSelection = (type: 'available' | 'jobs', selection: string[]) => {
        if (type === 'available') {
            selectedAvailableLocations.value = selection
        } else {
            selectedJobs.value = selection
        }
    }

    /**
     * Effacer la sélection
     *
     * @param type - Type de sélection ('available' ou 'jobs')
     */
    const clearSelection = (type: 'available' | 'jobs') => {
        if (type === 'available') {
            selectedAvailableLocations.value = []
        } else {
            selectedJobs.value = []
        }
    }

    /**
     * Réinitialiser toutes les sélections (locations et jobs)
     * Appelée après chaque action (création, suppression, validation, ajout d'emplacements)
     */
    const resetAllSelections = () => {
        selectedAvailableLocations.value = []
        selectedJobs.value = []
    }


    /**
     * Mettre à jour les filtres
     *
     * @param newFilters - Nouveaux filtres
     */
    const updateFilters = (newFilters: any) => {
        // Logique de mise à jour des filtres si nécessaire
    }

    /**
     * Ajouter des emplacements sélectionnés à un job existant
     *
     * @param value - ID du job (string, number, array ou null)
     */
    const onSelectJobForLocation = async (value: string | number | string[] | number[] | null) => {
        if (!value || typeof value !== 'string' || value.trim() === '') {
            return
        }

        if (!hasSelectedLocations.value) {
            await alertService.warning({ text: 'Veuillez sélectionner des emplacements avant d\'ajouter au job.' })
            return
        }

        try {
            const result = await alertService.confirm({
                title: 'Ajouter au job',
                text: `Ajouter ${selectedAvailableLocations.value.length} emplacement(s) au job ?`
            })

            if (result.isConfirmed) {
                const jobId = parseInt(value as string)
                const locationIds = selectedAvailableLocations.value.map(id => parseInt(id))
                await jobStore.addLocationToJob(jobId, locationIds)

                // Invalider le cache pour ce job car ses locations ont changé

                await alertService.success({ text: 'Emplacements ajoutés avec succès' })
                resetAllSelections()
                await refreshData()
            }
        } catch (error) {
            await alertService.error({ text: 'Erreur lors de l\'ajout d\'emplacements au job' })
        }
    }

    /**
     * Wrapper pour la validation en masse
     */
    const onBulkValidate = async () => {
        await bulkValidateJobs()
    }

    /**
     * Wrapper pour la suppression en masse
     */
    const onReturnSelectedJobs = async () => {
        await bulkDeleteJobs()
    }

    /**
     * Wrapper pour le rafraîchissement des locations
     */
    const onRefreshLocations = async () => {
        await loadLocations()
    }

    /**
     * Wrapper pour le rafraîchissement de toutes les données
     */
    const onRefreshData = async () => {
        await refreshData()
    }


    // ===== MÉTHODES UTILITAIRES =====

    /**
     * Réinitialiser les sélections dans les DataTables via les refs
     * Appelée après certaines actions pour synchroniser l'état visuel
     */
    const resetDataTableSelections = () => {
        nextTick(() => {
            if (availableLocationsTableRef.value) {
                availableLocationsTableRef.value.clearAllSelections()
            }
            if (jobsTableRef.value) {
                jobsTableRef.value.clearAllSelections()
            }
        })
    }

    /**
     * Supprimer un emplacement d'un job (depuis la table imbriquée)
     *
     * @param jobId - ID du job
     * @param locationReference - Référence de l'emplacement à supprimer
     */
    const removeLocationFromNestedTable = async (jobId: string, locationReference: string) => {
        try {
            // TODO: Implémenter la logique de suppression d'emplacement
            await refreshData()
        } catch (error) {
            await alertService.error({ text: 'Erreur lors de la suppression de l\'emplacement' })
        }
    }

    /**
     * Créer un job depuis les emplacements sélectionnés (wrapper)
     */
    const createSingleJob = async () => {
        const ok = await createJobFromSelectedLocations()
        return ok
    }

    /**
     * Handler pour la validation en masse des jobs (wrapper)
     */
    const onBulkValidateHandler = async () => {
        await onBulkValidate()
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
     * Navigation vers la page d'affectation
     */
    const handleGoToAffectation = () => {
        router.push({
            name: 'inventory-affecter',
            params: {
                reference: inventoryReference,
                warehouse: warehouseReference
            }
        })
    }

    // ===== WATCHERS =====



    /**
     * Flags pour éviter les boucles infinies lors de la réinitialisation des sélections
     */
    let isResettingSelections = false
    let isInitialMount = true


    /**
     * Watcher pour surveiller les changements de sélection
     * Réinitialise les DataTables quand les sélections passent de non-vides à vides
     */
    watch(
        () => [selectedAvailableLocations.value.length, selectedJobs.value.length],
        ([availableLength, jobsLength], [oldAvailableLength, oldJobsLength]) => {
            // Ignorer le premier déclenchement au montage
            if (isInitialMount) {
                isInitialMount = false
                return
            }

            // Éviter les boucles infinies
            if (isResettingSelections) return

            // Si les sélections passent de non-vides à vides, réinitialiser aussi les DataTables
            if (availableLength === 0 && jobsLength === 0 && (oldAvailableLength > 0 || oldJobsLength > 0)) {
                isResettingSelections = true
                resetDataTableSelections()
                setTimeout(() => {
                    isResettingSelections = false
                }, 100)
            }
        },
        { immediate: false }
    )

    // ===== SETUP EXPANSION JOBS =====

    /**
     * Configuration de l'expansion des jobs au montage
     */
    const setupJobExpansion = () => {
        // Ajouter event listener pour l'expansion des jobs (seulement sur l'icône)
        document.addEventListener('click', (event) => {
            const target = event.target as HTMLElement
            const chevronIcon = target.closest('.chevron-icon')
            if (chevronIcon) {
                const jobId = chevronIcon.getAttribute('data-job-id')
                if (jobId) {
                    if (expandedJobIds.value.has(jobId)) {
                        expandedJobIds.value.delete(jobId)
                    } else {
                        expandedJobIds.value.add(jobId)
                    }
                    jobsKey.value++
                }
            }
        })
    }

    /**
     * Initialisation complète avec chargement des données
     */
    const initializeWithData = async () => {
        // Initialiser le composable (résout les IDs)
        await initialize()

        // Charger les données maintenant que les IDs sont disponibles
        await loadJobs()
        await loadLocations()

        // Marquer les données comme chargées
        isDataLoaded.value = true

        selectedAvailableLocations.value = []
        selectedJobs.value = []
    }

    // Initialiser au montage
    onMounted(async () => {
        // Attendre un tick pour laisser les composants se monter
        await nextTick()

        // Initialisation complète avec données
        await initializeWithData()

        setupJobExpansion()
    })

    // ===== EXPORT HANDLERS =====

    // ===== FONCTIONS D'EXPORT SIMPLIFIÉES =====

    const handleLocationExportCsv = async () => {
        try {
            await alertService.success({ text: 'Export CSV - Fonctionnalité à implémenter' })
        } catch (error: any) {
            alertService.error({ text: 'Erreur lors de l\'export CSV' })
        }
    }

    const handleLocationExportExcel = async () => {
        try {
            await alertService.success({ text: 'Export Excel - Fonctionnalité à implémenter' })
        } catch (error: any) {
            alertService.error({ text: 'Erreur lors de l\'export Excel' })
        }
    }

    // ===== RETURN =====

    return {
        // Données
        jobs,
        locations,
        loadJobs,
        loadLocations,
        refreshJobs,
        refreshLocations,

        // États
        jobsLoading,
        locationsLoading,
        jobsLoadingLocal,
        locationsLoadingLocal,
        jobsError,
        locationsError,

        // Colonnes
        adaptedStoreJobsColumns,
        adaptedAvailableLocationColumns,

        // Actions
        jobsActions,
        locationsActions,

        // Handlers DataTable (isolés par instance)
        onJobsTableEvent,
        onLocationsTableEvent,
        onAvailableSelectionChanged,
        onJobSelectionChanged,


        // Sélections et actions
        selectedAvailableLocations,
        selectedJobs,
        hasSelectedLocations,
        hasSelectedJobs,
        selectedJobsCount,
        jobSelectOptions,

        // Actions principales
        createJobFromSelectedLocations,
        bulkValidateJobs,
        validateAllJobs,
        bulkResetJobs,
        bulkDeleteJobs,
        bulkDeactivateLocations,
        onSelectJobForLocation,

        // Navigation
        handleGoToInventoryDetail,
        handleGoToAffectation,


        // État du planning
        planningState,

        // Interface et états UI
        isDataLoaded,

        // Tooltips
        showStatusLegend,
        statusLegendTooltip,
        tooltipElement,
        tooltipStyle,
        showStatusTooltip,
        hideStatusTooltip,
        positionStatusTooltip,

        // Boutons d'actions
        navigationButtons,
        jobsActionButtons,
        locationsActionButtons,

        // Gestion des modals
        showAddToJobModal,
        selectedJobForModal,
        openAddToJobModal,
        closeAddToJobModal,
        confirmAddToJob,

        // Initialisation
        initializeWithData,

        // Fonctions utilitaires
        getFileType,
        formatDate,

        // Références
        availableLocationsTableRef,
        jobsTableRef,
        availableLocationsKey,
        jobsKey,

        // Métadonnées de pagination
        jobPaginationMetadata,
        locationPaginationMetadata
    }
}
