<template>
  <div class="bg-gray-50 p-8">
    <!-- Header -->
    <div class="mb-8 flex flex-col lg:flex-row justify-between items-start gap-8">
      <div class="flex-1 bg-white rounded-xl shadow-sm px-6 py-4">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Date de planification</h2>
        <FormBuilder v-model="dateForm" :fields="dateFields" :columns="1" hide-submit />
      </div>
      <div class="w-full lg:w-72 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div class="text-center space-y-4">
          <p class="text-sm text-gray-600">Confirmez ou annulez la planification</p>
          <button @click="validateAll"
                  :disabled="!canValidate || isSubmitting"
                  class="w-full px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50">
            ✓ Valider
          </button>
          <button @click="cancelPlanning"
                  class="w-full px-4 py-2 bg-danger text-white rounded-lg">
            ✕ Annuler
          </button>
        </div>
      </div>
    </div>

    <!-- Équipes & Jobs -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Équipes -->
      <section class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div class="flex justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-800">Équipes</h2>
          <button @click="showNewTeamForm = !showNewTeamForm"
                  class="px-4 py-2 text-primary-600">
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
          class="mb-2"
        />

        <div v-else>
          <div v-if="teams.length" class="flex justify-end mb-2">
            <ToggleButtons v-model="viewModeTeams" :options="toggleOptions" />
          </div>

          <DataTable
            v-if="viewModeTeams === 'table'"
            :columns="teamColumns"
            :rowDataProp="teams"
            :actions="teamActions"
            actionsHeaderName="Actions"
            :showColumnSelector="false"
            storageKey="planning_teams"
          />

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div v-for="team in teams" :key="team.id"
                 class="group p-4 border rounded-lg flex justify-between items-center">
              <span>{{ team.name }}</span>
              <button @click="confirmDeleteTeam(team.id)"
                      class="opacity-0 group-hover:opacity-100">
                <IconTrashLines />
                <span class="sr-only">Supprimer</span>
              </button>
            </div>
            <div v-if="!teams.length" class="col-span-full text-center py-12 border-dashed border-2">
              <p class="text-gray-500 mb-2">Aucune équipe</p>
              <button @click="showNewTeamForm = true"
                      class="w-full px-4 py-2 text-secondary rounded">
                Créer une équipe
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Jobs -->
      <section class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div class="flex justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-800">Jobs</h2>
          <button @click="showNewJobForm = !showNewJobForm"
                  class="px-4 py-2 text-primary-600">
            {{ showNewJobForm ? '× Fermer' : '+ Nouveau job' }}
          </button>
        </div>

        <FormBuilder
          v-if="showNewJobForm"
          v-model="jobForm"
          :fields="jobFields"
          :columns="1"
          submit-label="Créer"
          @submit="addJobRecord"
          class="mb-2"
        />

        <div v-else>
          <div v-if="jobs.length" class="flex justify-end mb-2">
            <ToggleButtons v-model="viewModeJobs" :options="toggleOptions" />
          </div>

          <DataTable
            v-if="viewModeJobs === 'table'"
            :columns="jobColumns"
            :rowDataProp="jobsMap"
            :actions="jobActions"
            actionsHeaderName="Actions"
            :showColumnSelector="false"
            storageKey="planning_jobs"
          />

          <div v-else class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
            <div v-for="job in jobs" :key="job.id"
                 class="group p-2 border rounded-lg flex justify-between">
              <div class="flex flex-wrap gap-2">
                <span v-for="loc in job.locations" :key="loc"
                      class="px-2 py-1 border rounded-full text-sm">
                  {{ loc }}
                </span>
              </div>
              <div class="flex justify-end">
                <button @click="confirmDeleteJob(job.id)"
                        class="opacity-0 group-hover:opacity-100">
                  <IconTrashLines />
                  <span class="sr-only">Supprimer</span>
                </button>
              </div>
            </div>
            <div v-if="!jobs.length" class="col-span-full text-center py-12 border-dashed border-2">
              <p class="text-gray-500 mb-2">Aucun job</p>
              <button @click="showNewJobForm = true"
                      class="w-full px-4 py-2 text-secondary rounded">
                Créer un job
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import ToggleButtons from '@/components/ToggleButtons/ToggleButtons.vue';
import DataTable from '@/components/DataTable/DataTable.vue';
import IconListCheck from '@/components/icon/icon-list-check.vue';
import IconLayoutGrid from '@/components/icon/icon-layout-grid.vue';
import IconTrashLines from '@/components/icon/icon-trash-lines.vue';
import { usePlanning } from '@/composables/usePlanning';
import { alertService } from '@/services/alertService';
import type { FieldConfig } from '@/interfaces/form';
import type { ColDef } from 'ag-grid-community';
import type { ActionConfig } from '@/interfaces/dataTable';

// Récupère logiques et états, y compris viewModeTeams & viewModeJobs
const {
  teams,
  jobs,
  showNewTeamForm,
  showNewJobForm,
  locations,
  isSubmitting,
  canValidate,
  validateAll,
  cancelPlanning,
  addTeam,
  addJob,
  deleteTeam,
  deleteJob,
  viewModeTeams,
  viewModeJobs
} = usePlanning();

// Options du toggle
const toggleOptions = [
  { value: 'table', icon: IconListCheck },
  { value: 'grid', icon: IconLayoutGrid }
];

// Confirmation avant suppression
async function confirmDeleteTeam(id: string) {
  const result = await alertService.confirm({ title: 'Supprimer l\'équipe', text: 'Voulez-vous vraiment supprimer cette équipe ?' });
  if (result.isConfirmed) deleteTeam(id);
}
async function confirmDeleteJob(id: string) {
  const result = await alertService.confirm({ title: 'Supprimer le job', text: 'Voulez-vous vraiment supprimer ce job ?' });
  if (result.isConfirmed) deleteJob(id);
}

// Colonnes et actions
const teamColumns: ColDef[] = [{ headerName: 'Nom', field: 'name' }];
const teamActions: ActionConfig[] = [{ label: 'Supprimer', icon: IconTrashLines, handler: row => confirmDeleteTeam(row.id) }];
const jobColumns: ColDef[] = [{ headerName: 'Emplacements', field: 'locations' }];
const jobActions: ActionConfig[] = [{ label: 'Supprimer', icon: IconTrashLines, handler: row => confirmDeleteJob(row.id) }];

// Map des jobs
const jobsMap = computed(() => jobs.value.map(j => ({ locations: j.locations.join(', ') })));

// Formulaires
const dateForm = ref<{ date: string }>({ date: new Date().toISOString().split('T')[0] });
const dateFields: FieldConfig[] = [{ key: 'date', label: 'Date', type: 'date', validators: [{ key: 'required', fn: v => !!v, msg: 'La date est requise' }] }];
const teamForm = ref<Record<string, unknown>>({ name: '' });
const teamFields: FieldConfig[] = [{ key: 'name', label: "Nom de l'équipe", type: 'text', validators: [{ key: 'required', fn: v => typeof v === 'string' && v.trim() !== '', msg: "Le nom de l'équipe est requis" }] }];
const jobForm = ref<Record<string, unknown>>({ locations: [] });
const jobFields: FieldConfig[] = [{ key: 'locations', label: 'Emplacements', type: 'button-group', options: locations.map(loc => ({ label: loc, value: loc })), validators: [{ key: 'required', fn: v => Array.isArray(v) && v.length > 0, msg: 'Au moins un emplacement doit être sélectionné' }] }];

// Wrappers pour FormBuilder
function addTeamRecord(data: Record<string, unknown>) { addTeam(data as { name: string }); }
function addJobRecord(data: Record<string, unknown>) { addJob(data as { locations: string[] }); }
</script>
