<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-8">
        <!-- En-tête -->
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 mb-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div class="flex justify-between items-start flex-wrap gap-4">
                <div>
                    <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">
                        Lancement du comptage suivant
                        <span class="text-xl font-semibold text-primary ml-3">{{ reference }}</span>
                    </h1>
                    <p class="text-sm text-slate-600 dark:text-slate-400">
                        Jobs dont les emplacements en écart attendent un nouveau comptage. Sélectionnez les jobs d'un même
                        comptage, choisissez l'équipe mobile, puis lancez.
                    </p>
                    <p v-if="warehouseLabel" class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Entrepôt :
                        <span class="font-semibold text-slate-700 dark:text-slate-200">{{ warehouseLabel }}</span>
                    </p>
                </div>
                <button
                    type="button"
                    class="px-4 py-2 text-sm font-medium rounded-lg bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 hover:opacity-90"
                    @click="goToResults"
                >
                    Retour aux résultats
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
            Aucun job ne nécessite un comptage suivant.
            <p class="text-xs mt-2">
                Les comptages précédents doivent être terminés et contenir des écarts sans résultat final.
            </p>
        </div>

        <div v-else class="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <!-- Jobs regroupés par numéro de comptage -->
            <div class="xl:col-span-2 space-y-6">
                <section
                    v-for="group in groups"
                    :key="group.order"
                    class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden transition"
                    :class="isGroupDisabled(group.order) ? 'opacity-50' : ''"
                >
                    <div class="flex items-center justify-between flex-wrap gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                        <h2 class="text-lg font-bold text-slate-900 dark:text-white">
                            Comptage {{ group.order }}
                            <span class="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
                                {{ group.jobs.length }} job(s)
                            </span>
                        </h2>
                        <button
                            type="button"
                            class="px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-100 hover:opacity-90 disabled:opacity-50"
                            :disabled="isGroupDisabled(group.order) || launching"
                            @click="toggleGroup(group)"
                        >
                            {{ group.jobs.every((j) => selectedJobIds.has(j.jobId)) ? 'Tout désélectionner' : 'Tout sélectionner' }}
                        </button>
                    </div>

                    <table class="min-w-full text-sm">
                        <thead class="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                            <tr>
                                <th class="px-4 py-3 w-10"></th>
                                <th class="px-4 py-3 text-left font-semibold">Job</th>
                                <th class="px-4 py-3 text-left font-semibold">Dernier comptage terminé</th>
                                <th class="px-4 py-3 text-left font-semibold">Emplacements en écart</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                            <tr
                                v-for="job in group.jobs"
                                :key="job.jobId"
                                class="hover:bg-slate-50 dark:hover:bg-slate-700/40"
                                :class="isGroupDisabled(group.order) ? '' : 'cursor-pointer'"
                                @click="toggleJob(group.order, job.jobId)"
                            >
                                <td class="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        :checked="selectedJobIds.has(job.jobId)"
                                        :disabled="isGroupDisabled(group.order) || launching"
                                        @click.stop
                                        @change="toggleJob(group.order, job.jobId)"
                                    />
                                </td>
                                <td class="px-4 py-3 font-medium text-slate-900 dark:text-white">{{ job.reference }}</td>
                                <td class="px-4 py-3 text-slate-600 dark:text-slate-300">
                                    {{ job.currentMaxCounting ? `Comptage ${job.currentMaxCounting}` : '-' }}
                                </td>
                                <td class="px-4 py-3 text-slate-600 dark:text-slate-300">{{ job.locationsCount }}</td>
                            </tr>
                        </tbody>
                    </table>
                </section>
            </div>

            <!-- Récapitulatif + équipe + lancement -->
            <aside class="xl:col-span-1">
                <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 sticky top-6">
                    <h2 class="text-lg font-bold text-slate-900 dark:text-white mb-4">Lancement</h2>

                    <div v-if="selectedJobs.length === 0" class="text-sm text-slate-500 dark:text-slate-400">
                        Sélectionnez au moins un job.
                    </div>
                    <template v-else>
                        <p class="text-sm text-slate-700 dark:text-slate-200 mb-3">
                            Comptage <span class="font-semibold">{{ selectedOrder }}</span> ·
                            <span class="font-semibold">{{ selectedJobs.length }}</span> job(s) ·
                            <span class="font-semibold">{{ selectedLocationsCount }}</span> emplacement(s)
                        </p>
                        <ul class="mb-4 max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg">
                            <li
                                v-for="job in selectedJobs"
                                :key="job.jobId"
                                class="flex items-center justify-between px-3 py-2 text-sm"
                            >
                                <span class="font-medium text-slate-800 dark:text-slate-100">{{ job.reference }}</span>
                                <span class="text-xs text-slate-500 dark:text-slate-400">{{ job.locationsCount }} empl.</span>
                            </li>
                        </ul>

                        <label class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2" for="launch-session">
                            Équipe mobile
                        </label>
                        <select
                            id="launch-session"
                            v-model.number="sessionId"
                            class="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm"
                            :disabled="sessionsLoading || launching"
                        >
                            <option :value="null">
                                {{ sessionsLoading ? 'Chargement des équipes…' : '-- Choisir une équipe --' }}
                            </option>
                            <option v-for="session in sessions" :key="session.id" :value="session.id">
                                {{ session.username || `Session ${session.id}` }}
                            </option>
                        </select>

                        <button
                            type="button"
                            class="mt-5 w-full px-4 py-3 text-sm font-semibold rounded-lg bg-primary-600 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            :disabled="!canLaunch"
                            @click="onLaunch"
                        >
                            {{ launching ? 'Lancement…' : `Lancer le comptage ${selectedOrder}` }}
                        </button>
                    </template>
                </div>
            </aside>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useCountingLaunch } from '@/composables/useCountingLaunch'

const props = defineProps<{ reference: string; warehouse: string }>()

const {
    warehouseLabel,
    groups,
    loading,
    errorMessage,
    selectedOrder,
    selectedJobIds,
    selectedJobs,
    selectedLocationsCount,
    sessions,
    sessionsLoading,
    sessionId,
    launching,
    canLaunch,
    isGroupDisabled,
    toggleJob,
    toggleGroup,
    load,
    launch,
    goToResults
} = useCountingLaunch(props.reference, props.warehouse)

async function onLaunch() {
    if (await launch()) {
        goToResults()
    }
}

onMounted(() => {
    void load()
})
</script>
