<template>
  <div class="container mx-auto py-6">
    <!-- Fil d'Ariane et bouton Annuler -->
    <div class="flex flex-col mb-4">
      <ul class="flex space-x-2 rtl:space-x-reverse">
        <li>
          <router-link :to="{ name: 'planning-management' }" class="text-primary hover:underline">
            Gestion des plannings
          </router-link>
        </li>
        <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2 text-gray-500">
          <span>Affectation des équipes</span>
        </li>
      </ul>
      <div class="flex justify-end mt-3">
        <button @click="cancelAffecter" class="border border-secondary text-secondary px-4 py-2 rounded-lg text-sm font-medium shadow hover:bg-secondary hover:text-white transition">
          Annuler
        </button>
      </div>
    </div>

    <!-- Wizard -->
    <Wizard
      v-if="loaded"
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
        <div class="panel bg-white shadow-lg rounded-lg p-6 mb-6">
          <h3 class="text-xl font-semibold mb-4">Premier comptage</h3>

          <!-- FormBuilder lien à l'objet entier -->
          <FormBuilder v-model="counting1Form" :fields="formFields1" hide-submit />

          <!-- Dual-list jobs Step 1 -->
          <div class="grid grid-cols-1 gap-y-4 lg:grid-cols-[2fr_auto_2fr] lg:gap-x-4 mt-6">
            <!-- Jobs disponibles -->
            <section class="rounded-xl shadow-sm p-4 flex flex-col">
              <div class="flex justify-between items-center mb-2">
                <h4 class="font-semibold">Jobs disponibles</h4>
                <span class="inline-block bg-primary-light text-primary-600 text-xs font-medium px-2 py-0.5 rounded-full">
                  {{ filteredAvailable1.length }}
                </span>
              </div>
              <div class="relative mb-3 flex items-center">
                <input v-model="filter1" type="search" placeholder="Rechercher un job..." class="w-full form-input px-4 py-2 border rounded-lg focus:border-primary transition" />
                <button @click="filter1 = ''" class="absolute right-2 text-gray-400 hover:text-gray-600">×</button>
              </div>
              <ul class="flex-1 overflow-auto max-h-60 divide-y divide-gray-200 border border-gray-300 rounded">
                <li v-for="job in filteredAvailable1" :key="job.id" @click="toggleAvailable1(job.id)"
                  :class="['flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100', selectedAvailable1.includes(job.id) ? 'bg-gray-100 font-medium' : '']">
                  <input type="checkbox" :checked="selectedAvailable1.includes(job.id)" class="mr-2 form-checkbox" />
                  <span>{{ job.locations.join(', ') }}</span>
                </li>
              </ul>
              <div class="mt-2 text-center">
                <button @click="addAll1" :disabled="!filteredAvailable1.length" class="text-xs text-gray-500 hover:underline disabled:text-gray-300 inline-flex items-center">
                  Tout sélectionner <span class="ml-2 bg-gray-100 rounded-lg p-1">»</span>
                </button>
              </div>
            </section>

            <!-- Contrôles -->
            <div class="flex flex-col items-center justify-center space-y-2">
              <button @click="addSelected1" :disabled="!selectedAvailable1.length" class="p-2 bg-primary hover:bg-primary-dark text-white rounded-full disabled:opacity-50">&gt;</button>
              <button @click="removeSelected1" :disabled="!selectedAdded1.length" class="p-2 bg-danger hover:bg-danger-dark text-white rounded-full disabled:opacity-50">&lt;</button>
            </div>

            <!-- Jobs sélectionnés -->
            <section class="bg-white rounded-xl shadow-sm p-4 flex flex-col">
              <div class="flex justify-between items-center mb-2">
                <h4 class="font-semibold">Jobs sélectionnés</h4>
                <span class="inline-block bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {{ addedJobs1.length }}
                </span>
              </div>
              <ul class="flex-1 overflow-auto max-h-60 divide-y divide-gray-200 rounded">
                <li v-for="job in addedJobs1" :key="job.id" @click="toggleAdded1(job.id)"
                  :class="['flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100', selectedAdded1.includes(job.id) ? 'bg-gray-100 font-medium' : '']">
                  <input type="checkbox" :checked="selectedAdded1.includes(job.id)" class="mr-2 form-checkbox" />
                  <span class="flex-1">{{ job.locations.join(', ') }}</span>
                  <input v-model="dates1[job.id]" type="date" class="w-32 form-input px-2 py-1 border rounded ml-2" />
                </li>
              </ul>
              <div class="mt-2 text-center">
                <button @click="removeAll1" :disabled="!addedJobs1.length" class="text-xs text-gray-500 hover:underline disabled:text-gray-300 inline-flex items-center">
                  Tout supprimer <span class="ml-2 bg-gray-100 rounded-lg p-1">«</span>
                </button>
              </div>
            </section>
          </div>

          <!-- Bouton Affecter Step 1 -->
          <div class="flex justify-end mt-4">
            <button @click="handleTeamSelect1" class="bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-dark transition">
              Affecter
            </button>
          </div>
        </div>
      </template>

      <!-- Étape 2 -->
      <template #step-1>
        <div class="panel bg-white shadow-lg rounded-lg p-6 mb-6">
          <h3 class="text-xl font-semibold mb-4">Deuxième comptage</h3>

          <FormBuilder v-model="counting2Form" :fields="formFields2" hide-submit />

          <!-- Dual-list jobs Step 2 -->
          <div class="grid grid-cols-1 gap-y-4 lg:grid-cols-[2fr_auto_2fr] lg:gap-x-4 mt-6">
            <section class="rounded-xl shadow-sm p-4 flex flex-col">
              <div class="flex justify-between items-center mb-2">
                <h4 class="font-semibold">Jobs disponibles</h4>
                <span class="inline-block bg-primary-light text-primary-600 text-xs font-medium px-2 py-0.5 rounded-full">
                  {{ filteredAvailable2.length }}
                </span>
              </div>
              <div class="relative mb-3 flex items-center">
                <input v-model="filter2" type="search" placeholder="Rechercher un job..." class="w-full form-input px-4 py-2 border rounded-lg focus:border-primary transition" />
                <button @click="filter2 = ''" class="absolute right-2 text-gray-400 hover:text-gray-600">×</button>
              </div>
              <ul class="flex-1 overflow-auto max-h-60 divide-y divide-gray-200 border border-gray-300 rounded">
                <li v-for="job in filteredAvailable2" :key="job.id" @click="toggleAvailable2(job.id)"
                  :class="['flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100', selectedAvailable2.includes(job.id) ? 'bg-gray-100 font-medium' : '']">
                  <input type="checkbox" :checked="selectedAvailable2.includes(job.id)" class="mr-2 form-checkbox" />
                  <span>{{ job.locations.join(', ') }}</span>
                </li>
              </ul>
              <div class="mt-2 text-center">
                <button @click="addAll2" :disabled="!filteredAvailable2.length" class="text-xs text-gray-500 hover:underline disabled:text-gray-300 inline-flex items-center">
                  Tout sélectionner <span class="ml-2 bg-gray-100 rounded-lg p-1">»</span>
                </button>
              </div>
            </section>

            <div class="flex flex-col items-center justify-center space-y-2">
              <button @click="addSelected2" :disabled="!selectedAvailable2.length" class="p-2 bg-primary hover:bg-primary-dark text-white rounded-full disabled:opacity-50">&gt;</button>
              <button @click="removeSelected2" :disabled="!selectedAdded2.length" class="p-2 bg-danger hover:bg-danger-dark text-white rounded-full disabled:opacity-50">&lt;</button>
            </div>

            <section class="bg-white rounded-xl shadow-sm p-4 flex flex-col">
              <div class="flex justify-between items-center mb-2">
                <h4 class="font-semibold">Jobs sélectionnés</h4>
                <span class="inline-block bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {{ addedJobs2.length }}
                </span>
              </div>
              <ul class="flex-1 overflow-auto max-h-60 divide-y divide-gray-200 rounded">
                <li v-for="job in addedJobs2" :key="job.id" @click="toggleAdded2(job.id)"
                  :class="['flex items-center px-3 py-2.cursor-pointer hover:bg-gray-100', selectedAdded2.includes(job.id) ? 'bg-gray-100 font-medium' : '']">
                  <input type="checkbox" :checked="selectedAdded2.includes(job.id)" class="mr-2 form-checkbox" />
                  <span class="flex-1">{{ job.locations.join(', ') }}</span>
                  <input v-model="dates2[job.id]" type="date" class="w-32 form-input px-2 py-1 border rounded ml-2" />
                </li>
              </ul>
              <div class="mt-2 text-center">
                <button @click="removeAll2" :disabled="!addedJobs2.length" class="text-xs text-gray-500 hover:underline disabled:text-gray-300 inline-flex items-center">
                  Tout supprimer <span class="ml-2 bg-gray-100 rounded-lg p-1">«</span>
                </button>
              </div>
            </section>
          </div>

          <!-- Bouton Affecter Step 2 -->
          <div class="flex justify-end mt-4">
            <button @click="handleTeamSelect2" class="bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary-dark transition">
              Affecter
            </button>
          </div>
        </div>
      </template>

    </Wizard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import Wizard from '@/components/wizard/Wizard.vue';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import { useAffecter } from '@/composables/useAffecter';
import { alertService } from '@/services/alertService';
import { indexedDBService } from '@/services/indexedDBService';

const router = useRouter();
const isSubmitting = ref(false);

const {
  currentStep,
  loaded,
  counting1Form,
  counting2Form,
  formFields1,
  formFields2,
  filter1,
  filter2,
  filteredAvailable1,
  filteredAvailable2,
  selectedAvailable1,
  selectedAvailable2,
  selectedAdded1,
  selectedAdded2,
  addedJobs1,
  addedJobs2,
  dates1,
  dates2,
  toggleAvailable1,
  toggleAvailable2,
  toggleAdded1,
  toggleAdded2,
  addSelected1,
  addSelected2,
  removeSelected1,
  removeSelected2,
  addAll1,
  addAll2,
  removeAll1,
  removeAll2,
  handleTeamSelect1,
  handleTeamSelect2,
  validateStep,
  cancelAffecter,
  saveState
} = useAffecter();

const steps = [
  { title: 'Premier comptage', icon: '1' },
  { title: 'Deuxième comptage', icon: '2' }
];

const isStepValid = computed(() => {
  return (
    (currentStep.value === 0 && addedJobs1.value.length > 0) ||
    (currentStep.value === 1 && addedJobs2.value.length > 0)
  );
});

async function handleComplete() {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  try {
    await saveState();
    await indexedDBService.clearState('affecter');
    await alertService.success({ title: 'Succès', text: 'Les affectations ont été enregistrées !' });
    router.push({ name: 'planning-management' });
  } catch {
    await alertService.error({ title: 'Erreur', text: 'Erreur lors de l’enregistrement.' });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
.form-input { border:1px solid #ccc; border-radius:.5rem; }
</style>
