<template>
  <div class="space-y-2">
    <!-- En-tête -->
      <div class="flex flex-wrap gap-2 mb-4 justify-end">
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
          terminer
        </button>
        <button
          class="btn btn-primary "
          
        >
          cloturer
        </button>
         <button
          class="btn btn-primary "
          
        >
          Annuler
        </button>
          
          <button type="button"  @click="exportToPDF" v-tippy:button class="btn btn-primary"><IconDownload class="w-5 h-5 mr-2" />PDF</button>
          <tippy target="button" placement="bottom">Exporter en PDF</tippy>
      </div>
    

    <!-- Container principal -->
    <div v-if="inventory" class="panel">
      <!-- Onglets -->
      <div class="border-b  border-gray-200 overflow-x-auto md:overflow-hidden">
        <nav class="flex  py-3 gap-6 sm:gap-12 -mb-px min-w-max">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="currentTab = tab.id"
            :class="[
              ' font-medium whitespace-nowrap pb-2',
              currentTab === tab.id
                ? 'border-b-2  border-primary text-primary'
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
  <div class="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
    <div class="flex items-center gap-3">
      
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white-light">Paramètres de comptage</h3>
    </div>
  </div>
  <div class="px-4 sm:px-4 py-4">
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div
        v-for="(comptage, i) in inventory.contages"
        :key="i"
        class="relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-gray-200/60 dark:border-gray-600/60 hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-700 transition-all duration-300 hover:-translate-y-1 group"
      >
        <!-- Numéro de comptage avec badge -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
           
            <h4 class=" font-normal dark:text-gray-100 text-base">
              {{ i + 1 }}{{ i === 0 ? 'er' : 'ème' }} comptage
            </h4>
          </div>
          <div class="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
        </div>
        
        <!-- Mode de comptage avec style amélioré -->
        <div class="mb-4">
          <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-xl">
        <div class="flex items-center gap-3">
          
          <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">Mode de comptage</span>
        </div>
        <span class="text-sm bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full">
          {{ comptage.mode || 'Non défini' }}
        </span>
      </div>
    </div>
       

        <!-- Options avec badges colorés -->
        <div class="space-y-2">
        
          <div class="flex flex-wrap gap-2">
            <span 
              v-if="comptage.isVariant" 
              class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold text-primary-600 border-gray-100 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/50 shadow-sm hover:shadow-md transition-shadow"
            >
              <svg class="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              Variantes
            </span>
            
            <span 
              v-if="comptage.useScanner" 
              class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold text-primary-600 border-gray-100 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/50 shadow-sm hover:shadow-md transition-shadow"
            >
              <svg class="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zM17 4a1 1 0 01-1 1h-2.586l-2.293 2.293a1 1 0 11-1.414-1.414L12 3.586V2a1 1 0 012 0v2z" clip-rule="evenodd"/>
              </svg>
              Scanner
            </span>
            
            <span 
              v-if="comptage.useSaisie" 
              class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold text-primary-600 border-gray-100 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/50 shadow-sm hover:shadow-md transition-shadow"
            >
              <svg class="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
              </svg>
              Saisie manuelle
            </span>

            <span 
              v-if="comptage.stock" 
              class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold text-primary-600 border-gray-100 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/50 shadow-sm hover:shadow-md transition-shadow"
            >
              <svg class="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
              Stock
            </span>
          </div>
          
          <!-- Indicateur si aucune option -->
          <div 
            v-if="!comptage.isVariant && !comptage.useScanner && !comptage.useSaisie && !comptage.stock" 
            class="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"
          >
            <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
            <span class="text-sm text-gray-500 dark:text-gray-400">
              Configuration de base
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>


          <!-- Card : Magasins associés -->
           <div class="bg-white dark:bg-gray-700 rounded-2xl shadow-md ring-1 ring-gray-200 dark:ring-gray-600 overflow-hidden">
            <div class="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between">
                <h3 class="text-lg text-gray-800 dark:text-white-light">Magasins associés</h3>
                <span class="text-sm text-gray-500 dark:text-gray-400">{{ magasinsGridData.length }} magasin(s)</span>
              </div>
            </div>
            <div>
              <GridView class="p-4"
                :data="magasinsGridData"
                titleField=""
                :columns="3"
                :enableStats="false"
                :enableActions="true"
                :actions="magasinActions"
                :itemsPerPage="6"
                :enablePagination="true"
                :selectedItem="null"
              >
                <template #content="{ item }">
                  <div class="space-y-2">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 bg-primary rounded-full"></div>
                      <span class="font-semibold text-md dark:text-white-dark text-secondary group-hover:text-primary transition-colors duration-300">{{ item.name }}</span>
                    </div>
                  </div>
                </template>
              </GridView>
            </div>
          </div>

          <!-- Card : Équipes assignées -->
          <div class="bg-white dark:bg-gray-700 rounded-2xl shadow-md ring-1 ring-gray-200 dark:ring-gray-600 overflow-hidden">
            <div class="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between">
                <h3 class="text-lg text-gray-800 dark:text-white-light">Équipes assignées</h3>
                <span class="text-sm text-gray-500 dark:text-gray-400">{{ teamsGridData.length }} équipe(s)</span>
              </div>
            </div>
            <div class="p-4">
              <GridView
                :data="teamsGridData"
                titleField=""
                :columns="3"
                :enableStats="false"
                :enableActions="true"
                :actions="teamActions"
                :itemsPerPage="6"
                :enablePagination="true"
                :selectedItem="null"
              >
                <template #content="{ item }">
                  <div class=" space-y-3">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span class="text-primary font-semibold text-sm">{{ item.initial }}</span>
                      </div>
                      <div class="flex-1">
                        <div class="font-semibold text-md dark:text-white-dark text-secondary group-hover:text-primary transition-colors duration-300">{{ item.type }}</div>
                      </div>
                    </div>
                  </div>
                </template>
              </GridView>
            </div>
          </div>
        </div>
        <!-- Comptages détaillés -->
        <div v-else class="py-5">
          <template v-for="tab in tabs.filter(t => t.id !== 'general')" :key="tab.id">
            <div v-if="currentTab === tab.id">
              <div class="space-y-1">

                <!-- Table view -->
                <div class="overflow-hidden">
                  <DataTable
                    :columns="jobColumns"
                    :rowDataProp="getJobsForTab(tab.id)"
                    :pagination="true"
                    :showColumnSelector="true"
                    :storageKey="'inventory_jobs_' + tab.id"
                   >
                  <template #contenu>
                    <div class="flex flex-col sm:flex-row gap-4 md:items-center ">
                  <div class="flex flex-col sm:flex-row gap-4">
                    <div class="flex space-x-2 pb-4">
                      <div class="flex items-center px-2 py-1.5 justify-center bg-white border border-gray-300 rounded">
                        <div class="w-2 h-2 justify-center bg-primary rounded-full mr-2"></div>
                        <span class="text-sm text-gray-600 dark:text-gray-400">en attente : {{ getRemainingJobsCount(tab.id) }}</span>
                      </div>
                      <div class="flex items-center px-2 py-1.5 justify-center bg-white border border-gray-300 rounded">
                        <div class="w-2 h-2 bg-info rounded-full mr-2"></div>
                        <span class="text-sm text-gray-600 dark:text-gray-400">en cours : {{ getInProgressJobsCount(tab.id) }}</span>
                      </div>
                      <div class="flex items-center px-2 py-1.5 justify-center bg-white border border-gray-300 rounded">
                        <div class="w-2 h-2 bg-success rounded-full mr-2"></div>
                        <span class="text-sm text-gray-600 dark:text-gray-400">terminés : {{ getCompletedJobsCount(tab.id) }}</span>
                      </div>
                    </div>
                  </div>
                 </div>
                   
                
                  </template>
                  </DataTable>
            
                
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
import GridView from '@/components/GridView/GridView.vue';
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
  teamsGridData,
  magasinsGridData,
  teamActions,
  magasinActions,
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