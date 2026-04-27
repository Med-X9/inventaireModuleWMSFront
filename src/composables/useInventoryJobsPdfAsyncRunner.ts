import { ref, type Ref } from 'vue'
import { InventoryService } from '@/services/InventoryService'
import { logger } from '@/services/loggerService'

export type JobsPdfAsyncPhase =
    | 'idle'
    | 'starting'
    | 'polling'
    | 'downloading'
    | 'done'
    | 'error'
    | 'cancelled'

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Délai avant chaque poll : 0,5 s → 1 s → 2 s (API_PDF_INVENTAIRE.md) */
function pollDelayMs(iteration: number): number {
    if (iteration <= 0) {
        return 500
    }
    if (iteration === 1) {
        return 1000
    }
    return 2000
}

const POLL_TIMEOUT_MS = 5 * 60 * 1000

/** Même poll GET pour toutes les tâches PDF d’inventaire */
export type RunInventoryJobsPdfParams =
    | { mode: 'inventory'; inventoryId: number; jobIds?: number[] }
    | { mode: 'finished'; inventoryId: number; warehouseId: number }

export function useInventoryJobsPdfAsyncRunner() {
    const phase: Ref<JobsPdfAsyncPhase> = ref('idle')
    const statusLabel: Ref<string> = ref('')
    const taskStatus: Ref<string> = ref('')
    const errorMessage: Ref<string | null> = ref(null)
    const cancelled: Ref<boolean> = ref(false)
    let runToken = 0

    const reset = () => {
        runToken += 1
        phase.value = 'idle'
        statusLabel.value = ''
        taskStatus.value = ''
        errorMessage.value = null
        cancelled.value = false
    }

    const cancel = () => {
        cancelled.value = true
        runToken += 1
        phase.value = 'cancelled'
        statusLabel.value = 'Interrompu'
    }

    function labelForTaskStatus(s: string): string {
        switch (s) {
            case 'PENDING':
                return 'Tâche en file d’attente…'
            case 'RUNNING':
                return 'Génération du PDF en cours sur le serveur…'
            case 'SUCCESS':
                return 'Génération terminée'
            case 'ERROR':
                return 'Échec de la génération'
            default:
                return s
        }
    }

    /**
     * Lance POST async, poll GET jusqu'à SUCCESS / ERROR, télécharge le PDF.
     * @returns blob + filename, ou null si annulé
     */
    const run = async (
        params: RunInventoryJobsPdfParams
    ): Promise<{ blob: Blob; filename: string | null } | null> => {
        const myToken = runToken
        errorMessage.value = null
        cancelled.value = false
        phase.value = 'starting'
        statusLabel.value = 'Démarrage de l’export PDF…'
        taskStatus.value = ''

        try {
            if (myToken !== runToken) {
                return null
            }
            const start =
                params.mode === 'finished'
                    ? await InventoryService.startWarehouseFinishedAssignmentsPdfAsync(
                          params.inventoryId,
                          params.warehouseId
                      )
                    : await InventoryService.startInventoryJobsPdfAsync(params.inventoryId, {
                          jobIds: params.jobIds
                      })
            if (cancelled.value || myToken !== runToken) {
                return null
            }
            const taskId = start.task_id
            taskStatus.value = start.status
            statusLabel.value = labelForTaskStatus(start.status)
            phase.value = 'polling'

            const pollStart = Date.now()
            let iter = 0
            while (Date.now() - pollStart < POLL_TIMEOUT_MS) {
                if (cancelled.value || myToken !== runToken) {
                    return null
                }
                await sleep(pollDelayMs(iter))
                iter += 1
                if (cancelled.value || myToken !== runToken) {
                    return null
                }

                const st = await InventoryService.getPdfTaskStatus(taskId)
                taskStatus.value = st.status
                statusLabel.value = labelForTaskStatus(st.status)

                if (st.status === 'SUCCESS') {
                    if (!st.download_url) {
                        phase.value = 'error'
                        errorMessage.value = 'Le PDF a été généré mais aucune URL de téléchargement n’est disponible. Contactez l’administrateur.'
                        return null
                    }
                    phase.value = 'downloading'
                    statusLabel.value = 'Récupération du fichier…'
                    const { blob, filename } = await InventoryService.fetchPdfFromDownloadUrl(st.download_url)
                    if (cancelled.value || myToken !== runToken) {
                        return null
                    }
                    phase.value = 'done'
                    statusLabel.value = 'Téléchargement prêt'
                    return { blob, filename }
                }
                if (st.status === 'ERROR') {
                    phase.value = 'error'
                    errorMessage.value = st.error_message || 'La génération du PDF a échoué.'
                    return null
                }
            }

            phase.value = 'error'
            errorMessage.value = 'Délai d’attente dépassé. Réessayez ou vérifiez l’état du serveur.'
            return null
        } catch (e: unknown) {
            if (cancelled.value || myToken !== runToken) {
                return null
            }
            logger.error('useInventoryJobsPdfAsyncRunner', e)
            phase.value = 'error'
            const msg =
                (e as { response?: { data?: { message?: string } } })?.response?.data?.message
                || (e as Error)?.message
                || 'Erreur lors de l’export PDF des jobs'
            errorMessage.value = msg
            return null
        }
    }

    return {
        phase,
        statusLabel,
        taskStatus,
        errorMessage,
        cancelled,
        reset,
        cancel,
        run
    }
}
