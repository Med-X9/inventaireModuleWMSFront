<template>
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="close">
        <div class="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h2 class="text-xl font-bold text-slate-900 dark:text-white m-0">Réaffecter les jobs</h2>
                <p class="text-sm text-slate-600 dark:text-slate-400 m-0 mt-1">
                    Équipe actuelle : <strong>{{ team?.team }}</strong>
                </p>
            </div>

            <div class="px-6 py-4 space-y-5">
                <!-- Étape 1 : jobs -->
                <section>
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200 m-0">1. Jobs à réaffecter</h3>
                        <button type="button" class="text-sm text-primary underline" @click="toggleAll">
                            {{ allSelected ? 'Tout désélectionner' : 'Tout sélectionner' }}
                        </button>
                    </div>
                    <ul class="divide-y divide-slate-200 dark:divide-slate-700 rounded-lg border border-slate-200 dark:border-slate-700">
                        <li v-for="job in jobs" :key="job.key" class="flex items-center gap-3 px-3 py-2" :class="job.locked ? 'opacity-50' : ''">
                            <input
                                :id="job.key"
                                type="checkbox"
                                :disabled="job.locked"
                                :checked="selected.has(job.key)"
                                @change="toggle(job.key)"
                            />
                            <label :for="job.key" class="flex-1 text-sm text-slate-800 dark:text-slate-100 cursor-pointer">
                                {{ job.job_reference }} · {{ job.comptageLabel }}
                            </label>
                            <span class="text-xs font-semibold px-2 py-0.5 rounded-full" :class="badge(job.status)">{{ job.status }}</span>
                        </li>
                    </ul>
                    <p v-if="jobs.some((j) => j.locked)" class="text-xs text-slate-500 mt-1">
                        Les jobs TERMINE ne peuvent pas être réaffectés.
                    </p>
                </section>

                <!-- Étape 2 : équipe -->
                <section>
                    <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">2. Nouvelle équipe</h3>
                    <select
                        v-model="targetTeamId"
                        :disabled="selected.size === 0 || loadingTeams"
                        class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    >
                        <option value="">{{ loadingTeams ? 'Chargement…' : 'Choisir une équipe' }}</option>
                        <option v-for="t in teamOptions" :key="t.id" :value="String(t.id)">{{ t.username }}</option>
                    </select>
                    <p v-if="selected.size > 0 && !loadingTeams && teamOptions.length === 0" class="text-xs text-red-600 mt-1">
                        Aucune équipe disponible pour ces comptages.
                    </p>
                </section>

                <!-- Étape 3 : mode -->
                <section>
                    <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">3. Saisies déjà faites</h3>
                    <label class="flex items-start gap-2 text-sm mb-2 cursor-pointer text-slate-800 dark:text-slate-100">
                        <input v-model="complete" type="radio" :value="false" class="mt-1" />
                        <span><strong>Conserver</strong> les saisies existantes (réaffectation partielle)</span>
                    </label>
                    <label class="flex items-start gap-2 text-sm cursor-pointer text-slate-800 dark:text-slate-100">
                        <input v-model="complete" type="radio" :value="true" class="mt-1" />
                        <span><strong>Repartir à zéro</strong> : supprime les saisies du comptage concerné</span>
                    </label>
                </section>

                <p v-if="errorText" class="text-sm text-red-600">{{ errorText }}</p>
            </div>

            <div class="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" class="px-4 py-2 text-sm rounded-lg bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100" @click="close">
                    Annuler
                </button>
                <button
                    type="button"
                    class="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white disabled:opacity-50"
                    :disabled="!canSubmit"
                    @click="submit"
                >
                    {{ submitting ? 'Réaffectation…' : `Réaffecter (${selected.size})` }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { JobService } from '@/services/jobService'
import { SessoinService } from '@/services/SessionService'
import { alertService } from '@/services/alertService'
import { logger } from '@/services/loggerService'

interface TeamJob {
    job_id: number
    job_reference: string
    counting_order: number | null
    status: string
}

interface Team {
    session_id: number
    team: string
    rawJobs: TeamJob[]
}

const props = defineProps<{ modelValue: boolean; team: Team | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; done: [] }>()

const countingLabel = (order: number | null) => (order === 1 ? '1er comptage' : order ? `${order}e comptage` : '-')

const jobs = computed(() =>
    (props.team?.rawJobs ?? []).map((j) => ({
        ...j,
        key: `${j.job_id}-${j.counting_order}`,
        comptageLabel: countingLabel(j.counting_order),
        locked: j.status === 'TERMINE' || j.counting_order == null
    }))
)

const selected = ref<Set<string>>(new Set())
const targetTeamId = ref('')
const complete = ref(false)
const submitting = ref(false)
const loadingTeams = ref(false)
const errorText = ref('')
const teamOptions = ref<Array<{ id: number; username: string }>>([])

const selectableKeys = computed(() => jobs.value.filter((j) => !j.locked).map((j) => j.key))
const allSelected = computed(() => selectableKeys.value.length > 0 && selectableKeys.value.every((k) => selected.value.has(k)))
const canSubmit = computed(() => selected.value.size > 0 && !!targetTeamId.value && !submitting.value)

const badge = (status: string) =>
    status === 'TERMINE'
        ? 'bg-green-100 text-green-800'
        : status === 'ENTAME'
          ? 'bg-blue-100 text-blue-800'
          : status === 'BLOQUE'
            ? 'bg-red-100 text-red-800'
            : 'bg-amber-100 text-amber-800'

const toggle = (key: string) => {
    const next = new Set(selected.value)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    selected.value = next
}
const toggleAll = () => {
    selected.value = allSelected.value ? new Set() : new Set(selectableKeys.value)
}

const teamsCache = new Map<number, Array<{ id: number; username: string }>>()
async function teamsForOrder(order: number) {
    if (!teamsCache.has(order)) {
        const list: any[] = await SessoinService.getMobileUsersForCountingOrder(order)
        teamsCache.set(order, (Array.isArray(list) ? list : []).map((s) => ({ id: Number(s.id), username: String(s.username) })))
    }
    return teamsCache.get(order) ?? []
}

// Équipes proposées = équipes autorisées pour TOUS les comptages sélectionnés
watch(selected, async (keys) => {
    targetTeamId.value = ''
    const orders = [...new Set(jobs.value.filter((j) => keys.has(j.key)).map((j) => j.counting_order as number))]
    if (orders.length === 0) {
        teamOptions.value = []
        return
    }
    loadingTeams.value = true
    try {
        const lists = await Promise.all(orders.map(teamsForOrder))
        const [first, ...rest] = lists
        teamOptions.value = first.filter(
            (t) => t.id !== props.team?.session_id && rest.every((l) => l.some((x) => x.id === t.id))
        )
    } catch (error) {
        logger.error('Erreur chargement des équipes', error)
        teamOptions.value = []
    } finally {
        loadingTeams.value = false
    }
})

watch(
    () => props.modelValue,
    (open) => {
        if (open) {
            selected.value = new Set()
            targetTeamId.value = ''
            complete.value = false
            errorText.value = ''
            teamOptions.value = []
        }
    }
)

const close = () => emit('update:modelValue', false)

async function submit() {
    if (!canSubmit.value) return
    if (complete.value) {
        const res = await alertService.confirm({
            title: 'Repartir à zéro',
            text: 'Les saisies du comptage concerné seront supprimées pour les jobs sélectionnés. Continuer ?'
        })
        if (!res.isConfirmed) return
    }
    submitting.value = true
    errorText.value = ''
    const failures: string[] = []
    let ok = 0
    for (const job of jobs.value.filter((j) => selected.value.has(j.key))) {
        try {
            await JobService.assignTeamToJobAuto({
                job_id: job.job_id,
                team: Number(targetTeamId.value),
                counting_order: job.counting_order as number,
                complete: complete.value
            })
            ok += 1
        } catch (error: any) {
            const message = error?.response?.data?.message || error?.response?.data?.errors || error?.message || 'erreur'
            failures.push(`${job.job_reference} (${job.comptageLabel}) : ${message}`)
        }
    }
    submitting.value = false
    if (ok > 0) emit('done')
    if (failures.length === 0) {
        await alertService.success({ text: `${ok} job(s) réaffecté(s)` })
        close()
    } else {
        errorText.value = `${ok} réaffecté(s), ${failures.length} en échec : ${failures.join(' | ')}`
    }
}
</script>
