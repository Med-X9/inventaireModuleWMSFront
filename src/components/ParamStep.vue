<template>
  <div>
    <FormBuilder
      :modelValue="local"
      :fields="formFields"
      :columns="local.mode === 'en vrague par article' ? 3 : 1"
      hide-submit
      @update:modelValue="onFormBuilderUpdate"
      @validation-change="onValidationChange"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, computed } from 'vue';
import FormBuilder from '@/components/Form/FormBuilder.vue';
import type { ComptageConfig } from '@/interfaces/inventoryCreation';
import type { FieldConfig } from '@/interfaces/form';
import { selectRequired } from '@/utils/validate';
import { inventoryCreationService } from '@/services/inventoryCreationService';

const props = defineProps<{
  modelValue: ComptageConfig;
  stepIndex: number;
  availableModes: string[];
  prevComptages: ComptageConfig[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', data: ComptageConfig): void;
  (e: 'validation-change', isValid: boolean): void;
}>();

// copie locale pour réactivité
const local = reactive<ComptageConfig>({ ...props.modelValue });

// Construction du schéma de champs
const formFields = computed<FieldConfig[]>(() => {
  const fields: FieldConfig[] = [
    {
      key: 'mode',
      label: 'Mode de comptage',
      type: 'select',
      options: props.availableModes.map(m => ({ label: m, value: m })),
      validators: [{ key: 'mode', ...selectRequired('Mode de comptage requis') }]
    }
  ];

  const options = inventoryCreationService.getOptionsForMode(local.mode);

  // si "en vrague"
  if (options.hasEnVragueOptions) {
    let radioOptions = [
      { label: 'Saisie quantité', value: 'saisie' },
      { label: 'Scanner unitaire', value: 'scanner' }
    ];

    if (props.stepIndex === 2) {
      const constraints = inventoryCreationService.getComptage3Constraints({
        step1Data: {} as any,
        comptages: props.prevComptages.slice(0, 2).concat([local]),
        currentStep: 0
      });

      if (constraints.restrictedToSaisie) {
        radioOptions = [{ label: 'Saisie quantité', value: 'saisie' }];
        local.inputMethod = 'saisie';
      } else if (constraints.restrictedToScanner) {
        radioOptions = [{ label: 'Scanner unitaire', value: 'scanner' }];
        local.inputMethod = 'scanner';
      }
    }

    fields.push(
      {
        key: 'inputMethod',
        label: 'Méthode opératoire',
        type: 'radio-group',
        radioOptions
      },
      {
        key: 'guideQuantite',
        label: 'Guide quantité',
        type: 'checkbox'
      }
    );
  }

  // si "en vrague par article" on ajoute les 6 cases
  if (options.hasEnVragueParArticleOptions) {
    fields.push(
      { key: 'isVariante',            label: 'Is variante',              type: 'checkbox' },
      { key: 'guideQuantite',         label: 'Guide quantité',            type: 'checkbox' },
      { key: 'guideArticle',          label: 'Guide Article',             type: 'checkbox' },
      { key: 'dlc',                   label: 'DLC',                       type: 'checkbox' },
      { key: 'guideArticleQuantite',  label: 'Guide Article quantité',    type: 'checkbox' },
      { key: 'numeroLot',             label: 'Numéro de lot',             type: 'checkbox' }
    );
  }

  // héritage pour comptage 3
  if (props.stepIndex === 2) {
    const inheritedOptions = inventoryCreationService.getInheritedOptionsForComptage3({
      step1Data: {} as any,
      comptages: props.prevComptages.slice(0, 2).concat([local]),
      currentStep: 0
    });
    Object.assign(local, inheritedOptions);
  }

  return fields;
});

// Quand le FormBuilder émet un update, on nettoie et on propage
function onFormBuilderUpdate(data: Record<string, unknown>) {
  const merged = { ...local, ...(data as Partial<ComptageConfig>) };

  // nettoyage selon le mode sélectionné
  if (merged.mode === 'image de stock') {
    merged.inputMethod = '';
    merged.guideQuantite = false;
    merged.isVariante = false;
    merged.guideArticle = false;
    merged.dlc = false;
    merged.guideArticleQuantite = false;
    merged.numeroLot = false;
    merged.saisieQuantite = false;
    merged.scannerUnitaire = false;
  } else if (merged.mode === 'en vrague') {
    merged.isVariante = false;
    merged.guideArticle = false;
    merged.dlc = false;
    merged.guideArticleQuantite = false;
    merged.numeroLot = false;
    merged.saisieQuantite = merged.inputMethod === 'saisie';
    merged.scannerUnitaire = merged.inputMethod === 'scanner';
  } else if (merged.mode === 'en vrague par article') {
    merged.inputMethod = '';
    merged.saisieQuantite = false;
    merged.scannerUnitaire = false;
  }

  Object.assign(local, merged);
  emit('update:modelValue', { ...merged });
}

// Propagation de la validation
function onValidationChange(isValid: boolean) {
  emit('validation-change', isValid);
}

// Si la prop modelValue change à l'extérieur, on met à jour local
watch(() => props.modelValue, val => Object.assign(local, val), { deep: true });
</script>
