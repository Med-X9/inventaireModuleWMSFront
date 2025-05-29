<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useAppStore } from '@/stores';
import { usePlanning } from '@/composables/usePlanning';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import ToggleButtons from '@/components/ToggleButtons/ToggleButtons.vue';
import DataTable from '@/components/DataTable/DataTable.vue';
import GridView from '@/components/GridView/GridView.vue';
import IconListCheck from '@/components/icon/icon-list-check.vue';
import IconLayoutGrid from '@/components/icon/icon-layout-grid.vue';
import IconTrashLines from '@/components/icon/icon-trash-lines.vue';

import type { ColDef } from 'ag-grid-community';
import type { ActionConfig } from '@/interfaces/dataTable';
import type { FieldConfig, SelectOption } from '@/interfaces/form';
import type { Action, GridDataItem } from '@/components/GridView/GridView.vue';

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

// Store for persistent state
const appStore = useAppStore();
const isTeamsFullscreen = computed({
  get: () => appStore.planningTeamsFullscreen,
  set: val => appStore.setPlanningTeamsFullscreen(val)
});
const isJobsFullscreen = computed({
  get: () => appStore.planningJobsFullscreen,
  set: val => appStore.setPlanningJobsFullscreen(val)
});

// Actions menu state
const showActionsMenu = ref(false);
const selectedActionItem = ref<GridDataItem | null>(null);
const menuPosition = ref({ x: 0, y: 0 });
const menuRef = ref<HTMLElement | null>(null);

// Filtre disponible = brut moins déjà sélectionnés
const tempSelectedLocations = ref<string[]>([]);
const filteredLocations = computed(() =>
  rawFilteredLocations.value.filter(loc => !tempSelectedLocations.value.includes(loc))
);

// Selected lists
const selectedAvailable = ref<string[]>([]);
const selectedAdded = ref<string[]>([]);

// Selected items for grid view
const selectedTeam = ref(null);
const selectedJob = ref(null);

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

// Toggle view
const viewModeAll = computed({ get: () => appStore.planningViewModeAll, set: m => appStore.setPlanningViewModeAll(m) });
const toggleOptions = [ { value: 'table', icon: IconListCheck }, { value: 'grid', icon: IconLayoutGrid } ];

// Columns + actions
const teamColumns: ColDef[] = [ { headerName: 'Nom', field: 'name' }, { headerName: 'Session', field: 'session' } ];
const jobColumns: ColDef[] = [ { headerName: 'Emplacements', field: 'locations' } ];

const jobsMap = computed(() => jobs.value.map(j => ({ ...j, locations: j.locations.join(', ') })));
function addTeamRecord(data: Record<string, unknown>) { return addTeam(data as { name: string; session: string }); }

// Actions menu handlers
const handleActionsClick = (item: GridDataItem, event: MouseEvent) => {
  selectedActionItem.value = item;
  showActionsMenu.value = true;
  
  const rect = (event.target as HTMLElement).getBoundingClientRect();
  menuPosition.value = {
    x: rect.left,
    y: rect.bottom + 5
  };

  setTimeout(() => {
    window.addEventListener('click', closeActionsMenu);
  }, 0);
};

const closeActionsMenu = (event?: MouseEvent) => {
  if (event && menuRef.value?.contains(event.target as Node)) {
    return;
  }
  showActionsMenu.value = false;
  selectedActionItem.value = null;
  window.removeEventListener('click', closeActionsMenu);
};

const handleDeleteItem = () => {
  if (selectedActionItem.value) {
    if ('session' in selectedActionItem.value) {
      deleteTeam(selectedActionItem.value.id as string);
    } else {
      deleteJob(selectedActionItem.value.id as string);
    }
    closeActionsMenu();
  }
};

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

// Cleanup
onMounted(() => {
  window.removeEventListener('click', closeActionsMenu);
});

onUnmounted(() => {
  window.removeEventListener('click', closeActionsMenu);
});
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
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 divide-x  items-start divide-gray-200">
        <!-- Teams -->
        <section
          :class="[
            { 'fixed inset-0  z-50 overflow-auto': isTeamsFullscreen },
            { 'hidden': isJobsFullscreen && !isTeamsFullscreen },
            'panel rounded-xl shadow-md p-3 md:p-6 border transition-all duration-300 space-y-6'
          ]"
        >
          <button
            v-if="isTeamsFullscreen"
            @click="showNewTeamForm = false; isTeamsFullscreen = false"
            class="absolute top-4 right-4 mb-4 px-6 text-2xl hover:bg-gray-100 rounded-full transition"
          >
            ×
          </button>
          <div class="flex justify-between items-center">
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

          <component 
            v-if="teams.length"
            :is="viewModeAll === 'table' ? DataTable : GridView" 
            v-bind="viewModeAll === 'table' 
              ? { 
                  columns: teamColumns, 
                  rowDataProp: teams, 
                  actionsHeaderName: 'Actions', 
                  showColumnSelector: false, 
                  storageKey: 'planning_teams' 
                } 
              : {
                  data: teams,
                  titleField: '',
                  selectedItem: selectedTeam,
                  columns: 2,
                  showActionsIcon: true,
                  enableActions: false
                }"
            @item-click="selectedTeam = $event"
            @actionsClick="handleActionsClick"
          >
            <template #content="{ item }">
              <div class="mt-4 space-y-2">
                <p class="text-primary"><span class="font-medium">Nom:</span> {{ item.name }}</p>
                <p class="text-secondary"><span class="font-medium">Session:</span> {{ item.session }}</p>
              </div>
            </template>
          </component>
           <div v-else>
              <div class="text-center py-12 border-dashed border-2 rounded-lg">
              <p>Aucune équipe</p>
              <button @click="showNewTeamForm = true" class="mt-2 text-primary-600">
              Créer une équipe
              </button>
              </div>
            </div>
        </section>

        <!-- Jobs -->
        <section
          :class="[
            { 'fixed inset-0 z-50  overflow-auto': isJobsFullscreen },
            { 'hidden': isTeamsFullscreen && !isJobsFullscreen },
            'panel rounded-xl shadow-lg p-4 md:p-6 border transition-all duration-300 space-y-6'
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

          <div v-if="showNewJobForm" class="panel border p-10">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FormBuilder
                v-model="zoneForm"
                :fields="zoneFields"
                :columns="2"
                hide-submit
              />
            </div>

            <div class="grid grid-cols-1 gap-y-4 lg:grid-cols-[1fr_auto_1fr] lg:gap-x-2">
              <!-- Available Locations -->
              <section class="flex flex-col">
                <div class="p-4 border border-gray-300 min-h-[500px]">
                  <div class="flex justify-between items-center mb-3">
                    <h2 class="text-lg font-semibold text-gray-800">Emplacements disponibles</h2>
                    <span class="inline-block bg-primary-light text-primary-600 text-xs font-medium px-2 py-0.5 rounded-full">
                      {{ filteredLocations.length }}
                    </span>
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

                  <ul class="w-full flex-1 py-2 max-h-80 overflow-auto divide-y divide-gray-200 border-t border-gray-300">
                    <transition-group name="slide-fade" tag="div">
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
              <section class="flex flex-col">
                <div class="p-4 border border-gray-300 min-h-[500px]">
                  <div class="flex justify-between items-center mb-3">
                    <h2 class="text-lg font-semibold text-gray-800">Emplacements sélectionnés</h2>
                    <span class="inline-block bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {{ tempSelectedLocations.length }}
                    </span>
                  </div>
                  
                  <ul class="flex-1 max-h-[27rem] py-2 overflow-auto divide-y divide-gray-200 border-t border-gray-300">
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
         
          <component 
            v-if="jobs.length"
            :is="viewModeAll === 'table' ? DataTable : GridView" 
            v-bind="viewModeAll === 'table' 
              ? { 
                  columns: jobColumns, 
                  rowDataProp: jobsMap, 
                  actionsHeaderName: 'Actions', 
                  showColumnSelector: false, 
                  storageKey: 'planning_jobs' 
                } 
              : {
                  data: jobs,
                  titleField: '',
                  selectedItem: selectedJob,
                  columns: 1,
                  showActionsIcon: true,
                  enableActions: false
                  
                }"
            @item-click="selectedJob = $event"
            @actionsClick="handleActionsClick"
             :itemsPerPage="3"
        :enablePagination="true"
            
          >
             <template #content="{ item }">
      <div class="mt-4">
        <p class="text-primary font-medium">Emplacements:</p>
        <div class=" mt-2 max-h-32 overflow-y-auto w-full  bg-gray-50 rounded">
          <ul class="list-disc list-inside space-y-1">
            <li v-for="loc in item.locations" :key="loc" class="text-secondary text-ms">{{ loc }}</li>
          </ul>
        </div>
      </div>
    </template>
   </component>
       
          <div v-else>
          <div class="text-center py-12 border-dashed border-2 rounded-lg">
          <p>Aucun job</p>
           <button @click="showNewJobForm = true" class="mt-2 text-primary-600">
          Créer un job
         </button>
         </div>
         </div>
        </section>
      </div>
    </div>

    <!-- Actions Menu -->
    <Teleport to="body">
      <div
        v-if="showActionsMenu"
        class="fixed z-50"
        :style="{
          top: `${menuPosition.y}px`,
          left: `${menuPosition.x}px`
        }"
        ref="menuRef"
      >
        <div class="bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 py-1 min-w-[160px]">
          <button
            @click="handleDeleteItem"
            class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Supprimer
          </button>
        </div>
      </div>
    </Teleport>
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