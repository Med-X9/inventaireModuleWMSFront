import { ref, computed, markRaw, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBackendDataTable } from '@/components/DataTable/composables/useBackendDataTable'
import { logger } from '@/services/loggerService'
import { alertService } from '@/services/alertService'
import { useJobStore } from '@/stores/job'
import { useLocationStore } from '@/stores/location'
import { useInventoryStore } from '@/stores/inventory'
import { useWarehouseStore } from '@/stores/warehouse'
import type { DataTableColumn, ColumnDataType, ActionConfig } from '@/types/dataTable'
import type { Job, JobTable } from '@/models/Job'
import type { Location } from '@/models/Location'
import type { LocationDataTableParams } from '@/services/LocationService'

// Import des icônes
import IconCheck from '@/components/icon/icon-check.vue'
import IconTrash from '@/components/icon/icon-trash.vue'

/**
 * Options pour initialiser le composable de planning
 */
interface PlanningOptions {
    inventoryReference?: string
    warehouseReference?: string
}

/**
 * Composable pour la gestion du planning d'inventaire
 * Gère les jobs et les locations disponibles
 * Utilise useBackendDataTable pour l'intégration avec Pinia
 */
export function usePlanning(options?: PlanningOptions) {
    const route = useRoute()
    const jobStore = useJobStore()
    const locationStore = useLocationStore()
    const inventoryStore = useInventoryStore()
    const warehouseStore = useWarehouseStore()

    // ===== ÉTAT LOCAL =====
    const inventoryReference = options?.inventoryReference ?? (route.params.reference as string)
    const warehouseReference = options?.warehouseReference ?? (route.params.warehouse as string)

    const inventoryId = ref<number | null>(null)
    const warehouseId = ref<number | null>(null)
    const accountId = ref<number | null>(null)
    const isInitialized = ref(false)

    // Sélections
    const selectedAvailableLocations = ref<string[]>([])
    const selectedJobs = ref<string[]>([])

    // ===== INITIALISATION DES DATATABLES =====

    /**
     * DataTable pour les jobs
     */
    const {
        data: jobs,
        loading: jobsLoading,
        currentPage: jobsCurrentPage,
        pageSize: jobsPageSize,
        searchQuery: jobsSearchQuery,
        sortModel: jobsSortModel,
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

    /**
     * DataTable pour les locations disponibles
     */
    const {
        data: locations,
        loading: locationsLoading,
        currentPage: locationsCurrentPage,
        pageSize: locationsPageSize,
        searchQuery: locationsSearchQuery,
        sortModel: locationsSortModel,
        setPage: setLocationsPage,
        setPageSize: setLocationsPageSize,
        setSearch: setLocationsSearch,
        setSortModel: setLocationsSortModel,
        setFilters: setLocationsFilters,
        resetFilters: resetLocationsFilters,
        refresh: _refreshLocationsDataTable,
        pagination: locationsPagination
    } = useBackendDataTable<Location>('', {
        piniaStore: locationStore,
        storeId: 'location',
        autoLoad: false,
        pageSize: 20
    })

    // ===== COMPUTED =====

    const loading = computed(() => jobsLoading.value || locationsLoading.value)

    /**
     * Transformer les jobs pour aplatir les propriétés imbriquées des locations
     * Cela permet à la DataTable nested d'afficher correctement zone et sous_zone
     */
    const dedupeJobLocations = (job: Job | JobTable) => {
        const rawLocations = ((job as any).locations ?? (job as any).emplacements ?? []) as Array<Record<string, any>>
        const uniqueLocations = new Map<string | number | symbol, Record<string, any>>()

        rawLocations.forEach((loc, index) => {
            const key =
                loc.id ??
                loc.location_id ??
                loc.location_reference ??
                loc.reference ??
                Symbol(`job-location-${index}`)
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

    const transformedJobs = computed(() => {
        return jobs.value.map(job => ({
            ...job,
            locations: dedupeJobLocations(job)
        }))
    })

    const mappedLocations = computed(() => {
        return locations.value.map(loc => ({
            ...loc,
            location_reference: (loc as any).location_reference ?? (loc as any).reference ?? loc.reference ?? '',
            zone_name: loc.zone?.zone_name || (loc as any).zone_name || 'N/A',
            sous_zone_name: loc.sous_zone?.sous_zone_name || (loc as any).sous_zone_name || 'N/A'
        }))
    })

    const availableLocations = computed(() => {
        // Exclure les locations déjà utilisées dans les jobs
        const usedLocationIds = new Set<number | string>()

        transformedJobs.value.forEach(job => {
            job.locations?.forEach(loc => {
                const key = loc.id ?? loc.location_id ?? (loc as any).location_reference ?? loc.reference
                if (key !== undefined && key !== null) {
                    usedLocationIds.add(key)
                }
            })
        })

        return mappedLocations.value.filter(loc => {
            const key = loc.id ?? (loc as any).location_id ?? (loc as any).location_reference ?? loc.reference
            return key === undefined || key === null ? true : !usedLocationIds.has(key)
        })
    })

    const resetJobsDataTable = async () => {
        setJobsSortModel([])
        resetJobsFilters()
        setJobsSearch('')
        await refreshJobs()
    }

    const resetLocationsDataTable = async () => {
        setLocationsSortModel([])
        resetLocationsFilters()
        setLocationsSearch('')
        await refreshLocations()
    }

    const hasSelectedLocations = computed(() => selectedAvailableLocations.value.length > 0)
    const hasSelectedJobs = computed(() => selectedJobs.value.length > 0)



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
            dataType: 'text' as ColumnDataType,
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

    // ===== COLONNES POUR LES LOCATIONS DISPONIBLES =====

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
     */
    const resolveContextIds = async () => {
        try {
            logger.debug('Résolution des IDs de contexte...', { inventoryReference, warehouseReference })

            // Résoudre l'inventaire et récupérer l'account_id
            if (inventoryReference) {
                const inventory = await inventoryStore.fetchInventoryByReference(inventoryReference)
                inventoryId.value = inventory?.id ?? null
                accountId.value = inventory?.account_id ?? null
                logger.debug('IDs inventaire et compte résolus', { inventoryId: inventoryId.value, accountId: accountId.value })
            }

            // Résoudre l'entrepôt
            if (warehouseReference) {
                warehouseId.value = await warehouseStore.fetchWarehouseByReference(warehouseReference)
                logger.debug('ID entrepôt résolu', { warehouseId: warehouseId.value })
            }

            // Validation
            if (!inventoryId.value || !warehouseId.value) {
                throw new Error(`IDs de contexte manquants - inventaire: ${inventoryId.value}, entrepôt: ${warehouseId.value}`)
            }

            if (!accountId.value) {
                logger.warn('ID de compte non résolu, certaines fonctionnalités peuvent être limitées')
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
     */
    const loadJobs = async (params?: LocationDataTableParams) => {
        if (!inventoryId.value || !warehouseId.value) {
            logger.warn('Impossible de charger les jobs, IDs manquants')
            return
        }

        try {
            await jobStore.fetchJobs(inventoryId.value, warehouseId.value, params)
        } catch (error) {
            logger.error('Erreur lors du chargement des jobs', error)
            await alertService.error({ text: 'Erreur lors du chargement des jobs' })
        }
    }

    /**
     * Charger les locations disponibles pour l'entrepôt actuel
     */
    const loadLocations = async (params?: LocationDataTableParams) => {
        if (!accountId.value || !inventoryId.value || !warehouseId.value) {
            logger.warn('Impossible de charger les locations, IDs manquants')
            return
        }

        try {
            // Si pas de paramètres, utiliser les valeurs par défaut au format DataTable
            const defaultParams: LocationDataTableParams = params || {
                draw: 1,
                start: 0,
                length: locationsPageSize.value
            }

            logger.debug('Chargement des locations avec paramètres DataTable:', {
                accountId: accountId.value,
                warehouseId: warehouseId.value,
                params: defaultParams
            })

            await locationStore.fetchUnassignedLocations(accountId.value, inventoryId.value, warehouseId.value, defaultParams)
        } catch (error) {
            logger.error('Erreur lors du chargement des locations', error)
            await alertService.error({ text: 'Erreur lors du chargement des locations' })
        }
    }

    const refreshJobs = async (params?: LocationDataTableParams) => {
        await loadJobs(params)
    }

    const refreshLocations = async (params?: LocationDataTableParams) => {
        await loadLocations(params)
    }

    /**
     * Recharger toutes les données
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

                // Réinitialiser la sélection et recharger
                selectedAvailableLocations.value = []
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

                // Réinitialiser la sélection et recharger
                selectedJobs.value = []
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

                // Réinitialiser la sélection et recharger
                selectedJobs.value = []
                await refreshData()
            }
        } catch (error) {
            logger.error('Erreur lors de la suppression des jobs', error)
            await alertService.error({ text: 'Erreur lors de la suppression des jobs' })
        }
    }

    // ===== HANDLERS DATATABLE =====

    /**
     * Convertir les paramètres de pagination au format DataTable
     */
    const convertToDataTableParams = (params: { page: number; pageSize: number }): LocationDataTableParams => {
        return {
            draw: params.page,
            start: (params.page - 1) * params.pageSize,
            length: params.pageSize
        }
    }

    const onJobPaginationChanged = async (params: { page: number; pageSize: number }) => {
        const dataTableParams = convertToDataTableParams(params)
        await loadJobs(dataTableParams)
    }

    const onJobSortChanged = async (sortModel: Array<{ colId: string; sort: 'asc' | 'desc' }>) => {
        await loadJobs({ sort: sortModel } as LocationDataTableParams)
    }

    const onJobFilterChanged = async (filterModel: Record<string, { filter: string }>) => {
        await loadJobs(filterModel as any)
    }

    const onLocationPaginationChanged = async (params: { page: number; pageSize: number }) => {
        const dataTableParams = convertToDataTableParams(params)
        await loadLocations(dataTableParams)
    }

    const onLocationSortChanged = async (sortModel: Array<{ colId: string; sort: 'asc' | 'desc' }>) => {
        await loadLocations({ sort: sortModel } as LocationDataTableParams)
    }

    const onLocationFilterChanged = async (filterModel: Record<string, { filter: string }>) => {
        await loadLocations(filterModel as any)
    }

    const onAvailableSelectionChanged = (selectedRows: Set<string>) => {
        selectedAvailableLocations.value = Array.from(selectedRows)
    }

    const onJobSelectionChanged = (selectedRows: Set<string>) => {
        selectedJobs.value = Array.from(selectedRows)
    }

    // ===== INITIALISATION =====

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

            // Charger les données initiales
            await refreshData()

            isInitialized.value = true
            logger.debug('Initialisation du planning terminée avec succès')
        } catch (error) {
            logger.error('Erreur lors de l\'initialisation du planning', error)
            await alertService.error({ text: 'Erreur lors de l\'initialisation du planning' })
        }
    }

    // Initialiser au montage
    onMounted(() => {
        void initialize()
    })

    // ===== COMPUTED ADDITIONNELS POUR COMPATIBILITÉ =====

    // États pour compatibilité avec Planning.vue
    const planningState = computed(() => ({
        selectedAvailable: selectedAvailableLocations.value,
        selectedJobs: selectedJobs.value,
        selectedJobToAddLocation: '',
        expandedJobIds: new Set<string>(),
        isSubmitting: false
    }))

    const paginationState = computed(() => ({
        currentPage: jobsCurrentPage.value,
        pageSize: jobsPageSize.value,
        sortBy: '',
        sortOrder: 'asc' as 'asc' | 'desc'
    }))

    const filterState = computed(() => ({
        sortModel: jobsSortModel.value || [],
        filterModel: {},
        locationSearchQuery: locationsSearchQuery.value || ''
    }))

    const hasAvailableJobs = computed(() => transformedJobs.value.length > 0)

    const jobSelectOptions = computed(() =>
        transformedJobs.value.map(job => ({
            value: job.id.toString(),
            label: job.reference || `Job ${job.id}`
        }))
    )

    // Colonnes adaptées pour compatibilité
    const adaptedStoreJobsColumns = jobsColumns
    const adaptedAvailableLocationColumns = locationsColumns

    // ===== MÉTHODES ADDITIONNELLES POUR COMPATIBILITÉ =====

    const applyJobFilters = async (filterModel: Record<string, { filter: string }>) => {
        await onJobFilterChanged(filterModel)
    }

    const applyLocationFilters = async (filterModel: Record<string, { filter: string }>) => {
        await onLocationFilterChanged(filterModel)
    }

    const updateSelection = (type: 'available' | 'jobs', selection: string[]) => {
        if (type === 'available') {
            selectedAvailableLocations.value = selection
        } else {
            selectedJobs.value = selection
        }
    }

    const clearSelection = (type: 'available' | 'jobs') => {
        if (type === 'available') {
            selectedAvailableLocations.value = []
        } else {
            selectedJobs.value = []
        }
    }

    const updatePagination = (newState: Partial<{ currentPage: number; pageSize: number; sortBy: string; sortOrder: 'asc' | 'desc' }>) => {
        if (newState.currentPage) setJobsPage(newState.currentPage)
        if (newState.pageSize) setJobsPageSize(newState.pageSize)
    }

    const updateFilters = (newFilters: any) => {
        // Logique de mise à jour des filtres si nécessaire
    }

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
                selectedAvailableLocations.value = []
                await refreshData()
            }
        } catch (error) {
            logger.error('Erreur lors de l\'ajout d\'emplacements au job', error)
            await alertService.error({ text: 'Erreur lors de l\'ajout d\'emplacements au job' })
        }
    }

    const onBulkValidate = async () => {
        await bulkValidateJobs()
    }

    const onReturnSelectedJobs = async () => {
        await bulkDeleteJobs()
    }

    const onRefreshLocations = async () => {
        await resetLocationsDataTable()
    }

    const onRefreshData = async () => {
        await refreshData()
    }

    const onNestedTableFilterChanged = async (filterModel: Record<string, { filter: string }>) => {
        await onJobFilterChanged(filterModel)
    }

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
        jobsSearchQuery,
        jobsSortModel,
        jobsPagination,
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
        locationsPagination,
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
        onNestedTableFilterChanged
    }
}
