import { ref, computed } from 'vue';
import type { StoreOption, InventoryResult, ResultAction } from '../interfaces/inventoryResults';
import { inventoryResultsService } from '../services/inventoryResultsService';
import { alertService } from '@/services/alertService';
import IconLancer from '@/components/icon/icon-launch.vue';

export function useInventoryResults(invId: number) {
    const loading = ref(false);
    const stores = ref<StoreOption[]>([]);
    const results = ref<InventoryResult[]>([]);
    const selectedStore = ref<string | null>(null);
    const selectedResults = ref<InventoryResult[]>([]);

    const columns = [
        { headerName: 'Article', field: 'article', sortable: true, filter: 'agTextColumnFilter', editable: false },
        { headerName: 'Emplacement', field: 'emplacement', sortable: true, filter: 'agTextColumnFilter', editable: false },
        { headerName: 'Premier Contage', field: 'premier_contage', sortable: true, filter: 'agNumberColumnFilter', editable: false },
        { headerName: 'Deuxième Contage', field: 'deuxieme_contage', sortable: true, filter: 'agNumberColumnFilter', editable: false },
        { headerName: 'Écart', field: 'ecart', sortable: true, filter: 'agNumberColumnFilter' },
        { headerName: 'Troisième Contage', field: 'troisieme_contage', sortable: true, filter: 'agNumberColumnFilter', editable: false },
        {
            headerName: 'Résultats', field: 'resultats', sortable: true, filter: 'agTextColumnFilter', editable: true, cellEditor: 'agNumberCellEditor',
            valueParser: params => Number(params.newValue),
        },
    ];

    const fetchStores = async () => {
        try {
            loading.value = true;
            stores.value = await inventoryResultsService.getStoreOptionsForInventory(invId);
        } catch (error) {
            await alertService.error({ text: "Erreur lors du chargement des magasins" });
        } finally {
            loading.value = false;
        }
    };

    const fetchResults = async (storeId: string) => {
        try {
            loading.value = true;
            results.value = await inventoryResultsService.getResultsForInventoryAndStore(invId, storeId);
        } catch (error) {
            await alertService.error({ text: "Erreur lors du chargement des résultats" });
        } finally {
            loading.value = false;
        }
    };

    const handleLaunch = async (result: InventoryResult) => {
        try {
            await inventoryResultsService.launchResult(result.id);
            await alertService.success({ text: "Lancement effectué avec succès" });
        } catch (error) {
            await alertService.error({ text: "Erreur lors du lancement" });
        }
    };

    const handleValidate = async (result: InventoryResult) => {
        try {
            const confirmation = await alertService.confirm({
                title: "Confirmation de validation",
                text: "Voulez-vous vraiment valider ce résultat ?"
            });

            if (confirmation.isConfirmed) {
                await inventoryResultsService.validateResult(result.id);
                await alertService.success({ text: "Validation effectuée avec succès" });
                // Rafraîchir les résultats après validation
                if (selectedStore.value) {
                    await fetchResults(selectedStore.value);
                }
            }
        } catch (error) {
            await alertService.error({ text: "Erreur lors de la validation" });
        }
    };

    const handleBulkValidate = async () => {
        if (selectedResults.value.length === 0) {
            await alertService.warning({ text: "Veuillez sélectionner au moins un résultat à valider" });
            return;
        }

        try {
            const confirmation = await alertService.confirm({
                title: "Confirmation de validation en lot",
                text: `Voulez-vous vraiment valider ${selectedResults.value.length} résultat(s) sélectionné(s) ?`
            });

            if (confirmation.isConfirmed) {
                loading.value = true;

                // Valider tous les résultats sélectionnés
                for (const result of selectedResults.value) {
                    await inventoryResultsService.validateResult(result.id);
                }

                await alertService.success({
                    text: `${selectedResults.value.length} résultat(s) validé(s) avec succès`
                });

                // Vider la sélection et rafraîchir
                selectedResults.value = [];
                if (selectedStore.value) {
                    await fetchResults(selectedStore.value);
                }
            }
        } catch (error) {
            await alertService.error({ text: "Erreur lors de la validation en lot" });
        } finally {
            loading.value = false;
        }
    };

    // Actions individuelles (seule l'action Lancer reste)
    const actions: ResultAction[] = [
        {
            label: 'Lancer',
            icon: IconLancer,
            class: 'flex items-center gap-1 px-2 py-1 text-secondary text-xs',
            handler: handleLaunch
        }
    ];

    return {
        loading,
        stores,
        results,
        columns,
        actions,
        selectedStore,
        selectedResults,
        fetchStores,
        fetchResults,
        handleBulkValidate
    };
}