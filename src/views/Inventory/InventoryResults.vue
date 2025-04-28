<template>
  <div class="container mx-auto mt-6">
    <!-- Sélecteurs -->
    <div class="flex gap-4 mb-6">
      <v-select
        v-model="selectedInventory"
        :options="inventories"
        :reduce="option => option.value"
        placeholder="Sélectionner un inventaire"
        label="label"
        class="vue-select"
        @change="filterResults"
      />
      <v-select
        v-model="selectedStore"
        :options="stores"
        :reduce="option => option.value"
        placeholder="Sélectionner un magasin"
        label="label"
        class="vue-select"
        @change="filterResults"
      />
    </div>

    <!-- Card ou Tableau -->
    <transition name="fade" mode="out-in">
      <!-- Table -->
      <div v-if="selectedInventory && selectedStore" key="table">
        <DataTable
          :columns="columns"
          :rowDataProp="filteredRowData"
          :actions="actions"
          :pagination="true"
          :enableFiltering="true"
          storageKey="inventory_results_table"
        />
      </div>

      <!-- Card de fallback -->
      <div
        v-else
        key="card"
        class="p-6 bg-white border border-gray-300 rounded-lg shadow-md text-center text-gray-500"
      >
        <p class="italic">Veuillez sélectionner un inventaire et un magasin pour afficher les résultats.</p>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import DataTable from '@/components/DataTable/DataTable.vue';
import vSelect from 'vue-select';
import 'vue-select/dist/vue-select.css';
import { ColDef } from 'ag-grid-community';
import IconEdit from '@/components/icon/icon-edit.vue';
import IconLancer from '@/components/icon/icon-launch.vue';
import IconValider from '@/components/icon/icon-check.vue';

export default defineComponent({
  name: 'InventoryResults',
  components: { DataTable, vSelect },
  setup() {
    const inventories = ref([
      { label: 'Inventaire 1', value: 'inventory_1' },
      { label: 'Inventaire 2', value: 'inventory_2' },
    ]);

    const stores = ref([
      { label: 'Magasin A', value: 'store_A' },
      { label: 'Magasin B', value: 'store_B' },
    ]);

    const selectedInventory = ref<string | null>(null);
    const selectedStore = ref<string | null>(null);

    const rowData = ref<Record<string, unknown>[]>([
      { id: 1, article: 'Article A', emplacement: 'Emplacement 1', premier_contage: 100, deuxieme_contage: 105, ecart: 5, troisieme_contage: 110, resultats: 'OK', inventory: 'inventory_1', store: 'store_A' },
      { id: 2, article: 'Article B', emplacement: 'Emplacement 2', premier_contage: 200, deuxieme_contage: 198, ecart: -2, troisieme_contage: 200, resultats: 'Réajusté', inventory: 'inventory_2', store: 'store_B' },
      { id: 3, article: 'Article C', emplacement: 'Emplacement 3', premier_contage: 50, deuxieme_contage: 52, ecart: 2, troisieme_contage: 50, resultats: 'OK', inventory: 'inventory_1', store: 'store_B' },
    ]);

    const filteredRowData = ref([...rowData.value]);

    const filterResults = () => {
      filteredRowData.value = rowData.value.filter(item => {
        const matchesInventory = !selectedInventory.value || item.inventory === selectedInventory.value;
        const matchesStore = !selectedStore.value || item.store === selectedStore.value;
        return matchesInventory && matchesStore;
      });
    };

    const columns: ColDef[] = [
      { headerName: 'Article', field: 'article', sortable: true, filter: 'agTextColumnFilter' },
      { headerName: 'Emplacement', field: 'emplacement', sortable: true, filter: 'agTextColumnFilter' },
      { headerName: 'Premier Contage', field: 'premier_contage', sortable: true, filter: 'agNumberColumnFilter' },
      { headerName: 'Deuxième Contage', field: 'deuxieme_contage', sortable: true, filter: 'agNumberColumnFilter' },
      { headerName: 'Écart', field: 'ecart', sortable: true, filter: 'agNumberColumnFilter' },
      { headerName: 'Troisième Contage', field: 'troisieme_contage', sortable: true, filter: 'agNumberColumnFilter' },
      { headerName: 'Résultats', field: 'resultats', sortable: true, filter: 'agTextColumnFilter' },
    ];

    const actions = [
      { label: 'Éditer', icon: IconEdit, class: 'flex items-center gap-1 px-2 py-1 text-yellow-500 text-xs', handler: row => console.log('Éditer la ligne', row) },
      { label: 'Lancer', icon: IconLancer, class: 'flex items-center gap-1 px-2 py-1 text-blue-500 text-xs', handler: row => console.log('Lancer l\'action sur la ligne', row) },
      { label: 'Valider', icon: IconValider, class: 'flex items-center gap-1 px-2 py-1 text-green-600 text-xs', handler: row => console.log('Valider la ligne', row) },
    ];

    return {
      inventories,
      stores,
      selectedInventory,
      selectedStore,
      filteredRowData,
      filterResults,
      columns,
      actions,
    };
  },
});
</script>

<style scoped>
.vue-select {
  width: 100%;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>