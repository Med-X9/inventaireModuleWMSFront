<script setup lang="ts">
import { computed } from 'vue'
import { useMonitoring, type ZoneMonitoringData } from '@/composables/useMonitoring'
import MdiIcon from '@/components/MdiIcon.vue'

// ===== PROPS =====
/**
 * Props pour le monitoring dashboard
 */
interface Props {
    inventoryId?: number
    warehouseId?: number
}

const props = withDefaults(defineProps<Props>(), {
    inventoryId: undefined,
    warehouseId: undefined
})

// ===== COMPOSABLE =====
const {
    loading,
    monitoringData,
    autoRefreshEnabled,
    chargerDonnees,
    toggleAutoRefresh
} = useMonitoring({
    inventoryId: props.inventoryId,
    warehouseId: props.warehouseId
})

// Classes CSS pour les LEDs selon le statut (taille augmentée quand peu de zones)
const getLedClass = (status: string, large = false) => {
    const size = large ? 'w-3 h-3 sm:w-3.5 sm:h-3.5' : 'w-2 h-2'
    const baseClass = `${size} rounded-full inline-block shrink-0`
    switch (status) {
        case 'success':
            return `${baseClass} bg-emerald-500`
        case 'warning':
            return `${baseClass} bg-[#FECD1C]`
        case 'danger':
            return `${baseClass} bg-red-500`
        case 'info':
            return `${baseClass} bg-blue-500`
        default:
            return `${baseClass} bg-slate-400`
    }
}

// Formatage des pourcentages
const formatPourcentage = (value: any) => {
    if (value === undefined || value === null || isNaN(value)) {
        return '0%'
    }
    return `${Number(value)}%`
}

// Formatage des nombres
const formatNombre = (value: any) => {
    if (value === undefined || value === null || isNaN(value)) {
        return '0'
    }
    return Number(value).toString()
}

/** Nombre de zones affichées */
const zoneCount = computed(() => monitoringData.value?.zones?.length ?? 0)

/**
 * Peu de zones : agrandir les cartes et remplir la hauteur disponible (évite la « moitié d’écran vide »).
 * Beaucoup de zones : mosaïque compacte avec défilement.
 */
/** Seuil : au-delà, mosaïque compacte + scroll pour exploiter l’écran sans tuiles géantes */
const zonesSparse = computed(() => zoneCount.value >= 1 && zoneCount.value <= 8)

/** Classes grille zones selon la densité */
const zonesMosaicClass = computed(() => {
    const n = zoneCount.value
    const sparse = 'zones-mosaic zones-mosaic--sparse grid min-h-0'

    if (!zonesSparse.value) {
        return (
            'zones-mosaic grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ' +
            'min-[1800px]:grid-cols-5 auto-rows-min overflow-y-auto pb-1'
        )
    }

    if (n === 1) {
        return `${sparse} h-full gap-4 grid-cols-1 grid-rows-1 auto-rows-[minmax(0,1fr)]`
    }
    if (n === 2) {
        return `${sparse} h-full gap-4 grid-cols-1 md:grid-cols-2 md:grid-rows-1 auto-rows-[minmax(0,1fr)]`
    }
    if (n === 3) {
        return `${sparse} h-full gap-4 grid-cols-1 lg:grid-cols-3 auto-rows-[minmax(0,1fr)]`
    }
    if (n === 4) {
        return `${sparse} h-full gap-3 grid-cols-1 sm:grid-cols-2 grid-rows-2 auto-rows-[minmax(0,1fr)]`
    }
    /* 5–8 zones */
    return `${sparse} h-full gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[minmax(10rem,1fr)]`
})

/** Typo / espacements : mode sparse = contenu des cartes agrandi (pas seulement la boîte) */
const zoneUi = computed(() => {
    const s = zonesSparse.value
    return {
        card: s ? 'p-3 sm:p-4 md:p-5 rounded-xl' : 'p-1 rounded-lg',
        header: s ? 'gap-2 mb-3 pb-3 border-b border-slate-200 dark:border-gray-700' : 'gap-1 mb-1 pb-1 border-b border-slate-200 dark:border-gray-700',
        title: s ? 'text-sm sm:text-base md:text-lg font-bold leading-snug px-1' : 'text-xs font-semibold',
        stack: s ? 'gap-3' : 'gap-0.5',
        panel: s ? 'rounded-xl p-3 sm:p-4 shadow-md' : 'rounded-lg p-0.5',
        jobRow: s ? 'gap-2 sm:gap-3 flex-wrap justify-center items-center' : 'gap-1',
        panelTitle: s ? 'text-xs sm:text-sm font-bold mb-2 text-center tracking-tight' : 'text-[10px] mb-0.5 text-center font-semibold',
        triple: s ? 'gap-2 sm:gap-3 flex-wrap sm:flex-nowrap justify-center' : 'gap-0.5',
        cell: s ? 'rounded-lg p-2 sm:p-2.5 flex-1 min-w-[min(100%,7.5rem)] shadow-sm' : 'rounded p-0.5 flex-1 shadow-sm',
        cellInner: s ? 'gap-1.5 sm:gap-2 justify-center items-center flex-wrap' : 'gap-1',
        icon: s ? 'w-4 h-4 sm:w-5 sm:h-5 shrink-0' : 'w-3 h-3',
        lbl: s ? 'text-xs sm:text-sm font-medium' : 'text-[10px] font-medium',
        num: s ? 'text-base sm:text-lg md:text-xl font-bold tabular-nums' : 'text-sm font-bold',
        pct: s ? 'text-xs sm:text-sm font-medium tabular-nums' : 'text-[10px] font-medium',
        jobLbl: s ? 'text-xs sm:text-sm font-medium' : 'text-[10px]',
        jobNum: s ? 'text-lg sm:text-xl md:text-2xl font-bold tabular-nums' : 'text-sm font-bold'
    }
})

/** KPI globaux du haut : même logique d’échelle quand peu de zones */
const globalKpiUi = computed(() => {
    const s = zonesSparse.value
    return {
        grid: s ? 'gap-2 md:gap-3' : 'gap-1',
        card: s ? 'rounded-xl p-2 sm:p-3 md:p-4 shadow-md' : 'rounded-lg p-1 shadow-sm',
        icon: s ? 'w-5 h-5 sm:w-6 sm:h-6 shrink-0' : 'w-4 h-4',
        label: s ? 'text-xs sm:text-sm font-medium' : 'text-xs',
        value: s ? 'text-xl sm:text-2xl md:text-3xl font-bold tabular-nums leading-none' : 'text-xl font-bold',
        pct: s ? 'text-xs sm:text-sm font-semibold' : 'text-xs font-medium'
    }
})
</script>

<template>
    <div class="h-full min-h-0 flex flex-col bg-slate-500 dark:bg-slate-800 overflow-hidden">
        <!-- En-tête minimaliste -->
        <div
            class="flex-shrink-0 flex justify-end items-center px-4 py-2 bg-white dark:bg-[#1b2e4b] border-b border-slate-200 dark:border-gray-700 z-10">
            <div class="flex gap-2">
                <button @click="chargerDonnees" :disabled="loading"
                    class="w-7 h-7 flex items-center justify-center text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all disabled:opacity-40 rounded hover:bg-slate-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50">
                    <span class="text-sm" :class="{ 'animate-spin': loading }">↻</span>
                </button>
                <button @click="toggleAutoRefresh" :class="[
                    'w-7 h-7 flex items-center justify-center rounded transition-all focus:outline-none focus:ring-2 focus:ring-primary/50',
                    autoRefreshEnabled
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700'
                ]">
                    <span class="w-1.5 h-1.5 rounded-full"
                        :class="autoRefreshEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'"></span>
                </button>
            </div>
        </div>

        <!-- Contenu : scroll global si mosaïque dense ; sinon zones étirées (peu de cartes) sans bande vide -->
        <div
            class="flex-1 flex flex-col min-h-0 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent hover:scrollbar-thumb-slate-400 dark:hover:scrollbar-thumb-slate-500"
            :class="monitoringData && zonesSparse ? 'overflow-hidden' : 'overflow-y-auto'"
        >

            <!-- Skeleton loading -->
            <div v-if="loading && !monitoringData" class="monitoring-container bg-slate-500 dark:bg-slate-800 p-1">
                <div class="flex flex-col gap-1">
                    <!-- Skeleton métriques globales -->
                    <div class="grid grid-cols-4 gap-1">
                        <div v-for="i in 4" :key="`metric-${i}`"
                            class="bg-white dark:bg-[#1b2e4b] rounded-lg p-1 shadow-sm">
                            <div class="flex items-center justify-center gap-1">
                                <div class="w-4 h-4 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                                <div class="h-3 w-16 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                                <div class="h-6 w-12 bg-slate-300 dark:bg-slate-700 rounded animate-pulse"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Skeleton zones en grille -->
                    <div class="grid grid-cols-3 grid-rows-3 gap-1">
                        <div v-for="i in 9" :key="`zone-${i}`"
                            class="bg-white dark:bg-[#1b2e4b] rounded-lg border border-slate-200/60 dark:border-gray-700 p-1 shadow-sm">
                            <!-- Skeleton en-tête zone -->
                            <div
                                class="flex items-center justify-between gap-1 mb-1 pb-1 border-b border-slate-200 dark:border-gray-700">
                                <div class="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse"></div>
                                <div class="flex-1 text-center">
                                    <div class="h-3 w-20 bg-slate-200 dark:bg-slate-600 rounded animate-pulse mx-auto">
                                    </div>
                                </div>
                            </div>

                            <!-- Skeleton métriques -->
                            <div class="flex flex-col gap-0.5">
                                <!-- JOB et Emplacements -->
                                <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-0.5">
                                    <div class="flex items-center justify-center gap-1">
                                        <div class="w-3 h-3 bg-slate-200 dark:bg-slate-600 rounded animate-pulse">
                                        </div>
                                        <div class="h-2 w-12 bg-slate-200 dark:bg-slate-600 rounded animate-pulse">
                                        </div>
                                        <div class="h-3 w-16 bg-slate-300 dark:bg-slate-700 rounded animate-pulse">
                                        </div>
                                    </div>
                                </div>

                                <!-- 1er comptage -->
                                <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-0.5">
                                    <div
                                        class="h-2 w-20 bg-slate-300 dark:bg-slate-700 rounded animate-pulse mx-auto mb-0.5">
                                    </div>
                                    <div class="flex gap-0.5">
                                        <div v-for="j in 3" :key="`count1-${j}`"
                                            class="flex-1 bg-white dark:bg-[#1b2e4b] rounded p-0.5 shadow-sm">
                                            <div class="flex items-center justify-center gap-1">
                                                <div
                                                    class="w-3 h-3 bg-slate-200 dark:bg-slate-600 rounded animate-pulse">
                                                </div>
                                                <div
                                                    class="h-2 w-10 bg-slate-200 dark:bg-slate-600 rounded animate-pulse">
                                                </div>
                                                <div
                                                    class="h-3 w-6 bg-slate-300 dark:bg-slate-700 rounded animate-pulse">
                                                </div>
                                                <div
                                                    class="h-2 w-8 bg-slate-200 dark:bg-slate-600 rounded animate-pulse">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- 2ème comptage -->
                                <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-0.5">
                                    <div
                                        class="h-2 w-20 bg-slate-300 dark:bg-slate-700 rounded animate-pulse mx-auto mb-0.5">
                                    </div>
                                    <div class="flex gap-0.5">
                                        <div v-for="j in 3" :key="`count2-${j}`"
                                            class="flex-1 bg-white dark:bg-[#1b2e4b] rounded p-0.5 shadow-sm">
                                            <div class="flex items-center justify-center gap-1">
                                                <div
                                                    class="w-3 h-3 bg-slate-200 dark:bg-slate-600 rounded animate-pulse">
                                                </div>
                                                <div
                                                    class="h-2 w-10 bg-slate-200 dark:bg-slate-600 rounded animate-pulse">
                                                </div>
                                                <div
                                                    class="h-3 w-6 bg-slate-300 dark:bg-slate-700 rounded animate-pulse">
                                                </div>
                                                <div
                                                    class="h-2 w-8 bg-slate-200 dark:bg-slate-600 rounded animate-pulse">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- 3ème comptage -->
                                <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-0.5">
                                    <div
                                        class="h-2 w-20 bg-slate-300 dark:bg-slate-700 rounded animate-pulse mx-auto mb-0.5">
                                    </div>
                                    <div
                                        class="flex items-center justify-center gap-1 bg-white dark:bg-[#1b2e4b] rounded p-0.5 shadow-sm">
                                        <div class="w-3 h-3 bg-slate-200 dark:bg-slate-600 rounded animate-pulse"></div>
                                        <div class="h-2 w-10 bg-slate-200 dark:bg-slate-600 rounded animate-pulse">
                                        </div>
                                        <div class="h-3 w-12 bg-slate-300 dark:bg-slate-700 rounded animate-pulse">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Dashboard -->
            <div
                v-else-if="monitoringData"
                class="monitoring-container bg-slate-500 dark:bg-slate-800 p-1 flex flex-col flex-1 min-h-0 gap-2"
            >
                <div class="flex flex-col gap-2 flex-1 min-h-0 min-w-0">
                    <!-- Métriques globales (taille augmentée si peu de zones) -->
                    <div class="flex-shrink-0 grid grid-cols-2 md:grid-cols-4" :class="globalKpiUi.grid">
                        <div
                            class="bg-white dark:bg-[#1b2e4b] hover:shadow-md transition-all duration-300 flex flex-col justify-center min-h-[3.25rem]"
                            :class="globalKpiUi.card">
                            <div class="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
                                <MdiIcon name="mdi-package-variant" :class="[globalKpiUi.icon, 'text-slate-500 dark:text-gray-400']" />
                                <span :class="[globalKpiUi.label, 'text-slate-500 dark:text-gray-400']">Total JOB</span>
                                <span :class="[globalKpiUi.value, 'text-slate-900 dark:text-white-light']">{{
                                    formatNombre(monitoringData.total.totalJobs) }}</span>
                            </div>
                        </div>
                        <div
                            class="bg-white dark:bg-[#1b2e4b] border border-emerald-200/60 dark:border-emerald-800/60 hover:shadow-md transition-all duration-300 flex flex-col justify-center min-h-[3.25rem]"
                            :class="globalKpiUi.card">
                            <div class="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
                                <MdiIcon name="mdi-check" :class="[globalKpiUi.icon, 'text-emerald-600 dark:text-emerald-400']" />
                                <span :class="[globalKpiUi.label, 'text-slate-500 dark:text-gray-400']">1er Clôturé</span>
                                <span :class="[globalKpiUi.value, 'text-emerald-600 dark:text-emerald-400']">{{
                                    formatNombre(monitoringData.total.premierComptage.cloture) }}</span>
                                <span :class="[globalKpiUi.pct, 'text-emerald-600 dark:text-emerald-400']">({{
                                    formatPourcentage(monitoringData.total.premierComptage.cloturePourcentage)
                                    }})</span>
                            </div>
                        </div>
                        <div
                            class="bg-white dark:bg-[#1b2e4b] border border-emerald-200/60 dark:border-emerald-800/60 hover:shadow-md transition-all duration-300 flex flex-col justify-center min-h-[3.25rem]"
                            :class="globalKpiUi.card">
                            <div class="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
                                <MdiIcon name="mdi-check" :class="[globalKpiUi.icon, 'text-emerald-600 dark:text-emerald-400']" />
                                <span :class="[globalKpiUi.label, 'text-slate-500 dark:text-gray-400']">2ème Clôturé</span>
                                <span :class="[globalKpiUi.value, 'text-emerald-600 dark:text-emerald-400']">{{
                                    formatNombre(monitoringData.total.deuxiemeComptage.cloture) }}</span>
                                <span :class="[globalKpiUi.pct, 'text-emerald-600 dark:text-emerald-400']">({{
                                    formatPourcentage(monitoringData.total.deuxiemeComptage.cloturePourcentage)
                                    }})</span>
                            </div>
                        </div>
                        <div
                            class="bg-white dark:bg-[#1b2e4b] border border-emerald-200/60 dark:border-emerald-800/60 hover:shadow-md transition-all duration-300 flex flex-col justify-center min-h-[3.25rem]"
                            :class="globalKpiUi.card">
                            <div class="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
                                <MdiIcon name="mdi-check" :class="[globalKpiUi.icon, 'text-emerald-600 dark:text-emerald-400']" />
                                <span :class="[globalKpiUi.label, 'text-slate-500 dark:text-gray-400']">3ème Terminé</span>
                                <span :class="[globalKpiUi.value, 'text-emerald-600 dark:text-emerald-400']">{{
                                    formatNombre(monitoringData.total.troisiemeComptage.termine) }}</span>
                                <span :class="[globalKpiUi.pct, 'text-emerald-600 dark:text-emerald-400']">({{
                                    formatPourcentage(monitoringData.total.troisiemeComptage.terminePourcentage)
                                    }})</span>
                            </div>
                        </div>
                    </div>

                    <!-- Zones : étirées si peu de cartes ; compactes + scroll si beaucoup -->
                    <div class="flex flex-1 flex-col min-h-0 min-w-0">
                        <div :class="[zonesMosaicClass, zonesSparse ? 'flex-1 min-h-0 w-full' : '']">
                        <div v-for="zone in monitoringData.zones" :key="zone.zoneId"
                            class="min-w-0 bg-white dark:bg-[#1b2e4b] border border-slate-200/60 dark:border-gray-700 transition-all duration-300"
                            :class="[
                                zoneUi.card,
                                zonesSparse
                                    ? 'h-full min-h-0 flex flex-col overflow-hidden shadow-lg hover:shadow-xl'
                                    : 'shadow-sm hover:shadow-lg'
                            ]">
                            <!-- En-tête zone -->
                            <div class="flex items-center justify-between" :class="zoneUi.header">
                                <span :class="[getLedClass(zone.statusLed, zonesSparse), 'animate-pulse']"></span>
                                <div class="flex-1 min-w-0 text-center px-1">
                                    <div :class="[zoneUi.title, 'text-slate-900 dark:text-white-light']">{{
                                        zone.zoneDescription }}</div>
                                </div>
                            </div>

                            <!-- Corps carte : typo plus grande si peu de zones -->
                            <div
                                class="flex flex-col"
                                :class="[zoneUi.stack, zonesSparse ? 'flex-1 min-h-0 overflow-y-auto overscroll-contain' : '']"
                            >
                                <!-- JOB -->
                                <div class="bg-slate-50 dark:bg-slate-700/50" :class="zoneUi.panel">
                                    <div :class="['flex items-center justify-center', zoneUi.jobRow]">
                                        <MdiIcon name="mdi-package-variant" :class="[zoneUi.icon, 'text-slate-500 dark:text-gray-400']" />
                                        <span :class="[zoneUi.jobLbl, 'text-slate-500 dark:text-gray-400']">JOB</span>
                                        <span :class="[zoneUi.jobNum, 'text-slate-900 dark:text-white-light']">
                                            {{ formatNombre(zone.totalJobs) }} ({{
                                            formatNombre(zone.totalEmplacements) }})
                                        </span>
                                    </div>
                                </div>

                                <!-- 1er comptage -->
                                <div class="bg-slate-50 dark:bg-slate-700/50" :class="zoneUi.panel">
                                    <div :class="[zoneUi.panelTitle, 'text-slate-600 dark:text-gray-300']">
                                        1er Comptage
                                    </div>
                                    <div :class="['flex', zoneUi.triple]">
                                        <div class="bg-white dark:bg-[#0e1726]" :class="zoneUi.cell">
                                            <div :class="['flex items-center', zoneUi.cellInner]">
                                                <MdiIcon name="mdi-clock-outline" :class="[zoneUi.icon, 'text-[#FECD1C]']" />
                                                <span :class="[zoneUi.lbl, 'text-[#FECD1C]']">Attente</span>
                                                <span :class="[zoneUi.num, 'text-[#FECD1C]']">{{
                                                    formatNombre(zone.premierComptage.nonEntame) }}</span>
                                                <span :class="[zoneUi.pct, 'text-[#FECD1C]']">{{
                                                    formatPourcentage(zone.premierComptage.nonEntamePourcentage)
                                                    }}</span>
                                            </div>
                                        </div>
                                        <div class="bg-white dark:bg-[#0e1726]" :class="zoneUi.cell">
                                            <div :class="['flex items-center', zoneUi.cellInner]">
                                                <MdiIcon name="mdi-play-outline" :class="[zoneUi.icon, 'text-primary']" />
                                                <span :class="[zoneUi.lbl, 'text-primary']">Entamé</span>
                                                <span :class="[zoneUi.num, 'text-primary']">{{
                                                    formatNombre(zone.premierComptage.enCours) }}</span>
                                                <span :class="[zoneUi.pct, 'text-primary']">{{
                                                    formatPourcentage(zone.premierComptage.enCoursPourcentage) }}</span>
                                            </div>
                                        </div>
                                        <div class="bg-white dark:bg-[#0e1726]" :class="zoneUi.cell">
                                            <div :class="['flex items-center', zoneUi.cellInner]">
                                                <MdiIcon name="mdi-check" :class="[zoneUi.icon, 'text-emerald-600 dark:text-emerald-400']" />
                                                <span :class="[zoneUi.lbl, 'text-emerald-600 dark:text-emerald-400']">Terminé</span>
                                                <span :class="[zoneUi.num, 'text-emerald-600 dark:text-emerald-400']">{{
                                                        formatNombre(zone.premierComptage.cloture) }}</span>
                                                <span :class="[zoneUi.pct, 'text-emerald-600 dark:text-emerald-400']">{{
                                                        formatPourcentage(zone.premierComptage.cloturePourcentage) }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- 2e comptage -->
                                <div class="bg-slate-50 dark:bg-slate-700/50" :class="zoneUi.panel">
                                    <div :class="[zoneUi.panelTitle, 'text-slate-600 dark:text-gray-300']">
                                        2ème Comptage
                                    </div>
                                    <div :class="['flex', zoneUi.triple]">
                                        <div class="bg-white dark:bg-[#0e1726]" :class="zoneUi.cell">
                                            <div :class="['flex items-center', zoneUi.cellInner]">
                                                <MdiIcon name="mdi-clock-outline" :class="[zoneUi.icon, 'text-[#FECD1C]']" />
                                                <span :class="[zoneUi.lbl, 'text-[#FECD1C]']">Attente</span>
                                                <span :class="[zoneUi.num, 'text-[#FECD1C]']">{{
                                                    formatNombre(zone.deuxiemeComptage.nonEntame) }}</span>
                                                <span :class="[zoneUi.pct, 'text-[#FECD1C]']">{{
                                                    formatPourcentage(zone.deuxiemeComptage.nonEntamePourcentage)
                                                    }}</span>
                                            </div>
                                        </div>
                                        <div class="bg-white dark:bg-[#0e1726]" :class="zoneUi.cell">
                                            <div :class="['flex items-center', zoneUi.cellInner]">
                                                <MdiIcon name="mdi-play-outline" :class="[zoneUi.icon, 'text-primary']" />
                                                <span :class="[zoneUi.lbl, 'text-primary']">Entamé</span>
                                                <span :class="[zoneUi.num, 'text-primary']">{{
                                                    formatNombre(zone.deuxiemeComptage.enCours) }}</span>
                                                <span :class="[zoneUi.pct, 'text-primary']">{{
                                                    formatPourcentage(zone.deuxiemeComptage.enCoursPourcentage)
                                                    }}</span>
                                            </div>
                                        </div>
                                        <div class="bg-white dark:bg-[#0e1726]" :class="zoneUi.cell">
                                            <div :class="['flex items-center', zoneUi.cellInner]">
                                                <MdiIcon name="mdi-check" :class="[zoneUi.icon, 'text-emerald-600 dark:text-emerald-400']" />
                                                <span :class="[zoneUi.lbl, 'text-emerald-600 dark:text-emerald-400']">Terminé</span>
                                                <span :class="[zoneUi.num, 'text-emerald-600 dark:text-emerald-400']">{{
                                                        formatNombre(zone.deuxiemeComptage.cloture) }}</span>
                                                <span :class="[zoneUi.pct, 'text-emerald-600 dark:text-emerald-400']">{{
                                                        formatPourcentage(zone.deuxiemeComptage.cloturePourcentage)
                                                    }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- 3e comptage -->
                                <div class="bg-slate-50 dark:bg-slate-700/50" :class="zoneUi.panel">
                                    <div :class="[zoneUi.panelTitle, 'text-slate-600 dark:text-gray-300']">
                                        3ème Comptage
                                    </div>
                                    <div :class="['flex', zoneUi.triple]">
                                        <div class="bg-white dark:bg-[#0e1726]" :class="zoneUi.cell">
                                            <div :class="['flex items-center', zoneUi.cellInner]">
                                                <MdiIcon name="mdi-clock-outline" :class="[zoneUi.icon, 'text-[#FECD1C]']" />
                                                <span :class="[zoneUi.lbl, 'text-[#FECD1C]']">Attente</span>
                                                <span :class="[zoneUi.num, 'text-[#FECD1C]']">{{
                                                    formatNombre(zone.troisiemeComptage.nonEntame) }}</span>
                                                <span :class="[zoneUi.pct, 'text-[#FECD1C]']">{{
                                                    formatPourcentage(zone.troisiemeComptage.nonEntamePourcentage)
                                                    }}</span>
                                            </div>
                                        </div>
                                        <div class="bg-white dark:bg-[#0e1726]" :class="zoneUi.cell">
                                            <div :class="['flex items-center', zoneUi.cellInner]">
                                                <MdiIcon name="mdi-play-outline" :class="[zoneUi.icon, 'text-primary']" />
                                                <span :class="[zoneUi.lbl, 'text-primary']">Entamé</span>
                                                <span :class="[zoneUi.num, 'text-primary']">{{
                                                    formatNombre(zone.troisiemeComptage.enCours) }}</span>
                                                <span :class="[zoneUi.pct, 'text-primary']">{{
                                                    formatPourcentage(zone.troisiemeComptage.enCoursPourcentage)
                                                    }}</span>
                                            </div>
                                        </div>
                                        <div class="bg-white dark:bg-[#0e1726]" :class="zoneUi.cell">
                                            <div :class="['flex items-center', zoneUi.cellInner]">
                                                <MdiIcon name="mdi-check" :class="[zoneUi.icon, 'text-emerald-600 dark:text-emerald-400']" />
                                                <span :class="[zoneUi.lbl, 'text-emerald-600 dark:text-emerald-400']">Terminé</span>
                                                <span :class="[zoneUi.num, 'text-emerald-600 dark:text-emerald-400']">{{
                                                        formatNombre(zone.troisiemeComptage.termine) }}</span>
                                                <span :class="[zoneUi.pct, 'text-emerald-600 dark:text-emerald-400']">{{
                                                        formatPourcentage(zone.troisiemeComptage.terminePourcentage)
                                                    }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
            </div>

            <!-- État vide -->
            <div v-else class="flex items-center justify-center bg-white dark:bg-[#1b2e4b] py-8">
                <div class="text-center">
                    <button @click="chargerDonnees"
                        class="w-8 h-8 flex items-center justify-center text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-all rounded hover:bg-slate-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50">
                        ↻
                    </button>
                </div>
            </div>

        </div> <!-- Fin du contenu scrollable -->
    </div>
</template>

<style scoped>
/* Animation pulse subtile pour les LEDs */
@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}

.animate-pulse {
    animation: pulse 2s ease-in-out infinite;
}

/* Animation shimmer pour le skeleton loading */
@keyframes shimmer {
    0% {
        background-position: -200% 0;
    }

    100% {
        background-position: 200% 0;
    }
}

/* Amélioration du skeleton avec animation shimmer */
.monitoring-container .bg-slate-200,
.monitoring-container .bg-slate-300 {
    background: linear-gradient(90deg, #e2e8f0 25%, #cbd5e1 50%, #e2e8f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
}

.dark .monitoring-container .bg-slate-200,
.dark .monitoring-container .bg-slate-300 {
    background: linear-gradient(90deg, #374151 25%, #4a5568 50%, #374151 75%);
    background-size: 200% 100%;
}

/* Styles pour la scrollbar personnalisée */
.scrollbar-thin {
    scrollbar-width: thin;
    scrollbar-color: rgb(148 163 184) transparent;
}

.scrollbar-thin::-webkit-scrollbar {
    width: 6px;
}

.scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: rgb(148 163 184);
    border-radius: 3px;
    border: none;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background-color: rgb(100 116 139);
}

.scrollbar-thin::-webkit-scrollbar-thumb:active {
    background-color: rgb(71 85 105);
}

.dark .scrollbar-thin {
    scrollbar-color: rgb(71 85 105) transparent;
}

.dark .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: rgb(71 85 105);
}

.dark .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background-color: rgb(51 65 85);
}

.dark .scrollbar-thin::-webkit-scrollbar-thumb:active {
    background-color: rgb(30 41 59);
}

/* Styles pour les boutons */
button {
    transition: all 0.2s ease-in-out;
}

button:focus {
    outline: none;
}

button:disabled {
    cursor: not-allowed;
}

/* Amélioration de l'animation de spin */
.animate-spin {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

/* Variables CSS pour adaptation responsive - Base (mobile/tablette) */
.monitoring-container {
    --monitoring-padding: 0.25rem;
    --monitoring-gap: 0.25rem;
    --monitoring-text-xs: 0.75rem;
    --monitoring-text-sm: 0.875rem;
    --monitoring-text-xl: 1.25rem;
    --monitoring-text-10: 0.625rem;
    --monitoring-icon-sm: 0.75rem;
    --monitoring-icon-md: 1rem;
    --monitoring-icon-led: 0.5rem;
    /* Variables pour le scroll */
    --scroll-behavior: smooth;
    --scroll-padding: 1rem;
}

/* Laptop (1366px - 1919px) */
@media screen and (min-width: 1366px) and (max-width: 1919px) {
    .monitoring-container {
        --monitoring-padding: 0.5rem;
        --monitoring-gap: 0.5rem;
        --monitoring-text-xs: 0.875rem;
        --monitoring-text-sm: 1rem;
        --monitoring-text-xl: 1.5rem;
        --monitoring-text-10: 0.75rem;
        --monitoring-icon-sm: 1rem;
        --monitoring-icon-md: 1.25rem;
        --monitoring-icon-led: 0.625rem;
    }

    /* Amélioration du scroll sur laptop */
    .scrollbar-thin::-webkit-scrollbar {
        width: 8px;
    }
}

/* Desktop (1920px - 2559px) */
@media screen and (min-width: 1920px) and (max-width: 2559px) {
    .monitoring-container {
        --monitoring-padding: 0.75rem;
        --monitoring-gap: 0.75rem;
        --monitoring-text-xs: 1rem;
        --monitoring-text-sm: 1.125rem;
        --monitoring-text-xl: 1.75rem;
        --monitoring-text-10: 0.875rem;
        --monitoring-icon-sm: 1.25rem;
        --monitoring-icon-md: 1.5rem;
        --monitoring-icon-led: 0.75rem;
    }

    /* Scroll amélioré sur desktop */
    .scrollbar-thin::-webkit-scrollbar {
        width: 10px;
    }

    .scrollbar-thin::-webkit-scrollbar-thumb {
        border-radius: 5px;
    }
}

/* Tableau interactif / 4K (2560px - 3839px) */
@media screen and (min-width: 2560px) and (max-width: 3839px) {
    .monitoring-container {
        --monitoring-padding: 1rem;
        --monitoring-gap: 1rem;
        --monitoring-text-xs: 1.125rem;
        --monitoring-text-sm: 1.25rem;
        --monitoring-text-xl: 2rem;
        --monitoring-text-10: 1rem;
        --monitoring-icon-sm: 1.5rem;
        --monitoring-icon-md: 2rem;
        --monitoring-icon-led: 1rem;
    }

    /* Scroll optimisé pour 4K */
    .scrollbar-thin::-webkit-scrollbar {
        width: 12px;
    }

    .scrollbar-thin::-webkit-scrollbar-thumb {
        border-radius: 6px;
    }
}

/* Optimisation spécifique pour 4K (3840x2160) */
@media screen and (min-width: 3840px) {
    .monitoring-container {
        --monitoring-padding: 1.5rem;
        --monitoring-gap: 1.5rem;
        --monitoring-text-xs: 1.25rem;
        --monitoring-text-sm: 1.5rem;
        --monitoring-text-xl: 2.5rem;
        --monitoring-text-10: 1.125rem;
        --monitoring-icon-sm: 2rem;
        --monitoring-icon-md: 2.5rem;
        --monitoring-icon-led: 1.25rem;
        max-width: 3840px;
        margin: 0 auto;
    }

    /* Scroll ultra-large pour 4K */
    .scrollbar-thin::-webkit-scrollbar {
        width: 16px;
    }

    .scrollbar-thin::-webkit-scrollbar-thumb {
        border-radius: 8px;
    }
}

/* Classes utilitaires pour utiliser les variables */
.monitoring-text-xs {
    font-size: var(--monitoring-text-xs);
}

.monitoring-text-sm {
    font-size: var(--monitoring-text-sm);
}

.monitoring-text-xl {
    font-size: var(--monitoring-text-xl);
}

.monitoring-text-10 {
    font-size: var(--monitoring-text-10);
}

.monitoring-icon-sm {
    width: var(--monitoring-icon-sm);
    height: var(--monitoring-icon-sm);
}

.monitoring-icon-md {
    width: var(--monitoring-icon-md);
    height: var(--monitoring-icon-md);
}

.monitoring-icon-led {
    width: var(--monitoring-icon-led);
    height: var(--monitoring-icon-led);
}

.monitoring-padding {
    padding: var(--monitoring-padding);
}

.monitoring-gap {
    gap: var(--monitoring-gap);
}

/* Utilitaires pour le scroll */
.scroll-smooth {
    scroll-behavior: var(--scroll-behavior);
}

.scroll-padding {
    scroll-padding: var(--scroll-padding);
}

/* Amélioration de l'accessibilité */
@media (prefers-reduced-motion: reduce) {

    .animate-pulse,
    .animate-spin,
    .scrollbar-thin::-webkit-scrollbar-thumb,
    button,
    .monitoring-container>div {
        animation: none !important;
        transition: none !important;
    }
}

/* Focus visible pour l'accessibilité */
.focus-visible:focus-visible {
    outline: 2px solid rgb(59 130 246);
    outline-offset: 2px;
}

/* Amélioration du contraste en mode sombre */
.dark .monitoring-container {
    --monitoring-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.monitoring-container>div {
    box-shadow: var(--monitoring-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
}
</style>
