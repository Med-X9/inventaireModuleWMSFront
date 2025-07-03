// src/composables/useInventoryCreation.ts
import { ref, reactive, watch, onMounted } from 'vue';
import { indexedDBService } from '@/services/indexedDBService';
import { alertService } from '@/services/alertService';
import { inventoryCreationService } from '@/services/inventoryCreationService';
import type { InventoryCreationState, ComptageConfig } from '@/interfaces/inventoryCreation';
import { validateCreation } from '@/utils/validate';

export function useInventoryCreation() {
const currentStep = ref<number>(0);
const loaded = ref<boolean>(false);
const isValid = ref<boolean>(false);
const isSubmitting = ref<boolean>(false);

const state = reactive<InventoryCreationState>({
step1Data: {
libelle: '',
date: '',
type: 'Inventaire Général',
compte: '',
magasin: []
},
comptages: Array(3).fill(null).map<ComptageConfig>(() => ({
mode: '',
saisieQuantite: false,
scannerUnitaire: false,
guideQuantite: false,
isVariante: false,
guideArticle: false,
dlc: false,
numeroSerie: false,
numeroLot: false,
// Legacy props
useScanner: false,
useSaisie: false
})),
currentStep: 0,
});

function resetState() {
state.step1Data = {
libelle: '',
date: '',
type: 'Inventaire Général',
compte: '',
magasin: []
};
state.comptages.splice(0, state.comptages.length,
...Array(3).fill(null).map<ComptageConfig>(() => ({
mode: '',
saisieQuantite: false,
scannerUnitaire: false,
guideQuantite: false,
isVariante: false,
guideArticle: false,
dlc: false,
numeroSerie: false,
numeroLot: false,
// Legacy props
useScanner: false,
useSaisie: false
}))
);
currentStep.value = 0;
}

async function clearSavedState() {
await indexedDBService.clearState('creation');
}

function availableModesForStep(stepIndex: number) {
return inventoryCreationService.getAvailableModesForStep(state, stepIndex);
}

async function saveState() {
const snapshot = {
step1Data: state.step1Data,
comptages: state.comptages,
currentStep: currentStep.value,
};
await indexedDBService.saveState(JSON.parse(JSON.stringify(snapshot)), 'creation');
}

async function loadState() {
const saved = await indexedDBService.getState('creation');
if (saved) {
// Merge saved.step1Data into the reactive object to preserve defaults
Object.assign(state.step1Data, saved.step1Data);
state.comptages.splice(0, state.comptages.length, ...saved.comptages);
currentStep.value = saved.currentStep ?? 0;
}
loaded.value = true;
}

async function cancelCreation() {
const result = await alertService.confirm({
title: 'Annuler la création',
text: 'Voulez-vous vraiment annuler ?'
});
if (result.isConfirmed) {
await clearSavedState();
resetState();
// Removed automatic save after reset
}
}

async function validateCurrentStep(): Promise<boolean> {
const validation = validateCreation(state);
const { isValid: stepOk, errors } = getCurrentStepValidation(validation);
if (!stepOk) {
await alertService.error({
title: 'Validation',
text: errors.join('\n')
});
return false;
}
return true;
}

function getCurrentStepValidation(validation: ReturnType<typeof validateCreation>) {
if (currentStep.value === 0) {
return {
isValid: Object.keys(validation.step1Errors).length === 0,
errors: Object.values(validation.step1Errors)
};
} else {
const idx = currentStep.value - 1;
const err = validation.comptageResult.fieldErrors.mode[idx];
return {
isValid: !err,
errors: err ? [err] : []
};
}
}

async function onStepComplete(step: number, data: any): Promise<boolean> {
if (!await validateCurrentStep()) return false;

if (step === 0) {
state.step1Data = { ...data };
} else {
state.comptages[step - 1] = { ...data };
}

currentStep.value = step + 1;
// Removed automatic save after step completion
return true;
}

async function onComplete() {
if (!await validateCurrentStep()) return;
await clearSavedState();
resetState();
// Removed automatic save after completion
}

// Removed watchers that automatically save state
watch(state, () => {
const validation = validateCreation(state);
isValid.value = getCurrentStepValidation(validation).isValid;
// Removed automatic save on state change
}, { deep: true });

watch(currentStep, () => {
const validation = validateCreation(state);
isValid.value = getCurrentStepValidation(validation).isValid;
// Removed automatic save on step change
});

onMounted(loadState);

return {
state,
currentStep,
availableModesForStep,
onStepComplete,
onComplete,
cancelCreation,
loaded,
isValid,
isSubmitting,
resetState,
clearSavedState
};
}