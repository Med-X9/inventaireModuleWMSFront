<template>
  <div class="mx-auto h-full panel px-2 py-4">
    <FormWizard
      ref="wizard"
      @on-complete="onComplete"
      :beforeChange="beforeChange"
      :color="color"
      back-button-text="Précédent"
      next-button-text="Suivant"
      finish-button-text="Créer"
      class=" overflow-auto "
    >
      <TabContent
        v-for="(step, index) in steps"
        :key="index"
        :title="step.title"
        :custom-icon="step.icon"
        class="wizard-ste p-8"
      >
        <div class="shadow bg-[#f4f4f4af] dark:bg-white-dark/20 rounded-md space-y-3 cursor-move p-8">
          <h2 class="text-xl px-4 font-semibold text-gray-800 mb-6">{{ step.title }}</h2>
          <slot :name="`step-${index}`" />
        </div>
      </TabContent>
    </FormWizard>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { FormWizard, TabContent } from 'vue3-form-wizard';
import 'vue3-form-wizard/dist/style.css';

const props = defineProps<{
  steps: Array<{ title: string; icon?: string }>;
  color?: string;
  beforeChange?: () => boolean | Promise<boolean>;
}>();

const emit = defineEmits<{
  (e: 'complete'): void;
}>();

const wizard = ref<InstanceType<typeof FormWizard>>();

function onComplete() {
  emit('complete');
}
</script>

<style>




.step-slot {
  margin-top: 1.5rem;
}
</style>