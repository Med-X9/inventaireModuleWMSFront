<template>
    <div class="min-w-0" :title="tooltip">
        <div class="flex items-baseline justify-between gap-2">
            <span class="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <MdiIcon name="mdi-map-marker-check-outline" size="xs" />
                Emplacements
                <span v-if="modeLabel" class="rounded bg-slate-100 px-1 py-px text-[10px] font-medium normal-case tracking-normal text-slate-500 dark:bg-slate-700 dark:text-slate-300">{{ modeLabel }}</span>
            </span>
            <span class="text-xs font-bold tabular-nums" :class="complete ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'">
                {{ stat.pctTermines }}%
            </span>
        </div>

        <div
            class="mt-1 flex w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
            :class="compact ? 'h-1.5' : 'h-2'"
            role="progressbar"
            :aria-valuenow="Math.round(stat.pctTermines)"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="ariaLabel">
            <div class="h-full bg-sky-500 transition-[width] duration-500 ease-out" :style="{ width: Math.min(100, stat.pctTermines) + '%' }" />
        </div>

        <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
            <span class="inline-flex items-center gap-1">
                <span class="h-2 w-2 rounded-sm bg-sky-500" />
                <b class="text-slate-900 dark:text-white">{{ fmt(stat.termines) }}</b> terminé{{ stat.termines > 1 ? 's' : '' }}
            </span>
            <span class="inline-flex items-center gap-1">
                <span class="h-2 w-2 rounded-sm bg-slate-300 ring-1 ring-inset ring-slate-400/60 dark:bg-slate-600" />
                <b class="text-slate-900 dark:text-white">{{ fmt(stat.enAttente) }}</b> en attente
                <span class="text-slate-400">({{ stat.pctEnAttente }}%)</span>
            </span>
            <span class="ml-auto text-slate-400">sur {{ fmt(stat.total) }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MdiIcon from '@/components/MdiIcon.vue'
import type { LocationProgress } from '@/composables/monitoring/zoneProgress'

const props = withDefaults(defineProps<{ stat: LocationProgress; compact?: boolean }>(), { compact: false })

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)

const complete = computed(() => props.stat.total > 0 && props.stat.termines >= props.stat.total)

/** « par article » / « en vrac » : affiché tel que configuré sur le comptage */
const modeLabel = computed(() => props.stat.countMode?.trim() || '')

const ariaLabel = computed(
    () => `${props.stat.termines} emplacement(s) terminé(s) et ${props.stat.enAttente} en attente sur ${props.stat.total}`
)
const tooltip = computed(() => `${ariaLabel.value}${modeLabel.value ? ` — comptage ${modeLabel.value}` : ''}`)
</script>
