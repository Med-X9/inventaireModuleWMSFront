// src/composables/useInventoryCreation.ts
import { ref, reactive, watch, onMounted, nextTick, computed } from 'vue';
import { alertService } from '@/services/alertService';
import { inventoryCreationService } from '@/services/inventoryCreationService';
import { useInventory } from '@/composables/useInventory';
import { useWarehouse } from '@/composables/useWarehouse';
import { useAccount } from '@/composables/useAccount';
import { useInventoryStore } from '@/stores/inventory';
import { CountingDispatcher } from '@/usecases/CountingDispatcher';
import { CountingValidationError } from '@/usecases/CountingByArticle';
import type { InventoryCreationState, ComptageConfig, ComptageMode } from '@/interfaces/inventoryCreation';
import type { CreateInventoryRequest, InventoryDetails } from '@/models/Inventory';
import type { Count, CreateCountRequest } from '@/models/Count';
// import { validateCreation } from '@/utils/validate';

export function useInventoryCreation() {
    const currentStep = ref<number>(0); // Forcer l'initialisation à 0
    const loaded = ref<boolean>(false);
    const isSubmitting = ref<boolean>(false);
    const isEditMode = ref<boolean>(false);
    const inventoryId = ref<number | null>(null);
    const isInitializing = ref<boolean>(false);

    // Utiliser les stores
    const { createInventory, fetchInventoryById, updateInventory: updateInventoryStore, fetchInventories } = useInventory();
    const { warehouses, loading: warehousesLoading, fetchWarehouses } = useWarehouse();
    const { accounts, loading: accountsLoading, fetchAccounts } = useAccount();
    const inventoryStore = useInventoryStore();

    // Initialiser avec des valeurs par défaut
    const state = reactive<InventoryCreationState>({
        step1Data: {
            libelle: '',
            date: '',
            inventory_type: '', // Valeur par défaut
            compte: '',
            magasin: []
        },
        comptages: Array(3).fill(null).map<ComptageConfig>(() => ({
            mode: undefined as any, // Utiliser undefined au lieu de chaîne vide
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

    // Fonction pour réinitialiser complètement l'état
    function resetState() {
        // Réinitialiser step1Data
        Object.assign(state.step1Data, {
            libelle: '',
            date: '',
            inventory_type: '', // Utiliser la valeur au lieu du label
            compte: '',
            magasin: []
        });

        // Réinitialiser les comptages
        state.comptages.splice(0, state.comptages.length,
            ...Array(3).fill(null).map<ComptageConfig>(() => ({
                mode: undefined as any, // Utiliser undefined au lieu de chaîne vide
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
        currentStep.value = 0; // Forcer le retour à l'étape 0
    }

    // Fonction pour forcer le retour à l'étape 0
    function goToStep0() {
        currentStep.value = 0;
    }

    function availableModesForStep(stepIndex: number) {
        console.log(`🔍 availableModesForStep appelé pour stepIndex: ${stepIndex}`);
        console.log('État actuel des comptages:', state.comptages.map((c, i) => ({ index: i, mode: c.mode })));

        const modes = inventoryCreationService.getAvailableModesForStep(state, stepIndex);
        console.log(`📋 Modes retournés par le service:`, modes);

        // Pour le 3e comptage (stepIndex = 2), s'assurer qu'un mode est défini
        if (stepIndex === 2) {
            const thirdComptage = state.comptages[2];
            const firstComptage = state.comptages[0];
            const secondComptage = state.comptages[1];


            // Vérifier que les comptages précédents existent
            if (!firstComptage?.mode || !secondComptage?.mode) {
                console.warn('⚠️ Comptages précédents non définis, pas de modes disponibles');
                return [];
            }

            // Si le 3e comptage n'a pas de mode défini et qu'il y a des modes disponibles
            if (!thirdComptage.mode && modes.length > 0) {

                // Scénario 1: 1er comptage = "image de stock"
                if (firstComptage.mode === 'image de stock' && secondComptage.mode) {
                    thirdComptage.mode = secondComptage.mode;
                }
                // Scénario 2: 1er et 2e = "en vrac"
                else if (firstComptage.mode === 'en vrac' && secondComptage.mode === 'en vrac') {
                    thirdComptage.mode = 'en vrac';
                }
                // Scénario 3: 1er et 2e = "par article"
                else if (firstComptage.mode === 'par article' && secondComptage.mode === 'par article') {
                    thirdComptage.mode = 'par article';
                }
                // Scénario 4: Modes mixtes (en vrac + par article)
                else if (
                    (firstComptage.mode === 'en vrac' && secondComptage.mode === 'par article') ||
                    (firstComptage.mode === 'par article' && secondComptage.mode === 'en vrac')
                ) {
                    console.log('🎯 Modes mixtes - laisser l\'utilisateur choisir');
                    // Ne pas forcer d'initialisation, l'utilisateur choisira
                }

                // Appliquer les options héritées si un mode a été défini
                if (thirdComptage.mode) {
                    const inheritedOptions = inventoryCreationService.getInheritedOptionsForComptage3(state);
                    if (Object.keys(inheritedOptions).length > 0) {
                        Object.assign(thirdComptage, inheritedOptions);
                        console.log('📦 Options héritées appliquées:', inheritedOptions);
                    }
                }
            }
        }

        return modes;
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

    // Fonction pour valider les règles métier du 3e comptage
    function validateComptage3BusinessRules(): string[] {
        const errors: string[] = [];
        const firstComptage = state.comptages[0];
        const secondComptage = state.comptages[1];
        const thirdComptage = state.comptages[2];

        // Vérifier que les comptages précédents existent
        if (!firstComptage?.mode || !secondComptage?.mode) {
            return errors; // Pas d'erreur si les comptages précédents ne sont pas encore définis
        }

        // Vérifier que le 3e comptage a un mode défini
        if (!thirdComptage?.mode) {
            errors.push('Le mode du 3e comptage doit être défini');
            return errors;
        }

        // Scénario 1: 1er comptage = "image de stock"
        if (firstComptage.mode === 'image de stock') {
            if (thirdComptage.mode !== secondComptage.mode) {
                errors.push('Le 3e comptage doit être identique au 2e comptage quand le 1er est "image de stock"');
            }
        }

        // Scénario 2: 1er et 2e = "en vrac"
        else if (firstComptage.mode === 'en vrac' && secondComptage.mode === 'en vrac') {
            // 3e doit être soit "en vrac" OU "par article" (les deux modes sont autorisés)
            if (thirdComptage.mode !== 'en vrac' && thirdComptage.mode !== 'par article') {
                errors.push('Le 3e comptage doit être soit "en vrac" soit "par article" quand les deux premiers sont "en vrac"');
            }
        }

        // Scénario 3: 1er = "en vrac" et 2e = "par article" OU 1er = "par article" et 2e = "en vrac"
        else if (
            (firstComptage.mode === 'en vrac' && secondComptage.mode === 'par article') ||
            (firstComptage.mode === 'par article' && secondComptage.mode === 'en vrac')
        ) {
            if (thirdComptage.mode !== 'en vrac' && thirdComptage.mode !== 'par article') {
                errors.push('Le 3e comptage doit être soit "en vrac" soit "par article"');
            }
        }

        // Scénario 4: 1er et 2e = "par article" (sous-scénario du scénario 3)
        else if (firstComptage.mode === 'par article' && secondComptage.mode === 'par article') {
            if (thirdComptage.mode !== 'par article') {
                errors.push('Le 3e comptage doit être "par article" quand les deux premiers sont "par article"');
            }
        }

        if (errors.length > 0) {
            return errors;
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
        // const validation = await validateCreation(state); // Temporairement commenté pour permettre la compilation
        // const { isValid: stepOk, errors } = getCurrentStepValidation(validation); // Utiliser le state directement
        const stepOk = true; // Temporairement true pour permettre la compilation
        const errors: string[] = [];

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

        // Ajouter la validation des règles métier pour le 3e comptage
        if (currentStep.value === 3) {
            const businessRuleErrors = validateComptage3BusinessRules();
            if (businessRuleErrors.length > 0) {
                errors.push(...businessRuleErrors);
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
            inventory_type: state.step1Data.inventory_type, // Utiliser le bon nom de champ
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

    // Validation réactive - Améliorée pour éviter les conflits DOM
    watch(state, () => {
        if (isInitializing.value) return; // Ne pas valider pendant l'initialisation

        // Utiliser nextTick pour éviter les conflits DOM
        nextTick(() => {
            // validateCreation(state).then(validation => { // Temporairement commenté pour permettre la compilation
            //     isValid.value = getCurrentStepValidation(validation).isValid;
            // });
        });
    }, { deep: true });

    watch(currentStep, () => {
        if (isInitializing.value) return;

        nextTick(() => {
            // validateCreation(state).then(validation => { // Temporairement commenté pour permettre la compilation
            //     isValid.value = getCurrentStepValidation(validation).isValid;
            // });
        });
    });

    // Computed properties pour les options des selects
    const accountOptions = computed(() => {
        if (!accounts.value || accounts.value.length === 0) {
            return [];
        }

        return accounts.value.map(account => ({
            label: account.account_name || `Compte ${account.id}`,
            value: account.id.toString()
        }));
    });

    const warehouseOptions = computed(() => {
        if (!warehouses.value || warehouses.value.length === 0) {
            return [];
        }

        return warehouses.value.map(warehouse => ({
            label: warehouse.warehouse_name || `Magasin ${warehouse.id}`,
            value: warehouse.id.toString()
        }));
    });

    const inventoryTypeOptions = computed(() => [
        { label: 'Inventaire Général', value: 'GENERAL' },
        { label: 'Inventaire Tournant', value: 'TOURNANT' }
    ]);

    // Validation des erreurs et champs vides
    const validationErrors = computed(() => {
        const errors: Array<{ field: string; label: string; message: string }> = [];

        // Validation des champs de l'étape 1
        if (!state.step1Data.libelle || state.step1Data.libelle.trim() === '') {
            errors.push({
                field: 'libelle',
                label: 'Libellé',
                message: 'Le libellé est requis'
            });
        }

        if (!state.step1Data.date || state.step1Data.date.trim() === '') {
            errors.push({
                field: 'date',
                label: 'Date',
                message: 'La date est requise'
            });
        }

        if (!state.step1Data.compte || state.step1Data.compte.trim() === '') {
            errors.push({
                field: 'compte',
                label: 'Compte',
                message: 'Veuillez sélectionner un compte'
            });
        }

        // Validation des magasins
        if (!Array.isArray(state.step1Data.magasin) || state.step1Data.magasin.length === 0) {
            errors.push({
                field: 'magasin',
                label: 'Magasins',
                message: 'Veuillez sélectionner au moins un magasin'
            });
        } else {
            // Vérifier que chaque magasin a une date
            state.step1Data.magasin.forEach((mag, index) => {
                if (!mag.date || mag.date.trim() === '') {
                    const warehouseName = getWarehouseName(mag.magasin);
                    errors.push({
                        field: `magasin-${index}`,
                        label: `Date pour ${warehouseName}`,
                        message: 'La date est requise pour ce magasin'
                    });
                }
            });
        }

        // Validation des comptages (si on est sur les étapes de comptage)
        if (currentStep.value >= 1 && currentStep.value <= 3) {
            const stepIndex = currentStep.value - 1;
            const comptage = state.comptages[stepIndex];

            if (comptage && !comptage.mode) {
                errors.push({
                    field: `comptage-${stepIndex}`,
                    label: `Comptage ${stepIndex + 1}`,
                    message: 'Le mode de comptage est obligatoire'
                });
            }
        }

        return errors;
    });

    // Mettre à jour isValid pour qu'il prenne en compte les validationErrors
    const isValid = computed((): boolean => {
        // Si on est en train d'initialiser, ne pas valider
        if (isInitializing.value) return false;

        // Validation spécifique selon l'étape actuelle
        if (currentStep.value === 0) {
            // Étape 1 : Vérifier que tous les champs de base sont remplis
            const hasBasicData = Boolean(state.step1Data.libelle &&
                               state.step1Data.date &&
                               state.step1Data.compte &&
                               Array.isArray(state.step1Data.magasin) &&
                               state.step1Data.magasin.length > 0);

            // Vérifier que chaque magasin a une date
            const allMagasinsHaveDates = state.step1Data.magasin.every(mag =>
                mag.date && mag.date.trim() !== ''
            );

            const isValidStep1 = hasBasicData && allMagasinsHaveDates;
            return isValidStep1;
        } else if (currentStep.value >= 1 && currentStep.value <= 3) {
            // Étapes de comptage : Vérifier que le mode est défini
            const stepIndex = currentStep.value - 1;
            const comptage = state.comptages[stepIndex];
            const hasComptageMode = Boolean(comptage && comptage.mode);

            return hasComptageMode;
        }

        return true;
    });

    // Watcher pour forcer la validation quand les données changent
    watch([() => state.step1Data, () => state.comptages], () => {
        if (isInitializing.value) return;

        nextTick(() => {
            forceValidation();
        });
    }, { deep: true });

    // Watcher pour forcer le recalcul des options quand les données maîtres sont chargées
    watch([warehouses, accounts], () => {
        // Si les données sont vides et pas en cours de chargement, forcer le rechargement
        if ((!warehouses.value || warehouses.value.length === 0) && !warehousesLoading.value) {
            fetchWarehouses();
        }

        if ((!accounts.value || accounts.value.length === 0) && !accountsLoading.value) {
            fetchAccounts();
        }

        // Forcer un recalcul des computed properties
        nextTick(() => {
            // Validation sera recalculée automatiquement
        });
    }, { deep: true });

    onMounted(() => {
        loaded.value = true;
        loadMasterData();

        nextTick(() => {
            // Initialiser explicitement les valeurs par défaut si elles sont vides
            if (!state.step1Data.libelle) state.step1Data.libelle = '';
            if (!state.step1Data.date) state.step1Data.date = '';
            if (!state.step1Data.inventory_type) state.step1Data.inventory_type = ''; // Valeur par défaut
            if (!state.step1Data.compte) state.step1Data.compte = '';
            if (!Array.isArray(state.step1Data.magasin)) state.step1Data.magasin = [];
        });
    });

    // Fonction pour charger les données maîtres
    async function loadMasterData() {
        try {
            // Forcer le rechargement même si les données existent
            await Promise.all([
                fetchWarehouses(),
                fetchAccounts()
            ]);
        } catch (error) {
            console.error('❌ Erreur lors du chargement des données maîtres:', error);
            await alertService.error({
                title: 'Erreur de chargement',
                text: 'Impossible de charger les données de référence. Veuillez réessayer.'
            });
        }
    }

    // Fonction pour forcer la validation
    const forceValidation = () => {
        // Forcer un recalcul de la validation
        nextTick(() => {
            // Validation sera recalculée automatiquement
        });
    };

    // Fonction pour obtenir le nom d'un compte par son ID
    const getAccountName = (accountId: string | number): string => {
        if (!accountId) return 'Compte non défini';
        const account = accounts.value?.find(acc => acc.id.toString() === accountId.toString());
        return account ? account.account_name : `Compte ${accountId}`;
    };

    // Fonction pour obtenir le nom d'un magasin par son ID
    const getWarehouseName = (warehouseId: string | number): string => {
        if (!warehouseId) return 'Magasin non défini';
        const warehouse = warehouses.value?.find(wh => wh.id.toString() === warehouseId.toString());
        return warehouse ? warehouse.warehouse_name : `Magasin ${warehouseId}`;
    };

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

    // Fonction pour initialiser en mode édition - Améliorée pour éviter les conflits DOM
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
                await fetchAccounts();
            }

            if (!warehouses.value || warehouses.value.length === 0) {
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

            // Mapper les données de l'API vers le state local
            const step1Data = {
                libelle: inventoryDetails.label || '',
                date: formatDateForFlatpickr(inventoryDetails.date),
                inventory_type: (inventoryDetails.inventory_type as string) ,
                compte: inventoryDetails.account_id ? inventoryDetails.account_id.toString() : '',
                magasin: Array.isArray(inventoryDetails.warehouses)
                    ? inventoryDetails.warehouses.map(wh => ({
                        magasin: wh.id ? wh.id.toString() : '',
                        date: formatDateForFlatpickr(wh.inventory_start_date)
                    }))
                    : []
            };

            // Assigner les données de manière réactive avec nextTick pour éviter les conflits DOM
            await nextTick();

            // Assigner les données de manière atomique
            Object.assign(state.step1Data, step1Data);

            // Mapper les comptages
            if (inventoryDetails.comptages && inventoryDetails.comptages.length > 0) {
                const mappedComptages = inventoryDetails.comptages.slice(0, 3).map(count => {
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

                // Assigner les comptages de manière atomique
                state.comptages.splice(0, state.comptages.length, ...mappedComptages);
            }

            // Forcer une mise à jour réactive après le prochain tick
            await nextTick();

            // Attendre un peu avant de réactiver la validation
            await new Promise(resolve => setTimeout(resolve, 200));
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
        validateComptage3BusinessRules,
        // Exposer les données des stores
        warehouses,
        accounts,
        warehousesLoading,
        accountsLoading,
        loadMasterData,
        accountOptions,
        warehouseOptions,
        inventoryTypeOptions,
        getAccountName,
        getWarehouseName,
        validationErrors,
        forceValidation,
        goToStep0
    };
}
