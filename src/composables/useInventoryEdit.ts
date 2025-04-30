import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { InventoryCreationState, ContageConfig } from '../interfaces/inventoryCreation';
import { indexedDBService } from '../services/indexedDBService';
import { alertService } from '../services/alertService';
import { inventoryEditService } from '../services/inventoryEditService';

export function useInventoryEdit() {
  const router = useRouter();
  const route = useRoute();
  const inventoryId = computed(() => Number(route.params.id));
  const currentStep = ref(0);
  const loading = ref(true);

  const state = reactive<InventoryCreationState>({
    step1Data: {
      libelle: '',
      date: '',
      type: 'Inventaire Général'
    },
    step2Data: {
      compte: '',
      magasin: []
    },
    contages: Array(3).fill(null).map<ContageConfig>(() => ({
      mode: '',
      isVariant: false,
      useScanner: false,
      useSaisie: false
    })),
    currentStep: 0
  });

  const availableModesForStep = (stepIndex: number): string[] => {
    return inventoryEditService.getAvailableModesForStep(state, stepIndex);
  };

  const loadInventoryData = async () => {
    try {
      loading.value = true;

      // Tentative de récupération du brouillon en IndexedDB
      const saved = await indexedDBService.getState();
      if (saved && saved.inventoryId === inventoryId.value) {
        Object.assign(state, saved);
        currentStep.value = saved.currentStep;
        loading.value = false;
        return;
      }

      // Sinon, chargement mock API
      const inventoryData = await inventoryEditService.getInventoryById(inventoryId.value);

      state.step1Data = {
        libelle: inventoryData.label,
        date: inventoryData.inventory_date,
        type: 'Inventaire Général'
      };

      state.step2Data = {
        compte: 'Compte 1',
        magasin: ['Magasin A']
      };

      // Exemple de configuration initiale des contages
      state.contages[0].mode = 'liste emplacement';
      state.contages[0].useScanner = true;
      state.contages[1].mode = 'article + emplacement';
      state.contages[1].isVariant = true;
      state.contages[2].mode = 'liste emplacement';
      state.contages[2].useSaisie = true;

      // Sauvegarde initiale
      await saveState();
    } catch (error) {
      await alertService.error({
        text: "Erreur lors du chargement des données de l'inventaire"
      });
      router.push({ name: 'inventory-list' });
    } finally {
      loading.value = false;
    }
  };

  const saveState = async () => {
    try {
      await indexedDBService.saveState({
        ...state,
        currentStep: currentStep.value,
        inventoryId: inventoryId.value
      });
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
      await indexedDBService.clearState();
      currentStep.value = 0;
      // plus de redirection vers la liste
    }
  };

  const onStepComplete = async (step: number, data: any) => {
    if (step === 0) state.step1Data = { ...data };
    else if (step === 1) state.step2Data = { ...data };

    currentStep.value = step + 1;
    await saveState();
  };

  const onComplete = async () => {
    if (!inventoryEditService.validateContages(state)) {
      await alertService.error({ text: 'La configuration des contages est invalide.' });
      return;
    }

    try {
      await inventoryEditService.updateInventory(inventoryId.value, state);
      await indexedDBService.clearState();
      await alertService.success({ text: 'Inventaire mis à jour avec succès' });
      router.push({ name: 'inventory-list' });
    } catch (err) {
      await alertService.error({ text: "Erreur lors de la mise à jour de l'inventaire" });
    }
  };

  // Sauvegarde automatique
  watch(state, saveState, { deep: true });
  watch(currentStep, saveState);

  onMounted(loadInventoryData);

  return {
    state,
    currentStep,
    loading,
    availableModesForStep,
    onStepComplete,
    onComplete,
    cancelEdit
  };
}
