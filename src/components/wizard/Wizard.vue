<template>
  <div class="mx-auto h-full panel px-6 py-6">
    <FormWizard
      ref="wizard"
      :startIndex="internalStep"
      @on-change="onChange"
      @on-complete="onComplete"
      :beforeChange="beforeChange"
      :color="color"
      back-button-text="Précédent"
      next-button-text="Suivant"
      finish-button-text="Créer"
    >
      <!-- Slot pour personnaliser le bouton Finish -->
      <template #finish="{ nextTab, isLastStep, fillButtonStyle }">
        <SubmitButton
          type="button"
          :loading="isSubmitting"
          :disabled="!canFinish"
          :style="fillButtonStyle"
          :label="isLastStep ? 'Créer' : 'Suivant'"
          @click="handleFinish(nextTab, isLastStep)"
        />
      </template>

      <TabContent
        v-for="(step, idx) in steps"
        :key="idx"
        :title="step.title"
        :custom-icon="step.icon"
        class="wizard-step p-8"
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

const isSubmitting = ref(false);

// Exemple de validation globale avant passage d'étape
const canFinish = computed(() => {
  if (isSubmitting.value) return false;
  // TODO : votre logique métier de validation de l'étape courante
  return true;
});

const internalStep = computed(() => props.currentStep ?? 0);

function onChange(prev: number, next: number) {
  emit('update:current-step', next);
}

function onComplete() {
  emit('complete');
}

async function handleFinish(nextTab: () => void, isLast: boolean) {
  if (!canFinish.value) return;
  isSubmitting.value = true;
  try {
    if (isLast) {
      // applez votre API ou logique de création ici
      await Promise.resolve();
      onComplete();
    } else {
      nextTab();
    }
  } finally {
    isSubmitting.value = false;
  }
}

async function beforeChange(prev: number, next: number): Promise<boolean> {
  if (props.beforeChange) {
    return await props.beforeChange(prev, next);
  }
  return true;
}
</script>
