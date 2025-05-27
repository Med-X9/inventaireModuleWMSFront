<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useAppStore } from '@/stores';
import { usePlanning } from '@/composables/usePlanning';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import ToggleButtons from '@/components/ToggleButtons/ToggleButtons.vue';
import DataTable from '@/components/DataTable/DataTable.vue';
import IconListCheck from '@/components/icon/icon-list-check.vue';
import IconLayoutGrid from '@/components/icon/icon-layout-grid.vue';
import IconTrashLines from '@/components/icon/icon-trash-lines.vue';

import type { ColDef } from 'ag-grid-community';
import type { ActionConfig } from '@/interfaces/dataTable';
import type { FieldConfig, SelectOption } from '@/interfaces/form';

// On récupère filteredLocations brut (avant exclusion des sélectionnés)
const {
  selectedDate,
  teams,
  jobs,
  zones,
  subZones,
  selectedZone,
  selectedSubZone,
  filteredLocations: rawFilteredLocations,
  locationSearchQuery,
  teamForm,
  showNewTeamForm,
  showNewJobForm,
  isSubmitting,
  canValidate,
  addTeam,
  addJob,
  deleteTeam,
  deleteJob,
  validateAll,
  cancelPlanning
} = usePlanning();

// Filtre disponible = brut moins déjà sélectionnés
const tempSelectedLocations = ref<string[]>([]);
const filteredLocations = computed(() =>
  rawFilteredLocations.value.filter(loc => !tempSelectedLocations.value.includes(loc))
);

// Fullscreen states
const isTeamsFullscreen = ref(false);
const isJobsFullscreen = ref(false);

// Selected lists
const selectedAvailable = ref<string[]>([]);
const selectedAdded = ref<string[]>([]);

// Auto fullscreen when opening forms
watch(showNewTeamForm, val => { if (val) isTeamsFullscreen.value = true; });
watch(showNewJobForm, val => { if (val) isJobsFullscreen.value = true; });

// Date form
const dateForm = ref({ date: selectedDate.value });
watch(() => dateForm.value.date, v => (selectedDate.value = v));
const dateFields: FieldConfig[] = [
  { key: 'date', label: 'Date', type: 'date', validators: [{ key: 'required', fn: v => !!v, msg: 'Date requise' }] }
];

// Team form
const sessions: SelectOption[] = [
  { label: 'ali', value: 'ali' },
  { label: 'Doha', value: 'Doha' },
  { label: 'Hanane', value: 'Hanane' }
];
const teamFields: FieldConfig[] = [
  { key: 'name', label: "Nom de l'équipe", type: 'text', validators: [{ key: 'required', fn: v => typeof v === 'string' && !!v.trim(), msg: 'Nom requis' }] },
  { key: 'session', label: 'Session', type: 'select', options: sessions, validators: [{ key: 'required', fn: v => !!v, msg: 'Session requise' }] }
];

// Toggle view
const appStore = useAppStore();
const viewModeAll = computed({ get: () => appStore.planningViewModeAll, set: m => appStore.setPlanningViewModeAll(m) });
const toggleOptions = [ { value: 'table', icon: IconListCheck }, { value: 'grid', icon: IconLayoutGrid } ];

// Columns + actions
const teamColumns: ColDef[] = [ { headerName: 'Nom', field: 'name' }, { headerName: 'Session', field: 'session' } ];
const teamActions: ActionConfig[] = [ { label: 'Supprimer', icon: IconTrashLines, handler: row => deleteTeam(row.id) } ];
const jobColumns: ColDef[] = [ { headerName: 'Emplacements', field: 'locations' } ];
const jobActions: ActionConfig[] = [ { label: 'Supprimer', icon: IconTrashLines, handler: row => deleteJob(row.id) } ];

const jobsMap = computed(() => jobs.value.map(j => ({ ...j, locations: j.locations.join(', ') })));
function addTeamRecord(data: Record<string, unknown>) { return addTeam(data as { name: string; session: string }); }

// Jobs selection functions
function addSelectedLocations() {
  const toAdd = filteredLocations.value.filter(loc => selectedAvailable.value.includes(loc));
  if (toAdd.length) {
    tempSelectedLocations.value.push(...toAdd);
  }
  selectedAvailable.value = [];
}

function addAllLocations() {
  if (filteredLocations.value.length) {
    tempSelectedLocations.value.push(...filteredLocations.value);
  }
}

function removeSelectedLocations() {
  tempSelectedLocations.value = tempSelectedLocations.value.filter(
    loc => !selectedAdded.value.includes(loc)
  );
  selectedAdded.value = [];
}

function removeAllLocations() {
  tempSelectedLocations.value = [];
}

function createJob() {
  if (tempSelectedLocations.value.length) {
    addJob(tempSelectedLocations.value);
    tempSelectedLocations.value = [];
    showNewJobForm.value = false;
  }
}

function cancelJobCreation() {
  tempSelectedLocations.value = [];
  showNewJobForm.value = false;
}
</script>


<template>
  <div>
    <!-- Breadcrumbs -->
    <ul class="flex space-x-2 mb-4">
      <li><router-link :to="{ name: 'planning-management' }" class="text-primary hover:underline">Gestion des plannings</router-link></li>
      <li class="before:content-['/'] ltr:before:mr-2"><span>Planifier</span></li>
    </ul>

    <!-- View toggle -->
    <div class="flex justify-end mb-2">
      <ToggleButtons v-model="viewModeAll" :options="toggleOptions" />
    </div>

    <div class="py-4">
      <!-- Date + actions -->
      <div class="mb-9 flex flex-col lg:flex-row justify-between gap-8">
        <div class="flex-1 panel bg-white shadow-sm px-4 py-6">
          <h2 class="text-lg mb-4">Date de planification</h2>
          <FormBuilder v-model="dateForm" :fields="dateFields" :columns="1" hide-submit />
        </div>
        <div class="w-full lg:w-80 panel shadow-sm p-6 text-center space-y-4">
          <p class="text-sm text-gray-600">Confirmez ou annulez</p>
          <button @click="validateAll" :disabled="!canValidate || isSubmitting" class="w-full px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">✓ Valider</button>
          <button @click="cancelPlanning" class="w-full px-4 py-2 bg-danger text-white rounded-lg">✕ Annuler</button>
        </div>
      </div>

      <!-- Sections -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 divide-x divide-gray-200">
        <!-- Teams -->
        <section
          :class="[
            { 'fixed inset-0 z-50 bg-white overflow-auto': isTeamsFullscreen },
            { 'hidden': isJobsFullscreen && !isTeamsFullscreen },
            'panel rounded-xl shadow-lg p-4 md:p-8 border transition-all duration-300 space-y-6'
          ]"
        >
          <button
            v-if="isTeamsFullscreen"
            @click="showNewTeamForm = false; isTeamsFullscreen = false"
            class="absolute top-4 right-4 mb-4 px-6 text-2xl hover:bg-gray-100 rounded-full transition"
          >
            ×
          </button>
          <div class="flex justify-between items-center ">
            <h2 class="text-xl font-semibold">Équipes</h2>
            <button @click="showNewTeamForm = !showNewTeamForm" class="px-4 py-2 text-primary-600 hover:text-primary-700">
              {{ showNewTeamForm ? '× Fermer' : '+ Nouvelle équipe' }}
            </button>
          </div>

          <FormBuilder
            v-if="showNewTeamForm"
            v-model="teamForm"
            :fields="teamFields"
            :columns="1"
            submit-label="Créer"
            @submit="addTeamRecord"
            class="mb-6 rounded-lg"
          />

          <component :is="viewModeAll === 'table' ? DataTable : 'div'" v-bind="viewModeAll === 'table' ? { columns: teamColumns, rowDataProp: teams, actions: teamActions, actionsHeaderName: 'Actions', showColumnSelector: false, storageKey: 'planning_teams' } : {}">
            <template #default>
              <div v-if="teams.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div v-for="t in teams" :key="t.id" class="group p-4 border rounded-lg hover:bg-gray-50 relative">
                  <div>
                    <span class="block font-medium">{{ t.name }}</span>
                    <span class="text-sm text-gray-600">{{ sessions.find(s => s.value === t.session)?.label }}</span>
                  </div>
                  <button @click="deleteTeam(t.id)" class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 px-2 py-1 text-secondary text-xs bg-white rounded">
                    <IconTrashLines class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div v-else class="text-center py-12 border-dashed border-2 rounded-lg">
                <p>Aucune équipe</p>
                <button @click="showNewTeamForm = true" class="mt-2 text-primary-600">Créer une équipe</button>
              </div>
            </template>
          </component>
        </section>

        <!-- Jobs -->
        <section
          :class="[
            { 'fixed inset-0 z-50 bg-white overflow-auto': isJobsFullscreen },
            { 'hidden': isTeamsFullscreen && !isJobsFullscreen },
            'panel rounded-xl shadow-lg p-4 md:p-8 border transition-all duration-300 space-y-6'
          ]"
        >
          <button
            v-if="isJobsFullscreen"
            @click="showNewJobForm = false; isJobsFullscreen = false"
            class="absolute top-4 right-4 mb-4 px-6 text-2xl hover:bg-gray-100 rounded-full transition"
          >
            ×
          </button>
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold">Jobs</h2>
            <button @click="showNewJobForm = !showNewJobForm" class="px-4 py-2 text-primary-600 hover:text-primary-700">
              {{ showNewJobForm ? '× Fermer' : '+ Nouveau job' }}
            </button>
          </div>

            <div v-if="showNewJobForm" class=" panel border p-10">
            
              <div class="grid grid-cols-1 gap-y-4 lg:grid-cols-[1fr_auto_1fr] lg:gap-x-2">
                <!-- Available Locations -->
                <section class="flex flex-col ">
                  <div class=" p-4 border border-gray-300 min-h-[500px] ">
                  <div class="flex justify-between items-center mb-3">
                    <h2 class="text-lg font-semibold text-gray-800">Emplacements disponibles</h2>
                    <span class="inline-block bg-primary-light text-primary-600 text-xs font-medium px-2 py-0.5 rounded-full">
                      {{ filteredLocations.length }}
                    </span>
                  </div>

                   <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <select 
                v-model="selectedZone" 
                class="w-full px-4 py-2 border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-10"
              >
                <option value="">Toutes les zones</option>
                <option v-for="zone in zones" :key="zone" :value="zone">{{ zone }}</option>
              </select>
              
              <select 
                v-model="selectedSubZone" 
                class="w-full px-4 py-2 border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-10"
              >
                <option value="">Toutes les sous-zones</option>
                <option v-for="subZone in subZones" :key="subZone" :value="subZone">
                  {{ subZone }}
                </option>
              </select>
            </div>

            <div class="relative mb-4">
              <input
                v-model="locationSearchQuery"
                type="search"
                placeholder="Rechercher un emplacement..."
                class="w-full px-4 py-2 border rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-10"
              />
              <button 
                v-if="locationSearchQuery"
                @click="locationSearchQuery = ''" 
                class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

                  <ul class=" w-full flex-1 py-2 max-h-80 overflow-auto divide-y divide-gray-200  border-t border-gray-300">
                    <transition-group name="slide-fade"  tag="div">
                      <li
                        v-for="loc in filteredLocations"
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
                      :disabled="!filteredLocations.length"
                      class="text-xs text-gray-500 hover:underline disabled:text-gray-300 inline-flex items-center"
                    >
                      Tout sélectionner
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 p-1 ml-2 rounded-lg bg-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
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
                <section class="flex flex-col ">
                    <div class=" p-4 border border-gray-300 min-h-[500px]">
                  <div class="flex justify-between items-center mb-3">
                    <h2 class="text-lg font-semibold text-gray-800">Emplacements sélectionnés</h2>
                    <span class="inline-block bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {{ tempSelectedLocations.length }}
                    </span>
                  </div>
                  
                  <ul class="flex-1 max-h-[27rem] py-2 overflow-auto divide-y divide-gray-200  border-t border-gray-300">
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
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 p-1 mr-2 rounded-lg bg-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                      </svg>
                      Tout désélectionner
                    </button>
                  </div>
                </section>
              </div>

              <div class="flex justify-end gap-4 mt-6">
                <button
                  @click="cancelJobCreation"
                  class="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  @click="createJob"
                  :class="{ 'opacity-50 cursor-not-allowed': !tempSelectedLocations.length }"
                  class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <span v-if="!isSubmitting">Créer le job</span>
                  <svg v-else class="animate-spin h-5 w-5 mx-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </button>
              </div>
            </div>

          <component :is="viewModeAll === 'table' ? DataTable : 'div'" v-bind="viewModeAll === 'table' ? { columns: jobColumns, rowDataProp: jobsMap, actions: jobActions, actionsHeaderName: 'Actions', showColumnSelector: false, storageKey: 'planning_jobs' } : {}">
            <template #default>
              <div v-if="jobs.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div v-for="j in jobs" :key="j.id" class="group p-4 border rounded-lg hover:bg-gray-50 relative">
                  <div class="flex flex-wrap gap-2 mb-2">
                    <span v-for="l in j.locations" :key="l" class="px-3 py-1 bg-gray-100 rounded-full text-sm">{{ l }}</span>
                  </div>
                  <button @click="deleteJob(j.id)" class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 px-2 py-1 text-secondary text-xs bg-white rounded">
                    <IconTrashLines class="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div v-else class="text-center py-12 border-dashed border-2 rounded-lg">
                <p>Aucun job</p>
                <button @click="showNewJobForm = true" class="mt-2 text-primary-600">Créer un job</button>
              </div>
            </template>
          </component>
        </section>
      </div>
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