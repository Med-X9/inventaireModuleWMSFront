<template>
  <div>
    <div class="flex justify-end mb-3">
      <button
        @click="onCancelClick"
        class="px-4 py-2 text-black dark:text-white-light  border border-secondary font-medium rounded-lg transition-colors"
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
      :is-valid="isValid"
      :before-change="handleStepChange"
      color="#ffc107"
      @complete="onComplete"
      finish-button-text="Modifier"
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
          :prev-contages="state.contages"
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
import type { FieldConfig } from '@/interfaces/form';
import { required, date, selectRequired } from '@/utils/validate';

const {
  state,
  currentStep,
  loading,
  availableModesForStep,
  handleStepChange,
  isValid,
  onComplete,
  cancelEdit
} = useInventoryEdit();

// Étapes du wizard
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
    validators: [{ key: 'libelle', ...required() }]
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
    validators: [{ key: 'compte', ...selectRequired() }]
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
    validators: [{ key: 'magasin', ...selectRequired() }]
  }
];

// Appel de l'annulation
function onCancelClick() {
  cancelEdit();
}
</script>
