<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-8">
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 mb-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div class="flex justify-between items-start flex-wrap gap-4">
                <div>
                    <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">
                        Transfert des comptages
                        <span class="text-xl font-semibold text-primary ml-3">{{ reference }}</span>
                    </h1>
                    <p class="text-sm text-slate-600 dark:text-slate-400">
                        Fiches à imprimer au transfert d'un comptage, regroupées par numéro de comptage
                        (assignments au statut PRET ou TRANSFERT).
                    </p>
                    <p v-if="warehouseLabel" class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Entrepôt :
                        <span class="font-semibold text-slate-700 dark:text-slate-200">{{ warehouseLabel }}</span>
                    </p>
                </div>
                <button
                    type="button"
                    class="px-4 py-2 text-sm font-medium rounded-lg bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 hover:opacity-90"
                    @click="goBack"
                >
                    Retour au suivi
                </button>
            </div>
        </div>

        <div v-if="loading" class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg px-6 py-12 text-center text-slate-500 dark:text-slate-400">
            Chargement des jobs…
        </div>
        <div v-else-if="errorMessage" class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg px-6 py-8 text-center text-red-600 dark:text-red-400">
            {{ errorMessage }}
        </div>
        <div v-else-if="groups.length === 0" class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg px-6 py-12 text-center text-slate-500 dark:text-slate-400">
            Aucun comptage à transférer.
        </div>

        <!-- Un bloc par numéro de comptage -->
        <section
            v-for="group in groups"
            :key="group.order"
            class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-6"
        >
            <div class="flex items-center justify-between flex-wrap gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 class="text-lg font-bold text-slate-900 dark:text-white">
                    Comptage {{ group.order }}
                    <span class="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                        {{ group.rows.length }} job(s) ·
                        {{ selectedFor(group.order).length }} sélectionné(s)
                    </span>
                </h2>
                <div class="flex items-center gap-2">
                    <button
                        type="button"
                        class="px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-100 hover:opacity-90"
                        @click="toggleGroup(group)"
                    >
                        {{ isGroupAllSelected(group) ? 'Tout désélectionner' : 'Tout sélectionner' }}
                    </button>
                    <button
                        type="button"
                        class="px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:opacity-90 disabled:opacity-50"
                        :disabled="selectedFor(group.order).length === 0"
                        @click="openExport(group.order)"
                    >
                        Exporter le comptage {{ group.order }} ({{ selectedFor(group.order).length }})
                    </button>
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="min-w-full text-sm">
                    <thead class="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                        <tr>
                            <th class="px-4 py-3 w-10"></th>
                            <th class="px-4 py-3 text-left font-semibold">Job</th>
                            <th class="px-4 py-3 text-left font-semibold">Statut du job</th>
                            <th class="px-4 py-3 text-left font-semibold">Statut du comptage {{ group.order }}</th>
                            <th class="px-4 py-3 text-left font-semibold">Équipe</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                        <tr
                            v-for="row in group.rows"
                            :key="row.jobId"
                            class="hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer"
                            @click="toggleRow(group.order, row.jobId)"
                        >
                            <td class="px-4 py-3">
                                <input
                                    type="checkbox"
                                    :checked="isSelected(group.order, row.jobId)"
                                    @click.stop
                                    @change="toggleRow(group.order, row.jobId)"
                                />
                            </td>
                            <td class="px-4 py-3 font-medium text-slate-900 dark:text-white">{{ row.jobReference }}</td>
                            <td class="px-4 py-3 text-slate-600 dark:text-slate-300">{{ row.jobStatus || '-' }}</td>
                            <td class="px-4 py-3">
                                <span
                                    class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
                                    :class="statusBadgeClass(row.byOrder[group.order]!.status)"
                                >
                                    {{ row.byOrder[group.order]!.status }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-slate-600 dark:text-slate-300">
                                {{ row.byOrder[group.order]!.team || '-' }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        <InventoryJobsPdfExportModal
            v-model="showModal"
            :inventory-id="inventoryId"
            :inventory-reference="reference"
            export-mode="inventory"
            :job-ids="exportJobIds"
            :counting-order="exportOrder"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import InventoryJobsPdfExportModal from '@/components/Inventory/InventoryJobsPdfExportModal.vue'
import {
    TRANSFER_STATUSES,
    statusBadgeClass,
    usePdfExportJobs,
    type PdfExportRow
} from '@/composables/usePdfExportJobs'

interface CountingGroup {
    order: number
    rows: PdfExportRow[]
}

const props = defineProps<{ reference: string; warehouse: string }>()

const { inventoryId, warehouseLabel, rows, loading, errorMessage, countingOrders, load, goBack } =
    usePdfExportJobs(props.reference, props.warehouse)

/** Sélection par numéro de comptage : ordre -> ensemble de jobs */
const selection = ref<Record<number, Set<number>>>({})
const showModal = ref(false)
const exportOrder = ref<number | null>(null)
const exportJobIds = ref<number[]>([])

/** Un groupe par numéro de comptage, avec les jobs dont ce comptage est PRET ou TRANSFERT */
const groups = computed<CountingGroup[]>(() =>
    countingOrders.value
        .map((order) => ({
            order,
            rows: rows.value.filter((row) => TRANSFER_STATUSES.includes(row.byOrder[order]?.status ?? ''))
        }))
        .filter((group) => group.rows.length > 0)
)

const isSelected = (order: number, jobId: number) => selection.value[order]?.has(jobId) ?? false

const selectedFor = (order: number): number[] => Array.from(selection.value[order] ?? [])

function toggleRow(order: number, jobId: number) {
    const next = new Set(selection.value[order] ?? [])
    if (next.has(jobId)) next.delete(jobId)
    else next.add(jobId)
    selection.value = { ...selection.value, [order]: next }
}

const isGroupAllSelected = (group: CountingGroup) =>
    group.rows.length > 0 && selectedFor(group.order).length === group.rows.length

function toggleGroup(group: CountingGroup) {
    selection.value = {
        ...selection.value,
        [group.order]: isGroupAllSelected(group) ? new Set() : new Set(group.rows.map((r) => r.jobId))
    }
}

function openExport(order: number) {
    const ids = selectedFor(order)
    if (ids.length === 0) return
    exportOrder.value = order
    exportJobIds.value = ids
    showModal.value = true
}

onMounted(() => {
    void load()
})
</script>
