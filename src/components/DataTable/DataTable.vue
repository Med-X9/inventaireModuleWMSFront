<template>
    <div class="data-table">
        <!-- Skeleton loader pendant le chargement -->
        <DataTableSkeleton v-if="isLoading" :columnsCount="finalColumns?.length || 5" :rowsCount="pageSizeProp || 10"
            :showActions="dataTable?.actions?.length > 0" />

        <!-- Contenu normal quand pas de chargement -->
        <template v-else>
            <!-- Toolbar avec contrôles des fonctionnalités avancées -->
            <div class="advanced-controls"
                v-if="props.enableGrouping || props.enablePivot || props.enableAdvancedEditing">
                <div class="controls-group">
                    <!-- Contrôles de groupement -->
                    <div v-if="grouping" class="grouping-controls">
                        <button @click="grouping.expandAll()" class="btn btn-sm btn-outline">
                            <i class="icon-expand"></i> Tout développer
                        </button>
                        <button @click="grouping.collapseAll()" class="btn btn-sm btn-outline">
                            <i class="icon-collapse"></i> Tout replier
                        </button>
                        <span class="group-info">
                            {{ grouping.groupCount }} groupe(s), {{ grouping.expandedCount }} développé(s)
                        </span>
                    </div>

                    <!-- Contrôles de pivot -->
                    <div v-if="pivot" class="pivot-controls">
                        <button @click="pivot.expandAll()" class="btn btn-sm btn-outline">
                            <i class="icon-expand"></i> Développer pivot
                        </button>
                        <button @click="pivot.collapseAll()" class="btn btn-sm btn-outline">
                            <i class="icon-collapse"></i> Replier pivot
                        </button>
                    </div>

                    <!-- Contrôles d'édition -->
                    <div v-if="editing" class="editing-controls">
                        <button @click="editing.enableBatchMode()" class="btn btn-sm btn-outline">
                            <i class="icon-edit"></i> Mode lot
                        </button>
                        <button @click="editing.saveAllPendingChanges()" class="btn btn-sm btn-success">
                            <i class="icon-save"></i> Sauvegarder
                        </button>
                        <button @click="editing.discardAllPendingChanges()" class="btn btn-sm btn-danger">
                            <i class="icon-cancel"></i> Annuler
                        </button>
                    </div>

                    <!-- Contrôles master/detail -->
                    <div v-if="masterDetail" class="master-detail-controls">
                        <button @click="masterDetail.expandAllDetails()" class="btn btn-sm btn-outline">
                            <i class="icon-expand"></i> Développer détails
                        </button>
                        <button @click="masterDetail.collapseAllDetails()" class="btn btn-sm btn-outline">
                            <i class="icon-collapse"></i> Replier détails
                        </button>
                    </div>
                </div>
            </div>

            <TableHeader :globalSearchTerm="dataTable?.globalSearchTerm" :filterState="dataTable?.filterState"
                :advancedFilters="dataTable?.advancedFilters" :loading="dataTable?.loading"
                @update:globalSearchTerm="handleGlobalSearchUpdate" @clear-all-filters="handleClearAllFilters" />

            <Toolbar :columns="columnsForManager" :visibleColumns="visibleColumnNames"
                :columnWidths="dataTable?.columnWidths" :rowSelection="dataTable?.rowSelection"
                :selectedRows="selectedRowsSet" :exportLoading="exportLoadingState" :loading="dataTable?.loading"
                :enableColumnPinning="props.enableColumnPinning || false"
                :columnPinning="columnPinning"
                :stickyHeader="stickyHeaderState"
                @columns-changed="dataTable?.handleVisibleColumnsChanged" @reorder-columns="dataTable?.reorderColumns"
                @pin-column="handlePinColumn"
                @sticky-header-changed="handleStickyHeaderChanged"
                @export-csv="emit('export-csv')" @export-excel="emit('export-excel')"
                @export-pdf="emit('export-pdf')" @export-selected-csv="emit('export-selected-csv')"
                @export-selected-excel="emit('export-selected-excel')" @deselect-all="dataTable?.deselectAll()" />

            <!-- Container avec virtual scrolling si activé -->
            <div v-if="virtualScrolling" :ref="virtualScrolling.containerRef" class="virtual-scroll-container"
                :style="{ height: props.virtualScrollingConfig?.containerHeight + 'px' }">
                <div class="virtual-scroll-content" :style="{ height: virtualScrolling.totalHeight + 'px' }">
                    <div class="virtual-scroll-transform"
                        :style="{ transform: `translateY(${virtualScrolling.transformY}px)` }">
                        <TableBody ref="tableBodyRef" :columns="finalColumns" :paginatedData="finalRowData" :key="`virtual-${finalRowData.length}`"
                            :actions="dataTable?.actions" :loading="isLoading" :skeletonRowsCount="pageSizeProp || 10"
                            :currentSortField="currentSortField" :currentSortDirection="currentSortDirection"
                            :rowSelection="dataTable?.rowSelection" :selectedRows="selectedRowsSet"
                            :inlineEditing="props.inlineEditing" :editingState="editing?.state.value"
                            :masterDetailState="masterDetail?.detailStates"
                            :currentPage="dataTable?.effectiveCurrentPage || 1"
                            :pageSize="dataTable?.effectivePageSize || 10"
                            :globalStartIndex="((dataTable?.effectiveCurrentPage || 1) - 1) * (dataTable?.effectivePageSize || 10)"
                            @sort-changed="handleSortChanged" @filter-changed="handleFilterChanged"
                            @selection-changed="handleSelectionChanged"
                            @cell-value-changed="(event) => emit('cell-value-changed', event)"
                            @row-clicked="(row: any) => emit('row-clicked', row)"
                            @group-toggle="(groupKey: any) => grouping?.toggleGroup(groupKey)"
                            @detail-toggle="(rowId: any) => masterDetail?.toggleDetail(rowId)"
                            @edit-start="(row: any, field: any) => editing?.startEditing(row, field)"
                            @edit-stop="(save: any) => editing?.stopEditing(save)"
                            @edit-value-update="(value: any) => editing?.updateEditingValue(value)" />
                    </div>
                </div>
            </div>

            <!-- TableBody normal si pas de virtual scrolling -->
            <TableBody v-if="!virtualScrolling" :key="`table-${dataTable?.effectivePageSize || 10}-${dataTable?.effectiveCurrentPage || 1}-${finalRowData.length}-${JSON.stringify(finalRowData.slice(0, 1).map(r => r?.id || r?.reference))}`" ref="tableBodyRef" :columns="finalColumns" :paginatedData="finalRowData"
                    :actions="dataTable?.actions" :loading="isLoading" :skeletonRowsCount="pageSizeProp || 10"
                    :currentSortField="currentSortField" :currentSortDirection="currentSortDirection"
                    :rowSelection="dataTable?.rowSelection" :selectedRows="selectedRowsSet"
                    :inlineEditing="props.inlineEditing" :editingState="editing?.state.value"
                    :masterDetailState="masterDetail?.detailStates" :currentPage="dataTable?.effectiveCurrentPage || 1"
                    :pageSize="dataTable?.effectivePageSize || 10"
                    :globalStartIndex="((dataTable?.effectiveCurrentPage || 1) - 1) * (dataTable?.effectivePageSize || 10)"
                    :columnPinning="columnPinning"
                    :enableColumnPinning="props.enableColumnPinning || false"
                    :stickyHeader="stickyHeaderState"
                    @sort-changed="handleSortChanged" @filter-changed="handleFilterChanged"
                    @selection-changed="handleSelectionChanged"
                    @cell-value-changed="(event) => emit('cell-value-changed', event)"
                    @row-clicked="(row: any) => emit('row-clicked', row)"
                    @group-toggle="(groupKey: any) => grouping?.toggleGroup(groupKey)"
                    @detail-toggle="(rowId: any) => masterDetail?.toggleDetail(rowId)"
                    @edit-start="(row: any, field: any) => editing?.startEditing(row, field)"
                    @edit-stop="(save: any) => editing?.stopEditing(save)"
                    @edit-value-update="(value: any) => editing?.updateEditingValue(value)" />

            <Pagination :currentPage="dataTable?.effectiveCurrentPage || 1"
                :totalPages="dataTable?.effectiveTotalPages || 1" :totalItems="dataTable?.effectiveTotalItems || 0"
                :pageSize="dataTable?.effectivePageSize || 10" :total="dataTable?.effectiveTotalItems || 0"
                :start="dataTable?.start || 0" :end="dataTable?.end || 0" :loading="dataTable?.loading || false"
                @page-changed="handlePaginationChanged"
                @page-size-changed="handlePageSizeChanged" />
        </template>
    </div>
</template>

<script setup lang="ts">
/* eslint-disable */
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import type { DataTableProps } from '@/components/DataTable/types/dataTable'
import { cellRenderersService } from './services/cellRenderers'
import { logger } from '@/services/loggerService'
import TableHeader from './TableHeader.vue'
import Toolbar from './Toolbar.vue'
import TableBody from './TableBody.vue'
import Pagination from './Pagination.vue'
import DataTableSkeleton from './DataTableSkeleton.vue'

// Import des fonctionnalités avancées
import { useDataTable } from './composables/useDataTable'
import { useVirtualScrolling } from './composables/useVirtualScrolling'
import { useDataTableGrouping } from './composables/useDataTableGrouping'
import { useDataTableEditing } from './composables/useDataTableEditing'
import { useDataTablePivot } from './composables/useDataTablePivot'
import { useDataTableMasterDetail } from './composables/useDataTableMasterDetail'
import { convertToStandardDataTableParams, type StandardDataTableParams } from './utils/dataTableParamsConverter'
import { useQueryModel } from './composables/useQueryModel'
import { convertQueryModelToRestApi, convertQueryModelToQueryParams, createQueryModelFromDataTableParams } from './utils/queryModelConverter'
import type { QueryModel } from './types/QueryModel'

// Import des nouvelles fonctionnalités AG-Grid
import { useMultiSort } from './composables/useMultiSort'
import { useColumnPinning } from './composables/useColumnPinning'
import { useColumnResize } from './composables/useColumnResize'
import { useInfiniteScroll } from './composables/useInfiniteScroll'
import { useSetFilters } from './composables/useSetFilters'
// 🚀 Gestion automatique
import { useAutoDataTable } from './composables/useAutoDataTable'
// 💾 Sauvegarde de configuration
import { useDataTableConfig } from './composables/useDataTableConfig'

const props = defineProps<DataTableProps>()
const emit = defineEmits<{
    'pagination-changed': [params: { page: number; pageSize: number; start: number; end: number } | StandardDataTableParams | QueryModel | Record<string, any>]
    'sort-changed': [sortModel: any | StandardDataTableParams | QueryModel | Record<string, any>]
    'filter-changed': [filterModel: any | StandardDataTableParams | QueryModel | Record<string, any>]
    'global-search-changed': [searchTerm: string | StandardDataTableParams | QueryModel | Record<string, any>]
    'selection-changed': [selectedRows: Set<string>]
    'cell-value-changed': [event: { data: any; field: string; newValue: any; oldValue: any }]
    'grouping-changed': [groups: any[]]
    'pivot-changed': [pivotData: any]
    'master-detail-changed': [detailState: any]
    'row-clicked': [row: any]
    'export-excel': []
    'export-csv': []
    'export-pdf': []
    'export-selected-csv': []
    'export-selected-excel': []
    'query-model-changed': [queryModel: QueryModel]
}>()

const dataTable = useDataTable(props, emit)

// === SAUVEGARDE DE CONFIGURATION ===
// Initialiser la sauvegarde de configuration si storageKey est fourni
const tableConfig = props.storageKey ? useDataTableConfig(
    props.storageKey,
    {
        visibleColumns: dataTable?.visibleColumns || [],
        columnOrder: dataTable?.visibleColumns || [],
        columnWidths: dataTable?.columnWidths || {},
        pinnedColumns: [],
        stickyHeader: false,
        pageSize: props.pageSizeProp || 20
    }
) : null

// === QUERYMODEL ===
/**
 * QueryModel pour gérer les requêtes avec mode de sortie configurable
 */
const queryOutputMode = computed(() => props.queryOutputMode || 'dataTable')
const columnsRef = computed(() => props.columns)

const {
    queryModel,
    toStandardParams,
    updatePagination: updateQueryPagination,
    updateSort: updateQuerySort,
    updateFilter: updateQueryFilter,
    updateGlobalSearch: updateQueryGlobalSearch,
    fromDataTableParams
} = useQueryModel({
    columns: columnsRef,
    enabled: true
})

/**
 * Convertit le QueryModel selon le mode configuré
 */
const convertQueryModelToOutput = (queryModelData: QueryModel) => {
    switch (queryOutputMode.value) {
        case 'queryModel':
            return queryModelData
        case 'restApi':
            return convertQueryModelToRestApi(queryModelData)
        case 'queryParams':
            return convertQueryModelToQueryParams(queryModelData)
        case 'dataTable':
        default:
            return toStandardParams.value
    }
}

/**
 * Crée un QueryModel depuis les paramètres DataTable actuels
 */
const createQueryModelFromCurrentState = () => {
    return createQueryModelFromDataTableParams({
        page: dataTable?.effectiveCurrentPage || 1,
        pageSize: dataTable?.effectivePageSize || 10,
        sort: currentSortModel.value?.map(s => ({
            field: s.colId,
            direction: s.sort
        })),
        filters: dataTable?.filterState || {},
        globalSearch: dataTable?.globalSearchTerm || undefined,
        customParams: props.customDataTableParams || {}
    })
}

// === GESTION AUTOMATIQUE ===
const autoDataTable = props.enableAutoManagement ? useAutoDataTable({
    columns: computed(() => props.columns),
    data: computed(() => props.rowDataProp),
    endpoint: props.autoManagementConfig?.endpoint,
    piniaStore: props.autoManagementConfig?.piniaStore,
    storeAction: props.autoManagementConfig?.storeAction,
    defaultPageSize: props.autoManagementConfig?.defaultPageSize || props.pageSizeProp || 20,
    enableRowSelection: props.autoManagementConfig?.enableRowSelection ?? props.rowSelection ?? false,
    enableMultiSort: props.autoManagementConfig?.enableMultiSort ?? props.enableMultiSort ?? true,
    enableSetFilters: props.autoManagementConfig?.enableSetFilters ?? props.enableSetFilters ?? false,
    autoLoad: true
}) : null

// Si gestion automatique activée, utiliser les handlers automatiques
if (autoDataTable) {
    // Les handlers sont déjà configurés dans useAutoDataTable
    // Ils seront utilisés automatiquement via les événements
}

// === INITIALISATION DES FONCTIONNALITÉS AVANCÉES ===

// Virtual Scrolling
const virtualScrolling = props.enableVirtualScrolling ? useVirtualScrolling(
    props.rowDataProp,
    props.virtualScrollingConfig || {
        itemHeight: 50,
        containerHeight: 400,
        overscan: 5,
        threshold: 100
    }
) : null

// Groupement
const grouping = props.enableGrouping ? useDataTableGrouping(
    props.rowDataProp,
    props.groupingConfig?.fields.map(field => ({
        field,
        label: field,
        sortable: true,
        collapsible: true,
        aggregator: props.groupingConfig?.aggregators?.[field] || 'count'
    })) || []
) : null

// Édition avancée
const editing = props.enableAdvancedEditing ? useDataTableEditing(
    props.rowDataProp,
    props.editingConfig?.fields.map(field => ({
        field,
        type: 'text',
        required: false,
        validator: props.editingConfig?.validation?.[field]
    })) || [],
    {
        onSave: async (changes) => {
            // Émettre l'événement de sauvegarde
            changes.forEach(change => {
                emit('cell-value-changed', {
                    data: change.row,
                    field: change.field,
                    oldValue: change.oldValue,
                    newValue: change.newValue
                })

            })
        }
    }
) : null

// Pivot Tables
const pivot = props.enablePivot ? useDataTablePivot(
    props.rowDataProp,
    props.pivotConfig || {
        rows: [],
        columns: [],
        values: []
    }
) : null

// Master/Detail
const masterDetail = props.enableMasterDetail ? useDataTableMasterDetail(
    props.rowDataProp,
    props.masterDetailConfig || {}
) : null

// === NOUVELLES FONCTIONNALITÉS AG-GRID ===

// Tri multi-colonnes
const multiSort = props.enableMultiSort ? useMultiSort(
    [],
    props.multiSortConfig || { maxSortColumns: 3 }
) : null

// Épinglage de colonnes
// Charger la configuration sauvegardée si disponible (tableConfig est défini plus haut)
// Toujours épingler __rowNumber__ à gauche
const pinnedColumnsSource = tableConfig?.pinnedColumns.value || props.columnPinningConfig?.defaultPinnedColumns || []
const mappedPinnedColumns: Array<{ field: string; pinned: 'left' | 'right' | null }> = pinnedColumnsSource.map((col: any) => {
    const pinnedValue = col.pinned
    const pinned: 'left' | 'right' | null = (pinnedValue === 'left' || pinnedValue === 'right') ? pinnedValue : null
    return {
        field: col.field,
        pinned
    }
})
const defaultPinnedColumns: Array<{ field: string; pinned: 'left' | 'right' | null }> = [
    { field: '__rowNumber__', pinned: 'left' }, // Toujours fixée à gauche
    ...mappedPinnedColumns
].filter((col, index, self) =>
    // Éviter les doublons
    index === self.findIndex(c => c.field === col.field)
) as Array<{ field: string; pinned: 'left' | 'right' | null }>
const columnPinning = props.enableColumnPinning ? useColumnPinning(
    columnsRef,
    {
        ...props.columnPinningConfig,
        defaultPinnedColumns
    }
) : null

// S'assurer que __rowNumber__ est toujours épinglée à gauche
if (columnPinning) {
    // Épingler immédiatement
    columnPinning.pinColumn('__rowNumber__', 'left')

    // Watcher pour s'assurer qu'elle reste épinglée à gauche
    watch(() => columnPinning.getPinDirection('__rowNumber__'), (direction) => {
        if (direction !== 'left') {
            columnPinning.pinColumn('__rowNumber__', 'left')
        }
    })
}

// État du header sticky (charger depuis la config sauvegardée)
const stickyHeaderState = ref(tableConfig?.stickyHeader.value ?? false)

// Handler pour le pinning des colonnes
const handlePinColumn = (field: string, direction: 'left' | 'right' | null) => {
    // Empêcher de désépingler ou de déplacer __rowNumber__
    if (field === '__rowNumber__') {
        // Toujours forcer à gauche
        if (columnPinning) {
            columnPinning.pinColumn('__rowNumber__', 'left')
        }
        return
    }

    if (columnPinning) {
        columnPinning.pinColumn(field, direction)
        // Sauvegarder la configuration
        if (tableConfig) {
            const pinnedCols = Array.from(columnPinning.pinnedColumns.value.entries()).map(([f, d]) => ({
                field: f,
                pinned: d
            }))
            tableConfig.updatePinnedColumns(pinnedCols)
        }
    }
}

// Handler pour le header sticky
const handleStickyHeaderChanged = (enabled: boolean) => {
    stickyHeaderState.value = enabled
    // Sauvegarder la configuration
    if (tableConfig) {
        tableConfig.updateStickyHeader(enabled)
    }
}

// Redimensionnement de colonnes
const columnResize = props.enableColumnResize ? useColumnResize(
    columnsRef,
    props.columnResizeConfig || {}
) : null

// Scroll infini
const infiniteScrollContainer = ref<HTMLElement | null>(null)
const infiniteScroll = props.enableInfiniteScroll ? useInfiniteScroll(
    infiniteScrollContainer,
    props.infiniteScrollConfig || {}
) : null

// Filtres Set (valeurs uniques)
const dataRef = computed(() => props.rowDataProp)
const setFilters = props.enableSetFilters ? useSetFilters(
    columnsRef,
    dataRef,
    props.setFiltersConfig || {}
) : null

// Référence au TableBody
const tableBodyRef = ref()

// État local pour le tri
const currentSortField = ref<string>('')
const currentSortDirection = ref<'asc' | 'desc'>('asc')
const currentSortModel = ref<Array<{ colId: string; sort: 'asc' | 'desc' }>>([])

// Debounce pour la recherche globale (utiliser debounceFilter ou 500ms par défaut)
const debounceDelay = props.debounceFilter || 500
const debouncedGlobalSearch = useDebounceFn((searchTerm: string) => {
    // Mettre à jour le QueryModel
    updateQueryGlobalSearch(searchTerm || '')

    // Si serverSideFiltering est activé, convertir selon le mode configuré
    if (props.serverSideFiltering) {
        const queryModelData = createQueryModelFromCurrentState()
        const output = convertQueryModelToOutput(queryModelData)
        emit('global-search-changed', output as any)
    } else {
        emit('global-search-changed', searchTerm)
    }
}, debounceDelay)

const handleGlobalSearchUpdate = (searchTerm: string) => {
    // Mettre à jour immédiatement le terme de recherche pour l'affichage
    dataTable.updateGlobalSearchTerm(searchTerm)

    // Appeler la fonction debounced pour émettre l'événement avec un délai
    debouncedGlobalSearch(searchTerm)
}

// Handler pour les changements de pagination
const handlePaginationChanged = (page: number) => {
    if (props.serverSidePagination) {
        // Convertir vers le format standard DataTable
        const standardParams = convertToStandardDataTableParams(
            {
                page: page,
                pageSize: dataTable?.effectivePageSize || 10,
                filters: dataTable?.filterState || {},
                sort: currentSortModel.value,
                globalSearch: dataTable?.globalSearchTerm || undefined
            },
            {
                columns: props.columns,
                draw: 1,
                customParams: props.customDataTableParams || {}
            }
        )
        emit('pagination-changed', standardParams)
    } else {
        dataTable?.goToPage?.(page)
    }
}

// Handler pour les changements de taille de page
const handlePageSizeChanged = (size: number) => {
    // Mettre à jour la taille de page dans useDataTable
    if (dataTable && typeof dataTable.changePageSize === 'function') {
        dataTable.changePageSize(size)
    }

    // Mettre à jour le QueryModel
    updateQueryPagination(1, size) // Réinitialiser à la page 1

    if (props.serverSidePagination) {
        // Convertir selon le mode configuré
        const queryModelData = createQueryModelFromDataTableParams({
            page: 1,
            pageSize: size,
            sort: currentSortModel.value?.map(s => ({
                field: s.colId,
                direction: s.sort
            })),
            filters: dataTable?.filterState || {},
            globalSearch: dataTable?.globalSearchTerm || undefined,
            customParams: props.customDataTableParams || {}
        })
        const output = convertQueryModelToOutput(queryModelData)
        emit('pagination-changed', output as any)
    } else {
        emit('pagination-changed', { page: 1, pageSize: size })
    }
}

// Handler pour les changements de tri
const handleSortChanged = (sortData: { field: string; direction: 'asc' | 'desc'; isActive: boolean }) => {
    // Mettre à jour l'état local
    if (sortData.isActive) {
        currentSortField.value = sortData.field
        currentSortDirection.value = sortData.direction
    } else {
        currentSortField.value = ''
        currentSortDirection.value = 'asc'
    }

    // Si multi-sort est activé, utiliser le composable
    if (multiSort) {
        if (sortData.isActive) {
            multiSort.addSort(sortData.field, sortData.direction)
        } else {
            multiSort.removeSort(sortData.field)
        }

        const sortModel = multiSort.dataTablesSortModel.value
        currentSortModel.value = sortModel

        // Mettre à jour le QueryModel
        const sortModels = sortModel.map((s, index) => ({
            field: s.colId,
            direction: s.sort,
            priority: index + 1
        }))
        updateQuerySort(sortModels)

        // Si serverSideSorting est activé, convertir selon le mode configuré
        if (props.serverSideSorting) {
            const queryModelData = createQueryModelFromCurrentState()
            const output = convertQueryModelToOutput(queryModelData)
            emit('sort-changed', output)
        } else {
            emit('sort-changed', multiSort.formattedSortModel.value)
        }
    } else {
        // Tri simple
        const sortModel = sortData.isActive ? [{
            colId: sortData.field,
            sort: sortData.direction
        }] : []

        currentSortModel.value = sortModel

        // Si serverSideSorting est activé, convertir vers le format standard DataTable
        if (props.serverSideSorting) {
            const standardParams = convertToStandardDataTableParams(
                {
                    page: dataTable?.effectiveCurrentPage || 1,
                    pageSize: dataTable?.effectivePageSize || 10,
                    filters: dataTable?.filterState || {},
                    sort: sortModel,
                    globalSearch: dataTable?.globalSearchTerm || undefined
                },
                {
                    columns: props.columns,
                    draw: 1,
                    customParams: props.customDataTableParams || {}
                }
            )
            emit('sort-changed', standardParams)
        } else {
            emit('sort-changed', sortModel)
        }
    }
}

// Handler pour réinitialiser tous les filtres
const handleClearAllFilters = () => {
    // Réinitialiser l'état local
    dataTable?.clearAllFilters()

    // Créer un nouveau QueryModel sans filtres
    fromDataTableParams({
        page: 1,
        pageSize: dataTable?.effectivePageSize || 10,
        sort: currentSortModel.value?.map(s => ({
            field: s.colId,
            direction: s.sort
        })),
        filters: {},
        globalSearch: undefined
    })

    // Si serverSideFiltering est activé, émettre les événements selon le mode configuré
    if (props.serverSideFiltering || props.serverSidePagination) {
        const queryModelData = createQueryModelFromDataTableParams({
            page: 1,
            pageSize: dataTable?.effectivePageSize || 10,
            sort: currentSortModel.value?.map(s => ({
                field: s.colId,
                direction: s.sort
            })),
            filters: {},
            globalSearch: undefined,
            customParams: props.customDataTableParams || {}
        })
        const output = convertQueryModelToOutput(queryModelData)
        emit('filter-changed', output as any)
        emit('global-search-changed', output as any)
    } else {
        // Format client-side
        emit('filter-changed', {})
        emit('global-search-changed', '')
    }
}

// Handler pour les changements de filtre
const handleFilterChanged = (filters: Record<string, any>) => {
    // IMPORTANT: Mettre à jour le filterState interne du DataTable IMMÉDIATEMENT
    // Le filterState doit être mis à jour même en mode server-side pour que le TableHeader puisse afficher le compteur
    // Les filtres viennent directement de TableBody dans le format { field: filter }
    // où filter contient { field, value/values, operator, dataType }
    if (dataTable && 'setFilterState' in dataTable && typeof dataTable.setFilterState === 'function') {
        // Mettre à jour le filterState directement avec les filtres reçus
        // setFilterState filtre déjà les valeurs vides
        dataTable.setFilterState(filters)
    }

    // Si serverSideFiltering est activé, convertir vers le format standard DataTable
    if (props.serverSideFiltering) {
        const standardParams = convertToStandardDataTableParams(
            {
                page: dataTable?.effectiveCurrentPage || 1,
                pageSize: dataTable?.effectivePageSize || 10,
                filters: filters,
                sort: currentSortModel.value,
                globalSearch: dataTable?.globalSearchTerm || undefined
            },
            {
                columns: props.columns,
                draw: 1,
                customParams: props.customDataTableParams || {}
            }
        )
        emit('filter-changed', standardParams)
    } else {
        emit('filter-changed', filters)
    }
}

// Handler pour les changements de sélection
const handleSelectionChanged = (selectedRows: Set<string>) => {
    // Mettre à jour les sélections dans useDataTable via la méthode setSelectedRows
    if (dataTable && typeof dataTable.setSelectedRows === 'function') {
        dataTable.setSelectedRows(selectedRows)
    }
    // Émettre vers le parent avec le nouveau Set
    emit('selection-changed', new Set(selectedRows))
}

// Fonction de formatage pour les dates (date seulement, sans heure)
const formatDateOnly = (value: any): string => {
    if (!value) return ''

    try {
        const date = new Date(value)
        if (isNaN(date.getTime())) return String(value)

        // Format français : DD/MM/YYYY
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
    } catch (error) {
        return String(value)
    }
}

// Appliquer le formatage aux colonnes de type date
const formattedColumns = computed(() => {
    // Créer la colonne de numéro de ligne automatique (toujours visible, fixée à gauche)
    const rowNumberColumn = dataTable?.createRowNumberColumn?.() || {
        field: '__rowNumber__',
        headerName: '#',
        sortable: false,
        filterable: false,
        width: 60,
        editable: false,
        visible: true,
        draggable: false,
        autoSize: false,
        hide: false,
        resizable: false,
        pinned: 'left', // Toujours fixée à gauche
        description: 'Numéro de ligne',
        dataType: 'text' as const,
        cellRenderer: (params: any) => {
            const currentPage = dataTable?.effectiveCurrentPage || 1
            const pageSize = dataTable?.effectivePageSize || 10
            const rowIndex = params?.rowIndex ?? 0
            const rowNumber = (currentPage - 1) * pageSize + rowIndex + 1
            return `<span class="row-number">${rowNumber}</span>`
        }
    };

    // Ajouter la colonne de numéro de ligne en première position
    const columnsWithRowNumber = [rowNumberColumn, ...props.columns];

    return columnsWithRowNumber.map(column => {
        // Utiliser le service cellRenderers pour détecter et appliquer les renderers appropriés
        const renderer = cellRenderersService.getRenderer(column);

        if (renderer) {
            return {
                ...column,
                valueFormatter: (params: any) => {
                    // Si la colonne a déjà un formateur personnalisé, l'utiliser
                    if (column.valueFormatter) {
                        return column.valueFormatter(params)
                    }
                    // Sinon, utiliser le renderer du service
                    return renderer(params.value, column, params.data, params.rowIndex)
                }
            }
        }

        // Fallback pour les colonnes de type date
        if (column.dataType === 'date' || column.dataType === 'datetime') {
            return {
                ...column,
                valueFormatter: (params: any) => {
                    // Si la colonne a déjà un formateur personnalisé, l'utiliser
                    if (column.valueFormatter) {
                        return column.valueFormatter(params)
                    }
                    // Sinon, appliquer le formatage de date
                    return formatDateOnly(params.value)
                }
            }
        }

        return column
    })
})

// Initialiser exportLoading avec les propriétés requises
const exportLoadingState = {
    csv: false,
    excel: false,
    pdf: false,
    csvSelection: false,
    excelSelection: false
}

// Extraire les noms des colonnes pour visibleColumns
const visibleColumnNames = computed(() => {
    if (!dataTable?.visibleColumns) return []

    // Utiliser directement les colonnes visibles du composable
    return dataTable.visibleColumns
})

// Filtrer les colonnes selon leur visibilité
const visibleColumns = computed(() => {
    if (!formattedColumns.value) {
        // Si pas de colonnes, créer au moins la colonne de numérotation
        const rowNumberColumn = dataTable?.createRowNumberColumn?.() || {
            field: '__rowNumber__',
            headerName: '#',
            sortable: false,
            filterable: false,
            width: 60,
            editable: false,
            visible: true,
            draggable: false,
            autoSize: false,
            hide: false,
            resizable: false,
            pinned: 'left',
            description: 'Numéro de ligne',
            dataType: 'text' as const
        }
        return [rowNumberColumn]
    }

    // Toujours inclure la colonne de numéro de ligne en premier
    let rowNumberColumn = formattedColumns.value.find(col => col.field === '__rowNumber__')

    // Si la colonne n'existe pas, la créer
    if (!rowNumberColumn) {
        rowNumberColumn = dataTable?.createRowNumberColumn?.() || {
            field: '__rowNumber__',
            headerName: '#',
            sortable: false,
            filterable: false,
            width: 60,
            editable: false,
            visible: true,
            draggable: false,
            autoSize: false,
            hide: false,
            resizable: false,
            pinned: 'left',
            description: 'Numéro de ligne',
            dataType: 'text' as const,
            cellRenderer: (params: any) => {
                const currentPage = dataTable?.effectiveCurrentPage || 1
                const pageSize = dataTable?.effectivePageSize || 10
                const rowIndex = params?.rowIndex ?? 0
                const rowNumber = (currentPage - 1) * pageSize + rowIndex + 1
                return `<span class="row-number">${rowNumber}</span>`
            }
        }
    }

    // Filtrer les autres colonnes selon leur visibilité
    let otherColumns: any[] = []
    if (dataTable?.visibleColumns && dataTable.visibleColumns.length > 0) {
        otherColumns = formattedColumns.value.filter(column =>
            column.field !== '__rowNumber__' && dataTable.visibleColumns.includes(column.field)
        )
    } else {
        // Si pas de visibleColumns défini, utiliser toutes les colonnes sauf __rowNumber__
        otherColumns = formattedColumns.value.filter(column => column.field !== '__rowNumber__')
    }

    // Toujours inclure la colonne de numéro de ligne en première position
    return [rowNumberColumn, ...otherColumns]
})

// Colonnes pour le gestionnaire (exclut les colonnes avec hide: true)
const columnsForManager = computed(() => {
    return formattedColumns.value.filter(column => column.hide !== true)
})

// Convertir selectedRows en Set<string>
const selectedRowsSet = computed(() => {
    // Si gestion automatique activée, utiliser les sélections automatiques
    if (autoDataTable) {
        return autoDataTable.selectedRows.value
    }
    if (!dataTable?.selectedRows) return new Set<string>()
    return new Set<string>(Array.from(dataTable.selectedRows).map(row => String(row)))
})

// Watcher pour les changements de colonnes visibles
watch(() => dataTable?.visibleColumns, (newVisibleColumns) => {
    if (newVisibleColumns) {
        logger.debug('Colonnes visibles mises à jour', newVisibleColumns)

        // S'assurer que __rowNumber__ est toujours inclus
        if (!newVisibleColumns.includes('__rowNumber__')) {
            dataTable?.handleVisibleColumnsChanged(
                ['__rowNumber__', ...newVisibleColumns],
                dataTable.columnWidths || {}
            )
            return
        }

        // S'assurer que __rowNumber__ est toujours épinglée à gauche
        if (columnPinning && columnPinning.getPinDirection('__rowNumber__') !== 'left') {
            columnPinning.pinColumn('__rowNumber__', 'left')
        }

        // Sauvegarder la configuration
        if (tableConfig) {
            tableConfig.updateVisibleColumns(newVisibleColumns)
            tableConfig.updateColumnOrder(newVisibleColumns)
        }
    }
}, { deep: true })

// Watcher pour les changements de largeurs de colonnes
watch(() => dataTable?.columnWidths, (newWidths) => {
    if (newWidths && tableConfig) {
        tableConfig.updateColumnWidths(newWidths)
    }
}, { deep: true })

// Charger la configuration au montage
onMounted(() => {
    if (tableConfig && props.storageKey) {
        // Charger la configuration sauvegardée
        tableConfig.loadConfig()

        // Appliquer les colonnes visibles sauvegardées
        if (tableConfig.visibleColumns.value.length > 0) {
            // S'assurer que __rowNumber__ est toujours inclus
            const savedColumns = tableConfig.visibleColumns.value
            const columnsWithRowNumber = savedColumns.includes('__rowNumber__')
                ? savedColumns
                : ['__rowNumber__', ...savedColumns]

            dataTable?.handleVisibleColumnsChanged(
                columnsWithRowNumber,
                tableConfig.columnWidths.value
            )
        }

        // Appliquer les largeurs sauvegardées
        if (Object.keys(tableConfig.columnWidths.value).length > 0) {
            Object.entries(tableConfig.columnWidths.value).forEach(([field, width]) => {
                if (dataTable) {
                    dataTable.columnWidths[field] = width
                }
            })
        }

        // Appliquer les colonnes épinglées sauvegardées
        // Toujours épingler __rowNumber__ à gauche en premier
        if (columnPinning) {
            columnPinning.pinColumn('__rowNumber__', 'left')

            // Ensuite appliquer les autres colonnes épinglées sauvegardées
            if (tableConfig.pinnedColumns.value.length > 0) {
                tableConfig.pinnedColumns.value.forEach(({ field, pinned }) => {
                    // Ne pas réappliquer __rowNumber__ car déjà épinglée
                    if (pinned && field !== '__rowNumber__') {
                        columnPinning.pinColumn(field, pinned)
                    }
                })
            }
        }

        // Appliquer le sticky header sauvegardé
        stickyHeaderState.value = tableConfig.stickyHeader.value

        // Appliquer la taille de page sauvegardée
        if (tableConfig.pageSize.value && dataTable) {
            dataTable.changePageSize(tableConfig.pageSize.value)
        }
    }
})

// === LOGIQUE DES FONCTIONNALITÉS AVANCÉES ===

// Données finales à afficher (avec groupement, pivot, etc.)
const finalRowData = computed(() => {
    // Pour la pagination côté serveur, utiliser directement rowDataProp
    // Pour la pagination côté client, utiliser paginatedData de useDataTable
    let data: any[] = []

    if (props.serverSidePagination) {
        // Pagination côté serveur : utiliser directement rowDataProp
        // Forcer la création d'un nouveau tableau pour garantir la réactivité
        const rowData = props.rowDataProp
        if (Array.isArray(rowData) && rowData.length > 0) {
            // Créer une copie complète pour forcer la réactivité
            data = rowData.map(item => ({ ...item }))
        } else {
            data = []
        }
    } else {
        // Pagination côté client : utiliser paginatedData de useDataTable
        if (Array.isArray(dataTable?.paginatedData) && dataTable.paginatedData.length > 0) {
            data = [...dataTable.paginatedData]
        } else if (Array.isArray(props.rowDataProp) && props.rowDataProp.length > 0) {
            data = [...props.rowDataProp]
        } else {
            data = []
        }
    }

    // Appliquer le groupement si activé
    if (grouping && grouping.groupedData.value) {
        data = grouping.groupedData.value
    }

    // Appliquer le pivot si activé
    if (pivot && pivot.pivotData.value) {
        data = pivot.pivotData.value
    }

    // Appliquer le virtual scrolling si activé
    if (virtualScrolling && virtualScrolling.visibleItems.value) {
        data = virtualScrolling.visibleItems.value
    }

    // Logger pour déboguer (seulement si serverSidePagination)
    if (props.serverSidePagination) {
        logger.debug('finalRowData computed (server-side)', {
            rowDataPropLength: Array.isArray(props.rowDataProp) ? props.rowDataProp.length : 0,
            rowDataPropIsArray: Array.isArray(props.rowDataProp),
            rowDataPropType: typeof props.rowDataProp,
            finalDataLength: data.length,
            isArray: Array.isArray(data),
            sample: data.length > 0 ? data.slice(0, 2).map((r: any) => ({ id: r?.id, ref: r?.reference })) : []
        })
    }

    return data
})

// Watcher pour forcer la mise à jour quand rowDataProp change (pour la pagination côté serveur)
watch(() => props.rowDataProp, (newData, oldData) => {
    if (props.serverSidePagination) {
        const newLength = Array.isArray(newData) ? newData.length : 0
        const oldLength = Array.isArray(oldData) ? oldData.length : 0

        logger.debug('DataTable: rowDataProp changed (server-side)', {
            oldLength,
            newLength,
            isArray: Array.isArray(newData),
            hasData: newLength > 0,
            sample: Array.isArray(newData) && newData.length > 0
                ? newData.slice(0, 2).map((r: any) => ({ id: r?.id, ref: r?.reference }))
                : []
        })

        // Forcer la mise à jour du computed en accédant à sa valeur
        // Cela déclenchera le re-render si nécessaire
        const currentData = finalRowData.value
        logger.debug('DataTable: finalRowData after watch', {
            length: currentData.length,
            sample: currentData.length > 0 ? currentData.slice(0, 2).map((r: any) => ({ id: r?.id, ref: r?.reference })) : []
        })
    }
}, { deep: true, immediate: true })

// Colonnes finales (avec colonnes de groupement si nécessaire)
const finalColumns = computed(() => {
    let columns = visibleColumns.value // Utiliser visibleColumns au lieu de formattedColumns

    // S'assurer que __rowNumber__ est toujours en première position et épinglée à gauche
    const rowNumberCol = columns.find(col => col.field === '__rowNumber__')
    const otherColumns = columns.filter(col => col.field !== '__rowNumber__')

    // Réorganiser : __rowNumber__ toujours en premier
    if (rowNumberCol) {
        columns = [rowNumberCol, ...otherColumns]
    }

    // Ajouter les colonnes de groupement si activé
    if (grouping && grouping.isGrouped.value) {
        const groupColumns = grouping.activeGroupings.value.map(config => ({
            field: config.field,
            headerName: config.label,
            sortable: config.sortable || false,
            filterable: false,
            width: 200,
            editable: false,
            visible: true,
            draggable: false,
            autoSize: true,
            dataType: 'text' as const,
            _isGroupColumn: true
        }))
        // Les colonnes de groupement avant __rowNumber__
        columns = [...groupColumns, ...columns]
    }

    // Appliquer l'ordre des colonnes avec pinning si activé
    if (columnPinning && props.enableColumnPinning) {
        // S'assurer que __rowNumber__ est toujours épinglée à gauche
        if (rowNumberCol && columnPinning.getPinDirection('__rowNumber__') !== 'left') {
            columnPinning.pinColumn('__rowNumber__', 'left')
        }

        const ordered = columnPinning.orderedColumns.value
        // S'assurer que __rowNumber__ est toujours en première position même après pinning
        const rowNumberInOrdered = ordered.find(col => col.field === '__rowNumber__')
        const otherColsInOrdered = ordered.filter(col => col.field !== '__rowNumber__')

        if (rowNumberInOrdered) {
            return [rowNumberInOrdered, ...otherColsInOrdered]
        }
        return ordered
    }

    return columns
})

// État de chargement combiné
const isLoading = computed(() => {
    return props.loading ||
        (virtualScrolling?.isLoadingMore.value || false) ||
        (editing?.state.value.isSaving || false) ||
        (masterDetail?.detailStates.value &&
            masterDetail.detailStates.value.size > 0 &&
            Array.from(masterDetail.detailStates.value.values()).some(state => state.isLoading))
})

// Méthode pour vider toutes les sélections
const clearAllSelections = () => {
    // Appeler d'abord la méthode de TableBody pour mettre à jour l'état visuel
    // Cela va émettre l'événement selection-changed qui sera géré par handleSelectionChanged
    if (tableBodyRef.value && typeof tableBodyRef.value.clearAllSelections === 'function') {
        tableBodyRef.value.clearAllSelections()
    } else {
        // Fallback : utiliser la méthode de useDataTable
        dataTable?.deselectAll()
    }
}

// Exposer les méthodes
defineExpose({
    clearAllSelections,
    setFilterState: dataTable?.setFilterState,
    filterState: computed(() => dataTable?.filterState),
    // QueryModel
    queryModel: computed(() => queryModel.value),
    toStandardParams,
    convertQueryModelToOutput,
    createQueryModelFromCurrentState
})
</script>

<style scoped>
/* Style pour la colonne de numéro de ligne */
.row-number {
    font-weight: 600;
    color: #6b7280;
    font-size: 0.875rem;
    text-align: center;
    display: inline-block;
    min-width: 2rem;
    padding: 0.25rem 0.5rem;
    background: linear-gradient(135deg, #f9fafb, #f3f4f6);
    border-radius: 0.375rem;
    border: 1px solid #e5e7eb;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition: all 0.2s ease;
}

.row-number:hover {
    background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dark .row-number {
    color: #9ca3af;
    background: linear-gradient(135deg, #374151, #4b5563);
    border-color: #4b5563;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.dark .row-number:hover {
    background: linear-gradient(135deg, #4b5563, #6b7280);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Amélioration générale du conteneur */
.data-table {
    background: linear-gradient(135deg, #ffffff, #f9fafb);
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    transition: all 0.3s ease;
}

.dark .data-table {
    background: linear-gradient(135deg, #1a202c, #2d3748);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

.data-table:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
}

.dark .data-table:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

/* Animation d'entrée pour le composant */
.data-table {
    animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Amélioration des transitions */
.data-table * {
    transition: all 0.2s ease;
}

/* Responsive design amélioré */
@media (max-width: 768px) {
    .data-table {
        border-radius: 0.75rem;
        margin: 0.5rem;
    }

    .row-number {
        min-width: 1.5rem;
        padding: 0.125rem 0.25rem;
        font-size: 0.75rem;
    }
}

@media (max-width: 640px) {
    .data-table {
        border-radius: 0.5rem;
        margin: 0.25rem;
    }

    .row-number {
        min-width: 1.25rem;
        padding: 0.125rem;
        font-size: 0.625rem;
    }
}

/* Amélioration pour les états de chargement */
.data-table.loading {
    opacity: 0.7;
    pointer-events: none;
}

.data-table.loading::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(254, 205, 28, 0.1) 50%, transparent 70%);
    animation: shimmer 1.5s infinite;
    pointer-events: none;
}

@keyframes shimmer {
    0% {
        transform: translateX(-100%);
    }

    100% {
        transform: translateX(100%);
    }
}

/* Amélioration pour les états d'erreur */
.data-table.error {
    border: 2px solid #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.dark .data-table.error {
    border-color: #f87171;
    box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.1);
}

/* Amélioration pour les états de succès */
.data-table.success {
    border: 2px solid #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.dark .data-table.success {
    border-color: #34d399;
    box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.1);
}

/* Amélioration pour les états d'avertissement */
.data-table.warning {
    border: 2px solid var(--color-warning);
    box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.1);
}

.dark .data-table.warning {
    border-color: var(--color-warning);
    box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.1);
}

/* Contrôles avancés */
.advanced-controls {
    @apply p-4 border-b border-gray-200 bg-gray-50;
}

.controls-group {
    @apply flex flex-wrap gap-4 items-center;
}

.grouping-controls,
.pivot-controls,
.editing-controls,
.master-detail-controls {
    @apply flex items-center gap-2;
}

.btn {
    @apply px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200;
}

.btn-sm {
    @apply px-2 py-1 text-xs;
}

.btn-outline {
    @apply border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400;
}

.btn-success {
    @apply bg-green-600 text-white hover:bg-green-700;
}

.btn-danger {
    @apply bg-red-600 text-white hover:bg-red-700;
}

.group-info {
    @apply text-sm text-gray-600 ml-2;
}

/* Virtual scrolling */
.virtual-scroll-container {
    @apply overflow-auto relative;
}

.virtual-scroll-content {
    @apply relative;
}

.virtual-scroll-transform {
    @apply absolute top-0 left-0 right-0;
}

/* Transition pour le changement de taille de page */
.table-fade-enter-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.table-fade-leave-active {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.table-fade-enter-from {
    opacity: 0;
    transform: translateY(10px);
}

.table-fade-enter-to {
    opacity: 1;
    transform: translateY(0);
}

.table-fade-leave-from {
    opacity: 1;
    transform: translateY(0);
}

.table-fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

/* Responsive */
@media (max-width: 768px) {
    .controls-group {
        @apply flex-col items-start gap-2;
    }

    .grouping-controls,
    .pivot-controls,
    .editing-controls,
    .master-detail-controls {
        @apply flex-wrap;
    }
}
</style>
