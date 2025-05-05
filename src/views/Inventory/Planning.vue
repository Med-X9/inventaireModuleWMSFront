<template>
  <div class="bg-gray-50 p-8">
    <!-- Header Section with Date and Actions -->
    <div class="mb-8 flex flex-col lg:flex-row justify-between items-start gap-8">
      <!-- Date Form -->
      <div class="flex-1 bg-white rounded-xl shadow-sm px-6 py-4">
        <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span class="text-primary-600"></span>
          <span>Date de planification</span>
        </h2>
        <FormBuilder
          v-model="dateForm"
          :fields="dateFields"
          :columns="1"
          hide-submit
        />
      </div>

      <!-- Action Card -->
      <div class="w-full lg:w-72 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div class="text-center space-y-4">
          <p class="text-sm text-gray-600 mb-4">
            Confirmez ou annulez la planification
          </p>
          <button
            @click="validateAll"
            :disabled="!canValidate || isSubmitting"
            class="w-full flex justify-center items-center px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-600 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed gap-2"
          >
            <span class="text-md">✓</span>
            <span>Valider la planification</span>
          </button>
          <button
            @click="clearPlanningState"
            type="button"
            class="w-full flex justify-center items-center px-4 py-2 bg-danger text-white font-medium rounded-lg hover:bg-red-600 transition duration-200"
          >
            <span class="text-md">✕</span>
            <span>Annuler la planification</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content: Teams and Jobs -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Teams Section -->
      <section class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-semibold text-gray-800">Équipes</h2>
          <button
            @click="showNewTeamForm = !showNewTeamForm"
            class="inline-flex items-center px-4 py-2 text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors duration-200"
          >
            <span v-if="!showNewTeamForm">+ Nouvelle équipe</span>
            <span v-else>× Fermer</span>
          </button>
        </div>

        <FormBuilder
          v-if="showNewTeamForm"
          v-model="teamForm"
          :fields="teamFields"
          :columns="1"
          submit-label="Créer l'équipe"
          @submit="addTeam"
          class="mb-6"
        />

        <div class="space-y-4">
          <div
            v-for="team in teams"
            :key="team.id"
            class="group bg-gray-50 rounded-xl p-6 border border-gray-200 transition-all duration-200 hover:shadow-md"
          >
            <div class="flex justify-between items-center">
              <h4 class="font-medium text-gray-800">{{ team.name }}</h4>
              <button
                @click="deleteTeam(team.id)"
                class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-all duration-200 px-3 py-1 rounded-lg hover:bg-red-50"
              >
                Supprimer
              </button>
            </div>
          </div>

          <div
            v-if="teams.length === 0"
            class="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl"
          >
            <p class="text-gray-500 mb-2">Aucune équipe créée</p>
            <button
              @click="showNewTeamForm = true"
              class="text-secondary hover:text-secondary font-medium"
            >
              Créer une équipe
            </button>
          </div>
        </div>
      </section>

      <!-- Jobs Section -->
      <section class="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-semibold text-gray-800">Jobs</h2>
          <button
            @click="showNewJobForm = !showNewJobForm"
            class="inline-flex items-center px-4 py-2 text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors duration-200"
          >
            <span v-if="!showNewJobForm">+ Nouveau job</span>
            <span v-else>× Fermer</span>
          </button>
        </div>

        <FormBuilder
          v-if="showNewJobForm"
          v-model="jobForm"
          :fields="jobFields"
          :columns="1"
          submit-label="Créer le job"
          @submit="addJob"
          class="mb-6"
        />

        <div class="space-y-4">
          <div
            v-for="job in jobs"
            :key="job.id"
            class="group bg-gray-50 rounded-xl p-6 border border-gray-200 transition-all duration-200 hover:shadow-md"
          >
            <div class="flex justify-between items-center mb-3">
              <h4 class="font-medium text-gray-800">Job #{{ job.id.slice(0, 4) }}</h4>
              <button
                @click="deleteJob(job.id)"
                class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-all duration-200 px-3 py-1 rounded-lg hover:bg-red-50"
              >
                Supprimer
              </button>
            </div>

            <!-- Conteneur fixe avec scroll horizontal -->
            <div class="flex flex-wrap gap-2">
              <span
                v-for="loc in job.locations"
                :key="loc"
                class="bg-primary-50 text-primary-600 text-sm px-3 py-1 rounded-lg border border-primary-100"
              >
                {{ loc }}
              </span>
            </div>
          </div>

          <div
            v-if="jobs.length === 0"
            class="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl"
          >
            <p class="text-gray-500 mb-2">Aucun job créé</p>
            <button
              @click="showNewJobForm = true"
              class="text-secondary hover:text-secondary-600 font-medium"
            >
              Créer un job
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import { usePlanning } from '@/composables/usePlanning';
import type { FieldConfig } from '@/interfaces/form';

const {
  teams,
  jobs,
  showNewTeamForm,
  showNewJobForm,
  locations,
  isSubmitting,
  canValidate,
  deleteTeam,
  deleteJob,
  validateAll,
  clearPlanningState
} = usePlanning();

// Date form
const dateForm = ref<{ date: string }>({ date: new Date().toISOString().split('T')[0] });
const dateFields: FieldConfig[] = [
  {
    key: 'date',
    label: 'Date',
    type: 'date',
    validators: [
      { key: 'required', fn: v => !!v, msg: 'La date est requise' }
    ]
  }
];

// Team form
const teamForm = ref<{ name: string }>({ name: '' });
const teamFields: FieldConfig[] = [
  {
    key: 'name',
    label: "Nom de l'équipe",
    type: 'text',
    validators: [
      { key: 'required', fn: v => typeof v === 'string' && v.trim() !== '', msg: "Le nom de l'équipe est requis" }
    ]
  }
];

// Job form
const jobForm = ref<{ locations: string[] }>({ locations: [] });
const jobFields: FieldConfig[] = [
  {
    key: 'locations',
    label: 'Sélection des emplacements',
    type: 'button-group',
    options: locations.map(loc => ({ label: loc, value: loc })),
    validators: [
      { key: 'required', fn: v => Array.isArray(v) && v.length > 0, msg: 'Au moins un emplacement doit être sélectionné' }
    ]
  }
];

function addTeam(data: Record<string, unknown>) {
  teams.value.push({ id: crypto.randomUUID(), name: data.name as string });
  teamForm.value.name = '';
  showNewTeamForm.value = false;
}

function addJob(data: Record<string, unknown>) {
  jobs.value.push({ id: crypto.randomUUID(), locations: data.locations as string[] });
  jobForm.value.locations = [];
  showNewJobForm.value = false;
}
</script>

<style scoped>
/* Scoped styles si nécessaire */
</style>
