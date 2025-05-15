<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex justify-between items-center">
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
      <div class="flex gap-2">
        <template v-if="inventory?.statut?.toLowerCase() === 'en attente'">
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
        </template>
        <button
          class="px-4 py-2 dark:text-white-light hover:bg-primary text-black border border-secondary font-medium rounded transition-colors"
          @click="goBack"
        >
          Retour
        </button>
      </div>
    </div>

    <!-- Container principal -->
    <div v-if="inventory" class="panel rounded-xl overflow-hidden">
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
                : 'text-secondary dark:text-white-dark hover:text-secondary-600 hover:border-secondary-light'
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
            <div class="flex flex-col gap-4">
              <div class="flex items-center gap-2">
                <span class="text-sm dark:text-white-dark font-medium text-secondary">Libellé :</span>
                <span class="text-md dark:text-white-dark font-medium text-secondary">{{ inventory.label ?? '' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm  dark:text-white-dark dark:text-white-darkfont-medium text-secondary">Statut :</span>
                <span
                  class="px-4 rounded-full text-sm font-semibold"
                  :class="getStatusClass(inventory?.statut)"
                >
                  {{ inventory.statut }}
                </span>
              </div>
            </div>
            <div class="flex flex-col gap-4">
              <div class="flex items-center gap-2">
                <span class="text-sm dark:text-white-dark font-medium text-secondary">Date d'inventaire :</span>
                <span class="text-md dark:text-white-dark  font-medium text-secondary">{{ formatDate(inventory.inventory_date) }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm dark:text-white-dark font-medium text-secondary">Type :</span>
                <span class="text-md dark:text-white-dark font-medium text-secondary">{{ inventory.type ?? '' }}</span>
              </div>
            </div>
          </div>

          <!-- Paramètres de comptage -->
          <section>
            <h3 class="text-lg dark:text-white-light font-medium text-gray-900 mb-4">Paramètres de comptage</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                v-for="(contage, i) in inventory.contages"
                :key="i"
                class="bg-gray-50 dark:bg-transparent  p-4 rounded-md border border-gray-500/20 shadow-sm"
              >
                <p class="font-semibold dark:text-white-dark mb-3 text-gray-700">Comptage {{ i + 1 }}</p>
                <ul class="text-sm dark:text-white-dark  text-gray-600 space-y-2">
                  <li class="flex items-center gap-2">
                    <span class="font-medium">Mode:</span>
                    {{ contage.mode || 'Non défini' }}
                  </li>
                  <li v-if="contage.isVariant" class="flex items-center gap-2">
                    Variantes activées
                  </li>
                  <li v-if="contage.useScanner" class="flex items-center gap-2">
                    Scanner activé
                  </li>
                  <li v-if="contage.useSaisie" class="flex items-center gap-2">
                    Saisie activée
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <!-- Magasins associés -->
          <section class="bg-gray-50 dark:bg-transparent border-gray-500/20 p-4 rounded-lg border border-gray-200">
            <h3 class="text-lg font-medium dark:text-white-light text-gray-900 mb-4">Magasins associés</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="mag in magasins"
                :key="mag"
                class="bg-white dark:bg-transparent border-gray-500/20 p-4 rounded-md shadow-sm border border-gray-100 flex items-center gap-3"
              >
                <div class="w-2 h-2 bg-primary rounded-full"></div>
                <span class="text-secondary dark:text-white-dark">{{ mag }}</span>
              </div>
            </div>
          </section>
        </div>

        <!-- Contages détaillés -->
        <div v-else class="space-y-6">
          <template v-for="tab in tabs.filter(t => t.id !== 'general')" :key="tab.id">
            <div v-if="currentTab === tab.id">
              <div class="flex flex-col gap-4 mb-6">
                <div class="flex justify-between  items-center">
                  <h2 class="text-xl dark:text-white-light font-semibold text-secondary">
                    {{ tab.label }}
                  </h2>
                  <ToggleButtons
                    v-model="viewMode"
                    :options="[
                      { value: 'table', icon: IconListCheck },
                      { value: 'grid', icon: IconLayoutGrid }
                    ]"
                  />
                </div>
                <!-- Statistiques du comptage -->
                <div class=" grid grid-cols-4   gap-8 border-b border-gray-200 pb-4">
                  <div class="bg-white  dark:bg-transparent border-gray-500/20 px-4 py-4 rounded-md shadow-sm border border-gray-100 flex items-center gap-3">
                     <div class="w-2 h-2 bg-primary rounded-full"></div>
                    <span class="text-lg font-medium text-secondary">Restants:</span>
                    <span class="text-lg font-semibold text-secondary">{{ getRemainingJobsCount(tab.id) }}</span>
                  </div>
                   <div class="bg-white  dark:bg-transparent border-gray-500/20 px-4 py-4 rounded-md shadow-sm border border-gray-100 flex items-center gap-3">
                     <div class="w-2 h-2 bg-info rounded-full"></div>
                    <span class="text-lg font-medium text-secondary">En cours:</span>
                    <span class="text-lg font-semibold text-secondary">{{ getInProgressJobsCount(tab.id) }}</span>
                  </div>
                  <div class="bg-white  dark:bg-transparent border-gray-500/20 px-4 py-4 rounded-md shadow-sm border border-gray-100 flex items-center gap-3">
                     <div class="w-2 h-2 bg-success  rounded-full"></div>
                    <span class="text-lg font-medium text-secondary">Jobs terminés:</span>
                    <span class="text-lg font-semibold text-secondary">{{ getCompletedJobsCount(tab.id) }}/{{ getTotalJobsCount(tab.id) }}</span>
                  </div>
                 
                  
                </div>
              </div>

              <DataTable
                v-if="viewMode === 'table'"
                :columns="jobColumns"
                :rowDataProp="getJobsForTab(tab.id)"
                :pagination="true"
                :showColumnSelector="false"
                :storageKey="'inventory_jobs_' + tab.id"
              />
              <GridView
                v-else
                :data="getJobsForTab(tab.id)"
                titleField="name"
                :stats="[{ label: 'Status', value: 'status' }]"
                :selected-item="null"
              />
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
import GridView from '@/components/GridView/GridView.vue';
import ToggleButtons from '@/components/ToggleButtons/ToggleButtons.vue';
import IconListCheck from '@/components/icon/icon-list-check.vue';
import IconLayoutGrid from '@/components/icon/icon-layout-grid.vue';
import { useInventoryDetail } from '@/composables/useInventoryDetail';

const route = useRoute();
const inventoryId = Number(route.params.id);

const {
  currentTab,
  viewMode,
  inventory,
  tabs,
  jobColumns,
  magasins,
  launchInventory,
  editInventory,
  goBack,
  formatDate,
  getStatusClass,
  getJobsForTab,
  loadDetailData,
  getCompletedJobsCount,
  getInProgressJobsCount,
  getRemainingJobsCount,
  getTotalJobsCount
} = useInventoryDetail(inventoryId);

onMounted(() => {
  loadDetailData();
});
</script>