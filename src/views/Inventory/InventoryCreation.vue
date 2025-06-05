<template>
<div>
  <!-- Fil d'Ariane et bouton Annuler -->
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

  <!-- Récapitulatif - Version améliorée et compacte -->
  <div class="mb-3 panel ">
    <h3 class=" font-semibold mb-3 text-primary  border-b pb-2">
      Récapitulatif
    </h3>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Informations générales -->
      <div class="space-y-2">
        <h4 class="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">Informations générales</h4>
        <div class="grid grid-cols-[120px,1fr] gap-2 text-sm">
          <span class="text-gray-600 dark:text-gray-400">Libellé:</span>
          <span>{{ state.step1Data.libelle || '-' }}</span>
          
          <span class="text-gray-600 dark:text-gray-400">Date:</span>
          <span>{{ state.step1Data.date || '-' }}</span>
          
          <span class="text-gray-600 dark:text-gray-400">Type:</span>
          <span>{{ state.step1Data.type || '-' }}</span>
          
          <span class="text-gray-600 dark:text-gray-400">Compte:</span>
          <span>{{ state.step1Data.compte || '-' }}</span>
          
          <span class="text-gray-600 dark:text-gray-400">Magasins:</span>
          <div class="flex flex-wrap gap-1">
            <template v-if="Array.isArray(state.step1Data.magasin) && state.step1Data.magasin.length">
              <span v-for="mag in state.step1Data.magasin" 
                    :key="mag"
                    class="bg-gray-100 dark:bg-gray-700 text-xs px-2 py-0.5 rounded">
                {{ mag }}
              </span>
            </template>
            <span v-else>-</span>
          </div>
        </div>
      </div>

      <!-- Paramètres de contage -->
      <div class="space-y-2">
        <h4 class="font-medium text-sm text-gray-600 dark:text-gray-400 mb-2">Paramètres de contage</h4>
        <div class="space-y-2">
          <div v-for="(contage, index) in state.contages" 
               :key="index"
              >
            <div class="text-sm">
              <div class="flex gap-2">
                <div class="font-medium mb-1">Contage {{ index + 1 }} :</div>
                <span class="text-gray-600 dark:text-gray-400">Mode:</span>

                <span>{{ contage.mode || '-' }}</span>
                
                <template v-if="contage.mode">
                  <span class="text-gray-600 dark:text-gray-400">Options:</span>
                  <div class="flex flex-wrap gap-2">
                    <span v-if="contage.isVariant" 
                          class="text-xs bg-primary/5  text-primary-600  px-2 py-0.5 rounded-lg">
                      Variantes
                    </span>
                    <span v-if="contage.useScanner" 
                          class="text-xs bg-primary/5  text-primary-600  px-2 py-0.5 rounded-lg">
                      Scanner
                    </span>
                    <span v-if="contage.useSaisie" 
                          class="text-xs bg-primary/5  text-primary-600 px-2 py-0.5 rounded-lg">
                      Saisie manuelle
                    </span>
                    <span v-if="contage.stock" 
                          class="text-xs bg-primary/5  text-primary-600  px-2 py-0.5 rounded-lg">
                      Stock
                    </span>
                    <span v-if="!contage.isVariant && !contage.useScanner && !contage.useSaisie && !contage.stock">
                      -
                    </span>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Rest of the component remains unchanged -->
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
    :finish-button-text="isSubmitting ? 'Création…' : 'Créer'"
    color="#ffc107"
  >
    <template #step-0>
      <FormBuilder
        v-model:modelValue="state.step1Data"
        :fields="formFields"
        hide-submit
        :columns="3"
        
      />
    </template>

    <template 
      v-for="(_, idx) in state.contages" 
      :key="idx" 
      v-slot:[`step-${idx+1}`]
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

/* Étape 1 (fusion des anciennes étapes 1 et 2) */
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
  },
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
  { title: 'Paramétrage 1/3' },
  { title: 'Paramétrage 2/3' },
  { title: 'Paramétrage 3/3' }
];

/* Valider et sauvegarder avant chaque changement d'étape */
async function validateAndSaveStep(prev: number, next: number): Promise<boolean> {
  let data: any;
  if (prev === 0) data = state.step1Data;
  else data = state.contages[prev - 1];
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