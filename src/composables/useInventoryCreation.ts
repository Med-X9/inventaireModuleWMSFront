import { reactive, computed, onMounted, watch } from 'vue';
import { inventoryCreationService } from '@/services/inventoryCreationService';
import type { ComptageConfig, ComptageMode } from '@/interfaces/inventoryCreation';
import type { FieldConfig } from '@/interfaces/form';
import { useWarehouse } from '@/composables/useWarehouse';
import { useAccount } from '@/composables/useAccount';
import { useInventoryStore } from '@/stores/inventory';
import { useWarehouseStore } from '@/stores/warehouse';
import type { CreateInventoryRequest } from '@/models/Inventory';
import { logger } from '@/services/loggerService';
import { Validators } from '@/utils/validators';

export function useInventoryCreation() {
    const state = reactive({
        step: 0,
        header: {
            libelle: '',
            date: '',
            inventory_type: '',
            compte: '',
            magasin: []
        },
        comptages: [
            { mode: '' },
            { mode: '' },
            { mode: '' }
        ] as ComptageConfig[]
    });

    const allowedModeCombinations: ReadonlyArray<Readonly<[ComptageMode, ComptageMode, ComptageMode]>> = [
        ['image de stock', 'par article', 'par article'],
        ['image de stock', 'en vrac', 'en vrac'],
        ['par article', 'par article', 'par article'],
        ['en vrac', 'en vrac', 'en vrac']
    ] as const;

    const normalizeComptageBoolean = (value: boolean | undefined) => value === true;
    const normalizeComptageInputMethod = (value: ComptageConfig['inputMethod']) => value || '';

    const resetComptageOptions = (comptage: ComptageConfig | undefined) => {
        if (!comptage) return;
        comptage.inputMethod = '';
        comptage.saisieQuantite = false;
        comptage.scannerUnitaire = false;
        comptage.dlc = false;
        comptage.numeroSerie = false;
        comptage.numeroLot = false;
        comptage.guideQuantite = false;
        comptage.guideArticle = false;
        comptage.isVariante = false;
        comptage.stock_situation = false;
    };

    const cloneComptageConfig = (source: ComptageConfig, target: ComptageConfig | undefined) => {
        if (!target) return;
        resetComptageOptions(target);
        target.mode = source.mode;
        target.inputMethod = source.inputMethod ?? '';
        target.saisieQuantite = !!source.saisieQuantite;
        target.scannerUnitaire = !!source.scannerUnitaire;
        target.dlc = !!source.dlc;
        target.numeroSerie = !!source.numeroSerie;
        target.numeroLot = !!source.numeroLot;
        target.guideQuantite = !!source.guideQuantite;
        target.guideArticle = !!source.guideArticle;
        target.isVariante = !!source.isVariante;
        target.stock_situation = !!source.stock_situation;
    };

    const cloneSecondComptageToThird = () => {
        const first = state.comptages[0];
        const second = state.comptages[1];
        const third = state.comptages[2];
        if (!first || !second || !third) return;
        if (first.mode !== 'image de stock') return;

        if (!second.mode) {
            resetComptageOptions(third);
            third.mode = '';
            return;
        }

        if (areComptagesIdentical(second, third)) {
            return;
        }

        cloneComptageConfig(second, third);
    };

    // Stores pour les options dynamiques
    const { warehouses, fetchWarehouses } = useWarehouse();
    const { accounts, fetchAccounts } = useAccount();
    const inventoryStore = useInventoryStore();
    const warehouseStore = useWarehouseStore();

    // Options dynamiques
    const accountOptions = computed(() =>
        (accounts.value || []).map(acc => ({
            label: acc.account_name || `Compte ${acc.id}`,
            value: acc.id.toString()
        }))
    );
    const warehouseOptions = computed(() =>
        (warehouses.value || []).map(wh => ({
            label: wh.warehouse_name || `Magasin ${wh.id}`,
            value: wh.id.toString()
            }))
        );

    // Champs de l'en-tête d'inventaire
    const headerFields = computed<FieldConfig[]>(() => [
        { key: 'libelle', label: 'Libellé', type: 'text', required: true },
        { key: 'date', label: 'Date', type: 'date', required: true },
        {
            key: 'inventory_type', label: 'Type', type: 'select', options: [
                { label: 'Général', value: 'GENERAL' },
                { label: 'Tournant', value: 'TOURNANT' }
            ], required: true
        },
        { key: 'compte', label: 'Compte', type: 'select', options: accountOptions.value, required: true },
        { key: 'magasin', label: 'Magasin', type: 'multi-select-with-dates', options: warehouseOptions.value, required: true, multiple: true, dateLabel: 'Dates par magasin' }
    ]);

    // Champs dynamiques pour chaque étape de comptage
    function getFields(step: number): FieldConfig[] {
        const stepConfig = getStepConfig(step);
        const mode = state.comptages[step].mode;
        const options = getOptions(step);
        const fields: FieldConfig[] = [
            {
                key: 'mode',
                label: 'Mode de comptage',
                type: 'select',
                options: stepConfig.modes.map(m => ({ label: m, value: m })),
                required: true
            }
        ];

        if (mode === 'en vrac') {
            fields.push({
                key: 'inputMethod',
                label: 'Méthode opératoire',
                type: 'radio-group',
                radioOptions: [
                    { label: 'Saisie quantité', value: 'saisie' },
                    { label: 'Scanner unitaire', value: 'scanner' }
                ],
                required: true
            });

            // Ajouter les checkboxes pour les options du mode "en vrac"
            const optionLabels: Record<string, string> = {
                'guideQuantite': 'Guide quantité',
                'saisieQuantite': 'Saisie quantité',
                'scannerUnitaire': 'Scanner unitaire'
            };

            for (const opt of options) {
                if (opt !== 'saisieQuantite' && opt !== 'scannerUnitaire') { // Éviter les doublons
                    fields.push({
                        key: opt,
                        label: optionLabels[opt] || opt,
                        type: 'checkbox'
                    });
                }
            }
        } else if (mode === 'par article') {
            // Amélioration des libellés pour le mode "par article"
            const optionLabels: Record<string, string> = {
                'dlc': 'Date limite de consommation (DLC)',
                'numeroSerie': 'Numéro de série',
                'numeroLot': 'Numéro de lot',
                'guideQuantite': 'Guide quantité',
                'guideArticle': 'Guide article',
                'isVariante': 'Gestion des variantes'
            };

            const currentComptage = state.comptages[step];
            const numeroSerieSelected = currentComptage.numeroSerie;
            const numeroLotSelected = currentComptage.numeroLot;
            const dlcSelected = currentComptage.dlc;

            for (const opt of options) {
                let disabled = false;

                // Désactiver lot et DLC si numéro de série est sélectionné
                if (numeroSerieSelected && (opt === 'numeroLot' || opt === 'dlc')) {
                    disabled = true;
                }

                // Désactiver numéro de série si lot ou DLC sont sélectionnés
                if (opt === 'numeroSerie' && (numeroLotSelected || dlcSelected)) {
                    disabled = true;
                }

                // Les options guideQuantite et guideArticle ne sont jamais désactivées
                if (opt === 'guideQuantite' || opt === 'guideArticle') {
                    disabled = false;
                }

                fields.push({
                    key: opt,
                    label: optionLabels[opt] || opt,
                    type: 'checkbox',
                    props: { disabled: disabled }
                });
            }
        } else if (mode === 'image de stock') {
            for (const opt of options) {
                fields.push({
                    key: opt,
                    label: opt,
                    type: 'checkbox'
                });
            }
        }
        return fields;
    }

    // Synchronisation inputMethod <-> saisieQuantite/scannerUnitaire
    watch(
        () => state.comptages.map(c => c.inputMethod),
        (inputMethods) => {
            state.comptages.forEach((c, idx) => {
                if (c.mode === 'en vrac') {
                    if (c.inputMethod === 'saisie') {
                        c.saisieQuantite = true;
                        c.scannerUnitaire = false;
                    } else if (c.inputMethod === 'scanner') {
                        c.saisieQuantite = false;
                        c.scannerUnitaire = true;
                    } else {
                        c.saisieQuantite = false;
                        c.scannerUnitaire = false;
                    }
                }
            });
        },
        { deep: true }
    );

    // Règles métier pour le mode "par article" - Version simplifiée
    watch(
        () => state.comptages.map(c => ({
            mode: c.mode,
            numeroSerie: c.numeroSerie,
            numeroLot: c.numeroLot,
            dlc: c.dlc,
            isVariante: c.isVariante
        })),
        (comptages, oldComptages) => {
            comptages.forEach((c, idx) => {
                if (c.mode === 'par article') {
                    const comptage = state.comptages[idx];
                    const oldComptage = oldComptages?.[idx];

                    // Appliquer les règles de combinaison seulement si on coche une option
                    if (comptage.numeroSerie) {
                        // Règle 1: Si numéro de série est sélectionné, désactiver DLC et numéro de lot
                        comptage.dlc = false;
                        comptage.numeroLot = false;
                    }

                    // Règle 2: Si numéro de lot est sélectionné, désactiver numéro de série
                    if (comptage.numeroLot && comptage.numeroSerie) {
                        comptage.numeroSerie = false;
                    }

                    // Règle 3: Si DLC est sélectionné, désactiver numéro de série
                    if (comptage.dlc && comptage.numeroSerie) {
                        comptage.numeroSerie = false;
                    }
                }
            });
        },
        { deep: true }
    );

    // Watcher pour réactiver les options quand on décoche une checkbox
    watch(
        () => state.comptages.map(c => ({
            mode: c.mode,
            numeroSerie: c.numeroSerie,
            numeroLot: c.numeroLot,
            dlc: c.dlc,
            isVariante: c.isVariante
        })),
        (comptages, oldComptages) => {
            comptages.forEach((c, idx) => {
                if (c.mode === 'par article' && oldComptages) {
                    const comptage = state.comptages[idx];
                    const oldComptage = oldComptages[idx];

                    // Si on a décocher une option, réactiver toutes les autres
                    if (oldComptage) {
                        // Si on a décocher numéro de série, réactiver DLC et numéro de lot
                        if (oldComptage.numeroSerie && !comptage.numeroSerie) {
                            // Les options DLC et numéro de lot deviennent disponibles
                            // (elles ne sont plus désactivées par le watcher précédent)
                        }
                        // Si on a décocher numéro de lot, réactiver numéro de série
                        if (oldComptage.numeroLot && !comptage.numeroLot) {
                            // L'option numéro de série devient disponible
                        }
                        // Si on a décocher DLC, réactiver numéro de série
                        if (oldComptage.dlc && !comptage.dlc) {
                            // L'option numéro de série devient disponible
                        }
                    }
                }
            });
        },
        { deep: true }
    );

    // Règle métier pour le mode "image de stock"
    watch(
        () => state.comptages.map(c => c.mode),
        (modes) => {
            modes.forEach((mode, idx) => {
                if (mode === 'image de stock') {
                    const comptage = state.comptages[idx];
                    comptage.stock_situation = true;
                    comptage.guideQuantite = false;
                    comptage.guideArticle = false;
                    comptage.saisieQuantite = false;
                    comptage.scannerUnitaire = false;
                    comptage.numeroSerie = false;
                    comptage.numeroLot = false;
                    comptage.dlc = false;
                    comptage.isVariante = false;
                } else {
                    const comptage = state.comptages[idx];
                    if (comptage) {
                        comptage.stock_situation = false;
                    }
                }
            });
            cloneSecondComptageToThird();
        },
        { deep: true }
    );

    watch(() => state.comptages[0].mode, () => {
        cloneSecondComptageToThird();
    }, { immediate: true });

    watch(() => state.comptages[1], () => {
        cloneSecondComptageToThird();
    }, { deep: true });

    watch(() => state.comptages[2], () => {
        if (state.comptages[0]?.mode === 'image de stock') {
            cloneSecondComptageToThird();
        }
    }, { deep: true });

    function setMode(step: number, mode: ComptageMode) {
        const comptage = state.comptages[step];
        if (!comptage) return;

        if (comptage.mode !== mode) {
            resetComptageOptions(comptage);
        }
        comptage.mode = mode;

        if (mode === 'image de stock') {
            comptage.stock_situation = true;
            comptage.guideQuantite = false;
            comptage.guideArticle = false;
            comptage.saisieQuantite = false;
            comptage.scannerUnitaire = false;
            comptage.numeroSerie = false;
            comptage.numeroLot = false;
            comptage.dlc = false;
            comptage.isVariante = false;
            comptage.inputMethod = undefined;
        } else {
            comptage.stock_situation = false;
        }

        if (step === 0 && mode === 'image de stock') {
            cloneSecondComptageToThird();
        }

        if (step === 1 && state.comptages[0]?.mode === 'image de stock') {
            cloneSecondComptageToThird();
        }

        if (step === 2 && state.comptages[0]?.mode === 'image de stock') {
            cloneSecondComptageToThird();
        }
    }

    function getStepConfig(step: number) {
        const prev = state.comptages.map(c => c.mode) as ComptageMode[];
        return inventoryCreationService.getStepConfig(step, prev);
    }

    function getOptions(step: number) {
        const mode = state.comptages[step].mode as ComptageMode;
        return inventoryCreationService.getOptionsForMode(mode);
    }

    // Fonction de création d'inventaire
    async function createInventory() {
        try {
            // Vérifier que des warehouses sont sélectionnés
            if (!state.header.magasin || state.header.magasin.length === 0) {
                throw new Error('Aucun magasin sélectionné. Veuillez sélectionner au moins un magasin.');
            }

            // Préparer les données pour l'API
            const warehouseData = state.header.magasin.map((m: any) => {

                // Si c'est un objet avec item (format MultiSelectWithDates)
                if (typeof m === 'object' && m.item) {
                    const result = {
                        id: Number(m.item),
                        date: m.date || ''
                    };
                    return result;
                }

                // Si c'est un objet avec value et date
                if (typeof m === 'object' && m.value) {
                    const result = {
                        id: Number(m.value),
                        date: m.date || ''
                    };
                    return result;
                }

                // Si c'est un objet avec id et date
                if (typeof m === 'object' && m.id) {
                    const result = {
                        id: Number(m.id),
                        date: m.date || ''
                    };
                    return result;
                }

                // Si c'est une chaîne (ID direct)
                if (typeof m === 'string') {
                    const result = {
                        id: Number(m),
                        date: ''
                    };
                    return result;
                }

                // Si c'est un objet avec warehouse_id
                if (typeof m === 'object' && m.warehouse_id) {
                    const result = {
                        id: Number(m.warehouse_id),
                        date: m.date || ''
                    };
                    return result;
                }

                return { id: 0, date: '' };
            }).filter(w => w.id > 0); // Filtrer les warehouses invalides

            // Créer les comptages
            const comptages = state.comptages
                .filter(c => c.mode) // Filtrer les comptages vides
                .map((comptage, index) => createCountRequest(comptage, index + 1));

            // Valider les comptages avant création
            try {
                inventoryCreationService.validateAllCounts(comptages);
            } catch (validationError) {
                logger.error('Erreur de validation des comptages', validationError);
                throw new Error(`Validation des comptages échouée: ${validationError instanceof Error ? validationError.message : 'Erreur inconnue'}`);
            }

            const inventoryData: CreateInventoryRequest = {
                label: state.header.libelle,
                date: state.header.date,
                inventory_type: state.header.inventory_type,
                account_id: Number(state.header.compte),
                warehouse: warehouseData,
                comptages: comptages
            };

            // Validation métier stricte complète
            try {
                inventoryCreationService.validateInventoryData(inventoryData);
            } catch (validationError) {
                logger.error('Erreur de validation métier', validationError);
                throw new Error(`Validation métier échouée: ${validationError instanceof Error ? validationError.message : 'Erreur inconnue'}`);
            }

            const result = await inventoryStore.createInventory(inventoryData);

            return result;
        } catch (error) {
            logger.error('Erreur lors de la création de l\'inventaire', error);
            // Extraire le message d'erreur backend pour le propager
            const errorMessage = Validators.extractBackendError(error, 'Erreur lors de la création de l\'inventaire');
            // Créer une nouvelle erreur avec le message extrait pour garantir qu'il sera affiché
            const enhancedError = new Error(errorMessage);
            // Préserver la stack trace originale si disponible
            if (error instanceof Error) {
                enhancedError.stack = error.stack;
            }
            throw enhancedError;
        }
    }

    // Fonction de modification d'inventaire
    async function updateInventory(inventoryId: number | string) {
        try {
            // Préparer les données pour l'API (sans comptages pour éviter les problèmes de type)
            const inventoryData = {
                label: state.header.libelle,
                date: state.header.date,
                inventory_type: state.header.inventory_type,
                account_id: Number(state.header.compte),
                warehouse: state.header.magasin.map((m: any) => {

                    // Si c'est un objet avec value et date
                    if (typeof m === 'object' && m.value) {
                        return {
                            id: Number(m.value),
                            date: m.date || ''
                        };
                    }

                    // Si c'est un objet avec id et date
                    if (typeof m === 'object' && m.id) {
                        return {
                            id: Number(m.id),
                            date: m.date || ''
                        };
                    }

                    // Si c'est une chaîne (ID direct)
                    if (typeof m === 'string') {
            return {
                            id: Number(m),
                            date: ''
                        };
                    }

                    // Si c'est un objet avec warehouse_id
                    if (typeof m === 'object' && m.warehouse_id) {
                        return {
                            id: Number(m.warehouse_id),
                            date: m.date || ''
                        };
                    }

                    return { id: 0, date: '' };
                }).filter(w => w.id > 0) // Filtrer les warehouses invalides
            };

            const result = await inventoryStore.updateInventory(inventoryId, inventoryData);

            return result;
        } catch (error) {
            logger.error('Erreur lors de la modification de l\'inventaire', error);
            // Extraire le message d'erreur backend pour le propager
            const errorMessage = Validators.extractBackendError(error, 'Erreur lors de la modification de l\'inventaire');
            // Créer une nouvelle erreur avec le message extrait
            const enhancedError = new Error(errorMessage);
            // Préserver la stack trace originale si disponible
            if (error instanceof Error) {
                enhancedError.stack = error.stack;
            }
            throw enhancedError;
        }
    }

    // Fonction pour créer un CreateCountRequest à partir d'un ComptageConfig
    function createCountRequest(comptage: ComptageConfig, order: number) {
        const options = getComptageOptions(comptage);

        const result = {
            order: order,
            count_mode: comptage.mode,
            unit_scanned: options.includes('scanner_unitaire'),
            entry_quantity: options.includes('saisie_quantite'),
            is_variant: options.includes('is_variante'),
            n_lot: options.includes('numero_lot'),
            n_serie: options.includes('numero_serie'),
            dlc: options.includes('dlc'),
            show_product: options.includes('guide_article'),
            stock_situation: false, // Par défaut false
            quantity_show: options.includes('guide_quantite')
        };

        // Mapping spécifique selon le mode
        if (comptage.mode === 'en vrac') {
            // Pour "en vrac", guideQuantite peut être mappé vers stock_situation
            result.stock_situation = options.includes('guide_quantite') || options.includes('stock_situation');
        } else if (comptage.mode === 'par article') {
            // Pour "par article", stock_situation DOIT être false (règle CountingByArticle)
            // guideQuantite est seulement mappé vers quantity_show
            result.stock_situation = false;
        } else if (comptage.mode === 'image de stock') {
            // Pour "image de stock", stock_situation doit être true
            result.quantity_show = false; // Doit être false selon CountingByStockImage
            result.stock_situation = true; // Doit être true selon CountingByStockImage
        }

        return result;
    }

    // Fonction utilitaire pour extraire les options d'un comptage
    function getComptageOptions(comptage: ComptageConfig) {
        const options: string[] = [];

        if (comptage.mode === 'en vrac') {
            if (comptage.saisieQuantite) options.push('saisie_quantite');
            if (comptage.scannerUnitaire) options.push('scanner_unitaire');
            if (comptage.guideQuantite) options.push('guide_quantite');
            // guideArticle n'est pas disponible pour le mode "en vrac"
        } else if (comptage.mode === 'par article') {
            if (comptage.numeroSerie) options.push('numero_serie');
            if (comptage.numeroLot) options.push('numero_lot');
            if (comptage.dlc) options.push('dlc');
            if (comptage.guideQuantite) options.push('guide_quantite');
            if (comptage.guideArticle) options.push('guide_article');
            if (comptage.isVariante) options.push('is_variante');
        } else if (comptage.mode === 'image de stock') {
            // Pour image de stock, selon CountingByStockImage :
            // - stock_situation doit être true
            // - Tous les autres champs doivent être false
            // On ne génère que stock_situation, les autres seront false par défaut
            options.push('stock_situation');
        }

        return options;
    }

    // Fonction pour valider un comptage en temps réel
    function validateComptage(step: number): boolean {
        const comptage = state.comptages[step];
        if (!comptage.mode) return true; // Pas de validation si pas de mode

        try {
            // Utiliser validateComptage qui prend un ComptageConfig directement
            // Cette méthode fait la conversion et la validation complète
            inventoryCreationService.validateComptage(comptage);
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorDetails = {
                step: step + 1,
                mode: comptage.mode,
                comptage: JSON.parse(JSON.stringify(comptage)),
                errorMessage,
                errorName: error instanceof Error ? error.name : 'UnknownError',
                errorStack: error instanceof Error ? error.stack : undefined
            };

            logger.error(`[validateComptage] Erreur de validation du comptage ${step + 1}`, errorDetails);
            return false;
        }
    }

    // Fonction pour valider tous les comptages
    function validateAllComptages(): boolean {
        const errors: string[] = [];

        state.comptages.forEach((comptage, index) => {
            if (comptage.mode && !validateComptage(index)) {
                errors.push(`Comptage ${index + 1}: Configuration invalide`);
            }
        });

        if (errors.length > 0) {
            return false;
        }

        return true;
    }

    // Fonction de validation métier en temps réel
    function validateBusinessRules(): string[] {
        const errors: string[] = [];

        // Vérifier qu'il y a exactement 3 comptages avec mode
        const comptagesWithMode = state.comptages.filter(c => c.mode);
        if (comptagesWithMode.length !== 3) {
            errors.push('Un inventaire doit contenir exactement 3 comptages');
            return errors;
        }

        // Vérifier que la combinaison des modes est autorisée
        const modes = state.comptages.slice(0, 3).map(c => c.mode as ComptageMode);
        if (!isAllowedModeCombination(modes)) {
            errors.push(
                'Combinaison des modes invalide. Combinaisons autorisées : ' +
                'image de stock > par article > par article, ' +
                'image de stock > en vrac > en vrac, ' +
                'par article > par article > par article, ' +
                'en vrac > en vrac > en vrac.'
            );
            return errors;
        }

        const [first, second, third] = state.comptages;

        if (first.mode === 'image de stock') {
            if (!second.mode || !third.mode) {
                errors.push('Avec "image de stock" en premier, les 2e et 3e comptages doivent être définis.');
            } else if (second.mode !== third.mode || !areComptagesIdentical(second, third)) {
                errors.push('Lorsque le premier comptage est "image de stock", les 2e et 3e comptages doivent être identiques (mode et options).');
            }
        }

        // Validation spécifique du 3e comptage selon les nouvelles règles
        const firstOptions = getComptageOptions(state.comptages[0]);
        const secondOptions = getComptageOptions(state.comptages[1]);
        const thirdOptions = getComptageOptions(state.comptages[2]);

        // Vérifier que les options du 3e correspondent à celles du 1er OU du 2e
        const matchesFirst = areOptionsIdentical(thirdOptions, firstOptions);
        const matchesSecond = areOptionsIdentical(thirdOptions, secondOptions);

        if (!matchesFirst && !matchesSecond) {
            errors.push('Les options du 3e comptage doivent être identiques à celles du 1er OU du 2e comptage');
        }

        return errors;
    }

    // Fonction pour comparer si deux comptages sont identiques
    function areComptagesIdentical(comptage1: ComptageConfig, comptage2: ComptageConfig): boolean {
        // Vérifier que les modes sont identiques
        if (comptage1.mode !== comptage2.mode) {
            return false;
        }

        // Si les modes sont identiques, vérifier les options selon le mode
        if (comptage1.mode === 'en vrac') {
            return (
                normalizeComptageInputMethod(comptage1.inputMethod) === normalizeComptageInputMethod(comptage2.inputMethod) &&
                normalizeComptageBoolean(comptage1.saisieQuantite) === normalizeComptageBoolean(comptage2.saisieQuantite) &&
                normalizeComptageBoolean(comptage1.scannerUnitaire) === normalizeComptageBoolean(comptage2.scannerUnitaire) &&
                normalizeComptageBoolean(comptage1.guideQuantite) === normalizeComptageBoolean(comptage2.guideQuantite)
                // guideArticle n'est pas comparé pour le mode "en vrac"
            );
        } else if (comptage1.mode === 'par article') {
            return (
                normalizeComptageBoolean(comptage1.numeroSerie) === normalizeComptageBoolean(comptage2.numeroSerie) &&
                normalizeComptageBoolean(comptage1.numeroLot) === normalizeComptageBoolean(comptage2.numeroLot) &&
                normalizeComptageBoolean(comptage1.dlc) === normalizeComptageBoolean(comptage2.dlc) &&
                normalizeComptageBoolean(comptage1.guideQuantite) === normalizeComptageBoolean(comptage2.guideQuantite) &&
                normalizeComptageBoolean(comptage1.guideArticle) === normalizeComptageBoolean(comptage2.guideArticle) &&
                normalizeComptageBoolean(comptage1.isVariante) === normalizeComptageBoolean(comptage2.isVariante)
            );
        }

        // Pour image de stock, toujours identiques car pas d'options
        return true;
    }

    // Fonction pour réinitialiser le formulaire avec les valeurs par défaut
    function resetForm() {
        state.header = {
            libelle: 'Inventaire ' + new Date().toLocaleDateString('fr-FR'),
            date: new Date().toISOString().split('T')[0],
            inventory_type: 'GENERAL',
            compte: '',
            magasin: []
        };

        state.comptages = [
            { mode: '' },
            { mode: '' },
            { mode: '' }
        ];

        state.step = 0;
    }

    // Fonction pour charger un inventaire existant
    function loadInventory(inventoryData: any) {
        // Charger les données d'en-tête
        state.header = {
            libelle: inventoryData.libelle || '',
            date: inventoryData.date || '',
            inventory_type: inventoryData.inventory_type || '',
            compte: inventoryData.account_id?.toString() || '',
            magasin: inventoryData.warehouses || []
        };

        // Charger les configurations de comptage
        if (inventoryData.comptage_configs) {
            inventoryData.comptage_configs.forEach((config: any, index: number) => {
                if (index < state.comptages.length) {
                    state.comptages[index] = {
                        mode: config.mode || '',
                        ...parseComptageOptions(config.options || [])
                    };
                }
            });
        }
    }

    // Fonction utilitaire pour parser les options de comptage
    function parseComptageOptions(options: string[]) {
        const parsed: any = {};

        options.forEach(option => {
            switch (option) {
                case 'saisie_quantite':
                    parsed.saisieQuantite = true;
                    parsed.inputMethod = 'saisie';
                    break;
                case 'scanner_unitaire':
                    parsed.scannerUnitaire = true;
                    parsed.inputMethod = 'scanner';
                    break;
                case 'guide_quantite':
                    parsed.guideQuantite = true;
                    break;
                case 'numero_serie':
                    parsed.numeroSerie = true;
                    break;
                case 'numero_lot':
                    parsed.numeroLot = true;
                    break;
                case 'dlc':
                    parsed.dlc = true;
                    break;
                case 'guide_article':
                    parsed.guideArticle = true;
                    break;
                case 'is_variante':
                    parsed.isVariante = true;
                    break;
            }
        });

        return parsed;
    }

    // Watcher pour charger les magasins quand un compte est sélectionné
    watch(
        () => state.header.compte,
        async (newAccountId, oldAccountId) => {
            // Si un compte est sélectionné, charger les magasins pour ce compte
            if (newAccountId && newAccountId !== oldAccountId) {
                const accountId = Number(newAccountId);
                if (!isNaN(accountId)) {
                    await fetchWarehouses(accountId);
                    // Réinitialiser les magasins sélectionnés quand le compte change
                    state.header.magasin = [];
                }
            } else if (!newAccountId) {
                // Si aucun compte n'est sélectionné, vider la liste des magasins et les sélections
                warehouseStore.warehouses = [];
                state.header.magasin = [];
            }
        }
    );

    onMounted(() => {
        // S'assurer que les magasins sont vides par défaut
        warehouseStore.warehouses = [];
        state.header.magasin = [];
        fetchAccounts();
    });

    // Watcher pour appliquer les nouvelles règles de validation en temps réel
    watch(
        () => state.comptages.map(c => ({
            mode: c.mode,
            numeroSerie: c.numeroSerie,
            numeroLot: c.numeroLot,
            dlc: c.dlc,
            isVariante: c.isVariante,
            saisieQuantite: c.saisieQuantite,
            scannerUnitaire: c.scannerUnitaire,
            guideQuantite: c.guideQuantite,
            guideArticle: c.guideArticle
        })),
        (comptages) => {
            // Application automatique des règles de combinaison
            // Validation des options du 3e comptage
            if (comptages.length >= 3 && comptages[2].mode) {
                const modes = state.comptages.slice(0, 3).map(c => c.mode as ComptageMode);
                if (modes.every(Boolean) && !isAllowedModeCombination(modes)) {
                    logger.warn('[useInventoryCreation] Combinaison de modes invalide détectée', { modes });
                }

                // Vérifier que les options du 3e comptage correspondent au 1er OU 2e
                const firstOptions = getComptageOptions(state.comptages[0]);
                const secondOptions = getComptageOptions(state.comptages[1]);
                const thirdOptions = getComptageOptions(state.comptages[2]);

                // Si les options du 3e ne correspondent ni au 1er ni au 2e,
                // on peut automatiquement les ajuster ou afficher un avertissement
                const matchesFirst = areOptionsIdentical(thirdOptions, firstOptions);
                const matchesSecond = areOptionsIdentical(thirdOptions, secondOptions);

                if (!matchesFirst && !matchesSecond && thirdOptions.length > 0) {
                    // Optionnel : Afficher un avertissement ou ajuster automatiquement
                    logger.warn('Les options du 3e comptage doivent correspondre au 1er OU 2e comptage');
                }
            }
        },
        { deep: true }
    );

    // Fonction utilitaire pour comparer les options
    function areOptionsIdentical(options1: string[], options2: string[]): boolean {
        if (options1.length !== options2.length) return false;
        return options1.every((option, index) => option === options2[index]);
    }

    function isAllowedModeCombination(modes: Array<ComptageMode | ''>): boolean {
        if (modes.length < 3 || modes.some(mode => !mode)) {
            return false;
        }
        return allowedModeCombinations.some(combo =>
            combo.every((mode, index) => mode === modes[index])
        );
    }

    return {
        state,
        setMode,
        getStepConfig,
        getOptions,
        headerFields,
        getFields,
        createInventory,
        updateInventory,
        loadInventory,
        resetForm,
        validateComptage,
        validateAllComptages,
        validateBusinessRules,
        accountOptions,
        warehouseOptions
    };
}
