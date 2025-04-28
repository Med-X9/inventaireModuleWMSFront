<template>
    <div class="container mx-auto px-4">
      <h1 class="text-xl font-bold text-gray-800 mb-6">Résultats d'Inventaire</h1>
  
      <!-- Sélecteurs -->
      <div class="flex gap-6 mb-8">
        <div class="w-full md:w-1/2">
          <label class="block text-sm font-medium text-gray-700 mb-2">Inventaire</label>
          <v-select
            v-model="selectedInventory"
            :options="inventories"
            :reduce="option => option.value"
            placeholder="Rechercher un inventaire..."
            label="label"
            class="vs-custom"
          />
        </div>
        <div class="w-full md:w-1/2">
          <label class="block text-sm font-medium text-gray-700 mb-2">Magasin</label>
          <v-select
            v-model="selectedStore"
            :options="stores"
            :reduce="option => option.value"
            placeholder="Rechercher un magasin..."
            label="label"
            class="vs-custom"
          />
        </div>
      </div>
  
      <!-- État de chargement -->
      <div v-if="loading" class="flex justify-center items-center min-h-[400px]">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
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
          <div v-if="selectedInventory && selectedStore" key="table">
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
            class="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center"
          >
            <div class="max-w-md mx-auto">
              <div class="text-gray-200 mb-3">
                <svg class="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">Sélectionnez vos critères</h3>
              <p class="text-gray-600">
                Veuillez sélectionner un inventaire et un magasin pour afficher les résultats correspondants.
              </p>
            </div>
          </div>
        </transition>
      </template>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, onMounted } from 'vue';
  import DataTable from '@/components/DataTable/DataTable.vue';
  import vSelect from 'vue-select';
  import 'vue-select/dist/vue-select.css';
  import { useInventoryResults } from '@/composables/useInventoryResults';
  
  export default defineComponent({
    name: 'InventoryResults',
    components: { DataTable, vSelect },
    
    setup() {
      const {
        loading,
        inventories,
        stores,
        selectedInventory,
        selectedStore,
        columns,
        actions,
        filteredResults,
        fetchData
      } = useInventoryResults();
  
      onMounted(fetchData);
  
      return {
        loading,
        inventories,
        stores,
        selectedInventory,
        selectedStore,
        columns,
        actions,
        filteredResults
      };
    }
  });
  </script>
  
  <style>
  :root {
    --vs-colors-lightest: rgba(60, 60, 60, 0.26);
    --vs-colors-light: rgba(60, 60, 60, 0.5);
    --vs-colors-dark: #333;
    --vs-colors-darkest: rgba(0, 0, 0, 0.15);
  
    --vs-search-input-color: inherit;
  
    --vs-border-color: #e2e8f0;
    --vs-border-width: 1px;
    --vs-border-style: solid;
    --vs-border-radius: 0.5rem;
  
    --vs-dropdown-bg: #fff;
    --vs-dropdown-color: inherit;
    --vs-dropdown-z-index: 1000;
  
    --vs-selected-bg: #f0f0f0;
    --vs-selected-color: var(--vs-colors-dark);
  
    --vs-search-input-bg: transparent;
  
    --vs-dropdown-option--active-bg: #5897fb;
    --vs-dropdown-option--active-color: #fff;
  
    --vs-actions-padding: 4px 6px 0 3px;
  }
  
  .vs-custom {
    font-family: inherit;
    width: 100%;
  }
  
  .vs-custom .vs__dropdown-toggle {
    padding: 0.5rem;
    background: white;
    border: var(--vs-border-width) var(--vs-border-style) var(--vs-border-color);
    border-radius: var(--vs-border-radius);
    transition: all 0.2s;
  }
  
  .vs-custom .vs__dropdown-toggle:hover {
    border-color: #cbd5e1;
  }
  
  .vs-custom .vs__dropdown-toggle:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    outline: none;
  }
  
  .vs-custom .vs__selected-options {
    padding: 0 2px;
  }
  
  .vs-custom .vs__search {
    padding: 0 7px;
    margin: 4px 0 0 0;
    font-size: 0.875rem;
    border: none;
  }
  
  .vs-custom .vs__search::placeholder {
    color: #94a3b8;
  }
  
  .vs-custom .vs__selected {
    margin: 4px 2px 0 2px;
    padding: 0 0.25em;
    font-size: 0.875rem;
    color: #1e293b;
  }
  
  .vs-custom .vs__dropdown-menu {
    padding: 0.5rem 0;
    border: 1px solid var(--vs-border-color);
    border-radius: var(--vs-border-radius);
    background: white;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  
  .vs-custom .vs__dropdown-option {
    padding: 0.5rem 1rem;
    color: #64748b;
  }
  
  .vs-custom .vs__dropdown-option--highlight {
    background: #f1f5f9;
    color: #1e293b;
  }
  
  .vs-custom .vs__clear,
  .vs-custom .vs__actions {
    padding: 0 0.25rem;
  }
  
  /* Animations de transition */
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