<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Badge, Button, Card } from '@SMATCH-Digital-dev/vue-system-design'
import MdiIcon from '@/components/MdiIcon.vue'
import InventoryKpiDashboardPanel from '@/components/InventoryKpi/InventoryKpiDashboardPanel.vue'
import { USE_INVENTORY_KPI_MOCK } from '@/mocks/inventoryKpiMock'

interface Props {
    reference: string
    warehouse: string
}

const props = defineProps<Props>()
const router = useRouter()

const warehouseLabel = computed(() => props.warehouse)

const goToPlanning = () => {
    void router.push({
        name: 'inventory-planning',
        params: { reference: props.reference, warehouse: props.warehouse },
    })
}
</script>

<template>
    <div class="min-h-screen bg-app dark:bg-bg-dark p-4 md:p-6 lg:p-8 font-body">
        <Card class="mb-6 shadow-sm border-0 rounded-xl overflow-hidden">
            <div class="flex flex-col gap-4 p-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div class="flex items-center gap-4 min-w-0">
                        <div
                            class="flex items-center justify-center w-12 h-12 shrink-0 rounded-xl bg-primary/10 dark:bg-primary/20">
                            <MdiIcon name="mdi-chart-box-outline" size="lg" class="text-primary" />
                        </div>
                        <div class="min-w-0">
                            <div class="flex flex-wrap items-center gap-2 mb-1">
                                <h1 class="text-2xl sm:text-3xl font-bold font-heading text-text dark:text-white m-0">
                                    Tableau de bord KPI
                                </h1>
                                <Badge v-if="USE_INVENTORY_KPI_MOCK" variant="warning" size="sm">Données démo</Badge>
                            </div>
                            <p class="text-sm text-muted m-0 flex flex-wrap gap-x-3 gap-y-1">
                                <span class="inline-flex items-center gap-1">
                                    <MdiIcon name="mdi-package-variant-closed" size="xs" />
                                    <strong class="text-text">{{ props.reference }}</strong>
                                </span>
                                <span class="text-border hidden sm:inline" aria-hidden="true">·</span>
                                <span class="inline-flex items-center gap-1">
                                    <MdiIcon name="mdi-warehouse" size="xs" />
                                    <strong class="text-text">{{ warehouseLabel }}</strong>
                                </span>
                            </p>
                        </div>
                    </div>
                    <Button variant="secondary" size="sm" class="shrink-0" @click="goToPlanning">
                        <span class="inline-flex items-center gap-1.5">
                            <MdiIcon name="mdi-arrow-left" size="sm" />
                            Retour planning
                        </span>
                    </Button>
                </div>
            </div>
        </Card>

        <InventoryKpiDashboardPanel
            :inventory-reference="props.reference"
            :warehouse-reference="props.warehouse"
        />
    </div>
</template>
