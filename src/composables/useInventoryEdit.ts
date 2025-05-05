
// src/composables/useInventoryEdit.ts
import { ref, reactive, computed, onMounted, watch, toRaw } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { InventoryCreationState, ContageConfig } from '@/interfaces/inventoryCreation';
import { indexedDBService } from '@/services/indexedDBService';
import { alertService } from '@/services/alertService';
import { inventoryEditService } from '@/services/inventoryEditService';

export function useInventoryEdit() {
  const router = useRouter();
  const route = useRoute();
  const inventoryId = computed(() => Number(route.params.id));
  // Use a dedicated key per inventory to avoid clashing with creation
  const storageKey = computed(() => `edit-${inventoryId.value}`);

  const currentStep = ref(0);
  const loading = ref(true);

  const state = reactive<InventoryCreationState>({
    step1Data: { libelle: '', date: '', type: 'Inventaire Général' },
    step2Data: { compte: '', magasin: [] },
    contages: Array(3).fill(null).map<ContageConfig>(() => ({
      mode: '', isVariant: false, useScanner: false, useSaisie: false
    })),
    currentStep: 0
  });

  const availableModesForStep = (stepIndex: number): string[] =>
    inventoryEditService.getAvailableModesForStep(state, stepIndex);

  const loadInventoryData = async () => {
    loading.value = true;
    try {
      // Try loading from IndexedDB
      const saved = await indexedDBService.getState(storageKey.value);
      if (saved && saved.inventoryId === inventoryId.value) {
        Object.assign(state, saved);
        currentStep.value = saved.currentStep;
        return;
      }

      // Fallback to fetching from API
      const inventoryData = await inventoryEditService.getInventoryById(inventoryId.value);
      state.step1Data = {
        libelle: inventoryData.label,
        date: inventoryData.inventory_date,
        type: 'Inventaire Général'
      };
      state.step2Data = { compte: 'Compte 1', magasin: ['Magasin A'] };

      // Initialize contages example defaults
      state.contages[0].mode = 'liste emplacement';
      state.contages[0].useScanner = true;
      state.contages[1].mode = 'article + emplacement';
      state.contages[1].isVariant = true;
      state.contages[2].mode = 'liste emplacement';
      state.contages[2].useSaisie = true;

      await saveState();
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
        step1Data: raw.step1Data,
        step2Data: raw.step2Data,
        contages: raw.contages,
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
      await indexedDBService.clearState(storageKey.value);
      currentStep.value = 0;
      // Navigate back to the inventory list après annulation
      router.push({ name: 'inventory-list' });
    }
  };

  const onStepComplete = async (step: number, data: any) => {
    if (step === 0) state.step1Data = { ...data };
    else if (step === 1) state.step2Data = { ...data };
    else state.contages[step - 2] = { ...data };

    currentStep.value = step + 1;
    await saveState();
  };

  const onComplete = async () => {
    if (!inventoryEditService.validateContages(state)) {
      await alertService.error({ text: 'Configuration invalide.' });
      return;
    }
    try {
      await inventoryEditService.updateInventory(inventoryId.value, state);
      await indexedDBService.clearState(storageKey.value);
      await alertService.success({ text: 'Inventaire mis à jour avec succès' });
      router.push({ name: 'inventory-list' });
    } catch {
      await alertService.error({ text: "Erreur lors de la mise à jour de l'inventaire" });
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
    onStepComplete,
    onComplete,
    cancelEdit
  };
}

