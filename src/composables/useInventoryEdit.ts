import { ref, reactive, computed, onMounted } from 'vue';
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
    contages: Array(3).fill(null).map(() => ({
      mode: '',
      isVariant: false,
      useScanner: false,
      useSaisie: false
    })),
    currentStep: 0
  });

  const availableModesForStep = computed(() => (stepIndex: number): string[] => {
    return inventoryEditService.getAvailableModesForStep(state, stepIndex);
  });

  const loadInventoryData = async () => {
    try {
      loading.value = true;
      
      // First check if we have a saved state in IndexedDB
      const savedState = await indexedDBService.getState();
      if (savedState && savedState.inventoryId === inventoryId.value) {
        Object.assign(state, savedState);
        currentStep.value = savedState.currentStep;
        loading.value = false;
        return;
      }
      
      // If not, load from API/mock
      const inventoryData = await inventoryEditService.getInventoryById(inventoryId.value);
      
      // Map the inventory data to our state
      state.step1Data = {
        libelle: inventoryData.label,
        date: inventoryData.inventory_date,
        type: 'Inventaire Général'
      };
      
      // For this example, we'll set mock data for step2 and contages
      state.step2Data = {
        compte: 'Compte 1',
        magasin: ['Magasin A']
      };
      
      // Mock contages setup - in real app, this would come from API
      state.contages[0].mode = 'liste emplacement';
      state.contages[0].useScanner = true;
      state.contages[1].mode = 'article + emplacement';
      state.contages[1].isVariant = true;
      state.contages[2].mode = 'liste emplacement';
      state.contages[2].useSaisie = true;
      
      // Save this initial state to IndexedDB
      await saveState();
      
    } catch (error) {
      await alertService.error({
        text: 'Erreur lors du chargement des données de l\'inventaire'
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
    } catch (error) {
      console.error('Error saving state:', error);
    }
  };

  const cancelEdit = async () => {
    const result = await alertService.confirm({
      title: 'Annuler la modification',
      text: 'Voulez-vous vraiment annuler la modification de cet inventaire ?'
    });

    if (result.isConfirmed) {
      await indexedDBService.clearState();
      router.push({ name: 'inventory-list' });
    }
  };

  const onStepComplete = async (step: number, data: any) => {
    if (step === 0) {
      state.step1Data = { ...data };
    } else if (step === 1) {
      state.step2Data = { ...data };
    }
    
    currentStep.value = step + 1;
    await saveState();
  };

  const onComplete = async () => {
    if (!inventoryEditService.validateContages(state)) {
      await alertService.error({
        text: 'La configuration des contages est invalide.'
      });
      return;
    }

    try {
      await inventoryEditService.updateInventory(inventoryId.value, state);
      await indexedDBService.clearState();
      await alertService.success({
        text: 'Inventaire mis à jour avec succès'
      });
      router.push({ name: 'inventory-list' });
    } catch (error) {
      await alertService.error({
        text: 'Erreur lors de la mise à jour de l\'inventaire'
      });
    }
  };

  // Initialize
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