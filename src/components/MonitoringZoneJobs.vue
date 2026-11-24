<template>
    <ul v-if="jobs.length" class="divide-y divide-slate-100 dark:divide-slate-700/60">
        <li v-for="job in jobs" :key="job.id" class="flex flex-wrap items-center gap-x-3 gap-y-1 py-1.5">
            <span class="flex min-w-[6.5rem] items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100">
                <span class="h-1.5 w-1.5 rounded-full" :class="statusDot(job.status)" />
                {{ job.reference }}
            </span>
            <span class="inline-flex items-center gap-1 text-[11px] tabular-nums text-slate-500 dark:text-slate-400" title="Emplacements du job dans cette zone">
                <MdiIcon name="mdi-map-marker-outline" size="xs" class="text-[var(--m-loc)]" />{{ job.emplacements }}
            </span>
            <span class="flex flex-1 flex-wrap gap-1">
                <span
                    v-for="t in job.teams"
                    :key="t.assignmentId"
                    class="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset"
                    :class="teamChip(t.status)"
                    :title="teamTitle(t)">
                    <span class="font-bold tabular-nums">{{ t.order ? `C${t.order}` : '·' }}</span>
                    {{ t.name }}
                </span>
                <span v-if="!job.teams.length" class="text-[11px] italic text-slate-400">Aucune équipe affectée</span>
            </span>
        </li>
    </ul>
    <p v-else class="py-1 text-xs italic text-slate-400">Aucun job dans cette zone.</p>
</template>

<script setup lang="ts">
import MdiIcon from '@/components/MdiIcon.vue'
import type { ZoneJob, ZoneJobTeam } from '@/composables/monitoring/zoneProgress'

defineProps<{ jobs: ZoneJob[] }>()

/** Équipe : vert = terminé, orange = en cours, gris = pas encore entamé (couleurs du design system) */
const teamChip = (status: string) => {
    if (status === 'TERMINE') return 'bg-[var(--m-done)]/15 text-slate-800 ring-[var(--m-done)]/50 dark:text-slate-100'
    if (status === 'ENTAME') return 'bg-[var(--m-progress)]/15 text-slate-800 ring-[var(--m-progress)]/50 dark:text-slate-100'
    return 'bg-[var(--m-wait)]/15 text-slate-600 ring-[var(--m-wait)]/50 dark:text-slate-300'
}
const statusDot = (status: string) =>
    status === 'TERMINE' ? 'bg-[var(--m-done)]' : status === 'ENTAME' ? 'bg-[var(--m-progress)]' : 'bg-[var(--m-wait)]'

const teamTitle = (t: ZoneJobTeam) =>
    `${t.name}${t.members.length ? ` (${t.members.join(', ')})` : ''} — ${t.order ? `comptage ${t.order}` : 'comptage ?'} — ${t.status}`
</script>
