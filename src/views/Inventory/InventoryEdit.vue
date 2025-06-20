<template>
  <div>
    <div class="flex justify-end mb-2">
      <button
        @click="onCancelClick"
        class="btn btn-outline-primary"
      >
        Annuler
      </button>
    </div>

    <!-- Récapitulatif - Version améliorée et compacte -->
    <div class="w-full mb-1 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
      <!-- En-tête avec icône -->
      <div class="flex items-center gap-2 px-1.5 mb-2">
        <svg class="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
        <span class="font-medium text-xs text-primary">Récapitulatif - Modification</span>
      </div>
      
      <!-- Informations principales en grille responsive -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 w-full p-2 mb-1.5  text-md border border-gray-200 dark:border-gray-600 rounded-md  dark:bg-gray-700">
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
              <!-- Options "en vrac" uniquement -->
              <template v-if="comptage.mode === 'en vrac'">
                <span v-if="comptage.inputMethod === 'saisie' || comptage.saisieQuantite" class="px-2 py-1 text-primary rounded-full text-xs font-medium border border-primary/20">
                  Saisie quantité
                </span>
                <span v-if="comptage.inputMethod === 'scanner' || comptage.scannerUnitaire" class="px-2 py-1 text-primary rounded-full text-xs font-medium border border-primary/20">
                  Scanner unitaire
                </span>
                <span v-if="comptage.guideQuantite" class="px-2 py-1 text-primary rounded-full text-xs font-medium border border-primary/20">
                  Guide quantité
                </span>
              </template>
              
              <!-- Options "par article" uniquement -->
              <template v-if="comptage.mode === 'par article'">
                <span v-if="comptage.guideQuantite" class="px-2 py-1 text-primary rounded-full text-xs font-medium border border-primary/20">
                  Guide quantité
                </span>
                <span v-if="comptage.isVariante" class="px-2 py-1 text-primary rounded-full text-xs font-medium border border-primary/20">
                  Variante
                </span>
                <span v-if="comptage.guideArticle" class="px-2 py-1 text-primary rounded-full text-xs font-medium border border-primary/20">
                  Guide Article
                </span>
                <span v-if="comptage.dlc" class="px-2 py-1 text-primary rounded-full text-xs font-medium border border-primary/20">
                  DLC
                </span>
                <span v-if="comptage.numeroSerie" class="px-2 py-1 text-primary rounded-full text-xs font-medium border border-primary/20">
                  Numéro de série
                </span>
                <span v-if="comptage.numeroLot" class="px-2 py-1 text-primary rounded-full text-xs font-medium border border-primary/20">
                  Numéro de lot
                </span>
              </template>
            </template>
            <span v-else class="text-gray-400 italic text-xs">Aucune option</span>
          </div>
        </div>
      </div>
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
      :finish-button-text="isSubmitting ? 'Modification…' : 'Modifier'"
    >
      <!-- Étape 1 : infos générales -->
      <template #step-0>
        <FormBuilder
          v-model:modelValue="state.step1Data"
          :fields="formFields"
          hide-submit
          :columns="4"
        />
      </template>

      <!-- Paramétrages dynamiques -->
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
import { useInventoryEdit } from '@/composables/useInventoryEdit';
import DynamicWizard from '@/components/wizard/Wizard.vue';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import ParamStep from '@/components/ParamStep.vue';
import type { FieldConfig } from '@/interfaces/form';
import type { ComptageConfig } from '@/interfaces/inventoryCreation';
import { required, date, selectRequired } from '@/utils/validate';

const {
  state,
  currentStep,
  loading,
  availableModesForStep,
  handleStepChange,
  isValid,
  onComplete,
  cancelEdit,
  isSubmitting
} = useInventoryEdit();

// Étapes du wizard
const wizardSteps = [
  { title: 'Modification' },
  { title: 'comptage 1/3' },
  { title: 'comptage 2/3' },
  { title: 'comptage 3/3' }
];

// Étape 1 : champs généraux avec validators
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
    options: ['Magasin A', 'Magasin B', 'Magasin C', 'Magasin D', 'Magasin e', 'Magasin f', 'Magasin g', 'Magasin h'],
    searchable: true,
    clearable: true,
    props: { placeholder: 'Sélectionnez des magasins' },
    itemKey: 'magasin', // Specify the key name for magasin items
    dateLabel: 'Dates par magasin', // Custom label for the dates section
    validators: [{ key: 'magasin', ...selectRequired('Veuillez sélectionner au moins un magasin') }]
  }
];

/* Fonction helper pour vérifier si un comptage a des options actives selon son mode */
function hasActiveOptions(comptage: ComptageConfig): boolean {
  if (comptage.mode === 'en vrac') {
    return comptage.inputMethod !== '' ||
           comptage.guideQuantite ||
           comptage.saisieQuantite ||
           comptage.scannerUnitaire;
  } else if (comptage.mode === 'par article') {
    return comptage.guideQuantite ||
           comptage.isVariante ||
           comptage.guideArticle ||
           comptage.dlc ||
           comptage.numeroSerie ||
           comptage.numeroLot;
  } else if (comptage.mode === 'image de stock') {
    return false; // Aucune option pour "image de stock"
  }
  
  return false;
}

// Appel de l'annulation
function onCancelClick() {
  cancelEdit();
}
</script>