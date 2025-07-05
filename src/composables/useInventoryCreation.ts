// src/composables/useInventoryCreation.ts
import { ref, reactive, watch, onMounted } from 'vue';
import { alertService } from '@/services/alertService';
import { inventoryCreationService } from '@/services/inventoryCreationService';
import { useInventory } from '@/composables/useInventory';
import { useWarehouse } from '@/composables/useWarehouse';
import { useAccount } from '@/composables/useAccount';
import { CountingDispatcher } from '@/usecases/CountingDispatcher';
import { CountingValidationError } from '@/usecases/CountingByArticle';
import type { InventoryCreationState, ComptageConfig } from '@/interfaces/inventoryCreation';
import type { CreateInventoryRequest } from '@/models/Inventory';
import type { Count } from '@/models/Count';
import { validateCreation } from '@/utils/validate';

export function useInventoryCreation() {
    const currentStep = ref<number>(0);
    const loaded = ref<boolean>(false);
    const isValid = ref<boolean>(false);
    const isSubmitting = ref<boolean>(false);

    // Utiliser les stores
    const { createInventory } = useInventory();
    const { warehouses, loading: warehousesLoading, fetchWarehouses } = useWarehouse();
    const { accounts, loading: accountsLoading, fetchAccounts } = useAccount();

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
            stock_situation: false,
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
                stock_situation: false,
                // Legacy props
                useScanner: false,
                useSaisie: false
            }))
        );
        currentStep.value = 0;
    }

    function availableModesForStep(stepIndex: number) {
        return inventoryCreationService.getAvailableModesForStep(state, stepIndex);
    }

    // Fonction pour convertir ComptageConfig en Count pour la validation
    function convertComptageConfigToCount(comptage: ComptageConfig, order: number): Count {
        // Déterminer unit_scanned et entry_quantity selon le mode
        let unit_scanned = false;
        let entry_quantity = false;

        if (comptage.mode === 'en vrac') {
            unit_scanned = comptage.scannerUnitaire || comptage.inputMethod === 'scanner';
            entry_quantity = comptage.saisieQuantite || comptage.inputMethod === 'saisie';
        }

        // Déterminer stock_situation selon le mode
        let stock_situation = comptage.stock_situation || false;
        if (comptage.mode === 'image de stock') {
            stock_situation = true; // Forcer à true pour le mode "image de stock"
        }

        return {
            id: null,
            reference: null,
            order,
            count_mode: comptage.mode,
            unit_scanned,
            entry_quantity,
            is_variant: comptage.isVariante,
            stock_situation,
            quantity_show: comptage.guideQuantite,
            show_product: comptage.guideArticle,
            dlc: comptage.dlc,
            n_serie: comptage.numeroSerie,
            n_lot: comptage.numeroLot,
            inventory: 0,
            created_at: '',
            updated_at: ''
        };
    }

    // Fonction pour valider un comptage avec CountingDispatcher
    function validateComptageWithDispatcher(comptage: ComptageConfig, stepIndex: number): string[] {
        const errors: string[] = [];

        if (!comptage.mode) {
            errors.push(`Le mode de comptage est obligatoire pour l'étape ${stepIndex + 1}`);
            return errors;
        }

        try {
            const countData = convertComptageConfigToCount(comptage, stepIndex + 1);
            CountingDispatcher.validateCount(countData);
        } catch (error) {
            if (error instanceof CountingValidationError) {
                errors.push(`Erreurs de validation pour le comptage ${stepIndex + 1}:\n${error.message}`);
            } else {
                errors.push(`Erreur inattendue lors de la validation du comptage ${stepIndex + 1}: ${error}`);
            }
        }

        return errors;
    }

    async function cancelCreation() {
        const result = await alertService.confirm({
            title: 'Annuler la création',
            text: 'Voulez-vous vraiment annuler ?'
        });
        if (result.isConfirmed) {
            resetState();
        }
    }

    async function validateCurrentStep(): Promise<boolean> {
        const validation = validateCreation(state);
        const { isValid: stepOk, errors } = getCurrentStepValidation(validation);

        // Ajouter la validation avec CountingDispatcher pour les étapes 2, 3, 4
        if (currentStep.value >= 1 && currentStep.value <= 3) {
            const stepIndex = currentStep.value - 1;
            const comptage = state.comptages[stepIndex];

            if (comptage && comptage.mode) {
                const dispatcherErrors = validateComptageWithDispatcher(comptage, stepIndex);
                if (dispatcherErrors.length > 0) {
                    errors.push(...dispatcherErrors);
                }
            }
        }

        if (errors.length > 0) {
            await alertService.error({
                title: 'Validation',
                text: errors.join('\n\n')
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

    // Fonction pour convertir les données du formulaire au format API
    function convertToApiFormat(): CreateInventoryRequest {
        console.log('🔄 Conversion des données du formulaire vers le format API...');
        console.log('📋 Données du formulaire:', state);

        // Convertir les magasins
        const warehouse = state.step1Data.magasin.map(mag => {
            const warehouseId = parseInt(mag.magasin);
            console.log(`🏪 Conversion magasin: ${mag.magasin} -> ID: ${warehouseId}, Date: ${mag.date}`);
            return {
                id: warehouseId,
                date: mag.date
            };
        });

        console.log('📦 Magasins convertis:', warehouse);

        // Convertir les comptages
        const comptages = state.comptages
            .filter(comptage => comptage.mode) // Filtrer les comptages vides
            .map((comptage, index) => {
                const order = index + 1;

                // Déterminer unit_scanned et entry_quantity selon le mode
                let unit_scanned = false;
                let entry_quantity = false;

                if (comptage.mode === 'en vrac') {
                    unit_scanned = comptage.scannerUnitaire || comptage.inputMethod === 'scanner';
                    entry_quantity = comptage.saisieQuantite || comptage.inputMethod === 'saisie';
                }

                // Déterminer stock_situation selon le mode
                let stock_situation = comptage.stock_situation || false;
                if (comptage.mode === 'image de stock') {
                    stock_situation = true; // Forcer à true pour le mode "image de stock"
                }

                const convertedComptage = {
                    order,
                    count_mode: comptage.mode,
                    unit_scanned,
                    entry_quantity,
                    is_variant: comptage.isVariante,
                    stock_situation,
                    quantity_show: comptage.guideQuantite,
                    show_product: comptage.guideArticle,
                    dlc: comptage.dlc,
                    n_serie: comptage.numeroSerie,
                    n_lot: comptage.numeroLot
                };

                console.log(`📊 Comptage ${order} converti:`, convertedComptage);
                return convertedComptage;
            });

        console.log('📊 Comptages convertis:', comptages);

        const result: CreateInventoryRequest = {
            label: state.step1Data.libelle,
            date: state.step1Data.date,
            account_id: parseInt(state.step1Data.compte),
            warehouse,
            comptages
        };

        console.log('✅ Données finales pour l\'API:', result);
        return result;
    }

    async function onComplete() {
        if (!await validateCurrentStep()) return;

        try {
            isSubmitting.value = true;

            // Convertir les données au format API
            const apiData = convertToApiFormat();

            console.log('📤 Données envoyées à l\'API:', apiData);

            // Appeler l'API via le store
            await createInventory(apiData);

            // Reset après succès
            resetState();
        } catch (error) {
            console.error('❌ Erreur lors de la création:', error);
            throw error;
        } finally {
            isSubmitting.value = false;
        }
    }

    // Validation réactive
    watch(state, () => {
        const validation = validateCreation(state);
        isValid.value = getCurrentStepValidation(validation).isValid;
    }, { deep: true });

    watch(currentStep, () => {
        const validation = validateCreation(state);
        isValid.value = getCurrentStepValidation(validation).isValid;
    });

    onMounted(() => {
        loaded.value = true;
        // Charger les données des magasins et comptes
        loadMasterData();
    });

    // Fonction pour charger les données maîtres
    async function loadMasterData() {
        try {
            console.log('🔄 Chargement des données maîtres...');

            // Initialiser les tableaux vides si nécessaire
            if (!warehouses.value) {
                console.log('⚠️ Warehouses non initialisé, initialisation...');
            }
            if (!accounts.value) {
                console.log('⚠️ Accounts non initialisé, initialisation...');
            }

            const [warehousesResult, accountsResult] = await Promise.allSettled([
                fetchWarehouses(),
                fetchAccounts()
            ]);

            // Log des résultats avec vérification de sécurité
            if (warehousesResult.status === 'fulfilled') {
                console.log('✅ Magasins chargés:', Array.isArray(warehouses.value) ? warehouses.value.length : 0);
            } else {
                console.error('❌ Erreur chargement magasins:', warehousesResult.reason);
            }

            if (accountsResult.status === 'fulfilled') {
                console.log('✅ Comptes chargés:', Array.isArray(accounts.value) ? accounts.value.length : 0);
            } else {
                console.error('❌ Erreur chargement comptes:', accountsResult.reason);
            }

            // Vérification finale des données
            const warehousesArray = Array.isArray(warehouses.value) ? warehouses.value : [];
            const accountsArray = Array.isArray(accounts.value) ? accounts.value : [];

            console.log('📊 Données maîtres finales:', {
                warehouses: warehousesArray.length,
                accounts: accountsArray.length,
                warehousesData: warehousesArray.map(w => ({ id: w.id, name: w.warehouse_name })),
                accountsData: accountsArray.map(a => ({ id: a.id, name: a.account_name }))
            });

        } catch (error) {
            console.error('❌ Erreur lors du chargement des données maîtres:', error);
            // Afficher une notification d'erreur
            await alertService.error({
                title: 'Erreur de chargement',
                text: 'Impossible de charger les données de référence. Veuillez réessayer.'
            });
        }
    }

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
        convertToApiFormat,
        validateComptageWithDispatcher,
        // Exposer les données des stores
        warehouses,
        accounts,
        warehousesLoading,
        accountsLoading,
        loadMasterData
    };
}
