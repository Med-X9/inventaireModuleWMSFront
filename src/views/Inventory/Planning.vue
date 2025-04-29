<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <!-- Header Section with Date and Action -->
    <div class="mb-8 flex justify-between items-start gap-8">
      <!-- Date Selection -->
      <div class="flex-1 bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span class="text-primary-600"></span>
          <span>Date de planification</span>
        </h2>
        <input
          v-model="selectedDate"
          type="date"
          class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200"
        />
      </div>

      <!-- Action Card -->
      <div class="w-72 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div class="text-center">
          <p class="text-sm text-gray-600 mb-4">
            Confirmez la planification pour cette date
          </p>
          <button
            @click="validateAll"
            :disabled="!canValidate || isSubmitting"
            class="w-full flex justify-center items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed gap-2"
          >
            <span class="text-md">✓</span>
            <span>Valider la planification</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content: Teams and Jobs -->
    <div class="grid grid-cols-2 gap-8">
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

        <!-- New Team Form -->
        <div v-if="showNewTeamForm" class="mb-6 bg-gray-50 rounded-xl p-6 animate-fade-in border border-gray-200">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Nom de l'équipe</label>
              <input
                v-model="newTeamName"
                type="text"
                placeholder="Saisissez le nom de l'équipe"
                class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200"
              />
            </div>
            <button
              @click="addTeam"
              :disabled="!canCreateTeam"
              class="w-full px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              Créer l'équipe
            </button>
          </div>
        </div>

        <!-- Teams List -->
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

          <!-- Empty State -->
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

        <!-- New Job Form -->
        <div v-if="showNewJobForm" class="mb-6 bg-gray-50 rounded-xl p-6 animate-fade-in border border-gray-200">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Sélection des emplacements</label>
              <div class="flex flex-wrap gap-2 bg-white p-4 rounded-lg border border-gray-200">
                <button
                  v-for="location in locations"
                  :key="location"
                  @click="toggleLocation(location)"
                  :class="[
                    'px-4 py-2 rounded-lg text-sm transition-all duration-200',
                    selectedLocations.includes(location)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  ]"
                >
                  {{ location }}
                </button>
              </div>
            </div>
            <button
              @click="addJob"
              :disabled="!canCreateJob"
              class="w-full px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              Créer le job
            </button>
          </div>
        </div>

        <!-- Jobs List -->
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

          <!-- Empty State -->
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
import { usePlanning } from '@/composables/usePlanning';

const {
  selectedDate,
  teams,
  jobs,
  newTeamName,
  showNewTeamForm,
  showNewJobForm,
  selectedLocations,
  locations,
  isSubmitting,
  canCreateTeam,
  canCreateJob,
  canValidate,
  addTeam,
  deleteTeam,
  toggleLocation,
  addJob,
  deleteJob,
  validateAll
} = usePlanning();
</script>

<style scoped>
@keyframes fade-in {
  from { 
    opacity: 0; 
    transform: translateY(-8px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

.animate-fade-in { 
  animation: fade-in 0.3s ease-out; 
}
</style>