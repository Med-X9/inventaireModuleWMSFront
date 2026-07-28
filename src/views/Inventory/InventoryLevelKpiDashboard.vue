<template>
    <div class="min-h-screen bg-app dark:bg-bg-dark p-4 md:p-6 lg:p-8 font-body">
        <Card class="mb-6 shadow-sm border-0 rounded-xl overflow-hidden">
            <div class="flex flex-col gap-4 p-6">
                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div class="flex items-center gap-4 min-w-0">
                        <div class="flex items-center justify-center w-12 h-12 shrink-0 rounded-xl bg-primary/10 dark:bg-primary/20">
                            <MdiIcon name="mdi-chart-box-outline" size="lg" class="text-primary" />
                        </div>
                        <div class="min-w-0">
                            <h1 class="text-2xl sm:text-3xl font-bold font-heading text-text dark:text-white m-0">
                                KPI inventaire
                            </h1>
                            <p class="text-sm text-muted m-0 mt-1">
                                Agrégation tous magasins ·
                                <strong class="text-text">{{ inventoryReference }}</strong>
                                <span v-if="meta?.generated_at" class="ml-2">
                                    · maj. {{ formatGeneratedAt(meta.generated_at) }}
                                </span>
                            </p>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <Button
                            :variant="autoRefreshEnabled ? 'success' : 'secondary'"
                            size="sm"
                            @click="toggleAutoRefresh"
                        >
                            <MdiIcon
                                :name="autoRefreshEnabled ? 'mdi-pause' : 'mdi-play'"
                                size="sm"
                                class="mr-1"
                            />
                            Auto-refresh
                        </Button>
                        <Button variant="secondary" size="sm" :disabled="loading || refreshing" @click="refresh">
                            <MdiIcon
                                name="mdi-refresh"
                                size="sm"
                                class="mr-1"
                                :class="{ 'animate-spin': refreshing }"
                            />
                            Actualiser
                        </Button>
                        <Button variant="secondary" size="sm" @click="goToDetail">
                            Détail
                        </Button>
                        <Button variant="ghost" size="sm" @click="goBack">
                            <MdiIcon name="mdi-arrow-left" size="sm" class="mr-1" />
                            Retour
                        </Button>
                    </div>
                </div>
            </div>
        </Card>

        <Alert v-if="error" type="error" title="Erreur KPI" :message="error" class="mb-6" />

        <div v-if="loading && !kpiData" class="flex justify-center py-20">
            <p class="text-muted">Chargement des indicateurs...</p>
        </div>

        <template v-else-if="kpiData">
            <!-- Cartes résumé -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card
                    v-for="card in summaryCards"
                    :key="card.id"
                    class="p-4 shadow-sm border-0 rounded-xl"
                >
                    <div class="flex items-start justify-between gap-3">
                        <div>
                            <p class="text-xs uppercase tracking-wide text-muted m-0 mb-1">{{ card.label }}</p>
                            <p class="text-2xl font-bold text-text m-0 tabular-nums">{{ card.value }}</p>
                        </div>
                        <MdiIcon :name="card.icon" size="md" :class="card.color" />
                    </div>
                </Card>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                <Card class="p-4 shadow-sm border-0 rounded-xl overflow-hidden">
                    <h2 class="text-sm font-semibold uppercase tracking-wide text-muted m-0 mb-3">
                        Répartition magasins / statut
                    </h2>
                    <PieChart
                        :data="magasinsStatusChartData"
                        :loading="refreshing"
                        :donut="true"
                        :colors="magasinStatusColors"
                        title=""
                    />
                </Card>

                <Card class="p-4 shadow-sm border-0 rounded-xl overflow-hidden">
                    <h2 class="text-sm font-semibold uppercase tracking-wide text-muted m-0 mb-3">
                        Volume (jobs & emplacements)
                    </h2>
                    <BarChart
                        :data="volumeChartData"
                        :loading="refreshing"
                        color="#10B981"
                        title=""
                    />
                </Card>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                <Card class="p-4 shadow-sm border-0 rounded-xl overflow-hidden">
                    <h2 class="text-sm font-semibold uppercase tracking-wide text-muted m-0 mb-3">
                        Taux jobs terminés
                    </h2>
                    <GaugeChart
                        v-if="jobsTerminesGaugeData.length"
                        :data="jobsTerminesGaugeData"
                        :loading="refreshing"
                        :colors="['#0EA5E9', '#8B5CF6']"
                        title=""
                    />
                    <p v-else class="text-sm text-muted m-0 py-8 text-center">Aucune donnée de taux</p>
                </Card>

                <Card class="p-4 shadow-sm border-0 rounded-xl overflow-hidden">
                    <h2 class="text-sm font-semibold uppercase tracking-wide text-muted m-0 mb-3">
                        Répartition assignments (1er comptage)
                    </h2>
                    <PieChart
                        :data="assignmentsChartData"
                        :loading="refreshing"
                        :donut="true"
                        :colors="['#F59E0B', '#3B82F6', '#10B981']"
                        title=""
                    />
                </Card>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                <Card class="p-4 shadow-sm border-0 rounded-xl overflow-hidden">
                    <h2 class="text-sm font-semibold uppercase tracking-wide text-muted m-0 mb-3">
                        Écarts de comptage
                    </h2>
                    <BarChart
                        :data="discrepanciesChartData"
                        :loading="refreshing"
                        color="#F59E0B"
                        title=""
                    />
                </Card>

                <Card class="p-4 shadow-sm border-0 rounded-xl overflow-hidden">
                    <h2 class="text-sm font-semibold uppercase tracking-wide text-muted m-0 mb-3">
                        Écarts stock théorique
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <PieChart
                            :data="stockGapsChartData"
                            :loading="refreshing"
                            :donut="true"
                            :colors="['#EF4444', '#10B981']"
                            title=""
                        />
                        <GaugeChart
                            v-if="stockValidatedGaugeData.length"
                            :data="stockValidatedGaugeData"
                            :loading="refreshing"
                            :colors="['#8B5CF6']"
                            title=""
                        />
                        <p v-else class="text-sm text-muted m-0 py-8 text-center md:col-span-1">
                            Pas encore d'analyse stock
                        </p>
                    </div>
                </Card>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { Card, Button, Alert, PieChart, BarChart, GaugeChart } from '@SMATCH-Digital-dev/vue-system-design'
import MdiIcon from '@/components/MdiIcon.vue'
import { useInventoryLevelKpiDashboard } from '@/composables/useInventoryLevelKpiDashboard'

interface Props {
    reference: string
}

const props = defineProps<Props>()

const magasinStatusColors = [
    '#F59E0B', // EN ATTENTE
    '#10B981', // LANCEE
    '#0EA5E9', // TERMINEE
    '#8B5CF6', // ANALYSER
    '#64748B', // CLOTURE
]

const {
    inventoryReference,
    meta,
    kpiData,
    loading,
    refreshing,
    error,
    autoRefreshEnabled,
    refresh,
    toggleAutoRefresh,
    summaryCards,
    volumeChartData,
    discrepanciesChartData,
    magasinsStatusChartData,
    jobsTerminesGaugeData,
    assignmentsChartData,
    stockGapsChartData,
    stockValidatedGaugeData,
    goBack,
    goToDetail,
} = useInventoryLevelKpiDashboard({ inventoryReference: props.reference })

const formatGeneratedAt = (iso: string) => {
    try {
        return new Date(iso).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    } catch {
        return iso
    }
}
</script>
