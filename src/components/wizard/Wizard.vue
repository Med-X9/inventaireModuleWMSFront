<template>
  <div class="max-w-6xl mx-auto px-4 py-10">
    <FormWizard
      ref="wizard"
      @on-complete="onComplete"
      :beforeChange="beforeChange"
      :color="color"
      back-button-text="Précédent"
      next-button-text="Suivant"
      finish-button-text="crée"
      class="shadow-sm rounded-lg"
    >
      <TabContent
        v-for="(step, index) in steps"
        :key="index"
        :title="step.title"
        :custom-icon="step.icon"
        class="mt-12"
      >
        <div class="bg-white rounded-lg p-10 border border-gray-200">
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

<style scoped>
</style>
