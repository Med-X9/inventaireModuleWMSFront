<template>
  <div class="animate-fade-in">
    <TabGroup as="div" class="w-full">
      <TabList class="flex space-x-20 bg-gray-100 py-4 px-6 mb-8 rounded-lg shadow-sm">
        <Tab as="template" v-slot="{ selected }">
          <button
            :class="[
              'relative px-6 py-2 text-base font-medium rounded-lg transition-all duration-200 focus:outline-none',
              selected
                ? 'text-white bg-primary shadow-md scale-105'
                : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
            ]"
          >
            <span>Date</span>
            <span
              v-if="selected"
              class="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-1 w-10 bg-white rounded-t-full"
            />
          </button>
        </Tab>
        <Tab as="template" v-slot="{ selected }">
          <button
            :class="[
              'relative px-6 py-2 text-base font-medium rounded-lg transition-all duration-200 focus:outline-none',
              selected
                ? 'text-white bg-primary shadow-md scale-105'
                : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
            ]"
          >
            <span>Équipe</span>
            <span
              v-if="selected"
              class="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-1 w-10 bg-white rounded-t-full"
            />
          </button>
        </Tab>
        <Tab as="template" v-slot="{ selected }">
          <button
            :class="[
              'relative px-6 py-2 text-base font-medium rounded-lg transition-all duration-200 focus:outline-none',
              selected
                ? 'text-white bg-primary shadow-md scale-105'
                : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
            ]"
          >
            <span>Jobs</span>
            <span
              v-if="selected"
              class="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-1 w-10 bg-white rounded-t-full"
            />
          </button>
        </Tab>
      </TabList>

      <TabPanels class="mt-6 space-y-8">
        <!-- Date Panel -->
        <TabPanel>
          <div class="bg-white rounded-xl shadow-lg py-10 px-8">
            <h2 class="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <span class="mr-3">📅</span>Sélection de la date
            </h2>
            <input
              v-model="selectedDate"
              type="date"
              class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all duration-200"
            />
            <button
              @click="applyDate"
              class="mt-4 px-6 py-3 bg-white text-primary border border-primary hover:bg-primary hover:text-white rounded-lg transition-all duration-200"
            >
              Valider
            </button>
          </div>
        </TabPanel>

        <!-- Teams Panel -->
        <TabPanel>
          <div class="bg-white rounded-xl shadow-lg p-8">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-xl font-semibold text-gray-800 flex items-center">
                Créer une Équipes
              </h2>
              <button
                @click="showNewTeamForm = !showNewTeamForm"
                class="px-4 py-2 text-primary-600 font-medium rounded-lg hover:text-primary-700 hover:bg-primary-50 transition-colors duration-200"
              >
                <span v-if="!showNewTeamForm">+ Nouvelle équipe</span>
                <span v-else>× Fermer</span>
              </button>
            </div>

            <div v-if="showNewTeamForm" class="mb-8 bg-gray-50 rounded-lg p-6 animate-fade-in">
              <h3 class="font-semibold mb-4 text-gray-700">Nouvelle Équipe</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Nom de l'équipe</label>
                  <input
                    v-model="newTeamName"
                    type="text"
                    placeholder="Nom de l'équipe"
                    class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all duration-200"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Date de l'équipe</label>
                  <input
                    v-model="newTeamDate"
                    type="date"
                    class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all duration-200"
                  />
                </div>
                <button
                  @click="addTeam"
                  :disabled="!canCreateTeam"
                  class="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg border border-primary-600 hover:bg-primary-700 hover:border-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                >
                  Ajouter l'équipe
                </button>
              </div>
            </div>

            <div v-if="teams.length > 0" class="space-y-4">
              <div
                v-for="team in teams"
                :key="team.id"
                class="group border border-gray-200 p-6 rounded-lg transition-all duration-300 hover:shadow-md"
              >
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-semibold text-lg text-gray-800">{{ team.name }}</h4>
                    <p class="text-sm text-gray-600 mt-1 flex items-center">
                      <span class="mr-2">📅</span>{{ formatDate(team.date) }}
                    </p>
                  </div>
                  <button
                    @click="deleteTeam(team.id)"
                    class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-all duration-200"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>

            <div
              v-else
              class="text-center text-gray-500 py-12 border-2 border-dashed border-gray-200 rounded-lg"
            >
              <p class="font-medium">Aucune équipe créée</p>
              <button @click="showNewTeamForm = true" class="mt-2  text-blue-600 hover:text-blue-700">
                Créer une équipe
              </button>
            </div>
          </div>
        </TabPanel>

        <!-- Jobs Panel -->
        <TabPanel>
          <div class="bg-white rounded-xl shadow-lg p-8">
            <div class="flex justify-between items-center mb-6">
              <h2 class="text-xl font-semibold text-gray-800 flex items-center">
                Créer un Jobs
              </h2>
              <button
                @click="showNewJobForm = !showNewJobForm"
                class="px-4 py-2 text-primary-600 font-medium rounded-lg hover:text-primary-700 hover:bg-primary-50 transition-colors duration-200"
              >
                <span v-if="!showNewJobForm">+ Nouveau job</span>
                <span v-else>× Fermer</span>
              </button>
            </div>

            <div v-if="showNewJobForm" class="mb-8 bg-gray-50 rounded-lg p-6 animate-fade-in">
              <h3 class="font-semibold mb-4 text-gray-700">Nouveau Job</h3>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Date du job</label>
                  <input
                    v-model="newJobDate"
                    type="date"
                    class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition-all duration-200"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Emplacements</label>
                  <div class="flex flex-wrap gap-2 bg-white p-4 rounded-lg border border-gray-200">
                    <button
                      v-for="location in locations"
                      :key="location"
                      @click="toggleLocation(location)"
                      :class="[
                        'px-4 py-2 rounded-lg text-sm border transition-all duration-200',
                        selectedLocations.includes(location)
                          ? 'bg-primary-600 text-white border-transparent'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-primary-600'
                      ]"
                    >
                      {{ location }}
                    </button>
                  </div>
                </div>
                <button
                  @click="addJob"
                  :disabled="!canCreateJob"
                  class="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg border border-primary-600 hover:bg-primary-700 hover:border-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                >
                  Créer Job
                </button>
              </div>
            </div>

            <div v-if="jobs.length > 0" class="space-y-4">
              <div
                v-for="job in jobs"
                :key="job.id"
                class="group bg-gray-50 p-6 rounded-lg border border-gray-200 transition-all duration-300 hover:shadow-md"
              >
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <h4 class="font-medium text-gray-700">Job #{{ job.id.slice(0, 4) }}</h4>
                    <p class="text-sm text-gray-600 mt-1 flex items-center">
                      <span class="mr-2">📅</span>{{ formatDate(job.date) }}
                    </p>
                  </div>
                  <button
                    @click="deleteJob(job.id)"
                    class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-all duration-200"
                  >
                    Supprimer
                  </button>
                </div>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="loc in job.locations"
                    :key="loc"
                    class="bg-blue-50 text-blue-600 text-sm px-3 py-1 rounded-md border border-blue-100"
                  >
                    {{ loc }}
                  </span>
                </div>
              </div>
            </div>

            <div
              v-else
              class="text-center text-gray-500 py-12 border-2 border-dashed border-gray-200 rounded-lg"
            >
              <p class="font-medium">Aucun job créé</p>
              <button @click="showNewJobForm = true" class="mt-2  text-blue-600 hover:text-blue-700">
                Créer un job
              </button>
            </div>
          </div>
        </TabPanel>
      </TabPanels>
    </TabGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue';
import { format } from 'date-fns';

// === Date ===
const selectedDate = ref(format(new Date(), 'yyyy-MM-dd'));
const applyDate = () => console.log('Date sélectionnée :', selectedDate.value);

// === Équipes ===
interface Team { id: string; name: string; date: string; }
const teams = ref<Team[]>([]);
const newTeamName = ref('');
const newTeamDate = ref(format(new Date(), 'yyyy-MM-dd'));
const showNewTeamForm = ref(false);
const canCreateTeam = computed(() => newTeamName.value.trim() !== '' && newTeamDate.value !== '');
const addTeam = () => {
  if (!canCreateTeam.value) return;
  teams.value.push({ id: crypto.randomUUID(), name: newTeamName.value, date: newTeamDate.value });
  newTeamName.value = '';
  showNewTeamForm.value = false;
};
const deleteTeam = (id: string) => (teams.value = teams.value.filter(t => t.id !== id));
const formatDate = (d: string) => format(new Date(d), 'dd/MM/yyyy');

// === Jobs ===
interface Job { id: string; date: string; locations: string[]; }
const jobs = ref<Job[]>([]);
const locations = ['Rayon A', 'Rayon B', 'Rayon C', 'Rayon D', 'Stock Principal', 'Réserve'];
const selectedLocations = ref<string[]>([]);
const newJobDate = ref(format(new Date(), 'yyyy-MM-dd'));
const showNewJobForm = ref(false);
const canCreateJob = computed(() => newJobDate.value !== '' && selectedLocations.value.length > 0);
const toggleLocation = (loc: string) => {
  selectedLocations.value.includes(loc)
    ? selectedLocations.value = selectedLocations.value.filter(l => l !== loc)
    : selectedLocations.value.push(loc);
};
const addJob = () => {
  if (!canCreateJob.value) return;
  jobs.value.push({ id: crypto.randomUUID(), date: newJobDate.value, locations: [...selectedLocations.value] });
  selectedLocations.value = [];
  showNewJobForm.value = false;
};
const deleteJob = (id: string) => (jobs.value = jobs.value.filter(j => j.id !== id));
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: fade-in 0.6s ease-out; }
</style>
