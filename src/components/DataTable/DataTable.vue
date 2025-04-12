<template>
    <div class="data-table" style="height: 100%;">
      <!-- Appliquer la classe de thème (ici, alpine) -->
      <ag-grid-vue
        class="ag-theme-alpine"
        style="width: 100%; height: 600px;"
        @grid-ready="onGridReady"
        :columnDefs="computedColumnDefs"
        :defaultColDef="defaultColDef"
        :pagination="true"
        :rowSelection="rowSelection"
        :rowData="computedRowData"
      ></ag-grid-vue>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, shallowRef, computed, watch } from "vue";
  import { AgGridVue } from "ag-grid-vue3";
  import {
    GridApi,
    GridReadyEvent,
    ColDef,
    ModuleRegistry,
    ClientSideRowModelModule,
    RowSelectionModule,
    TextFilterModule,
    NumberFilterModule,
    NumberEditorModule,
    TextEditorModule,
    PaginationModule
  } from "ag-grid-community";
  
  // Enregistrement uniquement des modules nécessaires d'ag‑grid
  ModuleRegistry.registerModules([
    ClientSideRowModelModule,
    RowSelectionModule,
    TextFilterModule,
    NumberFilterModule,
    NumberEditorModule,
    TextEditorModule,
    PaginationModule
  ]);
  
  export default defineComponent({
    name: "DataTable",
    components: {
      "ag-grid-vue": AgGridVue,
    },
    props: {
      // Définitions des colonnes passées depuis la vue
      columns: {
        type: Array as () => ColDef[],
        required: true,
      },
      // Optionnel : URL pour charger les données
      dataUrl: {
        type: String,
        required: false,
      },
      // Optionnel : données statiques passées directement via une prop
      rowDataProp: {
        type: Array as () => any[],
        default: null,
      }
    },
    setup(props) {
      // Référence à l'API de la grille pour la manipulation ultérieure
      const gridApi = shallowRef<GridApi | null>(null);
  
      // Configuration par défaut pour toutes les colonnes
      const defaultColDef = ref<ColDef>({
        resizable: true,
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 100,
      });
  
      // Mode de sélection des lignes en "multiple"
      const rowSelection = ref<"single" | "multiple">("multiple");
  
      // Variable réactive pour stocker les données de la grille
      const rowData = ref<any[] | null>(props.rowDataProp);
  
      // Récupération des données lors du grid-ready
      const onGridReady = (params: GridReadyEvent) => {
        gridApi.value = params.api;
        // Si la prop dataUrl est renseignée, on charge les données depuis l'URL
        if (props.dataUrl) {
          fetch(props.dataUrl)
            .then(resp => resp.json())
            .then((data) => {
              // Transformation : ajout d'une clé "id" à chaque enregistrement
              const mappedData = data.map((item: any, index: number) => ({
                id: index + 1,
                ...item,
              }));
              rowData.value = mappedData;
            });
        }
      };
  
      // Les définitions de colonnes sont obtenues directement via la prop columns
      const computedColumnDefs = computed(() => props.columns);
      // Les données à afficher proviennent soit de l'URL, soit de la prop rowDataProp
      const computedRowData = computed(() => rowData.value);
  
      // Si rowDataProp change, on met à jour rowData
      watch(() => props.rowDataProp, (newVal) => {
        if (newVal) {
          rowData.value = newVal;
        }
      });
  
      return {
        gridApi,
        defaultColDef,
        rowSelection,
        computedColumnDefs,
        computedRowData,
        onGridReady,
      };
    },
  });
  </script>
  
  <style scoped>
  .data-table {
    margin: 20px;
  }
  </style>
  