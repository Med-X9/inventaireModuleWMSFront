/**
 * Composable — Dashboard KPI inventaire (agrégation tous magasins)
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useInventoryStore } from '@/stores/inventory'
import { fetchInventoryIdByReference } from '@/composables/affecter/helpers'
import { InventoryKpiService } from '@/services/InventoryKpiService'
import type {
    AssignmentsByCounting,
    InventoryKpiData,
    InventoryKpiMeta,
    JobsTerminesByCounting,
    MagasinsByStatus,
    StockGapsSummary,
} from '@/models/InventoryKpi'

const POLL_INTERVAL_MS = 45_000

export interface ChartPoint {
    name: string
    value: number
}

export interface GaugePoint {
    name: string
    value: number
}

export interface UseInventoryLevelKpiDashboardConfig {
    inventoryReference: string
}

function asStockSummary(value: StockGapsSummary | number | undefined): StockGapsSummary | null {
    if (value == null) return null
    if (typeof value === 'number') return { count: value, total: value }
    return value
}

export function useInventoryLevelKpiDashboard(config: UseInventoryLevelKpiDashboardConfig) {
    const router = useRouter()
    const inventoryStore = useInventoryStore()

    const inventoryReference = ref(config.inventoryReference)
    const inventoryId = ref<number | null>(null)
    const meta = ref<InventoryKpiMeta | null>(null)
    const kpiData = ref<InventoryKpiData | null>(null)

    const loading = ref(true)
    const refreshing = ref(false)
    const error = ref<string | null>(null)
    const autoRefreshEnabled = ref(true)

    let pollTimer: ReturnType<typeof setInterval> | null = null

    const resolveIds = async () => {
        const invId = await fetchInventoryIdByReference(inventoryReference.value, inventoryStore)
        if (!invId) {
            throw new Error(`Inventaire introuvable : ${inventoryReference.value}`)
        }
        inventoryId.value = invId
    }

    const fetchKpis = async (silent = false) => {
        if (!inventoryId.value) return
        if (!silent) loading.value = true
        else refreshing.value = true
        error.value = null

        try {
            const response = await InventoryKpiService.getInventoryKpis(inventoryId.value)
            const apiPayload = response.data
            meta.value = {
                inventory_id: inventoryId.value,
                warehouse_id: null,
                scope: 'inventory',
                aggregation: apiPayload.meta?.aggregation ?? 'all_warehouses',
                generated_at: apiPayload.meta?.generated_at,
            }
            kpiData.value = apiPayload.data ?? null
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

    const toggleAutoRefresh = () => {
        autoRefreshEnabled.value = !autoRefreshEnabled.value
        setupPolling()
    }

    const volume = computed(() => kpiData.value?.volume ?? {})
    const discrepancies = computed(() => kpiData.value?.discrepancies ?? {})
    const stores = computed(() => kpiData.value?.stores ?? {})
    const stockGaps = computed(() => kpiData.value?.stock_gaps ?? {})

    const jobsTerminesList = computed((): JobsTerminesByCounting[] => {
        const raw = kpiData.value?.jobs_termines_by_counting
        if (!raw) return []
        return Object.values(raw).sort((a, b) => a.counting_order - b.counting_order)
    })

    const assignmentsList = computed((): AssignmentsByCounting[] => {
        const raw = kpiData.value?.assignments_by_counting
        if (!raw) return []
        return Object.values(raw).sort((a, b) => a.counting_order - b.counting_order)
    })

    const magasinsByStatus = computed((): MagasinsByStatus | null => stores.value['KPI-S02'] ?? null)

    const volumeChartData = computed((): ChartPoint[] => [
        { name: 'Jobs total', value: volume.value['KPI-A01'] ?? 0 },
        { name: 'Jobs affectés', value: volume.value['KPI-A02'] ?? 0 },
        { name: 'Emplacements', value: volume.value['KPI-A03'] ?? 0 },
    ])

    const discrepanciesChartData = computed((): ChartPoint[] => [
        { name: 'Écarts', value: discrepancies.value['KPI-D01'] ?? 0 },
        { name: 'Jobs écart', value: discrepancies.value['KPI-D02'] ?? 0 },
        { name: 'Empl. écart', value: discrepancies.value['KPI-D03'] ?? 0 },
        { name: 'Écarts ouverts', value: discrepancies.value['KPI-D04'] ?? 0 },
    ])

    const magasinsStatusChartData = computed((): ChartPoint[] => {
        const byStatus = magasinsByStatus.value?.by_status
        if (!byStatus) return []
        return Object.entries(byStatus).map(([name, bucket]) => ({
            name,
            value: bucket.count,
        }))
    })

    const jobsTerminesGaugeData = computed((): GaugePoint[] =>
        jobsTerminesList.value.map((item) => ({
            name: `${item.counting_order}e comptage`,
            value: Math.round(item.percent ?? 0),
        }))
    )

    const assignmentsChartData = computed((): ChartPoint[] => {
        const first = assignmentsList.value[0]
        if (!first) return []
        return [
            { name: 'En attente', value: first.en_attente?.count ?? 0 },
            { name: 'En cours', value: first.en_cours?.count ?? 0 },
            { name: 'Terminé', value: first.termine?.count ?? 0 },
        ]
    })

    const stockGapsE01 = computed(() => asStockSummary(stockGaps.value['KPI-E01']))
    const stockGapsE02 = computed(() => asStockSummary(stockGaps.value['KPI-E02']))

    const stockGapsChartData = computed((): ChartPoint[] => {
        const e01 = stockGapsE01.value
        if (!e01) return []
        const withGap = e01.with_gap ?? 0
        const total = e01.total ?? e01.total_lignes ?? e01.count ?? 0
        const withoutGap = e01.without_gap ?? Math.max(0, total - withGap)
        return [
            { name: 'Avec écart', value: withGap },
            { name: 'Sans écart', value: withoutGap },
        ]
    })

    const stockValidatedGaugeData = computed((): GaugePoint[] => {
        const e02 = stockGapsE02.value
        if (!e02) return []
        return [{ name: 'Écarts validés', value: Math.round(e02.percent ?? 0) }]
    })

    const summaryCards = computed(() => [
        {
            id: 'magasins',
            label: 'Magasins',
            value: stores.value['KPI-S01'] ?? magasinsByStatus.value?.total_magasins ?? 0,
            icon: 'mdi-warehouse',
            color: 'text-primary',
        },
        {
            id: 'jobs',
            label: 'Jobs total',
            value: volume.value['KPI-A01'] ?? 0,
            icon: 'mdi-briefcase-outline',
            color: 'text-emerald-600',
        },
        {
            id: 'equipes',
            label: 'Équipes',
            value: kpiData.value?.teams_summary?.['KPI-T01'] ?? 0,
            icon: 'mdi-account-group-outline',
            color: 'text-sky-600',
        },
        {
            id: 'ecarts-ouverts',
            label: 'Écarts ouverts',
            value: discrepancies.value['KPI-D04'] ?? 0,
            icon: 'mdi-alert-outline',
            color: 'text-amber-600',
        },
    ])

    const goBack = () => {
        router.push({ name: 'inventory-list' })
    }

    const goToDetail = () => {
        router.push({
            name: 'inventory-detail',
            params: { reference: inventoryReference.value },
        })
    }

    onMounted(async () => {
        await init()
        setupPolling()
    })

    onUnmounted(() => {
        if (pollTimer) clearInterval(pollTimer)
    })

    return {
        inventoryReference,
        inventoryId,
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
        jobsTerminesList,
        assignmentsList,
        magasinsByStatus,
        goBack,
        goToDetail,
    }
}
