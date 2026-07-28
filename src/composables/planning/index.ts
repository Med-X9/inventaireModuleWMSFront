/**
 * Composable pour la gestion du planning d'inventaire (jobs + emplacements disponibles).
 * Communication DataTable via QueryModel uniquement — voir PAGINATION_FRONTEND.md
 *
 * @module usePlanning
 */

import { ref, computed, nextTick, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { alertService } from '@/services/alertService'
import { useJobStore } from '@/stores/job'
import { useLocationStore } from '@/stores/location'
import { useInventoryStore } from '@/stores/inventory'
import { useWarehouseStore } from '@/stores/warehouse'
import { mergeQueryModelWithCustomParams } from '@SMATCH-Digital-dev/vue-system-design'
import type { QueryModel } from '@SMATCH-Digital-dev/vue-system-design'
import { INITIALIZATION_DELAY_MS } from '@/composables/useInventoryResults.constants'
import { createDataTableOperationHandler } from '@/composables/dataTable/createDataTableOperationHandler'
import { createJobsColumns, createLocationsColumns } from '@/composables/planning/usePlanningColumns'
import { PLANNING_DEFAULT_PAGE_SIZE } from '@/composables/planning/constants'
import type { PlanningOptions } from '@/composables/planning/types'
import { usePlanningBulk } from '@/composables/planning/usePlanningBulk'
import { createPlanningDataTableActions } from '@/composables/planning/usePlanningDataTableActions'
import { resolvePlanningContextIds } from '@/composables/planning/usePlanningContext'
import { usePlanningTableData } from '@/composables/planning/usePlanningTableData'
import { usePlanningButtons } from '@/composables/planning/usePlanningButtons'
import { useWarehouseSettingStatus } from '@/composables/useWarehouseSettingStatus'

// ===== COMPOSABLE =====

/**
 * Composable pour la gestion du planning d'inventaire
 *
 * @param options - Options d'initialisation (r?f?rences d'inventaire et d'entrep?t)
 * @returns Objet contenant l'?tat, les m?thodes et les handlers pour le planning
 */
export function usePlanning(options?: PlanningOptions) {
    // ===== ROUTER & STORES =====
    const route = useRoute()
    const router = useRouter()
    const jobStore = useJobStore()
    const locationStore = useLocationStore()
    const inventoryStore = useInventoryStore()
    const warehouseStore = useWarehouseStore()

    const { jobs: storeJobs, paginationMetadata: jobPaginationMetadata } = storeToRefs(jobStore)
    const { locations: storeLocations, paginationMetadata: locationPaginationMetadata } = storeToRefs(locationStore)

    const { jobs, locations, syncJobsTableRows, syncLocationsTableRows } = usePlanningTableData(
        storeJobs,
        storeLocations,
    )

    let jobsPageRecoveryAttempted = false
    let locationsPageRecoveryAttempted = false

    /**
     * Si le total serveur > 0 mais la page courante est vide (souvent page restaur?e invalide
     * depuis localStorage), recharge la page 1.
     */
    const recoverEmptyJobsPage = async (requestedPage?: number) => {
        if (jobsPageRecoveryAttempted) return
        const total = jobPaginationMetadata.value?.total ?? 0
        if ((storeJobs.value?.length ?? 0) > 0 || total === 0) return

        const currentPage = requestedPage ?? jobPaginationMetadata.value?.page ?? 1
        if (currentPage <= 1) return

        jobsPageRecoveryAttempted = true
        lastJobsQueryModel = null
        await loadJobs()
    }

    const recoverEmptyLocationsPage = async (requestedPage?: number) => {
        if (locationsPageRecoveryAttempted) return
        const total = locationPaginationMetadata.value?.total ?? 0
        if ((storeLocations.value?.length ?? 0) > 0 || total === 0) return

        const currentPage = requestedPage ?? locationPaginationMetadata.value?.page ?? 1
        if (currentPage <= 1) return

        locationsPageRecoveryAttempted = true
        lastLocationsQueryModel = null
        await loadLocations()
    }

    // ===== ??TAT LOCAL =====

    /** R?f?rence de l'inventaire (depuis les options ou la route) */
    const inventoryReference = options?.inventoryReference ?? (route.params.reference as string)

    /** R?f?rence de l'entrep?t (depuis les options ou la route) */
    const warehouseReference = options?.warehouseReference ?? (route.params.warehouse as string)

    /** ID de l'inventaire (r?solu depuis la r?f?rence) */
    const inventoryId = ref<number | null>(null)

    /** ID de l'entrep?t (r?solu depuis la r?f?rence) */
    const warehouseId = ref<number | null>(null)

    /** Statut Setting magasin — conditionne les actions d'édition */
    const {
        settingStatus,
        settingStatusLoading,
        isSettingEnAttente,
        canEditPlanning,
        fetchSettingStatus,
    } = useWarehouseSettingStatus(inventoryId, warehouseId)

    /** ID du compte (r?cup?r? depuis l'inventaire) */
    const accountId = ref<number | null>(null)

    /** Indicateur d'initialisation */
    const isInitialized = ref(false)

    /** Indicateur d'initialisation en cours pour ?viter les appels multiples */
    const isInitializing = ref(false)


    /** ??tats de chargement locaux pour afficher le skeleton imm?diatement */
    const jobsLoadingLocal = ref(false)
    const locationsLoadingLocal = ref(false)

    // File d'attente pour les ?v?nements DataTable qui arrivent avant l'initialisation
    const jobsPendingEventsQueue: Array<{ eventType: string; queryModel: QueryModel }> = []
    const locationsPendingEventsQueue: Array<{ eventType: string; queryModel: QueryModel }> = []

    // ===== S??LECTIONS =====

    /** IDs des locations disponibles s?lectionn?es */
    const selectedAvailableLocations = ref<string[]>([])

    /** IDs des jobs s?lectionn?s */
    const selectedJobs = ref<string[]>([])

    // ===== ??TATS LOCAUX =====

    const jobsLoading = computed(() => jobsLoadingLocal.value)
    const locationsLoading = computed(() => locationsLoadingLocal.value)
    const isDataLoaded = ref(false)

    // ===== MODALS =====

    /** ??tats des modals */
    const showAddToJobModal = ref(false)
    const selectedJobForModal = ref<string | number | null>(null)

    const jobsColumns = createJobsColumns()
    const locationsColumns = createLocationsColumns()

    const hasSelectedLocations = computed(() => selectedAvailableLocations.value.length > 0)

    /**
     * Indicateur de s?lection de jobs
     */
    const hasSelectedJobs = computed(() => selectedJobs.value.length > 0)


    const resetAllSelections = () => {
        selectedAvailableLocations.value = []
        selectedJobs.value = []
    }

    // ===== M??THODES DE R??SOLUTION DES IDS =====

    const resolveContextIds = async () => {
        await resolvePlanningContextIds(
            inventoryReference,
            warehouseReference,
            inventoryStore,
            warehouseStore,
            { inventoryId, warehouseId, accountId }
        )
        await fetchSettingStatus()
    }

    // ===== M??THODES DE CHARGEMENT DES DONN??ES =====

    /**
     * Recharger toutes les donn?es (jobs et locations) avec le dernier query pour garder page/filtres
     */
    const refreshData = async () => {
        await Promise.all([
            refreshJobs(lastJobsQueryModel ?? undefined),
            refreshLocations(lastLocationsQueryModel ?? undefined)
        ])
    }

    const {
        createJobFromSelectedLocations,
        bulkValidateJobs,
        validateAllJobs,
        bulkResetJobs,
        bulkDeleteJobs,
        bulkDeactivateLocations,
    } = usePlanningBulk({
        selectedAvailableLocations,
        selectedJobs,
        inventoryId,
        warehouseId,
        hasSelectedLocations,
        hasSelectedJobs,
        jobStore,
        locationStore,
        resetAllSelections,
        refreshData,
    })

    const { jobsActions, locationsActions } = createPlanningDataTableActions({
        jobStore,
        resetAllSelections,
        refreshData,
        bulkDeactivateLocations,
        canEditPlanning,
    })

    // ===== HANDLERS DATATABLE =====

    let lastJobsQueryModel: QueryModel | null = null
    let lastLocationsQueryModel: QueryModel | null = null

    const handleJobsOperation = createDataTableOperationHandler({
        fetch: async (finalQueryModel) => {
            await jobStore.fetchJobs(inventoryId.value!, warehouseId.value!, finalQueryModel)
            await nextTick()
            syncJobsTableRows()
            await recoverEmptyJobsPage(finalQueryModel.page)
        },
        getLastQueryModel: () => lastJobsQueryModel,
        setLastQueryModel: (qm) => { lastJobsQueryModel = qm },
        onLoading: (loading) => { jobsLoadingLocal.value = loading },
        canFetch: () => !!(inventoryId.value && warehouseId.value),
        onError: async (error) => {
            console.error('[usePlanning] Error in jobStore.fetchJobs:', error)
            await alertService.error({ text: 'Erreur lors du chargement des jobs' })
        },
    })

    const handleLocationsOperation = createDataTableOperationHandler({
        fetch: async (finalQueryModel) => {
            await locationStore.fetchUnassignedLocations(
                accountId.value!,
                inventoryId.value!,
                warehouseId.value!,
                finalQueryModel
            )
            await nextTick()
            syncLocationsTableRows()
            await recoverEmptyLocationsPage(finalQueryModel.page)
        },
        getLastQueryModel: () => lastLocationsQueryModel,
        setLastQueryModel: (qm) => { lastLocationsQueryModel = qm },
        onLoading: (loading) => { locationsLoadingLocal.value = loading },
        canFetch: () => !!(accountId.value && inventoryId.value && warehouseId.value),
        onError: async (error) => {
            console.error('[usePlanning] Error in locationStore.fetchUnassignedLocations:', error)
            await alertService.error({ text: 'Erreur lors du chargement des locations' })
        },
    })

    const processJobsEventDirectly = async (_eventType: string, queryModel: QueryModel) => {
        await handleJobsOperation(queryModel)
    }

    const processLocationsEventDirectly = async (_eventType: string, queryModel: QueryModel) => {
        await handleLocationsOperation(queryModel)
    }

    const onJobsTableEvent = async (eventType: string, queryModel: QueryModel) => {
        if (!isInitialized.value) {
            jobsPendingEventsQueue.push({ eventType, queryModel })
            return
        }
        if (!inventoryId.value || !warehouseId.value) {
            console.warn('[usePlanning] Jobs API not called: missing inventoryId or warehouseId after initialization')
            return
        }
        await processJobsEventDirectly(eventType, queryModel)
    }

    const onLocationsTableEvent = async (eventType: string, queryModel: QueryModel) => {
        if (!isInitialized.value) {
            locationsPendingEventsQueue.push({ eventType, queryModel })
            return
        }
        if (!accountId.value || !inventoryId.value || !warehouseId.value) {
            console.warn('[usePlanning] Locations API not called: missing accountId, inventoryId or warehouseId after initialization')
            return
        }
        await processLocationsEventDirectly(eventType, queryModel)
    }

    const onAvailableSelectionChanged = (selectedRows: Set<string>) => {
        selectedAvailableLocations.value = selectedRows ? Array.from(selectedRows) : []
    }

    const onJobSelectionChanged = (selectedRows: Set<string>) => {
        selectedJobs.value = selectedRows ? Array.from(selectedRows) : []
    }

    const availableLocationsTableRef = ref<any>(null)
    const jobsTableRef = ref<any>(null)

    // ⚡ FIX : jobsTableKey/locationsTableKey (et tableRenderGeneration qui ne servait qu'à
    // elles) ont été supprimés. Ils alimentaient un :key volatile sur les deux <DataTable>,
    // forçant un remount complet à chaque refresh (perte de scroll, tri, filtres...). Le
    // rendu de cellule figé qui motivait ce contournement était un bug de cache côté package
    // (cellRendererPool basé sur row.id/reference plutôt que le contenu complet), corrigé.

    // ===== COMPUTED PROPERTIES =====

    /**
     * Nombre de jobs s?lectionn?s
     */
    const selectedJobsCount = computed(() => selectedJobs.value.length)

    /**
     * Param?tres personnalis?s pour la DataTable des jobs
     * Inclut les IDs n?cessaires pour les appels API
     */
    const jobsCustomParams = computed(() => ({
        inventory_id: inventoryId.value,
        warehouse_id: warehouseId.value
    }))

    /**
     * Param?tres personnalis?s pour la DataTable des locations
     * Inclut les IDs n?cessaires pour les appels API
     */
    const locationsCustomParams = computed(() => ({
        account_id: accountId.value,
        inventory_id: inventoryId.value,
        warehouse_id: warehouseId.value
    }))

    // ===== INITIALISATION =====

    /**
     * Traite les ?v?nements DataTable mis en file d'attente pendant l'initialisation
     */
    const processPendingEvents = async () => {
        // Traiter les ?v?nements jobs en file d'attente
        if (jobsPendingEventsQueue.length > 0) {
            const jobsEvents = [...jobsPendingEventsQueue]
            jobsPendingEventsQueue.length = 0

            for (const event of jobsEvents) {
                await processJobsEventDirectly(event.eventType, event.queryModel)
            }
        }

        // Traiter les ?v?nements locations en file d'attente
        if (locationsPendingEventsQueue.length > 0) {
            const locationsEvents = [...locationsPendingEventsQueue]
            locationsPendingEventsQueue.length = 0

            for (const event of locationsEvents) {
                await processLocationsEventDirectly(event.eventType, event.queryModel)
            }
        }
    }

    /**
     * Charge les jobs avec des param?tres sp?cifiques
     */
    const loadJobs = async (params?: QueryModel) => {
        if (!inventoryId.value || !warehouseId.value) {
            return
        }

        jobsLoadingLocal.value = true

        try {
            const finalParams: QueryModel = params || mergeQueryModelWithCustomParams(
                { page: 1, pageSize: PLANNING_DEFAULT_PAGE_SIZE },
                jobsCustomParams.value,
            )

            lastJobsQueryModel = null
            await jobStore.fetchJobs(inventoryId.value, warehouseId.value, finalParams)
            await nextTick()
            syncJobsTableRows()

            lastJobsQueryModel = { ...finalParams }
            jobsLoadingLocal.value = false
            await recoverEmptyJobsPage(finalParams.page)
        } catch (error) {
            console.error('[usePlanning.loadJobs] ?? Error during job load:', error)
            await alertService.error({ text: 'Erreur lors du chargement des jobs' })
            jobsLoadingLocal.value = false
        }
    }

    /**
     * Charge les locations avec des param?tres sp?cifiques
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
                    pageSize: PLANNING_DEFAULT_PAGE_SIZE,
                },
                locationsCustomParams.value,
            )

            lastLocationsQueryModel = null
            await locationStore.fetchUnassignedLocations(
                accountId.value,
                inventoryId.value,
                warehouseId.value,
                finalParams
            )
            await nextTick()
            syncLocationsTableRows()

            lastLocationsQueryModel = { ...finalParams }
            locationsLoadingLocal.value = false
            await recoverEmptyLocationsPage(finalParams.page)
        } catch (error) {
            console.error('[usePlanning.loadLocations] ?? Error during locations load:', error)
            await alertService.error({ text: 'Erreur lors du chargement des locations' })
            locationsLoadingLocal.value = false
        }
    }

    /**
     * Rafra?chir les jobs
     */
    const refreshJobs = async (params?: QueryModel) => {
        await loadJobs(params)
    }

    const refreshLocations = async (params?: QueryModel) => {
        await loadLocations(params)
    }

    /**
     * Initialiser le composable
     * R?sout les IDs de contexte uniquement, sans charger les donn?es
     *
     * Les donn?es seront charg?es par le DataTable lors de la restauration des param?tres sauvegard?s
     * ou avec des param?tres par d?faut si aucun param?tre n'est sauvegard?.
     *
     * Cela permet au DataTable de restaurer les filtres, tri, recherche et taille de page sauvegard?s
     * et de charger les donn?es avec ces param?tres au lieu de les ?craser avec des valeurs par d?faut.
     */
    const initialize = async () => {
        if (isInitialized.value || isInitializing.value) return

        isInitializing.value = true
        try {
            // V?rifier les r?f?rences
            if (!inventoryReference || !warehouseReference) {
                throw new Error('R?f?rences d\'inventaire ou d\'entrep?t manquantes')
            }

            // R?soudre les IDs
            await resolveContextIds()

            // V?rifier que tous les IDs sont r?solus
            if (!inventoryId.value || !warehouseId.value) {
                throw new Error(`IDs de contexte manquants apr?s r?solution - inventaire: ${inventoryId.value}, entrep?t: ${warehouseId.value}`)
            }

            // NE PAS charger les donn?es ici - elles seront charg?es depuis la vue
            // pour ?viter les appels multiples et les conflits avec les DataTables

            isInitialized.value = true

            // Traiter les ?v?nements DataTable mis en file d'attente
            await processPendingEvents()
        } catch (error) {
            await alertService.error({ text: 'Erreur lors de l\'initialisation du planning' })
        } finally {
            isInitializing.value = false
        }
    }

    // ===== FONCTIONS UTILITAIRES =====

    const planningState = computed(() => ({
        selectedAvailable: selectedAvailableLocations.value,
    }))


    /**
     * Indicateur de disponibilit? de jobs
     */
    const hasAvailableJobs = computed(() => storeJobs.value.length > 0)

    /**
     * Options pour le s?lecteur de jobs
     */
    const jobSelectOptions = computed(() =>
        storeJobs.value.map(job => ({
            value: job.id.toString(),
            label: job.reference || `Job ${job.id}`
        }))
    )

    const adaptedStoreJobsColumns = jobsColumns
    const adaptedAvailableLocationColumns = locationsColumns

    // ===== GESTION DES MODALS =====

    /**
     * Ouvrir la modal d'ajout d'emplacements ? un job
     */
    const openAddToJobModal = () => {
        if (planningState.value.selectedAvailable.length === 0) {
            return
        }
        selectedJobForModal.value = null
        showAddToJobModal.value = true
    }

    /**
     * Fermer la modal d'ajout d'emplacements ? un job
     */
    const closeAddToJobModal = () => {
        showAddToJobModal.value = false
        selectedJobForModal.value = null
    }

    /**
     * Confirmer l'ajout des emplacements au job s?lectionn?
     */
    const confirmAddToJob = async () => {
        if (!selectedJobForModal.value) {
            return
        }
        await onSelectJobForLocation(selectedJobForModal.value)
        closeAddToJobModal()
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
                text: `Ajouter ${selectedAvailableLocations.value.length} emplacement(s) au job ?`,
            })

            if (result.isConfirmed) {
                const jobId = parseInt(value as string, 10)
                const locationIds = selectedAvailableLocations.value.map((id) => parseInt(id, 10))
                await jobStore.addLocationToJob(jobId, locationIds)
                await alertService.success({ text: 'Emplacements ajoutés avec succès' })
                resetAllSelections()
                await refreshData()
            }
        } catch {
            await alertService.error({ text: 'Erreur lors de l\'ajout d\'emplacements au job' })
        }
    }

    // ===== SÉLECTIONS DATATABLE =====

    /**
     * R?initialiser les s?lections dans les DataTables via les refs
     * Appel?e apr?s certaines actions pour synchroniser l'?tat visuel
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

    // ===== NAVIGATION =====

    const handleGoToInventoryDetail = () => {
        router.push({
            name: 'inventory-detail',
            params: { reference: inventoryReference }
        })
    }

    const handleGoToAffectation = () => {
        router.push({
            name: 'inventory-affecter',
            params: {
                reference: inventoryReference,
                warehouse: warehouseReference,
            },
        })
    }

    const selectedAvailableCount = computed(() => selectedAvailableLocations.value.length)

    const { navigationButtons, jobsActionButtons, locationsActionButtons } = usePlanningButtons({
        selectedJobsCount,
        selectedAvailableCount,
        hasAvailableJobs,
        canEditPlanning,
        onGoToDetail: handleGoToInventoryDetail,
        onGoToAffecter: handleGoToAffectation,
        validateAllJobs,
        bulkValidateJobs,
        bulkResetJobs,
        createJobFromSelectedLocations,
        openAddToJobModal,
        bulkDeactivateLocations,
    })

    // ===== WATCHERS =====



    /**
     * Flags pour ?viter les boucles infinies lors de la r?initialisation des s?lections
     */
    let isResettingSelections = false
    let isInitialMount = true


    /**
     * Watcher pour surveiller les changements de s?lection
     * R?initialise les DataTables quand les s?lections passent de non-vides ? vides
     */
    watch(
        () => [selectedAvailableLocations.value.length, selectedJobs.value.length],
        ([availableLength, jobsLength], [oldAvailableLength, oldJobsLength]) => {
            // Ignorer le premier d?clenchement au montage
            if (isInitialMount) {
                isInitialMount = false
                return
            }

            // ??viter les boucles infinies
            if (isResettingSelections) return

            // Si les s?lections passent de non-vides ? vides, r?initialiser aussi les DataTables
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

    /**
     * Charge les tables après montage du DataTable (pattern useInventoryManagement).
     */
    const resetTableFetchState = () => {
        lastJobsQueryModel = null
        lastLocationsQueryModel = null
        jobsPageRecoveryAttempted = false
        locationsPageRecoveryAttempted = false
        isInitialized.value = false
    }

    const loadTablesAfterMount = async () => {
        syncJobsTableRows()
        syncLocationsTableRows()

        await nextTick()
        await new Promise((resolve) => setTimeout(resolve, INITIALIZATION_DELAY_MS))

        if (jobsPendingEventsQueue.length > 0) {
            const first = jobsPendingEventsQueue.shift()!
            await processJobsEventDirectly(first.eventType, first.queryModel)
        } else {
            // Recharger à chaque visite : le store Pinia peut garder des données d'une autre page
            lastJobsQueryModel = null
            await loadJobs()
        }

        if (locationsPendingEventsQueue.length > 0) {
            const first = locationsPendingEventsQueue.shift()!
            await processLocationsEventDirectly(first.eventType, first.queryModel)
        } else {
            lastLocationsQueryModel = null
            await loadLocations()
        }

        await processPendingEvents()

        await recoverEmptyJobsPage()
        await recoverEmptyLocationsPage()

        syncJobsTableRows()
        syncLocationsTableRows()
    }

    /**
     * Initialisation compl�te avec chargement des donn�es
     */
    const initializeWithData = async () => {
        isDataLoaded.value = false
        resetTableFetchState()
        await initialize()
        selectedAvailableLocations.value = []
        selectedJobs.value = []

        if (isInitialized.value) {
            await loadTablesAfterMount()
        } else {
            syncJobsTableRows()
            syncLocationsTableRows()
        }

        isDataLoaded.value = true
    }

    return {
        jobs,
        locations,
        jobsLoading,
        locationsLoading,
        adaptedStoreJobsColumns,
        adaptedAvailableLocationColumns,
        jobsActions,
        locationsActions,
        onJobsTableEvent,
        onLocationsTableEvent,
        onAvailableSelectionChanged,
        onJobSelectionChanged,
        jobSelectOptions,
        planningState,
        isDataLoaded,
        navigationButtons,
        jobsActionButtons,
        locationsActionButtons,
        settingStatus,
        settingStatusLoading,
        isSettingEnAttente,
        canEditPlanning,
        showAddToJobModal,
        selectedJobForModal,
        closeAddToJobModal,
        confirmAddToJob,
        initializeWithData,
        availableLocationsTableRef,
        jobsTableRef,
        jobPaginationMetadata,
        locationPaginationMetadata,
        jobsCustomParams,
        locationsCustomParams,
    }
}
