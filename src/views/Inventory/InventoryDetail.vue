<template>
  <div class="space-y-2">
    <!-- En-tête -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <ul class="flex space-x-2 rtl:space-x-reverse">
        <li>
          <router-link
            :to="{ name: 'inventory-list' }"
            class="text-primary hover:underline"
          >
            Gestion d'inventaire
          </router-link>
        </li>
        <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          <span>Détail de l'inventaire</span>
        </li>
      </ul>
      <div class="flex flex-wrap gap-2 mb-4">
        <template v-if="inventory?.statut?.toLowerCase() === 'en attente'">
          <button
            class="btn btn-primary "
            @click="launchInventory"
          >
            Lancer
          </button>
          <button
            class="btn btn-primary"
            @click="editInventory"
          >
            Modifier
          </button>
        </template>

        <button
          class="btn btn-danger "
          @click="cancelInventory"
        >
          Annuler
        </button>
          
          <button type="button"  @click="exportToPDF" v-tippy:button class="btn btn-primary"><IconDownload class="w-5 h-5 mr-2" />PDF</button>
          <tippy target="button" placement="bottom">Exporter en PDF</tippy>
      </div>
    </div>

    <!-- Container principal -->
    <div v-if="inventory" class="panel">
      <!-- Onglets -->
      <div class="border-b border-gray-200 overflow-x-auto md:overflow-hidden">
        <nav class="flex py-3 gap-6 sm:gap-12 -mb-px min-w-max">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="currentTab = tab.id"
            :class="[
              ' font-medium whitespace-nowrap',
              currentTab === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-secondary  dark:text-white-dark hover:text-secondary-600 hover:border-secondary-light'
            ]"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <div>
       <!-- Informations générales -->
        <div v-if="currentTab === 'general'" class="space-y-6 py-6">
        
          <div class="bg-white dark:bg-gray-700 rounded-2xl shadow-md ring-1 ring-gray-200 dark:ring-gray-600 overflow-hidden">
            <div class="px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-lg  text-gray-800 dark:text-white-light mb-2 sm:mb-0">Informations générales</h2>
              <span
                :class="[
                  'px-3 py-1 rounded-full text-sm font-semibold',
                  getStatusClass(inventory?.statut)
                ]"
              >
                {{ inventory.statut }}
              </span>
            </div>
            <div class="px-4 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <!-- Libellé -->
              <div class="flex flex-col">
                <span class="text-sm text-gray-500 dark:text-gray-400">Libellé</span>
                <span class="mt-1 text-base font-medium text-gray-700 dark:text-gray-200">
                  {{ inventory.label || 'Non défini' }}
                </span>
              </div>
              <!-- Date d'inventaire -->
              <div class="flex flex-col">
                <span class="text-sm text-gray-500 dark:text-gray-400">Date d'inventaire</span>
                <span class="mt-1  text-base font-medium text-gray-700 dark:text-gray-200">
                  {{ formatDate(inventory.inventory_date) }}
                </span>
              </div>
              <!-- Type -->
              <div class="flex flex-col">
                <span class="text-sm text-gray-500 dark:text-gray-400">Type</span>
                <span class="mt-1  text-base font-medium text-gray-700 dark:text-gray-200">
                  {{ inventory.type || 'Non défini' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Card : Paramètres de comptage -->
          <div class="bg-white dark:bg-gray-700 rounded-2xl shadow-md ring-1 ring-gray-200 dark:ring-gray-600 overflow-hidden">

            <div class="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-lg  text-gray-800 dark:text-white-light">Paramètres de comptage</h3>
            </div>
            <div class="px-4 sm:px-6 py-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="(contage, i) in inventory.contages"
                :key="i"
                class="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
              >
                <h4 class="font-semibold text-gray-700 dark:text-gray-100 mb-3">Comptage {{ i + 1 }}</h4>
                <ul class="space-y-2 text-gray-600 dark:text-gray-300 text-sm">
                  <li class="flex justify-between">
                    <span>Mode</span>
                    <span>{{ contage.mode || 'Non défini' }}</span>
                  </li>
                  <li v-if="contage.isVariant" class="inline-block bg-gray-200 dark:bg-gray-200/10 dark:text-white text-gray-800  px-2 py-1 rounded-full text-xs">
                    Variantes activées
                  </li>
                  <li v-if="contage.useScanner" class="inline-block  bg-gray-200 dark:bg-gray-200/10 dark:text-white text-gray-800  px-2 py-1 rounded-full text-xs">
                    Scanner activé
                  </li>
                  <li v-if="contage.useSaisie" class="inline-block  bg-gray-200 dark:bg-gray-200/10 dark:text-white text-gray-800  px-2 py-1 rounded-full text-xs">
                    Saisie activée
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Card : Magasins associés -->
          <div class="bg-white dark:bg-gray-700 rounded-2xl shadow-md ring-1 ring-gray-200 dark:ring-gray-600 overflow-hidden">
            <div class="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-lg  text-gray-800 dark:text-white-light">Magasins associés</h3>
            </div>
            <div class="px-4 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="mag in magasins"
                :key="mag"
                class="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
              >
                <div class="w-3 h-3 bg-primary rounded-full"></div>
                <span class="text-gray-700 dark:text-gray-200">{{ mag }}</span>
              </div>
            </div>
          </div>

          <!-- Card : Équipes assignées -->
          <div class="bg-white dark:bg-gray-700 rounded-2xl shadow-md ring-1 ring-gray-200 dark:ring-gray-600 overflow-hidden">
            <div class="px-4 sm:px-6 py-4  border border-gray-200 dark:border-gray-700">
              <h3 class="text-lg  text-gray-800 dark:text-white-light">Équipes assignées</h3>
            </div>
            <div class="px-4 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="team in inventory.teams"
                :key="team.id"
                class="flex items-center gap-4 bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
              >
                <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span class="text-primary font-semibold">{{ team.name.charAt(0) }}</span>
                </div>
                <span class="text-gray-700 dark:text-gray-200 font-medium">{{ team.name }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- Contages détaillés -->
        <div v-else class="py-4">
          <template v-for="tab in tabs.filter(t => t.id !== 'general')" :key="tab.id">
            <div v-if="currentTab === tab.id">
              <div class="space-y-2">
                <div class="flex flex-col sm:flex-row gap-4 md:items-center justify-between">
                  <div class="flex flex-col sm:flex-row gap-4">
                    <div class="flex space-x-2 mb-2">
                      <div class="flex items-center px-2 py-1 justify-center bg-white border border-gray-300 rounded">
                        <div class="w-2 h-2 justify-center bg-primary rounded-full mr-2"></div>
                        <span class="text-sm text-gray-600 dark:text-gray-400">en attente : {{ getRemainingJobsCount(tab.id) }}</span>
                      </div>
                      <div class="flex items-center px-2 py-1 justify-center bg-white border border-gray-300 rounded">
                        <div class="w-2 h-2 bg-info rounded-full mr-2"></div>
                        <span class="text-sm text-gray-600 dark:text-gray-400">en cours : {{ getInProgressJobsCount(tab.id) }}</span>
                      </div>
                      <div class="flex items-center px-2 py-1 justify-center bg-white border border-gray-300 rounded">
                        <div class="w-2 h-2 bg-success rounded-full mr-2"></div>
                        <span class="text-sm text-gray-600 dark:text-gray-400">terminés : {{ getCompletedJobsCount(tab.id) }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Table view -->
                <div class="overflow-hidden">
                  <DataTable
                    :columns="jobColumns"
                    :rowDataProp="getJobsForTab(tab.id)"
                    :pagination="true"
                    :showColumnSelector="true"
                    :storageKey="'inventory_jobs_' + tab.id"
                  />
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import DataTable from '@/components/DataTable/DataTable.vue';
import IconDownload from '@/components/icon/icon-download.vue';
import { useInventoryDetail } from '@/composables/useInventoryDetail';

const route = useRoute();
const inventoryId = Number(route.params.id);

const {
  currentTab,
  inventory,
  tabs,
  jobColumns,
  magasins,
  launchInventory,
  editInventory,
  cancelInventory,
  formatDate,
  getStatusClass,
  getJobsForTab,
  loadDetailData,
  getCompletedJobsCount,
  getInProgressJobsCount,
  getRemainingJobsCount,
  getTotalJobsCount,
  exportToPDF,
} = useInventoryDetail(inventoryId);

onMounted(() => {
  loadDetailData();
});
</script>