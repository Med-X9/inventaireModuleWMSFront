import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useInventoryStore } from '@/stores/inventory'
import { useWarehouseStore } from '@/stores/warehouse'
import { useJobStore } from '@/stores/job'
import { inventoryResultsService } from '@/services/inventoryResultsService'
import { alertService } from '@/services/alertService'
import { logger } from '@/services/loggerService'
import type { StoreOption } from '@/interfaces/inventoryResults'
import type { JobResult, JobAssignment, JobEmplacement } from '@/models/Job'
import type { DataTableColumn, ColumnDataType } from '@/types/dataTable'

export interface UseJobTrackingConfig {
    inventoryReference?: string
    initialStoreId?: string
    initialCountingOrder?: number
}

export interface CountingOption {
    label: string
    value: number
}

export interface JobTrackingRow {
    id: string
    jobReference: string
    emplacement: string
    statut: string
    countingOrder: number | null
    dateTransfert: string | null
    dateLancement: string | null
    dateFin: string | null
}

type AssignmentWithDates = JobAssignment & {
    date_transfer?: string | null
    dateTransfert?: string | null
    date_lancement?: string | null
    date_launch?: string | null
    date_end?: string | null
    date_fin?: string | null
}

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

const mapEmplacementLabel = (emplacement: JobEmplacement, index: number): string => {
    return emplacement?.location_reference
        || emplacement?.reference
        || `Emplacement ${index + 1}`
}

export function useJobTracking(config?: UseJobTrackingConfig) {
    const inventoryStore = useInventoryStore()
    const warehouseStore = useWarehouseStore()
    const jobStore = useJobStore()

    const { loading: inventoryLoading } = storeToRefs(inventoryStore)
    const { warehouses } = storeToRefs(warehouseStore)
    const { jobsValidated, loading: jobsLoading } = storeToRefs(jobStore)

    const inventoryReference = ref(config?.inventoryReference ?? '')
    const inventoryId = ref<number | null>(null)
    const isInitialized = ref(false)

    const storeOptions = ref<StoreOption[]>([])
    const selectedStore = ref<string | null>(config?.initialStoreId ?? null)
    const isFetchingStores = ref(false)

    const countingOptions = ref<CountingOption[]>([])
    const selectedCountingOrder = ref<number | null>(config?.initialCountingOrder ?? null)

    const trackingRows = ref<JobTrackingRow[]>([])
    const isLoading = computed(() => inventoryLoading.value || jobsLoading.value || isFetchingStores.value)

    const columns = ref<DataTableColumn<JobTrackingRow>[]>([{
        headerName: 'Emplacement',
        field: 'emplacement',
        sortable: true,
        filterable: true,
        dataType: 'text' as ColumnDataType,
        width: 180,
        description: 'Emplacement concerné'
    }, {
        headerName: 'Statut',
        field: 'statut',
        sortable: true,
        filterable: true,
        dataType: 'text' as ColumnDataType,
        width: 140,
        description: 'Statut du job pour ce comptage'
    }, {
        headerName: 'Date transfert',
        field: 'dateTransfert',
        sortable: true,
        filterable: true,
        dataType: 'datetime' as ColumnDataType,
        width: 165,
        valueFormatter: (params: any) => params.value || '-'
    }, {
        headerName: 'Date lancement',
        field: 'dateLancement',
        sortable: true,
        filterable: true,
        dataType: 'datetime' as ColumnDataType,
        width: 165,
        valueFormatter: (params: any) => params.value || '-'
    }, {
        headerName: 'Date fin',
        field: 'dateFin',
        sortable: true,
        filterable: true,
        dataType: 'datetime' as ColumnDataType,
        width: 165,
        valueFormatter: (params: any) => params.value || '-'
    }])

    const hasRows = computed(() => trackingRows.value.length > 0)

    const resolveCountingOptions = (maxCountings: number) => {
        const options: CountingOption[] = []

        for (let i = 1; i <= Math.max(maxCountings, 1); i += 1) {
            const suffix = i === 1 ? 'er' : 'ème'
            options.push({
                label: `${i}${suffix} comptage`,
                value: i
            })
        }

        countingOptions.value = options

        if (!selectedCountingOrder.value && options.length > 0) {
            selectedCountingOrder.value = options[0].value
        }
    }

    const synchronizeStoreOptions = (newOptions: StoreOption[]) => {
        storeOptions.value = newOptions
        if (!selectedStore.value && newOptions.length > 0) {
            selectedStore.value = newOptions[0].value
        }
    }

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

    const fetchStores = async () => {
        if (!inventoryId.value) {
            return
        }

        try {
            isFetchingStores.value = true
            const storeList = await inventoryResultsService.getStoreOptions(inventoryId.value)
            if (!storeList || storeList.length === 0) {
                if (warehouses.value.length === 0) {
                    await warehouseStore.fetchWarehouses()
                }

                const fallbackStores: StoreOption[] = warehouses.value.map(warehouse => ({
                    label: warehouse.warehouse_name || warehouse.reference || `Entrepôt ${warehouse.id}`,
                    value: String(warehouse.id)
                }))
                synchronizeStoreOptions(fallbackStores)
            } else {
                synchronizeStoreOptions(storeList)
            }
        } catch (error) {
            logger.error('Erreur lors du chargement des magasins pour le suivi des jobs', error)
            await alertService.error({ text: 'Impossible de récupérer la liste des magasins' })
        } finally {
            isFetchingStores.value = false
        }
    }

    const fetchTrackingData = async () => {
        if (!inventoryId.value || !selectedStore.value) {
            trackingRows.value = []
            return
        }

        try {
            const warehouseId = Number(selectedStore.value)

            await jobStore.fetchJobsValidated(inventoryId.value, warehouseId)

            const jobs = jobsValidated.value || []
            resolveCountingOptions(calculateMaxCountingOrder(jobs))
            trackingRows.value = transformJobsToRows(jobs)
        } catch (error) {
            logger.error('Erreur lors du chargement des données de suivi des jobs', error)
            trackingRows.value = []
            await alertService.error({ text: 'Impossible de charger les données de suivi des jobs' })
        }
    }

    const fetchInventory = async (reference: string) => {
        if (!reference) {
            throw new Error('Référence d\'inventaire non fournie')
        }

        const inventory = await inventoryStore.fetchInventoryByReference(reference)
        inventoryId.value = inventory?.id || null

        if (!inventoryId.value) {
            throw new Error('Inventaire introuvable ou sans identifiant')
        }
    }

    const initialize = async (reference?: string) => {
        try {
            isInitialized.value = false

            if (reference) {
                inventoryReference.value = reference
            }

            if (!inventoryReference.value) {
                throw new Error('Aucune référence d\'inventaire fournie pour le suivi des jobs')
            }

            await fetchInventory(inventoryReference.value)
            await fetchStores()

            await fetchTrackingData()

            isInitialized.value = true
        } catch (error) {
            logger.error('Erreur lors de l\'initialisation du suivi des jobs', error)
            await alertService.error({ text: 'Impossible d\'initialiser le suivi des jobs' })
            throw error
        }
    }

    const reinitialize = async (reference: string) => {
        inventoryReference.value = reference
        inventoryId.value = null
        trackingRows.value = []
        storeOptions.value = []
        selectedStore.value = config?.initialStoreId ?? null
        selectedCountingOrder.value = config?.initialCountingOrder ?? null

        await initialize(reference)
    }

    watch([selectedStore, selectedCountingOrder], async () => {
        if (!isInitialized.value) {
            return
        }

        await fetchTrackingData()
    })

    return {
        // États
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


