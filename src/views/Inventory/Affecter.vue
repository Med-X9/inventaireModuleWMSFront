<template>
    <div class="container mx-auto">
    <div class="flex justify-end mb-2">
      <button @click="cancelAffecter" class="flex items-end border texte-secondary border-secondary justify-end px-6 py-2 rounded text-sm font-medium shadow-lg transition-all duration-200btn-remove">
        Annuler 
      </button>
      </div>
      <Wizard
        :steps="steps"
        v-model:current-step="currentStep"
        @complete="handleComplete"
        :beforeChange="validateStep"
        color="var(--color-primary)"
      >
        <!-- Étape 1 -->
        <template #step-0>
          <div class="grid grid-cols-12 gap-6">
            <!-- Carte Sélection -->
            <div class="col-span-5 bg-white rounded-2xl shadow-lg p-6">
              <h3 class="text-xl font-semibold mb-4">Sélection des équipes</h3>
              <FormBuilder
                v-model="counting1Form"
                :fields="formFields1"
                :columns="1"
                hide-submit
              />
            </div>
            <!-- Boutons -->
            <div class="col-span-2 flex flex-col items-center justify-center gap-4">
              <button @click="handleTeamSelect1" class="btn-modern btn-add">Ajouter →</button>
              <button @click="clearAll1" class="btn-modern btn-remove">← Retirer</button>
            </div>
            <!-- Sélectionnées -->
            <div class="col-span-5 bg-white rounded-2xl shadow-lg p-6">
              <h3 class="text-xl font-semibold mb-4">Équipes sélectionnées</h3>
              <div class="max-h-[500px] overflow-auto space-y-4">
                <div
                  v-for="team in selectedTeams1"
                  :key="team.id"
                  class="p-4 bg-white rounded-xl border border-gray-200 cursor-pointer 
                    transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1"
                >
                  <div class="flex justify-between mb-2">
                    <span>{{ team.name }}</span>
                    <button @click="removeTeam1(team.id)" class="btn-icon">×</button>
                  </div>
                  <div>
                    <h4 class="text-sm font-medium mb-1">Jobs :</h4>
                    <div class="flex flex-wrap gap-2">
                      <!-- on enlève .value ici : ref unwrapped en template :contentReference[oaicite:6]{index=6} -->
                      <span
                        v-for="j in teamJobs1.get(team.id) || []"
                        :key="j"
                        class="badge"
                      >
                        {{ getJobLocation(j) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-if="!selectedTeams1.length" class="text-center text-gray-500 py-12">
                  Aucune équipe ajoutée
                </div>
              </div>
            </div>
          </div>
        </template>
  
        <!-- Étape 2 -->
        <template #step-1>
          <div class="grid grid-cols-12 gap-6">
            <div class="col-span-5 bg-white rounded-2xl shadow-lg p-6">
              <h3 class="text-xl font-semibold mb-4">Sélection des équipes</h3>
              <FormBuilder
                v-model="counting2Form"
                :fields="formFields2"
                :columns="1"
                hide-submit
              />
            </div>
            <div class="col-span-2 flex flex-col items-center justify-center gap-4">
              <button @click="handleTeamSelect2" class="btn-modern btn-add">Ajouter →</button>
              <button @click="clearAll2" class="btn-modern btn-remove">← Retirer</button>
            </div>
            <div class="col-span-5 bg-white rounded-2xl shadow-lg p-6">
              <h3 class="text-xl font-semibold mb-4">Équipes sélectionnées</h3>
              <div class="max-h-[500px] overflow-auto space-y-4">
                <div
                  v-for="team in selectedTeams2"
                  :key="team.id"
                  class="p-4 bg-white rounded-xl border border-gray-200 cursor-pointer transition-all 
                  duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1"
                >
                  <div class="flex justify-between mb-2">
                    <span>{{ team.name }}</span>
                    <button @click="removeTeam2(team.id)" class="btn-icon">×</button>
                  </div>
                  <div>
                    <h4 class="text-sm font-medium mb-1">Jobs :</h4>
                    <div class="flex flex-wrap gap-2">
                      <span
                        v-for="j in teamJobs2.get(team.id) || []"
                        :key="j"
                        class="badge"
                      >
                        {{ getJobLocation(j) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-if="!selectedTeams2.length" class="text-center text-gray-500 py-12">
                  Aucune équipe ajoutée
                </div>
              </div>
            </div>
          </div>
        </template>
      </Wizard>
    </div>
  </template>
  
  <script setup lang="ts">
  import Wizard from '@/components/wizard/Wizard.vue';
  import FormBuilder from '@/components/Form/FormBuilder.vue';
  import { useAffecter } from '@/composables/useAffecter';
  
  const {
    currentStep,
    counting1Form,
    counting2Form,
    formFields1,
    formFields2,
    selectedTeams1,
    selectedTeams2,
    teamJobs1,
    teamJobs2,
    handleTeamSelect1,
    handleTeamSelect2,
    removeTeam1,
    removeTeam2,
    clearAll1,
    clearAll2,
    getJobLocation,
    validateStep,
    cancelAffecter,
    loaded
  } = useAffecter();
  
  const steps = [
    { title: 'Premier comptage', icon: '1' },
    { title: 'Deuxième comptage', icon: '2' }
  ];
  
  function handleComplete() {
    console.log('Terminé :', {
      comptage1: {
        teams: selectedTeams1.value,
        jobs: Object.fromEntries(teamJobs1.value)  // Map iterable :contentReference[oaicite:7]{index=7}
      },
      comptage2: {
        teams: selectedTeams2.value,
        jobs: Object.fromEntries(teamJobs2.value)
      }
    });
  }
  </script>
  
  <style scoped >
  
  .shadow-lg {
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1),
                0 4px 6px -2px rgba(0,0,0,0.05);
  }
  </style>
  