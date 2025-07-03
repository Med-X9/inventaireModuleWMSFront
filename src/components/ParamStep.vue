<template>
  <div>
    <!-- Mode de comptage avec FormBuilder -->
    <div class="mb-6">
      <FormBuilder
        :modelValue="{ mode: local.mode }"
        :fields="modeFields"
        :columns="1"
        hide-submit
        @update:modelValue="onModeChange"
        @validation-change="onValidationChange"
      />
    </div>

    <!-- Options avec FormBuilder -->
    <div v-if="availableFields.length > 0">
      <FormBuilder
        :modelValue="getFieldValues()"
        :fields="availableFields"
        :columns="1"
        hide-submit
        @update:modelValue="onOptionsChange"
      />
    </div>
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

const local = reactive<ComptageConfig>({ ...props.modelValue });

// Définition des tooltips pour chaque mode de comptage
const modeTooltips: Record<string, string> = {
  'image de stock': 'Mode basé sur une photo de référence du stock existant',
  'en vrac': 'Comptage par quantité globale sans détail par article',
  'par article': 'Comptage détaillé article par article avec toutes les options'
};

// Définition des tooltips pour chaque option
const tooltips: Record<string, string> = {
  guideQuantite: 'Affichage d\'un guide pour faciliter la saisie des quantités',
  isVariante: 'Gestion des variantes de produits (taille, couleur, etc.)',
  guideArticle: 'Affichage d\'un guide pour faciliter l\'identification des articles',
  dlc: 'Gestion des dates limites de consommation des produits',
  numeroSerie: 'Gestion des numéros de série pour la traçabilité des produits',
  numeroLot: 'Gestion des numéros de lot pour la traçabilité des produits'
};

// Tooltips spécifiques pour les options radio
const radioTooltips: Record<string, string> = {
  saisie: 'Saisie manuelle des quantités avec le clavier',
  scanner: 'Utilisation du scanner pour saisir les quantités automatiquement'
};

// Champs pour le mode de comptage avec options enrichies de tooltips
const modeFields = computed<FieldConfig[]>(() => [
  {
    key: 'mode',
    label: 'Mode de comptage',
    type: 'select',
    options: props.availableModes.map(m => ({ 
      label: m, 
      value: m,
      tooltip: modeTooltips[m] || ''
    })),
    validators: [{ key: 'mode', ...selectRequired('Mode de comptage requis') }]
  }
]);

// Calculer les options disponibles selon le mode
const options = computed(() => inventoryCreationService.getOptionsForMode(local.mode));

// Calculer les champs disponibles pour les options
const availableFields = computed<FieldConfig[]>(() => {
  const fields: FieldConfig[] = [];

  if (options.value.hasEnVracOptions) {
    // Options radio pour "en vrac"
    const radioOptions = getRadioOptions();
    
    fields.push({
      key: 'inputMethod',
      label: 'Méthode opératoire',
      type: 'radio-group',
      radioOptions: radioOptions.map(opt => ({
        label: opt.label,
        value: opt.value,
        tooltip: radioTooltips[opt.value] || ''
      })),
      validators: []
    });

    // Guide quantité pour "en vrac"
    fields.push({
      key: 'guideQuantite',
      label: 'Guide quantité',
      type: 'checkbox',
      tooltip: tooltips.guideQuantite,
      validators: []
    });
  }

  if (options.value.hasParArticleOptions) {
    // Options pour "par article"
    fields.push(
      {
        key: 'guideQuantite',
        label: 'Guide quantité',
        type: 'checkbox',
        tooltip: tooltips.guideQuantite,
        validators: []
      },
      {
        key: 'guideArticle',
        label: 'Guide Article',
        type: 'checkbox',
        tooltip: tooltips.guideArticle,
        validators: []
      },
      {
        key: 'isVariante',
        label: 'Variante',
        type: 'checkbox',
        tooltip: tooltips.isVariante,
        validators: []
      },
      {
        key: 'dlc',
        label: 'DLC',
        type: 'checkbox',
        tooltip: tooltips.dlc,
        props: { disabled: local.numeroSerie },
        validators: []
      },
      {
        key: 'numeroSerie',
        label: 'Numéro de série',
        type: 'checkbox',
        tooltip: tooltips.numeroSerie,
        props: { disabled: local.dlc || local.numeroLot },
        validators: []
      },
      {
        key: 'numeroLot',
        label: 'Numéro de lot',
        type: 'checkbox',
        tooltip: tooltips.numeroLot,
        props: { disabled: local.numeroSerie },
        validators: []
      }
    );
  }

  return fields;
});

// Obtenir les options radio pour la méthode opératoire
function getRadioOptions() {
  let options = [
    { label: 'Saisie quantité', value: 'saisie' },
    { label: 'Scanner unitaire', value: 'scanner' }
  ];

  if (props.stepIndex === 2) {
    const constraints = inventoryCreationService.getComptage3Constraints({
      step1Data: {} as any,
      comptages: props.prevComptages.slice(0, 2).concat([local]),
      currentStep: 0
    });

    // Appliquer les contraintes
    if (constraints.restrictedToSaisie) {
      options = [{ label: 'Saisie quantité', value: 'saisie' }];
      if (local.inputMethod !== 'saisie') {
        local.inputMethod = 'saisie';
        syncLegacyOptions();
      }
    } else if (constraints.restrictedToScanner) {
      options = [{ label: 'Scanner unitaire', value: 'scanner' }];
      if (local.inputMethod !== 'scanner') {
        local.inputMethod = 'scanner';
        syncLegacyOptions();
      }
    }
  }

  return options;
}

// Fonction pour synchroniser les propriétés legacy avec inputMethod
function syncLegacyOptions() {
  if (local.mode === 'en vrac') {
    local.saisieQuantite = local.inputMethod === 'saisie';
    local.scannerUnitaire = local.inputMethod === 'scanner';
  } else {
    // Pour les autres modes, reset les options "en vrac"
    local.saisieQuantite = false;
    local.scannerUnitaire = false;
    local.inputMethod = '';
  }
}

// Obtenir les valeurs actuelles pour les champs
function getFieldValues() {
  const values: Record<string, unknown> = {};
  availableFields.value.forEach(field => {
    values[field.key] = local[field.key as keyof ComptageConfig];
  });
  return values;
}

function onModeChange(data: Record<string, unknown>) {
  const newMode = data.mode as string;
  
  // Reset toutes les options selon le mode sélectionné
  if (newMode === 'image de stock') {
    // Aucune option pour "image de stock"
    resetAllOptions();
  } else if (newMode === 'en vrac') {
    // Reset options "par article"
    local.isVariante = false;
    local.guideArticle = false;
    local.dlc = false;
    local.numeroSerie = false;
    local.numeroLot = false;
    
    // Valeur par défaut pour "en vrac" si pas encore définie
    if (!local.inputMethod) {
      local.inputMethod = 'scanner';
    }
    syncLegacyOptions();
  } else if (newMode === 'par article') {
    // Reset options "en vrac"
    local.inputMethod = '';
    local.saisieQuantite = false;
    local.scannerUnitaire = false;
  }

  // Assigner le nouveau mode
  local.mode = newMode as any;
  
  // Pour Comptage 3, hériter des options des comptages précédents si nécessaire
  if (props.stepIndex === 2) {
    const inheritedOptions = inventoryCreationService.getInheritedOptionsForComptage3({
      step1Data: {} as any,
      comptages: props.prevComptages.slice(0, 2).concat([local]),
      currentStep: 0
    });

    // Appliquer les options héritées
    Object.assign(local, inheritedOptions);
    syncLegacyOptions();
  }

  emit('update:modelValue', { ...local });
}

function resetAllOptions() {
  local.inputMethod = '';
  local.guideQuantite = false;
  local.isVariante = false;
  local.guideArticle = false;
  local.dlc = false;
  local.numeroSerie = false;
  local.numeroLot = false;
  local.saisieQuantite = false;
  local.scannerUnitaire = false;
}

function onOptionsChange(data: Record<string, unknown>) {
  // Mise à jour des options
  Object.assign(local, data);

  // Logique de désactivation pour "par article"
  if (local.mode === 'par article') {
    if (data.numeroSerie && local.numeroSerie) {
      // Si numéro de série est coché, désactiver DLC et numéro de lot
      local.dlc = false;
      local.numeroLot = false;
    } else if ((data.dlc && local.dlc) || (data.numeroLot && local.numeroLot)) {
      // Si DLC ou numéro de lot est coché, désactiver numéro de série
      local.numeroSerie = false;
    }
  }

  // Synchroniser les propriétés legacy
  syncLegacyOptions();

  emit('update:modelValue', { ...local });
}

function onValidationChange(isValid: boolean) {
  emit('validation-change', isValid);
}

// Watch pour synchroniser avec les props
watch(() => props.modelValue, val => {
  Object.assign(local, val);
  
  // Valeur par défaut pour "en vrac" si pas encore définie
  if (local.mode === 'en vrac' && !local.inputMethod) {
    local.inputMethod = 'scanner';
    syncLegacyOptions();
    emit('update:modelValue', { ...local });
  }
}, { deep: true, immediate: true });

// Watch pour synchroniser inputMethod avec les legacy props
watch(() => local.inputMethod, () => {
  syncLegacyOptions();
});
</script>