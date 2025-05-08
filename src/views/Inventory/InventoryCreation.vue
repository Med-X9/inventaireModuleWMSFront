<template>
  <div>
    <div class="flex justify-between mb-4">
      <ul class="flex space-x-2 rtl:space-x-reverse">
        <li>
          <router-link
            :to="{ name: 'inventory-list' }"
            class="text-primary hover:underline"
          >
            Gestion d'inventaire
          </router-link>
        </li>
        <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
          <span>Création d'inventaire</span>
        </li>
      </ul>
      <button
        @click="onCancelClick"
        class="px-4 py-2 text-black  dark:text-white-light border border-secondary font-medium rounded-lg transition-colors"
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
      :is-valid="isValid"
      :beforeChange="validateAndSaveStep"
      @complete="handleSubmit"
      :finish-button-text="isSubmitting ? 'Création en cours...' : 'Créer'"
      color="#ffc107"
    >
      <!-- Étape 1 : Création -->
      <template #step-0>
        <FormBuilder
          v-model:modelValue="state.step1Data"
          :fields="formFields"
          hide-submit
          @validation-change="onValidationChange"
        />
      </template>

      <!-- Étape 2 : Comptes & Magasins -->
      <template #step-1>
        <FormBuilder
          v-model:modelValue="state.step2Data"
          :fields="compteMagasinFields"
          hide-submit
          @validation-change="onValidationChange"
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
          @validation-change="onValidationChange"
        />
      </template>
    </DynamicWizard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useInventoryCreation } from '@/composables/useInventoryCreation';
import DynamicWizard from '@/components/wizard/Wizard.vue';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import ParamStep from '@/components/ParamStep.vue';
import type { FieldConfig } from '@/interfaces/form';
import { required, date, selectRequired } from '@/utils/validate';
import { alertService } from '@/services/alertService';


const router = useRouter();
const isSubmitting = ref(false);

const {
  state,
  currentStep,
  availableModesForStep,
  onStepComplete,
  onComplete,
  cancelCreation,
  loaded,
  isValid
} = useInventoryCreation();

const wizardKey = ref(Date.now());

const wizardSteps = [
  { title: 'Création' },
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

const compteMagasinFields: FieldConfig[] = [
  { 
    key: 'compte', 
    label: 'Compte', 
    type: 'select', 
    options: ['Compte 1', 'Compte 2'], 
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
    props: { placeholder: 'Sélectionnez un ou plusieurs magasins' }, 
    validators: [{ key: 'magasin', ...selectRequired() }] 
  }
];

async function onCancelClick() {
  await cancelCreation();
  wizardKey.value = Date.now();
}

async function validateAndSaveStep(prev: number, next: number): Promise<boolean> {
  let data: any;
  if (prev === 0) data = state.step1Data;
  else if (prev === 1) data = state.step2Data;
  else data = state.contages[prev - 2];

  return await onStepComplete(prev, data);
}

function onValidationChange(valid: boolean) {
  isValid.value = valid;
}

async function handleSubmit() {
  if (isSubmitting.value) return;
  
  try {
    isSubmitting.value = true;
    
    // Validation finale
    if (!isValid.value) {
      await alertService.error({
        title: 'Erreur de validation',
        text: 'Veuillez vérifier tous les champs requis.'
      });
      return;
    }

    // Appel du service pour sauvegarder l'inventaire
    await onComplete();

    // Afficher le message de succès
    await alertService.success({
      title: 'Succès',
      text: 'L\'inventaire a été créé avec succès!'
    });

    // Redirection vers la liste des inventaires
    router.push({ name: 'inventory-list' });

  } catch (error) {
    console.error('Erreur lors de la création de l\'inventaire:', error);
    await alertService.error({
      title: 'Erreur',
      text: 'Une erreur est survenue lors de la création de l\'inventaire. Veuillez réessayer.'
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>