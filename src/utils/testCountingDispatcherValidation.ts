// Fichier de test pour vérifier la validation avec CountingDispatcher
import { CountingDispatcher } from '@/usecases/CountingDispatcher';
import { CountingValidationError } from '@/usecases/CountingByArticle';
import type { Count } from '@/models/Count';
import type { ComptageConfig } from '@/interfaces/inventoryCreation';

export function testCountingDispatcherValidation() {
    console.log('🧪 Test de validation avec CountingDispatcher...');

    // Test 1: Validation d'un comptage "par article" valide
    const validArticleCount: Count = {
        id: null,
        reference: null,
        order: 1,
        count_mode: 'par article',
        unit_scanned: false,
        entry_quantity: false,
        is_variant: false,
        stock_situation: false,
        quantity_show: true,
        show_product: true,
        dlc: true,
        n_serie: false,
        n_lot: true,
        inventory: 0,
        created_at: '',
        updated_at: ''
    };

    try {
        CountingDispatcher.validateCount(validArticleCount);
        console.log('✅ Test 1 réussi: Comptage "par article" valide');
    } catch (error) {
        console.error('❌ Test 1 échoué:', error);
    }

    // Test 2: Validation d'un comptage "par article" invalide (n_serie et n_lot simultanément)
    const invalidArticleCount: Count = {
        ...validArticleCount,
        n_serie: true,
        n_lot: true
    };

    try {
        CountingDispatcher.validateCount(invalidArticleCount);
        console.error('❌ Test 2 échoué: Devrait avoir échoué');
    } catch (error) {
        if (error instanceof CountingValidationError) {
            console.log('✅ Test 2 réussi: Erreur détectée pour n_serie et n_lot simultanés');
            console.log('📝 Message d\'erreur:', error.message);
        } else {
            console.error('❌ Test 2 échoué: Type d\'erreur incorrect');
        }
    }

    // Test 3: Validation d'un comptage "en vrac" valide
    const validBulkCount: Count = {
        id: null,
        reference: null,
        order: 2,
        count_mode: 'en vrac',
        unit_scanned: true,
        entry_quantity: false,
        is_variant: false,
        stock_situation: false,
        quantity_show: true,
        show_product: false,
        dlc: false,
        n_serie: false,
        n_lot: false,
        inventory: 0,
        created_at: '',
        updated_at: ''
    };

    try {
        CountingDispatcher.validateCount(validBulkCount);
        console.log('✅ Test 3 réussi: Comptage "en vrac" valide');
    } catch (error) {
        console.error('❌ Test 3 échoué:', error);
    }

    // Test 4: Validation d'un comptage "en vrac" invalide (unit_scanned et entry_quantity simultanément)
    const invalidBulkCount: Count = {
        ...validBulkCount,
        unit_scanned: true,
        entry_quantity: true
    };

    try {
        CountingDispatcher.validateCount(invalidBulkCount);
        console.error('❌ Test 4 échoué: Devrait avoir échoué');
    } catch (error) {
        if (error instanceof CountingValidationError) {
            console.log('✅ Test 4 réussi: Erreur détectée pour unit_scanned et entry_quantity simultanés');
            console.log('📝 Message d\'erreur:', error.message);
        } else {
            console.error('❌ Test 4 échoué: Type d\'erreur incorrect');
        }
    }

    // Test 5: Validation d'un comptage "image de stock" valide
    const validStockImageCount: Count = {
        id: null,
        reference: null,
        order: 3,
        count_mode: 'image de stock',
        unit_scanned: false,
        entry_quantity: false,
        is_variant: false,
        stock_situation: true,
        quantity_show: false,
        show_product: false,
        dlc: false,
        n_serie: false,
        n_lot: false,
        inventory: 0,
        created_at: '',
        updated_at: ''
    };

    try {
        CountingDispatcher.validateCount(validStockImageCount);
        console.log('✅ Test 5 réussi: Comptage "image de stock" valide');
    } catch (error) {
        console.error('❌ Test 5 échoué:', error);
    }

    // Test 6: Validation d'un comptage "image de stock" invalide (stock_situation false)
    const invalidStockImageCount: Count = {
        ...validStockImageCount,
        stock_situation: false
    };

    try {
        CountingDispatcher.validateCount(invalidStockImageCount);
        console.error('❌ Test 6 échoué: Devrait avoir échoué');
    } catch (error) {
        if (error instanceof CountingValidationError) {
            console.log('✅ Test 6 réussi: Erreur détectée pour stock_situation false');
            console.log('📝 Message d\'erreur:', error.message);
        } else {
            console.error('❌ Test 6 échoué: Type d\'erreur incorrect');
        }
    }

    console.log('🎯 Tests de validation CountingDispatcher terminés !');
}

// Fonction pour tester la conversion ComptageConfig -> Count
export function testComptageConfigConversion() {
    console.log('🔄 Test de conversion ComptageConfig -> Count...');

    const comptageConfig: ComptageConfig = {
        mode: 'en vrac',
        saisieQuantite: false,
        scannerUnitaire: true,
        guideQuantite: true,
        isVariante: false,
        guideArticle: true,
        dlc: false,
        numeroSerie: false,
        numeroLot: false,
        useScanner: false,
        useSaisie: false
    };

    // Simulation de la conversion (copie de la fonction du composable)
    function convertComptageConfigToCount(comptage: ComptageConfig, order: number): Count {
        let unit_scanned = false;
        let entry_quantity = false;

        if (comptage.mode === 'en vrac') {
            unit_scanned = comptage.scannerUnitaire || comptage.inputMethod === 'scanner';
            entry_quantity = comptage.saisieQuantite || comptage.inputMethod === 'saisie';
        }

        return {
            id: null,
            reference: null,
            order,
            count_mode: comptage.mode,
            unit_scanned,
            entry_quantity,
            is_variant: comptage.isVariante,
            stock_situation: false,
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

    const convertedCount = convertComptageConfigToCount(comptageConfig, 1);
    console.log('📋 ComptageConfig original:', comptageConfig);
    console.log('🔄 Count converti:', convertedCount);

    // Valider le count converti
    try {
        CountingDispatcher.validateCount(convertedCount);
        console.log('✅ Conversion et validation réussies !');
    } catch (error) {
        console.error('❌ Erreur de validation après conversion:', error);
    }
}

// Exporter pour utilisation dans la console du navigateur
if (typeof window !== 'undefined') {
    (window as any).testCountingDispatcherValidation = testCountingDispatcherValidation;
    (window as any).testComptageConfigConversion = testComptageConfigConversion;
}
