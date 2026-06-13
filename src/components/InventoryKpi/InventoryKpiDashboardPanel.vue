<script setup lang="ts">
import { computed, watch } from 'vue'
import { Alert, Badge, Button, Card, DataTable, Divider } from '@SMATCH-Digital-dev/vue-system-design'
import type { DataTableColumn } from '@SMATCH-Digital-dev/vue-system-design'
import ButtonGroup from '@/components/Form/ButtonGroup.vue'
import type { ButtonGroupButton } from '@/components/Form/ButtonGroup.vue'
import MdiIcon from '@/components/MdiIcon.vue'
import {
    formatKpiNumber,
    formatKpiPercent,
    useInventoryKpiDashboard,
    type KpiAlertAction,
} from '@/composables/useInventoryKpiDashboard'

const props = defineProps<{
    inventoryReference: string
    warehouseReference: string
}>()

const dashboard = useInventoryKpiDashboard({
    inventoryReference: props.inventoryReference,
    warehouseReference: props.warehouseReference,
})

const {
    meta,
    kpiData,
    loading,
    refreshing,
    error,
    autoRefreshEnabled,
    jobsTerminesList,
    assignmentsList,
    teams,
    teamsCount,
    multiDiscrepancyTeams,
    alerts,
    healthOverview,
    refresh,
    toggleAutoRefresh,
    goToPlanning,
    goToMonitoring,
    goToResults,
    goToJobTracking,
} = dashboard

watch(
    () => [props.inventoryReference, props.warehouseReference],
    async ([inv, wh]) => {
        dashboard.inventoryReference.value = inv
        dashboard.warehouseReference.value = wh
        await dashboard.init()
    }
)

const countingOrderLabel = (order: number) => {
    if (order === 1) return '1er comptage'
    if (order === 2) return '2e comptage'
    if (order === 3) return '3e comptage'
    return `${order}e comptage`
}

const bucketColors = {
    en_attente: 'bg-warning',
    en_cours: 'bg-info',
    termine: 'bg-success',
} as const

type CardTone = 'neutral' | 'success' | 'warning' | 'danger' | 'primary'

interface KpiCardItem {
    id: string
    code: string
    label: string
    value: string
    hint?: string
    icon: string
    tone: CardTone
}

const toneClasses: Record<CardTone, { card: string; icon: string; value: string }> = {
    neutral: {
        card: 'border-border',
        icon: 'bg-hover text-text-muted dark:bg-bg-hover dark:text-text-light',
        value: 'text-text dark:text-white',
    },
    primary: {
        card: 'border-primary/30 dark:border-primary/40',
        icon: 'bg-primary/10 text-primary dark:bg-primary/20',
        value: 'text-primary',
    },
    success: {
        card: 'border-success/30 dark:border-success/40',
        icon: 'bg-success-light text-success dark:bg-success/20 dark:text-success-light',
        value: 'text-success',
    },
    warning: {
        card: 'border-warning/30 dark:border-warning/40',
        icon: 'bg-warning-light text-warning dark:bg-warning/20 dark:text-warning-light',
        value: 'text-warning',
    },
    danger: {
        card: 'border-error/30 dark:border-error/40',
        icon: 'bg-alert-error text-error dark:bg-error/20 dark:text-error-light',
        value: 'text-error',
    },
}

const healthToneClasses = {
    good: {
        card: 'border-success/40 bg-alert-success dark:border-success/50 dark:bg-success/10',
        ring: 'text-success',
        badge: 'success' as const,
    },
    warning: {
        card: 'border-warning/40 bg-alert-warning dark:border-warning/50 dark:bg-warning/10',
        ring: 'text-warning',
        badge: 'warning' as const,
    },
    critical: {
        card: 'border-error/40 bg-alert-error dark:border-error/50 dark:bg-error/10',
        ring: 'text-error',
        badge: 'error' as const,
    },
}

const alertIconClasses = {
    warning: 'bg-warning-light text-warning dark:bg-warning/20 dark:text-warning-light',
    danger: 'bg-alert-error text-error dark:bg-error/20 dark:text-error-light',
    info: 'bg-info-light text-info dark:bg-info/20 dark:text-info-light',
} as const

const alertValueClasses = {
    warning: 'text-warning',
    danger: 'text-error',
    info: 'text-info',
} as const

const alertTypeMap = {
    warning: 'warning',
    danger: 'error',
    info: 'info',
} as const

const lastUpdatedLabel = computed(() => {
    if (!meta.value?.generated_at) return null
    return new Date(meta.value.generated_at).toLocaleString('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
})

const summaryCards = computed((): KpiCardItem[] => {
    if (!kpiData.value) return []

    const cards: KpiCardItem[] = [
        {
            id: 'a01',
            code: 'KPI-A01',
            label: 'Jobs total',
            value: formatKpiNumber(kpiData.value.volume?.['KPI-A01']),
            icon: 'mdi-clipboard-list-outline',
            tone: 'primary',
        },
        {
            id: 'a02',
            code: 'KPI-A02',
            label: 'Jobs affectés',
            value: formatKpiNumber(kpiData.value.volume?.['KPI-A02']),
            icon: 'mdi-account-check-outline',
            tone: 'neutral',
        },
        {
            id: 'a03',
            code: 'KPI-A03',
            label: 'Emplacements couverts',
            value: formatKpiNumber(kpiData.value.volume?.['KPI-A03']),
            icon: 'mdi-map-marker-multiple-outline',
            tone: 'neutral',
        },
    ]

    for (const jt of jobsTerminesList.value.filter(j => j.counting_order <= 2)) {
        cards.push({
            id: `b0${jt.counting_order}`,
            code: `KPI-B0${jt.counting_order}`,
            label: `Jobs terminés — ${countingOrderLabel(jt.counting_order)}`,
            value: formatKpiPercent(jt.percent),
            hint: `${formatKpiNumber(jt.jobs_termines)} / ${formatKpiNumber(jt.jobs_eligibles)} jobs`,
            icon: 'mdi-check-circle-outline',
            tone: 'success',
        })
    }

    cards.push(
        {
            id: 'd02',
            code: 'KPI-D02',
            label: 'Jobs avec écart',
            value: formatKpiNumber(kpiData.value.discrepancies?.['KPI-D02']),
            icon: 'mdi-alert-outline',
            tone: 'warning',
        },
        {
            id: 'd03',
            code: 'KPI-D03',
            label: 'Emplacements avec écart',
            value: formatKpiNumber(kpiData.value.discrepancies?.['KPI-D03']),
            icon: 'mdi-map-marker-alert-outline',
            tone: 'warning',
        },
        {
            id: 'd04',
            code: 'KPI-D04',
            label: 'Écarts ouverts',
            value: formatKpiNumber(kpiData.value.discrepancies?.['KPI-D04']),
            icon: 'mdi-alert-circle-outline',
            tone: 'danger',
        },
        {
            id: 't01',
            code: 'KPI-T01',
            label: 'Équipes actives',
            value: formatKpiNumber(teamsCount.value),
            hint:
                (multiDiscrepancyTeams.value?.count ?? 0) > 0
                    ? `${multiDiscrepancyTeams.value?.count} avec plusieurs écarts`
                    : undefined,
            icon: 'mdi-account-group-outline',
            tone: 'neutral',
        }
    )

    return cards
})

const cardGroups = computed(() => [
    {
        id: 'volume',
        title: 'Volume magasin',
        icon: 'mdi-warehouse',
        cards: summaryCards.value.filter(c => c.code.startsWith('KPI-A')),
    },
    {
        id: 'progress',
        title: 'Taux de clôture',
        icon: 'mdi-progress-check',
        cards: summaryCards.value.filter(c => c.code.startsWith('KPI-B')),
    },
    {
        id: 'discrepancies',
        title: 'Écarts & qualité',
        icon: 'mdi-alert-decagram-outline',
        cards: summaryCards.value.filter(c => c.code.startsWith('KPI-D') || c.code === 'KPI-T01'),
    },
])

const sectionNav = computed(() => {
    const items = [
        { id: 'kpi-health', label: 'Synthèse', icon: 'mdi-heart-pulse' },
        ...(alerts.value.length ? [{ id: 'kpi-alerts', label: 'Alertes', icon: 'mdi-bell-alert-outline' }] : []),
        { id: 'kpi-metrics', label: 'Indicateurs', icon: 'mdi-view-grid-outline' },
        { id: 'kpi-counting', label: 'Comptages', icon: 'mdi-counter' },
        { id: 'kpi-teams', label: 'Équipes', icon: 'mdi-account-group-outline' },
    ]
    return items
})

const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const ACTION_BUTTON_CLASS =
    'bg-white text-primary border border-primary hover:bg-primary hover:text-white ' +
    'dark:bg-bg-card dark:text-primary dark:border-primary dark:hover:bg-primary ' +
    'dark:hover:text-white transition-all duration-200 text-sm !shadow-sm'

const PRIMARY_ACTION_CLASS =
    'bg-primary text-white border border-primary hover:bg-primary-700 ' +
    'dark:bg-primary dark:hover:bg-primary-600 transition-all duration-200 text-sm !shadow-sm'

const SECTION_NAV_CLASS =
    'bg-hover text-text border border-border hover:bg-primary/10 hover:text-primary ' +
    'dark:bg-bg-hover dark:text-text dark:border-border dark:hover:bg-primary/20 transition-all duration-200 text-xs !shadow-sm'

const withGroupBorder = (baseClass: string, index: number) =>
    index === 0 ? baseClass : `${baseClass} border-l-0`

const navigationButtons = computed<ButtonGroupButton[]>(() => {
    const items = [
        { id: 'planning', label: 'Planning', icon: 'mdi-calendar-outline', onClick: goToPlanning },
        { id: 'job-tracking', label: 'Suivi', icon: 'mdi-clipboard-text-outline', onClick: goToJobTracking },
        { id: 'results', label: 'Résultats', icon: 'mdi-chart-bar', onClick: goToResults },
        { id: 'monitoring', label: 'Monitoring', icon: 'mdi-chart-box-outline', onClick: goToMonitoring },
    ]
    return items.map((item, index) => ({
        ...item,
        class: withGroupBorder(ACTION_BUTTON_CLASS, index),
    }))
})

const toolbarButtons = computed<ButtonGroupButton[]>(() => [
    {
        id: 'refresh',
        label: 'Actualiser',
        icon: 'mdi-refresh',
        onClick: refresh,
        disabled: loading.value || refreshing.value,
        class: `${PRIMARY_ACTION_CLASS}${refreshing.value ? ' opacity-80' : ''}`,
    },
    {
        id: 'auto-refresh',
        label: autoRefreshEnabled.value ? 'Auto ON' : 'Auto OFF',
        icon: autoRefreshEnabled.value ? 'mdi-timer-outline' : 'mdi-timer-off-outline',
        onClick: toggleAutoRefresh,
        class: withGroupBorder(
            `${ACTION_BUTTON_CLASS}${autoRefreshEnabled.value ? ' ring-2 ring-success/50' : ''}`,
            1
        ),
    },
])

const sectionNavButtons = computed<ButtonGroupButton[]>(() =>
    sectionNav.value.map((section, index) => ({
        id: section.id,
        label: section.label,
        icon: section.icon,
        onClick: () => scrollToSection(section.id),
        class: withGroupBorder(SECTION_NAV_CLASS, index),
    }))
)

const ringDashOffset = (percent: number) => {
    const p = Math.min(100, Math.max(0, percent))
    return 100 - p
}

const teamsTableRows = computed(() =>
    teams.value.map((team) => {
        const t02 = team['KPI-T02']
        const t03 = team['KPI-T03']
        const t06 = team['KPI-T06']
        const t07 = team['KPI-T07']

        return {
            id: team.team_key,
            team_label: team.username || team.team_key,
            team_key: team.team_key,
            counting1_summary: `${formatKpiPercent(t02?.percent)} · ${t02?.termines ?? '—'}/${t02?.total ?? '—'}`,
            counting2_summary: `${formatKpiPercent(t03?.percent)} · ${t03?.termines ?? '—'}/${t03?.total ?? '—'}`,
            counting1_percent: t02?.percent ?? 0,
            open_discrepancies: t06?.open_discrepancies_count ?? 0,
            multi_discrepancy: t06?.is_multi_discrepancy ? 'Oui' : 'Non',
            jobs_with_discrepancy: t07?.jobs_with_discrepancy_count ?? 0,
        }
    })
)

const teamsColumns: DataTableColumn[] = [
    {
        field: 'team_label',
        headerName: 'Équipe',
        sortable: true,
        filterable: true,
        dataType: 'text',
        width: 180,
        icon: 'mdi-account-outline',
    },
    {
        field: 'counting1_summary',
        headerName: '1er comptage',
        sortable: true,
        filterable: true,
        dataType: 'text',
        width: 160,
        icon: 'mdi-numeric-1-circle-outline',
    },
    {
        field: 'counting2_summary',
        headerName: '2e comptage',
        sortable: true,
        filterable: true,
        dataType: 'text',
        width: 160,
        icon: 'mdi-numeric-2-circle-outline',
    },
    {
        field: 'open_discrepancies',
        headerName: 'Écarts ouverts',
        sortable: true,
        filterable: true,
        dataType: 'number',
        width: 120,
        icon: 'mdi-alert-outline',
    },
    {
        field: 'multi_discrepancy',
        headerName: 'Multi-écarts',
        sortable: true,
        filterable: true,
        dataType: 'select',
        width: 110,
        badgeStyles: [
            { value: 'Oui', class: 'inline-flex items-center rounded-md bg-warning-light px-2 py-0.5 text-xs font-semibold text-warning-700 ring-1 ring-warning/20' },
            { value: 'Non', class: 'inline-flex items-center rounded-md bg-hover px-2 py-0.5 text-xs font-medium text-text-muted ring-1 ring-border' },
        ],
    },
    {
        field: 'jobs_with_discrepancy',
        headerName: 'Jobs écart',
        sortable: true,
        filterable: true,
        dataType: 'number',
        width: 100,
    },
]

const runAlertAction = (action?: KpiAlertAction) => {
    if (action === 'results') goToResults()
    else if (action === 'job-tracking') goToJobTracking()
    else if (action === 'monitoring') goToMonitoring()
}
</script>

<template>
    <div class="space-y-6">
        <!-- Barre d'actions sticky -->
        <Card class="sticky top-2 z-20 shadow-md border-0 rounded-xl overflow-hidden">
            <div class="p-4 flex flex-col gap-3">
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <div class="flex flex-wrap items-center gap-2 text-xs text-muted">
                        <span v-if="lastUpdatedLabel" class="inline-flex items-center gap-1">
                            <MdiIcon name="mdi-clock-outline" size="xs" />
                            {{ lastUpdatedLabel }}
                        </span>
                        <Badge
                            v-if="refreshing"
                            variant="info"
                            size="sm"
                            class="animate-pulse">
                            Mise à jour…
                        </Badge>
                        <Badge
                            v-else-if="autoRefreshEnabled"
                            variant="success"
                            size="sm">
                            Auto 45s
                        </Badge>
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                        <ButtonGroup :buttons="navigationButtons" justify="end" />
                        <ButtonGroup :buttons="toolbarButtons" justify="end" />
                    </div>
                </div>

                <Divider class="!my-0" />

                <nav aria-label="Sections du tableau de bord">
                    <ButtonGroup :buttons="sectionNavButtons" justify="start" />
                </nav>
            </div>
        </Card>

        <!-- Chargement -->
        <div v-if="loading && !kpiData" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div
                v-for="i in 8"
                :key="i"
                class="h-36 rounded-xl bg-hover dark:bg-bg-hover animate-pulse" />
        </div>

        <!-- Erreur -->
        <Card
            v-else-if="error"
            class="p-10 text-center border-error/40 bg-alert-error dark:border-error/50 dark:bg-error/10">
            <MdiIcon name="mdi-cloud-alert-outline" size="xl" class="text-error mb-4" />
            <p class="text-error font-semibold text-lg m-0 mb-2">Impossible de charger les KPI</p>
            <p class="text-sm text-muted m-0 mb-6 max-w-md mx-auto">{{ error }}</p>
            <Button variant="primary" size="sm" @click="refresh">Réessayer</Button>
        </Card>

        <template v-else-if="kpiData">
            <!-- Santé globale -->
            <section id="kpi-health" class="scroll-mt-28">
                <Card
                    v-if="healthOverview"
                    class="p-5 border-0 shadow-sm"
                    :class="healthToneClasses[healthOverview.level].card">
                    <div class="flex flex-col sm:flex-row sm:items-center gap-5">
                        <div class="relative w-20 h-20 shrink-0 mx-auto sm:mx-0">
                            <svg class="w-20 h-20 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                                <circle
                                    cx="18"
                                    cy="18"
                                    r="15.9"
                                    fill="none"
                                    stroke="currentColor"
                                    class="text-border dark:text-border-dark"
                                    stroke-width="2.5" />
                                <circle
                                    cx="18"
                                    cy="18"
                                    r="15.9"
                                    fill="none"
                                    stroke="currentColor"
                                    :class="healthToneClasses[healthOverview.level].ring"
                                    stroke-width="2.5"
                                    stroke-linecap="round"
                                    pathLength="100"
                                    :stroke-dasharray="`${healthOverview.score} ${100 - healthOverview.score}`" />
                            </svg>
                            <span
                                class="absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums text-text">
                                {{ healthOverview.score }}
                            </span>
                        </div>
                        <div class="flex-1 text-center sm:text-left">
                            <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                                <h2 class="text-lg font-bold font-heading text-text m-0">
                                    {{ healthOverview.label }}
                                </h2>
                                <Badge :variant="healthToneClasses[healthOverview.level].badge" size="sm">
                                    Score {{ healthOverview.score }}/100
                                </Badge>
                            </div>
                            <p class="text-sm text-muted m-0">{{ healthOverview.description }}</p>
                        </div>
                        <div class="flex flex-wrap justify-center sm:justify-end gap-2 shrink-0">
                            <Button
                                v-if="alerts.length"
                                variant="secondary"
                                size="sm"
                                @click="scrollToSection('kpi-alerts')">
                                {{ alerts.length }} alerte(s)
                            </Button>
                            <Button variant="primary" size="sm" @click="goToResults">Traiter les écarts</Button>
                        </div>
                    </div>
                </Card>
            </section>

            <!-- Alertes -->
            <section
                v-if="alerts.length"
                id="kpi-alerts"
                class="scroll-mt-28"
                aria-label="Alertes opérationnelles">
                <div class="flex items-center gap-2 mb-3">
                    <MdiIcon name="mdi-bell-alert-outline" size="sm" class="text-warning" />
                    <h2 class="text-sm font-semibold uppercase tracking-wide text-muted m-0">
                        Points d'attention
                        <Badge variant="warning" size="sm" class="ml-2">{{ alerts.length }}</Badge>
                    </h2>
                </div>
                <div class="grid gap-3 lg:grid-cols-3">
                    <Alert
                        v-for="alert in alerts"
                        :key="alert.id"
                        :type="alertTypeMap[alert.level]"
                        size="sm"
                        class="!items-start h-full">
                        <div class="flex gap-3 w-full h-full">
                            <div
                                class="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
                                :class="alertIconClasses[alert.level]">
                                <MdiIcon :name="alert.icon" size="md" />
                            </div>
                            <div class="flex flex-col flex-1 min-w-0">
                                <div class="flex items-start justify-between gap-2">
                                    <p class="font-semibold text-sm m-0">{{ alert.title }}</p>
                                    <span
                                        v-if="alert.value"
                                        class="text-base font-bold tabular-nums shrink-0"
                                        :class="alertValueClasses[alert.level]">
                                        {{ alert.value }}
                                    </span>
                                </div>
                                <p class="text-xs mt-1.5 mb-3 opacity-90 leading-relaxed flex-1">{{ alert.message }}</p>
                                <Button
                                    v-if="alert.action && alert.actionLabel"
                                    variant="secondary"
                                    size="sm"
                                    class="self-start mt-auto"
                                    @click="runAlertAction(alert.action)">
                                    {{ alert.actionLabel }}
                                    <MdiIcon name="mdi-arrow-right" size="xs" class="ml-1" />
                                </Button>
                            </div>
                        </div>
                    </Alert>
                </div>
            </section>

            <Alert v-else type="success" size="sm" class="!items-center">
                <div class="flex items-center gap-2">
                    <MdiIcon name="mdi-check-circle-outline" size="md" class="text-success" />
                    <span class="text-sm font-medium">Aucune alerte active — le magasin est dans les seuils attendus.</span>
                </div>
            </Alert>

            <!-- Indicateurs groupés -->
            <section id="kpi-metrics" class="scroll-mt-28 space-y-6">
                <div
                    v-for="group in cardGroups"
                    :key="group.id"
                    class="space-y-3">
                    <h2 class="text-sm font-semibold uppercase tracking-wide text-muted m-0 flex items-center gap-2">
                        <MdiIcon :name="group.icon" size="sm" class="text-primary" />
                        {{ group.title }}
                    </h2>
                    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        <Card
                            v-for="card in group.cards"
                            :key="card.id"
                            class="p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                            :class="toneClasses[card.tone].card">
                            <div class="flex items-start gap-3">
                                <div
                                    class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                    :class="toneClasses[card.tone].icon">
                                    <MdiIcon :name="card.icon" size="md" />
                                </div>
                                <div class="flex-1 min-w-0">
                                    <Badge variant="info" size="sm" class="mb-1.5">{{ card.code }}</Badge>
                                    <p class="text-xs text-muted m-0 mb-0.5">{{ card.label }}</p>
                                    <p
                                        class="text-2xl font-bold m-0 tabular-nums leading-tight font-heading"
                                        :class="toneClasses[card.tone].value">
                                        {{ card.value }}
                                    </p>
                                    <p v-if="card.hint" class="text-xs text-muted m-0 mt-1">{{ card.hint }}</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </section>

            <!-- Avancement par comptage -->
            <section id="kpi-counting" class="scroll-mt-28">
                <h2 class="text-sm font-semibold uppercase tracking-wide text-muted mb-3 flex items-center gap-2">
                    <MdiIcon name="mdi-counter" size="sm" class="text-primary" />
                    Avancement par comptage
                </h2>
                <div class="grid gap-4 md:grid-cols-2">
                    <Card
                        v-for="item in assignmentsList"
                        :key="item.counting_order"
                        class="p-5 shadow-sm">
                        <div class="flex gap-4">
                            <div class="relative w-16 h-16 shrink-0">
                                <svg class="w-16 h-16 -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="15.9"
                                        fill="none"
                                        stroke="currentColor"
                                        class="text-border dark:text-border-dark"
                                        stroke-width="3" />
                                    <circle
                                        cx="18"
                                        cy="18"
                                        r="15.9"
                                        fill="none"
                                        stroke="currentColor"
                                        class="text-success"
                                        stroke-width="3"
                                        stroke-linecap="round"
                                        pathLength="100"
                                        :stroke-dasharray="`${item.termine.percent} ${ringDashOffset(item.termine.percent)}`" />
                                </svg>
                                <span
                                    class="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums text-text">
                                    {{ formatKpiPercent(item.termine.percent, 0) }}
                                </span>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex justify-between items-start gap-2 mb-3">
                                    <h3 class="text-sm font-semibold text-text m-0">
                                        {{ countingOrderLabel(item.counting_order) }}
                                    </h3>
                                    <Badge variant="info" size="sm">
                                        {{ formatKpiNumber(item.total_assignments) }}
                                    </Badge>
                                </div>
                                <div
                                    class="h-2.5 flex rounded-full overflow-hidden bg-hover dark:bg-border-dark">
                                    <div
                                        v-if="item.en_attente.percent > 0"
                                        class="h-full transition-all"
                                        :class="bucketColors.en_attente"
                                        :style="{ width: `${item.en_attente.percent}%` }" />
                                    <div
                                        v-if="item.en_cours.percent > 0"
                                        class="h-full transition-all"
                                        :class="bucketColors.en_cours"
                                        :style="{ width: `${item.en_cours.percent}%` }" />
                                    <div
                                        v-if="item.termine.percent > 0"
                                        class="h-full transition-all"
                                        :class="bucketColors.termine"
                                        :style="{ width: `${item.termine.percent}%` }" />
                                </div>
                                <div class="grid grid-cols-3 gap-2 mt-3 text-center text-[11px]">
                                    <div class="rounded-lg bg-warning-light dark:bg-warning/20 py-2">
                                        <p class="font-semibold text-text m-0 tabular-nums">{{ item.en_attente.count }}</p>
                                        <p class="text-muted m-0">Attente</p>
                                    </div>
                                    <div class="rounded-lg bg-info-light dark:bg-info/20 py-2">
                                        <p class="font-semibold text-text m-0 tabular-nums">{{ item.en_cours.count }}</p>
                                        <p class="text-muted m-0">En cours</p>
                                    </div>
                                    <div class="rounded-lg bg-success-light dark:bg-success/20 py-2">
                                        <p class="font-semibold text-text m-0 tabular-nums">{{ item.termine.count }}</p>
                                        <p class="text-muted m-0">Terminé</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </section>

            <!-- Équipes -->
            <section id="kpi-teams" class="scroll-mt-28">
                <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h2 class="text-sm font-semibold uppercase tracking-wide text-muted m-0 flex items-center gap-2">
                        <MdiIcon name="mdi-account-group-outline" size="sm" class="text-primary" />
                        Équipes terrain
                    </h2>
                    <Badge v-if="teams.length" variant="primary" size="sm">{{ teams.length }} équipe(s)</Badge>
                </div>

                <Card v-if="!teams.length" class="p-12 text-center border-dashed">
                    <MdiIcon name="mdi-account-off-outline" size="xl" class="text-muted mb-3" />
                    <p class="text-sm text-muted m-0 mb-4">Aucune équipe à afficher pour ce magasin.</p>
                    <Button variant="secondary" size="sm" @click="goToPlanning">Voir le planning</Button>
                </Card>

                <Card v-else class="overflow-hidden p-0 shadow-sm border-0 rounded-xl">
                    <DataTable
                        :key="`kpi-teams-${teamsTableRows.length}`"
                        :columns="teamsColumns"
                        :rowDataProp="teamsTableRows"
                        :actions="[]"
                        :rowSelection="false"
                        :loading="refreshing"
                        :pagination="teamsTableRows.length > 8"
                        :pageSizeProp="10"
                        :enableDynamicColumns="false"
                        :enableFiltering="true"
                        :enableGlobalSearch="true"
                        :debounceFilter="200"
                        :debounceSearch="300"
                        storageKey="inventory_kpi_teams_table"
                        exportTitle="Équipes KPI"
                    />
                </Card>
            </section>
        </template>
    </div>
</template>
