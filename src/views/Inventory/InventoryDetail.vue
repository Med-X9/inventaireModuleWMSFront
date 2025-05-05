<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex justify-between items-center">
      <h1 class="text-xl font-bold text-gray-800">Détail de l'inventaire</h1>
      <div class="flex gap-2">
        <button
          class="px-4 py-2 bg-primary hover:bg-primary-600 text-black font-medium rounded transition-colors"
          @click="launchInventory"
        >
          Lancer
        </button>
        <button
          class="px-4 py-2 bg-primary hover:bg-primary-600 text-black font-medium rounded transition-colors"
          @click="editInventory"
        >
          Modifier
        </button>
        <button
          class="px-4 py-2 hover:bg-primary text-black border border-secondary font-medium rounded transition-colors"
          @click="goBack"
        >
          Retour
        </button>
      </div>
    </div>

    <!-- Container principal -->
    <div class="bg-white rounded-xl shadow-md overflow-hidden">
      <!-- Onglets -->
      <div class="border-b border-gray-200">
        <nav class="flex -mb-px">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="currentTab = tab.id"
            :class="[
              'px-6 py-3 text-sm font-medium',
              currentTab === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-secondary hover:text-secondary-600 hover:border-secondary-light'
            ]"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <div class="p-6 py-10">
        <!-- Informations générales -->
        <div v-if="currentTab === 'general'" class="space-y-8">
          <!-- Infos basiques -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div class="flex flex-col gap-2">
              <InfoItem label="Libellé" :value="inventory.label ?? ''" />
              <h3 class="text-sm font-medium text-secondary mb-1">Statut</h3>
              <span
                class="px-4 py-1  rounded-full text-sm font-semibold self-start"
                :class="getStatusClass(inventory.statut)"
              >
                {{ inventory.statut }}
              </span>
            </div>
            <div>
            <InfoItem class="mb-2 text-sm" label="Date d'inventaire" :value="formatDate(inventory.inventory_date)" />
            <InfoItem class=" text-sm" label="Type" :value="inventory.type ?? ''" />
           </div>
          </div>

          <!-- Paramètres de comptage -->
          <section>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Paramètres de comptage</h3>
            <div class="flex flex-wrap gap-4">
              <div
                v-for="(contage, i) in inventory.contages"
                :key="i"
                class="flex-1 min-w-[220px] bg-gray-50 p-4 rounded-md border border-gray-200 shadow-sm"
              >
                <p class="font-semibold mb-2 text-gray-700">Comptage {{ i + 1 }}</p>
                <ul class="text-sm text-gray-600 space-y-1">
                  <li><strong>Mode : </strong>{{ contage.mode || 'Non défini' }}</li>
                  <li v-if="contage.isVariant"> Variantes activées</li>
                  <li v-if="contage.useScanner"> Scanner activé</li>
                  <li v-if="contage.useSaisie"> Saisie activée</li>
                </ul>
              </div>
            </div>
          </section>

          <!-- Magasins associés -->
          <section>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Magasins associés</h3>
            <div class="flex flex-col space-y-2">
              <span
                v-for="mag in magasins"
                :key="mag"
                class="text-secondary"
              >
                • {{ mag }}
              </span>
            </div>
          </section>
        </div>

        <!-- Contages détaillés (jobs) -->
        <div v-else class="space-y-6">
          <template v-for="idx in tabs.filter(t => t.id !== 'general')" :key="idx.id">
            <div v-if="currentTab === idx.id">
              <!-- Toggle Table / Grid -->
              <div class="flex justify-end mb-4">
                <ToggleButtons
                  v-model="viewMode"
                  :options="[
                    { value: 'table', icon: IconListCheck },
                    { value: 'grid', icon: IconLayoutGrid }
                  ]"
                />
              </div>

              <!-- Jobs liés -->
              <DataTable
                v-if="viewMode === 'table'"
                :columns="jobColumns"
                :rowDataProp="jobsData"
                :pagination="true"
                :showColumnSelector="false"
                storageKey="inventory_jobs_table"
              />
              <GridView
                v-else
                :data="jobsData"
                titleField="name"
                :stats="[{ label: 'Status', value: 'status' }]"
                :selected-item="null"
              >
              <template #header>
                <h2 class="text-xl font-semibold mb-6 text-secondary flex items-center">
                Jobs
               </h2>
              </template>
          </GridView>
            </div>
          </template>
          
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineComponent } from 'vue';
import DataTable from '@/components/DataTable/DataTable.vue';
import GridView from '@/components/GridView/GridView.vue';
import ToggleButtons from '@/components/ToggleButtons/ToggleButtons.vue';
import IconListCheck from '@/components/icon/icon-list-check.vue';
import IconLayoutGrid from '@/components/icon/icon-layout-grid.vue';
import { useInventoryDetail } from '@/composables/useInventoryDetail';

// Initialisation conforme à InventoryManagement
const initialInventory = {
  id: 1,
  reference: 'INV-001',
  inventory_date: '2025-04-30',
  statut: 'En cours',
  label: 'Inventaire de printemps',
  type: 'Inventaire Général',
  pending_status_date: '2025-04-30',
  current_status_date: '2025-04-30',
  date_status_launch: '2025-04-30',
  date_status_end: '2025-04-30',
  contages: [
    { mode: 'liste emplacement', isVariant: false, useScanner: true, useSaisie: false },
    { mode: 'article + emplacement', isVariant: true, useScanner: false, useSaisie: false },
    { mode: 'liste emplacement', isVariant: false, useScanner: false, useSaisie: true }
  ]
} as unknown as import('@/interfaces/inventoryManagement').InventoryManagement;

const {
  currentTab,
  viewMode,
  inventory,
  tabs,
  jobColumns,
  jobsData,
  magasins,
  launchInventory,
  editInventory,
  goBack,
  formatDate,
  getStatusClass
} = useInventoryDetail(initialInventory);

const InfoItem = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: [String, Number], required: false }
  },
  template: `
    <div>
      <h3 class="text-sm font-medium text-secondary">{{ label }}</h3>
      <p class="text-lg font-medium text-secondary">{{ value }}</p>
    </div>
  `
});
</script>

<style scoped>
.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
}
</style>