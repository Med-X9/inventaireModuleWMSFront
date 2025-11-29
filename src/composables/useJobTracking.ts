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
import { useSessionStore } from '@/stores/session'

// ===== IMPORTS SERVICES =====
import { alertService } from '@/services/alertService'
import { logger } from '@/services/loggerService'
import { JobService } from '@/services/jobService'

// ===== IMPORTS EXTERNES =====
import Swal from 'sweetalert2'

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
    /** Statut du 1er comptage */
    statut1erComptage: string | null
    /** Statut du 2ème comptage */
    statut2emeComptage: string | null
    /** Nombre d'écarts */
    discrepancyCount: number | null
    /** Taux d'écarts (pourcentage) */
    discrepancyRate: number | null
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
    const sessionStore = useSessionStore()

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

    /** IDs des lignes sélectionnées */
    const selectedRows = ref<string[]>([])

    // ===== COMPUTED PROPERTIES =====

    /** État de chargement global */
    const isLoading = computed(() => inventoryLoading.value || jobsLoading.value || isFetchingStores.value)

    /** Styles de badges pour les statuts */
    const badgeStyles = [
        {
            value: 'TERMINE',
            class: 'inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-800 ring-1 ring-green-600/20 ring-inset'
        },
        {
            value: 'TRANSFERT',
            class: 'inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800 ring-1 ring-blue-600/20 ring-inset'
        },
        {
            value: 'EN ATTENTE',
            class: 'inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-yellow-600/20 ring-inset'
        }
    ]
    const badgeDefaultClass = 'inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-800 ring-1 ring-gray-600/20 ring-inset'

    /** Fonction helper pour rendre un badge de statut */
    const renderStatusBadge = (value: string | null) => {
        if (!value) return '-'
        const badgeStyle = badgeStyles.find(s => s.value === value)
        const badgeClass = badgeStyle?.class || badgeDefaultClass
        return `<span class="${badgeClass}">${value}</span>`
    }

    /** Colonnes du DataTable */
    const columns = ref<DataTableColumn<JobTrackingRow>[]>([
        {
            headerName: 'Référence Job',
            field: 'jobReference',
            sortable: true,
            filterable: true,
            dataType: 'text' as ColumnDataType,
            width: 150,
            description: 'Référence du job'
        },
        {
            headerName: 'Statut 1er comptage',
            field: 'statut1erComptage',
            sortable: true,
            filterable: true,
            dataType: 'select' as ColumnDataType,
            width: 160,
            description: 'Statut du 1er comptage',
            badgeStyles,
            badgeDefaultClass,
            cellRenderer: (value: any) => renderStatusBadge(value)
        },
        {
            headerName: 'Statut 2ème comptage',
            field: 'statut2emeComptage',
            sortable: true,
            filterable: true,
            dataType: 'select' as ColumnDataType,
            width: 160,
            description: 'Statut du 2ème comptage',
            badgeStyles,
            badgeDefaultClass,
            cellRenderer: (value: any) => renderStatusBadge(value)
        },
        {
            headerName: 'Nombre d\'écarts',
            field: 'discrepancyCount',
            sortable: true,
            filterable: true,
            dataType: 'number' as ColumnDataType,
            width: 140,
            description: 'Nombre d\'écarts détectés',
            valueFormatter: (params: any) => {
                const count = params.value
                if (count === null || count === undefined) return '-'
                return String(count)
            },
            cellRenderer: (value: any) => {
                const count = value
                if (count === null || count === undefined) return '-'
                const colorClass = count === 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'
                return `<span class="${colorClass}">${count}</span>`
            }
        },
        {
            headerName: 'Taux d\'écarts (%)',
            field: 'discrepancyRate',
            sortable: true,
            filterable: true,
            dataType: 'number' as ColumnDataType,
            width: 140,
            description: 'Pourcentage d\'écarts',
            valueFormatter: (params: any) => {
                const rate = params.value
                if (rate === null || rate === undefined) return '-'
                return `${Number(rate).toFixed(2)}%`
            },
            cellRenderer: (value: any) => {
                const rate = value
                if (rate === null || rate === undefined) return '-'
                const numRate = Number(rate)
                const colorClass = numRate === 0 ? 'text-green-600 font-semibold' : numRate < 10 ? 'text-yellow-600 font-semibold' : 'text-red-600 font-semibold'
                return `<span class="${colorClass}">${numRate.toFixed(2)}%</span>`
            }
        }
    ])

    /** Indique si des lignes existent */
    const hasRows = computed(() => trackingRows.value.length > 0)

    /** Nombre de lignes sélectionnées */
    const selectedRowsCount = computed(() => selectedRows.value.length)

    /** Indicateur de sélection */
    const hasSelectedRows = computed(() => selectedRows.value.length > 0)

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
     * Une ligne par job avec les statuts des comptages
     *
     * @param jobs - Liste des jobs à transformer
     * @returns Lignes de suivi formatées
     */
    const transformJobsToRows = (jobs: JobResult[]): JobTrackingRow[] => {
        const rows: JobTrackingRow[] = []

        jobs.forEach(job => {
            const assignments = job.assignments || []

            // Extraire les statuts par ordre de comptage
            let statut1erComptage: string | null = null
            let statut2emeComptage: string | null = null

            assignments.forEach(assignment => {
                const countingOrder = assignment.counting_order
                const status = assignment.status || job.status || null

                if (countingOrder === 1) {
                    statut1erComptage = status
                } else if (countingOrder === 2) {
                    statut2emeComptage = status
                }
            })

            // Créer une ligne par job avec les statuts des comptages
            rows.push({
                id: `${job.id}`,
                jobReference: job.reference,
                statut1erComptage,
                statut2emeComptage,
                discrepancyCount: null,
                discrepancyRate: null
            })
        })

        return rows
    }

    /**
     * Calcule l'ordre maximum de comptage depuis les jobs (ancien format)
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

    /**
     * Calcule l'ordre maximum de comptage depuis les jobs discrepancies (nouveau format)
     *
     * @param jobs - Liste des jobs depuis l'endpoint discrepancies
     * @returns Ordre maximum de comptage
     */
    const calculateMaxCountingOrderFromDiscrepancies = (jobs: any[]): number => {
        let maxOrder = 0
        jobs.forEach(job => {
            (job.assignments || []).forEach((assignment: any) => {
                if (typeof assignment.counting_order === 'number') {
                    maxOrder = Math.max(maxOrder, assignment.counting_order)
                }
            })
        })
        return Math.max(maxOrder, 1)
    }

    /**
     * Transforme les jobs discrepancies en lignes de suivi pour le DataTable
     * Une ligne par job avec les statuts des comptages
     *
     * @param jobs - Liste des jobs depuis l'endpoint discrepancies
     * @returns Lignes de suivi formatées
     */
    const transformDiscrepanciesToRows = (jobs: any[]): JobTrackingRow[] => {
        const rows: JobTrackingRow[] = []

        jobs.forEach(job => {
            const assignments = job.assignments || []

            // Récupérer les informations d'écarts du job
            const discrepancyCount = job.discrepancy_count ?? null
            const discrepancyRate = job.discrepancy_rate ?? null

            // Extraire les statuts par ordre de comptage
            let statut1erComptage: string | null = null
            let statut2emeComptage: string | null = null

            assignments.forEach((assignment: any) => {
                const countingOrder = assignment.counting_order
                const status = assignment.status || job.job_status || null

                if (countingOrder === 1) {
                    statut1erComptage = status
                } else if (countingOrder === 2) {
                    statut2emeComptage = status
                }
            })

            // Créer une ligne par job
            rows.push({
                id: `job-${job.job_id}`,
                jobReference: job.job_reference || `job-${job.job_id}`,
                statut1erComptage,
                statut2emeComptage,
                discrepancyCount,
                discrepancyRate
            })
        })

        return rows
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
     * Charge les données de suivi des jobs depuis l'endpoint discrepancies
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

            // Charger les jobs depuis le nouvel endpoint discrepancies
            const response = await JobService.getJobsDiscrepancies(inventoryId.value, warehouseId, {
                page: 1,
                page_size: 1000 // Charger toutes les données pour le moment
            })

            const jobs = response.results || []

            // Si les comptages n'ont pas été résolus depuis l'inventaire, les calculer depuis les jobs (fallback)
            if (countingOptions.value.length === 0 && jobs.length > 0) {
                const maxOrder = calculateMaxCountingOrderFromDiscrepancies(jobs)
                resolveCountingOptions(maxOrder)
                logger.debug('Comptages calculés depuis les jobs (fallback)', countingOptions.value)
            }

            // Transformer les jobs en lignes pour le DataTable
            trackingRows.value = transformDiscrepanciesToRows(jobs)
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

    // ===== MÉTHODES D'IMPRESSION =====

    /**
     * Affiche une popup pour sélectionner une session, puis les jobs, et génère les PDFs
     */
    const printJobs = async () => {
        try {
            // Charger les sessions si nécessaire
            if (sessionStore.getAllSessions.length === 0) {
                await sessionStore.fetchSessions()
            }

            const sessions = sessionStore.getAllSessions

            if (sessions.length === 0) {
                await alertService.error({ text: 'Aucune session disponible' })
                return
            }

            // Créer les options pour le select de sessions
            const sessionOptions: Record<string, string> = {}
            sessions.forEach(session => {
                sessionOptions[session.id.toString()] = session.username
            })

            // Première popup : Sélection de la session
            const sessionSelection = await Swal.fire({
                title: 'Sélectionner une session',
                html: `
                    <div style="text-align: center; padding: 1rem 0;">
                        <p style="color: #6b7280; font-size: 0.95rem; margin-bottom: 1.5rem;">
                            Choisissez la session pour afficher les jobs
                        </p>
                    </div>
                `,
                input: 'select',
                inputOptions: sessionOptions,
                inputPlaceholder: 'Sélectionnez une session...',
                showCancelButton: true,
                confirmButtonText: 'Suivant',
                cancelButtonText: 'Annuler',
                confirmButtonColor: '#FECD1C',
                cancelButtonColor: '#B4B6BA',
                inputValidator: (value) => {
                    if (!value) {
                        return 'Veuillez sélectionner une session'
                    }
                    return null
                },
                customClass: {
                    popup: 'sweet-alerts',
                    confirmButton: 'btn btn-primary',
                    cancelButton: 'btn btn-secondary'
                },
                width: '500px',
                padding: '2rem'
            })

            if (!sessionSelection.isConfirmed || !sessionSelection.value) {
                return
            }

            const selectedSessionId = Number(sessionSelection.value)
            const selectedSession = sessions.find(s => s.id === selectedSessionId)

            if (!selectedSession) {
                await alertService.error({ text: 'Session sélectionnée introuvable' })
                return
            }

            // Charger les jobs de la session
            const assignmentsResponse = await JobService.getSessionAssignments(selectedSessionId)

            if (!assignmentsResponse.success || !assignmentsResponse.data.jobs || assignmentsResponse.data.jobs.length === 0) {
                await alertService.warning({ text: 'Aucun job disponible pour cette session' })
                return
            }

            const jobs = assignmentsResponse.data.jobs

            // Deuxième popup : Sélection des jobs (multi-sélection)
            const jobsSelection = await Swal.fire({
                title: 'Sélectionner les jobs',
                html: `
                    <div style="text-align: left; padding: 1rem 0;">
                        <p style="color: #6b7280; font-size: 0.95rem; margin-bottom: 1rem;">
                            Sélectionnez un ou plusieurs jobs à imprimer
                        </p>
                        <div id="jobs-checkboxes" style="max-height: 300px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem;">
                            ${jobs.map(job => `
                                <label style="display: flex; align-items: center; padding: 0.75rem; margin-bottom: 0.5rem; cursor: pointer; border-radius: 0.375rem; transition: background-color 0.2s;"
                                       onmouseover="this.style.backgroundColor='#f3f4f6'"
                                       onmouseout="this.style.backgroundColor='transparent'">
                                    <input type="checkbox" value="${job.id}" class="job-checkbox" style="margin-right: 0.75rem; width: 1.25rem; height: 1.25rem; cursor: pointer;">
                                    <span style="font-size: 0.95rem; color: #1f2937;">${job.reference}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Imprimer',
                cancelButtonText: 'Annuler',
                confirmButtonColor: '#FECD1C',
                cancelButtonColor: '#B4B6BA',
                customClass: {
                    popup: 'sweet-alerts',
                    confirmButton: 'btn btn-primary',
                    cancelButton: 'btn btn-secondary'
                },
                width: '600px',
                padding: '2rem',
                preConfirm: () => {
                    const checkboxes = document.querySelectorAll<HTMLInputElement>('.job-checkbox:checked')
                    const selectedJobIds = Array.from(checkboxes).map(cb => Number(cb.value))

                    if (selectedJobIds.length === 0) {
                        Swal.showValidationMessage('Veuillez sélectionner au moins un job')
                        return false
                    }

                    return selectedJobIds
                }
            })

            if (!jobsSelection.isConfirmed || !jobsSelection.value) {
                return
            }

            const selectedJobIds = jobsSelection.value as number[]

            // Pour chaque job sélectionné, générer les PDFs
            await Swal.fire({
                title: 'Génération en cours...',
                html: 'Veuillez patienter pendant la génération des PDFs',
                allowOutsideClick: false,
                allowEscapeKey: false,
                didOpen: () => {
                    Swal.showLoading()
                }
            })

            const pdfPromises: Promise<{ jobId: number; blob: Blob; filename: string }>[] = []

            for (const jobId of selectedJobIds) {
                try {
                    // Note: L'API nécessite job_id et assignment_id
                    // Pour l'instant, on génère avec assignment_id = 1 (à adapter selon les besoins)
                    const blob = await JobService.generateJobPDF(jobId, 1)
                    const job = jobs.find(j => j.id === jobId)
                    const filename = `job_${jobId}_${job?.reference || 'unknown'}.pdf`

                    pdfPromises.push(Promise.resolve({ jobId, blob, filename }))
                } catch (error) {
                    logger.error(`Erreur lors de la génération du PDF pour le job ${jobId}`, error)
                }
            }

            const pdfResults = await Promise.allSettled(pdfPromises)

            // Télécharger tous les PDFs générés
            let successCount = 0
            let errorCount = 0

            pdfResults.forEach((result) => {
                if (result.status === 'fulfilled') {
                    const { blob, filename } = result.value
                    const url = window.URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = filename
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    window.URL.revokeObjectURL(url)
                    successCount++
                } else {
                    errorCount++
                }
            })

            await Swal.fire({
                title: successCount > 0 ? 'Succès !' : 'Erreur',
                html: `
                    <div style="text-align: center; padding: 1rem 0;">
                        <p style="color: #6b7280; font-size: 0.95rem;">
                            ${successCount > 0 ? `${successCount} PDF(s) généré(s) et téléchargé(s) avec succès.` : ''}
                            ${errorCount > 0 ? `<br>${errorCount} erreur(s) lors de la génération.` : ''}
                        </p>
                    </div>
                `,
                icon: successCount > 0 ? 'success' : 'error',
                confirmButtonColor: '#FECD1C',
                customClass: {
                    popup: 'sweet-alerts',
                    confirmButton: 'btn btn-primary'
                }
            })
        } catch (error: any) {
            logger.error('Erreur lors de l\'impression des jobs', error)
            await alertService.error({
                text: error?.response?.data?.message || error?.message || 'Erreur lors de l\'impression des jobs'
            })
        }
    }

    // ===== HANDLERS DE SÉLECTION =====

    /**
     * Handler pour les changements de sélection dans le DataTable
     *
     * @param selectedRowsSet - Set des IDs de lignes sélectionnées
     */
    const onSelectionChanged = (selectedRowsSet: Set<string>) => {
        selectedRows.value = selectedRowsSet ? Array.from(selectedRowsSet) : []
    }

    /**
     * Réinitialiser toutes les sélections
     */
    const resetSelection = () => {
        selectedRows.value = []
    }

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
        selectedRows,
        selectedRowsCount,
        hasSelectedRows,

        // Données tableau
        rows: trackingRows,
        columns,
        hasRows,

        // Actions
        initialize,
        reinitialize,
        refresh: fetchTrackingData,
        printJobs,
        onSelectionChanged,
        resetSelection
    }
}
