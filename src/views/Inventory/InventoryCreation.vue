<template>
  <div>
    <div class="flex justify-end mb-2">
      <button @click="onCancelClick" class="btn btn-outline-primary">
        Annuler
      </button>
    </div>

    <!-- Récapitulatif - Version améliorée et compacte -->
    <div class="w-full mb-1 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
      <!-- En-tête avec icône -->
      <div class="flex items-center gap-2 px-1.5 mb-2">
        <svg class="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <span class="font-medium text-xs text-primary">Récapitulatif</span>
      </div>
      
      <!-- Informations principales en grille responsive -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-1.5 px-2 text-xs">
        <!-- Libellé -->
        <div class="flex items-center gap-1.5">
          <span class="text-gray-500 dark:text-gray-400 font-medium">Libellé:</span>
          <span class="text-gray-900 dark:text-white font-semibold">{{ state.step1Data.libelle || 'Sans libellé' }}</span>
        </div>
        
        <!-- Date -->
        <div class="flex items-center gap-1.5">
          <span class="text-gray-500 dark:text-gray-400 font-medium">Date:</span>
          <span class="text-gray-900 dark:text-white font-semibold">{{ state.step1Data.date || 'Date non définie' }}</span>
        </div>
        
        <!-- Type -->
        <div class="flex items-center gap-1.5">
          <span class="text-gray-500 dark:text-gray-400 font-medium">Type:</span>
          <span class="text-gray-900 dark:text-white font-semibold">{{ state.step1Data.type || 'Type' }}</span>
        </div>
        
        <!-- Compte -->
        <div class="flex items-center gap-1.5">
          <span class="text-gray-500 dark:text-gray-400 font-medium">Compte:</span>
          <span class="text-gray-900 dark:text-white font-semibold">{{ state.step1Data.compte || 'Compte non défini' }}</span>
        </div>
        
        <!-- Magasin -->
        <div class="flex items-center gap-1.5">
          <span class="text-gray-500 dark:text-gray-400 font-medium">Magasin:</span>
          <span class="text-gray-900 dark:text-white font-semibold">
            <template v-if="Array.isArray(state.step1Data.magasin) && state.step1Data.magasin.length">
              {{ state.step1Data.magasin.slice(0, 2).map(m => typeof m === 'string' ? m : m.magasin).join(', ') }}
              <span v-if="state.step1Data.magasin.length > 2" class="text-gray-500 ml-1">(+{{ state.step1Data.magasin.length - 2 }})</span>
            </template>
            <template v-else>Non défini</template>
          </span>
        </div>
      </div>
      
      <!-- Comptages en grille responsive -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-2">
        <div v-for="(comptage, index) in state.comptages" :key="index" class="px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700">
          <!-- En-tête du comptage -->
          <div class="flex items-center justify-between mb-1">
            <span class="text-xs text-gray-900 dark:text-white">Comptage {{ index + 1 }}</span>
            <span v-if="comptage.mode" class="px-2 py-0.5 bg-gray-400/10 dark:bg-dark-light/10 dark:text-white-light hover:text-primary rounded-lg text-xs">
              {{ comptage.mode }}
            </span>
            <span v-else class="text-gray-400 italic text-xs">Non configuré</span>
          </div>
          
          <!-- Options -->
          <div class="flex flex-wrap gap-1">
            <template v-if="hasActiveOptions(comptage)">
              <!-- Options "en vrague" -->
              <span v-if="comptage.inputMethod === 'saisie'" class="inline-flex items-center px-1.5 py-0.5 bg-primary/10 text-primary rounded-lg text-xs">
                Saisie quantité
              </span>
              <span v-if="comptage.inputMethod === 'scanner'" class="inline-flex items-center px-1.5 py-0.5 bg-primary/10 text-primary rounded-lg text-xs">
                Scanner unitaire
              </span>
              <span v-if="comptage.guideQuantite" class="inline-flex items-center px-1.5 py-0.5 bg-primary/10 text-primary rounded-lg text-xs">
                Guide quantité
              </span>
              
              <!-- Options "en vrague par article" -->
              <span v-if="comptage.isVariante" class="inline-flex items-center px-1.5 py-0.5 bg-primary/10 text-primary rounded-lg text-xs">
                Is variante
              </span>
              <span v-if="comptage.guideArticle" class="inline-flex items-center px-1.5 py-0.5 bg-primary/10 text-primary rounded-lg text-xs">
                Guide Article
              </span>
              <span v-if="comptage.dlc" class="inline-flex items-center px-1.5 py-0.5 bg-primary/10 text-primary rounded-lg text-xs">
                DLC
              </span>
              <span v-if="comptage.guideArticleQuantite" class="inline-flex items-center px-1.5 py-0.5 bg-primary/10 text-primary rounded-lg text-xs">
                Guide Article quantité
              </span>
              <span v-if="comptage.numeroLot" class="inline-flex items-center px-1.5 py-0.5 bg-primary/10 text-primary rounded-lg text-xs">
                Numéro de lot
              </span>
            </template>
            <span v-else class="text-gray-400 italic text-xs">Aucune option</span>
          </div>
        </div>
      </div>
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
      :finish-button-text="isSubmitting ? 'Création…' : 'Créer'"
      color="#ffc107"
    >
      <template #step-0>
        <FormBuilder
          v-model:modelValue="state.step1Data"
          :fields="formFields"
          hide-submit
          :columns="2"
        />
      </template>

      <template
        v-for="(_, idx) in state.comptages"
        :key="idx"
        v-slot:[`step-${idx+1}`]
      >
        <ParamStep
          v-model="state.comptages[idx]"
          :step-index="idx"
          :available-modes="availableModesForStep(idx)"
          :prev-comptages="state.comptages"
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
import type { ComptageConfig } from '@/interfaces/inventoryCreation';
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
    type: 'multi-select-with-dates',
    options: ['Magasin A', 'Magasin B', 'Magasin C', 'Magasin D'],
    searchable: true,
    clearable: true,
    validators: [{ key: 'magasin', ...selectRequired('Veuillez sélectionner au moins un magasin') }]
  }
];

/* Définitions des étapes du wizard */
const wizardSteps = [
  { title: 'Création' },
  { title: 'comptage 1/3' },
  { title: 'comptage 2/3' },
  { title: 'comptage 3/3' }
];

/* Fonction helper pour vérifier si un comptage a des options actives */
function hasActiveOptions(comptage: ComptageConfig): boolean {
  return comptage.inputMethod !== '' ||
         comptage.guideQuantite ||
         comptage.isVariante ||
         comptage.guideArticle ||
         comptage.dlc ||
         comptage.guideArticleQuantite ||
         comptage.numeroLot ||
         // Legacy support
         comptage.saisieQuantite ||
         comptage.scannerUnitaire;
}

/* Valider et sauvegarder avant chaque changement d'étape */
async function validateAndSaveStep(prev: number, next: number): Promise<boolean> {
  let data: any;
  if (prev === 0) data = state.step1Data;
  else data = state.comptages[prev - 1];

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