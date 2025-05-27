<template>
  <div class="container mx-auto">
    <!-- Fil d'Ariane et bouton Annuler -->
    <div class="flex flex-col mb-2">
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
      <div class="flex justify-start md:justify-end mt-1">
        <button @click="cancelAffecter" class="border border-secondary text-secondary dark:text-white-light px-4 py-2 rounded-lg text-sm font-medium shadow hover:bg-secondary hover:text-white transition">
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
          <!-- Sélection d'équipe -->
          <FormBuilder v-model="counting1Form.team" :fields="formFields1.slice(0,1)" hide-submit />

          <!-- Dual-list jobs -->
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
                <button @click="filter1=''" class="absolute right-2 text-gray-400 hover:text-gray-600">×</button>
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

            <!-- Controls -->
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
        </div>
      </template>

      <!-- Étape 2 -->
      <template #step-1>
        <div class="panel bg-white shadow-lg rounded-lg p-6 mb-6">
          <h3 class="text-xl font-semibold mb-4">Deuxième comptage</h3>
          <FormBuilder v-model="counting2Form.team" :fields="formFields2.slice(0,1)" hide-submit />

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
                <button @click="filter2=''" class="absolute right-2 text-gray-400 hover:text-gray-600">×</button>
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
                  :class="['flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100', selectedAdded2.includes(job.id) ? 'bg-gray-100 font-medium' : '']">
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
  currentStep, loaded,
  counting1Form, counting2Form,
  formFields1, formFields2,
  availableJobs1, availableJobs2,
  selectedTeams1, selectedTeams2,
  teamJobs1, teamJobs2,
  validateStep, cancelAffecter, saveState
} = useAffecter();

const steps = [
  { title: 'Premier comptage', icon: '1' },
  { title: 'Deuxième comptage', icon: '2' }
];

const isStepValid = computed(() => {
  return (
    (currentStep.value === 0 && teamJobs1.value.size > 0) ||
    (currentStep.value === 1 && teamJobs2.value.size > 0)
  );
});

// Step 1 dual-list state
const filter1 = ref('');
const selectedAvailable1 = ref<string[]>([]);
const selectedAdded1 = ref<string[]>([]);
const dates1 = ref<Record<string, string>>({});

const filteredAvailable1 = computed(() =>
  availableJobs1.value
    .filter(j => !counting1Form.jobs.includes(j.id))
    .filter(j => j.locations.join(', ').toLowerCase().includes(filter1.value.toLowerCase()))
);
const addedJobs1 = computed(() =>
  availableJobs1.value.filter(j => counting1Form.jobs.includes(j.id))
);

function toggleAvailable1(id: string) {
  const arr = selectedAvailable1.value;
  arr.includes(id) ? selectedAvailable1.value = arr.filter(x => x !== id) : arr.push(id);
}
function toggleAdded1(id: string) {
  const arr = selectedAdded1.value;
  arr.includes(id) ? selectedAdded1.value = arr.filter(x => x !== id) : arr.push(id);
}
function addSelected1() {
  counting1Form.jobs = Array.from(new Set([...counting1Form.jobs, ...selectedAvailable1.value]));
  selectedAvailable1.value = []; saveState();
}
function removeSelected1() {
  counting1Form.jobs = counting1Form.jobs.filter(id => !selectedAdded1.value.includes(id));
  selectedAdded1.value = []; saveState();
}
function addAll1() { counting1Form.jobs = [...new Set([...counting1Form.jobs, ...filteredAvailable1.value.map(j=>j.id)])]; saveState();}
function removeAll1() { counting1Form.jobs = []; saveState(); }

// Step 2 dual-list state
const filter2 = ref('');
const selectedAvailable2 = ref<string[]>([]);
const selectedAdded2 = ref<string[]>([]);
const dates2 = ref<Record<string, string>>({});

const filteredAvailable2 = computed(() =>
  availableJobs2.value
    .filter(j => !counting2Form.jobs.includes(j.id))
    .filter(j => j.locations.join(', ').toLowerCase().includes(filter2.value.toLowerCase()))
);
const addedJobs2 = computed(() =>
  availableJobs2.value.filter(j => counting2Form.jobs.includes(j.id))
);

function toggleAvailable2(id: string) {
  const arr = selectedAvailable2.value;
  arr.includes(id) ? selectedAvailable2.value = arr.filter(x=>x!==id) : arr.push(id);
}
function toggleAdded2(id: string) {
  const arr = selectedAdded2.value;
  arr.includes(id) ? selectedAdded2.value = arr.filter(x=>x!==id) : arr.push(id);
}
function addSelected2() { counting2Form.jobs = Array.from(new Set([...counting2Form.jobs, ...selectedAvailable2.value])); selectedAvailable2.value=[]; saveState(); }
function removeSelected2() { counting2Form.jobs = counting2Form.jobs.filter(id=>!selectedAdded2.value.includes(id)); selectedAdded2.value=[]; saveState(); }
function addAll2() { counting2Form.jobs=[...new Set([...counting2Form.jobs,...filteredAvailable2.value.map(j=>j.id)])]; saveState(); }
function removeAll2() { counting2Form.jobs=[]; saveState(); }

async function handleComplete() {
  if (isSubmitting.value) return;
  isSubmitting.value=true;
  try {
    if (!teamJobs1.value.size || !teamJobs2.value.size) {
      await alertService.error({ title:'Validation', text:'Affectez au moins une équipe pour chaque comptage.' });
      return;
    }
    await saveState(); await indexedDBService.clearState('affecter');
    await alertService.success({ title:'Succès', text:'Les affectations ont été enregistrées !' });
    router.push({ name:'planning-management' });
  } catch{ await alertService.error({ title:'Erreur', text:'Erreur lors de l’enregistrement.' }); }
  finally{ isSubmitting.value=false; }
}
</script>

<style scoped>
.form-input { border:1px solid #ccc; border-radius:.5rem; }
</style>
