/**
 * Service de création d'inventaire
 *
 * Ce service gère toute la logique métier pour la création d'inventaires :
 * - Validation des données d'entrée
 * - Validation des comptages selon les règles métier
 * - Gestion des modes de comptage disponibles
 * - Validation des combinaisons d'options pour "par article"
 * - Conversion des données entre différents formats
 *
 * @author Système d'inventaire
 * @version 1.0.0
 */
import type { ComptageMode, StepConfig, ComptageConfig, InventoryCreationState } from '@/interfaces/inventoryCreation';
import { CountingDispatcher } from '@/usecases/CountingDispatcher';
import type { Count } from '@/models/Count';
import type { CreateInventoryRequest } from '@/models/Inventory';

const ALLOWED_MODE_COMBINATIONS: ReadonlyArray<Readonly<[ComptageMode, ComptageMode, ComptageMode]>> = [
    ['image de stock', 'par article', 'par article'],
    ['image de stock', 'en vrac', 'en vrac'],
    ['par article', 'par article', 'par article'],
    ['en vrac', 'en vrac', 'en vrac']
] as const;

export const inventoryCreationService = {
    /**
     * Obtient la configuration des étapes du wizard de création d'inventaire
     *
     * Détermine les modes de comptage disponibles pour chaque étape selon les choix précédents.
     *
     * @param step - Numéro de l'étape (0, 1, 2)
     * @param prev - Modes choisis dans les étapes précédentes
     * @returns Configuration de l'étape avec modes disponibles
     *
     * @example
     * // Étape 0 : Tous les modes disponibles
     * getStepConfig(0) // { modes: ['image de stock', 'en vrac', 'par article'] }
     *
     * // Étape 1 : Seulement en vrac et par article
     * getStepConfig(1) // { modes: ['en vrac', 'par article'] }
     *
     * // Étape 2 : Dépend des choix précédents
     * getStepConfig(2, ['image de stock', 'en vrac']) // { modes: ['en vrac'] }
     */
    getStepConfig(step: number, prev: ComptageMode[] = []): StepConfig {
        if (step === 0) {
            return {
                step,
                modes: ['image de stock', 'en vrac', 'par article'],
                options: []
            };
        }
        if (step === 1) {
            const firstMode = prev[0];
            if (firstMode === 'par article') {
                return { step, modes: ['par article'], options: [] };
            }
            if (firstMode === 'en vrac') {
                return { step, modes: ['en vrac'], options: [] };
            }
            return {
                step,
                modes: ['en vrac', 'par article'],
                options: []
            };
        }
        if (step === 2) {
            // Logique dépendante des deux premiers modes
            if (prev[0] === 'image de stock') {
                return {
                    step,
                    modes: prev[1] ? [prev[1]] : [],
                    options: []
                };
            }
            if (prev[0] === 'en vrac' && prev[1] === 'en vrac') {
                return {
                    step,
                    modes: ['en vrac'],
                    options: []
                };
            }
            if (prev[0] === 'par article' && prev[1] === 'par article') {
                return {
                    step,
                    modes: ['par article'],
                    options: []
                };
            }
        }
        return { step, modes: [], options: [] };
    },

    /**
     * Obtient les modes disponibles pour une étape donnée selon l'état actuel
     *
     * Cette méthode utilise l'état complet de l'inventaire pour déterminer
     * les modes disponibles de manière plus précise que getStepConfig.
     *
     * @param state - État complet de création d'inventaire
     * @param stepIndex - Index de l'étape (0, 1, 2)
     * @returns Array des modes disponibles pour cette étape
     *
     * @example
     * // Étape 0 : Tous les modes
     * getAvailableModesForStep(state, 0) // ['image de stock', 'en vrac', 'par article']
     *
     * // Étape 1 : Jamais "image de stock"
     * getAvailableModesForStep(state, 1) // ['en vrac', 'par article']
     *
     * // Étape 2 : Dépend des choix précédents
     * getAvailableModesForStep(state, 2) // ['en vrac'] si premier = 'image de stock'
     */
    getAvailableModesForStep(state: InventoryCreationState, stepIndex: number): ComptageMode[] {
        if (stepIndex === 0) {
            // Comptage 1: 3 options
            return [
                'image de stock',
                'en vrac',
                'par article'
            ];
        }

        if (stepIndex === 1) {
            // Comptage 2: 2 options (jamais "image de stock")
            const firstMode = state.comptages[0]?.mode as ComptageMode | undefined;
            if (firstMode === 'par article') {
                return ['par article'];
            }
            if (firstMode === 'en vrac') {
                return ['en vrac'];
            }
            return ['en vrac', 'par article'];
        }

        if (stepIndex === 2) {
            // Comptage 3: dépend des choix précédents
            const firstComptage = state.comptages[0];
            const secondComptage = state.comptages[1];

            if (firstComptage.mode === 'image de stock') {
                // Si Comptage 1 = "image de stock", alors Comptage 3 = valeur de Comptage 2
                return [secondComptage.mode].filter(Boolean) as ComptageMode[];
            }

            if (firstComptage.mode === 'par article' && secondComptage.mode === 'par article') {
                return ['par article'];
            }

            if (firstComptage.mode === 'en vrac' && secondComptage.mode === 'en vrac') {
                return ['en vrac'];
            }

            return [];
        }

        return [];
    },

    /**
     * Obtient les options disponibles pour un mode de comptage donné
     *
     * Les options varient selon le mode :
     * - "par article" : dlc, numeroSerie, numeroLot, isVariante
     * - "en vrac" : guideQuantite, guideArticle, saisieQuantite, scannerUnitaire
     * - "image de stock" : aucune option
     *
     * @param mode - Mode de comptage
     * @returns Array des options disponibles pour ce mode
     *
     * @example
     * getOptionsForMode('par article') // ['dlc', 'numeroSerie', 'numeroLot', 'isVariante']
     * getOptionsForMode('en vrac') // ['guideQuantite', 'guideArticle', 'saisieQuantite', 'scannerUnitaire']
     * getOptionsForMode('image de stock') // []
     */
    getOptionsForMode(mode: ComptageMode): string[] {
        if (mode === 'par article') {
            // Options pour le mode "par article" selon les règles métier
            return ['dlc', 'numeroSerie', 'numeroLot', 'isVariante', 'guideQuantite', 'guideArticle'];
        }
        if (mode === 'en vrac') {
            // Options pour le mode "en vrac" - guideArticle n'est pas disponible
            return ['guideQuantite', 'saisieQuantite', 'scannerUnitaire'];
        }
        if (mode === 'image de stock') {
            return [];
        }
        return [];
    },

    /**
     * Valide les combinaisons d'options pour le mode "par article"
     *
     * Cette méthode implémente les règles métier strictes pour les combinaisons
     * d'options dans le mode "par article". 10 combinaisons sont autorisées (incluant le cas vide).
     *
     * Règles de validation :
     * 1. Toutes les options sont optionnelles (on peut avoir un comptage "par article" sans aucune option)
     * 2. Si des options sont sélectionnées, elles doivent respecter les règles de combinaison :
     *    - Numéro de série et Numéro de lot ne peuvent pas coexister
     *    - Numéro de série et DLC ne peuvent pas coexister
     *    - Numéro de série ne peut être combiné qu'avec Variante
     *
     * Combinaisons valides :
     * - () ✅ (aucune option - toutes les options sont optionnelles)
     * - (n_serie) ✅
     * - (n_serie, variante) ✅
     * - (variante) ✅
     * - (n_lot) ✅
     * - (DLC) ✅
     * - (DLC, n_lot) ✅
     * - (DLC, variante) ✅
     * - (n_lot, variante) ✅
     * - (DLC, n_lot, variante) ✅
     *
     * @param comptageConfig - Configuration du comptage à valider
     * @throws Error si la combinaison n'est pas autorisée
     *
     * @example
     * // Combinaison valide
     * validateParArticleCombination({ mode: 'par article', numeroSerie: true, isVariante: true })
     *
     * // Combinaison invalide - lèvera une erreur
     * validateParArticleCombination({ mode: 'par article', numeroSerie: true, numeroLot: true })
     */
    validateParArticleCombination(comptageConfig: ComptageConfig): void {
        if (comptageConfig.mode !== 'par article') {
            return; // Pas de validation pour les autres modes
        }

        // Normaliser les valeurs : convertir les chaînes vides, null, undefined en false
        const normalizeBoolean = (value: any): boolean => {
            if (value === true || value === 'true') return true;
            if (value === false || value === 'false' || value === '' || value === null || value === undefined) return false;
            return Boolean(value);
        };

        const options = {
            n_serie: normalizeBoolean(comptageConfig.numeroSerie),
            n_lot: normalizeBoolean(comptageConfig.numeroLot),
            dlc: normalizeBoolean(comptageConfig.dlc),
            variante: normalizeBoolean(comptageConfig.isVariante)
        };

        console.log('[validateParArticleCombination] Options normalisées:', options);
        console.log('[validateParArticleCombination] Options brutes:', {
            numeroSerie: comptageConfig.numeroSerie,
            numeroLot: comptageConfig.numeroLot,
            dlc: comptageConfig.dlc,
            isVariante: comptageConfig.isVariante
        });

        // Règles de validation
        const hasNserie = options.n_serie;
        const hasNlot = options.n_lot;
        const hasDlc = options.dlc;
        const hasVariante = options.variante;

        // Règle 1: n_serie et n_lot ne peuvent pas coexister
        if (hasNserie && hasNlot) {
            throw new Error('Les options "Numéro de série" et "Numéro de lot" ne peuvent pas être utilisées ensemble');
        }

        // Règle 2: n_serie et DLC ne peuvent pas coexister
        if (hasNserie && hasDlc) {
            throw new Error('Les options "Numéro de série" et "DLC" ne peuvent pas être utilisées ensemble');
        }

        // Règle 3: n_serie ne peut pas être combiné avec d'autres options sauf variante
        if (hasNserie && (hasNlot || hasDlc)) {
            throw new Error('Le "Numéro de série" ne peut être combiné qu\'avec "Variante"');
        }

        // Combinaisons autorisées selon les spécifications
        // Pour "par article", soit on sélectionne des options selon les règles, soit on ne sélectionne rien
        const validCombinations = [
            { n_serie: false, n_lot: false, dlc: false, variante: false }, // Aucune option (vide) ✅
            { n_serie: true, n_lot: false, dlc: false, variante: false }, // (n_serie) ✅
            { n_serie: true, n_lot: false, dlc: false, variante: true },  // (n_serie, variante) ✅
            { n_serie: false, n_lot: false, dlc: false, variante: true }, // (variante) ✅
            { n_serie: false, n_lot: true, dlc: false, variante: false }, // (n_lot) ✅
            { n_serie: false, n_lot: false, dlc: true, variante: false }, // (DLC) ✅
            { n_serie: false, n_lot: true, dlc: true, variante: false },  // (DLC, n_lot) ✅
            { n_serie: false, n_lot: false, dlc: true, variante: true },  // (DLC, variante) ✅
            { n_serie: false, n_lot: true, dlc: false, variante: true },  // (n_lot, variante) ✅
            { n_serie: false, n_lot: true, dlc: true, variante: true }    // (DLC, n_lot, variante) ✅
        ];

        const currentCombination = { n_serie: hasNserie, n_lot: hasNlot, dlc: hasDlc, variante: hasVariante };
        const isValid = validCombinations.some(valid =>
            valid.n_serie === currentCombination.n_serie &&
            valid.n_lot === currentCombination.n_lot &&
            valid.dlc === currentCombination.dlc &&
            valid.variante === currentCombination.variante
        );

        if (!isValid) {
            throw new Error('Combinaison d\'options non autorisée pour le mode "par article". Combinaisons valides : aucune option (vide), (n_serie), (n_serie, variante), (variante), (n_lot), (DLC), (DLC, n_lot), (DLC, variante), (n_lot, variante), (DLC, n_lot, variante)');
        }
    },

    /**
     * Obtient toutes les combinaisons autorisées pour le mode "par article"
     *
     * Cette méthode retourne la liste complète des 9 combinaisons valides
     * avec leurs labels pour l'affichage dans l'interface utilisateur.
     *
     * @returns Array des combinaisons autorisées avec leurs labels
     *
     * @example
     * const combinations = getValidParArticleCombinations();
     * // Retourne les 9 combinaisons valides avec leurs labels
     */
    getValidParArticleCombinations(): Array<{
        n_serie: boolean;
        n_lot: boolean;
        dlc: boolean;
        variante: boolean;
        label: string;
    }> {
        return [
            { n_serie: true, n_lot: false, dlc: false, variante: false, label: 'Numéro de série' },
            { n_serie: true, n_lot: false, dlc: false, variante: true, label: 'Numéro de série + Variante' },
            { n_serie: false, n_lot: false, dlc: false, variante: true, label: 'Variante' },
            { n_serie: false, n_lot: true, dlc: false, variante: false, label: 'Numéro de lot' },
            { n_serie: false, n_lot: false, dlc: true, variante: false, label: 'DLC' },
            { n_serie: false, n_lot: true, dlc: true, variante: false, label: 'DLC + Numéro de lot' },
            { n_serie: false, n_lot: false, dlc: true, variante: true, label: 'DLC + Variante' },
            { n_serie: false, n_lot: true, dlc: false, variante: true, label: 'Numéro de lot + Variante' },
            { n_serie: false, n_lot: true, dlc: true, variante: true, label: 'DLC + Numéro de lot + Variante' }
        ];
    },

    /**
     * Valide un comptage en utilisant le CountingDispatcher et les règles métier
     *
     * Cette méthode combine :
     * 1. Validation spécifique pour "par article" (combinaisons d'options)
     * 2. Conversion ComptageConfig → Count
     * 3. Validation via CountingDispatcher
     *
     * @param comptageConfig - Configuration du comptage à valider
     * @throws CountingValidationError si les données sont invalides
     *
     * @example
     * validateComptage({
     *   mode: 'par article',
     *   numeroSerie: true,
     *   isVariante: true
     * }); // ✅ Valide
     *
     * validateComptage({
     *   mode: 'par article',
     *   numeroSerie: true,
     *   numeroLot: true
     * }); // ❌ Erreur : combinaison invalide
     */
    validateComptage(comptageConfig: ComptageConfig): void {
        console.log('[validateComptage] Début de validation', { comptageConfig });

        // Validation spécifique pour "par article"
        if (comptageConfig.mode === 'par article') {
            console.log('[validateComptage] Validation des combinaisons "par article"');
            try {
                this.validateParArticleCombination(comptageConfig);
                console.log('[validateComptage] Combinaisons "par article" validées');
            } catch (error) {
                console.error('[validateComptage] Erreur validation combinaisons:', error);
                throw error;
            }
        }

        // Convertir ComptageConfig en Count pour la validation
        const convertedData = this.convertComptageConfigToCount(comptageConfig);
        console.log('[validateComptage] Données converties:', convertedData);

        const countData: Count = {
            id: null,
            reference: null,
            order: 1, // Order par défaut pour la validation (ruleOrderRequired nécessite un order > 0)
            count_mode: comptageConfig.mode,
            unit_scanned: false,
            entry_quantity: false,
            is_variant: false,
            n_lot: false,
            n_serie: false,
            dlc: false,
            show_product: false,
            stock_situation: false,
            quantity_show: false,
            inventory: 0,
            created_at: '',
            updated_at: '',
            ...convertedData
        };

        console.log('[validateComptage] Données finales pour validation:', countData);

        // Utiliser le CountingDispatcher pour valider
        try {
            CountingDispatcher.validateCount(countData);
            console.log('[validateComptage] Validation CountingDispatcher réussie');
        } catch (error) {
            console.error('[validateComptage] Erreur CountingDispatcher:', error);
            console.error('[validateComptage] Données qui ont causé l\'erreur:', countData);
            throw error;
        }
    },

    /**
     * Convertit ComptageConfig en Count pour la validation
     *
     * Cette méthode mappe les propriétés de ComptageConfig vers Count
     * selon le mode de comptage choisi.
     *
     * @param comptageConfig - Configuration du comptage
     * @returns Objet Count partiel avec les propriétés mappées
     *
     * @example
     * // Mode "en vrac"
     * convertComptageConfigToCount({
     *   mode: 'en vrac',
     *   scannerUnitaire: true,
     *   saisieQuantite: false
     * });
     * // Retourne { unit_scanned: true, entry_quantity: false, quantity_show: false }
     *
     * // Mode "par article"
     * convertComptageConfigToCount({
     *   mode: 'par article',
     *   numeroSerie: true,
     *   isVariante: true
     * });
     * // Retourne { n_serie: true, is_variant: true, ... }
     */
    convertComptageConfigToCount(comptageConfig: ComptageConfig): Partial<Count> {
        const countData: Partial<Count> = {};

        switch (comptageConfig.mode) {
            case 'en vrac':
                countData.unit_scanned = comptageConfig.scannerUnitaire;
                countData.entry_quantity = comptageConfig.saisieQuantite;
                countData.quantity_show = comptageConfig.guideQuantite;
                break;

            case 'par article':
                // S'assurer que toutes les valeurs booléennes sont définies (false si undefined)
                countData.is_variant = comptageConfig.isVariante ?? false;
                countData.show_product = comptageConfig.guideArticle ?? false;
                countData.quantity_show = comptageConfig.guideQuantite ?? false;
                countData.dlc = comptageConfig.dlc ?? false;
                countData.n_serie = comptageConfig.numeroSerie ?? false;
                countData.n_lot = comptageConfig.numeroLot ?? false;
                // Pour "par article", ces valeurs doivent toujours être false
                countData.unit_scanned = false;
                countData.entry_quantity = false;
                countData.stock_situation = false;
                break;

            case 'image de stock':
                countData.stock_situation = comptageConfig.stock_situation || false;
                break;
        }

        return countData;
    },

    /**
     * Validation métier stricte des données d'inventaire
     *
     * Cette méthode valide l'ensemble des données d'un inventaire avant création :
     * 1. Validation des données d'entrée (label, date, account_id, etc.)
     * 2. Validation des comptages (modes, combinaisons, règles métier)
     *
     * @param data - Données d'inventaire à valider
     * @throws Error si validation échoue avec la liste des erreurs
     *
     * @example
     * validateInventoryData({
     *   label: 'Inventaire 2024',
     *   date: '2024-01-15',
     *   inventory_type: 'GENERAL',
     *   account_id: 1,
     *   warehouse: [{ id: 1 }],
     *   comptages: [...]
     * }); // ✅ Valide
     */
    validateInventoryData(data: CreateInventoryRequest): void {
        const errors: string[] = [];

        // 1. Validation des données d'entrée
        this._validateInputData(data, errors);

        // 2. Validation des entités (sera fait côté serveur)
        // this._validateEntities(data, errors);

        // 3. Validation des comptages
        this._validateCountings(data.comptages, errors);

        if (errors.length > 0) {
            const errorMessage = `Erreurs de validation:\n${errors.join('\n')}`;
            throw new Error(errorMessage);
        }
    },

    /**
     * Validation des données d'entrée d'un inventaire
     *
     * Valide les champs obligatoires et les formats :
     * - Label obligatoire et non vide
     * - Date obligatoire
     * - Account_id obligatoire
     * - Type d'inventaire valide (GENERAL ou TOURNANT)
     * - Au moins un entrepôt avec ID
     *
     * @param data - Données d'inventaire
     * @param errors - Array des erreurs (modifié par référence)
     *
     * @example
     * const errors = [];
     * _validateInputData(inventoryData, errors);
     * if (errors.length > 0) {
     *   console.log('Erreurs:', errors);
     * }
     */
    _validateInputData(data: CreateInventoryRequest, errors: string[]): void {
        // Champs obligatoires
        if (!data.label || data.label.trim() === '') {
            errors.push('Le label est obligatoire');
        }

        if (!data.date) {
            errors.push('La date est obligatoire');
        }

        if (!data.account_id) {
            errors.push('L\'account_id est obligatoire');
        }

        // Validation du type d'inventaire
        const validTypes = ['GENERAL', 'TOURNANT'];
        if (!data.inventory_type || !validTypes.includes(data.inventory_type)) {
            errors.push(`L'inventory_type doit être 'GENERAL' ou 'TOURNANT' (reçu: ${data.inventory_type})`);
        }

        // Validation des entrepôts
        if (!data.warehouse || !Array.isArray(data.warehouse) || data.warehouse.length === 0) {
            errors.push('Au moins un entrepôt est obligatoire');
        } else {
            // Validation de la structure des entrepôts
            data.warehouse.forEach((warehouse, index) => {
                if (!warehouse.id) {
                    errors.push(`L'entrepôt ${index + 1} doit avoir un ID`);
                }
                // Validation de la date pour chaque magasin
                if (!warehouse.date || warehouse.date.trim() === '') {
                    errors.push(`La date du magasin ${index + 1} est obligatoire`);
                }
            });
        }
    },

    /**
     * Validation stricte des comptages d'un inventaire
     *
     * Valide les règles métier pour les comptages :
     * - Exactement 3 comptages
     * - Ordres 1, 2, 3
     * - Modes valides
     * - Règles de combinaison selon le premier comptage
     *
     * Règles métier :
     * 1. Si premier comptage = "image de stock" → 2e et 3e identiques
     * 2. Si premier comptage ≠ "image de stock" → tous "en vrac" ou "par article"
     *
     * @param comptages - Array des comptages à valider
     * @param errors - Array des erreurs (modifié par référence)
     *
     * @example
     * const errors = [];
     * _validateCountings([
     *   { order: 1, count_mode: 'image de stock' },
     *   { order: 2, count_mode: 'en vrac' },
     *   { order: 3, count_mode: 'en vrac' }
     * ], errors);
     */
    _validateCountings(comptages: any[], errors: string[]): void {
        // Vérifier qu'il y a exactement 3 comptages
        if (!comptages || comptages.length !== 3) {
            errors.push('Un inventaire doit contenir exactement 3 comptages');
            return; // Arrêter la validation si pas 3 comptages
        }

        // Trier les comptages par ordre
        const comptagesSorted = [...comptages].sort((a, b) => (a.order || 0) - (b.order || 0));

        // Vérifier que les ordres sont 1, 2, 3
        const orders = comptagesSorted.map(c => c.order);
        if (JSON.stringify(orders) !== JSON.stringify([1, 2, 3])) {
            errors.push('Les comptages doivent avoir les ordres 1, 2, 3');
        }

        // Récupérer les modes de comptage par ordre
        const countModes = comptagesSorted.map(c => c.count_mode);

        // Vérifier que tous les modes sont valides
        const validModes = ['en vrac', 'par article', 'image de stock'];
        countModes.forEach((mode, index) => {
            if (!mode || !validModes.includes(mode)) {
                errors.push(`Comptage ${index + 1}: Mode de comptage invalide '${mode}'`);
            }
        });

        // Validation des combinaisons autorisées
        const combination = countModes as unknown as Array<ComptageMode>;
        const isAllowedCombination = ALLOWED_MODE_COMBINATIONS.some(allowed =>
            allowed.every((mode, index) => mode === combination[index])
        );

        if (!isAllowedCombination) {
            errors.push(
                'Combinaison des modes invalide. Combinaisons autorisées : ' +
                'image de stock > par article > par article, ' +
                'image de stock > en vrac > en vrac, ' +
                'par article > par article > par article, ' +
                'en vrac > en vrac > en vrac.'
            );
        }

        // Validation des combinaisons autorisées
        const firstMode = countModes[0];
        const secondMode = countModes[1];
        const thirdMode = countModes[2];

        // Scénario 1: Premier comptage = "image de stock"
        if (firstMode === 'image de stock') {
            if (secondMode !== thirdMode) {
                errors.push('Si le premier comptage est \'image de stock\', les 2e et 3e comptages doivent avoir le même mode');
            }
            if (secondMode && !['en vrac', 'par article'].includes(secondMode)) {
                errors.push('Si le premier comptage est \'image de stock\', les 2e et 3e comptages doivent être \'en vrac\' ou \'par article\'');
            }

            // Validation supplémentaire : les 2e et 3e comptages doivent être identiques
            if (secondMode && thirdMode && secondMode === thirdMode) {
                const secondComptage = comptagesSorted[1];
                const thirdComptage = comptagesSorted[2];

                if (!this.areComptagesIdentical(secondComptage, thirdComptage)) {
                    errors.push('Si le premier comptage est \'image de stock\', les 2e et 3e comptages doivent être identiques (même mode et mêmes options)');
                }
            }
        }
        // Scénario 2: Premier comptage = "en vrac" ou "par article"
        else if (firstMode && ['en vrac', 'par article'].includes(firstMode)) {
            countModes.forEach((mode, index) => {
                if (mode && !['en vrac', 'par article'].includes(mode)) {
                    errors.push(`Si le premier comptage n'est pas 'image de stock', tous les comptages doivent être 'en vrac' ou 'par article' (comptage ${index + 1}: '${mode}')`);
                }
            });

            const allParArticle = countModes.every(mode => mode === 'par article');
            const allEnVrac = countModes.every(mode => mode === 'en vrac');

            if (allParArticle) {
                const combinaisonValide =
                    this.areComptagesIdentical(comptagesSorted[0], comptagesSorted[1]) &&
                    this.areComptagesIdentical(comptagesSorted[1], comptagesSorted[2]);
                if (!combinaisonValide) {
                    errors.push('Lorsque tous les comptages sont "par article", les options doivent être identiques pour les 3 comptages.');
                }
            }

            if (allEnVrac) {
                const combinaisonValide =
                    this.areComptagesIdentical(comptagesSorted[0], comptagesSorted[1]) &&
                    this.areComptagesIdentical(comptagesSorted[1], comptagesSorted[2]);
                if (!combinaisonValide) {
                    errors.push('Lorsque tous les comptages sont "en vrac", les options doivent être identiques pour les 3 comptages.');
                }
            }
        }

        // Validation des champs obligatoires pour chaque comptage
        comptagesSorted.forEach((comptage, index) => {
            if (!comptage.order) {
                errors.push(`Comptage ${index + 1}: L'ordre est obligatoire`);
            }
            if (!comptage.count_mode) {
                errors.push(`Comptage ${index + 1}: Le mode de comptage est obligatoire`);
            }
        });
    },

    /**
     * Valide un comptage selon son mode en utilisant le CountingDispatcher
     *
     * Cette méthode délègue la validation au CountingDispatcher qui applique
     * les règles spécifiques à chaque mode de comptage.
     *
     * @param count - Le comptage à valider
     * @throws Error si la validation échoue avec le message d'erreur
     *
     * @example
     * validateCount({
     *   order: 1,
     *   count_mode: 'par article',
     *   n_serie: true,
     *   is_variant: true
     * }); // ✅ Valide
     */
    validateCount(count: Count): void {
        try {
            CountingDispatcher.validateCount(count);
        } catch (error) {
            throw new Error(`Validation du comptage ${count.order} échouée: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
    },

    /**
     * Valide tous les comptages d'un inventaire
     *
     * Cette méthode valide chaque comptage individuellement et collecte
     * toutes les erreurs avant de les lancer.
     *
     * @param comptages - Array de comptages à valider
     * @throws Error si au moins un comptage est invalide avec tous les messages d'erreur
     *
     * @example
     * validateAllCounts([
     *   { order: 1, count_mode: 'en vrac', unit_scanned: true },
     *   { order: 2, count_mode: 'par article', n_serie: true },
     *   { order: 3, count_mode: 'par article', n_lot: true }
     * ]); // ✅ Valide
     */
    validateAllCounts(comptages: Partial<Count>[]): void {
        const errors: string[] = [];

        comptages.forEach((count, index) => {
            try {
                // Créer un objet Count complet pour la validation
                const fullCount: Count = {
                    id: null,
                    reference: null,
                    order: count.order || 0,
                    count_mode: count.count_mode || '',
                    unit_scanned: count.unit_scanned || false,
                    entry_quantity: count.entry_quantity || false,
                    is_variant: count.is_variant || false,
                    n_lot: count.n_lot || false,
                    n_serie: count.n_serie || false,
                    dlc: count.dlc || false,
                    show_product: count.show_product || false,
                    stock_situation: count.stock_situation || false,
                    quantity_show: count.quantity_show || false,
                    inventory: 0,
                    created_at: '',
                    updated_at: ''
                };

                this.validateCount(fullCount);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
                errors.push(`Comptage ${index + 1}: ${errorMessage}`);
            }
        });

        if (errors.length > 0) {
            const errorMessage = `Erreurs de validation:\n${errors.join('\n')}`;
            throw new Error(errorMessage);
        }
    },

    /**
     * Compare si deux comptages sont identiques
     *
     * Cette méthode compare les options de deux comptages selon leur mode :
     * - "en vrac" : compare unit_scanned, entry_quantity, stock_situation, quantity_show, show_product
     * - "par article" : compare n_serie, n_lot, dlc, stock_situation, quantity_show, show_product, is_variant
     * - "image de stock" : toujours identiques (pas d'options)
     *
     * @param comptage1 - Premier comptage à comparer
     * @param comptage2 - Deuxième comptage à comparer
     * @returns true si les comptages sont identiques, false sinon
     *
     * @example
     * areComptagesIdentical(
     *   { count_mode: 'par article', n_serie: true, is_variant: true },
     *   { count_mode: 'par article', n_serie: true, is_variant: true }
     * ); // ✅ true
     *
     * areComptagesIdentical(
     *   { count_mode: 'par article', n_serie: true },
     *   { count_mode: 'par article', n_lot: true }
     * ); // ❌ false
     */
    areComptagesIdentical(comptage1: any, comptage2: any): boolean {
        if (!comptage1 || !comptage2) return false;

        // Comparer les modes
        if (comptage1.mode !== comptage2.mode) return false;

        const normalizeBoolean = (value: any) => value === true;
        const normalizeInputMethod = (value: any) => value || '';

        // Comparer les options selon le mode
        if (comptage1.mode === 'en vrac') {
            return (
                normalizeInputMethod(comptage1.inputMethod) === normalizeInputMethod(comptage2.inputMethod) &&
                normalizeBoolean(comptage1.saisieQuantite) === normalizeBoolean(comptage2.saisieQuantite) &&
                normalizeBoolean(comptage1.scannerUnitaire) === normalizeBoolean(comptage2.scannerUnitaire) &&
                normalizeBoolean(comptage1.guideQuantite) === normalizeBoolean(comptage2.guideQuantite)
            );
        } else if (comptage1.mode === 'par article') {
            return (
                normalizeBoolean(comptage1.numeroSerie) === normalizeBoolean(comptage2.numeroSerie) &&
                normalizeBoolean(comptage1.numeroLot) === normalizeBoolean(comptage2.numeroLot) &&
                normalizeBoolean(comptage1.dlc) === normalizeBoolean(comptage2.dlc) &&
                normalizeBoolean(comptage1.isVariante) === normalizeBoolean(comptage2.isVariante) &&
                normalizeBoolean(comptage1.guideQuantite) === normalizeBoolean(comptage2.guideQuantite) &&
                normalizeBoolean(comptage1.guideArticle) === normalizeBoolean(comptage2.guideArticle)
            );
        }

        return true;
    },

    /**
     * Obtient les options héritées pour le 3e comptage
     */
    getInheritedOptionsForComptage3(state: InventoryCreationState) {
        const [c1, c2] = state.comptages;

        if (!c1 || !c2) return [];

        // Si le 1er comptage est "image de stock", le 3e doit correspondre au 2e
        if (c1.mode === 'image de stock') {
            return this.getOptionsForMode(c2.mode as ComptageMode);
        }

        // Sinon, le 3e peut correspondre au 1er OU au 2e
        const options1 = this.getOptionsForMode(c1.mode as ComptageMode);
        const options2 = this.getOptionsForMode(c2.mode as ComptageMode);

        return [...new Set([...options1, ...options2])];
    },

    /**
     * Obtient les contraintes pour le 3e comptage
     */
    getComptage3Constraints(state: InventoryCreationState) {
        const [c1, c2] = state.comptages;

        if (!c1 || !c2) return [];

        const constraints: string[] = [];

        // Si le 1er comptage est "image de stock", le 3e doit correspondre au 2e
        if (c1.mode === 'image de stock') {
            constraints.push(`Le 3e comptage doit correspondre au 2e comptage (${c2.mode})`);
        } else {
            constraints.push(`Le 3e comptage doit correspondre au 1er OU au 2e comptage`);
        }

        return constraints;
    }
};
