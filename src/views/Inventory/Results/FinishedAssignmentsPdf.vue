<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-8">
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 mb-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div class="flex justify-between items-start flex-wrap gap-4">
                <div>
                    <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">
                        Assignments terminés
                        <span class="text-xl font-semibold text-primary ml-3">{{ reference }}</span>
                    </h1>
                    <p class="text-sm text-slate-600 dark:text-slate-400">
                        Fiches remplies des assignments terminés, qu'ils aient déjà été imprimés ou non.
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

            <label v-if="countingOrders.length > 1" class="mt-6 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                Comptage
                <select
                    v-model="orderFilter"
                    class="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm"
                >
                    <option value="all">Tous les comptages</option>
                    <option v-for="order in countingOrders" :key="order" :value="String(order)">Comptage {{ order }}</option>
                </select>
            </label>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div class="flex items-center justify-between flex-wrap gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <div class="text-sm text-slate-600 dark:text-slate-300">
                    <span class="font-semibold">{{ concernedRows.length }}</span> job(s) avec assignment terminé ·
                    <span class="font-semibold">{{ selectedIds.length }}</span> sélectionné(s)
                </div>
                <div class="flex items-center gap-2">
                    <button
                        type="button"
                        class="px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-100 hover:opacity-90 disabled:opacity-50"
                        :disabled="loading || concernedRows.length === 0"
                        @click="toggleAll"
                    >
                        {{ allSelected ? 'Tout désélectionner' : 'Tout sélectionner' }}
                    </button>
                    <button
                        type="button"
                        class="px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:opacity-90 disabled:opacity-50"
                        :disabled="loading || selectedIds.length === 0"
                        @click="showModal = true"
                    >
                        Exporter {{ selectedIds.length }} job(s)
                    </button>
                </div>
            </div>

            <div v-if="loading" class="px-6 py-12 text-center text-slate-500 dark:text-slate-400">Chargement des jobs…</div>
            <div v-else-if="errorMessage" class="px-6 py-8 text-center text-red-600 dark:text-red-400">{{ errorMessage }}</div>
            <div v-else-if="concernedRows.length === 0" class="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                Aucun assignment terminé.
            </div>
            <div v-else class="overflow-x-auto">
                <table class="min-w-full text-sm">
                    <thead class="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                        <tr>
                            <th class="px-4 py-3 w-10"></th>
                            <th class="px-4 py-3 text-left font-semibold">Job</th>
                            <th class="px-4 py-3 text-left font-semibold">Statut du job</th>
                            <th v-for="order in countingOrders" :key="order" class="px-4 py-3 text-left font-semibold">
                                Comptage {{ order }}
                            </th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                        <tr
                            v-for="row in concernedRows"
                            :key="row.jobId"
                            class="hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer"
                            @click="toggleRow(row.jobId)"
                        >
                            <td class="px-4 py-3">
                                <input type="checkbox" :checked="selected.has(row.jobId)" @click.stop @change="toggleRow(row.jobId)" />
                            </td>
                            <td class="px-4 py-3 font-medium text-slate-900 dark:text-white">{{ row.jobReference }}</td>
                            <td class="px-4 py-3 text-slate-600 dark:text-slate-300">{{ row.jobStatus || '-' }}</td>
                            <td v-for="order in countingOrders" :key="order" class="px-4 py-3">
                                <template v-if="row.byOrder[order]">
                                    <span
                                        class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
                                        :class="statusBadgeClass(row.byOrder[order].status)"
                                    >
                                        {{ row.byOrder[order].status }}
                                    </span>
                                    <span v-if="row.byOrder[order].team" class="ml-2 text-xs text-slate-500 dark:text-slate-400">
                                        {{ row.byOrder[order].team }}
                                    </span>
                                </template>
                                <span v-else class="text-slate-400">-</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <InventoryJobsPdfExportModal
            v-model="showModal"
            :inventory-id="inventoryId"
            :inventory-reference="reference"
            export-mode="inventory"
            :job-ids="selectedIds"
            :counting-order="orderFilter === 'all' ? null : Number(orderFilter)"
            :assignment-statuses="['TERMINE']"
            :job-statuses="[]"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import InventoryJobsPdfExportModal from '@/components/Inventory/InventoryJobsPdfExportModal.vue'
import { statusBadgeClass, usePdfExportJobs } from '@/composables/usePdfExportJobs'

const props = defineProps<{ reference: string; warehouse: string }>()

const { inventoryId, warehouseLabel, rows, loading, errorMessage, countingOrders, load, goBack } =
    usePdfExportJobs(props.reference, props.warehouse)

const orderFilter = ref<string>('all')
const selected = ref<Set<number>>(new Set())
const showModal = ref(false)

/** Jobs ayant un assignment TERMINE (imprimé ou non), pour le comptage filtré le cas échéant */
const concernedRows = computed(() =>
    rows.value.filter((row) => {
        if (orderFilter.value === 'all') {
            return Object.values(row.byOrder).some((a) => a.status === 'TERMINE')
        }
        return row.byOrder[Number(orderFilter.value)]?.status === 'TERMINE'
    })
)

const selectedIds = computed(() =>
    concernedRows.value.filter((r) => selected.value.has(r.jobId)).map((r) => r.jobId)
)
const allSelected = computed(
    () => concernedRows.value.length > 0 && selectedIds.value.length === concernedRows.value.length
)

watch(orderFilter, () => {
    selected.value = new Set()
})

function toggleRow(jobId: number) {
    const next = new Set(selected.value)
    if (next.has(jobId)) next.delete(jobId)
    else next.add(jobId)
    selected.value = next
}

function toggleAll() {
    selected.value = allSelected.value ? new Set() : new Set(concernedRows.value.map((r) => r.jobId))
}

onMounted(() => {
    void load()
})
</script>
