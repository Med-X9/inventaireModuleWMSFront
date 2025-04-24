<template>
    <DynamicWizard
      :steps="wizardSteps"
      color="#4c6ef5"
      @complete="onComplete"
    >
      <!-- Étape 1 -->
      <template #step-0>
        <FormBuilder
          class="form-builder !bg-transparent !shadow-none"
          :fields="formFields"
          :initialData="{ reference: autoReference }"
          hide-submit
          @submit="onStep1"
        />
      </template>
  
      <!-- Étape 2 -->
      <template #step-1>
        <FormBuilder
          class="!bg-transparent !shadow-none"
          :fields="compteMagasinFields"
          :initialData="step2Data"
          hide-submit
          @submit="onStep2"
        />
      </template>
  
      <!-- Étape 3 -->
      <template #step-2>
        <div class="space-y-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-800">{{ subLabels[activeContageIndex] }}</h2>
            <div class="text-sm text-gray-500">Contage {{ activeContageIndex + 1 }} sur {{ contages.length }}</div>
          </div>
  
          <!-- Choix du mode -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mode de contage</label>
            <select v-model="currentContage.mode" class="w-full px-4 py-2 border rounded-md focus:ring focus:ring-blue-500">
              <option disabled value="">-- Sélectionner --</option>
              <option value="etat" v-if="activeContageIndex === 0">État de stock</option>
              <option value="article">Article + Emplacement</option>
              <option value="liste">Liste Emplacement</option>
            </select>
          </div>
  
          <!-- Mode: Article -->
          <div v-if="currentContage.mode === 'article'" class="space-y-4">
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                :id="`variantToggle${activeContageIndex}`"
                v-model="currentContage.isVariant"
                class="form-checkbox text-blue-600"
              />
              <label :for="`variantToggle${activeContageIndex}`" class="text-gray-700">
                Travailler avec les variantes
              </label>
            </div>
          </div>
  
          <!-- Mode: Liste -->
          <div v-else-if="currentContage.mode === 'liste'" class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">Options</label>
            <div class="flex items-center gap-2">
              <input type="checkbox" v-model="currentContage.useScanner" :id="`scan${activeContageIndex}`" class="form-checkbox text-blue-600" />
              <label :for="`scan${activeContageIndex}`" class="text-gray-700">Scanner</label>
            </div>
            <div class="flex items-center gap-2">
              <input type="checkbox" v-model="currentContage.useManual" :id="`man${activeContageIndex}`" class="form-checkbox text-blue-600" />
              <label :for="`man${activeContageIndex}`" class="text-gray-700">Saisie manuelle</label>
            </div>
          </div>
  
          <!-- Navigation contages -->
          <div class="flex justify-between mt-6 pt-4 border-t">
            <button
              class="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
              @click="prevContage"
              :disabled="activeContageIndex === 0"
            >
              ← Précédent
            </button>
  
            <button
              v-if="activeContageIndex < contages.length - 1"
              class="text-sm text-blue-600 hover:underline"
              @click="nextContage"
            >
              Suivant →
            </button>
  
            <button
              v-else
              class="text-sm text-green-600 hover:underline"
              @click="goToNextWizardStep"
            >
              Terminer Paramétrage
            </button>
          </div>
        </div>
      </template>
    </DynamicWizard>
  </template>
  
  <script lang="ts" setup>
  import { ref, reactive, computed } from 'vue';
  import DynamicWizard from '@/components/wizard/Wizard.vue';
  import FormBuilder, { FieldConfig } from '@/components/Form/FormBuilder.vue';
  
  const props = defineProps<{
    isEdit?: boolean
  }>();
  
  // Étapes du wizard avec titre dynamique
  const wizardSteps = computed(() => [
    {
      title: props.isEdit ? 'Modification de création' : 'Création',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
             </svg>`
    },
    {
      title: 'Comptes & Magasin',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                 d="M5 3h14a2 2 0 012 2v2H3V5a2 2 0 012-2zm16 6v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9h18zm-4 2H7v6h10v-6z" />
             </svg>`
    },
    {
      title: 'Paramétrage',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                 d="M11.049 2.927c.3-.921 1.603-.921 1.902 0a1.724 1.724 0 002.592.97c.836-.547 1.89.407 1.343 1.243a1.724 1.724 0 00.97 2.592c.921.3.921 1.603 0 1.902a1.724 1.724 0 00-.97 2.592c.547.836-.407 1.89-1.243 1.343a1.724 1.724 0 00-2.592.97c-.3.921-1.603.921-1.902 0a1.724 1.724 0 00-2.592-.97c-.836.547-1.89-.407-1.343-1.243a1.724 1.724 0 00-.97-2.592c-.921-.3-.921-1.603 0-1.902a1.724 1.724 0 00.97-2.592c-.547-.836.407-1.89 1.243-1.343a1.724 1.724 0 002.592-.97z" />
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3" />
             </svg>`
    },
  ]);
  
  // Étape 1
  const autoReference = `REF-${Math.floor(1000 + Math.random() * 9000)}`;
  const formFields: FieldConfig[] = [
    { key: 'nom', label: 'Nom', type: 'text', props: { required: true } },
    { key: 'date', label: 'Date', type: 'date', props: { required: true } },
    { key: 'type', label: 'Type', type: 'text', props: { required: true } },
  ];
  const step1Data = ref<Record<string, any>>({});
  function onStep1(data: Record<string, any>) {
    step1Data.value = data;
  }
  
  // Étape 2
  const compteMagasinFields: FieldConfig[] = [
    {
      key: 'comptes',
      label: 'Comptes',
      type: 'select',
      searchable: true,
      props: { placeholder: 'Choisir un compte' },
      options: [
        { label: 'Compte A', value: 'A' },
        { label: 'Compte B', value: 'B' },
      ],
    },
    {
      key: 'magasin',
      label: 'Magasin',
      type: 'select',
      searchable: true,
      props: { placeholder: 'Choisir un magasin' },
      options: [
        { label: 'Magasin X', value: 'X' },
        { label: 'Magasin Y', value: 'Y' },
      ],
    },
  ];
  const step2Data = ref<Record<string, any>>({});
  function onStep2(data: Record<string, any>) {
    step2Data.value = data;
  }
  
  // Étape 3 : Paramétrage contages
  const subLabels = ['Premier contage', 'Deuxième contage', 'Troisième contage'];
  const contages = reactive([
    { mode: '', isVariant: false, useScanner: false, useManual: false },
    { mode: '', isVariant: false, useScanner: false, useManual: false },
    { mode: '', isVariant: false, useScanner: false, useManual: false },
  ]);
  const activeContageIndex = ref(0);
  const currentContage = computed(() => contages[activeContageIndex.value]);
  
  function nextContage() {
    if (activeContageIndex.value < contages.length - 1) activeContageIndex.value++;
  }
  function prevContage() {
    if (activeContageIndex.value > 0) activeContageIndex.value--;
  }
  function goToNextWizardStep() {
    document.querySelector('.wizard-tab-content .btn-next')?.dispatchEvent(new Event('click'));
  }
  
  // Finalisation
  function onComplete() {
    console.log('✅ Données envoyées :');
    console.log('Étape 1 - Infos générales :', step1Data.value);
    console.log('Étape 2 - Comptes & Magasin :', step2Data.value);
    console.log('Étape 3 - Paramétrage :', contages);
  }
  </script>
  
  <style scoped>
  ::v-deep .form-builder form {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }
  ::v-deep .form-builder form > * {
    flex: 1 1 30%;
    min-width: 200px;
  }
  </style>
  