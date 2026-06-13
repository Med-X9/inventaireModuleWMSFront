/**
 * Composable — Dashboard KPI inventaire / magasin
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useInventoryStore } from '@/stores/inventory'
import { useWarehouseStore } from '@/stores/warehouse'
import {
    fetchInventoryIdByReference,
    fetchWarehouseIdByReference,
} from '@/composables/affecter/helpers'
import { InventoryKpiService } from '@/services/InventoryKpiService'
import { USE_INVENTORY_KPI_MOCK } from '@/mocks/inventoryKpiMock'
import type {
    AssignmentsByCounting,
    InventoryKpiData,
    InventoryKpiMeta,
    InventoryKpiTeam,
    JobsTerminesByCounting,
    TeamsSummaryT06
} from '@/models/InventoryKpi'

const POLL_INTERVAL_MS = 45_000

export type KpiAlertAction = 'results' | 'job-tracking' | 'monitoring'

export interface KpiAlert {
    id: string
    level: 'warning' | 'danger' | 'info'
    title: string
    message: string
    value?: string
    icon: string
    action?: KpiAlertAction
    actionLabel?: string
}

export interface UseInventoryKpiDashboardConfig {
    inventoryReference: string
    warehouseReference: string
}

export function useInventoryKpiDashboard(config: UseInventoryKpiDashboardConfig) {
    const router = useRouter()
    const inventoryStore = useInventoryStore()
    const warehouseStore = useWarehouseStore()

    const inventoryReference = ref(config.inventoryReference)
    const warehouseReference = ref(config.warehouseReference)

    const inventoryId = ref<number | null>(null)
    const warehouseId = ref<number | null>(null)
    const meta = ref<InventoryKpiMeta | null>(null)
    const kpiData = ref<InventoryKpiData | null>(null)

    const loading = ref(true)
    const refreshing = ref(false)
    const error = ref<string | null>(null)
    const autoRefreshEnabled = ref(true)

    let pollTimer: ReturnType<typeof setInterval> | null = null

    const resolveIds = async () => {
        if (USE_INVENTORY_KPI_MOCK) {
            inventoryId.value = 1
            warehouseId.value = 1
            return
        }

        const [invId, whId] = await Promise.all([
            fetchInventoryIdByReference(inventoryReference.value, inventoryStore),
            fetchWarehouseIdByReference(warehouseReference.value, warehouseStore),
        ])

        if (!invId) {
            throw new Error(`Inventaire introuvable : ${inventoryReference.value}`)
        }
        if (!whId) {
            throw new Error(`Magasin introuvable : ${warehouseReference.value}`)
        }

        inventoryId.value = invId
        warehouseId.value = whId
    }

    const fetchKpis = async (silent = false) => {
        if (!inventoryId.value || !warehouseId.value) {
            return
        }
        if (!silent) {
            loading.value = true
        } else {
            refreshing.value = true
        }
        error.value = null

        try {
            const response = await InventoryKpiService.getWarehouseKpis(
                inventoryId.value,
                warehouseId.value
            )
            const body = response.data
            meta.value = {
                ...(body.meta ?? {
                    inventory_id: inventoryId.value,
                    warehouse_id: warehouseId.value
                }),
                ...(USE_INVENTORY_KPI_MOCK
                    ? { warehouse_name: warehouseReference.value }
                    : {})
            }
            kpiData.value = body.data ?? (body as unknown as InventoryKpiData)
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message
                ?? (err instanceof Error ? err.message : 'Impossible de charger les KPI')
            error.value = msg
            kpiData.value = null
        } finally {
            loading.value = false
            refreshing.value = false
        }
    }

    const init = async () => {
        loading.value = true
        error.value = null
        try {
            await resolveIds()
            await fetchKpis(false)
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Erreur d’initialisation'
        } finally {
            loading.value = false
        }
    }

    const refresh = () => fetchKpis(true)

    const toggleAutoRefresh = () => {
        autoRefreshEnabled.value = !autoRefreshEnabled.value
        setupPolling()
    }

    const setupPolling = () => {
        if (pollTimer) {
            clearInterval(pollTimer)
            pollTimer = null
        }
        if (autoRefreshEnabled.value) {
            pollTimer = setInterval(() => {
                void fetchKpis(true)
            }, POLL_INTERVAL_MS)
        }
    }

    const jobsTerminesList = computed((): JobsTerminesByCounting[] => {
        const raw = kpiData.value?.jobs_termines_by_counting
        if (!raw) {
            return []
        }
        return Object.values(raw).sort((a, b) => a.counting_order - b.counting_order)
    })

    const assignmentsList = computed((): AssignmentsByCounting[] => {
        const raw = kpiData.value?.assignments_by_counting
        if (!raw) {
            return []
        }
        return Object.values(raw).sort((a, b) => a.counting_order - b.counting_order)
    })

    const teams = computed((): InventoryKpiTeam[] => kpiData.value?.teams ?? [])

    const teamsCount = computed(() => kpiData.value?.teams_summary?.['KPI-T01'] ?? teams.value.length)

    const multiDiscrepancyTeams = computed((): TeamsSummaryT06 | null => {
        const t06 = kpiData.value?.teams_summary?.['KPI-T06']
        if (t06 == null) {
            return null
        }
        if (typeof t06 === 'number') {
            return { count: t06, team_keys: [] }
        }
        return t06
    })

    const alerts = computed((): KpiAlert[] => {
        const list: KpiAlert[] = []
        const d04 = kpiData.value?.discrepancies?.['KPI-D04'] ?? 0
        const t06 = multiDiscrepancyTeams.value?.count ?? 0
        const b01 = jobsTerminesList.value.find(j => j.counting_order === 1)?.percent ?? 0
        const b02 = jobsTerminesList.value.find(j => j.counting_order === 2)?.percent ?? 0

        if (t06 > 0) {
            list.push({
                id: 't06',
                level: 'warning',
                title: 'Équipes multi-écarts',
                value: String(t06),
                message: `${t06} équipe(s) cumulent au moins 2 écarts ouverts — prioriser la résolution terrain.`,
                icon: 'mdi-account-alert-outline',
                action: 'results',
                actionLabel: 'Voir les écarts',
            })
        }
        if (d04 > 0) {
            list.push({
                id: 'd04',
                level: 'danger',
                title: 'Écarts non résolus',
                value: String(d04),
                message: `${d04} écart(s) restent ouverts sur le magasin. Traitement requis avant clôture.`,
                icon: 'mdi-alert-circle-outline',
                action: 'results',
                actionLabel: 'Ouvrir les résultats',
            })
        }
        if (b01 - b02 > 30) {
            list.push({
                id: 'b-gap',
                level: 'info',
                title: 'Décalage entre comptages',
                value: `${b01.toFixed(0)} % → ${b02.toFixed(0)} %`,
                message: `Le 1er comptage est nettement plus avancé que le 2e (${b01.toFixed(1)} % vs ${b02.toFixed(1)} % terminés).`,
                icon: 'mdi-chart-timeline-variant',
                action: 'job-tracking',
                actionLabel: 'Suivi des jobs',
            })
        }
        return list
    })

    const healthOverview = computed(() => {
        if (!kpiData.value) {
            return null
        }

        const d04 = kpiData.value.discrepancies?.['KPI-D04'] ?? 0
        const t06 = multiDiscrepancyTeams.value?.count ?? 0
        const alertCount = alerts.value.length
        const b01 = jobsTerminesList.value.find(j => j.counting_order === 1)?.percent ?? 0
        const b02 = jobsTerminesList.value.find(j => j.counting_order === 2)?.percent ?? 0
        const gap = b01 - b02

        let score = 100
        score -= Math.min(d04 * 4, 40)
        score -= Math.min(t06 * 8, 24)
        score -= gap > 30 ? 15 : gap > 15 ? 8 : 0
        score = Math.max(0, Math.min(100, score))

        if (alertCount >= 2 || d04 >= 8 || score < 45) {
            return {
                level: 'critical' as const,
                label: 'Situation critique',
                description: 'Plusieurs indicateurs nécessitent une action immédiate.',
                score,
            }
        }
        if (alertCount >= 1 || d04 > 0 || score < 75) {
            return {
                level: 'warning' as const,
                label: 'À surveiller',
                description: 'Des écarts ou retards sont détectés sur le magasin.',
                score,
            }
        }
        return {
            level: 'good' as const,
            label: 'Sous contrôle',
            description: 'Les indicateurs principaux sont dans les seuils attendus.',
            score,
        }
    })

    const goToPlanning = () => {
        void router.push({
            name: 'inventory-planning',
            params: {
                reference: inventoryReference.value,
                warehouse: warehouseReference.value,
            },
        })
    }

    const goToMonitoring = () => {
        void router.push({
            name: 'inventory-monitoring',
            params: {
                reference: inventoryReference.value,
                warehouse: warehouseReference.value
            }
        })
    }

    const goToResults = () => {
        void router.push({
            name: 'inventory-results',
            params: {
                reference: inventoryReference.value,
                warehouse: warehouseReference.value
            }
        })
    }

    const goToJobTracking = () => {
        void router.push({
            name: 'inventory-job-tracking',
            params: {
                reference: inventoryReference.value,
                warehouse: warehouseReference.value
            }
        })
    }

    onMounted(async () => {
        await init()
        setupPolling()
    })

    onUnmounted(() => {
        if (pollTimer) {
            clearInterval(pollTimer)
        }
    })

    return {
        inventoryReference,
        warehouseReference,
        inventoryId,
        warehouseId,
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
        init,
        refresh,
        toggleAutoRefresh,
        goToPlanning,
        goToMonitoring,
        goToResults,
        goToJobTracking,
    }
}

export function formatKpiNumber(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '—'
    }
    return Number(value).toLocaleString('fr-FR')
}

export function formatKpiPercent(value: number | null | undefined, digits = 1): string {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '—'
    }
    return `${Number(value).toFixed(digits)} %`
}
