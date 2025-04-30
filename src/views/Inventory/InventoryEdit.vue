<template>
  <div>
    <div class="flex justify-between mb-6">
      <h1 class="text-xl font-bold">Modification d'inventaire</h1>
      <button
        @click="cancelEdit"
        class="px-4 py-2 text-red-600 hover:text-red-700 font-medium"
      >
        Annuler
      </button>
    </div>

  

    <template>
      <DynamicWizard
        :steps="wizardSteps"
        v-model:current-step="currentStep"
        color="#ffc107"
        @complete="onComplete"
      >
        <!-- Étape 1 -->
        <template #step-0>
          <FormBuilder
            v-model:modelValue="state.step1Data"
            :fields="formFields"
            hide-submit
          />
        </template>

        <!-- Étape 2 -->
        <template #step-1>
          <FormBuilder
            v-model:modelValue="state.step2Data"
            :fields="compteMagasinFields"
            hide-submit
          />
        </template>

        <!-- Paramétrages 1 à 3 -->
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DynamicWizard from '@/components/wizard/Wizard.vue';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import ParamStep from '@/components/ParamStep.vue';
import type { FieldConfig } from '@/interfaces/form';
import { useInventoryEdit } from '../../composables/useInventoryEdit';

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

const formFields: FieldConfig[] = [
  {
    key: 'libelle',
    label: 'Libellé',
    type: 'text',
    props: { placeholder: 'Entrer le libellé' }
  },
  {
    key: 'date',
    label: 'Date',
    type: 'date'
  },
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    options: ['Inventaire Général'],
    props: { disabled: true },
    searchable: false,
    clearable: false
  }
];

const compteMagasinFields: FieldConfig[] = [
  {
    key: 'compte',
    label: 'Compte',
    type: 'select',
    options: ['Compte 1', 'Compte 2'],
    searchable: false,
    clearable: true,
    props: { placeholder: 'Sélectionner un compte' }
  },
  {
    key: 'magasin',
    label: 'Magasin',
    type: 'select',
    options: ['Magasin A', 'Magasin B'],
    searchable: true,
    clearable: true,
    multiple: true,
    props: { placeholder: 'Rechercher et sélectionner un magasin…' }
  }
];
</script>
