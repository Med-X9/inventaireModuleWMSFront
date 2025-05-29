<template>
  <div>
    <!-- Fil d’Ariane et bouton Annuler -->
    <div class="flex flex-col mb-4">
      <ul class="flex space-x-2">
        <li>
          <router-link :to="{ name: 'inventory-list' }" class="text-primary hover:underline">
            Gestion d'inventaire
          </router-link>
        </li>
        <li class="before:content-['/'] ltr:before:mr-2">
          <span>Création d'inventaire</span>
        </li>
      </ul>
      <div class="flex justify-end mt-2">
        <button
          @click="onCancelClick"
          class="px-4 py-2 dark:text-white-light text-black border border-secondary rounded-lg"
        >
          Annuler
        </button>
      </div>
    </div>

    <!-- Brouillon en cours de chargement -->
    <div v-if="!loaded" class="text-center py-10">
      Chargement de votre brouillon…
    </div>

    <!-- Wizard -->
    <DynamicWizard
      v-else
      :key="wizardKey"
      :steps="wizardSteps"
      v-model:current-step="currentStep"
      :is-valid="isValid"
      :beforeChange="validateAndSaveStep"
      @complete="handleSubmit"
      :finish-button-text="isSubmitting ? 'Création…' : 'Créer'"
      color="#ffc107"
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

      <!-- Paramétrages dynamiques -->
      <template v-for="(_, idx) in state.contages" :key="idx" v-slot:[`step-${idx+2}`]>
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
const wizardKey = ref(Date.now());

const {
  state,
  currentStep,
  availableModesForStep,
  onStepComplete,
  onComplete,
  cancelCreation,
  loaded,
  isValid,
} = useInventoryCreation();

/* Étape 1 */
const formFields: FieldConfig[] = [
  {
    key: 'libelle',
    label: 'Libellé',
    type: 'text',
    props: { placeholder: 'Entrer le libellé' },
    validators: [{ key: 'libelle', ...required('Le libellé est requis') }]
  },
  {
    key: 'date',
    label: 'Date',
    type: 'date',
    validators: [
      { key: 'date', ...required('La date est requise') },
      { key: 'date', ...date('Format de date invalide') }
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

/* Étape 2 */
const compteMagasinFields: FieldConfig[] = [
  {
    key: 'compte',
    label: 'Compte',
    type: 'select',
    options: ['Compte 1', 'Compte 2'],
    validators: [{ key: 'compte', ...selectRequired('Veuillez sélectionner un compte') }]
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
    validators: [{ key: 'magasin', ...selectRequired('Veuillez sélectionner au moins un magasin') }]
  }
];

/* Définitions des étapes du wizard */
const wizardSteps = [
  { title: 'Création' },
  { title: 'Comptes & Magasin' },
  { title: 'Paramétrage 1/3' },
  { title: 'Paramétrage 2/3' },
  { title: 'Paramétrage 3/3' }
];

/* Valider et sauvegarder avant chaque changement d’étape */
async function validateAndSaveStep(prev: number, next: number): Promise<boolean> {
  let data: any;
  if (prev === 0) data = state.step1Data;
  else if (prev === 1) data = state.step2Data;
  else data = state.contages[prev - 2];

  return await onStepComplete(prev, data);
}

/* Annuler la création */
async function onCancelClick() {
  await cancelCreation();
  wizardKey.value = Date.now();
}

/* Soumission finale */
async function handleSubmit() {
  if (isSubmitting.value) return;
  try {
    isSubmitting.value = true;

    // Validation et sauvegarde de toutes les étapes
    for (let i = 0; i < wizardSteps.length; i++) {
      const ok = await validateAndSaveStep(i, i + 1);
      if (!ok) {
        await alertService.error({
          title: 'Validation',
          text: `Erreurs de validation à l'étape ${i + 1}`
        });
        return;
      }
    }

    // Nettoyage et reset du composable
    await onComplete();

    
     // → Redirection vers la liste des inventaires
     router.push({ name: 'inventory-list' });
    // Alerte de succès
    await alertService.success({
      title: 'Succès',
      text: 'Votre inventaire a été créé avec succès !'
    });

   

  } catch (err) {
    console.error(err);
    await alertService.error({
      title: 'Erreur',
      text: "Une erreur est survenue lors de la création de l'inventaire."
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<style scoped>
/* Vos styles ici */
</style>
