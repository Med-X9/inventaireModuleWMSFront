<template>
  <div>
    <div class="flex justify-between mb-6">
      <h1 class="text-xl font-bold">Modification d'inventaire</h1>
      <button
        @click="onCancelClick"
        class="px-4 py-2 text-red-600 hover:text-red-700 font-medium"
      >
        Annuler
      </button>
    </div>

    <div v-if="loading" class="text-center py-10">
      Chargement de l'inventaire…
    </div>

    <DynamicWizard
      v-else
      :steps="wizardSteps"
      v-model:current-step="currentStep"
      color="#ffc107"
      @on-change="handleStepChange"
      @complete="onComplete"
    >
      <!-- Étape 1 : infos générales -->
      <template #step-0>
        <FormBuilder
          v-model:modelValue="state.step1Data"
          :fields="formFields"
          hide-submit
        />
      </template>

      <!-- Étape 2 : comptes & magasin -->
      <template #step-1>
        <FormBuilder
          v-model:modelValue="state.step2Data"
          :fields="compteMagasinFields"
          hide-submit
        />
      </template>

      <!-- Paramétrages dynamiques -->
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
import { useInventoryEdit } from '@/composables/useInventoryEdit';
import DynamicWizard from '@/components/wizard/Wizard.vue';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import ParamStep from '@/components/ParamStep.vue';
import { required, date, selectRequired } from '@/utils/validate';
import type { FieldConfig } from '@/interfaces/form';

const {
  state,
  currentStep,
  loading,
  availableModesForStep,
  onStepComplete,
  onComplete,
  cancelEdit
} = useInventoryEdit();

const wizardSteps = [
  { title: 'Modification' },
  { title: 'Comptes & Magasin' },
  { title: 'Paramétrage 1/3' },
  { title: 'Paramétrage 2/3' },
  { title: 'Paramétrage 3/3' }
];

// Étape 1 : champs généraux avec validators
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

// Étape 2 : comptes & magasin avec validators
const compteMagasinFields: FieldConfig[] = [
  {
    key: 'compte',
    label: 'Compte',
    type: 'select',
    options: ['Compte 1', 'Compte 2'],
    props: { placeholder: 'Sélectionner un compte' },
    searchable: false,
    clearable: true,
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
    props: { placeholder: 'Rechercher et sélectionner un magasin…' },
    validators: [
      { key: 'magasin', ...selectRequired() }
    ]
  }
];

// Sauvegarde avant changement d'étape
function handleStepChange(prev: number, next: number) {
  let data;
  if (prev === 0) data = state.step1Data;
  else if (prev === 1) data = state.step2Data;
  else data = state.contages[prev - 2];
  onStepComplete(prev, data);
}

// Annulation (renommée pour éviter doublon)
function onCancelClick() {
  cancelEdit();
}
</script>
