// src/composables/useInventoryCreation.ts
import { ref, reactive, watch, onMounted } from 'vue';
import { alertService } from '@/services/alertService';
import { inventoryWizardLogic } from '@/services/InventoryWizardLogic';
import type { InventoryCreationState, ComptageConfig } from '@/interfaces/inventoryCreation';
import { validateCreation } from '@/utils/validate';
import { useInventoryStore } from '@/stores/inventory';
import type { CreateInventoryRequest } from '@/models/Inventory';

export function useInventoryCreation() {
    const currentStep = ref<number>(0);
    const loaded = ref<boolean>(true);
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
            useSaisie: false,
            stock_situation: false
        })),
        currentStep: 0,
    });

    const inventoryStore = useInventoryStore();

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
                useSaisie: false,
                stock_situation: false
            }))
        );
        currentStep.value = 0;
    }

    function availableModesForStep(stepIndex: number) {
        return inventoryWizardLogic.getAvailableModesForStep(state, stepIndex);
    }

    async function cancelCreation() {
        resetState();
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
        return true;
    }

    async function onComplete() {
        if (!await validateCurrentStep()) return;
        resetState();
    }

    async function createInventory(data: CreateInventoryRequest) {
        return await inventoryStore.createInventory(data);
    }

    watch(state, () => {
        const validation = validateCreation(state);
        isValid.value = getCurrentStepValidation(validation).isValid;
    }, { deep: true });

    watch(currentStep, () => {
        const validation = validateCreation(state);
        isValid.value = getCurrentStepValidation(validation).isValid;
    });

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
        createInventory
    };
}
