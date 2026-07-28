/**
 * Composable — Import stock théorique (Excel) par inventaire + magasin
 * Flux : POST import → polling GET status jusqu'à COMPLETED / CANCELLED / FAILED
 *
 * @module useTheoreticalStockImport
 */

import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { InventoryService } from '@/services/InventoryService'
import { useInventoryStore } from '@/stores/inventory'
import { useWarehouseStore } from '@/stores/warehouse'
import { fetchInventoryIdByReference, fetchWarehouseIdByReference } from '@/composables/affecter/helpers'
import { alertService } from '@/services/alertService'
import { logger } from '@/services/loggerService'
import type { StockImportTaskData, StockImportTaskStatus } from '@/models/TheoreticalStock'

const POLL_INTERVAL_MS = 3000
const TERMINAL_STATUSES: StockImportTaskStatus[] = ['COMPLETED', 'CANCELLED', 'FAILED']
const ACTIVE_STATUSES: StockImportTaskStatus[] = ['PENDING', 'VALIDATING', 'PROCESSING']

export function useTheoreticalStockImport(
    inventoryReference: string,
    warehouseReference: string
) {
    const router = useRouter()
    const inventoryStore = useInventoryStore()
    const warehouseStore = useWarehouseStore()

    const inventoryId = ref<number | null>(null)
    const warehouseId = ref<number | null>(null)
    const loading = ref(false)
    const uploading = ref(false)
    const error = ref<string | null>(null)
    const importTask = ref<StockImportTaskData | null>(null)
    const selectedFile = ref<File | null>(null)
    const isDragging = ref(false)
    const uploadProgress = ref(0)
    const pollInterval = ref<ReturnType<typeof setInterval> | null>(null)

    const isProcessing = computed(() =>
        !!importTask.value && ACTIVE_STATUSES.includes(importTask.value.status)
    )

    const statusLabel = computed(() => {
        switch (importTask.value?.status) {
            case 'PENDING':
                return 'En attente'
            case 'VALIDATING':
                return 'Validation'
            case 'PROCESSING':
                return 'Import en cours'
            case 'COMPLETED':
                return 'Terminé'
            case 'CANCELLED':
                return 'Annulé'
            case 'FAILED':
                return 'Échec'
            default:
                return '—'
        }
    })

    const statusBadgeClass = computed(() => {
        switch (importTask.value?.status) {
            case 'COMPLETED':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            case 'CANCELLED':
            case 'FAILED':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            case 'PROCESSING':
            case 'VALIDATING':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
            default:
                return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
        }
    })

    const progressPercent = computed(() => {
        const total = importTask.value?.total_rows ?? 0
        const processed = importTask.value?.processed_rows ?? 0
        if (!total) return isProcessing.value ? 5 : 0
        return Math.min(100, Math.round((processed / total) * 100))
    })

    const stopPolling = () => {
        if (pollInterval.value) {
            clearInterval(pollInterval.value)
            pollInterval.value = null
        }
    }

    const fetchStatus = async (taskId: number) => {
        const response = await InventoryService.getTheoreticalStockImportStatus(taskId)
        importTask.value = response.data?.data ?? null
        if (importTask.value && TERMINAL_STATUSES.includes(importTask.value.status)) {
            stopPolling()
        }
    }

    const startPolling = (taskId: number) => {
        stopPolling()
        pollInterval.value = setInterval(() => {
            void fetchStatus(taskId).catch((err) => {
                logger.error('Erreur polling import stock théorique', err)
            })
        }, POLL_INTERVAL_MS)
    }

    const loadLatestImport = async () => {
        if (!inventoryId.value || !warehouseId.value) return
        try {
            const response = await InventoryService.getLatestTheoreticalStockImport(
                inventoryId.value,
                warehouseId.value
            )
            importTask.value = response.data?.data ?? null
            if (importTask.value && ACTIVE_STATUSES.includes(importTask.value.status)) {
                startPolling(importTask.value.import_task_id)
            }
        } catch (err: unknown) {
            const status = (err as { response?: { status?: number } })?.response?.status
            if (status === 404) {
                importTask.value = null
                return
            }
            logger.warn('Impossible de charger le dernier import stock', err)
        }
    }

    const initialize = async () => {
        loading.value = true
        error.value = null
        try {
            const [invId, whId] = await Promise.all([
                fetchInventoryIdByReference(inventoryReference, inventoryStore),
                fetchWarehouseIdByReference(warehouseReference, warehouseStore),
            ])
            inventoryId.value = invId
            warehouseId.value = whId
            if (!invId || !whId) {
                error.value = 'Impossible de résoudre l\'inventaire ou le magasin.'
                return
            }
            await loadLatestImport()
        } catch (err) {
            logger.error('Erreur initialisation import stock théorique', err)
            error.value = 'Erreur lors de l\'initialisation'
        } finally {
            loading.value = false
        }
    }

    const handleDragOver = (event: DragEvent) => {
        event.preventDefault()
        isDragging.value = true
    }

    const handleDragLeave = (event: DragEvent) => {
        event.preventDefault()
        isDragging.value = false
    }

    const handleDrop = (event: DragEvent) => {
        event.preventDefault()
        isDragging.value = false
        const file = event.dataTransfer?.files?.[0]
        if (file) selectedFile.value = file
    }

    const uploadFile = async () => {
        if (!selectedFile.value || !inventoryId.value || !warehouseId.value) return

        const fileName = selectedFile.value.name.toLowerCase()
        if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
            await alertService.error({
                title: 'Format invalide',
                text: 'Le fichier doit être au format Excel (.xlsx ou .xls)',
            })
            return
        }

        uploading.value = true
        uploadProgress.value = 10
        error.value = null

        try {
            const formData = new FormData()
            formData.append('file', selectedFile.value)

            const progressTimer = setInterval(() => {
                if (uploadProgress.value < 85) {
                    uploadProgress.value += 8
                }
            }, 200)

            const response = await InventoryService.importTheoreticalStocks(
                inventoryId.value,
                warehouseId.value,
                formData
            )

            clearInterval(progressTimer)
            uploadProgress.value = 100

            const data = response.data?.data
            if (!data?.import_task_id) {
                throw new Error(response.data?.message || 'Réponse d\'import invalide')
            }

            importTask.value = data
            selectedFile.value = null
            startPolling(data.import_task_id)
            await fetchStatus(data.import_task_id)

            await alertService.success({
                text: response.data?.message || 'Import démarré en arrière-plan',
            })
        } catch (err: unknown) {
            uploadProgress.value = 0
            const backend = (err as { response?: { data?: { message?: string; errors?: string[] } } })
                ?.response?.data
            error.value = backend?.message || 'Erreur lors de l\'import du stock théorique'
            await alertService.error({
                title: 'Erreur d\'import',
                text: error.value,
            })
        } finally {
            uploading.value = false
        }
    }

    const refreshStatus = async () => {
        if (!importTask.value?.import_task_id) {
            await loadLatestImport()
            return
        }
        loading.value = true
        try {
            await fetchStatus(importTask.value.import_task_id)
            if (importTask.value && ACTIVE_STATUSES.includes(importTask.value.status)) {
                startPolling(importTask.value.import_task_id)
            }
        } catch (err) {
            logger.error('Erreur refresh statut import stock', err)
        } finally {
            loading.value = false
        }
    }

    const goBack = () => {
        router.push({
            name: 'inventory-detail',
            params: { reference: inventoryReference },
        })
    }

    const goToStockGaps = () => {
        router.push({
            name: 'inventory-stock-gaps',
            params: {
                reference: inventoryReference,
                warehouse: warehouseReference,
            },
        })
    }

    onUnmounted(() => {
        stopPolling()
    })

    return {
        inventoryId,
        warehouseId,
        loading,
        uploading,
        error,
        importTask,
        selectedFile,
        isDragging,
        uploadProgress,
        isProcessing,
        statusLabel,
        statusBadgeClass,
        progressPercent,
        initialize,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        uploadFile,
        refreshStatus,
        goBack,
        goToStockGaps,
    }
}
