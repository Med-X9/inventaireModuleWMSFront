<template>
  <div class="px-4">
    <FormBuilder
      :modelValue="local"
      :fields="formFields"
      :columns="1"
      hide-submit
      @update:modelValue="onFormBuilderUpdate"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, computed } from 'vue';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import type { ContageConfig } from '@/interfaces/inventoryCreation';
import type { FieldConfig } from '@/interfaces/form';

const props = defineProps<{
  modelValue: ContageConfig;
  stepIndex: number;
  availableModes: string[];
}>();

// Émission vers le parent de ParamStep
const emit = defineEmits<{
  (e: 'update:modelValue', data: ContageConfig): void;
}>();

// Copie locale réactive
const local = reactive<ContageConfig>({ ...props.modelValue });

// Champs dynamiques
const formFields = computed<FieldConfig[]>(() => [
  {
    key: 'mode',
    label: 'Mode de contage',
    type: 'select',
    options: props.availableModes.map(m => ({ label: m, value: m })),
  },
  ...((local.mode && local.mode !== 'etat de stock') ? getAdditionalFields() : []),
]);

function getAdditionalFields(): FieldConfig[] {
  const list: FieldConfig[] = [];
  if (local.mode === 'liste emplacement') {
    list.push({
      key: 'inputMethod',
      label: 'Méthode de saisie',
      type: 'radio',
      options: [
        { label: 'Scanner', value: 'scanner' },
        { label: 'Saisie manuelle', value: 'manual' },
      ],
    });
  }
  if (['article + emplacement', 'hybride'].includes(local.mode)) {
    list.push({ key: 'isVariant', label: 'Variantes', type: 'checkbox' });
  }
  return list;
}

// Handler pour l'update depuis FormBuilder
function onFormBuilderUpdate(data: Record<string, unknown>) {
  // On merge la mise à jour
  const merged = { ...local, ...(data as Partial<ContageConfig>) };

  // Réajustements selon mode
  if (merged.mode === 'etat de stock') {
    merged.isVariant = false; merged.useScanner = false; merged.useSaisie = false;
  }
  if (merged.inputMethod === 'scanner') {
    merged.useScanner = true; merged.useSaisie = false;
  }
  if (merged.inputMethod === 'manual') {
    merged.useScanner = false; merged.useSaisie = true;
  }

  // Met à jour local et émet vers parent
  Object.assign(local, merged);
  emit('update:modelValue', merged as ContageConfig);
}

// Mise à jour locale si parent change modelValue
watch(
  () => props.modelValue,
  val => Object.assign(local, val),
  { deep: true }
);
</script>