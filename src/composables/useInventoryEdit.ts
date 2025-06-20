import { ref, reactive, computed, onMounted, watch, toRaw } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { InventoryCreationState, ComptageConfig } from '@/interfaces/inventoryCreation';
import { indexedDBService } from '@/services/indexedDBService';
import { alertService } from '@/services/alertService';
import { inventoryEditService } from '@/services/inventoryEditService';
import { validateCreation } from '@/utils/validate';

export function useInventoryEdit() {
  const router = useRouter();
  const route = useRoute();
  const inventoryId = computed(() => Number(route.params.id));
  const storageKey = computed(() => `edit-${inventoryId.value}`);

  const currentStep = ref<number>(0);
  const loading = ref<boolean>(true);
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
      inputMethod: '',
      guideQuantite: false,
      isVariante: false,
      guideArticle: false,
      dlc: false,
      numeroSerie: false,
      numeroLot: false,
      // Legacy props
      saisieQuantite: false,
      scannerUnitaire: false
    })),
    currentStep: 0
  });

  const availableModesForStep = (stepIndex: number): string[] =>
    inventoryEditService.getAvailableModesForStep(state, stepIndex);

  async function clearState() {
    await indexedDBService.clearState(storageKey.value);
    state.step1Data = {
      libelle: '',
      date: '',
      type: 'Inventaire Général',
      compte: '',
      magasin: []
    };
    state.comptages = Array(3).fill(null).map<ComptageConfig>(() => ({
      mode: '',
      inputMethod: '',
      guideQuantite: false,
      isVariante: false,
      guideArticle: false,
      dlc: false,
      numeroSerie: false,
      numeroLot: false,
      // Legacy props
      saisieQuantite: false,
      scannerUnitaire: false
    }));
    currentStep.value = 0;
  }

  const loadInventoryData = async () => {
    loading.value = true;
    try {
      const saved = await indexedDBService.getState(storageKey.value);
      if (saved && saved.inventoryId === inventoryId.value) {
        Object.assign(state, saved);
        currentStep.value = saved.currentStep;
      } else {
        const inventoryData = await inventoryEditService.getInventoryById(inventoryId.value);
        state.step1Data = {
          libelle: inventoryData.label,
          date: inventoryData.inventory_date,
          type: 'Inventaire Général',
          compte: 'Compte 1',
          magasin: [{ magasin: 'Magasin A', date: inventoryData.inventory_date }]
        };

        // Set default first comptage to 'image de stock'
        state.comptages[0] = {
          mode: 'image de stock',
          inputMethod: '',
          guideQuantite: false,
          isVariante: false,
          guideArticle: false,
          dlc: false,
          numeroSerie: false,
          numeroLot: false,
          // Legacy props
          saisieQuantite: false,
          scannerUnitaire: false
        };

        await saveState();
      }
    } catch (error) {
      await alertService.error({ text: "Erreur lors du chargement de l'inventaire" });
      router.push({ name: 'inventory-list' });
    } finally {
      loading.value = false;
    }
  };

  const saveState = async () => {
    try {
      const raw = toRaw(state);
      const snapshot = {
        ...raw,
        currentStep: currentStep.value,
        inventoryId: inventoryId.value
      };
      const plain = JSON.parse(JSON.stringify(snapshot));
      await indexedDBService.saveState(plain, storageKey.value);
    } catch (err) {
      console.error('Error saving state:', err);
    }
  };

  const cancelEdit = async () => {
    const result = await alertService.confirm({
      title: 'Annuler la modification',
      text: 'Voulez-vous vraiment annuler la modification de cet inventaire ?'
    });
    if (result.isConfirmed) {
      await clearState();
      router.push({ name: 'inventory-list' });
    }
  };

  const isValid = computed(() => {
    const validation = validateCreation(state);
    const { isValid: stepOk } = getCurrentStepValidation(validation);
    return stepOk;
  });

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

  async function handleStepChange(prev: number, next: number): Promise<boolean> {
    const validation = validateCreation(state);
    const { isValid: stepOk, errors } = getCurrentStepValidation(validation);
    
    if (!stepOk) {
      await alertService.error({ 
        title: 'Validation', 
        text: errors.join('\n') || 'Veuillez corriger les erreurs avant de continuer.' 
      });
      return false;
    }

    let data: any;
    if (prev === 0) data = state.step1Data;
    else data = state.comptages[prev - 1];

    await onStepComplete(prev, data);
    return true;
  }

  async function onStepComplete(step: number, data: any) {
    if (step === 0) {
      state.step1Data = { ...data };
    } else {
      state.comptages[step - 1] = { ...data };
    }

    currentStep.value = step + 1;
    await saveState();
  }

  const onComplete = async () => {
    if (isSubmitting.value) return;

    try {
      isSubmitting.value = true;

      if (!inventoryEditService.validateComptages(state)) {
        await alertService.error({ text: 'Configuration des comptages invalide.' });
        return;
      }

      await inventoryEditService.updateInventory(inventoryId.value, state);
      await clearState();
      await alertService.success({ text: 'Inventaire mis à jour avec succès' });
      router.push({ name: 'inventory-list' });
    } catch {
      await alertService.error({ text: "Erreur lors de la mise à jour de l'inventaire" });
    } finally {
      isSubmitting.value = false;
    }
  };

  watch(state, saveState, { deep: true });
  watch(currentStep, saveState);

  onMounted(loadInventoryData);

  return {
    state,
    currentStep,
    loading,
    availableModesForStep,
    isValid,
    handleStepChange,
    onComplete,
    cancelEdit,
    isSubmitting
  };
}