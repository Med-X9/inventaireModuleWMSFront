<template>
  <div class="mt-4">
    <!-- Sélecteur de colonnes visibles -->
   <div class="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-5">
  <div
    ref="dropdownRef"
    class="relative w-full md:w-72 select-wrapper order-2 md:order-1"
    @click="toggleDropdown"
  >
    <div
      class="flex items-center justify-between p-2 bg-white border border-gray-300 rounded text-sm text-gray-700 shadow-sm hover:border-gray-400 transition-all"
    >
      <span>Sélectionner Colonnes affichées</span>
      <svg
        class="w-4 h-4 ml-2 text-gray-500 transition-transform duration-200"
        :class="{ 'rotate-180': showDropdown }"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </div>
    <div
      v-if="showDropdown"
      class="absolute top-full left-0 w-full bg-white border border-gray-300 rounded shadow-md z-10 p-2 max-h-64 overflow-y-auto"
      @click.stop
    >
      <button
        class="flex items-center gap-2 w-full text-sm text-primary hover:text-primary px-2 py-1 mb-3 rounded hover:bg-red-50 transition"
        @click.stop="resetVisibleFields"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v6h6M20 20v-6h-6M4 20l16-16" />
        </svg>
        Réinitialiser les colonnes
      </button>
      <label
        v-for="col in allColumns"
        :key="col.field"
        class="flex items-center gap-2 mb-2 text-sm text-gray-700"
      >
        <input
          type="checkbox"
          :value="col.field"
          v-model="visibleFields"
          class="form-checkbox text-blue-600"
        />
        {{ col.headerName || col.field }}
      </label>
    </div>
  </div>
  <div class="order-1 md:order-2 w-full md:w-auto md:ml-auto">
    <slot name="table-actions"></slot>
  </div>
</div>


    <!-- AG Grid -->
    <ag-grid-vue
      class="ag-theme-alpine"
      style="width: 100%; height: 400px;"
      @grid-ready="onGridReady"
      :suppress-row-transform="true" 
      @first-data-rendered="onFirstDataRendered"
      :columnDefs="computedVisibleColumnDefs"
      :defaultColDef="defaultColDef"
      :pagination="pagination"
      :paginationPageSize="pageSize"
      :rowSelection="rowSelection"
      :rowData="computedRowData"
      :frameworkComponents="frameworkComponents"
    />

    <div v-if="computedRowData.length === 0" class="text-center text-gray-500 mt-4">
      Aucun enregistrement à afficher.
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  shallowRef,
  computed,
  watch,
  onMounted,
  onUnmounted,
  type PropType,
} from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import {
  ModuleRegistry,
  ClientSideRowModelModule,
  RowSelectionModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  PaginationModule,
  type ColDef,
  type GridReadyEvent,
  type FirstDataRenderedEvent,
  type RowSelectionOptions,
  type GridApi,
} from 'ag-grid-community';
import ActionMenu from '@/components/DataTable/ActionMenu.vue';

// Register AG Grid modules
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  RowSelectionModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  PaginationModule,
]);

// Extend GridApi for pagination control
interface ExtendedGridApi extends GridApi {
  paginationSetPageSize(pageSize: number): void;
  paginationGetCurrentPage(): number;
  paginationGoToPage(page: number): void;
}

// Define ActionConfig interface
interface ActionConfig {
  label: string;
  icon?: any;
  handler: (row: Record<string, unknown>) => void;
}

export default defineComponent({
  name: 'DataTable',
  components: { AgGridVue, ActionMenu },
  props: {
    columns: { type: Array as () => ColDef[], required: true },
    rowDataProp: { type: Array as () => Record<string, unknown>[], default: () => [] },
    dataUrl: String,
    pagination: { type: Boolean, default: true },
    enableFiltering: { type: Boolean, default: true },
    enableRowSelection: { type: Boolean, default: true },
    actions: { type: Array as PropType<ActionConfig[]>, default: () => [] },
    actionsHeaderName: { type: String, default: 'Actions' },
  },
  setup(props) {
    const gridApi = shallowRef<ExtendedGridApi | null>(null);
    const defaultColDef = ref<ColDef>({
      resizable: true,
      sortable: true,
      filter: props.enableFiltering ? 'agTextColumnFilter' : false,
      flex: 1,
      minWidth: 100,
    });
    const rowSelection = ref<RowSelectionOptions | undefined>(
      props.enableRowSelection
        ? { mode: 'multiRow', groupSelects: 'descendants' }
        : undefined
    );
    const rowData = ref(props.rowDataProp);
    const pageSize = ref(50);

    // Save pagination state
    const savePaginationState = () => {
      if (gridApi.value) {
        const currentPage = gridApi.value.paginationGetCurrentPage();
        localStorage.setItem(
          'paginationState',
          JSON.stringify({ currentPage, pageSize: pageSize.value })
        );
      }
    };

    const onGridReady = (params: GridReadyEvent) => {
      gridApi.value = params.api as ExtendedGridApi;
      const saved = localStorage.getItem('paginationState');
      if (saved && gridApi.value) {
        try {
          const { pageSize: ps } = JSON.parse(saved);
          if (ps) {
            pageSize.value = ps;
            gridApi.value.paginationSetPageSize(ps);
          }
        } catch {}
      }
      if (props.dataUrl) {
        fetch(props.dataUrl)
          .then(r => r.json())
          .then(data => (rowData.value = data));
      }
      if (gridApi.value && props.pagination) {
        gridApi.value.addEventListener('paginationChanged', savePaginationState);
      }
    };

    const onFirstDataRendered = (params: FirstDataRenderedEvent) => {
      const saved = localStorage.getItem('paginationState');
      if (saved && gridApi.value) {
        try {
          const { currentPage } = JSON.parse(saved);
          if (typeof currentPage === 'number') {
            gridApi.value.paginationGoToPage(currentPage);
          }
        } catch {}
      }
    };

    const allColumns = ref(props.columns);
    const visibleFields = ref<string[]>(
      props.columns.map(c => c.field!).filter(Boolean)
    );

    if (props.actions.length && !visibleFields.value.includes('actions')) {
      visibleFields.value.push('actions');
    }

    watch(
      visibleFields,
      v => localStorage.setItem('visibleFields', JSON.stringify(v)),
      { deep: true }
    );

    const computedVisibleColumnDefs = computed<ColDef[]>(() => {
      const base = allColumns.value.map(col => ({
        ...col,
        filter: props.enableFiltering ? (col.filter || 'agTextColumnFilter') : false,
      }));

      if (props.actions.length) {
        base.push({
          headerName: props.actionsHeaderName,
          field: 'actions',
          sortable: false,
          filter: false,
          minWidth: props.actions.length * 50,
          cellRenderer: 'ActionMenu',
          cellRendererParams: { actions: props.actions },
          // Autoriser le menu déroulant à dépasser la cellule
          cellStyle: { overflow: 'visible' },
        });
      }

      return base.filter(col =>
        col.field === 'actions' || visibleFields.value.includes(col.field!)
      );
    });

    const showDropdown = ref(false);
    const dropdownRef = ref<HTMLElement | null>(null);
    const toggleDropdown = () => (showDropdown.value = !showDropdown.value);
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
        showDropdown.value = false;
      }
    };

    const resetVisibleFields = () => {
      visibleFields.value = props.columns.map(c => c.field!).filter(Boolean);
      if (props.actions.length && !visibleFields.value.includes('actions')) {
        visibleFields.value.push('actions');
      }
      localStorage.removeItem('visibleFields');
    };

    onMounted(() => {
      document.addEventListener('click', handleClickOutside);
      const savedVF = localStorage.getItem('visibleFields');
      if (savedVF) {
        visibleFields.value = JSON.parse(savedVF);
        if (props.actions.length && !visibleFields.value.includes('actions')) {
          visibleFields.value.push('actions');
        }
      }
    });

    onUnmounted(() => document.removeEventListener('click', handleClickOutside));

    watch(() => props.rowDataProp, v => (rowData.value = v));

    const frameworkComponents = { ActionMenu };

    return {
      defaultColDef,
      rowSelection,
      computedVisibleColumnDefs,
      computedRowData: rowData,
      onGridReady,
      onFirstDataRendered,
      pageSize,
      showDropdown,
      toggleDropdown,
      dropdownRef,
      resetVisibleFields,
      allColumns,
      visibleFields,
      frameworkComponents,
    };
  },
});
</script>

<style scoped>
/* Si besoin d’override global, décommentez ci-dessous : */

</style>
