<template>
  <DynamicWizard
    :steps="wizardSteps"
    color="#ffc107"
    @complete="onComplete"
  >
    <template #step-0>
      <FormBuilder
        :key="'step1'"
        class="form-builder !bg-transparent !shadow-none"
        :fields="formFields"
        :initialData="initialStep1Data"
        hide-submit
        @submit="onStep1"
      />
    </template>

    <template #step-1>
      <FormBuilder
        :key="'step2'"
        class="form-builder !bg-transparent !shadow-none"
        :fields="compteMagasinFields"
        :initialData="step2Data"
        hide-submit
        @submit="onStep2"
      />
    </template>

    <!-- Paramétrages dynamiques réutilisés via ParamStep -->
    <template v-for="(_, idx) in contages" :key="idx" v-slot:[`step-${idx+2}`]>
      <ParamStep v-model="contages[idx]" />
    </template>
  </DynamicWizard>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import DynamicWizard from '@/components/wizard/Wizard.vue'
import FormBuilder, { FieldConfig } from '@/components/Form/FormBuilder.vue'
import ParamStep from '@/components/ParamStep.vue'
import Swal from 'sweetalert2'

interface WizardStep { title: string; icon?: string }
interface Step1Data { libelle: string; date: string; type: string; reference: string }
interface Step2Data { compte: string; magasin: string }
interface ParamData {
  mode: string
  isVariant: boolean
  useScanner: boolean
  useSaisie: boolean
  useHybride: boolean
}

// 1. Wizard Steps
const wizardSteps: WizardStep[] = [
  { title: 'Création' },
  { title: 'Comptes & Magasin' },
  { title: 'Paramétrage 1/3' },
  { title: 'Paramétrage 2/3' },
  { title: 'Paramétrage 3/3' },
]

// 2. Étape 1
const autoReference = `REF-${Math.floor(1000 + Math.random() * 9000)}`
const formFields = reactive<FieldConfig[]>([
  { key: 'libelle', label: 'Libellé', type: 'text', props: { placeholder: 'Entrer le libellé' } },
  { key: 'date',    label: 'Date',     type: 'date' },
  { key: 'type',    label: 'Type',     type: 'select', options: ['Inventaire Général'], props: { disabled: true } }
])
const initialStep1Data = reactive<Partial<Step1Data>>({ reference: autoReference, type: 'Inventaire Général' })
const step1Data = ref<Partial<Step1Data>>({ ...initialStep1Data })
function onStep1(data: Partial<Step1Data>) {
  step1Data.value = data
}

// 3. Étape 2
const compteMagasinFields = reactive<FieldConfig[]>([
  { key: 'compte',  label: 'Compte',  type: 'select', options: ['Compte 1', 'Compte 2'], props: { placeholder: 'Sélectionner un compte' } },
  { key: 'magasin', label: 'Magasin', type: 'select', options: ['Magasin A', 'Magasin B'], props: { placeholder: 'Sélectionner un magasin' } }
])
const step2Data = ref<Partial<Step2Data>>({})
function onStep2(data: Partial<Step2Data>) {
  step2Data.value = data
}

// 4. Paramétrages dynamiques
const contages = reactive<ParamData[]>(Array.from({ length: 3 }, () => ({
  mode: '',
  isVariant: false,
  useScanner: false,
  useSaisie: false,
  useHybride: false
})))

// 5. Validation des données avant finalisation
const isFormValid = computed(() => {
  // Vérifie que tous les modes sont remplis
  return !contages.some(contage => contage.mode === '')
})

function onComplete() {
  if (!isFormValid.value) {
    Swal.fire({ icon: 'warning', text: 'Veuillez sélectionner un mode pour chaque paramétrage.' })
    return
  }

  console.log('✅ Données :', { creation: step1Data.value, comptes: step2Data.value, param: contages })

  // Simuler un appel API pour enregistrer les données
  saveInventory({ creation: step1Data.value, comptes: step2Data.value, param: contages })

  Swal.fire({
    icon: 'success',
    text: 'Votre inventaire a été créé avec succès.',
    padding: '2em',
    customClass: { popup: 'sweet-alerts' }
  })
}

// 6. Fonction pour simuler l'enregistrement des données (API call)
function saveInventory(data: any) {
  // Simuler une API de sauvegarde
  setTimeout(() => {
    console.log('Données enregistrées :', data)
  }, 1000)
  console.log('Données de création:', JSON.stringify(step1Data.value, null, 2))
console.log('Données des comptes:', JSON.stringify(step2Data.value, null, 2))
console.log('Paramètres:', JSON.stringify(contages, null, 2))

}
</script>
