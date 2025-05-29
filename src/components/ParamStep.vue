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
import { selectRequired } from '@/utils/validate';
import { inventoryCreationService } from '@/services/inventoryCreationService';

const props = defineProps<{ 
  modelValue: ContageConfig;
  stepIndex: number;
  availableModes: string[];
  prevContages: ContageConfig[];
}>();

const emit = defineEmits<{ 
  (e: 'update:modelValue', data: ContageConfig): void;
  (e: 'validation-change', isValid: boolean): void;
}>();

// copie locale reactive
const local = reactive<ContageConfig>({ ...props.modelValue });



// configuration des champs
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

  const options = inventoryCreationService.getOptionsForMode(local.mode);

  // Cas spécial Contage 3 avec liste emplacement
  if (props.stepIndex === 2 && local.mode === 'liste emplacement') {
    const methods = props.prevContages.slice(0, 2)
      .map(c => c.inputMethod)
      .filter((m): m is 'scanner' | 'manual' => !!m) as Array<'scanner' | 'manual'>;
    const unique = Array.from(new Set(methods)) as Array<'scanner' | 'manual'>;
    const radioOpts = unique.map(m => ({ label: m === 'scanner' ? 'Scanner' : 'Saisie manuelle', value: m }));

    // Default auto-selection à la première option si non défini
    if (!local.inputMethod && radioOpts.length) {
      local.inputMethod = radioOpts[0].value;
    }

    fields.push({
      key: 'inputMethod',
      label: 'Méthode de saisie',
      type: 'radio',
      options: radioOpts,
      validators: [{ key: 'inputMethod', ...selectRequired('Méthode de saisie requise') }]
    });
    return fields;
  }

  // Option radio Scanner / Saisie manuelle
  if (options.hasScanner) {
    const radioOptions: Array<{ label: string; value: 'scanner' | 'manual' }> = [
      { label: 'Scanner', value: 'scanner' },
      { label: 'Saisie manuelle', value: 'manual' }
    ];
    // Default auto-selection
    if (!local.inputMethod) {
      local.inputMethod = radioOptions[0].value;
    }
    fields.push({
      key: 'inputMethod',
      label: 'Méthode de saisie',
      type: 'radio',
      options: radioOptions,
      validators: [{ key: 'inputMethod', ...selectRequired('Méthode de saisie requise') }]
    });
  }

  if (options.hasVariant) {
    fields.push({ key: 'isVariant', label: 'Variantes', type: 'checkbox' });
  }
  if (options.hasQuantite) {
    fields.push({ key: 'quantite', label: 'Quantité', type: 'checkbox' });
  }

  return fields;
});

function onFormBuilderUpdate(data: Record<string, unknown>) {
  const merged = { ...local, ...(data as Partial<ContageConfig>) };
  // Reset selon mode
  if (merged.mode === 'etat de stock') {
    merged.isVariant = false;
    merged.useScanner = false;
    merged.useSaisie = false;
    merged.quantite = false;
  } else if (merged.mode === 'liste emplacement') {
    merged.useScanner = merged.inputMethod === 'scanner';
    merged.useSaisie = merged.inputMethod === 'manual';
    merged.isVariant = false;
    merged.quantite = false;
  } else if (merged.mode === 'article + emplacement') {
    merged.useScanner = false;
    merged.useSaisie = false;
  } else if (merged.mode === 'hybride') {
    merged.useScanner = false;
    merged.useSaisie = false;
    merged.quantite = false;
  }
  Object.assign(local, merged);
  emit('update:modelValue', { ...merged });
}

function onValidationChange(isValid: boolean) {
  emit('validation-change', isValid);
}

watch(() => props.modelValue, val => Object.assign(local, val), { deep: true });
</script>