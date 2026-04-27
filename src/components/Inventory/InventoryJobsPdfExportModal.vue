<template>
    <Modal
        v-model="open"
        title="Export PDF des jobs"
        size="md"
        :hideCloseButton="isBusy"
    >
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">
            Génération côté serveur, puis téléchargement automatique. Vous pouvez fermer en cas d’attente prolongée
            (la tâche peut toutefois continuer sur le serveur).
        </p>
        <div class="space-y-4 text-left min-h-[120px]">
            <!-- En cours -->
            <div
                v-if="isBusy"
                class="flex flex-col items-center justify-center py-2 gap-3"
            >
                <div
                    class="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent"
                />
                <p class="text-sm text-slate-600 dark:text-slate-300 text-center leading-relaxed">
                    {{ statusLabel || 'Préparation…' }}
                </p>
            </div>

            <!-- Erreur -->
            <div
                v-else-if="phase === 'error'"
                class="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-950/40 px-4 py-3"
            >
                <p class="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Échec</p>
                <p class="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
                    {{ errorMessage || 'Erreur inconnue' }}
                </p>
            </div>

            <!-- Annulé -->
            <div
                v-else-if="phase === 'cancelled'"
                class="text-sm text-slate-600 dark:text-slate-400 text-center"
            >
                Fenêtre fermée. Si la génération était encore en cours, le fichier n’a peut‑être pas été récupéré.
            </div>

            <div class="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                    v-if="!isBusy"
                    type="button"
                    class="px-4 py-2 text-sm font-medium rounded-lg bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 hover:opacity-90"
                    @click="close"
                >
                    Fermer
                </button>
            </div>
        </div>
    </Modal>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import Modal from '@/components/Modal.vue'
import { alertService } from '@/services/alertService'
import { useInventoryJobsPdfAsyncRunner } from '@/composables/useInventoryJobsPdfAsyncRunner'
import { InventoryJobsPdfRequestError, parsePositiveInventoryId } from '@/services/InventoryService'

const props = withDefaults(
    defineProps<{
        modelValue: boolean
        /** Inventaire cible (obligatoire pour lancer l’export) */
        inventoryId: number | null
        /** Réf. pour le nom de fichier de repli */
        inventoryReference?: string | null
        /**
         * `inventory` : POST `…/inventory/<id>/jobs/pdf/async/` (optionnel : jobIds)
         * `finished` : assignments TERMINE non imprimés pour le magasin (POST `…/warehouse/<wid>/…/finished-assignments/async/`)
         */
        exportMode?: 'inventory' | 'finished'
        /** Obligatoire si exportMode = `finished` */
        warehouseId?: number | null
        /** Filtre jobs côté API (mode `inventory` uniquement) */
        jobIds?: number[]
    }>(),
    { exportMode: 'inventory', warehouseId: null }
)

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
}>()

const {
    phase,
    statusLabel,
    errorMessage,
    reset: resetRunner,
    cancel,
    run
} = useInventoryJobsPdfAsyncRunner()

const isBusy = computed(() =>
    ['starting', 'polling', 'downloading'].includes(phase.value)
)

const open = computed({
    get: () => props.modelValue,
    set: (v: boolean) => {
        if (!v && isBusy.value) {
            cancel()
        }
        emit('update:modelValue', v)
    }
})

function downloadBlob(blob: Blob, name: string) {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
}

function safeFilename(ref: string | null | undefined, inventoryId: number) {
    const base = (ref || String(inventoryId)).replace(/[^\w.\- ()]+/g, '_')
    return `Job_inventaire_${base}.pdf`
}

function close() {
    open.value = false
}

function mapPdfErrorMessage(err: unknown): string {
    if (err instanceof InventoryJobsPdfRequestError) {
        const base = err.message
        switch (err.errorType) {
            case 'empty_content':
                return 'Aucun contenu à afficher pour ce PDF (jobs / assignments PRET ou TRANSFERT requis, selon les règles métier).'
            case 'not_found':
                return 'Données introuvables pour générer le PDF des jobs.'
            case 'validation_error':
                return base
            case 'service_error':
            case 'generation_error':
                return `Erreur de génération : ${base}`
            case 'internal_error':
                return `Erreur serveur : ${base}`
            default:
                return base || 'Impossible d’exporter les jobs en PDF'
        }
    }
    if (err && typeof err === 'object' && 'message' in err && typeof (err as Error).message === 'string') {
        return (err as Error).message
    }
    return 'Erreur lors de l’export PDF des jobs'
}

async function startFlow() {
    const invId = parsePositiveInventoryId(props.inventoryId)
    if (invId == null) {
        await alertService.error({
            title: 'Export PDF',
            text: 'Identifiant d’inventaire invalide. Rechargez la page ou ouvrez l’inventaire depuis la liste.'
        })
        open.value = false
        return
    }
    resetRunner()
    try {
        let res: { blob: Blob; filename: string | null } | null
        if (props.exportMode === 'finished') {
            const whId = parsePositiveInventoryId(props.warehouseId)
            if (whId == null) {
                await alertService.error({
                    title: 'Export PDF',
                    text: 'Sélectionnez un magasin pour exporter les feuilles terminées.'
                })
                open.value = false
                return
            }
            res = await run({
                mode: 'finished',
                inventoryId: invId,
                warehouseId: whId
            })
        } else {
            res = await run({
                mode: 'inventory',
                inventoryId: invId,
                jobIds: props.jobIds?.length ? props.jobIds : undefined
            })
        }
        if (phase.value === 'cancelled') {
            return
        }
        if (res) {
            const name =
                (res.filename && res.filename.trim()) || safeFilename(props.inventoryReference, invId)
            downloadBlob(res.blob, name)
            await alertService.success({
                text: 'Le PDF des jobs a été généré et téléchargé.'
            })
            open.value = false
        } else if (phase.value === 'error' && !errorMessage.value) {
            errorMessage.value = 'L’export n’a pas pu se terminer.'
        }
    } catch (e) {
        phase.value = 'error'
        errorMessage.value = mapPdfErrorMessage(e)
    }
}

watch(
    () => props.modelValue,
    (v) => {
        if (v) {
            void startFlow()
        }
    }
)
</script>
