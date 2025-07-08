// src/composables/useInventoryCreation.ts
import { ref, reactive, watch, onMounted, nextTick } from 'vue';
import { alertService } from '@/services/alertService';
import { inventoryCreationService } from '@/services/inventoryCreationService';
import { useInventory } from '@/composables/useInventory';
import { useWarehouse } from '@/composables/useWarehouse';
import { useAccount } from '@/composables/useAccount';
import { useInventoryStore } from '@/stores/inventory';
import { CountingDispatcher } from '@/usecases/CountingDispatcher';
import { CountingValidationError } from '@/usecases/CountingByArticle';
import type { InventoryCreationState, ComptageConfig, ComptageMode } from '@/interfaces/inventoryCreation';
import type { CreateInventoryRequest, InventoryDetails, InventoryTable } from '@/models/Inventory';
import type { Count, CreateCountRequest } from '@/models/Count';
import { validateCreation } from '@/utils/validate';

export function useInventoryCreation() {
    const currentStep = ref<number>(0);
    const loaded = ref<boolean>(false);
    const isValid = ref<boolean>(false);
    const isSubmitting = ref<boolean>(false);
    const isEditMode = ref<boolean>(false);
    const inventoryId = ref<number | null>(null);
    const isInitializing = ref<boolean>(false);

    // Utiliser les stores
    const { createInventory, fetchInventoryById, updateInventory: updateInventoryStore, fetchInventories } = useInventory();
    const { warehouses, loading: warehousesLoading, fetchWarehouses } = useWarehouse();
    const { accounts, loading: accountsLoading, fetchAccounts } = useAccount();
    const inventoryStore = useInventoryStore();

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

    // Convertir les données du formulaire vers le format API
    const convertFormDataToAPI = (state: InventoryCreationState): CreateInventoryRequest => {
        const warehouse = state.step1Data.magasin.map(mag => {
            const warehouseId = warehouses.value.find(w => w.id.toString() === mag.magasin)?.id || 0;
            return {
                id: warehouseId,
                date: mag.date
            };
        });

        const comptages: CreateCountRequest[] = state.comptages.map((comptage, index) => {
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
                stock_situation = true;
            }

            return {
                order: index + 1,
                count_mode: comptage.mode,
                unit_scanned,
                entry_quantity,
                is_variant: comptage.isVariante,
                n_lot: comptage.numeroLot,
                n_serie: comptage.numeroSerie,
                dlc: comptage.dlc,
                show_product: comptage.guideArticle,
                stock_situation,
                quantity_show: comptage.guideQuantite
            };
        });

        return {
            label: state.step1Data.libelle,
            date: state.step1Data.date,
            account_id: parseInt(state.step1Data.compte),
            warehouse,
            comptages
        };
    };

    async function onComplete() {
        if (!await validateCurrentStep()) return;

        try {
            isSubmitting.value = true;

            // Convertir les données au format API
            const apiData = convertFormDataToAPI(state);

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
        if (isInitializing.value) return; // Ne pas valider pendant l'initialisation
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
            const [warehousesResult, accountsResult] = await Promise.allSettled([
                fetchWarehouses(),
                fetchAccounts()
            ]);

            if (warehousesResult.status === 'rejected') {
                console.error('❌ Erreur chargement magasins:', warehousesResult.reason);
            }

            if (accountsResult.status === 'rejected') {
                console.error('❌ Erreur chargement comptes:', accountsResult.reason);
            }

        } catch (error) {
            console.error('❌ Erreur lors du chargement des données maîtres:', error);
            // Afficher une notification d'erreur
            await alertService.error({
                title: 'Erreur de chargement',
                text: 'Impossible de charger les données de référence. Veuillez réessayer.'
            });
        }
    }

    // Fonction pour formater la date au format attendu par flat-pickr
    function formatDateForFlatpickr(dateString: string): string {
        if (!dateString) return '';

        try {
            // Si la date est déjà au format Y-m-d, la retourner telle quelle
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                return dateString;
            }

            // Si c'est un datetime ISO, extraire seulement la partie date
            if (/^\d{4}-\d{2}-\d{2}T/.test(dateString)) {
                return dateString.split('T')[0];
            }

            // Sinon, essayer de parser la date et la reformater
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                console.warn('Format de date invalide:', dateString);
                return '';
            }

            // Formater au format Y-m-d
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');

            return `${year}-${month}-${day}`;
        } catch (error) {
            console.error('Erreur lors du formatage de la date:', error);
            return '';
        }
    }

    // Fonction pour initialiser en mode édition
    const initializeEditMode = async (reference: string) => {
        isEditMode.value = true;
        inventoryId.value = null;
        isInitializing.value = true; // Désactiver la validation pendant l'initialisation

        try {
            // Charger d'abord les données maîtres et attendre qu'elles soient disponibles
            await loadMasterData();

            // Attendre un peu pour s'assurer que les données sont bien chargées
            await new Promise(resolve => setTimeout(resolve, 100));

            // Vérifier que les données des comptes et magasins sont chargées
            if (!accounts.value || accounts.value.length === 0) {
                console.warn('Les données des comptes ne sont pas encore chargées, nouvelle tentative...');
                await fetchAccounts();
            }

            if (!warehouses.value || warehouses.value.length === 0) {
                console.warn('Les données des magasins ne sont pas encore chargées, nouvelle tentative...');
                await fetchWarehouses();
            }

            // Récupérer l'inventaire par sa référence
            // D'abord, charger la liste des inventaires pour trouver celui avec la bonne référence
            await inventoryStore.fetchInventories();
            const inventory = inventoryStore.inventories.find(inv => inv.reference === reference);

            if (!inventory) {
                throw new Error(`Aucun inventaire trouvé avec la référence: ${reference}`);
            }

            // Stocker l'ID de l'inventaire
            inventoryId.value = inventory.id;

            // Récupérer les détails de l'inventaire avec l'ID
            const inventoryDetails: InventoryDetails = await inventoryStore.fetchInventoryById(inventory.id);
            if (!inventoryDetails) {
                throw new Error(`Impossible de récupérer les détails de l'inventaire avec l'ID: ${inventory.id}`);
            }
            console.log(formatDateForFlatpickr(inventoryDetails.date));

            // Mapper les données de l'API vers le state local
            const step1Data = {
                libelle: inventoryDetails.label || '',
                date: formatDateForFlatpickr(inventoryDetails.date),
                type: (inventoryDetails.inventory_type as string) || 'Inventaire Général',
                compte: inventoryDetails.account_id ? inventoryDetails.account_id.toString() : '',
                magasin: Array.isArray(inventoryDetails.warehouses)
                    ? inventoryDetails.warehouses.map(wh => ({
                        magasin: wh.id ? wh.id.toString() : '',
                        date: formatDateForFlatpickr(wh.inventory_start_date)
                    }))
                    : []
            };

            console.log('📝 Données mappées:', step1Data);
            console.log('📅 Date mappée:', step1Data.date);

            // Assigner les données de manière réactive
            state.step1Data.libelle = step1Data.libelle;
            state.step1Data.date = step1Data.date;
            state.step1Data.type = step1Data.type;
            state.step1Data.compte = step1Data.compte;
            state.step1Data.magasin = step1Data.magasin;

            console.log('🔧 State après assignation:', state.step1Data);
            console.log('📅 Date dans le state:', state.step1Data.date);

            // Mapper les comptages
            if (inventoryDetails.comptages && inventoryDetails.comptages.length > 0) {
                state.comptages = inventoryDetails.comptages.slice(0, 3).map(count => {
                    // Déterminer inputMethod pour le mode "en vrac"
                    let inputMethod: '' | 'saisie' | 'scanner' = '';
                    if (count.count_mode === 'en vrac') {
                        if (count.entry_quantity) {
                            inputMethod = 'saisie';
                        } else if (count.unit_scanned) {
                            inputMethod = 'scanner';
                        }
                    }

                    return {
                        mode: (count.count_mode || '') as ComptageMode,
                        inputMethod,
                        saisieQuantite: count.entry_quantity || false,
                        scannerUnitaire: count.unit_scanned || false,
                        guideQuantite: count.quantity_show || false,
                        isVariante: count.is_variant || false,
                        guideArticle: count.show_product || false,
                        dlc: count.dlc || false,
                        numeroSerie: count.n_serie || false,
                        numeroLot: count.n_lot || false,
                        stock_situation: count.stock_situation || false,
                        // Legacy props
                        useScanner: count.unit_scanned || false,
                        useSaisie: count.entry_quantity || false
                    };
                });
            }

            // Forcer une mise à jour réactive après le prochain tick
            await nextTick();

            console.log('🔄 Après nextTick - State:', state.step1Data);
            console.log('🔄 Après nextTick - Date:', state.step1Data.date);

            // Forcer une validation manuelle après l'initialisation
            const validation = validateCreation(state);
            isValid.value = getCurrentStepValidation(validation).isValid;

            console.log('✅ Validation effectuée, date finale:', state.step1Data.date);
        } catch (error) {
            console.error('Erreur lors du chargement de l\'inventaire:', error);
            throw error;
        } finally {
            isInitializing.value = false; // Réactiver la validation après l'initialisation
        }
    };

    // Fonction pour mettre à jour un inventaire existant
    const updateInventory = async () => {
        if (!inventoryId.value) {
            throw new Error('ID d\'inventaire manquant pour la mise à jour');
        }

        try {
            isSubmitting.value = true;

            // Convertir les données au format API
            const apiData = convertFormDataToAPI(state);

            // Appeler l'API de mise à jour via le store
            await updateInventoryStore(inventoryId.value, apiData);

            // Reset après succès
            resetState();
            isEditMode.value = false;
            inventoryId.value = null;
        } catch (error) {
            console.error('❌ Erreur lors de la mise à jour:', error);
            throw error;
        } finally {
            isSubmitting.value = false;
        }
    };

    return {
        state,
        currentStep,
        availableModesForStep,
        onStepComplete,
        onComplete,
        updateInventory,
        initializeEditMode,
        cancelCreation,
        loaded,
        isValid,
        isSubmitting,
        isEditMode,
        inventoryId,
        resetState,
        convertFormDataToAPI,
        validateComptageWithDispatcher,
        // Exposer les données des stores
        warehouses,
        accounts,
        warehousesLoading,
        accountsLoading,
        loadMasterData
    };
}
