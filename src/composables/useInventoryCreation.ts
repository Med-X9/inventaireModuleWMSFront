// src/composables/useInventoryCreation.ts
import { ref, reactive, watch, onMounted } from 'vue';
import type { InventoryCreationState, ContageConfig } from '@/interfaces/inventoryCreation';
import { indexedDBService } from '@/services/indexedDBService';
import { alertService } from '@/services/alertService';
import { inventoryCreationService } from '@/services/inventoryCreationService';

export function useInventoryCreation() {
  const currentStep = ref<number>(0);
  const loaded = ref<boolean>(false);

  const state = reactive<InventoryCreationState>({
    step1Data: { libelle: '', date: '', type: 'Inventaire Général' },
    step2Data: { compte: '', magasin: [] },
    contages: Array(3).fill(null).map<ContageConfig>(() => ({
      mode: '',
      isVariant: false,
      useScanner: false,
      useSaisie: false,
    })),
    currentStep: 0,
  });

  function availableModesForStep(stepIndex: number) {
    return inventoryCreationService.getAvailableModesForStep(state, stepIndex);
  }

  async function saveState() {
    try {
      const snapshot = {
        step1Data: state.step1Data,
        step2Data: state.step2Data,
        contages: state.contages,
        currentStep: currentStep.value,
      };
      const plain = JSON.parse(JSON.stringify(snapshot));
      await indexedDBService.saveState(plain, 'creation');
    } catch (err) {
      console.error('Erreur saveState:', err);
    }
  }

  async function loadState() {
    try {
      const saved = await indexedDBService.getState('creation');
      if (saved) {
        // Restaurer pas à pas pour conserver la réactivité
        state.step1Data = saved.step1Data;
        state.step2Data = saved.step2Data;
        state.contages.splice(0, state.contages.length, ...saved.contages);
        currentStep.value = saved.currentStep ?? 0;
      }
    } catch (err) {
      console.error('Erreur loadState:', err);
    } finally {
      loaded.value = true;
    }
  }

  async function cancelCreation() {
    const result = await alertService.confirm({
      title: 'Annuler la création',
      text: 'Voulez-vous vraiment annuler ?',
    });
    if (result.isConfirmed) {
      await indexedDBService.clearState('creation');
      state.step1Data = { libelle: '', date: '', type: 'Inventaire Général' };
      state.step2Data = { compte: '', magasin: [] };
      const resetContages = Array(3).fill(null).map<ContageConfig>(() => ({
        mode: '',
        isVariant: false,
        useScanner: false,
        useSaisie: false,
      }));
      state.contages.splice(0, state.contages.length, ...resetContages);
      currentStep.value = 0;
      await saveState();
    }
  }

  async function onStepComplete(step: number, data: any) {
    if (step === 0) state.step1Data = { ...data };
    else if (step === 1) state.step2Data = { ...data };
    currentStep.value = step + 1;
    await saveState();
  }

  async function onComplete() {
    if (!inventoryCreationService.validateContages(state)) {
      await alertService.error({ text: 'Configuration invalide.' });
      return;
    }
    await alertService.success({ text: 'Inventaire enregistré localement.' });
    await indexedDBService.clearState('creation');
    currentStep.value = 0;
    await saveState();
  }

  watch(state, saveState, { deep: true });
  watch(currentStep, saveState);

  onMounted(loadState);

  return {
    state,
    currentStep,
    availableModesForStep,
    onStepComplete,
    onComplete,
    cancelCreation,
    loaded,
  };
}