<template>
  <div>
    <div class="flex justify-between mb-4">
      <h1 class="text-xl font-bold">Création d'inventaire</h1>
      <button
        @click="onCancelClick"
        class="px-4 py-2 text-black border border-secondary font-medium rounded transition-colors"
      >
        Annuler
      </button>
    </div>

    <div v-if="!loaded" class="text-center py-10">
      Chargement de votre brouillon…
    </div>

    <DynamicWizard
      v-else
      :key="wizardKey"
      :steps="wizardSteps"
      v-model:current-step="currentStep"
      color="#ffc107"
      @on-change="handleStepChange"
      @complete="onComplete"
    >
      <!-- Étape 1 : Création -->
      <template #step-0>
        <FormBuilder
          v-model:modelValue="state.step1Data"
          :fields="formFields"
          hide-submit
        />
      </template>

      <!-- Étape 2 : Comptes & Magasins -->
      <template #step-1>
        <FormBuilder
          v-model:modelValue="state.step2Data"
          :fields="compteMagasinFields"
          hide-submit
        />
      </template>

      <!-- Paramétrages 1/3, 2/3, 3/3 -->
      <template
        v-for="(_, idx) in state.contages"
        :key="idx"
        v-slot:[`step-${idx+2}`]
      >
        <ParamStep
          v-model="state.contages[idx]"
          :step-index="idx"
          :available-modes="availableModesForStep(idx)"
        />
      </template>
    </DynamicWizard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useInventoryCreation } from '@/composables/useInventoryCreation';
import DynamicWizard from '@/components/wizard/Wizard.vue';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import ParamStep from '@/components/ParamStep.vue';
import { required, date, selectRequired } from '@/utils/validate';
import type { FieldConfig } from '@/interfaces/form';

const {
  state,
  currentStep,
  availableModesForStep,
  onStepComplete,
  onComplete,
  cancelCreation,
  loaded
} = useInventoryCreation();

// Clé pour forcer la recréation du wizard après annulation
const wizardKey = ref(Date.now());

const wizardSteps = [
  { title: 'Création' },
  { title: 'Comptes & Magasin' },
  { title: 'Paramétrage 1/3' },
  { title: 'Paramétrage 2/3' },
  { title: 'Paramétrage 3/3' }
];

// Étape 1 : champs avec validators
const formFields: FieldConfig[] = [
  {
    key: 'libelle',
    label: 'Libellé',
    type: 'text',
    props: { placeholder: 'Entrer le libellé' },
    validators: [
      { key: 'libelle', ...required() }
    ]
  },
  {
    key: 'date',
    label: 'Date',
    type: 'date',
    validators: [
      { key: 'date', ...required() },
      { key: 'date', ...date() }
    ]
  },
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    options: ['Inventaire Général'],
    props: { disabled: true },
    searchable: false,
    clearable: false,
    validators: []
  }
];

// Étape 2 : champs compte & magasin
const compteMagasinFields: FieldConfig[] = [
  {
    key: 'compte',
    label: 'Compte',
    type: 'select',
    options: ['Compte 1', 'Compte 2'],
    validators: [
      { key: 'compte', ...selectRequired() }
    ]
  },
  {
    key: 'magasin',
    label: 'Magasin',
    type: 'select',
    options: ['Magasin A', 'Magasin B'],
    multiple: true,
    searchable: true,
    clearable: true,
    props: { placeholder: 'Sélectionnez un ou plusieurs magasins' },
    validators: [
      { key: 'magasin', ...selectRequired() }
    ]
  }
];

// Gestion de l'annulation
async function onCancelClick() {
  await cancelCreation();
  wizardKey.value = Date.now();
}

// Sauvegarde avant changement d'étape
function handleStepChange(prev: number, next: number) {
  let data;
  if (prev === 0) data = state.step1Data;
  else if (prev === 1) data = state.step2Data;
  else data = state.contages[prev - 2];
  onStepComplete(prev, data);
}
</script>
