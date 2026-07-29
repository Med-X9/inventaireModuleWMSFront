<template>
    <div class="min-h-screen bg-app dark:bg-bg-dark">
        <div class="container-fluid py-6">
            <Card class="mb-6 shadow-sm border-0 rounded-xl overflow-hidden">
                <div class="flex flex-col gap-4 p-6">
                    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div class="min-w-0">
                            <h1 class="text-2xl sm:text-3xl font-bold text-text dark:text-white m-0">
                                Écarts stock théorique
                            </h1>
                            <p class="text-sm text-muted m-0 mt-1">
                                Inventaire {{ inventoryReference }}
                                <span class="mx-2 text-border">·</span>
                                Magasin {{ warehouseReference }}
                                <template v-if="source">
                                    <span class="mx-2 text-border">·</span>
                                    Source : {{ source }}
                                </template>
                                <template v-if="selectedCount > 0">
                                    <span class="mx-2 text-border">·</span>
                                    {{ selectedCount }} sélectionné(s)
                                </template>
                            </p>
                        </div>
                        <div class="flex flex-wrap items-center gap-2 shrink-0">
                            <Button variant="secondary" size="sm" @click="goToResults">
                                <MdiIcon name="mdi-chart-bar" size="sm" class="mr-1" />
                                Résultats
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                :disabled="exporting || initializing"
                                @click="handleExportExcel"
                            >
                                <MdiIcon
                                    :name="exporting ? 'mdi-loading' : 'mdi-file-excel-outline'"
                                    size="sm"
                                    class="mr-1"
                                    :class="exporting ? 'animate-spin' : ''"
                                />
                                {{ exporting ? 'Export en cours...' : 'Exporter Excel' }}
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                :disabled="exportingPdf || initializing"
                                @click="handleExportPdf"
                            >
                                <MdiIcon
                                    :name="exportingPdf ? 'mdi-loading' : 'mdi-file-pdf-box'"
                                    size="sm"
                                    class="mr-1"
                                    :class="exportingPdf ? 'animate-spin' : ''"
                                />
                                {{ exportingPdf ? 'Export en cours...' : 'Exporter PDF' }}
                            </Button>
                            <Button
                                variant="success"
                                size="sm"
                                :disabled="!canValiderSelection || loading || mutating"
                                @click="handleValiderSelection"
                            >
                                <MdiIcon name="mdi-check-circle-outline" size="sm" class="mr-1" />
                                Valider la sélection
                                <span v-if="selectedValidablesCount > 0" class="ml-1">
                                    ({{ selectedValidablesCount }})
                                </span>
                            </Button>
                        </div>
                    </div>

                    <div v-if="totaux" class="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div class="rounded-xl border border-border p-3">
                            <p class="text-xs text-muted m-0 mb-1">Qté théorique</p>
                            <p class="text-lg font-semibold text-text m-0 tabular-nums">{{ totaux.qte_theorique }}</p>
                        </div>
                        <div class="rounded-xl border border-border p-3">
                            <p class="text-xs text-muted m-0 mb-1">Qté inventoriée</p>
                            <p class="text-lg font-semibold text-text m-0 tabular-nums">{{ totaux.qte_inventoriee }}</p>
                        </div>
                        <div class="rounded-xl border border-border p-3">
                            <p class="text-xs text-muted m-0 mb-1">Écart total</p>
                            <p
                                class="text-lg font-semibold m-0 tabular-nums"
                                :class="totaux.ecart === 0 ? 'text-success' : 'text-warning'"
                            >
                                {{ totaux.ecart }}
                            </p>
                        </div>
                        <div class="rounded-xl border border-border p-3">
                            <p class="text-xs text-muted m-0 mb-1">Lignes</p>
                            <p class="text-lg font-semibold text-text m-0 tabular-nums">{{ totaux.nombre_lignes }}</p>
                        </div>
                        <div class="rounded-xl border border-border p-3">
                            <p class="text-xs text-muted m-0 mb-1">Validées</p>
                            <p class="text-lg font-semibold text-success m-0 tabular-nums">{{ totaux.nombre_valides }}</p>
                        </div>
                    </div>
                </div>
            </Card>

            <Alert
                v-if="error"
                type="error"
                title="Erreur"
                :message="error"
                class="mb-6"
            />

            <Card v-if="initializing" class="p-16 text-center shadow-sm border-0 rounded-xl">
                <p class="text-muted m-0">Chargement des écarts...</p>
            </Card>

            <Card v-else class="shadow-sm border-0 rounded-xl overflow-hidden">
                <DataTable
                    :columns="columns"
                    :rowDataProp="rows"
                    :actions="actions"
                    actionsHeaderName="Actions"
                    :rowSelection="true"
                    :currentPageProp="pagination.current_page"
                    :totalPagesProp="pagination.total_pages"
                    :totalItemsProp="pagination.total"
                    :pageSizeProp="pagination.page_size"
                    :customDataTableParams="customParams"
                    v-on="tableEvents"
                    storageKey="inventory_stock_gaps"
                    :loading="loading || mutating"
                    :enableDynamicColumns="false"
                    :debounceFilter="300"
                    :debounceSearch="300"
                    :pagination="true"
                    :enableFiltering="true"
                    :enableGlobalSearch="true"
                    exportTitle="Écarts stock"
                    @selection-changed="onSelectionChanged"
                />
            </Card>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Card, Button, Alert, DataTable } from '@SMATCH-Digital-dev/vue-system-design'
import MdiIcon from '@/components/MdiIcon.vue'
import { useStockGaps } from '@/composables/useStockGaps'
import { bindDataTableServerEvents } from '@/composables/dataTable/bindDataTableServerEvents'

interface Props {
    reference: string
    warehouse: string
}

const props = defineProps<Props>()

const inventoryReference = props.reference
const warehouseReference = props.warehouse

const {
    loading,
    initializing,
    mutating,
    exporting,
    exportingPdf,
    error,
    rows,
    totaux,
    source,
    columns,
    actions,
    pagination,
    customParams,
    selectedCount,
    selectedValidablesCount,
    canValiderSelection,
    onSelectionChanged,
    handleValiderSelection,
    handleExportExcel,
    handleExportPdf,
    onTableEvent,
    goToResults,
} = useStockGaps(inventoryReference, warehouseReference)

const tableEvents = bindDataTableServerEvents(onTableEvent)
</script>
