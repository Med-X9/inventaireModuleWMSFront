<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-8">
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 mb-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div class="flex justify-between items-start flex-wrap gap-4">
                <div>
                    <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">
                        Suivi par équipe
                        <span class="text-xl font-semibold text-primary ml-3">{{ reference }}</span>
                    </h1>
                    <p class="text-sm text-slate-600 dark:text-slate-400">
                        Jobs de chaque équipe et leur statut : EN ATTENTE, ENTAME, TERMINE, BLOQUE.
                    </p>
                    <p v-if="warehouseLabel" class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Entrepôt :
                        <span class="font-semibold text-slate-700 dark:text-slate-200">{{ warehouseLabel }}</span>
                    </p>
                </div>
                <button
                    type="button"
                    class="px-4 py-2 text-sm font-medium rounded-lg bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 hover:opacity-90"
                    @click="goToJobTracking"
                >
                    Retour au suivi des jobs
                </button>
            </div>
        </div>

        <div v-if="errorMessage" class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg px-6 py-8 text-center text-red-600 dark:text-red-400">
            {{ errorMessage }}
        </div>
        <div v-else class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <DataTable
                :columns="columns"
                :rowDataProp="rows"
                :actions="[]"
                :loading="loading"
                :enableDynamicColumns="false"
                :pagination="true"
                storageKey="team_tracking_table"
                emptyMessage="Aucune équipe avec des jobs affectés"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { DataTable } from '@SMATCH-Digital-dev/vue-system-design'
import { useTeamTracking } from '@/composables/useTeamTracking'

const props = defineProps<{ reference: string; warehouse: string }>()
const router = useRouter()

const { rows, columns, loading, errorMessage, warehouseLabel, load } = useTeamTracking(props.reference, props.warehouse)

const goToJobTracking = () => {
    void router.push({
        name: 'inventory-job-tracking',
        params: { reference: props.reference, warehouse: props.warehouse }
    })
}

onMounted(() => {
    void load()
})
</script>
