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
import { ref, computed, markRaw, onMounted, nextTick, watch, shallowRef, reactive } from 'vue'
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


    /** Système de monitoring des performances (optionnel) */
    const performanceDebug = ref(false) // Activer en mode développement si nécessaire

    const logPerformance = (operation: string, startTime: number) => {
        // Performance logging disabled
    }

    /** États de chargement locaux pour afficher le skeleton immédiatement */
    const jobsLoadingLocal = ref(false)
    const locationsLoadingLocal = ref(false)

    // ===== SÉLECTIONS =====

    /** IDs des locations disponibles sélectionnées */
    const selectedAvailableLocations = ref<string[]>([])

    /** IDs des jobs sélectionnés */
    const selectedJobs = ref<string[]>([])

    // ===== ÉTATS LOCAUX =====

    /** États de chargement */
    const jobsLoading = ref(false)
    const locationsLoading = ref(false)
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
     * Cache pour les locations dédupliquées par job
     * Clé: job.id, Valeur: locations dédupliquées
     */
    const jobLocationsCache = new Map<number | string, any[]>()

    /**
     * Dédupliquer les locations d'un job (optimisé)
     * Transforme les locations pour aplatir les propriétés imbriquées (zone, sous_zone)
     * et supprime les doublons basés sur l'ID ou la référence
     *
     * @param job - Job contenant les locations à traiter
     * @returns Tableau de locations uniques avec propriétés aplaties
     */
    const dedupeJobLocations = (job: Job | JobTable) => {
        // Vérifier le cache d'abord
        const jobId = job.id
        if (jobId && jobLocationsCache.has(jobId)) {
            return jobLocationsCache.get(jobId)!
        }

        const rawLocations = ((job as any).locations ?? (job as any).emplacements ?? []) as Array<Record<string, any>>

        // Si pas de locations, retourner un tableau vide
        if (!rawLocations || rawLocations.length === 0) {
            const emptyResult: any[] = []
            if (jobId) jobLocationsCache.set(jobId, emptyResult)
            return emptyResult
        }

        const uniqueLocations = new Map<string | number, Record<string, any>>()
        let fallbackIndex = 0

        for (let i = 0; i < rawLocations.length; i++) {
            const loc = rawLocations[i]

            // Identifier la location par son ID (optimisé pour éviter Symbol)
            const key = loc.id ?? loc.location_id ?? loc.location_reference ?? loc.reference

            // Si pas de clé valide, utiliser un index (plus rapide que Symbol)
            const finalKey = key ?? `__fallback_${fallbackIndex++}`

            // Ne garder que la première occurrence
            if (!uniqueLocations.has(finalKey)) {
                // Optimisation : ne copier que les propriétés nécessaires
                uniqueLocations.set(finalKey, {
                    id: loc.id,
                    location_id: loc.location_id,
                    location_reference: loc.location_reference ?? loc.reference,
                    reference: loc.reference,
                    zone_name: loc.zone?.zone_name || loc.zone_name || 'N/A',
                    sous_zone_name: loc.sous_zone?.sous_zone_name || loc.sous_zone_name || 'N/A',
                    // Garder d'autres propriétés si nécessaires
                    zone: loc.zone,
                    sous_zone: loc.sous_zone
                })
            }
        }

        const result = Array.from(uniqueLocations.values())

        // Mettre en cache le résultat
        if (jobId) jobLocationsCache.set(jobId, result)

        return result
    }

    /**
     * Nettoyer le cache des locations de jobs
     */
    const clearJobLocationsCache = () => {
        jobLocationsCache.clear()
    }

    /**
     * Jobs transformés avec locations dédupliquées (optimisé avec shallowRef)
     * Chaque job a ses locations traitées pour supprimer les doublons
     */
    const transformedJobs = shallowRef<(Job & { locations: any[] })[]>([])

    /**
     * Cache pour les jobs transformés complets
     * Clé: job.id, Valeur: job transformé
     */
    const transformedJobsCache = new Map<number | string, any>()

    /**
     * Hash des IDs de jobs pour détecter les changements
     */
    let lastJobsHash = ''
    let lastJobsLength = 0

    /**
     * Met à jour les jobs transformés de manière optimisée
     */
    const updateTransformedJobs = () => {
        const startTime = performance.now()

        // Vérification ultra-rapide : si même longueur et déjà transformé, probablement identique
        if (jobs.value.length === lastJobsLength &&
            transformedJobs.value.length === jobs.value.length &&
            jobs.value.length > 0) {
            // Vérification rapide du premier et dernier ID
            const firstMatch = jobs.value[0]?.id === transformedJobs.value[0]?.id
            const lastMatch = jobs.value[jobs.value.length - 1]?.id === transformedJobs.value[transformedJobs.value.length - 1]?.id

            if (firstMatch && lastMatch) {
                logPerformance('updateTransformedJobs (skipped - quick check)', startTime)
                return
            }
        }

        // Si longueur différente, c'est sûr qu'il y a eu un changement
        if (jobs.value.length !== lastJobsLength) {
            lastJobsLength = jobs.value.length
            lastJobsHash = '' // Invalider le hash
        }

        // Créer un hash seulement si nécessaire
        const currentJobsHash = jobs.value.map(j => j.id).join(',')

        // Si les jobs n'ont pas changé, éviter la transformation
        if (currentJobsHash === lastJobsHash) {
            logPerformance('updateTransformedJobs (skipped - hash match)', startTime)
            return
        }

        lastJobsHash = currentJobsHash

        // Nettoyer le cache seulement si vraiment nécessaire (> 3x la taille actuelle)
        if (transformedJobsCache.size > jobs.value.length * 3) {
            const jobIds = new Set(jobs.value.map(j => Number(j.id)))
            // Nettoyer seulement les jobs qui ne sont plus dans la liste
            for (const [cachedId] of transformedJobsCache) {
                if (!jobIds.has(Number(cachedId))) {
                    transformedJobsCache.delete(cachedId)
                    jobLocationsCache.delete(cachedId)
                }
            }
        }

        // Transformation optimisée avec pré-allocation
        const result: any[] = new Array(jobs.value.length)

        for (let i = 0; i < jobs.value.length; i++) {
            const job = jobs.value[i]
            const jobId = job.id

            // Vérifier si le job est déjà en cache
            if (jobId && transformedJobsCache.has(jobId)) {
                result[i] = transformedJobsCache.get(jobId)!
                continue
            }

            // Transformation optimisée : ne copier que les propriétés essentielles
            const transformed = {
                id: job.id,
                reference: job.reference,
                status: job.status,
                created_at: job.created_at,
                updated_at: (job as any).updated_at,
                inventory_id: (job as any).inventory_id,
                warehouse_id: (job as any).warehouse_id,
                locations: dedupeJobLocations(job),
                // Ajouter d'autres propriétés nécessaires
                ...(job as any) // Fallback pour les propriétés non listées
            }

            // Mettre en cache
            if (jobId) {
                transformedJobsCache.set(jobId, transformed)
            }

            result[i] = transformed
        }

        transformedJobs.value = result

        logPerformance('updateTransformedJobs', startTime)
    }

    /**
     * Invalider le cache d'un job spécifique
     */
    const invalidateJobCache = (jobId: number | string) => {
        transformedJobsCache.delete(jobId)
        jobLocationsCache.delete(jobId)
    }

    /**
     * Nettoyer tous les caches de jobs
     */
    const clearAllJobCaches = () => {
        transformedJobsCache.clear()
        clearJobLocationsCache()
    }

    /**
     * Locations mappées avec propriétés aplaties (optimisé avec shallowRef)
     * Aplatit les propriétés imbriquées (zone, sous_zone) pour faciliter l'affichage dans la DataTable
     */
    const mappedLocations = shallowRef<any[]>([])

    /**
     * Hash des locations pour détecter les changements
     */
    let lastLocationsHash = ''
    let lastLocationsLength = 0

    /**
     * Met à jour les locations mappées de manière optimisée
     */
    const updateMappedLocations = () => {
        const startTime = performance.now()
        const locationsData = locationStore.locations || []

        // Vérification ultra-rapide de la longueur
        if (locationsData.length === lastLocationsLength &&
            mappedLocations.value.length === locationsData.length &&
            locationsData.length > 0) {
            // Vérification rapide du premier et dernier ID
            const firstMatch = locationsData[0]?.id === mappedLocations.value[0]?.id
            const lastMatch = locationsData[locationsData.length - 1]?.id === mappedLocations.value[mappedLocations.value.length - 1]?.id

            if (firstMatch && lastMatch) {
                logPerformance('updateMappedLocations (skipped - quick check)', startTime)
                return
            }
        }

        // Si longueur différente, c'est sûr qu'il y a eu un changement
        if (locationsData.length !== lastLocationsLength) {
            lastLocationsLength = locationsData.length
            lastLocationsHash = ''
        }

        // Créer un hash seulement si vraiment nécessaire (pour validation finale)
        if (lastLocationsHash) {
            const currentHash = locationsData.length > 0 ?
                `${locationsData[0].id}-${locationsData[locationsData.length - 1].id}-${locationsData.length}` :
                '0-0-0'

            if (currentHash === lastLocationsHash) {
                logPerformance('updateMappedLocations (skipped - hash match)', startTime)
                return
            }
            lastLocationsHash = currentHash
        } else {
            lastLocationsHash = locationsData.length > 0 ?
                `${locationsData[0].id}-${locationsData[locationsData.length - 1].id}-${locationsData.length}` :
                '0-0-0'
        }

        // Transformation optimisée avec for loop (plus rapide que map)
        const mapped: any[] = new Array(locationsData.length)
        for (let i = 0; i < locationsData.length; i++) {
            const loc = locationsData[i]
            mapped[i] = {
                ...loc,
                location_reference: (loc as any).location_reference ?? (loc as any).reference ?? loc.reference ?? '',
                zone_name: loc.zone?.zone_name || (loc as any).zone_name || 'N/A',
                sous_zone_name: loc.sous_zone?.sous_zone_name || (loc as any).sous_zone_name || 'N/A'
            }
        }

        mappedLocations.value = mapped
        logPerformance('updateMappedLocations', startTime)
    }

    /**
     * Locations disponibles (non utilisées dans les jobs) - optimisé avec shallowRef
     * Filtre les locations pour exclure celles déjà assignées à un job
     */
    const availableLocations = shallowRef<any[]>([])

    /**
     * Cache des IDs de locations utilisées
     */
    let cachedUsedLocationIds = new Set<number | string>()
    let lastUsedLocationsHash = ''

    /**
     * Met à jour les locations disponibles de manière optimisée
     */
    const updateAvailableLocations = () => {
        const startTime = performance.now()

        // Vérification ultra-rapide : si rien n'a changé dans les tailles
        const totalMapped = mappedLocations.value.length
        const totalAvailable = availableLocations.value.length
        const totalUsed = cachedUsedLocationIds.size

        // Si les tailles correspondent, probablement pas de changement
        if (totalMapped === (totalAvailable + totalUsed) && totalAvailable > 0) {
            logPerformance('updateAvailableLocations (skipped - size match)', startTime)
            return
        }

        // Créer un hash léger seulement si nécessaire
        const currentHash = `${transformedJobs.value.length}:${mappedLocations.value.length}:${transformedJobs.value.reduce((sum, j) => sum + (j.locations?.length || 0), 0)}`

        // Si le hash correspond, pas de changement
        if (currentHash === lastUsedLocationsHash) {
            logPerformance('updateAvailableLocations (skipped - hash match)', startTime)
            return
        }

        lastUsedLocationsHash = currentHash
        const usedLocationIds = new Set<number | string>()

        // Collecter tous les IDs de locations utilisées dans les jobs (optimisé)
        for (let i = 0; i < transformedJobs.value.length; i++) {
            const job = transformedJobs.value[i]
            const jobLocations = job.locations

            if (jobLocations && jobLocations.length > 0) {
                for (let j = 0; j < jobLocations.length; j++) {
                    const loc = jobLocations[j]
                    const key = loc.id ?? loc.location_id ?? loc.location_reference ?? loc.reference
                    if (key !== undefined && key !== null) {
                        usedLocationIds.add(key)
                    }
                }
            }
        }

        cachedUsedLocationIds = usedLocationIds

        // Filtrer les locations non utilisées (optimisé avec for loop)
        const available: any[] = []
        for (let i = 0; i < mappedLocations.value.length; i++) {
            const loc = mappedLocations.value[i]
            const key = loc.id ?? loc.location_id ?? loc.location_reference ?? loc.reference

            if (key === undefined || key === null || !usedLocationIds.has(key)) {
                available.push(loc)
            }
        }

        availableLocations.value = available
        logPerformance('updateAvailableLocations', startTime)
    }

    /**
     * Met à jour toutes les données transformées en une seule fois (optimisé)
     * Utilise requestAnimationFrame pour ne pas bloquer le thread principal
     */
    let updateScheduled = false
    const updateAllTransformedData = () => {
        if (updateScheduled) return

        updateScheduled = true
        requestAnimationFrame(() => {
            updateTransformedJobs()
            updateMappedLocations()
            updateAvailableLocations()
            updateScheduled = false
        })
    }

    /**
     * Version synchrone pour les cas où on a besoin des données immédiatement
     */
    const updateAllTransformedDataSync = () => {
        updateTransformedJobs()
        updateMappedLocations()
        updateAvailableLocations()
    }

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
                        invalidateJobCache(Number(job.id))
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
                        invalidateJobCache(Number(job.id))
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
     * Charger les jobs pour l'inventaire et l'entrepôt actuels
     * En mode client-side : charge toutes les données sans pagination
     */
    const loadJobs = async (params?: QueryModel) => {
        if (!inventoryId.value || !warehouseId.value) {
            return
        }

        jobsLoading.value = true
        try {
            // Mode server-side : utiliser les paramètres par défaut ou ceux passés
            const finalParams: QueryModel = params || {
                page: 1,
                pageSize: 20, // Taille de page normale comme dans useInventoryManagement.ts
                sort: [],
                filters: {},
                search: '',
                customParams: jobsCustomParams.value
            }

            await jobStore.fetchJobs(inventoryId.value, warehouseId.value, finalParams)
            await nextTick()

            // Mettre à jour les données transformées
            updateTransformedJobs()
            updateAvailableLocations()
            jobsKey.value++
        } catch (error) {
            jobsError.value = 'Erreur lors du chargement des jobs'
            await alertService.error({ text: jobsError.value })
        } finally {
            jobsLoading.value = false
        }
    }

    /**
     * Charger les locations disponibles pour l'entrepôt actuel
     * En mode client-side : charge toutes les données sans pagination
     */
    const loadLocations = async (params?: QueryModel) => {
        if (!accountId.value || !inventoryId.value || !warehouseId.value) {
            return
        }

        locationsLoading.value = true
        try {
            // Mode server-side : utiliser les paramètres par défaut ou ceux passés
            const finalParams: QueryModel = params || {
                page: 1,
                pageSize: 20, // Taille de page normale comme dans useInventoryManagement.ts
                sort: [],
                filters: {},
                search: '',
                customParams: locationsCustomParams.value
            }

            await locationStore.fetchUnassignedLocations(
                accountId.value,
                inventoryId.value,
                warehouseId.value,
                finalParams
            )
            await nextTick()

            updateMappedLocations()
            updateAvailableLocations()
            selectFieldKey.value++
        } catch (error) {
            locationsError.value = 'Erreur lors du chargement des locations'
            await alertService.error({ text: locationsError.value })
        } finally {
            locationsLoading.value = false
        }
    }

    /**
     * Recharger toutes les données (jobs et locations)
     */
    const refreshData = async () => {
        await Promise.all([
            loadJobs(),
            loadLocations()
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
                jobIds.forEach(jobId => invalidateJobCache(Number(jobId)))

                await alertService.success({ text: `${jobIds.length} job(s) validé(s) avec succès` })
                resetAllSelections()
                await refreshData()
            }
        } catch (error) {
            await alertService.error({ text: 'Erreur lors de la validation des jobs' })
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
                jobIds.forEach(jobId => invalidateJobCache(Number(jobId)))

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
                jobIds.forEach(jobId => invalidateJobCache(Number(jobId)))

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
     * Handler unifié pour toutes les opérations de la DataTable Jobs
     * Utilise la ref pour identifier l'instance et éviter les conflits
     * Évite les appels API répétés avec le même QueryModel
     */
    const onJobsTableEvent = async (eventType: string, queryModel: QueryModel) => {
        // Vérifier que les IDs requis sont disponibles avant de lancer l'API
        if (!inventoryId.value || !warehouseId.value) {
            console.warn('[usePlanning] Jobs API not called: missing inventoryId or warehouseId')
            return
        }

        // Vérifier si le QueryModel a changé depuis le dernier appel
        const queryModelStr = JSON.stringify(queryModel)
        const lastQueryModelStr = lastJobsQueryModel ? JSON.stringify(lastJobsQueryModel) : null

        if (queryModelStr === lastQueryModelStr) {
            return
        }

        try {
            // Vérifier que c'est bien la table jobs qui fait l'appel
            if (jobsTableRef.value && typeof jobsTableRef.value === 'object') {
                await jobStore.fetchJobs(inventoryId.value, warehouseId.value, queryModel)
                lastJobsQueryModel = { ...queryModel } // Copier pour éviter les références
            }
        } catch (error) {
            console.error('[usePlanning] Error in jobStore.fetchJobs:', error)
            await alertService.error({ text: 'Erreur lors du chargement des jobs' })
        }
    }

    /**
     * Handler unifié pour toutes les opérations de la DataTable Locations
     * Utilise la ref pour identifier l'instance et éviter les conflits
     * Évite les appels API répétés avec le même QueryModel
     */
    const onLocationsTableEvent = async (eventType: string, queryModel: QueryModel) => {
        // Vérifier que les IDs requis sont disponibles avant de lancer l'API
        if (!accountId.value || !inventoryId.value || !warehouseId.value) {
            console.warn('[usePlanning] Locations API not called: missing accountId, inventoryId or warehouseId')
            return
        }

        // Vérifier si le QueryModel a changé depuis le dernier appel
        const queryModelStr = JSON.stringify(queryModel)
        const lastQueryModelStr = lastLocationsQueryModel ? JSON.stringify(lastLocationsQueryModel) : null

        if (queryModelStr === lastQueryModelStr) {
            return
        }

        try {
            // Vérifier que c'est bien la table locations qui fait l'appel
            if (availableLocationsTableRef.value && typeof availableLocationsTableRef.value === 'object') {
                await locationStore.fetchUnassignedLocations(
                    accountId.value,
                    inventoryId.value,
                    warehouseId.value,
                    queryModel
                )
                lastLocationsQueryModel = { ...queryModel } // Copier pour éviter les références
            }
        } catch (error) {
            console.error('[usePlanning] Error in locationStore.fetchUnassignedLocations:', error)
            await alertService.error({ text: 'Erreur lors du chargement des locations' })
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
                invalidateJobCache(Number(jobId))

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

        // Initialiser les données transformées de manière synchrone
        updateAllTransformedDataSync()

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

        // États
        jobsLoading,
        locationsLoading,
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
