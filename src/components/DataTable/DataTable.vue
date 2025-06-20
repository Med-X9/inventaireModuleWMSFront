<template>
  <div>
    <div class="flex flex-col mb-3 md:flex-row justify-between gap-2">
      <!-- Sélecteur de colonnes -->
      <div class="flex flex-wrap gap-2 items-center">
        <div
          v-if="showColumnSelector"
          ref="dropdownRef"
          class="relative mb-4 w-full md:w-72 select-wrapper"
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
            
            <!-- Amélioration: Utiliser Tooltip pour chaque colonne -->
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

      <!-- Dropdown d'export -->
      <div class="flex-shrink-0 flex gap-2 mb-4 md:mb-0">
        <slot name="table-actions" />
        <div class="relative" ref="exportDropdownRef">
          <!-- Bouton principal "Exporter" -->
          <button
            @click="toggleExportDropdown"
            class="flex items-center justify-between p-2 btn text-gray-700 shadow-sm hover:border-gray-300 w-full md:w-auto"
          >
            <span class="flex items-center gap-2">
              <IconDownload class="w-4 h-4" />
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
          <!-- Menu déroulant des exports -->
          <div
            v-if="showExportDropdown"
            class="absolute right-0 mt-2 w-48 dark:bg-dark-bg dark:border-dark-border dark:text-white-dark bg-white border rounded shadow-md z-10 p-2"
            @click.stop
          >
            <button
              @click="exportToCsv"
              class="flex items-center gap-2 w-full text-sm px-2 py-1 hover:bg-gray-100 rounded"
            >
              <IconFile class="w-4 h-4" />
              CSV
            </button>
            <button
              @click="exportToExcel"
              class="flex items-center gap-2 w-full text-sm px-2 py-1 hover:bg-gray-100 rounded"
            >
              <IconFile class="w-4 h-4" />
              Excel
            </button>
            <button
              @click="exportToPdf"
              class="flex items-center gap-2 w-full text-sm px-2 py-1 hover:bg-gray-100 rounded"
            >
              <IconDownload class="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Grille AG Grid -->
    <div v-if="rowData !== undefined">
      <ag-grid-vue
        class="ag-theme-alpine auto-height-grid"
        style="width: 100%;"
        domLayout="autoHeight"
        :theme="gridTheme"
        @grid-ready="onGridReady"
        @first-data-rendered="onFirstDataRendered"
        @selection-changed="onSelectionChanged"
        @row-clicked="$emit('row-clicked', $event)"
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
          cellStyle: (params) => params.data?.isChild ? { display: 'none' } : undefined
        }"
        :isRowSelectable="isRowSelectable"
      />
    </div>

    <div v-if="rowData.length === 0" class="text-center text-gray-500 mt-4">
      Aucun enregistrement à afficher.
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed, defineEmits, ref, onMounted, onUnmounted } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import type { PropType } from 'vue';
import type { ColDef, CsvExportParams, SelectionChangedEvent } from 'ag-grid-community';
import type { ActionConfig, TableRow, DataTableColumn } from '@/interfaces/dataTable';
import { useDataTable } from '@/composables/useDataTable';
import { useAppStore } from '@/stores/index';
import { themeQuartz, colorSchemeLightWarm, colorSchemeDarkBlue } from 'ag-grid-community';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import IconFile from '@/components/icon/icon-file.vue';
import IconDownload from '@/components/icon/icon-download.vue';
import Tooltip from '@/components/Tooltip.vue';

const emit = defineEmits(['selection-changed', 'row-clicked']);

const props = defineProps({
  columns: { type: Array as PropType<DataTableColumn[]>, required: true },
  rowDataProp: { type: Array as PropType<TableRow[]>, default: () => [] },
  dataUrl: String,
  enableFiltering: { type: Boolean, default: true },
  pagination: { type: Boolean, default: true },
  storageKey: { type: String, default: 'visibleFields' },
  showColumnSelector: { type: Boolean, default: true },
  actions: { type: Array as PropType<ActionConfig[]>, default: () => [] },
  actionsHeaderName: { type: String, default: 'Actions' },
  rowSelection: { type: Boolean, default: false },
  exportTitle: { type: String, default: 'Export de données' },
});

const themeStore = useAppStore();
const themeLight = themeQuartz.withPart(colorSchemeLightWarm);
const themeDark = themeQuartz.withPart(colorSchemeDarkBlue);

const gridTheme = computed(() =>
  themeStore.theme === 'dark' ? themeDark : themeLight
);

// Fonction pour déterminer si une ligne peut être sélectionnée
const isRowSelectable = (params: { data?: TableRow }) => {
  // Ne permettre la sélection que des lignes parent (pas les détails)
  return !params.data?.isChild;
};

const onSelectionChanged = (event: SelectionChangedEvent) => {
  if (!gridApi.value) return;
  const selectedRows = gridApi.value.getSelectedRows();
  emit('selection-changed', selectedRows);
};

const getExportableColumns = () => {
  return computedVisibleColumnDefsWithIndex.value
    .filter(col => col.field !== 'actions' && col.field !== undefined);
};

const exportToCsv = () => {
  if (!gridApi.value) return;
  const params: CsvExportParams = {
    columnSeparator: ',',
    columnKeys: getExportableColumns().map(col => col.field!) as string[],
  };
  gridApi.value.exportDataAsCsv(params);
  showExportDropdown.value = false;
};

const exportToExcel = () => {
  if (!gridApi.value) return;
  const allData: Record<string, unknown>[] = [];
  gridApi.value.forEachNodeAfterFilterAndSort(node => {
    if (node.data) allData.push(node.data);
  });

  if (!allData.length) return;

  const visibleCols = getExportableColumns();
  const headers = visibleCols.map(col => col.headerName || col.field);
  const dataForSheet = allData.map(row => {
    const obj: Record<string, unknown> = {};
    visibleCols.forEach(col => {
      if (col.field) obj[col.field] = row[col.field];
    });
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(dataForSheet, {
    header: visibleCols.map(c => c.field as string).filter(Boolean)
  });
  XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A1' });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Données');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  saveAs(blob, 'export.xlsx');

  showExportDropdown.value = false;
};

const exportToPdf = () => {
  if (!gridApi.value) return;
  const doc = new jsPDF();

  // Titre
  doc.setFontSize(12);
  doc.setTextColor(44, 62, 80);
  doc.text(props.exportTitle, 14, 15);

  // Colonnes exportables (sans 'actions')
  const visibleCols = getExportableColumns();

  // En-têtes à afficher dans le PDF
  const headers = visibleCols.map(col => col.headerName || col.field || '');

  // Corps du tableau : on précise le type pour éviter le `never[]`
  const body: (string | number)[][] = [];

  // Remplissage des lignes
  gridApi.value.forEachNodeAfterFilterAndSort(node => {
    if (!node.data) return;
    const row: (string | number)[] = [];
    visibleCols.forEach(col => {
      const val = node.data[col.field!] ?? '';
      row.push(val);
    });
    body.push(row);
  });

  // Génère le tableau dans le PDF
  autoTable(doc, {
    head: [headers],
    body,
    startY: 25,
    headStyles: { fillColor: [255, 204, 17] },
    didDrawPage: () => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
          `Page ${i} sur ${pageCount}`,
          doc.internal.pageSize.width - 20,
          doc.internal.pageSize.height - 10,
          { align: 'right' }
        );
      }
    }
  });

  doc.save('export.pdf');
  showExportDropdown.value = false;
};

// Variables pour le dropdown d'export
const showExportDropdown = ref(false);
const exportDropdownRef = ref<HTMLElement | null>(null);

const toggleExportDropdown = () => {
  showExportDropdown.value = !showExportDropdown.value;
};

// Événement pour fermer le dropdown d'export si on clique à l'extérieur
const handleClickOutsideExport = (event: MouseEvent) => {
  const wrap = exportDropdownRef.value;
  if (wrap && !wrap.contains(event.target as Node)) {
    showExportDropdown.value = false;
  }
};

// Appel à useDataTable
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
  gridApi,
} = useDataTable(props);

// Colonne de numérotation conditionnelle
const rowNumberColumn: ColDef = {
  headerName: 'N°',
  valueGetter: params => {
    // Ne pas afficher le numéro pour les lignes enfants
    if (params.data?.isChild) return '';
    return params.node?.rowIndex != null ? (params.node.rowIndex + 1).toString() : '';
  },
  width: 70,
  minWidth: 70,
  maxWidth: 80,
  suppressSizeToFit: true,
  menuTabs: [],
  sortable: false,
  filter: false,
  cellClass: 'text-left',
  cellStyle: params => {
    // Masquer complètement la cellule pour les lignes enfants
    if (params.data?.isChild) {
      return { display: 'none' };
    }
    return undefined;
  }
};

const computedVisibleColumnDefsWithIndex = computed<ColDef[]>(() => {
  const cols = [...computedVisibleColumnDefs.value];
  cols.unshift(rowNumberColumn);
  return cols;
});

// Écoute globale pour fermer le dropdown d'export si on clique à l'extérieur
onMounted(() => {
  document.addEventListener('click', handleClickOutsideExport);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutsideExport);
});
</script>

<style scoped>
.auto-height-grid :deep(.ag-root-wrapper-body),
.auto-height-grid :deep(.ag-center-cols-viewport),
.auto-height-grid :deep(.ag-body-viewport-wrapper) {
  max-height: 430px !important;
  height: auto !important;
  overflow-y: auto !important;
}

.auto-height-grid :deep(.ag-header-cell-text),
.auto-height-grid :deep(.ag-header-cell-label) {
  font-size: 13.5px;
}

.auto-height-grid :deep(.ag-cell) {
  font-size: 12.5px;
}

.auto-height-grid :deep(.ag-paging-panel),
.auto-height-grid :deep(.ag-pagination-button),
.auto-height-grid :deep(.ag-page-size-panel),
.auto-height-grid :deep(.ag-page-size),
.auto-height-grid :deep(.ag-input-field-input) {
  font-size: 13.5px;
}

/* Masquer les checkboxes pour les lignes enfants */
.auto-height-grid :deep(.ag-row .ag-selection-checkbox) {
  visibility: visible;
}

.auto-height-grid :deep(.ag-row[data-is-child="true"] .ag-selection-checkbox) {
  display: none !important;
}

/* Force les tooltips AG Grid à être toujours sombres */
:deep(.ag-tooltip) {
  background-color:  var(--color-primary)!important; 
  border: 1px solid var(--color-primary) !important; 
  color: white !important;
  font-size: 12px !important;
  padding: 4px 8px !important;
  border-radius: 4px !important;
  z-index: 9999 !important;
}
/* Style global pour tous les tooltips AG Grid dans l'application */
.dark :deep(.ag-tooltip) {
  background-color: #374151 !important; 
  color: white !important;
  border: 1px solid #4B5563 !important; 
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
  font-size: 12px !important;
  padding: 4px 8px !important;
  border-radius: 4px !important;
  z-index: 9999 !important;
}

@media (max-width: 640px) {
  :deep(.ag-pagination-button) {
    min-width: 1.2rem;
    height: 1.2rem;
    padding: 0.15rem;
  }
  
  .auto-height-grid :deep(.ag-paging-panel),
  .auto-height-grid :deep(.ag-pagination-button),
  .auto-height-grid :deep(.ag-page-size-panel),
  .auto-height-grid :deep(.ag-page-size),
  .auto-height-grid :deep(.ag-input-field-input) {
    font-size: 6.5px;
    padding: 0.3rem;
  }
}
</style>