<template>
  <div class="mx-auto h-full panel px-6 py-4">
    <FormWizard
      ref="wizard"
      :startIndex="internalStep"
      @on-change="onChange"
      @on-complete="handleFinishWizard"
      :before-change="beforeChange"
      :color="color"
      back-button-text="Précédent"
      next-button-text="Suivant"
      class="circle"
      :finish-button-text="props.finishButtonText || 'Créer'"
    >
      <!-- Bouton Suivant -->
      <template #next="{ nextTab, fillButtonStyle }">
        <SubmitButton
          type="button"
          :loading="isSubmitting"
          :disabled="!props.isValid || isSubmitting"
          :style="fillButtonStyle"
          label="Suivant"
          @click.stop="handleNext(nextTab)"
        />
      </template>

      <!-- Bouton Créer -->
      <template #finish="{ finishWizard, fillButtonStyle }">
        <SubmitButton
          type="button"
          :loading="isSubmitting"
          :disabled="!props.isValid || isSubmitting"
          :style="fillButtonStyle"
          :label="props.finishButtonText || 'Créer'"
          @click.stop="handleFinish(finishWizard)"
        />
      </template>

      <!-- Contenu dynamique des étapes -->
      <TabContent
        v-for="(step, idx) in steps"
        :key="idx"
        :title="step.title"
        :custom-icon="step.icon"
        class="wizard-step md:px-6 py-1"
      >
        <div class="shadow bg-gray-50 dark:bg-[#0e1726]  rounded-md space-y-3 p-10">
          <h2 class="text-xl px-4 font-semibold dark:text-white-light  text-gray-800 mb-6">
            {{ step.title }}
          </h2>
          <slot :name="`step-${idx}`" />
        </div>
      </TabContent>
    </FormWizard>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, toRefs } from 'vue';
import { FormWizard, TabContent } from 'vue3-form-wizard';
import SubmitButton from '@/components/Form/SubmitButton.vue';
import type { Step } from '@/interfaces/wizard';
import 'vue3-form-wizard/dist/style.css';

const props = defineProps<{
  steps: Step[];
  color?: string;
  currentStep?: number;
  isValid: boolean;
  beforeChange: (prev: number, next: number) => boolean | Promise<boolean>;
  finishButtonText?: string;
}>();

const emit = defineEmits<{
  (e: 'complete'): void;
  (e: 'update:current-step', step: number): void;
}>();

const { beforeChange } = toRefs(props);
const wizard = ref<InstanceType<typeof FormWizard> | null>(null);
// État de soumission pour bloquer le bouton
const isSubmitting = ref(false);

const internalStep = computed(() => props.currentStep ?? 0);

function onChange(prev: number, next: number) {
  emit('update:current-step', next);
}

async function handleNext(nextTab: () => void) {
  const allow = await beforeChange.value!(internalStep.value, internalStep.value + 1);
  if (!allow) return;
  isSubmitting.value = true;
  nextTab();
  // reset de isSubmitting dans on-change ou on-complete
}

async function handleFinish(finishWizard: () => void) {
  const allow = await beforeChange.value!(internalStep.value, internalStep.value + 1);
  if (!allow) return;
  isSubmitting.value = true;
  finishWizard();
  // on-complete du FormWizard déclenche handleFinishWizard
}

// Réinitialise isSubmitting quand le wizard signale la complétion
function handleFinishWizard() {
  isSubmitting.value = false;
  emit('complete');
}
</script>

<style scoped>
/* Vos styles ici */
</style>