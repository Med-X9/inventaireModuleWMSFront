<template>
  <div>
    <div class="flex flex-col mb-3 md:flex-row justify-between gap-4">
      <!-- Sélecteur de colonnes -->
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

    <!-- Grille AG Grid avec hauteur dynamique -->
    <div v-if="rowData !== undefined" class="table-container">
      <ag-grid-vue
        class="ag-theme-alpine"
        :style="dynamicGridStyle"
        domLayout="normal"
        :theme="gridTheme"
        @grid-ready="onGridReady"
        @first-data-rendered="onFirstDataRendered"
        @selection-changed="onSelectionChanged"
        @row-clicked="$emit('row-clicked', $event)"
        @model-updated="onModelUpdated"
        @cell-value-changed="onCellValueChanged"
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
        :selectionOptions="{ isRowSelectable }"
        :singleClickEdit="inlineEditing"
        :stopEditingWhenCellsLoseFocus="false"
        @cellKeyDown="onCellKeyDown"
        @cellEditingStopped="onCellEditingStopped"
      />
    </div>

    <div v-if="rowData.length === 0" class="text-center text-gray-500 mt-4">
      Aucun enregistrement à afficher.
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed, defineEmits, ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import type { PropType } from 'vue';
import type { ColDef, CsvExportParams, SelectionChangedEvent, CellKeyDownEvent, CellEditingStoppedEvent, ModelUpdatedEvent, CellValueChangedEvent } from 'ag-grid-community';
import { alertService } from '@/services/alertService';
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

const emit = defineEmits(['selection-changed', 'row-clicked', 'cell-value-changed']);

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
  inlineEditing: { type: Boolean, default: false },
  maxRowsForDynamicHeight: { type: Number, default: 10 }, // Seuil pour hauteur dynamique
});

const themeStore = useAppStore();
const themeLight = themeQuartz.withPart(colorSchemeLightWarm);
const themeDark = themeQuartz.withPart(colorSchemeDarkBlue);

const gridTheme = computed(() =>
  themeStore.theme === 'dark' ? themeDark : themeLight
);

// État pour la hauteur dynamique
const calculatedHeight = ref(470); // Hauteur par défaut

// Calcul de la hauteur dynamique
const dynamicGridStyle = computed(() => {
  return {
    width: '100%',
    height: `${calculatedHeight.value}px`
  };
});

// Fonction pour calculer la hauteur optimale
const calculateOptimalHeight = () => {
  if (!isGridValid()) return;

  const displayedRowCount = gridApi.value!.getDisplayedRowCount();
  const headerHeight = 48; // Hauteur approximative de l'en-tête
  const rowHeight = 42; // Hauteur approximative d'une ligne
  const paginationHeight = props.pagination ? 52 : 0; // Hauteur de la pagination
  const scrollbarBuffer = 20; // Buffer pour les scrollbars

  // Si peu de lignes, calculer la hauteur exacte
  if (displayedRowCount <= props.maxRowsForDynamicHeight) {
    const contentHeight = headerHeight + (displayedRowCount * rowHeight) + paginationHeight + scrollbarBuffer;
    calculatedHeight.value = Math.max(contentHeight, 200); // Hauteur minimum de 200px
  } else {
    // Pour beaucoup de lignes, utiliser la hauteur fixe
    calculatedHeight.value = 470;
  }
};

// Événement quand le modèle de données est mis à jour
const onModelUpdated = (event: ModelUpdatedEvent) => {
  // Recalculer la hauteur après mise à jour des données
  nextTick(() => {
    calculateOptimalHeight();
  });
};

// Fonction pour déterminer si une ligne peut être sélectionnée
const isRowSelectable = (params: { data?: TableRow }) => {
  return !params.data?.isChild;
};

const onSelectionChanged = (event: SelectionChangedEvent) => {
  if (!isGridValid()) return;
  const selectedRows = gridApi.value!.getSelectedRows();
  emit('selection-changed', selectedRows);
};

const getExportableColumns = () => {
  return computedVisibleColumnDefsWithIndex.value
    .filter(col => col.field !== 'actions' && col.field !== undefined);
};

const onCellKeyDown = (e: CellKeyDownEvent) => {
  if (e.event instanceof KeyboardEvent && e.event.key === 'Enter' && isGridValid()) {
    gridApi.value!.stopEditing()
  }
}

// Fonction pour gérer la confirmation de modification de cellule
const onCellEditingStopped = async (e: CellEditingStoppedEvent) => {
  const field = e.colDef.field!;
  const oldVal = e.oldValue;
  const newVal = e.value;

  if (newVal === oldVal) return;

  await nextTick();

  // Formater les valeurs pour l'affichage dans la confirmation
  let displayOldVal = oldVal;
  let displayNewVal = newVal;

  // Si c'est une date, formater pour l'affichage
  if (field === 'date1' || field === 'date2') {
    try {
      if (oldVal) {
        displayOldVal = new Date(oldVal).toLocaleDateString('fr-FR');
      }
      if (newVal) {
        displayNewVal = new Date(newVal).toLocaleDateString('fr-FR');
      }
    } catch {
      // Garder les valeurs originales si erreur de format
    }
  }

  const result = await alertService.confirm({
    title: 'Confirmation de modification',
    text: `Vous êtes sur le point de modifier le champ « ${e.colDef.headerName || field} » de « ${displayOldVal || 'vide'} » à « ${displayNewVal || 'vide'} ». Voulez-vous poursuivre ?`
  });

  if (!result.isConfirmed) {
    // Annuler la modification
    e.node.setDataValue(field, oldVal);
  } else {
    // Émettre l'événement de changement
    emit('cell-value-changed', {
      data: e.data,
      colDef: e.colDef,
      newValue: newVal,
      oldValue: oldVal
    });
    
    await alertService.success({ text: 'Modification confirmée.' });
  }
};

// Gestion de l'événement de changement de valeur de cellule
const onCellValueChanged = (event: CellValueChangedEvent) => {
  // Transmettre l'événement au parent
  emit('cell-value-changed', event);
};

const exportToCsv = () => {
  if (!isGridValid()) return;

  const params: CsvExportParams = {
    columnSeparator: ',',
    columnKeys: getExportableColumns().map(col => col.field!) as string[],
  };
  
  gridApi.value!.exportDataAsCsv(params);
  showExportDropdown.value = false;
};

const exportToExcel = () => {
  if (!isGridValid()) return;

  const allData: Record<string, unknown>[] = [];
  gridApi.value!.forEachNodeAfterFilterAndSort(node => {
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
  if (!isGridValid()) return;

  const doc = new jsPDF();
  doc.setFontSize(12);
  doc.setTextColor(44, 62, 80);
  doc.text(props.exportTitle, 14, 15);

  const visibleCols = getExportableColumns();
  const headers = visibleCols.map(col => col.headerName || col.field || '');

  const body: (string | number)[][] = [];
  gridApi.value!.forEachNodeAfterFilterAndSort(node => {
    if (!node.data) return;
    const row: (string | number)[] = [];
    visibleCols.forEach(col => {
      const val = node.data[col.field!] ?? '';
      row.push(val);
    });
    body.push(row);
  });

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
  onGridReady: originalOnGridReady,
  onFirstDataRendered: originalOnFirstDataRendered,
  computedVisibleColumnDefs,
  visibleFields,
  showDropdown,
  toggleDropdown,
  resetVisibleFields,
  minVisibleColumns,
  dropdownRef,
  gridApi,
  isGridValid,
} = useDataTable(props);

// Wrapper pour onGridReady avec calcul de hauteur
const onGridReady = (event: any) => {
  originalOnGridReady(event);
  // Calculer la hauteur après l'initialisation
  nextTick(() => {
    calculateOptimalHeight();
  });
};

// Wrapper pour onFirstDataRendered avec calcul de hauteur
const onFirstDataRendered = (event: any) => {
  originalOnFirstDataRendered(event);
  // Calculer la hauteur après le premier rendu
  nextTick(() => {
    calculateOptimalHeight();
  });
};

// Watcher pour recalculer la hauteur quand les données changent
watch(() => rowData.value, () => {
  nextTick(() => {
    calculateOptimalHeight();
  });
}, { deep: true });

// Watcher pour recalculer la hauteur quand la pagination change
watch(() => pageSize.value, () => {
  nextTick(() => {
    calculateOptimalHeight();
  });
});

// Colonne de numérotation conditionnelle
const rowNumberColumn: ColDef = {
  headerName: 'N°',
  valueGetter: params => {
    if (params.data?.isChild) return '';
    return params.node?.rowIndex != null ? (params.node.rowIndex + 1).toString() : '';
  },
  width: 70,
  minWidth: 70,
  maxWidth: 80,
  suppressSizeToFit: true,
  menuTabs: [],
  sortable: false,
  filter: 'agTextColumnFilter',
  cellClass: 'text-left',
  cellStyle: params => {
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

onMounted(() => {
  document.addEventListener('click', handleClickOutsideExport);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutsideExport);
});
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

/* Masquer les checkboxes pour les lignes enfants */
:deep(.ag-row .ag-selection-checkbox) {
  visibility: visible;
}

:deep(.ag-row[data-is-child="true"] .ag-selection-checkbox) {
  display: none !important;
}

/* Force les tooltips AG Grid à être toujours sombres */
:deep(.ag-tooltip) {
  background-color: var(--color-primary) !important;
  border: 1px solid var(--color-primary) !important;
  color: white !important;
  font-size: 12px !important;
  padding: 4px 8px !important;
  border-radius: 4px !important;
  z-index: 9999 !important;
}

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