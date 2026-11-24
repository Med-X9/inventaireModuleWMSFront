<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMonitoring } from '@/composables/useMonitoring'
import {
    buildMonitoringViewModel,
    countingLabel,
    filterAndSortZones,
    type ZoneSort,
    type ZoneState,
    type ZoneProgress,
} from '@/composables/monitoring/zoneProgress'
import MdiIcon from '@/components/MdiIcon.vue'
import MonitoringLocationStat from '@/components/MonitoringLocationStat.vue'
import MonitoringProgressBar from '@/components/MonitoringProgressBar.vue'
import MonitoringZoneJobs from '@/components/MonitoringZoneJobs.vue'
import { MONITORING_CSS_VARS } from '@/constants/monitoringColors'

// ===== PROPS =====
interface Props {
    inventoryId?: number
    warehouseId?: number
}
const props = withDefaults(defineProps<Props>(), { inventoryId: undefined, warehouseId: undefined })

// ===== DONNÉES =====
const { loading, rawZones, rawGlobal, lastUpdatedAt, loadError, autoRefreshEnabled, refreshIntervalMs, chargerDonnees, toggleAutoRefresh } =
    useMonitoring({ inventoryId: props.inventoryId, warehouseId: props.warehouseId })

const vm = computed(() => buildMonitoringViewModel(rawZones.value, rawGlobal.value))
const hasData = computed(() => rawZones.value !== null)
const zoneCount = computed(() => vm.value.zones.length)

// ===== FILTRES / TRI / VUE =====
const search = ref('')
const stateFilter = ref<ZoneState | 'toutes'>('toutes')
const sort = ref<ZoneSort>('nom')

const VIEW_KEY = 'monitoring.view'
const readView = (): 'auto' | 'cartes' | 'tableau' => {
    try {
        const v = localStorage.getItem(VIEW_KEY)
        return v === 'cartes' || v === 'tableau' ? v : 'auto'
    } catch {
        return 'auto'
    }
}
const viewChoice = ref<'auto' | 'cartes' | 'tableau'>(readView())
watch(viewChoice, (v) => {
    try {
        localStorage.setItem(VIEW_KEY, v)
    } catch {
        /* stockage indisponible : préférence non mémorisée */
    }
})
/** Vue automatique : cartes jusqu'à 8 zones, tableau au-delà (lisible quel que soit le nombre de zones) */
const view = computed(() => (viewChoice.value === 'auto' ? (zoneCount.value > 8 ? 'tableau' : 'cartes') : viewChoice.value))

const visibleZones = computed(() =>
    filterAndSortZones(vm.value.zones, { search: search.value, state: stateFilter.value, sort: sort.value })
)

const stateCounts = computed(() => {
    const c = { toutes: zoneCount.value, en_cours: 0, non_demarre: 0, termine: 0 }
    vm.value.zones.forEach((z) => c[z.state]++)
    return c
})

const STATE_META: Record<ZoneState, { label: string; dot: string; badge: string }> = {
    en_cours: { label: 'En cours', dot: 'bg-[var(--m-progress)]', badge: 'bg-[var(--m-progress)]/10 text-amber-700 ring-[var(--m-progress)]/40 dark:text-amber-300' },
    non_demarre: { label: 'Non démarrée', dot: 'bg-[var(--m-wait)]', badge: 'bg-[var(--m-wait)]/15 text-slate-600 ring-[var(--m-wait)]/50 dark:text-slate-300' },
    termine: { label: 'Terminée', dot: 'bg-[var(--m-done)]', badge: 'bg-[var(--m-done)]/10 text-emerald-700 ring-[var(--m-done)]/40 dark:text-emerald-300' },
}
const FILTERS: Array<{ key: ZoneState | 'toutes'; label: string }> = [
    { key: 'toutes', label: 'Toutes' },
    { key: 'en_cours', label: 'En cours' },
    { key: 'non_demarre', label: 'Non démarrées' },
    { key: 'termine', label: 'Terminées' },
]

const toggleSortColumn = (asc: ZoneSort, desc: ZoneSort) => {
    sort.value = sort.value === asc ? desc : asc
}
const sortIcon = (asc: ZoneSort, desc: ZoneSort) =>
    sort.value === asc ? 'mdi-arrow-up' : sort.value === desc ? 'mdi-arrow-down' : 'mdi-unfold-more-horizontal'

const expandedZones = ref<Set<number>>(new Set())
const toggleZone = (id: number) => {
    const next = new Set(expandedZones.value)
    if (!next.delete(id)) next.add(id)
    expandedZones.value = next
}

const resetFilters = () => {
    search.value = ''
    stateFilter.value = 'toutes'
}

// ===== FORMATAGE =====
const nf = new Intl.NumberFormat('fr-FR')
const fmt = (n: number) => nf.format(n || 0)
const lastUpdatedLabel = computed(() =>
    lastUpdatedAt.value ? lastUpdatedAt.value.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'
)
const refreshMinutes = computed(() => Math.round(refreshIntervalMs.value / 60000))
const zoneSubtitle = (z: ZoneProgress) => `${fmt(z.jobs)} job${z.jobs > 1 ? 's' : ''} · ${fmt(z.emplacements)} empl.`
</script>

<template>
    <div class="h-full min-h-0 flex flex-col bg-slate-100 dark:bg-slate-900" :style="MONITORING_CSS_VARS">
        <!-- ===== Barre d'outils ===== -->
        <div class="flex-shrink-0 border-b border-slate-200 bg-white/90 px-3 py-2.5 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 sm:px-4">
            <div class="flex flex-wrap items-center gap-2">
                <label class="relative min-w-[11rem] flex-1 sm:max-w-xs">
                    <span class="sr-only">Rechercher une zone</span>
                    <MdiIcon name="mdi-magnify" size="sm" class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        v-model="search"
                        type="search"
                        placeholder="Rechercher une zone…"
                        class="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" />
                </label>

                <div class="flex flex-wrap gap-1" role="group" aria-label="Filtrer par état">
                    <button
                        v-for="f in FILTERS"
                        :key="f.key"
                        type="button"
                        :aria-pressed="stateFilter === f.key"
                        class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
                        :class="stateFilter === f.key
                            ? 'bg-slate-900 text-white ring-slate-900 dark:bg-white dark:text-slate-900 dark:ring-white'
                            : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600'"
                        @click="stateFilter = f.key">
                        <span v-if="f.key !== 'toutes'" class="h-1.5 w-1.5 rounded-full" :class="STATE_META[f.key as ZoneState].dot" />
                        {{ f.label }}
                        <span class="tabular-nums opacity-70">{{ stateCounts[f.key] }}</span>
                    </button>
                </div>

                <div class="ml-auto flex flex-wrap items-center gap-2">
                    <label class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span class="hidden sm:inline">Trier</span>
                        <select
                            v-model="sort"
                            class="rounded-lg border border-slate-200 bg-white py-1.5 pl-2 pr-7 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                            <option value="nom">Nom</option>
                            <option value="avancement_asc">Moins avancées</option>
                            <option value="avancement_desc">Plus avancées</option>
                            <option value="jobs_desc">Plus de jobs</option>
                        </select>
                    </label>

                    <div class="inline-flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800" role="group" aria-label="Mode d'affichage">
                        <button
                            v-for="opt in [{ k: 'cartes', icon: 'mdi-view-grid-outline', label: 'Cartes' }, { k: 'tableau', icon: 'mdi-table', label: 'Tableau' }]"
                            :key="opt.k"
                            type="button"
                            :title="opt.label"
                            :aria-pressed="view === opt.k"
                            class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
                            :class="view === opt.k ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'"
                            @click="viewChoice = opt.k as 'cartes' | 'tableau'">
                            <MdiIcon :name="opt.icon" size="sm" />
                            <span class="hidden md:inline">{{ opt.label }}</span>
                        </button>
                    </div>

                    <div class="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-1 py-0.5 dark:border-slate-600 dark:bg-slate-800">
                        <span class="hidden px-1 text-[11px] tabular-nums text-slate-500 lg:inline dark:text-slate-400" aria-live="polite">
                            Mis à jour {{ lastUpdatedLabel }}
                        </span>
                        <button
                            type="button"
                            title="Rafraîchir maintenant"
                            :disabled="loading"
                            class="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:hover:bg-slate-700 dark:hover:text-white"
                            @click="chargerDonnees">
                            <MdiIcon name="mdi-refresh" size="sm" :class="{ 'animate-spin': loading }" />
                        </button>
                        <button
                            type="button"
                            :title="autoRefreshEnabled ? `Rafraîchissement auto toutes les ${refreshMinutes} min (cliquer pour arrêter)` : 'Rafraîchissement auto arrêté (cliquer pour activer)'"
                            :aria-pressed="autoRefreshEnabled"
                            class="flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                            :class="autoRefreshEnabled ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'"
                            @click="toggleAutoRefresh">
                            <span class="h-2 w-2 rounded-full" :class="autoRefreshEnabled ? 'animate-pulse bg-emerald-500' : 'bg-slate-400'" />
                            Auto
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto">
            <div class="mx-auto max-w-[1920px] space-y-4 p-3 sm:p-4">
                <!-- Erreur de rafraîchissement (les dernières données restent affichées) -->
                <div v-if="loadError" role="alert" class="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                    <MdiIcon name="mdi-alert-circle-outline" size="sm" />
                    {{ loadError }}
                    <button type="button" class="ml-auto font-semibold underline-offset-2 hover:underline" @click="chargerDonnees">Réessayer</button>
                </div>

                <!-- ===== Chargement initial ===== -->
                <div v-if="!hasData && loading" class="space-y-4" aria-busy="true">
                    <div class="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr))]">
                        <div v-for="i in 4" :key="i" class="h-24 animate-pulse rounded-xl bg-white dark:bg-slate-800" />
                    </div>
                    <div class="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
                        <div v-for="i in 6" :key="i" class="h-44 animate-pulse rounded-xl bg-white dark:bg-slate-800" />
                    </div>
                </div>

                <template v-else-if="hasData">
                    <!-- ===== Indicateurs globaux (compacts) ===== -->
                    <section aria-label="Indicateurs globaux" class="flex flex-wrap items-stretch gap-2">
                        <div v-for="kpi in [
                            { label: 'Zones', value: zoneCount, icon: 'mdi-map-marker-radius-outline', color: 'var(--m-wait)' },
                            { label: 'Jobs', value: vm.totals.jobs, icon: 'mdi-package-variant-closed', color: 'var(--m-done)' },
                            { label: 'Emplacements', value: vm.totals.emplacements, icon: 'mdi-grid', color: 'var(--m-loc)' },
                            { label: 'Équipes', value: vm.totals.equipes, icon: 'mdi-account-group-outline', color: 'var(--m-team)' },
                        ]" :key="kpi.label"
                            class="inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white py-1 pl-1.5 pr-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                            <span class="flex h-6 w-6 items-center justify-center rounded-md text-slate-800" :style="{ backgroundColor: `color-mix(in srgb, ${kpi.color} 35%, transparent)` }">
                                <MdiIcon :name="kpi.icon" size="xs" />
                            </span>
                            <span class="text-base font-bold tabular-nums leading-none text-slate-900 dark:text-white">{{ fmt(kpi.value) }}</span>
                            <span class="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{{ kpi.label }}</span>
                        </div>

                        <div v-for="c in vm.totals.countings" :key="`kpi-c${c.order}`"
                            class="min-w-[210px] flex-1 rounded-lg border border-slate-200/80 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                            <div class="flex items-baseline justify-between gap-2">
                                <div class="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{{ countingLabel(c.order) }}</div>
                                <div class="text-base font-bold tabular-nums text-slate-900 dark:text-white">{{ c.pctTermine }}%</div>
                            </div>
                            <MonitoringProgressBar :progress="c" size="sm" class="mt-1" />
                            <div class="mt-1 text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                                {{ fmt(c.termine) }}/{{ fmt(c.total) }} jobs
                            </div>
                            <MonitoringLocationStat v-if="c.emplacements" :stat="c.emplacements" compact class="mt-1.5 border-t border-slate-100 pt-1.5 dark:border-slate-700" />
                        </div>
                    </section>

                    <!-- ===== Légende ===== -->
                    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400" aria-label="Légende">
                        <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-[var(--m-done)]" />Terminé</span>
                        <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-[var(--m-progress)]" />En cours</span>
                        <span class="inline-flex items-center gap-1.5" title="Barre « Emplacements » : emplacements dont la saisie a été envoyée"><span class="h-2.5 w-2.5 rounded-sm bg-[var(--m-loc)]" />Emplacement terminé</span>
                        <span class="inline-flex items-center gap-1.5" title="En attente, affecté, prêt ou transféré au PDA sans être entamé"><span class="h-2.5 w-2.5 rounded-sm bg-[var(--m-wait)]/40 ring-1 ring-inset ring-[var(--m-wait)]" />Non lancé (y compris transféré au PDA)</span>
                        <span class="ml-auto tabular-nums">{{ visibleZones.length }} / {{ zoneCount }} zone{{ zoneCount > 1 ? 's' : '' }}</span>
                    </div>

                    <!-- ===== Aucun résultat ===== -->
                    <div v-if="visibleZones.length === 0" class="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-600 dark:bg-slate-800">
                        <MdiIcon name="mdi-map-search-outline" size="lg" class="text-slate-400" />
                        <p class="mt-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                            {{ zoneCount === 0 ? 'Aucune zone avec des jobs pour ce magasin.' : 'Aucune zone ne correspond aux filtres.' }}
                        </p>
                        <button v-if="zoneCount > 0" type="button" class="mt-3 text-sm font-semibold text-primary hover:underline" @click="resetFilters">
                            Réinitialiser les filtres
                        </button>
                    </div>

                    <!-- ===== Vue cartes (grille fluide : 1 à N zones) ===== -->
                    <section v-else-if="view === 'cartes'" aria-label="Zones" class="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
                        <article v-for="z in visibleZones" :key="z.id"
                            class="flex flex-col rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
                            <header class="flex items-start justify-between gap-2">
                                <div class="min-w-0">
                                    <h3 class="truncate text-base font-semibold text-slate-900 dark:text-white" :title="z.name">{{ z.name }}</h3>
                                    <p class="text-xs text-slate-500 dark:text-slate-400">{{ zoneSubtitle(z) }}</p>
                                </div>
                                <span class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1" :class="STATE_META[z.state].badge">
                                    <span class="h-1.5 w-1.5 rounded-full" :class="STATE_META[z.state].dot" />
                                    {{ STATE_META[z.state].label }}
                                </span>
                            </header>

                            <div class="mt-3 space-y-2.5">
                                <div v-for="c in z.countings" :key="c.order">
                                    <div class="mb-1 flex items-baseline justify-between text-xs">
                                        <span class="font-medium text-slate-600 dark:text-slate-300">{{ countingLabel(c.order) }}</span>
                                        <span class="tabular-nums text-slate-500 dark:text-slate-400">
                                            <b class="text-slate-900 dark:text-white">{{ c.pctTermine }}%</b> · {{ c.termine }}/{{ c.total }}
                                        </span>
                                    </div>
                                    <MonitoringProgressBar :progress="c" size="md" />
                                    <div class="mt-1 flex flex-wrap gap-x-3 text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                                        <span v-if="c.entame">{{ c.entame }} en cours</span>
                                        <span v-if="c.nonLance">{{ c.nonLance }} non lancé{{ c.nonLance > 1 ? 's' : '' }}</span>
                                    </div>
                                    <MonitoringLocationStat v-if="c.emplacements" :stat="c.emplacements" compact class="mt-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-900/40" />
                                </div>
                                <p v-if="z.countings.length === 0" class="text-xs text-slate-400">Aucun comptage configuré.</p>
                            </div>

                            <details class="group/jobs mt-3 border-t border-slate-100 pt-2 dark:border-slate-700">
                                <summary class="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                                    <MdiIcon name="mdi-chevron-right" size="xs" class="transition-transform group-open/jobs:rotate-90" />
                                    Jobs et équipes
                                    <span class="ml-auto inline-flex items-center gap-1 rounded-full bg-[var(--m-team)]/25 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-slate-800 dark:text-slate-100">
                                        <MdiIcon name="mdi-account-group-outline" size="xs" />{{ z.equipes }}
                                    </span>
                                </summary>
                                <MonitoringZoneJobs :jobs="z.jobsDetail" class="mt-1" />
                            </details>
                        </article>
                    </section>

                    <!-- ===== Vue tableau (adaptée aux nombreuses zones) ===== -->
                    <section v-else aria-label="Zones" class="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                        <div class="max-h-[70vh] overflow-auto">
                            <table class="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
                                <thead class="sticky top-0 z-10 bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                                    <tr>
                                        <th scope="col" class="sticky left-0 z-20 border-b border-slate-200 bg-slate-50 px-4 py-2.5 font-semibold dark:border-slate-700 dark:bg-slate-900">
                                            <button type="button" class="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white" @click="sort = 'nom'">
                                                Zone <MdiIcon v-if="sort === 'nom'" name="mdi-arrow-up" size="xs" />
                                            </button>
                                        </th>
                                        <th scope="col" class="border-b border-slate-200 px-3 py-2.5 text-right font-semibold dark:border-slate-700">
                                            <button type="button" class="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white" @click="sort = 'jobs_desc'">
                                                Jobs <MdiIcon v-if="sort === 'jobs_desc'" name="mdi-arrow-down" size="xs" />
                                            </button>
                                        </th>
                                        <th scope="col" class="hidden border-b border-slate-200 px-3 py-2.5 text-right font-semibold sm:table-cell dark:border-slate-700">Empl.</th>
                                        <th scope="col" class="border-b border-slate-200 px-3 py-2.5 text-right font-semibold dark:border-slate-700">Équipes</th>
                                        <th v-for="o in vm.countingOrders" :key="`h${o}`" scope="col" class="min-w-[180px] border-b border-slate-200 px-3 py-2.5 font-semibold dark:border-slate-700">
                                            <button type="button" class="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white" @click="toggleSortColumn('avancement_asc', 'avancement_desc')">
                                                {{ countingLabel(o) }} <MdiIcon :name="sortIcon('avancement_asc', 'avancement_desc')" size="xs" />
                                            </button>
                                        </th>
                                        <th scope="col" class="border-b border-slate-200 px-3 py-2.5 font-semibold dark:border-slate-700">État</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <template v-for="z in visibleZones" :key="z.id">
                                    <tr class="group">
                                        <th scope="row" class="sticky left-0 border-b border-slate-100 bg-white px-4 py-2.5 text-left font-medium text-slate-900 group-hover:bg-slate-50 dark:border-slate-700/60 dark:bg-slate-800 dark:text-white dark:group-hover:bg-slate-700/40">
                                            <button type="button" class="flex max-w-[14rem] items-center gap-1 text-left" :aria-expanded="expandedZones.has(z.id)" title="Afficher les jobs et équipes" @click="toggleZone(z.id)">
                                                <MdiIcon name="mdi-chevron-right" size="xs" class="shrink-0 transition-transform" :class="{ 'rotate-90': expandedZones.has(z.id) }" />
                                                <span class="truncate">{{ z.name }}</span>
                                            </button>
                                        </th>
                                        <td class="border-b border-slate-100 px-3 py-2.5 text-right tabular-nums text-slate-700 group-hover:bg-slate-50 dark:border-slate-700/60 dark:text-slate-200 dark:group-hover:bg-slate-700/40">{{ fmt(z.jobs) }}</td>
                                        <td class="hidden border-b border-slate-100 px-3 py-2.5 text-right tabular-nums text-slate-500 group-hover:bg-slate-50 sm:table-cell dark:border-slate-700/60 dark:text-slate-400 dark:group-hover:bg-slate-700/40">{{ fmt(z.emplacements) }}</td>
                                        <td class="border-b border-slate-100 px-3 py-2.5 text-right group-hover:bg-slate-50 dark:border-slate-700/60 dark:group-hover:bg-slate-700/40">
                                            <span class="inline-flex items-center gap-1 rounded-full bg-[var(--m-team)]/25 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-100"><MdiIcon name="mdi-account-group-outline" size="xs" />{{ z.equipes }}</span>
                                        </td>
                                        <td v-for="c in z.countings" :key="c.order" class="border-b border-slate-100 px-3 py-2.5 group-hover:bg-slate-50 dark:border-slate-700/60 dark:group-hover:bg-slate-700/40">
                                            <div class="flex items-center gap-2">
                                                <MonitoringProgressBar :progress="c" size="sm" class="flex-1" />
                                                <span class="w-10 text-right text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">{{ c.pctTermine }}%</span>
                                            </div>
                                            <div class="mt-0.5 text-[11px] tabular-nums text-slate-400">{{ c.termine }}/{{ c.total }}<template v-if="c.entame"> · {{ c.entame }} en cours</template></div>
                                            <MonitoringLocationStat v-if="c.emplacements" :stat="c.emplacements" compact class="mt-1.5" />
                                        </td>
                                        <td class="border-b border-slate-100 px-3 py-2.5 group-hover:bg-slate-50 dark:border-slate-700/60 dark:group-hover:bg-slate-700/40">
                                            <span class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1" :class="STATE_META[z.state].badge">
                                                <span class="h-1.5 w-1.5 rounded-full" :class="STATE_META[z.state].dot" />{{ STATE_META[z.state].label }}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr v-if="expandedZones.has(z.id)">
                                        <td :colspan="vm.countingOrders.length + 5" class="border-b border-slate-100 bg-slate-50/60 px-4 py-2 dark:border-slate-700/60 dark:bg-slate-900/40">
                                            <MonitoringZoneJobs :jobs="z.jobsDetail" />
                                        </td>
                                    </tr>
                                    </template>
                                </tbody>
                                <tfoot class="sticky bottom-0 bg-slate-50 font-semibold dark:bg-slate-900">
                                    <tr>
                                        <th scope="row" class="sticky left-0 border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white">Total</th>
                                        <td class="border-t border-slate-200 px-3 py-2.5 text-right tabular-nums dark:border-slate-700 dark:text-white">{{ fmt(vm.totals.jobs) }}</td>
                                        <td class="hidden border-t border-slate-200 px-3 py-2.5 text-right tabular-nums sm:table-cell dark:border-slate-700 dark:text-slate-300">{{ fmt(vm.totals.emplacements) }}</td>
                                        <td class="border-t border-slate-200 px-3 py-2.5 text-right tabular-nums dark:border-slate-700 dark:text-white">{{ fmt(vm.totals.equipes) }}</td>
                                        <td v-for="c in vm.totals.countings" :key="`t${c.order}`" class="border-t border-slate-200 px-3 py-2.5 dark:border-slate-700">
                                            <div class="flex items-center gap-2">
                                                <MonitoringProgressBar :progress="c" size="sm" class="flex-1" />
                                                <span class="w-10 text-right text-xs tabular-nums text-slate-900 dark:text-white">{{ c.pctTermine }}%</span>
                                            </div>
                                        </td>
                                        <td class="border-t border-slate-200 dark:border-slate-700" />
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </section>
                </template>
            </div>
        </div>
    </div>
</template>
