<template>
  <div>
    <!-- Header : selecteur de colonnes + slot actions -->
    <div class="flex flex-col md:flex-row justify-between  items-end md:items-center gap-2">
      <div
        v-if="showColumnSelector"
        ref="dropdownRef"
        class="relative mb-4 w-full md:w-72 select-wrapper"
      >
        <button
          @click="toggleDropdown"
          class="flex items-center justify-between p-2  dark:bg-dark-bg dark:border-dark-border dark:text-white-dark  bg-white border rounded text-sm text-gray-700 shadow-sm hover:border-gray-400 w-full"
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
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 9l-7 7-7-7"/>
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
          <label
            v-for="col in columns"
            :key="col.field!"
            class="flex items-center gap-2 mb-2 text-sm"
          >
            <input
              type="checkbox"
              :value="col.field!"
              v-model="visibleFields"
              :disabled="visibleFields.length <= minVisibleColumns && visibleFields.includes(col.field!)"
              class="form-checkbox accent-primary focus:ring-primary"
            />
            {{ col.headerName || col.field }}
          </label>
        </div>
      </div>

      <div class="flex-shrink-0 mb-4 md:mb-1">
        <slot name="table-actions" class="mb-8" />
      </div>
    </div>

    <!-- AG Grid (protégé par v-if pour éviter les patchs sur nodes null) -->
    <div v-if="rowData !== undefined">
      <ag-grid-vue
        class="ag-theme-alpine auto-height-grid"
        style="width: 100%;"
        domLayout="autoHeight"
        :theme="gridTheme"
        @grid-ready="onGridReady"
        @first-data-rendered="onFirstDataRendered"
       
        :columnDefs="computedVisibleColumnDefsWithIndex"
        :defaultColDef="defaultColDef"
        :rowData="rowData"
        :pagination="pagination"
        :paginationPageSize="pageSize"
      />
    </div>

    <div v-if="rowData.length === 0" class="text-center text-gray-500 mt-4">
      Aucun enregistrement à afficher.
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, toRefs, computed } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import type { PropType } from 'vue'
import type { ColDef } from 'ag-grid-community'
import type { ActionConfig } from '@/interfaces/dataTable'
import { useDataTable } from '@/composables/useDataTable'
import { useAppStore } from '@/stores/index'
import { themeQuartz, colorSchemeLightWarm, colorSchemeDarkBlue } from 'ag-grid-community'

// Props définition
const props = defineProps({
  columns:            { type: Array as PropType<ColDef[]>, required: true },
  rowDataProp:        { type: Array as PropType<Record<string, unknown>[]>, default: () => [] },
  dataUrl:            String,
  enableFiltering:    { type: Boolean, default: true },
  pagination:         { type: Boolean, default: true },
  storageKey:         { type: String, default: 'visibleFields' },
  showColumnSelector: { type: Boolean, default: true },
  actions:            { type: Array as PropType<ActionConfig[]>, default: () => [] },
  actionsHeaderName:  { type: String, default: 'Actions' },
})

// Récupération du store
const themeStore = useAppStore()

// Thèmes Quartz clair et sombre
const themeLight = themeQuartz.withPart(colorSchemeLightWarm)
const themeDark  = themeQuartz.withPart(colorSchemeDarkBlue)

// Computed qui renvoie le thème actif
const gridTheme = computed(() =>
  themeStore.theme === 'dark'
    ? themeDark
    : themeStore.theme === 'light'
      ? themeLight
      : themeLight  // par défaut
)

// Colonne de numéros de ligne
const rowNumberColumn: ColDef = {
  headerName: 'N°',
  valueGetter: params => params.node?.rowIndex != null ? (params.node.rowIndex + 1).toString() : '',
  width: 65,  
  minWidth: 65,
  maxWidth: 70,
  suppressSizeToFit: true,
  menuTabs: [],        
  sortable: false,     
  filter: false,      
  cellClass: 'text-left',
}

// Utilisation du composable
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
  dropdownRef,
} = useDataTable(props)

// Mise à jour de computedVisibleColumnDefs pour inclure la colonne de ligne
const computedVisibleColumnDefsWithIndex = computed<ColDef[]>(() => {
  // on clone les colonnes passées en props
  const cols = [...computedVisibleColumnDefs.value]
  // on insère la colonne d'index en début
  cols.unshift(rowNumberColumn)
  return cols
})
</script>

<style scoped>
.auto-height-grid ::v-deep .ag-root-wrapper-body,
.auto-height-grid ::v-deep .ag-center-cols-viewport,
.auto-height-grid ::v-deep .ag-body-viewport-wrapper {
  max-height: 430px !important;
  height: auto !important;
  overflow-y: auto !important;

}
/* Pagination AG Grid super-compacte pour mobile */
@media (max-width: 640px) {
  /* Conteneur de la pagination */
  ::v-deep .ag-paging-panel {
    font-size: 0.55rem;        /* texte très petit */
    padding: 0.15rem 0.3rem;   /* très peu d’espacement */
  }

  /* Boutons de page (« Précédent », numéros, « Suivant ») */
  ::v-deep .ag-pagination-button {
    min-width: 1.2rem;         /* largeur mini */
    height: 1.2rem;            /* hauteur mini */
    padding: 0.15rem;          /* rembourrage mini */
  }

  /* Sélecteur du nombre de lignes par page */
  ::v-deep .ag-page-size-panel,
  ::v-deep .ag-page-size {
    font-size: 0.55rem;
    padding: 0.15rem;
  }

  /* Input de numéro de page */
  ::v-deep .ag-input-field-input {
    font-size: 0.55rem;
    padding: 0.15rem;
  }
}


</style>
