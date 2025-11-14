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
import { ref, computed, watch } from 'vue'

// ===== IMPORTS PINIA =====
import { storeToRefs } from 'pinia'

// ===== IMPORTS STORES =====
import { useInventoryStore } from '@/stores/inventory'
import { useWarehouseStore } from '@/stores/warehouse'
import { useJobStore } from '@/stores/job'

// ===== IMPORTS SERVICES =====
import { alertService } from '@/services/alertService'
import { logger } from '@/services/loggerService'

// ===== IMPORTS TYPES =====
import type { StoreOption } from '@/interfaces/inventoryResults'
import type { JobResult, JobAssignment, JobEmplacement } from '@/models/Job'
import type { DataTableColumn, ColumnDataType } from '@/types/dataTable'

// ===== INTERFACES =====

/**
 * Configuration pour initialiser le composable
 */
export interface UseJobTrackingConfig {
    /** Référence de l'inventaire */
    inventoryReference?: string
    /** ID du magasin initial */
    initialStoreId?: string
    /** Ordre du comptage initial */
    initialCountingOrder?: number
}

/**
 * Option de comptage pour le select
 */
export interface CountingOption {
    /** Label affiché */
    label: string
    /** Valeur (ordre du comptage) */
    value: number
}

/**
 * Ligne de suivi dans le DataTable
 */
export interface JobTrackingRow {
    /** ID unique de la ligne */
    id: string
    /** Référence du job */
    jobReference: string
    /** Emplacement concerné */
    emplacement: string
    /** Statut du job */
    statut: string
    /** Ordre du comptage */
    countingOrder: number | null
    /** Date de transfert */
    dateTransfert: string | null
    /** Date de lancement */
    dateLancement: string | null
    /** Date de fin */
    dateFin: string | null
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

    // ===== STORE REFS =====
    const { loading: inventoryLoading } = storeToRefs(inventoryStore)
    const { warehouses } = storeToRefs(warehouseStore)
    const { jobsValidated, loading: jobsLoading } = storeToRefs(jobStore)

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

    /** Magasin sélectionné */
    const selectedStore = ref<string | null>(config?.initialStoreId ?? null)

    /** État de chargement des magasins */
    const isFetchingStores = ref(false)

    /** Options de comptage */
    const countingOptions = ref<CountingOption[]>([])

    /** Ordre du comptage sélectionné */
    const selectedCountingOrder = ref<number | null>(config?.initialCountingOrder ?? null)

    /** Lignes de suivi */
    const trackingRows = ref<JobTrackingRow[]>([])

    // ===== COMPUTED PROPERTIES =====

    /** État de chargement global */
    const isLoading = computed(() => inventoryLoading.value || jobsLoading.value || isFetchingStores.value)

    /** Colonnes du DataTable */
    const columns = ref<DataTableColumn<JobTrackingRow>[]>([
        {
            headerName: 'Emplacement',
            field: 'emplacement',
            sortable: true,
            filterable: true,
            dataType: 'text' as ColumnDataType,
            width: 180,
            description: 'Emplacement concerné'
        },
        {
            headerName: 'Statut',
            field: 'statut',
            sortable: true,
            filterable: true,
            dataType: 'text' as ColumnDataType,
            width: 140,
            description: 'Statut du job pour ce comptage'
        },
        {
            headerName: 'Date transfert',
            field: 'dateTransfert',
            sortable: true,
            filterable: true,
            dataType: 'datetime' as ColumnDataType,
            width: 165,
            valueFormatter: (params: any) => params.value || '-'
        },
        {
            headerName: 'Date lancement',
            field: 'dateLancement',
            sortable: true,
            filterable: true,
            dataType: 'datetime' as ColumnDataType,
            width: 165,
            valueFormatter: (params: any) => params.value || '-'
        },
        {
            headerName: 'Date fin',
            field: 'dateFin',
            sortable: true,
            filterable: true,
            dataType: 'datetime' as ColumnDataType,
            width: 165,
            valueFormatter: (params: any) => params.value || '-'
        }
    ])

    /** Indique si des lignes existent */
    const hasRows = computed(() => trackingRows.value.length > 0)

    // ===== MÉTHODES DE RÉSOLUTION =====

    /**
     * Résout les options de comptage depuis l'inventaire ou calcule depuis les jobs
     *
     * @param maxCountings - Nombre maximum de comptages (optionnel, pour fallback)
     */
    const resolveCountingOptions = (maxCountings?: number) => {
        const options: CountingOption[] = []

        // Priorité : utiliser les comptages de l'inventaire
        if (inventory.value?.comptages && Array.isArray(inventory.value.comptages) && inventory.value.comptages.length > 0) {
            inventory.value.comptages.forEach((comptage: any, index: number) => {
                const order = comptage.order || index + 1
                const suffix = order === 1 ? 'er' : 'ème'
                options.push({
                    label: `${order}${suffix} comptage`,
                    value: order
                })
            })
            logger.debug('Comptages chargés depuis l\'inventaire', options)
        } else if (maxCountings !== undefined) {
            // Fallback : utiliser maxCountings calculé depuis les jobs
            for (let i = 1; i <= Math.max(maxCountings, 1); i += 1) {
                const suffix = i === 1 ? 'er' : 'ème'
                options.push({
                    label: `${i}${suffix} comptage`,
                    value: i
                })
            }
            logger.debug('Comptages calculés depuis les jobs (fallback)', options)
        }

        countingOptions.value = options

        if (!selectedCountingOrder.value && options.length > 0) {
            selectedCountingOrder.value = options[0].value
        }
    }

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
     *
     * @param jobs - Liste des jobs à transformer
     * @returns Lignes de suivi formatées
     */
    const transformJobsToRows = (jobs: JobResult[]): JobTrackingRow[] => {
        const rows: JobTrackingRow[] = []
        const countingTarget = selectedCountingOrder.value

        jobs.forEach(job => {
            const assignments = job.assignments || []
            const filteredAssignments = countingTarget
                ? assignments.filter(assignment => assignment.counting_order === countingTarget)
                : assignments

            if (filteredAssignments.length === 0) {
                const emplacementList = job.emplacements || []
                if (emplacementList.length === 0) {
                    rows.push({
                        id: `${job.id}-no-assignment`,
                        jobReference: job.reference,
                        emplacement: 'Non défini',
                        statut: job.status || 'Inconnu',
                        countingOrder: countingTarget,
                        dateTransfert: formatDateTime((job as any)?.date_transfer || job.valide_date || null),
                        dateLancement: formatDateTime(job.en_attente_date || null),
                        dateFin: formatDateTime(job.termine_date || null)
                    })
                } else {
                    emplacementList.forEach((emplacement, emplacementIndex) => {
                        rows.push({
                            id: `${job.id}-${emplacement.id ?? emplacementIndex}-no-assignment`,
                            jobReference: job.reference,
                            emplacement: mapEmplacementLabel(emplacement, emplacementIndex),
                            statut: job.status || 'Inconnu',
                            countingOrder: countingTarget,
                            dateTransfert: formatDateTime((job as any)?.date_transfer || job.valide_date || null),
                            dateLancement: formatDateTime(job.en_attente_date || null),
                            dateFin: formatDateTime(job.termine_date || null)
                        })
                    })
                }
                return
            }

            filteredAssignments.forEach((assignment, assignmentIndex) => {
                const assignmentWithDates = assignment as AssignmentWithDates
                const emplacementList = job.emplacements || []
                const dateTransfert = assignmentWithDates.date_transfer
                    || assignmentWithDates.dateTransfert
                    || (job as any)?.date_transfer
                    || job.valide_date
                const dateLancement = assignmentWithDates.date_lancement
                    || assignmentWithDates.date_launch
                    || assignmentWithDates.date_start
                const dateFin = assignmentWithDates.date_fin
                    || assignmentWithDates.date_end
                    || job.termine_date

                if (emplacementList.length === 0) {
                    rows.push({
                        id: `${job.id}-${assignment.counting_order}-${assignmentIndex}`,
                        jobReference: job.reference,
                        emplacement: 'Non défini',
                        statut: assignment.status || job.status || 'Inconnu',
                        countingOrder: assignment.counting_order,
                        dateTransfert: formatDateTime(dateTransfert || null),
                        dateLancement: formatDateTime(dateLancement || null),
                        dateFin: formatDateTime(dateFin || null)
                    })
                    return
                }

                emplacementList.forEach((emplacement, emplacementIndex) => {
                    rows.push({
                        id: `${job.id}-${assignment.counting_order}-${emplacement.id ?? emplacementIndex}`,
                        jobReference: job.reference,
                        emplacement: mapEmplacementLabel(emplacement, emplacementIndex),
                        statut: assignment.status || job.status || 'Inconnu',
                        countingOrder: assignment.counting_order,
                        dateTransfert: formatDateTime(dateTransfert || null),
                        dateLancement: formatDateTime(dateLancement || null),
                        dateFin: formatDateTime(dateFin || null)
                    })
                })
            })
        })

        return rows
    }

    /**
     * Calcule l'ordre maximum de comptage depuis les jobs
     *
     * @param jobs - Liste des jobs
     * @returns Ordre maximum de comptage
     */
    const calculateMaxCountingOrder = (jobs: JobResult[]): number => {
        let maxOrder = 0
        jobs.forEach(job => {
            (job.assignments || []).forEach(assignment => {
                if (typeof assignment.counting_order === 'number') {
                    maxOrder = Math.max(maxOrder, assignment.counting_order)
                }
            })
        })
        return Math.max(maxOrder, 1)
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
     * Charge les données de suivi des jobs
     * Prérequis : inventory et selectedStore doivent être définis
     * Les comptages doivent être résolus depuis l'inventaire (ou seront calculés depuis les jobs en fallback)
     */
    const fetchTrackingData = async () => {
        if (!inventoryId.value || !selectedStore.value) {
            trackingRows.value = []
            return
        }

        try {
            const warehouseId = Number(selectedStore.value)

            // Charger les jobs depuis l'API
            await jobStore.fetchJobsValidated(inventoryId.value, warehouseId)

            const jobs = jobsValidated.value || []

            // Si les comptages n'ont pas été résolus depuis l'inventaire, les calculer depuis les jobs (fallback)
            if (countingOptions.value.length === 0 && jobs.length > 0) {
                const maxOrder = calculateMaxCountingOrder(jobs)
                resolveCountingOptions(maxOrder)
                logger.debug('Comptages calculés depuis les jobs (fallback)', countingOptions.value)
            }

            // Transformer les jobs en lignes pour le DataTable
            trackingRows.value = transformJobsToRows(jobs)
        } catch (error) {
            logger.error('Erreur lors du chargement des données de suivi des jobs', error)
            trackingRows.value = []
            await alertService.error({ text: 'Impossible de charger les données de suivi des jobs' })
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
     * Ordre d'exécution :
     * 1. Chargement de l'inventaire
     * 2. Chargement des magasins
     * 3. Résolution des comptages depuis l'inventaire
     * 4. Chargement des jobs validés
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

            // 2. Charger les magasins
            await fetchStores()

            // 3. Résoudre les comptages depuis l'inventaire (AVANT de charger les jobs)
            if (inventory.value?.comptages && Array.isArray(inventory.value.comptages) && inventory.value.comptages.length > 0) {
                resolveCountingOptions()
                logger.debug('Comptages résolus depuis l\'inventaire avant chargement des jobs', countingOptions.value)
            } else {
                logger.warn('Aucun comptage trouvé dans l\'inventaire, les comptages seront calculés depuis les jobs')
            }

            // 4. Charger les jobs (seulement si un magasin est sélectionné)
            if (selectedStore.value) {
                await fetchTrackingData()
            }

            isInitialized.value = true
        } catch (error) {
            logger.error('Erreur lors de l\'initialisation du suivi des jobs', error)
            await alertService.error({ text: 'Impossible d\'initialiser le suivi des jobs' })
            throw error
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
        countingOptions.value = []
        selectedStore.value = config?.initialStoreId ?? null
        selectedCountingOrder.value = config?.initialCountingOrder ?? null

        await initialize(reference)
    }

    // ===== WATCHERS =====

    /**
     * Watcher sur les sélections (magasin et comptage)
     * Recharge les données quand les sélections changent
     *
     * Note :
     * - Le changement de magasin déclenche un rechargement des jobs depuis l'API
     * - Le changement de comptage re-transforme les jobs déjà chargés (sans recharger l'API)
     * - Les comptages sont résolus depuis l'inventaire si disponibles, sinon depuis les jobs
     */
    watch([selectedStore, selectedCountingOrder], async () => {
        if (!isInitialized.value) {
            return
        }

        // Si le magasin change, recharger les jobs depuis l'API
        // Si seul le comptage change, re-transformer les jobs déjà chargés
        if (selectedStore.value && inventoryId.value) {
            // Si les comptages ne sont pas encore résolus et disponibles dans l'inventaire, les résoudre d'abord
            if (countingOptions.value.length === 0 && inventory.value?.comptages?.length > 0) {
                resolveCountingOptions()
                logger.debug('Comptages résolus depuis l\'inventaire dans le watcher', countingOptions.value)
            }

            // Charger les jobs (les comptages seront calculés depuis les jobs si nécessaire)
            await fetchTrackingData()
        } else {
            // Si pas de magasin sélectionné, vider les lignes
            trackingRows.value = []
        }
    })

    // ===== RETURN =====

    return {
        // État
        inventoryReference: computed(() => inventoryReference.value),
        inventoryId: computed(() => inventoryId.value),
        isInitialized,
        loading: isLoading,

        // Sélections
        storeOptions,
        selectedStore,
        countingOptions,
        selectedCountingOrder,

        // Données tableau
        rows: trackingRows,
        columns,
        hasRows,

        // Actions
        initialize,
        reinitialize,
        refresh: fetchTrackingData
    }
}
