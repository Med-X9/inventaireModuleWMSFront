<template>
  <div>
    <div class="flex flex-col mb-3 md:flex-row justify-between gap-4">
      <!-- Column Selector -->
      <div class="flex flex-col mb-4 md:flex-row gap-4 w-full">
        <div
          v-if="showColumnSelector"
          ref="dropdownRef"
          class="relative w-full md:w-72 select-wrapper"
        >
          <button
            @click="toggleDropdown"
            class="flex items-center justify-between p-2 dark:bg-dark-bg dark:border-dark-border dark:text-white-dark bg-white border rounded text-sm text-gray-700 shadow-sm hover:border-gray-300 w-full"
          >
            <span>Sélectionner colonnes</span>
            <svg
              class="w-4 h-4 ml-2 transition-transform"
              :class="{ 'rotate-180': showDropdown }"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          <div
            v-if="showDropdown"
            class="absolute top-full left-0 w-full dark:bg-dark-bg dark:border-dark-border dark:text-white-dark bg-white border rounded shadow-md z-10 p-2 max-h-64 overflow-y-auto"
            @click.stop
          >
            <button
              @click.stop="resetVisibleFields"
              class="flex items-center dark:hover:bg-dark-light/10 gap-2 w-full text-sm text-primary px-2 py-1 mb-3 hover:bg-gray-500/10"
            >
              Réinitialiser
            </button>

            <div
              v-for="col in columns"
              :key="col.field!"
              class="mb-2"
            >
              <Tooltip 
                :text="(col as DataTableColumn).description" 
                position="right"
                :delay="300"
              >
                <label class="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-light/10 p-1 rounded">
                  <input
                    type="checkbox"
                    :value="col.field!"
                    v-model="visibleFields"
                    :disabled="visibleFields.length <= minVisibleColumns && visibleFields.includes(col.field!)"
                    class="form-checkbox accent-primary focus:ring-primary"
                  />
                  <span class="flex items-center gap-1">
                    {{ col.headerName || col.field }}
                    <svg
                      v-if="(col as DataTableColumn).description"
                      class="w-3 h-3 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </span>
                </label>
              </Tooltip>
            </div>
          </div>
        </div>
        <slot name="contenu" />
      </div>

      <!-- Export Dropdown -->
      <div class="flex-shrink-0 flex gap-2 mb-4 md:mb-0">
        <slot name="table-actions" />
        <div class="relative" ref="exportDropdownRef">
          <button
            @click="toggleExportDropdown"
            class="flex items-center justify-between p-2 btn text-gray-700 shadow-sm hover:border-gray-300 w-full md:w-auto"
          >
            <span class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Exporter
            </span>
            <svg
              class="w-4 h-4 ml-2 transition-transform"
              :class="{ 'rotate-180': showExportDropdown }"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div
            v-if="showExportDropdown"
            class="absolute right-0 mt-2 w-48 dark:bg-dark-bg dark:border-dark-border dark:text-white-dark bg-white border rounded shadow-md z-10 p-2"
            @click.stop
          >
            <button
              @click="exportToCsv"
              class="flex items-center gap-2 w-full text-sm px-2 py-1 hover:bg-gray-100 rounded"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              CSV
            </button>
            <button
              @click="exportToExcel"
              class="flex items-center gap-2 w-full text-sm px-2 py-1 hover:bg-gray-100 rounded"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Excel
            </button>
            <button
              @click="exportToPdf"
              class="flex items-center gap-2 w-full text-sm px-2 py-1 hover:bg-gray-100 rounded"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              PDF
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- AG Grid Table -->
    <div v-if="rowData !== undefined" class="table-container">
      <ag-grid-vue
        class="ag-theme-alpine"
        :style="dynamicGridStyle"
        domLayout="normal"
        @grid-ready="handleGridReady"
        @first-data-rendered="handleFirstDataRendered"
        @selection-changed="handleSelectionChanged"
        @row-clicked="$emit('row-clicked', $event)"
        @model-updated="handleModelUpdated"
        @cell-value-changed="handleCellValueChanged"
        :columnDefs="computedVisibleColumnDefsWithIndex"
        :defaultColDef="defaultColDef"
        :rowData="rowData"
        :pagination="pagination"
        :paginationPageSize="pageSize"
        :paginationPageSizeSelector="[5, 10, 20, 50, 100]"
        :rowSelection="
          rowSelection
            ? {
                mode: 'multiRow',
                checkboxes: true,
                headerCheckbox: true,
              }
            : undefined
        "
        :selectionColumnDef="{
          minWidth: 65,
          maxWidth: 70,
          cellClass: 'text-left',
        }"
        :singleClickEdit="inlineEditing"
        :stopEditingWhenCellsLoseFocus="false"
        @cellKeyDown="handleCellKeyDown"
        @cellEditingStopped="handleCellEditingStopped"
        :components="{ ActionMenu }"
      />
    </div>

    <div v-if="rowData.length === 0" class="text-center text-gray-500 mt-4">
      Aucun enregistrement à afficher.
    </div>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, unknown> = Record<string, unknown>">
import { defineEmits } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import type { PropType } from 'vue'
import type { SelectionChangedEvent, CellKeyDownEvent, CellEditingStoppedEvent, ModelUpdatedEvent, CellValueChangedEvent } from 'ag-grid-community'
import type { ActionConfig, DataTableColumn } from '@/interfaces/dataTable'
import { useDataTable } from '@/composables/useDataTable'
import ActionMenu from './ActionMenu.vue'
import Tooltip from '../Tooltip.vue'

const emit = defineEmits<{
  'selection-changed': [selectedRows: T[]]
  'row-clicked': [event: any]
  'cell-value-changed': [event: CellValueChangedEvent]
}>()

const props = defineProps({
  columns: { type: Array as PropType<DataTableColumn[]>, required: true },
  rowDataProp: { type: Array as PropType<T[]>, default: () => [] },
  dataUrl: String,
  enableFiltering: { type: Boolean, default: true },
  pagination: { type: Boolean, default: true },
  storageKey: { type: String, default: 'visibleFields' },
  showColumnSelector: { type: Boolean, default: true },
  actions: { type: Array as PropType<ActionConfig<T>[]>, default: () => [] },
  actionsHeaderName: { type: String, default: 'Actions' },
  rowSelection: { type: Boolean, default: false },
  exportTitle: { type: String, default: 'Export de données' },
  inlineEditing: { type: Boolean, default: false },
  maxRowsForDynamicHeight: { type: Number, default: 10 }
})

// Use DataTable composable
const {
  // Grid state
  rowData,
  pageSize,
  dynamicGridStyle,
  defaultColDef,

  // Column management
  visibleFields,
  showDropdown,
  dropdownRef,
  minVisibleColumns,
  computedVisibleColumnDefsWithIndex,
  toggleDropdown,
  resetVisibleFields,

  // Export functionality
  showExportDropdown,
  exportDropdownRef,
  toggleExportDropdown,
  exportToCsv,
  exportToExcel,
  exportToPdf,

  // Event handlers
  onGridReady,
  onFirstDataRendered,
  onModelUpdated,
  onSelectionChanged,
  onCellKeyDown,
  onCellEditingStopped,
} = useDataTable(props)

// Wrapper event handlers
const handleGridReady = (event: any) => {
  onGridReady(event)
}

const handleFirstDataRendered = (event: any) => {
  onFirstDataRendered(event)
}

const handleModelUpdated = (event: ModelUpdatedEvent) => {
  onModelUpdated(event)
}

const handleSelectionChanged = (event: SelectionChangedEvent) => {
  onSelectionChanged(event, (selectedRows) => {
    emit('selection-changed', selectedRows)
  })
}

const handleCellKeyDown = (event: CellKeyDownEvent) => {
  onCellKeyDown(event)
}

const handleCellEditingStopped = (event: CellEditingStoppedEvent) => {
  onCellEditingStopped(event, (changeEvent) => {
    emit('cell-value-changed', changeEvent)
  })
}

const handleCellValueChanged = (event: CellValueChangedEvent) => {
  emit('cell-value-changed', event)
}
</script>

<style scoped>
.table-container {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.dark .table-container {
  border-color: #374151;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2);
}

.table-container :deep(.ag-root-wrapper) {
  border: none !important;
}

.table-container :deep(.ag-header) {
  border-top: none !important;
}

:deep(.ag-header-cell-text), 
:deep(.ag-header-cell-label) {
  font-size: 13.5px;
}

:deep(.ag-cell) {
  font-size: 12.5px;
}

:deep(.ag-paging-panel), 
:deep(.ag-pagination-button), 
:deep(.ag-page-size-panel), 
:deep(.ag-page-size), 
:deep(.ag-input-field-input) {
  font-size: 13.5px;
}

@media (max-width: 640px) {
  :deep(.ag-pagination-button) {
    min-width: 1.2rem;
    height: 1.2rem;
    padding: 0.15rem;
  }

  :deep(.ag-paging-panel), 
  :deep(.ag-pagination-button), 
  :deep(.ag-page-size-panel), 
  :deep(.ag-page-size), 
  :deep(.ag-input-field-input) {
    font-size: 6.5px;
    padding: 0.3rem;
  }
}
</style>