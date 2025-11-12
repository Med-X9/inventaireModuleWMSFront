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
                @update:globalSearchTerm="handleGlobalSearchUpdate" @clear-all-filters="dataTable?.clearAllFilters()" />

            <Toolbar :columns="columnsForManager" :visibleColumns="visibleColumnNames"
                :columnWidths="dataTable?.columnWidths" :rowSelection="dataTable?.rowSelection"
                :selectedRows="selectedRowsSet" :exportLoading="exportLoadingState" :loading="dataTable?.loading"
                @columns-changed="dataTable?.handleVisibleColumnsChanged" @reorder-columns="dataTable?.reorderColumns"
                @export-csv="emit('export-csv')" @export-excel="emit('export-excel')"
                @export-pdf="emit('export-pdf')" @export-selected-csv="emit('export-selected-csv')"
                @export-selected-excel="emit('export-selected-excel')" @deselect-all="dataTable?.deselectAll()" />

            <!-- Container avec virtual scrolling si activé -->
            <div v-if="virtualScrolling" :ref="virtualScrolling.containerRef" class="virtual-scroll-container"
                :style="{ height: props.virtualScrollingConfig?.containerHeight + 'px' }">
                <div class="virtual-scroll-content" :style="{ height: virtualScrolling.totalHeight + 'px' }">
                    <div class="virtual-scroll-transform"
                        :style="{ transform: `translateY(${virtualScrolling.transformY}px)` }">
                        <TableBody ref="tableBodyRef" :columns="finalColumns" :paginatedData="finalRowData"
                            :actions="dataTable?.actions" :loading="isLoading" :skeletonRowsCount="pageSizeProp || 10"
                            :currentSortField="currentSortField" :currentSortDirection="currentSortDirection"
                            :rowSelection="dataTable?.rowSelection" :selectedRows="selectedRowsSet"
                            :inlineEditing="props.inlineEditing" :editingState="editing?.state.value"
                            :masterDetailState="masterDetail?.detailStates"
                            :currentPage="dataTable?.effectiveCurrentPage || 1"
                            :pageSize="dataTable?.effectivePageSize || 10"
                            :globalStartIndex="(dataTable?.effectiveCurrentPage || 1) * (dataTable?.effectivePageSize || 10) - (dataTable?.effectivePageSize || 10)"
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
            <TableBody v-else ref="tableBodyRef" :columns="finalColumns" :paginatedData="finalRowData"
                :actions="dataTable?.actions" :loading="isLoading" :skeletonRowsCount="pageSizeProp || 10"
                :currentSortField="currentSortField" :currentSortDirection="currentSortDirection"
                :rowSelection="dataTable?.rowSelection" :selectedRows="selectedRowsSet"
                :inlineEditing="props.inlineEditing" :editingState="editing?.state.value"
                :masterDetailState="masterDetail?.detailStates" :currentPage="dataTable?.effectiveCurrentPage || 1"
                :pageSize="dataTable?.effectivePageSize || 10"
                :globalStartIndex="(dataTable?.effectiveCurrentPage || 1) * (dataTable?.effectivePageSize || 10) - (dataTable?.effectivePageSize || 10)"
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
                @page-changed="(page: any) => dataTable?.goToPage?.(page)"
                @page-size-changed="(size: any) => dataTable?.changePageSize?.(size)" />
        </template>
    </div>
</template>

<script setup lang="ts">
/* eslint-disable */
import { computed, ref, watch } from 'vue'
import type { DataTableProps } from '@/components/DataTable/types/dataTable'
import { cellRenderersService } from '@/services/cellRenderers'
import { logger } from '@/services/loggerService'
import TableHeader from './TableHeader.vue'
import Toolbar from './Toolbar.vue'
import TableBody from './TableBody.vue'
import Pagination from './Pagination.vue'
import DataTableSkeleton from './DataTableSkeleton.vue'

// Import des fonctionnalités avancées
import { useDataTable } from './composables/useDataTable'
import { useVirtualScrolling } from '@/composables/useVirtualScrolling'
import { useDataTableGrouping } from './composables/useDataTableGrouping'
import { useDataTableEditing } from './composables/useDataTableEditing'
import { useDataTablePivot } from './composables/useDataTablePivot'
import { useDataTableMasterDetail } from './composables/useDataTableMasterDetail'

const props = defineProps<DataTableProps>()
const emit = defineEmits<{
    'pagination-changed': [params: { page: number; pageSize: number; start: number; end: number }]
    'sort-changed': [sortModel: any]
    'filter-changed': [filterModel: any]
    'global-search-changed': [searchTerm: string]
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
}>()

const dataTable = useDataTable(props, emit)

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

// Référence au TableBody
const tableBodyRef = ref()

// État local pour le tri
const currentSortField = ref<string>('')
const currentSortDirection = ref<'asc' | 'desc'>('asc')

const handleGlobalSearchUpdate = (searchTerm: string) => {
    dataTable.updateGlobalSearchTerm(searchTerm)
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

    // Convertir le format pour correspondre à l'API
    const sortModel = sortData.isActive ? [{
        field: sortData.field,
        direction: sortData.direction
    }] : []

    emit('sort-changed', sortModel)
}

// Handler pour les changements de filtre
const handleFilterChanged = (filters: Record<string, any>) => {
    emit('filter-changed', filters)
}

// Handler pour les changements de sélection
const handleSelectionChanged = (selectedRows: Set<string>) => {
    // Mettre à jour les sélections dans useDataTable
    if (dataTable?.selectedRows) {
        // Si c'est un Ref, utiliser .value, sinon assigner directement
        if ('value' in dataTable.selectedRows) {
            dataTable.selectedRows.value = selectedRows
        } else {
            // Copier les valeurs du Set
            dataTable.selectedRows.clear()
            selectedRows.forEach(row => dataTable.selectedRows.add(row))
        }
    }
    // Émettre vers le parent
    emit('selection-changed', selectedRows)
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
    // Créer la colonne de numéro de ligne automatique
    const rowNumberColumn = dataTable?.createRowNumberColumn() || {
        field: '__rowNumber__',
        headerName: '#',
        sortable: false,
        filterable: false,
        width: 20,
        editable: false,
        visible: true,
        draggable: false,
        autoSize: false,
        hide: false,
        description: 'Numéro de ligne',
        dataType: 'text' as const
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
    if (!dataTable?.visibleColumns || !formattedColumns.value) return []

    // Toujours inclure la colonne de numéro de ligne
    const rowNumberColumn = formattedColumns.value.find(col => col.field === '__rowNumber__')
    const otherColumns = formattedColumns.value.filter(column =>
        column.field !== '__rowNumber__' && dataTable.visibleColumns.includes(column.field)
    )

    // Combiner la colonne de numéro de ligne avec les autres colonnes visibles
    return rowNumberColumn ? [rowNumberColumn, ...otherColumns] : otherColumns
})

// Colonnes pour le gestionnaire (exclut les colonnes avec hide: true)
const columnsForManager = computed(() => {
    return formattedColumns.value.filter(column => column.hide !== true)
})

// Convertir selectedRows en Set<string>
const selectedRowsSet = computed(() => {
    if (!dataTable?.selectedRows) return new Set<string>()
    return new Set<string>(Array.from(dataTable.selectedRows).map(row => String(row)))
})

// Watcher pour les changements de colonnes visibles
watch(() => dataTable?.visibleColumns, (newVisibleColumns) => {
    if (newVisibleColumns) {
        logger.debug('Colonnes visibles mises à jour', newVisibleColumns)
    }
}, { deep: true })

// === LOGIQUE DES FONCTIONNALITÉS AVANCÉES ===

// Données finales à afficher (avec groupement, pivot, etc.)
const finalRowData = computed(() => {
    let data = props.rowDataProp

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

    return data
})

// Colonnes finales (avec colonnes de groupement si nécessaire)
const finalColumns = computed(() => {
    let columns = visibleColumns.value // Utiliser visibleColumns au lieu de formattedColumns

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
        columns = [...groupColumns, ...columns]
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
    // Utiliser la méthode de useDataTable
    dataTable?.deselectAll()

    // Et aussi la méthode de TableBody si disponible
    if (tableBodyRef.value) {
        tableBodyRef.value.clearAllSelections()
    }
}

// Exposer les méthodes
defineExpose({
    clearAllSelections
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
    border: 2px solid #FECD1C;
    box-shadow: 0 0 0 3px rgba(254, 205, 28, 0.1);
}

.dark .data-table.warning {
    border-color: #fbbf24;
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
