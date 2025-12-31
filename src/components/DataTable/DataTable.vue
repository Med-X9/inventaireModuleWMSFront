<template>
    <div class="data-table" :class="{ 'data-table--virtual-scrolling': virtualScrolling }">
        <!-- Skeleton loader pendant le chargement -->
        <DataTableSkeleton v-if="isLoading" :columnsCount="finalColumns?.length || 5" :rowsCount="pageSizeProp || 20"
            :showActions="props.actions?.length > 0" />

        <!-- Contenu normal quand pas de chargement -->
        <template v-else>
            <!-- Toolbar avec contrôles des fonctionnalités avancées -->
            <!-- Toolbar avec contrôles des fonctionnalités avancées -->
            <div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                v-if="(grouping || false) || (pivot || false) || ((editing as any)?.state || false)">
                <div class="flex flex-wrap gap-4 items-center md:flex-row md:items-center md:gap-4">
                    <!-- Contrôles de groupement -->
                    <div v-if="grouping && typeof grouping === 'object'" class="flex items-center gap-2 flex-wrap">
                        <button @click="(grouping as any)?.expandAll?.()" class="px-2 py-1 text-xs font-medium rounded-md transition-colors duration-200 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500">
                            <i class="icon-expand"></i> Tout développer
                        </button>
                        <button @click="(grouping as any)?.collapseAll?.()" class="px-2 py-1 text-xs font-medium rounded-md transition-colors duration-200 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500">
                            <i class="icon-collapse"></i> Tout replier
                        </button>
                        <span class="text-sm text-gray-600 dark:text-gray-400 ml-2">
                            {{ (grouping as any)?.groupCount || 0 }} groupe(s), {{ (grouping as any)?.expandedCount || 0 }} développé(s)
                        </span>
                    </div>

                    <!-- Contrôles de pivot -->
                    <div v-if="pivot && typeof pivot === 'object'" class="flex items-center gap-2 flex-wrap">
                        <button @click="(pivot as any)?.expandAll?.()" class="px-2 py-1 text-xs font-medium rounded-md transition-colors duration-200 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500">
                            <i class="icon-expand"></i> Développer pivot
                        </button>
                        <button @click="(pivot as any)?.collapseAll?.()" class="px-2 py-1 text-xs font-medium rounded-md transition-colors duration-200 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500">
                            <i class="icon-collapse"></i> Replier pivot
                        </button>
                    </div>

                    <!-- Contrôles d'édition -->
                    <div v-if="editing && typeof editing === 'object'" class="flex items-center gap-2 flex-wrap">
                        <button @click="(editing as any)?.enableBatchMode?.()" class="px-2 py-1 text-xs font-medium rounded-md transition-colors duration-200 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500">
                            <i class="icon-edit"></i> Mode lot
                        </button>
                        <button @click="(editing as any)?.saveAllPendingChanges?.()" class="px-2 py-1 text-xs font-medium rounded-md transition-colors duration-200 bg-green-600 text-white hover:bg-green-700">
                            <i class="icon-save"></i> Sauvegarder
                        </button>
                        <button @click="(editing as any)?.discardAllPendingChanges?.()" class="px-2 py-1 text-xs font-medium rounded-md transition-colors duration-200 bg-red-600 text-white hover:bg-red-700">
                            <i class="icon-cancel"></i> Annuler
                        </button>
                    </div>

                    <!-- Contrôles master/detail -->
                    <div v-if="masterDetail && typeof masterDetail === 'object'" class="flex items-center gap-2 flex-wrap">
                        <button @click="(masterDetail as any)?.expandAllDetails?.()" class="px-2 py-1 text-xs font-medium rounded-md transition-colors duration-200 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500">
                            <i class="icon-expand"></i> Développer détails
                        </button>
                        <button @click="(masterDetail as any)?.collapseAllDetails?.()" class="px-2 py-1 text-xs font-medium rounded-md transition-colors duration-200 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500">
                            <i class="icon-collapse"></i> Replier détails
                        </button>
                    </div>
                </div>
            </div>

            <TableHeader :globalSearchTerm="dataTable?.globalSearchTerm" :filterState="dataTable?.filterState"
                :advancedFilters="advancedFilters" :loading="dataTable?.loading"
                @update:globalSearchTerm="handleGlobalSearchUpdate"
                @clear-all-filters="handleClearAllFilters" />

            <Toolbar :columns="columnsForManager" :visibleColumns="visibleColumnNames"
                :columnWidths="dataTable?.columnWidths" :rowSelection="props.rowSelection ?? false"
                :selectedRows="selectedRowsSet" :exportLoading="exportLoadingState" :loading="dataTable?.loading"
                :enableColumnPinning="props.enableColumnPinning || false"
                :columnPinning="columnPinning"
                :stickyHeader="stickyHeaderState"
                :defaultVisibleColumnsCount="defaultVisibleColumnsCountState"
                @export-csv="emit('export-csv')"
                @export-spreadsheet="emit('export-spreadsheet')"
                @export-pdf="emit('export-pdf')"
                @export-selected-csv="emit('export-selected-csv')"
                @export-selected-spreadsheet="emit('export-selected-spreadsheet')"
                @deselect-all="dataTable?.deselectAll()" />

            <!-- Pagination dans le header -->
            <Pagination
                :key="`pagination-${dataTable?.effectivePageSize}`"
                :currentPage="props.currentPageProp ?? dataTable?.effectiveCurrentPage ?? 1"
                :totalPages="props.totalPagesProp ?? dataTable?.effectiveTotalPages ?? 1"
                :totalItems="dataTable?.effectiveTotalItems || 0"
                :pageSize="dataTable?.effectivePageSize || 20" :total="dataTable?.effectiveTotalItems || 0"
                :start="dataTable?.start || 0" :end="dataTable?.end || 0" :loading="dataTable?.loading || false"
                @page-changed="handlePaginationChanged"
                @page-size-changed="handlePageSizeChanged" />

            <!-- Container avec virtual scrolling si activé -->
            <div v-if="virtualScrolling" :ref="virtualScrolling.containerRef" class="overflow-auto relative virtual-scroll-container"
                :style="{
                  height: effectiveVirtualScrollingConfig?.containerHeight + 'px',
                  '--virtual-scroll-height': effectiveVirtualScrollingConfig?.containerHeight + 'px'
                }">
                <div class="relative" :style="{ height: virtualScrolling.totalHeight + 'px' }">
                    <div class="absolute top-0 left-0 right-0"
                        :style="{ transform: `translateY(${virtualScrolling.transformY}px)` }">
                        <TableBody ref="tableBodyRef" :columns="finalColumns" :paginatedData="finalRowData" :key="`virtual-${finalRowData.length}`"
                            :actions="actions" :loading="isLoading" :skeletonRowsCount="pageSizeProp || 20"
                            :currentSortField="currentSortField" :currentSortDirection="currentSortDirection"
                            :rowSelection="props.rowSelection ?? false" :selectedRows="selectedRowsSet"
                            :inlineEditing="props.inlineEditing" :editingState="(editing as any)?.state?.value"
                            :masterDetailState="masterDetail?.detailStates"
                            :currentPage="dataTable?.effectiveCurrentPage"
                            :pageSize="dataTable?.effectivePageSize"
                            :globalStartIndex="((dataTable?.effectiveCurrentPage - 1) * dataTable?.effectivePageSize)"
                            :defaultVisibleColumnsCount="defaultVisibleColumnsCountState"
                            :visibleColumnNames="visibleColumnNames"
                            :enableRowClick="props.enableRowClick || false"
                            :empty-state-title="props.emptyStateConfig?.title"
                            :empty-state-description="props.emptyStateConfig?.description"
                            :empty-state-icon="props.emptyStateConfig?.icon"
                            :empty-state-actions="props.emptyStateConfig?.actions"
                            :forbidden-state-title="props.forbiddenStateConfig?.title"
                            :forbidden-state-description="props.forbiddenStateConfig?.description"
                            :forbidden-state-icon="props.forbiddenStateConfig?.icon"
                            :forbidden-state-actions="props.forbiddenStateConfig?.actions"
                            :forbidden="props.forbidden"
                            :has-active-filters="hasActiveFilters"
                            :has-active-search="hasActiveSearch"
                            @sort-changed="handleSortChanged"
                            @filter-changed="handleFilterChangedWrapper"
                            @selection-changed="handleSelectionChanged"
                            @cell-value-changed="(event) => emit('cell-value-changed', event)"
                            @row-clicked="(row: any) => emit('row-clicked', row)"
                            @group-toggle="(groupKey: any) => (grouping as any)?.toggleGroup?.(groupKey)"
                            @detail-toggle="(rowId: any) => (masterDetail as any)?.toggleDetail?.(rowId)"
                            @edit-start="(row: any, field: any) => (editing as any)?.startEditing?.(row, field)"
                            @edit-stop="(save: any) => (editing as any)?.stopEditing?.(save, undefined, undefined)"
                            @edit-value-update="(value: any) => (editing as any)?.updateEditingValue?.(value)" />
                    </div>
                </div>
            </div>

            <!-- TableBody normal si pas de virtual scrolling -->
            <!-- Key optimisée : utiliser un hash simple au lieu de JSON.stringify -->
            <TableBody v-if="!virtualScrolling" :key="`table-${dataTable?.effectivePageSize}-${dataTable?.effectiveCurrentPage}-${finalRowData.length}-${tableDataHash}`" ref="tableBodyRef" :columns="finalColumns" :paginatedData="finalRowData"
                    :actions="actions" :loading="isLoading" :skeletonRowsCount="pageSizeProp || 20"
                    :currentSortField="currentSortField" :currentSortDirection="currentSortDirection"
                    :rowSelection="props.rowSelection ?? false" :selectedRows="selectedRowsSet"
                    :inlineEditing="props.inlineEditing" :editingState="(editing as any)?.state?.value"
                    :masterDetailState="masterDetail?.detailStates" :currentPage="dataTable?.effectiveCurrentPage || 1"
                    :pageSize="dataTable?.effectivePageSize"
                    :globalStartIndex="((dataTable?.effectiveCurrentPage - 1) * dataTable?.effectivePageSize)"
                    :columnPinning="columnPinning"
                    :enableColumnPinning="shouldEnableColumnPinning"
                    :stickyHeader="stickyHeaderState"
                    :defaultVisibleColumnsCount="defaultVisibleColumnsCountState"
                    :visibleColumnNames="visibleColumnNames"
                    :enableRowClick="props.enableRowClick || false"
                    :empty-state-title="props.emptyStateConfig?.title"
                    :empty-state-description="props.emptyStateConfig?.description"
                    :empty-state-icon="props.emptyStateConfig?.icon"
                    :empty-state-actions="props.emptyStateConfig?.actions"
                    :forbidden-state-title="props.forbiddenStateConfig?.title"
                    :forbidden-state-description="props.forbiddenStateConfig?.description"
                    :forbidden-state-icon="props.forbiddenStateConfig?.icon"
                    :forbidden-state-actions="props.forbiddenStateConfig?.actions"
                    :forbidden="props.forbidden"
                    :has-active-filters="hasActiveFilters"
                    :has-active-search="hasActiveSearch"
                    @sort-changed="handleSortChanged"
                    @filter-changed="handleFilterChangedWrapper"
                    @selection-changed="handleSelectionChanged"
                    @cell-value-changed="(event) => emit('cell-value-changed', event)"
                    @row-clicked="(row: any) => emit('row-clicked', row)"
                    @group-toggle="(groupKey: any) => (grouping as any)?.toggleGroup?.(groupKey)"
                    @detail-toggle="(rowId: any) => (masterDetail as any)?.toggleDetail?.(rowId)"
                    @edit-start="(row: any, field: any) => (editing as any)?.startEditing?.(row, field)"
                    @edit-stop="(save: any) => (editing as any)?.stopEditing?.(save, undefined, undefined)"
                    @edit-value-update="(value: any) => (editing as any)?.updateEditingValue?.(value)" />
        </template>
    </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'

/**
 * DataTable - Composant de table de données avancé
 *
 * @component DataTable
 *
 * Fonctionnalités :
 * - Pagination (client et serveur)
 * - Tri multi-colonnes
 * - Filtrage avancé
 * - Recherche globale
 * - Sélection multiple
 * - Export (CSV, Excel, PDF)
 * - Édition inline
 * - Groupement de lignes
 * - Virtual scrolling
 * - Colonnes épinglées
 *
 * Format de communication :
 * - Utilise UNIQUEMENT QueryModel pour tous les événements
 * - Émet QueryModel via @pagination-changed, @sort-changed, @filter-changed, @global-search-changed
 * - Convertit QueryModel vers query params GET pour l'API
 *
 * @see QueryModel dans types/QueryModel.ts
 */

import { computed } from 'vue'
import type { DataTableProps, ActionConfig } from '@/components/DataTable/types/dataTable'
import type { QueryModel } from './types/QueryModel'
import TableHeader from './TableHeader.vue'
import Toolbar from './Toolbar.vue'
import TableBody from './TableBody.vue'
import Pagination from './Pagination.vue'
import DataTableSkeleton from './DataTableSkeleton.vue'

// Composable principal qui contient toute la logique
import { useDataTableComponent } from './composables/useDataTableComponent'

// Props et emits avec valeurs par défaut pour activer toutes les fonctionnalités
const props = withDefaults(defineProps<DataTableProps<Record<string, unknown>>>(), {
    // Fonctionnalités core activées par défaut (server-side DataTable)
    serverSidePagination: true,     // Pagination côté serveur ACTIVÉE
    serverSideFiltering: true,      // Filtrage côté serveur ACTIVÉ
    serverSideSorting: true,        // Tri côté serveur ACTIVÉ
    enableFiltering: true,          // Filtres de colonnes ACTIVÉS
    enableGlobalSearch: true,       // Recherche globale ACTIVÉE
    pagination: true,               // Pagination ACTIVÉE
    showColumnSelector: true,       // Sélecteur de colonnes ACTIVÉ

    // Fonctionnalités avancées activées par défaut
    enableMultiSort: true,          // Tri multi-colonnes ACTIVÉ
    enableColumnPinning: true,       // Épinglage colonnes ACTIVÉ
    enableColumnResize: true,        // Redimensionnement ACTIVÉ

    // Persistance activée par défaut avec clé générique
    storageKey: 'datatable',         // Persistance ACTIVÉE

    // Fonctionnalités optionnelles avec valeurs par défaut sûres
    rowSelection: false,             // Sélection multiple DÉSACTIVÉE
    inlineEditing: false,            // Édition inline DÉSACTIVÉE
    enableVirtualScrolling: false,   // Virtual scrolling DÉSACTIVÉ
    enableGrouping: false,           // Groupement DÉSACTIVÉ
    enableAdvancedEditing: false,    // Édition avancée DÉSACTIVÉE
    enablePivot: false,              // Pivot DÉSACTIVÉ
    enableMasterDetail: false,       // Master/Detail DÉSACTIVÉ
    enableInfiniteScroll: false,     // Scroll infini DÉSACTIVÉ
    enableSetFilters: false,         // Filtres par ensemble DÉSACTIVÉS

    // Props avec valeurs par défaut sûres
    advancedFilters: () => ({}),     // Objet vide par défaut
    actions: () => [],               // Array vide par défaut
    rowDataProp: () => [],           // Array vide par défaut
    defaultVisibleColumnsCount: 50   // Nombre de colonnes visibles par défaut
})
const emit = defineEmits<{
    'pagination-changed': [queryModel: QueryModel]
    'page-size-changed': [queryModel: QueryModel]
    'sort-changed': [queryModel: QueryModel]
    'filter-changed': [queryModel: QueryModel]
    'global-search-changed': [queryModel: QueryModel]
    'selection-changed': [selectedRows: Set<string>]
    'cell-value-changed': [event: { data: any; field: string; newValue: any; oldValue: any }]
    'grouping-changed': [groups: any[]]
    'pivot-changed': [pivotData: any]
    'master-detail-changed': [detailState: any]
    'row-clicked': [rowId: string]
    'export-spreadsheet': []
    'export-csv': []
    'export-pdf': []
    'export-selected-csv': []
    'export-selected-spreadsheet': []
    'query-model-changed': [queryModel: QueryModel]
}>()

// Utiliser le composable qui contient toute la logique
const {
    // État de base
    dataTable,
    queryModel,
    tableConfig,
    autoDataTable,

    // Fonctionnalités avancées
    virtualScrolling,
    effectiveVirtualScrollingConfig,
    grouping,
    editing,
    pivot,
    masterDetail,
    multiSort,
    columnPinning,
    columnResize,

    // Références
    tableBodyRef,

    // État du tri
    currentSortField,
    currentSortDirection,

    // Propriétés qui existent encore
    handlePaginationChanged,
    handlePageSizeChanged,
    handleSortChanged,
    handleFilterChanged,
    handleGlobalSearchUpdate,
    handleClearAllFilters,
    handleSelectionChanged,
    createQueryModelFromCurrentState,
    visibleColumnNames,
    columnsForManager,
    finalColumns,
    finalRowData,
    tableDataHash,
    selectedRowsSet,
    isLoading,
    exportLoadingState,
    hasActiveFilters,
    hasActiveSearch,
    stickyHeaderState,
    defaultVisibleColumnsCountState,
    shouldEnableColumnPinning,
    clearAllSelections,
    pageSizeProp,
    actions,
    advancedFilters,

} = useDataTableComponent({ props, emit })


// ===== WRAPPER POUR CONVERTIR LES FILTRES EN QUERYMODEL =====

/**
 * Wrapper pour convertir les filtres bruts de TableBody en QueryModel
 *
 * TableBody émet directement les filtres (objet réactif Proxy), mais handleFilterChanged attend un QueryModel.
 * Ce wrapper convertit automatiquement les filtres en QueryModel avant de les passer au handler.
 *
 * ⚠️ IMPORTANT : Convertit les Proxy réactifs Vue en objets plain pour garantir la sérialisation correcte.
 *
 * @param filters - Filtres bruts depuis TableBody (Proxy réactif) ou QueryModel depuis d'autres sources
 */
const handleFilterChangedWrapper = async (filters: Record<string, any> | QueryModel) => {
    console.log('[DataTable] handleFilterChangedWrapper - Paramètres reçus:', filters)

    // Simplifier : traiter toujours comme des filtres bruts depuis TableBody
    // La logique complexe de détection créait des problèmes de double sérialisation

    if (!filters || typeof filters !== 'object') {
        console.warn('[DataTable] handleFilterChangedWrapper - Paramètres invalides')
        return
    }

    // Convertir le Proxy réactif en objet plain
        let filtersPlain: Record<string, any> = {}
        try {
        filtersPlain = JSON.parse(JSON.stringify(filters))
                        } catch (e) {
        console.warn('[DataTable] handleFilterChangedWrapper - Erreur de conversion, utilisation directe')
        filtersPlain = { ...filters } as Record<string, any>
        }

    // Vérifier si c'est un QueryModel imbriqué (cas d'erreur)
        if (filtersPlain && typeof filtersPlain === 'object') {
            const filterKeys = Object.keys(filtersPlain)
            const hasQueryModelKeys = filterKeys.some(key => ['page', 'pageSize', 'filters', 'sort', 'search', 'customParams'].includes(key))

            if (hasQueryModelKeys && 'filters' in filtersPlain && typeof filtersPlain.filters === 'object') {
            console.warn('[DataTable] handleFilterChangedWrapper - QueryModel imbriqué détecté, extraction des filtres')
                filtersPlain = filtersPlain.filters || {}
            }
        }

    console.log('[DataTable] handleFilterChangedWrapper - Filtres convertis:', filtersPlain)

    // Convertir vers le format attendu par le backend
        const filtersConverted: Record<string, any> = {}
        for (const [fieldName, filterData] of Object.entries(filtersPlain)) {
            if (filterData && typeof filterData === 'object') {
            // Format simple pour les selects multi
                if (filterData.operator === 'in' && filterData.values && Array.isArray(filterData.values)) {
                    filtersConverted[fieldName] = filterData.values
                } else if (filterData.operator && filterData.value !== undefined) {
                // Format backend: { type: operator, filter: value }
                    filtersConverted[fieldName] = {
                    type: filterData.operator,  // 'equals', 'contains', etc.
                    filter: filterData.value    // la valeur du filtre
                    }
                // Support pour les ranges (si nécessaire)
                if (filterData.value2 !== undefined && filterData.operator === 'between') {
                        filtersConverted[fieldName].from = filterData.value
                        filtersConverted[fieldName].to = filterData.value2
                    filtersConverted[fieldName].type = 'range'
                    delete filtersConverted[fieldName].filter
                    }
                } else {
                // Fallback
                    filtersConverted[fieldName] = filterData
                }
            }
        }

    // Créer le QueryModel final
    const currentQueryModel = createQueryModelFromCurrentState()
    const queryModelWithFilters: QueryModel = {
        page: 1, // Reset to page 1 on filter change
        pageSize: currentQueryModel.pageSize ?? (props.serverSidePagination
            ? (props.pageSizeProp ?? dataTable?.effectivePageSize ?? 20)
            : (dataTable?.effectivePageSize || 20)),
        sort: currentQueryModel.sort,
        filters: filtersConverted,
        search: currentQueryModel.search,
        customParams: currentQueryModel.customParams
    }

    console.log('[DataTable] handleFilterChangedWrapper - QueryModel final:', queryModelWithFilters)
    console.log('[DataTable] handleFilterChangedWrapper - Filters final:', queryModelWithFilters.filters)

    await handleFilterChanged(queryModelWithFilters)
}

// Exposer les méthodes
defineExpose({
    clearAllSelections,
    // Propriétés pour éviter les warnings Vue
    effectiveCurrentPage: computed(() => dataTable?.effectiveCurrentPage || 1),
    effectivePageSize: computed(() => dataTable?.effectivePageSize || 20),

    setFilterState: dataTable?.setFilterState,
    filterState: computed(() => dataTable?.filterState),
    queryModel: computed(() => queryModel.value),
    createQueryModelFromCurrentState
})
</script>
