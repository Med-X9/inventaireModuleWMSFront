<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { usePlanning } from '@/composables/usePlanning';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import DataTable from '@/components/DataTable/DataTable.vue';
import IconTrashLines from '@/components/icon/icon-trash-lines.vue';

import type { ColDef } from 'ag-grid-community';
import type { ActionConfig } from '@/interfaces/dataTable';
import type { FieldConfig } from '@/interfaces/form';

const {
  selectedDate,
  jobs,
  zones,
  subZones,
  selectedZone,
  selectedSubZone,
  availableLocations,
  tempSelectedLocations,
  locationSearchQuery,
  selectedAvailable,
  selectedAdded,
  isSubmitting,
  canValidate,
  addSelectedLocations,
  addAllLocations,
  removeSelectedLocations,
  removeAllLocations,
  createJob,
  cancelJobCreation,
  deleteJob,
  validateAll,
  cancelPlanning
} = usePlanning();

// Date form
const dateForm = ref({ date: selectedDate.value });
watch(() => dateForm.value.date, v => (selectedDate.value = v));
const dateFields: FieldConfig[] = [
  { key: 'date', label: 'Date', type: 'date', validators: [{ key: 'required', fn: v => !!v, msg: 'Date requise' }] }
];

// Zone form fields
const zoneFields: FieldConfig[] = [
  {
    key: 'selectedZone',
    label: 'Zone',
    type: 'select',
    options: [
      { label: 'Toutes les zones', value: '' },
      ...zones.value.map(zone => ({ label: zone, value: zone }))
    ]
  },
  {
    key: 'selectedSubZone',
    label: 'Sous-zone',
    type: 'select',
    options: [
      { label: 'Toutes les sous-zones', value: '' },
      ...subZones.value.map(subZone => ({ label: subZone, value: subZone }))
    ]
  }
];

const zoneForm = ref({
  selectedZone: selectedZone.value,
  selectedSubZone: selectedSubZone.value
});

watch(() => zoneForm.value.selectedZone, (newVal) => {
  selectedZone.value = newVal;
});

watch(() => zoneForm.value.selectedSubZone, (newVal) => {
  selectedSubZone.value = newVal;
});

// Columns + actions
const jobColumns: ColDef[] = [ { headerName: 'Emplacements', field: 'locations' } ];
const jobActions: ActionConfig[] = [ { label: 'Supprimer', icon: IconTrashLines, handler: row => deleteJob(row.id) } ];

const jobsMap = computed(() => jobs.value.map(j => ({ ...j, locations: j.locations.join(', ') })));
</script>

<template>
  <div>
    <!-- Breadcrumbs -->
    <ul class="flex space-x-2 mb-4">
      <li>
        <router-link :to="{ name: 'inventory-list' }" class="text-primary hover:underline">
          Gestion d'inventaire
        </router-link>
      </li>
      <li><router-link :to="{ name: 'planning-management' }" class="before:content-['/'] ltr:before:mr-2 text-primary hover:underline">Gestion des plannings</router-link></li>
      <li class="before:content-['/'] ltr:before:mr-2"><span>Planifier</span></li>
    </ul>

    <div class="py-4">
      <!-- Date + actions -->
      <div class="mb-9 flex flex-col lg:flex-row justify-between gap-8">
        <div class="flex-1 rounded-xl panel bg-white px-4 py-6">
          <h2 class="text-lg mb-4">Date de planification</h2>
          <FormBuilder v-model="dateForm" :fields="dateFields" :columns="1" hide-submit />
        </div>
        <div class="w-full lg:w-80 panel rounded-xl p-6 text-center space-y-4">
          <p class="text-sm text-gray-600">Confirmez ou annulez</p>
          <button @click="validateAll" :disabled="!canValidate || isSubmitting" class="w-full px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">✓ Valider</button>
          <button @click="cancelPlanning" class="w-full px-4 py-2 bg-danger text-white rounded-lg">✕ Annuler</button>
        </div>
      </div>

      <!-- Jobs Section -->
      <section class="panel rounded-xl p-4 md:p-6 space-y-6">
        <h2 class="text-xl font-semibold mb-6">Les Jobs</h2>

        <div class="grid grid-cols-1 gap-y-4 lg:grid-cols-[1fr_auto_1fr] lg:gap-x-2">
          <!-- Available Locations -->
          <section class="flex-1 flex flex-col min-w-0">
            <div class=" rounded-lg shadow-sm border border-white-dark/20 min-h-[500px]">
              <div class="p-4 border-b border-white-dark/20 flex justify-between items-center border-gray-200">
                <h3 class="text-lg font-medium text-gray-800">Emplacements disponibles</h3>
                <span class="inline-block bg-gray-400/10 dark:bg-dark-light/10  dark:text-white-light text-xs font-medium px-2 py-1 rounded-full">
                  {{ availableLocations.length }}
                </span>
              </div>

              <div class="relative mb-2 p-4">
                <div class=" mb-3">
                  <FormBuilder
                    v-model="zoneForm"
                    :fields="zoneFields"
                    :columns="2"
                    hide-submit
                  />
                </div>
                <input
                  v-model="locationSearchQuery"
                  type="search"
                  placeholder="Rechercher un emplacement..."
                  class="w-full px-4 py-2 border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-10"
                />
              </div>

              <ul class="w-full flex-1 py-2 max-h-[17rem] overflow-auto divide-y divide-gray-200 border-t border-gray-300">
                <transition-group name="slide-fade" tag="div">
                  <li
                    v-for="loc in availableLocations"
                    :key="loc"
                    @click="selectedAvailable.includes(loc)
                      ? selectedAvailable = selectedAvailable.filter(v => v !== loc)
                      : selectedAvailable.push(loc)"
                    :class="[
                      'flex items-center px-3 py-2 cursor-pointer transition-colors hover:bg-gray-100',
                      selectedAvailable.includes(loc) ? 'font-medium text-black' : 'text-gray-700'
                    ]"
                  >
                    <input
                      type="checkbox"
                      :checked="selectedAvailable.includes(loc)"
                      class="mr-2 h-4 w-4 form-checkbox"
                    />
                    <span class="flex-1">{{ loc }}</span>
                  </li>
                </transition-group>
              </ul>
            </div>
            <div class="mt-2 text-center">
              <button
                @click="addAllLocations"
                :disabled="!availableLocations.length"
                class="text-xs text-gray-500 hover:underline disabled:text-gray-300 inline-flex items-center"
              >
                Tout sélectionner
                <span class="ml-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 p-1 ml-2 rounded-lg bg-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            </div>
          </section>

          <!-- Selection Arrows -->
          <div class="flex md:flex-col gap-4 justify-center items-center">
            <button
              @click="addSelectedLocations"
              :disabled="!selectedAvailable.length"
              class="p-2 bg-primary hover:bg-primary-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-shadow shadow-sm hover:shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              @click="removeSelectedLocations"
              :disabled="!selectedAdded.length"
              class="p-2 bg-danger hover:bg-red-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-shadow shadow-sm hover:shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          <!-- Selected Locations -->
          <section class="flex flex-col">
           <div class=" rounded-lg shadow-sm border border-white-dark/20 min-h-[500px]">
              <div class="p-4 border-b border-white-dark/20 flex justify-between items-center border-gray-200">
                <h3 class="text-lg font-medium text-gray-800">Emplacements disponibles</h3>
                <span class="inline-block bg-gray-400/10 dark:bg-dark-light/10  dark:text-white-light text-xs font-medium px-2 py-1 rounded-full">
                  {{  tempSelectedLocations.length  }}
                </span>
              </div>
              
              <ul class="flex-1 max-h-[26rem] py-2 overflow-auto">
                <transition-group name="slide-fade" tag="div">
                  <li
                    v-for="loc in tempSelectedLocations"
                    :key="loc"
                    @click="selectedAdded.includes(loc)
                      ? selectedAdded = selectedAdded.filter(v => v !== loc)
                      : selectedAdded.push(loc)"
                    :class="[
                      'flex items-center px-3 py-2 cursor-pointer transition-colors hover:bg-gray-100',
                      selectedAdded.includes(loc) ? 'font-medium text-black' : 'text-gray-700'
                    ]"
                  >
                    <input
                      type="checkbox"
                      :checked="selectedAdded.includes(loc)"
                      class="mr-2 h-4 w-4 form-checkbox"
                    />
                    <span class="flex-1">{{ loc }}</span>
                  </li>
                </transition-group>
              </ul>
            </div>
            <div class="mt-2 text-center">
              <button
                @click="removeAllLocations"
                :disabled="!tempSelectedLocations.length"
                class="text-xs text-gray-500 hover:underline disabled:text-gray-300 inline-flex items-center"
              >
                <span class="mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 p-1 mr-2 rounded-lg bg-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                  </svg>
                </span>
                Tout désélectionner
              </button>
            </div>
          </section>
        </div>

        <div class="flex justify-end gap-4 mt-6">
          <button
            @click="cancelJobCreation"
            class="btn py-1 btn-outline-primary"
          >
            Annuler
          </button>
          <button
            @click="createJob"
            :class="{ 'opacity-50 cursor-not-allowed': !tempSelectedLocations.length }"
            class="btn btn-primary"
          >
            <span v-if="!isSubmitting">Créer le job</span>
            <svg v-else class="animate-spin h-5 w-5 mx-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </button>
        </div>

        <DataTable
          v-if="jobs.length"
          :columns="jobColumns"
          :rowDataProp="jobsMap"
          :actions="jobActions"
          actionsHeaderName="Actions"
          :showColumnSelector="false"
          storageKey="planning_jobs"
        />
        <div v-else>
          <div class="text-center py-12 border-dashed border-2 rounded-lg">
            <p>Aucun job</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
@media (max-width: 1024px) {
  .grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  section {
    min-height: auto;
  }
}
</style>