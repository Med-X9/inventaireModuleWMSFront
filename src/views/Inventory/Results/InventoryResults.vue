<template>
  <div class="container mx-auto px-4">
    <h1 class="text-xl font-bold dark:text-white-light text-gray-800 mb-6">Résultats d'Inventaire</h1>

    <!-- Formulaire de filtres -->
    <FormBuilder
      v-model="filterForm"
      :fields="filterFields"
      :hide-submit="true"
      class="mb-8"
      :columns="2"
    />

    <!-- État de chargement -->
    <div v-if="loading" class="flex justify-center items-center min-h-[400px]">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-secondary border-t-primary"></div>
    </div>

    <!-- Contenu -->
    <template v-else>
      <transition
        enter-active-class="transition-opacity duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <!-- Table -->
        <div v-if="filterForm.inventory && filterForm.store" key="table">
          <DataTable
            :columns="columns"
            :rowDataProp="filteredResults"
            :actions="actions"
            :pagination="true"
            :enableFiltering="true"
            storageKey="inventory_results_table"
          />
        </div>

        <!-- Message de sélection -->
        <div
          v-else
          key="selection-message"
          class="panel rounded-lg  shadow-sm p-8 text-center"
        >
          <div class="max-w-md mx-auto">
            <div class="text-gray-200 dark:text-white-dark mb-3">
              <svg class="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 class="text-lg font-medium dark:text-white-dark text-gray-900 mb-2">Sélectionnez vos critères</h3>
            <p class="text-gray-600 dark:text-white-dark">
              Veuillez sélectionner un inventaire et un magasin pour afficher les résultats correspondants.
            </p>
          </div>
        </div>
      </transition>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import DataTable from '@/components/DataTable/DataTable.vue';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import { useInventoryResults } from '@/composables/useInventoryResults';
import type { FieldConfig } from '@/interfaces/form';

// Référence du formulaire de filtres
const filterForm = ref<{ inventory: string | null; store: string | null }>({
  inventory: null,
  store: null
});

// Passe filterForm dans le composable
const {
  loading,
  inventories,
  stores,
  columns,
  actions,
  filteredResults,
  fetchData
} = useInventoryResults(filterForm);

// Configuration des champs du formulaire
const filterFields = computed<FieldConfig[]>(() => [
  {
    key: 'inventory',
    label: 'Inventaire',
    type: 'select',
    options: inventories.value,
    searchable: true,
    clearable: true,
    props: {
      placeholder: 'Rechercher un inventaire...'
    }
  },
  {
    key: 'store',
    label: 'Magasin',
    type: 'select',
    options: stores.value,
    searchable: true,
    clearable: true,
    props: {
      placeholder: 'Rechercher un magasin...'
    }
  }
]);

// Chargement des données au montage
onMounted(fetchData);
</script>
