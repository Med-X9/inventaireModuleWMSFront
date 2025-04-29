// src/composables/useInventoryCreation.ts
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import type {
  InventoryCreationState,
  ContageConfig,
} from '@/interfaces/inventoryCreation';
import { indexedDBService } from '@/services/indexedDBService';
import { alertService } from '@/services/alertService';
import { inventoryCreationService } from '@/services/inventoryCreationService';

export function useInventoryCreation() {
  const router = useRouter();
  const currentStep = ref<number>(0);

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

  const availableModesForStep = computed<
    (index: number) => ContageConfig['mode'][]
  >(() => {
    return (stepIndex: number) =>
      inventoryCreationService.getAvailableModesForStep(state, stepIndex);
  });

  async function loadState() {
    try {
      const saved = await indexedDBService.getState('creation');
      if (saved) {
        Object.assign(state, saved);
        currentStep.value = saved.currentStep ?? 0;
      }
    } catch (err) {
      console.error('Erreur loadState:', err);
    }
  }

  async function saveState() {
    try {
      await indexedDBService.saveState(
        { ...state, currentStep: currentStep.value },
        'creation'
      );
    } catch (err) {
      console.error('Erreur saveState:', err);
    }
  }

  // Annulation : on nettoie et on repart à l’étape 1 du même formulaire
  async function cancelCreation() {
    const result = await alertService.confirm({
      title: 'Annuler la création',
      text: 'Voulez-vous vraiment annuler ?',
    });
    if (result.isConfirmed) {
      await indexedDBService.clearState('creation');
      // réinitialiser l’état et l’étape
      Object.assign(state, {
        step1Data: { libelle: '', date: '', type: 'Inventaire Général' },
        step2Data: { compte: '', magasin: [] },
        contages: state.contages.map(() => ({
          mode: '',
          isVariant: false,
          useScanner: false,
          useSaisie: false,
        })),
      });
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
    // ici tout est en local : on garde en IndexedDB et on réinitialise
    await alertService.success({ text: 'Inventaire enregistré localement.' });
    await indexedDBService.clearState('creation');
    router.push({ name: 'inventory-create' }); // renvoyer à l’étape 1 si besoin
  }

  // Sauvegarde automatique
  watch(() => state, saveState, { deep: true });
  watch(currentStep, saveState);

  onMounted(loadState);

  return {
    state,
    currentStep,
    availableModesForStep,
    onStepComplete,
    onComplete,
    cancelCreation,
  };
}
