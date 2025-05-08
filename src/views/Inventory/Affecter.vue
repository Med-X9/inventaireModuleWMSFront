<template>
  <div class="container mx-auto px-4">
    <div class="flex justify-between items-center mb-6">
      <ul class="flex space-x-2 rtl:space-x-reverse text-sm">
        <li>
          <router-link
            :to="{ name: 'gestion-des-plannings' }"
            class="text-primary hover:underline"
          >
            Gestion des plannings
          </router-link>
        </li>
        <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-500">
          <span>Affectation des équipes</span>
        </li>
      </ul>
      <button
        @click="cancelAffecter"
        class="flex items-center dark:text-white-light  border border-secondary text-secondary px-4 py-2 rounded-lg text-sm font-medium shadow transition-all duration-200 hover:bg-secondary hover:text-white"
      >
        Annuler
      </button>
    </div>

    <div v-if="!loaded" class="text-center py-10">
      Chargement de votre brouillon...
    </div>

    <Wizard
      v-else
      :steps="steps"
      v-model:current-step="currentStep"
      :before-change="validateStep"
      :is-valid="isStepValid"
      :finish-button-text="isSubmitting ? 'Affectation en cours...' : 'Terminer'"
      color="var(--color-primary)"
      @complete="handleComplete"
    >
      <!-- Étape 1 -->
      <template #step-0>
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div class="w-full md:col-span-5 bg-white rounded-2xl shadow-lg px-6 py-4">
         
            <FormBuilder
              v-model="counting1Form"
              :fields="formFields1"
              :columns="1"
              hide-submit
            />
          </div>
          <div class="w-full md:col-span-2 flex flex-row md:flex-col items-center justify-center gap-4">
            <button 
              @click="handleTeamSelect1" 
              class="btn-modern btn-add"
              :disabled="!counting1Form.team || !counting1Form.jobs.length"
            >
              Ajouter →
            </button>
            <button 
              @click="clearAll1" 
              class="btn-modern btn-remove"
              :disabled="!selectedTeams1.length"
            >
              ← Retirer tout
            </button>
          </div>
          <div class="w-full md:col-span-5 panel rounded-2xl shadow-lg p-6">
            <h3 class="text-xl font-semibold mb-4">Équipes sélectionnées</h3>
            <div class="max-h-[500px] overflow-auto space-y-4">
              <div
                v-for="team in selectedTeams1"
                :key="team.id"
                class="p-4 rounded-xl cursor-pointer transition-all duration-300 shadow hover:shadow-lg hover:-translate-y-1"
              >
                <div class="flex justify-between mb-2">
                  <span>{{ team.name }}</span>
                  <button @click="removeTeam1(team.id)" class="btn-icon">×</button>
                </div>
                <div>
                  <h4 class="text-sm font-medium mb-1">Zones affectées :</h4>
                  <div class="flex flex-wrap gap-2">
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
                Aucune équipe affectée
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Étape 2 -->
      <template #step-1>
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div class="w-full md:col-span-5 panel rounded-2xl shadow-lg px-6 py-4">
        
            <FormBuilder
              v-model="counting2Form"
              :fields="formFields2"
              :columns="1"
              hide-submit
            />
          </div>
          <div class="w-full md:col-span-2 flex flex-row md:flex-col items-center justify-center gap-4">
            <button 
              @click="handleTeamSelect2" 
              class="btn-modern btn-add"
              :disabled="!counting2Form.team || !counting2Form.jobs.length"
            >
              Ajouter →
            </button>
            <button 
              @click="clearAll2" 
              class="btn-modern btn-remove"
              :disabled="!selectedTeams2.length"
            >
              ← Retirer tout
            </button>
          </div>
          <div class="w-full md:col-span-5 panel rounded-2xl shadow-lg p-6">
            <h3 class="text-xl font-semibold mb-4">Équipes sélectionnées</h3>
            <div class="max-h-[500px] overflow-auto space-y-4">
              <div
                v-for="team in selectedTeams2"
                :key="team.id"
                class="p-4 border border-gray-200 dark:border-dark-border rounded-xl cursor-pointer transition-all duration-300 shadow hover:shadow-lg hover:-translate-y-1"
              >
                <div class="flex justify-between mb-2">
                  <span>{{ team.name }}</span>
                  <button @click="removeTeam2(team.id)" class="btn-icon">×</button>
                </div>
                <div>
                  <h4 class="text-sm font-medium mb-1">Zones affectées :</h4>
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
              <div v-if="!selectedTeams2.length" class="text-center dark:text-white-dark text-gray-500 py-12">
                Aucune équipe affectée
              </div>
            </div>
          </div>
        </div>
      </template>
    </Wizard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import Wizard from '@/components/wizard/Wizard.vue';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import { useAffecter } from '@/composables/useAffecter';
import { alertService } from '@/services/alertService';

const router = useRouter();
const isSubmitting = ref(false);

const {
  currentStep,
  loaded,
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
  saveState
} = useAffecter();

const steps = [
  { title: 'Premier comptage', icon: '1' },
  { title: 'Deuxième comptage', icon: '2' },
];

const isStepValid = computed(() => {
  if (currentStep.value === 0) return selectedTeams1.value.length > 0;
  if (currentStep.value === 1) return selectedTeams2.value.length > 0;
  return false;
});

async function handleComplete() {
  if (isSubmitting.value) return;

  try {
    isSubmitting.value = true;

    if (!selectedTeams1.value.length || !selectedTeams2.value.length) {
      await alertService.error({
        title: 'Validation',
        text: 'Veuillez affecter au moins une équipe pour chaque comptage.'
      });
      return;
    }

    const data = {
      comptage1: {
        teams: selectedTeams1.value,
        jobs: Object.fromEntries(teamJobs1.value),
      },
      comptage2: {
        teams: selectedTeams2.value,
        jobs: Object.fromEntries(teamJobs2.value),
      },
    };

    // Ici, appeler votre service pour sauvegarder les affectations
    await saveState();

    await alertService.success({
      title: 'Succès',
      text: 'Les affectations ont été enregistrées avec succès!'
    });

    // Redirection vers la liste des plannings
    router.push({ name: 'gestion-des-plannings' });

  } catch (error) {
    console.error('Erreur lors de l\'affectation:', error);
    await alertService.error({
      title: 'Erreur',
      text: 'Une erreur est survenue lors de l\'enregistrement des affectations.'
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
              0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

</style>