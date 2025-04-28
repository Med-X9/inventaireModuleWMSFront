<template>
  <div class="panel px-6 py-10 border-[#e0e6ed] dark:border-[#1b2e4b]">
    <!-- Header : colonnes + slot externes -->
    <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
      <div
        v-if="showColumnSelector"
        ref="dropdownRef"
        class="relative w-full md:w-72 select-wrapper"
      >
        <button
          @click="toggleDropdown"
          class="flex items-center justify-between p-2 bg-white border rounded text-sm text-gray-700 shadow-sm hover:border-gray-400 w-full"
        >
          <span>Sélectionner colonnes</span>
          <svg
            class="w-4 h-4 ml-2 transition-transform"
            :class="{ 'rotate-180': showDropdown }"
            xmlns="http://www.w3.org/2000/svg"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div
          v-if="showDropdown"
          class="absolute top-full left-0 w-full bg-white border rounded shadow-md z-10 p-2 max-h-64 overflow-y-auto"
          @click.stop
        >
          <button
            @click.stop="resetVisibleFields"
            class="flex items-center gap-2 w-full text-sm text-primary px-2 py-1 mb-3 hover:bg-gray-100"
          >
            Réinitialiser
          </button>
          <label
            v-for="col in columns"
            :key="col.field"
            class="flex items-center gap-2 mb-2 text-sm"
          >
            <input
              type="checkbox"
              :value="col.field"
              v-model="visibleFields"
              :disabled="visibleFields.length <= minVisibleColumns && visibleFields.includes(col.field!)"
              class="form-checkbox accent-primary focus:ring-primary"
            />
            {{ col.headerName || col.field }}
          </label>
        </div>
      </div>

      <div class="flex-shrink-0">
        <slot name="table-actions" />
      </div>
    </div>

    <!-- AG Grid -->
    <ag-grid-vue
      class="ag-theme-alpine"
      style="width:100%;height:400px"
      @grid-ready="onGridReady"
      @first-data-rendered="onFirstDataRendered"
      :columnDefs="computedVisibleColumnDefs"
      :defaultColDef="defaultColDef"
      :rowData="rowData"
      :pagination="pagination"
      :paginationPageSize="pageSize"
    />

    <div v-if="rowData.length===0" class="text-center text-gray-500 mt-4">
      Aucun enregistrement à afficher.
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, toRefs } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import type { PropType } from 'vue'
import type { ColDef } from 'ag-grid-community'
import type { ActionConfig } from '@/interfaces/dataTable'
import { useDataTable } from '@/composables/useDataTable'

const props = defineProps({
  columns:           { type: Array as PropType<ColDef[]>, required: true },
  rowDataProp:       { type: Array as PropType<Record<string, unknown>[]>, default: () => [] },
  dataUrl:           String,
  enableFiltering:   { type: Boolean, default: true },
  pagination:        { type: Boolean, default: true },
  storageKey:        { type: String, default: 'visibleFields' },
  showColumnSelector:{ type: Boolean, default: true },
  actions:           { type: Array as PropType<ActionConfig[]>, default: () => [] },
  actionsHeaderName: { type: String, default: 'Actions' },
})

const { columns, pagination, showColumnSelector } = toRefs(props)

const {
  defaultColDef,
  rowData,
  pageSize,
  onGridReady,
  onFirstDataRendered,
  computedVisibleColumnDefs,
  visibleFields,
  showDropdown,
  toggleDropdown,
  resetVisibleFields,
  minVisibleColumns,
} = useDataTable(props)
</script>

<style scoped>
/* … */
</style>
