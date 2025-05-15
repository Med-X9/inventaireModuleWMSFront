<template>
  <div>
    <ul class="flex space-x-2 rtl:space-x-reverse mb-4">
      <li>
        <router-link
          :to="{ name: 'planning-management' }"
          class="text-primary hover:underline"
        >
         Gestion des plannings
        </router-link>
      </li>
      <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
        <span>Planifier</span>
      </li>
    </ul>
<!-- toggle table / grid -->
      <div class="flex justify-end mb-2">
        <ToggleButtons v-model="viewModeAll" :options="toggleOptions" />
      </div>
    <div class="py-4">
      <!-- date + boutons Valider/Annuler -->
      <div class="mb-9 flex flex-col lg:flex-row justify-between gap-8">
        <div class="flex-1 panel bg-white shadow-sm px-4 py-6">
          <h2 class="text-lg mb-4">Date de planification</h2>
          <FormBuilder
            v-model="dateForm"
            :fields="dateFields"
            :columns="1"
            hide-submit
          />
        </div>
        <div class="w-full lg:w-80 panel shadow-sm p-6">
          <div class="text-center space-y-4">
            <p class="text-sm text-gray-600">Confirmez ou annulez</p>
            <button
              @click="validateAll"
              :disabled="!canValidate || isSubmitting"
              class="w-full px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
            >
              ✓ Valider
            </button>
            <button
              @click="cancelPlanning"
              class="w-full px-4 py-2 bg-danger text-white rounded-lg"
            >
              ✕ Annuler
            </button>
          </div>
        </div>
      </div>

     

      <!-- sections Équipes / Jobs -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Équipes -->
        <section class="panel rounded-xl shadow-lg p-6">
          <div class="flex justify-between mb-6">
            <h2 class="text-xl font-semibold">Équipes</h2>
            <button
              @click="showNewTeamForm = !showNewTeamForm"
              class="px-4 py-2 text-primary-600 hover:text-primary-700"
            >
              {{ showNewTeamForm ? '× Fermer' : '+ Nouvelle équipe' }}
            </button>
          </div>

          <!-- formulaire création équipe -->
          <FormBuilder
            v-if="showNewTeamForm"
            v-model="teamForm"
            :fields="teamFields"
            :columns="1"
            submit-label="Créer"
            @submit="addTeamRecord"
            class="mb-6  rounded-lg"
          />

          <!-- TABLE MODE -->
          <div v-if="viewModeAll === 'table'">
            <DataTable
              :columns="teamColumns"
              :rowDataProp="teams"
              :actions="teamActions"
              actionsHeaderName="Actions"
              :showColumnSelector="false"
              storageKey="planning_teams"
            />
           
          </div>

          <!-- GRID MODE -->
          <div v-else>
            <div
              v-if="teams.length"
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <div
                v-for="t in teams"
                :key="t.id"
                class="group p-4 border rounded-lg hover:bg-gray-50 relative"
              >
                <span>{{ t.name }}</span>
                <!-- bouton purge en hover -->
                <button
                  @click="deleteTeam(t.id)"
                  class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                         flex items-center gap-1 px-2 py-1 text-secondary text-xs bg-white rounded"
                >
                  <IconTrashLines class="w-4 h-4"/>
                  
                </button>
              </div>
            </div>
            <div v-else class="text-center py-12 border-dashed border-2 rounded-lg">
              <p>Aucune équipe</p>
              <button @click="showNewTeamForm = true" class="mt-2 text-primary-600">
                Créer une équipe
              </button>
            </div>
          </div>
        </section>

        <!-- Jobs -->
        <section class="panel rounded-xl shadow-lg p-6">
          <div class="flex justify-between mb-6">
            <h2 class="text-xl font-semibold">Jobs</h2>
            <button
              @click="showNewJobForm = !showNewJobForm"
              class="px-4 py-2 text-primary-600 hover:text-primary-700"
            >
              {{ showNewJobForm ? '× Fermer' : '+ Nouveau job' }}
            </button>
          </div>

          <!-- formulaire création job -->
          <FormBuilder
            v-if="showNewJobForm"
            v-model="jobForm"
            :fields="jobFields"
            :columns="1"
            submit-label="Créer"
            @submit="addJobRecord"
            class="mb-6 rounded-lg"
          />

          <!-- TABLE MODE -->
          <div v-if="viewModeAll === 'table'">
            <DataTable
              :columns="jobColumns"
              :rowDataProp="jobsMap"
              :actions="jobActions"
              actionsHeaderName="Actions"
              :showColumnSelector="false"
              storageKey="planning_jobs"
            />
          </div>

          <!-- GRID MODE -->
          <div v-else>
            <div
              v-if="jobs.length"
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <div
                v-for="j in jobs"
                :key="j.id"
                class="group p-4 border rounded-lg hover:bg-gray-50 relative"
              >
                <div class="flex flex-wrap gap-2 mb-2">
                  <span
                    v-for="l in j.locations"
                    :key="l"
                    class="px-3 py-1 bg-gray-100 rounded-full"
                  >
                    {{ l }}
                  </span>
                </div>
                <!-- bouton purge en hover -->
                <button
                  @click="deleteJob(j.id)"
                  class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200
                         flex items-center gap-1 px-2 py-1 text-secondary text-xs bg-white rounded"
                >
                  <IconTrashLines class="w-4 h-4"/>
                  
                </button>
              </div>
            </div>
            <div v-else class="text-center py-12 border-dashed border-2 rounded-lg">
              <p>Aucun job</p>
              <button @click="showNewJobForm = true" class="mt-2 text-primary-600">
                Créer un job
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useAppStore } from '@/stores';
import { usePlanning } from '@/composables/usePlanning';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import ToggleButtons from '@/components/ToggleButtons/ToggleButtons.vue';
import DataTable from '@/components/DataTable/DataTable.vue';

// icônes
import IconListCheck from '@/components/icon/icon-list-check.vue';
import IconLayoutGrid from '@/components/icon/icon-layout-grid.vue';
import IconTrashLines from '@/components/icon/icon-trash-lines.vue';

import type { ColDef } from 'ag-grid-community';
import type { ActionConfig } from '@/interfaces/dataTable';
import type { FieldConfig, SelectOption } from '@/interfaces/form';

const {
  selectedDate,
  teams,
  jobs,
  locations,
  teamForm,
  jobForm,
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

// ** Date form **
const dateForm = ref({ date: selectedDate.value });
watch(() => dateForm.value.date, v => (selectedDate.value = v));
const dateFields: FieldConfig[] = [
  {
    key: 'date',
    label: 'Date',
    type: 'date',
    validators: [{ key: 'required', fn: v => !!v, msg: 'Date requise' }]
  }
];

// ** Team form **
const teamFields: FieldConfig[] = [
  {
    key: 'name',
    label: "Nom de l'équipe",
    type: 'text',
    validators: [
      { key: 'required', fn: v => typeof v === 'string' && !!v.trim(), msg: 'Nom requis' }
    ]
  }
];

// ** Job form **
const jobFields: FieldConfig[] = [
  {
    key: 'locations',
    label: 'Emplacements',
    type: 'button-group',
    options: locations.map(loc => ({ label: loc, value: loc } as SelectOption)),
    validators: [
      { key: 'required', fn: v => Array.isArray(v) && v.length > 0, msg: 'Sélection requise' }
    ]
  }
];

// ** Toggle boutons **
const appStore = useAppStore();
const viewModeAll = computed({
  get: () => appStore.planningViewModeAll,
  set: m => appStore.setPlanningViewModeAll(m)
});
const toggleOptions = [
  { value: 'table', icon: IconListCheck },
  { value: 'grid', icon: IconLayoutGrid }
];

// ** Colonnes + actions table **
const teamColumns: ColDef[] = [{ headerName: 'Nom', field: 'name' }];
const teamActions: ActionConfig[] = [
  {
    label: 'Supprimer',
    icon: IconTrashLines,
   
    handler: row => deleteTeam(row.id)
  }
];

const jobColumns: ColDef[] = [{ headerName: 'Emplacements', field: 'locations' }];
const jobActions: ActionConfig[] = [
  {
    label: 'Supprimer',
    icon: IconTrashLines,
  
    handler: row => deleteJob(row.id)
  }
];

// ** Map jobs pour table (string join) **
const jobsMap = computed(() =>
  jobs.value.map(j => ({ ...j, locations: j.locations.join(', ') }))
);

// wrappers TS
function addTeamRecord(data: Record<string, unknown>) {
  return addTeam(data as { name: string });
}
function addJobRecord(data: Record<string, unknown>) {
  return addJob(data as { locations: string[] });
}
</script>

<style scoped>
.group:hover .opacity-0 {
  transition: opacity 0.2s ease-in-out;
}
</style>
