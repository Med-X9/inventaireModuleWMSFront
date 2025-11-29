/**
 * Composable pour la gestion du planning d'inventaire
 *
 * Ce composable gère :
 * - Les jobs d'inventaire (création, validation, suppression)
 * - Les locations disponibles (affichage, sélection, filtrage)
 * - La pagination et le tri côté serveur pour les deux DataTables
 * - La conversion automatique des paramètres vers le format standard DataTable
 *
 * @module usePlanning
 */

// ===== IMPORTS VUE =====
import { ref, computed, markRaw, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Router } from 'vue-router'

// ===== IMPORTS COMPOSABLES =====
import { useBackendDataTable } from '@/components/DataTable/composables/useBackendDataTable'

// ===== IMPORTS SERVICES =====
import { logger } from '@/services/loggerService'
import { alertService } from '@/services/alertService'

// ===== IMPORTS STORES =====
import { useJobStore } from '@/stores/job'
import { useLocationStore } from '@/stores/location'
import { useInventoryStore } from '@/stores/inventory'
import { useWarehouseStore } from '@/stores/warehouse'

// ===== IMPORTS UTILS =====
import { convertToStandardDataTableParams, type StandardDataTableParams } from '@/components/DataTable/utils/dataTableParamsConverter'
import { useQueryModel } from '@/components/DataTable/composables/useQueryModel'
import { convertQueryModelToQueryParams, convertQueryModelToRestApi, createQueryModelFromDataTableParams } from '@/components/DataTable/utils/queryModelConverter'
import type { QueryModel } from '@/components/DataTable/types/QueryModel'
import {
    extractFiltersFromStandardParams,
    isStandardDataTableParams,
    extractPageFromStandardParams,
    extractPageSizeFromStandardParams,
    extractSortFromStandardParams
} from './utils/dataTableHelpers'

// ===== IMPORTS TYPES =====
import type { DataTableColumn, ColumnDataType, ActionConfig } from '@/types/dataTable'
import type { Job, JobTable } from '@/models/Job'
import type { Location } from '@/models/Location'
import type { LocationDataTableParams } from '@/services/LocationService'

// ===== IMPORTS COMPOSANTS =====
import IconCheck from '@/components/icon/icon-check.vue'
import IconTrash from '@/components/icon/icon-trash.vue'

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

    // ===== SÉLECTIONS =====

    /** IDs des locations disponibles sélectionnées */
    const selectedAvailableLocations = ref<string[]>([])

    /** IDs des jobs sélectionnés */
    const selectedJobs = ref<string[]>([])

    // ===== INITIALISATION DES DATATABLES =====

    /**
     * DataTable pour les jobs
     * Utilise useBackendDataTable pour l'intégration avec le store Pinia
     */
    const {
        data: jobs,
        loading: jobsLoading,
        currentPage: jobsCurrentPage,
        pageSize: jobsPageSize,
        searchQuery: jobsSearchQuery,
        sortModel: jobsSortModel,
        filters: jobsFilters,
        setPage: setJobsPage,
        setPageSize: setJobsPageSize,
        setSearch: setJobsSearch,
        setSortModel: setJobsSortModel,
        setFilters: setJobsFilters,
        resetFilters: resetJobsFilters,
        refresh: _refreshJobsDataTable,
        pagination: jobsPagination
    } = useBackendDataTable<Job>('', {
        piniaStore: jobStore,
        storeId: 'job',
        autoLoad: false,
        pageSize: 20
    })

    // ===== QUERYMODEL POUR JOBS =====
    
    /**
     * Mode de sortie pour les paramètres de requête (défaut: 'queryParams')
     */
    const jobsQueryOutputMode = ref<'queryModel' | 'dataTable' | 'restApi' | 'queryParams'>('queryParams')

    /**
     * Colonnes pour QueryModel Jobs
     */
    const jobsColumnsRef = computed(() => jobsColumns.value)

    /**
     * QueryModel pour gérer les requêtes Jobs avec mode de sortie configurable
     */
    const {
        queryModel: jobsQueryModelRef,
        toStandardParams: jobsToStandardParams,
        updatePagination: updateJobsQueryPagination,
        updateSort: updateJobsQuerySort,
        updateFilter: updateJobsQueryFilter,
        updateGlobalSearch: updateJobsQueryGlobalSearch
    } = useQueryModel({
        columns: jobsColumnsRef,
        enabled: true
    })

    /**
     * Convertit le QueryModel Jobs selon le mode configuré
     */
    const convertJobsQueryModelToOutput = (queryModelData: QueryModel) => {
        switch (jobsQueryOutputMode.value) {
            case 'queryModel':
                return queryModelData
            case 'restApi':
                return convertQueryModelToRestApi(queryModelData)
            case 'queryParams':
                return convertQueryModelToQueryParams(queryModelData)
            case 'dataTable':
            default:
                return jobsToStandardParams.value
        }
    }

    /**
     * DataTable pour les locations disponibles
     * Utilise useBackendDataTable pour l'intégration avec le store Pinia
     */
    const {
        data: locations,
        loading: locationsLoading,
        currentPage: locationsCurrentPage,
        pageSize: locationsPageSize,
        searchQuery: locationsSearchQuery,
        sortModel: locationsSortModel,
        filters: locationsFilters,
        setPage: setLocationsPage,
        setPageSize: setLocationsPageSize,
        setSearch: setLocationsSearch,
        setSortModel: setLocationsSortModel,
        setFilters: setLocationsFilters,
        resetFilters: resetLocationsFilters,
        refresh: _refreshLocationsDataTable,
        pagination: locationsPagination,
        getFromPinia: getLocationFromPinia
    } = useBackendDataTable<Location>('', {
        piniaStore: locationStore,
        storeId: 'location',
        autoLoad: false,
        pageSize: 20
    })

    // ===== COMPUTED PROPERTIES =====

    /** État de chargement global (jobs ou locations) */
    const loading = computed(() => jobsLoading.value || locationsLoading.value)

    /**
     * Dédupliquer les locations d'un job
     * Transforme les locations pour aplatir les propriétés imbriquées (zone, sous_zone)
     * et supprime les doublons basés sur l'ID ou la référence
     *
     * @param job - Job contenant les locations à traiter
     * @returns Tableau de locations uniques avec propriétés aplaties
     */
    const dedupeJobLocations = (job: Job | JobTable) => {
        const rawLocations = ((job as any).locations ?? (job as any).emplacements ?? []) as Array<Record<string, any>>
        const uniqueLocations = new Map<string | number | symbol, Record<string, any>>()

        rawLocations.forEach((loc, index) => {
            // Identifier la location par son ID, location_id, location_reference ou reference
            const key =
                loc.id ??
                loc.location_id ??
                loc.location_reference ??
                loc.reference ??
                Symbol(`job-location-${index}`)

            // Ne garder que la première occurrence
            if (!uniqueLocations.has(key)) {
                uniqueLocations.set(key, {
                    ...loc,
                    zone_name: loc.zone?.zone_name || loc.zone_name || 'N/A',
                    sous_zone_name: loc.sous_zone?.sous_zone_name || loc.sous_zone_name || 'N/A'
                })
            }
        })

        return Array.from(uniqueLocations.values())
    }

    /**
     * Jobs transformés avec locations dédupliquées
     * Chaque job a ses locations traitées pour supprimer les doublons
     */
    const transformedJobs = computed(() => {
        return jobs.value.map(job => ({
            ...job,
            locations: dedupeJobLocations(job)
        }))
    })

    /**
     * Locations mappées avec propriétés aplaties
     * Aplatit les propriétés imbriquées (zone, sous_zone) pour faciliter l'affichage dans la DataTable
     */
    const mappedLocations = computed(() => {
        const locationsData = locationStore.locations || []
        return locationsData.map(loc => ({
            ...loc,
            location_reference: (loc as any).location_reference ?? (loc as any).reference ?? loc.reference ?? '',
            zone_name: loc.zone?.zone_name || (loc as any).zone_name || 'N/A',
            sous_zone_name: loc.sous_zone?.sous_zone_name || (loc as any).sous_zone_name || 'N/A'
        }))
    })

    /**
     * Locations disponibles (non utilisées dans les jobs)
     * Filtre les locations pour exclure celles déjà assignées à un job
     */
    const availableLocations = computed(() => {
        const usedLocationIds = new Set<number | string>()

        // Collecter tous les IDs de locations utilisées dans les jobs
        transformedJobs.value.forEach(job => {
            job.locations?.forEach(loc => {
                const key = loc.id ?? loc.location_id ?? (loc as any).location_reference ?? loc.reference
                if (key !== undefined && key !== null) {
                    usedLocationIds.add(key)
                }
            })
        })

        // Retourner uniquement les locations non utilisées
        return mappedLocations.value.filter(loc => {
            const key = loc.id ?? (loc as any).location_id ?? (loc as any).location_reference ?? loc.reference
            return key === undefined || key === null ? true : !usedLocationIds.has(key)
        })
    })

    /**
     * Indicateur de sélection de locations
     */
    const hasSelectedLocations = computed(() => selectedAvailableLocations.value.length > 0)

    /**
     * Indicateur de sélection de jobs
     */
    const hasSelectedJobs = computed(() => selectedJobs.value.length > 0)

    /**
     * Pagination calculée pour les jobs
     * Utilise le totalCount du store pour calculer les informations de pagination
     */
    const jobsPaginationComputed = computed(() => {
        const totalCount = jobStore.totalCount || 0
        const pageSize = jobsPageSize.value || 20
        const currentPage = jobsCurrentPage.value || 1

        return {
            current_page: currentPage,
            total_pages: Math.max(1, Math.ceil(totalCount / pageSize)),
            has_next: currentPage < Math.ceil(totalCount / pageSize),
            has_previous: currentPage > 1,
            page_size: pageSize,
            total: totalCount
        }
    })

    /**
     * Pagination calculée pour les locations
     * Utilise le totalCount du store pour calculer les informations de pagination
     */
    const locationsPaginationComputed = computed(() => {
        const totalCount = locationStore.totalCount || 0
        const pageSize = locationsPageSize.value || 20
        const currentPage = locationsCurrentPage.value || 1

        return {
            current_page: currentPage,
            total_pages: Math.max(1, Math.ceil(totalCount / pageSize)),
            has_next: currentPage < Math.ceil(totalCount / pageSize),
            has_previous: currentPage > 1,
            page_size: pageSize,
            total: totalCount
        }
    })

    // ===== COLONNES DATATABLE =====

    /**
     * Configuration des colonnes pour la DataTable des jobs
     */
    const jobsColumns = computed<DataTableColumn[]>(() => [
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
            description: 'Identifiant unique du job'
        },
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
                    value: 'TRANSFERET',
                    class: 'inline-flex items-center rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-800 ring-1 ring-orange-600/20 ring-inset'
                },
                {
                    value: 'TERMINE',
                    class: 'inline-flex items-center rounded-md bg-green-900 px-2 py-1 text-xs font-medium text-white ring-1 ring-green-600/20 ring-inset'
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
                        field: 'location_reference',
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

    // ===== ACTIONS POUR LES JOBS =====

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
                        await refreshJobs()
                    }
                } catch (error) {
                    logger.error('Erreur lors de la validation du job', error)
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
                        await refreshData()
                    }
                } catch (error) {
                    logger.error('Erreur lors de la suppression du job', error)
                    await alertService.error({ text: 'Erreur lors de la suppression du job' })
                }
            },
            show: () => true
        }
    ]

    // ===== MÉTHODES DE RÉSOLUTION DES IDS =====

    /**
     * Résoudre les IDs d'inventaire, compte et entrepôt à partir des références
     * Cette méthode est appelée lors de l'initialisation pour obtenir les IDs nécessaires
     * aux appels API
     */
    const resolveContextIds = async () => {
        try {
            logger.debug('Résolution des IDs de contexte...', { inventoryReference, warehouseReference })

            // Résoudre l'inventaire et récupérer l'account_id
            if (inventoryReference) {
                const inventory = await inventoryStore.fetchInventoryByReference(inventoryReference)
                inventoryId.value = inventory?.id ?? null
                accountId.value = inventory?.account_id ?? null
                logger.debug('IDs inventaire et compte résolus', {
                    inventoryId: inventoryId.value,
                    accountId: accountId.value,
                    inventory: inventory ? { id: inventory.id, account_id: inventory.account_id } : null
                })
            }

            // Résoudre l'entrepôt
            if (warehouseReference) {
                warehouseId.value = await warehouseStore.fetchWarehouseByReference(warehouseReference)
                logger.debug('ID entrepôt résolu', { warehouseId: warehouseId.value })
            }

            // Validation des IDs requis
            if (!inventoryId.value || !warehouseId.value) {
                throw new Error(`IDs de contexte manquants - inventaire: ${inventoryId.value}, entrepôt: ${warehouseId.value}`)
            }

            if (!accountId.value) {
                logger.warn('ID de compte non résolu, le chargement des locations peut échouer', {
                    inventoryId: inventoryId.value,
                    inventoryReference
                })
            }

            logger.debug('Résolution des IDs terminée avec succès', {
                inventoryId: inventoryId.value,
                accountId: accountId.value,
                warehouseId: warehouseId.value
            })
        } catch (error) {
            logger.error('Erreur lors de la résolution des IDs de contexte', error)
            throw error
        }
    }

    // ===== MÉTHODES DE CHARGEMENT DES DONNÉES =====

    /**
     * Charger les jobs pour l'inventaire et l'entrepôt actuels
     *
     * @param params - Paramètres DataTable standard (pagination, tri, filtres)
     */
    const loadJobs = async (params?: StandardDataTableParams | LocationDataTableParams) => {
        if (!inventoryId.value || !warehouseId.value) {
            logger.warn('Impossible de charger les jobs, IDs manquants')
            return
        }

        try {
            // Utiliser les paramètres fournis ou construire à partir des valeurs actuelles
            let finalParams: StandardDataTableParams
            if (params && 'start' in params && 'length' in params) {
                // C'est déjà StandardDataTableParams
                finalParams = params as StandardDataTableParams
            } else {
                // Construire depuis les valeurs actuelles
                finalParams = {
                    draw: jobsCurrentPage.value || 1,
                    start: ((jobsCurrentPage.value || 1) - 1) * jobsPageSize.value,
                    length: jobsPageSize.value
                }
            }

            // S'assurer que length et start sont bien définis
            if (!finalParams.length) {
                finalParams.length = jobsPageSize.value
            }
            if (finalParams.start === undefined) {
                finalParams.start = ((jobsCurrentPage.value || 1) - 1) * jobsPageSize.value
            }

            logger.debug('Chargement des jobs avec paramètres DataTable:', {
                inventoryId: inventoryId.value,
                warehouseId: warehouseId.value,
                pageSize: jobsPageSize.value,
                params: finalParams
            })

            await jobStore.fetchJobs(inventoryId.value, warehouseId.value, finalParams)
            await nextTick()

            logger.debug('Jobs mis à jour dans le store', {
                count: jobStore.jobs.length,
                sample: jobStore.jobs.slice(0, 2).map(j => ({ id: j.id, ref: j.reference }))
            })
        } catch (error) {
            logger.error('Erreur lors du chargement des jobs', error)
            await alertService.error({ text: 'Erreur lors du chargement des jobs' })
        }
    }

    /**
     * Charger les locations disponibles pour l'entrepôt actuel
     *
     * @param params - Paramètres DataTable standard (pagination, tri, filtres)
     */
    const loadLocations = async (params?: StandardDataTableParams | LocationDataTableParams) => {
        if (!accountId.value || !inventoryId.value || !warehouseId.value) {
            logger.warn('Impossible de charger les locations, IDs manquants', {
                accountId: accountId.value,
                inventoryId: inventoryId.value,
                warehouseId: warehouseId.value
            })
            return
        }

        try {
            // Utiliser les paramètres fournis ou construire à partir des valeurs actuelles
            const finalParams: LocationDataTableParams = params || {
                draw: locationsCurrentPage.value || 1,
                start: ((locationsCurrentPage.value || 1) - 1) * locationsPageSize.value,
                length: locationsPageSize.value
            }

            // S'assurer que length est bien défini
            if (!finalParams.length) {
                finalParams.length = locationsPageSize.value
            }

            logger.debug('Chargement des locations avec paramètres DataTable:', {
                accountId: accountId.value,
                inventoryId: inventoryId.value,
                warehouseId: warehouseId.value,
                pageSize: locationsPageSize.value,
                params: finalParams
            })

            await locationStore.fetchUnassignedLocations(accountId.value, inventoryId.value, warehouseId.value, finalParams)
            await nextTick()

            logger.debug('Locations mises à jour dans le store', {
                count: locationStore.locations.length,
                sample: locationStore.locations.slice(0, 2).map(l => ({ id: l.id, ref: l.reference }))
            })
        } catch (error) {
            logger.error('Erreur lors du chargement des locations', error)
            await alertService.error({ text: 'Erreur lors du chargement des locations' })
        }
    }

    /**
     * Rafraîchir les jobs
     *
     * @param params - Paramètres DataTable optionnels
     */
    const refreshJobs = async (params?: LocationDataTableParams) => {
        await loadJobs(params)
    }

    /**
     * Rafraîchir les locations
     *
     * @param params - Paramètres DataTable optionnels
     */
    const refreshLocations = async (params?: LocationDataTableParams) => {
        await loadLocations(params)
    }

    /**
     * Réinitialiser la DataTable des jobs (tri, filtres, recherche)
     */
    const resetJobsDataTable = async () => {
        setJobsSortModel([])
        resetJobsFilters()
        setJobsSearch('')
        await refreshJobs()
    }

    /**
     * Réinitialiser la DataTable des locations (tri, filtres, recherche, page)
     */
    const resetLocationsDataTable = async () => {
        setLocationsSortModel([])
        resetLocationsFilters()
        setLocationsSearch('')
        setLocationsPage(1)
        await refreshLocations()
    }

    /**
     * Recharger toutes les données (jobs et locations)
     */
    const refreshData = async () => {
        await Promise.all([
            resetJobsDataTable(),
            resetLocationsDataTable()
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
                await refreshData()
                return true
            }
            return false
        } catch (error) {
            logger.error('Erreur lors de la création du job', error)
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

                await alertService.success({ text: `${jobIds.length} job(s) validé(s) avec succès` })
                resetAllSelections()
                await refreshData()
            }
        } catch (error) {
            logger.error('Erreur lors de la validation des jobs', error)
            await alertService.error({ text: 'Erreur lors de la validation des jobs' })
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

                await alertService.success({ text: `${jobIds.length} job(s) supprimé(s) avec succès` })
                resetAllSelections()
                await refreshData()
            }
        } catch (error) {
            logger.error('Erreur lors de la suppression des jobs', error)
            await alertService.error({ text: 'Erreur lors de la suppression des jobs' })
        }
    }

    // ===== HANDLERS DATATABLE =====
    // Tous les handlers acceptent StandardDataTableParams directement depuis le DataTable

    /**
     * Handler pour les changements de pagination des jobs
     * Accepte QueryModel, StandardDataTableParams, RestApi, queryParams ou l'ancien format
     *
     * @param params - Paramètres de pagination (format configuré ou ancien format)
     */
    const onJobPaginationChanged = async (params: StandardDataTableParams | { page: number; pageSize: number; start?: number; end?: number } | QueryModel | Record<string, any>) => {
        try {
            // Convertir si nécessaire
            let standardParams: StandardDataTableParams
            // Vérifier si c'est déjà StandardDataTableParams (a start et length)
            if ('start' in params && 'length' in params && typeof params.start === 'number' && typeof params.length === 'number') {
                // Déjà au format StandardDataTableParams
                standardParams = params as StandardDataTableParams
            } else {
                // Convertir depuis { page, pageSize }
                const simpleParams = params as { page: number; pageSize: number }
                // Convertir jobsSortModel de { field, direction } vers { colId, sort } pour convertToStandardDataTableParams
                const convertedSort = (jobsSortModel.value || []).map(s => ({
                    colId: s.field,
                    sort: s.direction
                }))

                // Créer un QueryModel depuis les paramètres actuels
                const queryModelData = createQueryModelFromDataTableParams({
                    page: simpleParams.page,
                    pageSize: simpleParams.pageSize,
                    sort: convertedSort.map(s => ({ field: s.colId, direction: s.sort })),
                    filters: jobsFilters.value ? Object.fromEntries(
                        Object.entries(jobsFilters.value).map(([field, filterConfig]) => [
                            field,
                            {
                                field,
                                dataType: 'text' as const,
                                operator: 'contains' as any,
                                value: filterConfig.filter || filterConfig.value
                            }
                        ])
                    ) : undefined,
                    globalSearch: jobsSearchQuery.value || undefined,
                    customParams: jobsCustomParams.value || {}
                })

                // Convertir selon le mode configuré
                if (jobsQueryOutputMode.value === 'dataTable') {
                standardParams = convertToStandardDataTableParams(
                    {
                        page: simpleParams.page,
                        pageSize: simpleParams.pageSize,
                        filters: jobsFilters.value || {},
                        sort: convertedSort,
                        globalSearch: jobsSearchQuery.value || undefined
                    },
                    {
                        columns: jobsColumns.value,
                        draw: 1,
                        customParams: jobsCustomParams.value || {}
                    }
                )
                } else {
                    standardParams = convertJobsQueryModelToOutput(queryModelData) as StandardDataTableParams
                }
            }

            const pageSize = extractPageSizeFromStandardParams(standardParams, jobsPageSize.value)
            const page = extractPageFromStandardParams(standardParams, pageSize)

            setJobsPageSize(pageSize)
            setJobsPage(page)
            await loadJobs(standardParams)
        } catch (error) {
            logger.error('Erreur dans onJobPaginationChanged', error)
            await alertService.error({ text: 'Erreur lors du changement de pagination' })
        }
    }

    /**
     * Handler pour les changements de tri des jobs
     * Accepte StandardDataTableParams ou un modèle de tri simple
     *
     * @param params - Paramètres de tri au format standard
     */
    const onJobSortChanged = async (params: StandardDataTableParams | any) => {
        try {
            let standardParams: StandardDataTableParams
            let sortModel: Array<{ field: string; direction: 'asc' | 'desc' }>

            // Si c'est déjà StandardDataTableParams
            if (isStandardDataTableParams(params)) {
                standardParams = params
                // Extraire le sortModel au format { field, direction } pour useBackendDataTable
                sortModel = extractSortFromStandardParams(params, jobsColumns.value)
            } else {
                // Sinon, construire StandardDataTableParams depuis les paramètres actuels
                standardParams = convertToStandardDataTableParams(
                    {
                        page: jobsCurrentPage.value || 1,
                        pageSize: jobsPageSize.value || 20,
                        filters: jobsFilters.value || {},
                        sort: params.sortModel || [],
                        globalSearch: jobsSearchQuery.value || undefined
                    },
                    {
                        columns: jobsColumns.value,
                        draw: 1,
                        customParams: jobsCustomParams.value || {}
                    }
                )
                // Si params.sortModel est au format { colId, sort }, convertir en { field, direction }
                if (params.sortModel && Array.isArray(params.sortModel) && params.sortModel.length > 0) {
                    sortModel = params.sortModel.map((s: any) => ({
                        field: s.colId || s.field || '',
                        direction: s.sort || s.direction || 'asc'
                    })).filter((s: any) => s.field)
                } else {
                    sortModel = []
                }
            }

            setJobsSortModel(sortModel)
            await loadJobs(standardParams)
        } catch (error) {
            logger.error('Erreur dans onJobSortChanged', error)
            await alertService.error({ text: 'Erreur lors du changement de tri' })
        }
    }

    /**
     * Handler pour les changements de filtre des jobs
     * Simplifié - accepte uniquement StandardDataTableParams
     *
     * @param filterModel - Paramètres de filtre au format standard
     */
    const onJobFilterChanged = async (filterModel: StandardDataTableParams) => {
        try {
            // Extraire les filtres depuis les paramètres standard
            const extractedFilters = extractFiltersFromStandardParams(filterModel, jobsColumns.value)

            // Synchroniser avec useBackendDataTable pour que le bouton de compteur s'affiche
            setJobsFilters(extractedFilters)

            // Charger les données avec les nouveaux filtres
            await loadJobs(filterModel)
        } catch (error) {
            logger.error('Erreur dans onJobFilterChanged', error)
            await alertService.error({ text: 'Erreur lors du changement de filtre' })
        }
    }

    /**
     * Handler pour les changements de pagination des locations
     * Accepte StandardDataTableParams (émis par DataTable quand serverSidePagination est activé)
     *
     * @param params - Paramètres de pagination au format StandardDataTableParams
     */
    const onLocationPaginationChanged = async (params: StandardDataTableParams | { page: number; pageSize: number; start?: number; end?: number }) => {
        try {
            // Convertir si nécessaire
            let standardParams: StandardDataTableParams
            // Vérifier si c'est déjà StandardDataTableParams (a start et length)
            if ('start' in params && 'length' in params && typeof params.start === 'number' && typeof params.length === 'number') {
                // Déjà au format StandardDataTableParams
                standardParams = params as StandardDataTableParams
            } else {
                // Convertir depuis { page, pageSize }
                const simpleParams = params as { page: number; pageSize: number }
                // Convertir locationsSortModel de { field, direction } vers { colId, sort } pour convertToStandardDataTableParams
                const convertedSort = (locationsSortModel.value || []).map(s => ({
                    colId: s.field,
                    sort: s.direction
                }))

                standardParams = convertToStandardDataTableParams(
                    {
                        page: simpleParams.page,
                        pageSize: simpleParams.pageSize,
                        filters: locationsFilters.value || {},
                        sort: convertedSort,
                        globalSearch: locationsSearchQuery.value || undefined
                    },
                    {
                        columns: locationsColumns.value,
                        draw: 1,
                        customParams: locationsCustomParams.value || {}
                    }
                )
            }

            const pageSize = extractPageSizeFromStandardParams(standardParams, locationsPageSize.value)
            const page = extractPageFromStandardParams(standardParams, pageSize)

            setLocationsPageSize(pageSize)
            setLocationsPage(page)
            await loadLocations(standardParams)
        } catch (error) {
            logger.error('Erreur dans onLocationPaginationChanged', error)
            await alertService.error({ text: 'Erreur lors du changement de pagination' })
        }
    }

    /**
     * Handler pour les changements de tri des locations
     * Simplifié - accepte uniquement StandardDataTableParams
     *
     * @param params - Paramètres de tri au format standard
     */
    const onLocationSortChanged = async (params: StandardDataTableParams) => {
        try {
            // Extraire le sortModel au format { field, direction } pour useBackendDataTable
            const sortModel = extractSortFromStandardParams(params, locationsColumns.value)
            setLocationsSortModel(sortModel)
            await loadLocations(params)
        } catch (error) {
            logger.error('Erreur dans onLocationSortChanged', error)
            await alertService.error({ text: 'Erreur lors du changement de tri' })
        }
    }

    /**
     * Handler pour les changements de filtre des locations
     * Simplifié - accepte uniquement StandardDataTableParams
     *
     * @param filterModel - Paramètres de filtre au format standard
     */
    const onLocationFilterChanged = async (filterModel: StandardDataTableParams) => {
        try {
            // Extraire les filtres depuis les paramètres standard
            const extractedFilters = extractFiltersFromStandardParams(filterModel, locationsColumns.value)

            // Synchroniser avec useBackendDataTable pour que le bouton de compteur s'affiche
            setLocationsFilters(extractedFilters)

            // Charger les données avec les nouveaux filtres
            await loadLocations(filterModel as LocationDataTableParams)
        } catch (error) {
            logger.error('Erreur dans onLocationFilterChanged', error)
            await alertService.error({ text: 'Erreur lors du changement de filtre' })
        }
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
    const selectFieldKey = ref(0)

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
     * Initialiser le composable
     * Résout les IDs de contexte et charge les données initiales
     */
    const initialize = async () => {
        if (isInitialized.value) return

        try {
            logger.debug('Initialisation du planning', { inventoryReference, warehouseReference })

            // Vérifier les références
            if (!inventoryReference || !warehouseReference) {
                throw new Error('Références d\'inventaire ou d\'entrepôt manquantes')
            }

            // Résoudre les IDs
            await resolveContextIds()

            // Vérifier que tous les IDs sont résolus avant de charger les données
            if (!inventoryId.value || !warehouseId.value) {
                throw new Error(`IDs de contexte manquants après résolution - inventaire: ${inventoryId.value}, entrepôt: ${warehouseId.value}`)
            }

            if (!accountId.value) {
                logger.warn('ID de compte non résolu, le chargement des locations peut échouer', {
                    inventoryId: inventoryId.value,
                    accountId: accountId.value
                })
            }

            // Charger les données initiales
            logger.debug('Chargement des données initiales (jobs et locations)', {
                inventoryId: inventoryId.value,
                warehouseId: warehouseId.value,
                accountId: accountId.value
            })
            await refreshData()

            isInitialized.value = true
            logger.debug('Initialisation du planning terminée avec succès', {
                inventoryId: inventoryId.value,
                warehouseId: warehouseId.value,
                accountId: accountId.value,
                jobsCount: transformedJobs.value.length,
                locationsCount: mappedLocations.value.length
            })
        } catch (error) {
            logger.error('Erreur lors de l\'initialisation du planning', error)
            await alertService.error({ text: 'Erreur lors de l\'initialisation du planning' })
        }
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
     * État de pagination pour compatibilité
     */
    const paginationState = computed(() => ({
        currentPage: jobsCurrentPage.value,
        pageSize: jobsPageSize.value,
        sortBy: '',
        sortOrder: 'asc' as 'asc' | 'desc'
    }))

    /**
     * État des filtres pour compatibilité
     */
    const filterState = computed(() => ({
        sortModel: jobsSortModel.value || [],
        filterModel: {},
        locationSearchQuery: locationsSearchQuery.value || ''
    }))

    /**
     * Indicateur de disponibilité de jobs
     */
    const hasAvailableJobs = computed(() => transformedJobs.value.length > 0)

    /**
     * Options pour le sélecteur de jobs
     */
    const jobSelectOptions = computed(() =>
        transformedJobs.value.map(job => ({
            value: job.id.toString(),
            label: job.reference || `Job ${job.id}`
        }))
    )

    // Colonnes adaptées pour compatibilité
    const adaptedStoreJobsColumns = jobsColumns
    const adaptedAvailableLocationColumns = locationsColumns

    // ===== MÉTHODES POUR COMPATIBILITÉ =====

    /**
     * Appliquer des filtres aux jobs (pour compatibilité)
     * Désormais, le DataTable appelle directement onJobFilterChanged avec StandardDataTableParams
     */
    const applyJobFilters = async (filterModel: StandardDataTableParams) => {
        await onJobFilterChanged(filterModel)
    }

    /**
     * Appliquer des filtres aux locations (pour compatibilité)
     * Désormais, le DataTable appelle directement onLocationFilterChanged avec StandardDataTableParams
     */
    const applyLocationFilters = async (filterModel: StandardDataTableParams) => {
        await onLocationFilterChanged(filterModel)
    }

    /**
     * Handler pour la recherche globale des jobs
     * Le DataTable gère maintenant la recherche globale via global-search-changed qui émet StandardDataTableParams
     *
     * @param searchParams - Paramètres de recherche au format standard
     */
    const onJobSearchChanged = async (searchParams: StandardDataTableParams) => {
        try {
            await loadJobs(searchParams)
        } catch (error) {
            logger.error('Erreur dans onJobSearchChanged', error)
            await alertService.error({ text: 'Erreur lors de la recherche' })
        }
    }

    /**
     * Handler pour la recherche globale des locations
     * Le DataTable gère maintenant la recherche globale via global-search-changed qui émet StandardDataTableParams
     *
     * @param searchParams - Paramètres de recherche au format standard
     */
    const onLocationSearchChanged = async (searchParams: StandardDataTableParams) => {
        try {
            await loadLocations(searchParams as LocationDataTableParams)
        } catch (error) {
            logger.error('Erreur dans onLocationSearchChanged', error)
            await alertService.error({ text: 'Erreur lors de la recherche' })
        }
    }

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
     * Mettre à jour la pagination
     *
     * @param newState - Nouvel état de pagination
     */
    const updatePagination = (newState: Partial<{ currentPage: number; pageSize: number; sortBy: string; sortOrder: 'asc' | 'desc' }>) => {
        if (newState.currentPage) setJobsPage(newState.currentPage)
        if (newState.pageSize) setJobsPageSize(newState.pageSize)
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

                await alertService.success({ text: 'Emplacements ajoutés avec succès' })
                resetAllSelections()
                await refreshData()
            }
        } catch (error) {
            logger.error('Erreur lors de l\'ajout d\'emplacements au job', error)
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
        await resetLocationsDataTable()
    }

    /**
     * Wrapper pour le rafraîchissement de toutes les données
     */
    const onRefreshData = async () => {
        await refreshData()
    }

    /**
     * Handler pour les filtres de la table imbriquée
     *
     * @param filterModel - Modèle de filtres (StandardDataTableParams)
     */
    const onNestedTableFilterChanged = async (filterModel: StandardDataTableParams | Record<string, { filter: string }>) => {
        // Si c'est StandardDataTableParams, appeler directement
        if (isStandardDataTableParams(filterModel)) {
            await onJobFilterChanged(filterModel)
        } else {
            // Sinon, convertir via onJobFilterChanged qui gère les deux formats
            await onJobFilterChanged(filterModel as any)
        }
    }

    // ===== HANDLERS DATATABLE SIMPLIFIÉS =====

    /**
     * Handler pour les changements de filtres des jobs
     * Le filterState du DataTable est déjà mis à jour dans handleFilterChanged du DataTable
     * Ici, on appelle simplement le handler du composable pour traiter les filtres côté serveur
     */
    const handleJobFilterChanged = async (filterModel: StandardDataTableParams | any) => {
        await onJobFilterChanged(filterModel as StandardDataTableParams)
    }

    /**
     * Handler pour les changements de filtres des locations
     * Le filterState du DataTable est déjà mis à jour dans handleFilterChanged du DataTable
     * Ici, on appelle simplement le handler du composable pour traiter les filtres côté serveur
     */
    const handleLocationFilterChanged = async (filterModel: StandardDataTableParams | any) => {
        await onLocationFilterChanged(filterModel as StandardDataTableParams)
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
            logger.error('Erreur lors de la suppression de l\'emplacement', error)
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

    // Initialiser au montage
    onMounted(() => {
        selectedAvailableLocations.value = []
        selectedJobs.value = []
        setupJobExpansion()
        void initialize()
    })

    // ===== RETURN =====

    return {
        // État
        inventoryId: computed(() => inventoryId.value),
        accountId: computed(() => accountId.value),
        warehouseId: computed(() => warehouseId.value),
        inventoryReference,
        warehouseReference,
        isInitialized,
        loading,

        // États pour compatibilité
        planningState,
        paginationState,
        filterState,

        // Données Jobs
        jobs: transformedJobs,
        jobsLoading,
        jobsCurrentPage,
        jobsPageSize,

        // QueryModel Jobs
        jobsQueryModel: computed(() => jobsQueryModelRef.value),
        jobsQueryOutputMode: computed(() => jobsQueryOutputMode.value),
        convertJobsQueryModelToOutput,

        // QueryModel Locations (non implémenté pour l'instant)
        locationsQueryModel: computed(() => null),
        locationsQueryOutputMode: computed(() => 'queryParams' as const),
        convertLocationsQueryModelToOutput: () => ({}),
        jobsSearchQuery,
        jobsSortModel,
        jobsFilters, // Exposer les filtres pour synchronisation avec DataTable
        jobsPagination: jobsPaginationComputed,
        jobsTotalItems: computed(() => jobStore.totalCount || 0),
        jobsColumns,
        jobsActions,

        // Données Locations
        locations: mappedLocations,
        availableLocations,
        locationsLoading,
        locationsCurrentPage,
        locationsPageSize,
        locationsSearchQuery,
        locationsSortModel,
        locationsFilters, // Exposer les filtres pour synchronisation avec DataTable
        locationsPagination: locationsPaginationComputed,
        locationsTotalItems: computed(() => locationStore.totalCount || 0),
        locationsColumns,

        // Sélections
        selectedAvailableLocations,
        selectedJobs,
        hasSelectedLocations,
        hasSelectedJobs,

        // Computed additionnels
        hasAvailableJobs,
        jobSelectOptions,

        // Colonnes adaptées
        adaptedStoreJobsColumns,
        adaptedAvailableLocationColumns,

        // Méthodes DataTable Jobs
        setJobsPage,
        setJobsPageSize,
        setJobsSearch,
        setJobsSortModel,
        setJobsFilters,
        resetJobsFilters,
        refreshJobs,

        // Méthodes DataTable Locations
        setLocationsPage,
        setLocationsPageSize,
        setLocationsSearch,
        setLocationsSortModel,
        setLocationsFilters,
        resetLocationsFilters,
        refreshLocations,

        // Actions
        createJobFromSelectedLocations,
        bulkValidateJobs,
        bulkDeleteJobs,
        refreshData,
        initialize,
        resetJobsDataTable,
        resetLocationsDataTable,

        // Actions pour compatibilité
        applyJobFilters,
        applyLocationFilters,
        updateSelection,
        clearSelection,
        resetAllSelections,
        updatePagination,
        updateFilters,

        // Handlers DataTable
        onJobPaginationChanged,
        onJobSortChanged,
        onJobFilterChanged,
        onLocationPaginationChanged,
        onLocationSortChanged,
        onLocationFilterChanged,
        onAvailableSelectionChanged,
        onJobSelectionChanged,
        onSelectJobForLocation,
        onBulkValidate,
        onReturnSelectedJobs,
        onRefreshLocations,
        onRefreshData,
        onNestedTableFilterChanged,

        // Handlers simplifiés pour la vue
        handleJobFilterChanged,
        handleLocationFilterChanged,

        // Computed pour la vue
        selectedJobsCount,
        jobsCustomParams,
        locationsCustomParams,

        // Références DataTable
        availableLocationsTableRef,
        jobsTableRef,
        availableLocationsKey,
        jobsKey,
        selectFieldKey,

        // Méthodes utilitaires
        resetDataTableSelections,
        removeLocationFromNestedTable,
        createSingleJob,
        onBulkValidateHandler,

        // Navigation
        handleGoToInventoryDetail,
        handleGoToAffectation
    }
}
