<template>
  <div class="mx-auto h-full panel px-6 py-6">
    <FormWizard
      ref="wizard"
      :startIndex="internalStep"
      @on-change="onChange"
      @on-complete="onComplete"
      :beforeChange="validateCurrentStep"
      :color="color"
      back-button-text="Précédent"
      next-button-text="Suivant"
      finish-button-text="Créer"
    >
      <!-- Slot Finish personnalisé -->
      <template #finish="{ nextTab, isLastStep, fillButtonStyle }">
        <SubmitButton
          type="button"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          :style="fillButtonStyle"
          :label="isLastStep ? 'Créer' : 'Suivant'"
          @click="handleFinish(nextTab, isLastStep)"
        />
      </template>

      <!-- Contenu des étapes -->
      <TabContent
        v-for="(step, idx) in steps"
        :key="idx"
        :title="step.title"
        :custom-icon="step.icon"
        class="wizard-step px-6 py-3"
      >
        <div class="shadow bg-gray-50 dark:bg-white-dark/10 rounded-md space-y-3 p-10">
          <h2 class="text-xl px-4 font-semibold text-gray-800 mb-6">{{ step.title }}</h2>
          <slot :name="`step-${idx}`" />
        </div>
      </TabContent>
    </FormWizard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { FormWizard, TabContent } from 'vue3-form-wizard';
import SubmitButton from '@/components/Form/SubmitButton.vue';
import 'vue3-form-wizard/dist/style.css';

type Step = { title: string; icon?: string };

const props = defineProps<{
  steps: Step[];
  color?: string;
  beforeChange?: (prev: number, next: number) => boolean | Promise<boolean>;
  currentStep?: number;
}>();
const emit = defineEmits<{
  (e: 'complete'): void;
  (e: 'update:current-step', step: number): void;
}>();

// Références
const wizard = ref<InstanceType<typeof FormWizard> | null>(null);
const isSubmitting = ref(false);

// Synchronisation de l’étape
const internalStep = computed(() => props.currentStep ?? 0);

// Emission on-change
function onChange(prev: number, next: number) {
  emit('update:current-step', next);
}

// Finale
function onComplete() {
  emit('complete');
}

// Validation avant chaque changement d’onglet
async function validateCurrentStep(prev: number, next: number): Promise<boolean> {
  // trouve le FormBuilder dans la slot step prev
  const formBuilder = wizard.value
    ? (wizard.value.$el.querySelector(`[slot="step-${prev}"] form-builder`)?.__vueParentComponent?.proxy)
    : null;
  if (formBuilder?.validate) {
    return formBuilder.validate();
  }
  return true;
}

// Clic sur “Suivant” ou “Créer”
async function handleFinish(nextTab: () => void, isLast: boolean) {
  // validation finale
  const formBuilder = wizard.value
    ? (wizard.value.$el.querySelector(`[slot="step-${internalStep.value}"] form-builder`)?.__vueParentComponent?.proxy)
    : null;
  if (formBuilder?.validate && !formBuilder.validate()) {
    return;
  }

  isSubmitting.value = true;
  if (isLast) {
    await Promise.resolve(); // appel API
    onComplete();
  } else {
    nextTab();
  }
  setTimeout(() => { isSubmitting.value = false; }, 3000);
}
</script>
