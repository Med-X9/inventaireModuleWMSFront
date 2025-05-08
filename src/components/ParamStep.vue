<template>
  <div>
    <FormBuilder
      :modelValue="local"
      :fields="formFields"
      :columns="1"
      hide-submit
      @update:modelValue="onFormBuilderUpdate"
      @validation-change="onValidationChange"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, computed } from 'vue';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import type { ContageConfig } from '@/interfaces/inventoryCreation';
import type { FieldConfig } from '@/interfaces/form';
import { required, selectRequired } from '@/utils/validate';

const props = defineProps<{
  modelValue: ContageConfig;
  stepIndex: number;
  availableModes: string[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', data: ContageConfig): void;
  (e: 'validation-change', isValid: boolean): void;
}>();

// Local reactive copy
const local = reactive<ContageConfig>({ ...props.modelValue });

// Computed fields configuration
const formFields = computed<FieldConfig[]>(() => {
  const fields: FieldConfig[] = [
    {
      key: 'mode',
      label: 'Mode de contage',
      type: 'select',
      options: props.availableModes.map(m => ({ label: m, value: m })),
      validators: [{ key: 'mode', ...selectRequired('Mode de contage requis') }]
    }
  ];

  switch (local.mode) {
    case 'liste emplacement':
      fields.push(
        {
          key: 'inputMethod',
          label: 'Méthode de saisie',
          type: 'radio',
          options: [
            { label: 'Scanner', value: 'scanner' },
            { label: 'Saisie manuelle', value: 'manual' }
          ],
          validators: [{ key: 'inputMethod', ...selectRequired('Méthode de saisie requise') }]
        }
      );
      break;

    case 'article + emplacement':
    case 'hybride':
      fields.push(
        { key: 'isVariant', label: 'Variantes', type: 'checkbox' }
      );
      break;

    // 'etat de stock' → pas d'options supplémentaires
  }

  return fields;
});

// Handle updates from FormBuilder
function onFormBuilderUpdate(data: Record<string, unknown>) {
  const merged = { ...local, ...(data as Partial<ContageConfig>) };

  // Reset fields based on mode
  if (merged.mode === 'etat de stock') {
    merged.isVariant = false;
    merged.useScanner = false;
    merged.useSaisie = false;
  }
  else if (merged.mode === 'liste emplacement') {
    // Convert inputMethod to useScanner/useSaisie flags
    if (merged.inputMethod === 'scanner') {
      merged.useScanner = true;
      merged.useSaisie = false;
    } else if (merged.inputMethod === 'manual') {
      merged.useScanner = false;
      merged.useSaisie = true;
    }
    merged.isVariant = false;
  }
  else if (merged.mode === 'article + emplacement' || merged.mode === 'hybride') {
    merged.useScanner = false;
    merged.useSaisie = false;
    // isVariant handled by checkbox
  }

  Object.assign(local, merged);
  emit('update:modelValue', { ...merged });
}

// Propagate validation state
function onValidationChange(isValid: boolean) {
  emit('validation-change', isValid);
}

// Keep local in sync if parent modelValue changes
watch(
  () => props.modelValue,
  val => Object.assign(local, val),
  { deep: true }
);
</script>