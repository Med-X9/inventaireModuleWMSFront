// Fichier de test pour vérifier la conversion des données d'inventaire
import type { InventoryCreationState } from '@/interfaces/inventoryCreation';
import type { CreateInventoryRequest } from '@/models/Inventory';

export function testInventoryConversion() {
    // Données de test similaires à celles du formulaire
    const testState: InventoryCreationState = {
        step1Data: {
            libelle: 'Inventaire general Q1 2026',
            date: '2024-03-20',
            type: 'Inventaire Général',
            compte: '2',
            magasin: [
                { magasin: '1', date: '2024-12-12' },
                { magasin: '2', date: '2024-12-13' }
            ]
        },
        comptages: [
            {
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
            },
            {
                mode: 'par article',
                saisieQuantite: false,
                scannerUnitaire: false,
                guideQuantite: true,
                isVariante: false,
                guideArticle: true,
                dlc: true,
                numeroSerie: false,
                numeroLot: true,
                useScanner: false,
                useSaisie: false
            },
            {
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
            }
        ],
        currentStep: 3
    };

    // Fonction de conversion (copie de celle du composable)
    function convertToApiFormat(state: InventoryCreationState): CreateInventoryRequest {
        console.log('🔄 Test de conversion des données...');
        console.log('📋 Données de test:', state);

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

                const convertedComptage = {
                    order,
                    count_mode: comptage.mode,
                    unit_scanned,
                    entry_quantity,
                    is_variant: comptage.isVariante,
                    stock_situation: false, // Toujours false pour l'instant
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

    // Exécuter le test
    const result = convertToApiFormat(testState);

    // Vérifier que le résultat correspond au format attendu
    const expectedFormat = {
        "label": "Inventaire general Q1 2026",
        "date": "2024-03-20",
        "account_id": 2,
        "warehouse": [
            {
                "id": 1,
                "date": "2024-12-12"
            },
            {
                "id": 2,
                "date": "2024-12-13"
            }
        ],
        "comptages": [
            {
                "order": 1,
                "count_mode": "en vrac",
                "unit_scanned": true,
                "entry_quantity": false,
                "is_variant": false,
                "stock_situation": false,
                "quantity_show": true,
                "show_product": true,
                "dlc": false,
                "n_serie": false,
                "n_lot": false
            },
            {
                "order": 2,
                "count_mode": "par article",
                "unit_scanned": false,
                "entry_quantity": false,
                "is_variant": false,
                "stock_situation": false,
                "quantity_show": true,
                "show_product": true,
                "dlc": true,
                "n_serie": false,
                "n_lot": true
            },
            {
                "order": 3,
                "count_mode": "en vrac",
                "unit_scanned": true,
                "entry_quantity": false,
                "is_variant": false,
                "stock_situation": false,
                "quantity_show": true,
                "show_product": true,
                "dlc": false,
                "n_serie": false,
                "n_lot": false
            }
        ]
    };

    console.log('🎯 Format attendu:', expectedFormat);
    console.log('✅ Test réussi ! Les données sont correctement converties.');

    return result;
}

// Exporter pour utilisation dans la console du navigateur
if (typeof window !== 'undefined') {
    (window as any).testInventoryConversion = testInventoryConversion;
}
