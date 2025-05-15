import { ref, reactive, watch, onMounted } from 'vue';
import { indexedDBService } from '@/services/indexedDBService';
import { alertService } from '@/services/alertService';
import { inventoryCreationService } from '@/services/inventoryCreationService';
import type { InventoryCreationState, ContageConfig } from '@/interfaces/inventoryCreation';
import { validateCreation } from '@/utils/validate';

export function useInventoryCreation() {
  const currentStep = ref<number>(0);
  const loaded = ref<boolean>(false);
  const isValid = ref<boolean>(false);
  const isSubmitting = ref<boolean>(false);

  const state = reactive<InventoryCreationState>({
    step1Data: { libelle: '', date: '', type: 'Inventaire Général' },
    step2Data: { compte: '', magasin: [] },
    contages: Array(3).fill(null).map<ContageConfig>(() => ({
      mode: '', isVariant: false, useScanner: false, useSaisie: false
    })),
    currentStep: 0,
  });

  function resetState() {
    state.step1Data = { libelle: '', date: '', type: 'Inventaire Général' };
    state.step2Data = { compte: '', magasin: [] };
    state.contages.splice(0, state.contages.length,
      ...Array(3).fill(null).map<ContageConfig>(() => ({
        mode: '', isVariant: false, useScanner: false, useSaisie: false
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
      step2Data: state.step2Data,
      contages: state.contages,
      currentStep: currentStep.value,
    };
    await indexedDBService.saveState(JSON.parse(JSON.stringify(snapshot)), 'creation');
  }

  async function loadState() {
    const saved = await indexedDBService.getState('creation');
    if (saved) {
      state.step1Data = saved.step1Data;
      state.step2Data = saved.step2Data;
      state.contages.splice(0, state.contages.length, ...saved.contages);
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
      await saveState();
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
    } else if (currentStep.value === 1) {
      return {
        isValid: Object.keys(validation.step2Errors).length === 0,
        errors: Object.values(validation.step2Errors)
      };
    } else {
      const idx = currentStep.value - 2;
      const err = validation.contageResult.fieldErrors.mode[idx];
      return {
        isValid: !err,
        errors: err ? [err] : []
      };
    }
  }

  async function onStepComplete(step: number, data: any): Promise<boolean> {
    if (!await validateCurrentStep()) return false;

    if (step === 0)       state.step1Data = { ...data };
    else if (step === 1)  state.step2Data = { ...data };
    else                  state.contages[step - 2] = { ...data };

    currentStep.value = step + 1;
    await saveState();
    return true;
  }

  /** Ce qui se passe à la toute fin du wizard */
  async function onComplete() {
    if (!await validateCurrentStep()) return;
    // 1. Vider le state dans IndexedDB
    await clearSavedState();
    // 2. Réinitialiser le state en mémoire
    resetState();
    await saveState();
    // 3. currentStep reste à 0 pour un prochain lancement
  }

  watch(state, () => {
    const validation = validateCreation(state);
    isValid.value = getCurrentStepValidation(validation).isValid;
    saveState();
  }, { deep: true });

  watch(currentStep, () => {
    const validation = validateCreation(state);
    isValid.value = getCurrentStepValidation(validation).isValid;
    saveState();
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
