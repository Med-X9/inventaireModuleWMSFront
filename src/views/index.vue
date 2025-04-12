<template>
  <div class="home">
    <!-- On transmet la configuration des colonnes et l'URL -->
    <DataTable :columns="olympicColumns" dataUrl="https://www.ag-grid.com/example-assets/olympic-winners.json" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
// Importer le composant depuis le dossier DataTable
import DataTable from "@/components/DataTable/DataTable.vue";

export default defineComponent({
  name: "Home",
  components: {
    DataTable,
  },
  setup() {
    // Configuration des colonnes pour la table olympique
    const olympicColumns = [
      { field: "id", headerName: "ID", filter: "agNumberColumnFilter", editable: false, maxWidth: 80 },
      { field: "athlete", headerName: "Nom", filter: "agTextColumnFilter", editable: true },
      { field: "age", headerName: "Âge", filter: "agNumberColumnFilter", editable: true, maxWidth: 90 },
      { field: "country", headerName: "Pays", filter: "agTextColumnFilter", editable: true },
      { field: "date", headerName: "Date", filter: "agTextColumnFilter", editable: false },
      { field: "total", headerName: "Score", filter: "agNumberColumnFilter", editable: true },
    ];
    
    return {
      olympicColumns,
    };
  },
});
</script>

<style scoped>
.home {
  padding: 20px;
}
</style>
